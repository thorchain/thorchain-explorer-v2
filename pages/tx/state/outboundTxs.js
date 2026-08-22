import { orderBy } from 'lodash'

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
  // Midgard already tells us, per outbound, whether it's an affiliate
  // payout (`out[].affiliate`). THORNode's tx status/details have no such
  // flag, so outTxs below is otherwise built from an address/asset
  // heuristic that is wrong whenever an affiliate fee is paid in the
  // swap's destination asset, or whenever the THORNode endpoints
  // (tx/status, tx/details) fail or return incomplete data for this tx —
  // which happens often enough to matter (load-balanced/archival nodes).
  // Midgard's flag is unaffected by any of that, so it's used both to
  // exclude affiliate addresses from the THORNode-derived list AND as the
  // final fallback source of truth when THORNode gives us nothing usable.
  const midgardSwapActionForAffiliate =
    actions?.actions?.find((a) => a.type === 'swap') ??
    actions?.actions?.find((a) => a.type === 'limit_swap')
  const midgardOuts = midgardSwapActionForAffiliate?.out ?? []
  const affiliateAddresses = new Set(
    midgardOuts
      .filter((o) => o.affiliate)
      .map((o) => o.address?.toLowerCase())
      .filter(Boolean)
  )
  const nonAffiliateMidgardOuts = midgardOuts.filter((o) => !o.affiliate)
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

  // THORNode gave us nothing usable (tx/status and tx/details can both
  // fail or come back incomplete, e.g. for older/archived transactions on
  // load-balanced nodes) — fall back to Midgard's own outs directly. It
  // already excludes affiliate payouts, so this can never surface one.
  if (!outTxs || outTxs.length === 0) {
    outTxs = nonAffiliateMidgardOuts.map((o) => ({
      id: o.txID || null,
      to_address: o.address,
      coins: o.coins,
      height: o.height,
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

  // Add a partial refund that only Midgard's own action feed knows
  // about — a trade/secure-asset streaming swap whose leftover
  // unswapped input (sub-swaps that missed their price limit) is
  // refunded as an internal THORChain ledger credit, never a
  // cross-chain outbound. THORNode has no record of it at all (no
  // out_txs entry, no queued 'refund:' action), so the block above
  // can't find it — it only shows up as a separate Midgard
  // `type: 'refund'` action alongside the tx's `type: 'swap'` action.
  // Confirmed against a real trade-asset streaming swap,
  // 4DEE248E75FD4CD2ABEB46CBBB1F25C41C0C8A3BEE332A5108CEC44302F61E90 —
  // 2 of 3 sub-swaps missed their price limit, and the unswapped 2/3 of
  // the input only appears here. Read the refund action's own `in`
  // coin (the actual refunded amount+asset) rather than its `out`,
  // which duplicates the swap's own out asset/amount and can't be
  // trusted.
  //
  // Dedup by ASSET alone, not asset+amount — a genuine L1 refund
  // already present in outTxs (from THORNode's own out_txs/actions,
  // above) is authoritative but its amount is net of the outbound gas
  // fee, so it never exactly equals this refund action's `in` coin
  // (pre-fee). Matching on amount too let this block add a bogus
  // duplicate leg with the wrong (pre-fee) amount whenever a real
  // refund already existed. Confirmed against a real streaming swap
  // that delivered its output AND refunded a small unfilled remainder
  // via a real TRON outbound,
  // 402F3496F288522EB87CB3DAD837E2BD8EF8E2FC3AD5610D09EDB4142F17C072 —
  // the amount mismatch (refund action's in: 1980540701, real refund
  // out: 1626564600) let this add a third, spurious leg.
  const midgardRefundAction = actions?.actions?.find((a) => a.type === 'refund')
  const midgardRefundCoin = midgardRefundAction?.in?.[0]?.coins?.[0]
  const hasMidgardSwapAction = actions?.actions?.some(
    (a) => a.type === 'swap' || a.type === 'limit_swap'
  )
  if (
    midgardRefundCoin &&
    hasMidgardSwapAction &&
    midgardRefundCoin.asset === inboundAsset &&
    !outTxs?.some((o) => o.coins?.[0]?.asset === midgardRefundCoin.asset)
  ) {
    outTxs = [
      ...(outTxs ?? []),
      {
        id: null,
        to_address:
          midgardRefundAction.in?.[0]?.address || thorStatus?.tx?.from_address,
        coins: [midgardRefundCoin],
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
