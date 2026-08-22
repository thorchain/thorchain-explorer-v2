import { orderBy } from 'lodash'

const ZERO_HASH =
  '0000000000000000000000000000000000000000000000000000000000000000'

// Midgard's `actions[]` groups a tx's on-chain legs for DISPLAY, not by
// leg identity — the same tx can have its delivery leg, its affiliate-fee
// leg, and its refund leg all show up inside a single action's own `out[]`
// (confirmed against a real streaming swap where the `type: 'refund'`
// action's `out[]` contained all three:
// 402F3496F288522EB87CB3DAD837E2BD8EF8E2FC3AD5610D09EDB4142F17C072). So
// `actions[].type` only answers "did a refund/swap/etc. happen at all" —
// it is never a safe way to find "the" refund or "the" delivery leg by
// position (`.out[0]`) or by which action envelope a leg sits in.
//
// This flattens every action's `out[]` into one deduped pile so every leg
// can instead be judged on its own asset/affiliate-flag, independent of
// which bucket Midgard happened to file it under.
//
// Duplicates of the SAME leg across different actions don't always agree
// on `affiliate` either — confirmed against
// 402F3496F288522EB87CB3DAD837E2BD8EF8E2FC3AD5610D09EDB4142F17C072, where
// the 'swap' action's copy of the RUNE leg has `affiliate: true` but the
// 'refund' action's copy of that same leg omits the flag entirely. Picking
// "whichever copy we saw first" is order-dependent and silently loses the
// flag when the untagged copy happens to come first (Midgard lists actions
// newest-first, and the untagged 'refund' action here sorts before the
// 'swap' action that has it) — so duplicates are merged (OR'd) instead of
// the first one simply winning.
function collectMidgardLegs(actions) {
  const byKey = new Map()
  for (const action of actions?.actions ?? []) {
    for (const out of action.out ?? []) {
      const coin = out.coins?.[0]
      if (!coin) continue
      const hasRealHash = out.txID && out.txID !== ZERO_HASH && out.txID !== ''
      const key = hasRealHash
        ? `id:${out.txID}:${coin.asset}`
        : `leg:${coin.asset}:${coin.amount}:${out.address}`
      const existing = byKey.get(key)
      if (existing) {
        existing.affiliate = existing.affiliate || !!out.affiliate
        continue
      }
      byKey.set(key, {
        id: hasRealHash ? out.txID : null,
        to_address: out.address,
        coins: [coin],
        height: out.height,
        affiliate: !!out.affiliate,
      })
    }
  }
  return Array.from(byKey.values())
}

/**
 * Resolves which of a swap-family tx's outbound records (THORNode
 * out_txs/planned_out_txs, or Midgard's own out[] as a last resort) belong
 * to the user vs. an affiliate payout, plus any scheduled/queued outbound
 * or refund THORNode hasn't observed yet but Midgard or thorTx.actions
 * already knows about.
 *
 * Extracted mechanically (byte-for-byte, only `this.` -> `ctx.` and local
 * var -> destructured-arg substitutions) from createSwapState in
 * pages/tx/_txhash.vue, where it was previously inline and only reachable
 * by that one builder. swapOverview, streamingOverview, multiOutboundOverview,
 * and refundOverview all need this same derivation when migrated off the
 * legacy cards/accordion-stack intermediate format (Phase 2 of the
 * tx-detail-UI raw-data migration) — this is that shared source, called by
 * createSwapState itself (replacing its own former inline copy) as well as
 * by the migrated overview builders.
 *
 * @param {object} thorStatus - THORNode tx/status response
 * @param {object} thorTx - THORNode tx/details response
 * @param {object} actions - Midgard actions response ({ actions: [...] })
 * @param {object} memo - parsed memo (ctx.parseMemo output)
 * @param {{ parseMemoAsset: Function, assetToString: Function }} ctx
 * @returns {{ outTxs: Array, affiliateOut: Array, userAddresses: Set, affiliateAddresses: Set }}
 */
export function resolveOutboundTxs(thorStatus, thorTx, actions, memo, ctx) {
  // swap user addresses
  const userAddresses = new Set([
    thorStatus?.tx.from_address.toLowerCase(),
    // destAddr can be a dual-destination memo (PRIMARY/REFUND) — split so
    // both addresses are recognized as belonging to the user.
    // TODO: sometimes the memo destAddr will be THORName
    ...(memo.destAddr?.split('/').map((a) => a.toLowerCase()) ?? []),
  ])
  // Non affiliate outs
  const memoAssetStr = (() => {
    const parsed = ctx.parseMemoAsset(memo?.asset)
    return parsed ? ctx.assetToString(parsed) : null
  })()
  // Midgard already tells us, per outbound leg, whether it's an affiliate
  // payout (`out[].affiliate`). THORNode's tx status/details have no such
  // flag, so outTxs below is otherwise built from an address/asset
  // heuristic that is wrong whenever an affiliate fee is paid in the
  // swap's destination asset, or whenever the THORNode endpoints
  // (tx/status, tx/details) fail or return incomplete data for this tx —
  // which happens often enough to matter (load-balanced/archival nodes).
  // Midgard's flag is unaffected by any of that, so it's used both to
  // exclude affiliate addresses from the THORNode-derived list AND as the
  // fallback source of truth for any leg THORNode is missing.
  //
  // Read from every action's own out[] (collectMidgardLegs), not just
  // whichever action Midgard labeled 'swap'/'limit_swap' — a leg (e.g. the
  // affiliate fee, or a partial refund) can just as easily be filed under
  // a 'refund' action instead, and still needs to be recognized here.
  const midgardLegs = collectMidgardLegs(actions)
  const affiliateAddresses = new Set(
    midgardLegs
      .filter((l) => l.affiliate)
      .map((l) => l.to_address?.toLowerCase())
      .filter(Boolean)
  )
  const nonAffiliateMidgardLegs = midgardLegs.filter((l) => !l.affiliate)
  let outTxs = thorStatus?.out_txs?.filter(
    (tx) =>
      !affiliateAddresses.has(tx.to_address?.toLowerCase()) &&
      (userAddresses.has(tx.to_address?.toLowerCase()) ||
        (tx.coins?.[0]?.asset === memoAssetStr &&
          tx.id !==
            '0000000000000000000000000000000000000000000000000000000000000000' &&
          tx.id !== ''))
  )
  // get affiliate out if available
  // Note: affiliate payouts (esp. RUNE ones) are often internal transfers
  // with a zero-hash id, so id is not a useful filter here — go by address.
  const affiliateOut = thorStatus?.out_txs?.filter(
    (tx) =>
      affiliateAddresses.has(tx.to_address?.toLowerCase()) ||
      !userAddresses.has(tx.to_address?.toLowerCase())
  )
  // TODO: fix this in track code
  if (
    !outTxs ||
    outTxs?.length === 0 ||
    outTxs.every((o) => o.to_address === thorStatus?.tx.from_address) // Add scheduled outbound while having a refund
  ) {
    outTxs = thorStatus?.planned_out_txs
      ?.filter(
        (tx) =>
          userAddresses.has(tx.to_address.toLowerCase()) &&
          !affiliateAddresses.has(tx.to_address.toLowerCase())
      )
      .map((tx) => ({
        ...tx,
        coins: [{ amount: tx.coin.amount, asset: tx.coin.asset }],
      }))
  }

  // Add scheduled refund actions from thorTx.actions that aren't yet in out_txs
  // e.g. streaming swap where some iterations failed → partial XRP refund is queued
  const inboundAsset = thorStatus?.tx?.coins?.[0]?.asset
  const scheduledRefundActions = (thorTx?.actions ?? []).filter(
    (a) =>
      a.coin?.asset === inboundAsset &&
      a.memo?.toLowerCase().startsWith('refund:') &&
      !outTxs?.some(
        (o) =>
          o.to_address?.toLowerCase() === a.to_address?.toLowerCase() &&
          o.coins?.[0]?.asset === a.coin?.asset
      )
  )
  if (scheduledRefundActions.length > 0) {
    outTxs = [
      ...(outTxs ?? []),
      ...scheduledRefundActions.map((a) => ({
        id: null,
        to_address: a.to_address,
        coins: [{ asset: a.coin.asset, amount: a.coin.amount }],
        memo: a.memo,
        refund: true,
      })),
    ]
  }

  // Merge in any Midgard leg THORNode doesn't have — covers both "THORNode
  // gave us nothing at all" (an old/archived tx a load-balanced node can't
  // serve) and "THORNode has SOME of the picture but is missing one leg"
  // (e.g. a trade/secure-asset internal refund, which settles as a ledger
  // credit and never gets a THORNode out_tx or queued 'refund:' action at
  // all — confirmed against a real trade-asset streaming swap,
  // 4DEE248E75FD4CD2ABEB46CBBB1F25C41C0C8A3BEE332A5108CEC44302F61E90).
  //
  // Dedup by ASSET alone, not asset+amount/hash — a real THORNode leg for
  // an asset is authoritative (its amount is net of the outbound gas fee,
  // so it will never exactly match Midgard's own record of that same leg)
  // and wins outright rather than being duplicated alongside Midgard's
  // version of it. Confirmed against a real streaming swap that delivered
  // its main output AND refunded a small unfilled remainder via a real
  // TRON outbound,
  // 402F3496F288522EB87CB3DAD837E2BD8EF8E2FC3AD5610D09EDB4142F17C072 —
  // matching on amount too let a stale prior version of this merge add a
  // bogus THIRD leg once THORNode's own (fee-adjusted) refund amount
  // stopped matching Midgard's pre-fee one.
  const missingMidgardLegs = nonAffiliateMidgardLegs.filter(
    (leg) => !outTxs?.some((o) => o.coins?.[0]?.asset === leg.coins[0].asset)
  )
  if (missingMidgardLegs.length > 0) {
    outTxs = [
      ...(outTxs ?? []),
      ...missingMidgardLegs.map((leg) => ({
        id: leg.id,
        to_address: leg.to_address,
        coins: leg.coins,
        height: leg.height,
        // Classified by the leg's own asset, not by which Midgard action
        // it was filed under — a leg matching the swap's input asset is
        // always a refund (a legitimate swap output is never the same
        // asset as what went in).
        refund: leg.coins[0].asset === inboundAsset,
      })),
    ]
  }

  // A trade/secure-asset internal-ledger refund (see the block above) has
  // no outbound leg to find in ANYONE's out[] at all — collectMidgardLegs
  // can't surface it no matter how thoroughly it's flattened, because the
  // refunded amount was never emitted as an out leg in the first place
  // (confirmed against 4DEE248E75FD4CD2ABEB46CBBB1F25C41C0C8A3BEE332A5108CEC44302F61E90:
  // both its 'swap' and 'refund' actions' out[] contain only the delivered
  // TRON.USDT twice — the refunded ETH.USDC never appears in any out[]).
  // The refund action's own `in` coin is the only place this amount is
  // recorded at all, so it's read directly as a last resort, only once
  // nothing above (a real THORNode leg, or a real Midgard out[] leg) has
  // already accounted for that asset.
  const refundAction = actions?.actions?.find((a) => a.type === 'refund')
  const refundInCoin = refundAction?.in?.[0]?.coins?.[0]
  const hasMidgardSwapAction = actions?.actions?.some(
    (a) => a.type === 'swap' || a.type === 'limit_swap'
  )
  if (
    refundInCoin &&
    hasMidgardSwapAction &&
    refundInCoin.asset === inboundAsset &&
    !outTxs?.some((o) => o.coins?.[0]?.asset === refundInCoin.asset)
  ) {
    outTxs = [
      ...(outTxs ?? []),
      {
        id: null,
        to_address:
          refundAction.in?.[0]?.address || thorStatus?.tx?.from_address,
        coins: [refundInCoin],
        refund: true,
      },
    ]
  }

  // Add scheduled outbound actions from thorTx.actions not yet in out_txs.
  // Skip anything Midgard flagged as an affiliate payout, and (as a
  // fallback for when Midgard's out[] isn't available either) skip
  // THOR.RUNE actions going to a non-user address — those are affiliate payments.
  const scheduledOutActions = (thorTx?.actions ?? []).filter(
    (a) =>
      a.memo?.toLowerCase().startsWith('out:') &&
      !affiliateAddresses.has(a.to_address?.toLowerCase()) &&
      !(
        a.coin?.asset === 'THOR.RUNE' &&
        !userAddresses.has(a.to_address?.toLowerCase())
      ) &&
      !outTxs?.some(
        (o) =>
          o.to_address?.toLowerCase() === a.to_address?.toLowerCase() &&
          o.coins?.[0]?.asset === a.coin?.asset &&
          String(o.coins?.[0]?.amount) === String(a.coin?.amount)
      )
  )
  if (scheduledOutActions.length > 0) {
    outTxs = [
      ...(outTxs ?? []),
      ...scheduledOutActions.map((a) => ({
        id: null,
        to_address: a.to_address,
        coins: [{ asset: a.coin.asset, amount: a.coin.amount }],
        memo: a.memo,
      })),
    ]
  }

  // order by target swapped asset if we have refund in swap
  outTxs = orderBy(
    outTxs,
    (o) => o.coins?.[0]?.asset === thorStatus?.tx?.coins?.[0]?.asset
  )

  // Trade/secure asset swap only: when multiple outbounds have same asset
  // and amount, only show one
  const memoOutAsset = ctx.parseMemoAsset(memo?.asset, ctx.pools)
  if (memoOutAsset?.trade || memoOutAsset?.secure) {
    const outboundKey = (o) =>
      `${o.coins?.[0]?.asset ?? ''}:${o.coins?.[0]?.amount ?? ''}`
    const seenOut = new Set()
    outTxs = outTxs.filter((o) => {
      const key = outboundKey(o)
      if (seenOut.has(key)) return false
      seenOut.add(key)
      return true
    })
  }

  return { outTxs, affiliateOut, userAddresses, affiliateAddresses }
}
