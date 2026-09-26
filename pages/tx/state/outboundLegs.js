/**
 * One normalized list of a transaction's outbound legs.
 *
 * THORNode's tx/details is the source of truth:
 *   - `actions[]`  every leg THORChain will send, each with an `OUT:<hash>`
 *                  or `REFUND:<hash>` memo that says what the leg is;
 *   - `out_txs[]`  the legs that were actually sent (id, gas, same memo);
 *   - `outbound_height` the height the outbounds were first scheduled for.
 * Each action is matched to its sent out_tx; anything left unsent can be
 * matched to `thorchain/queue/outbound` (by in_hash) for its own, possibly
 * rescheduled, height.
 *
 * Fallbacks, used only when the source above is missing:
 *   1. tx/status `planned_out_txs` (carries a `refund` flag) + `out_txs` —
 *      same matching, for when tx/details couldn't be served.
 *   2. Midgard `out[]` of every action — an old tx no THORNode node serves.
 *   3. Midgard refund action's `in` coin — a trade/secure-asset refund is an
 *      internal ledger credit that never appears as a THORNode outbound.
 *
 * Downstream code reads `kind` and `state` instead of re-deriving them from
 * memo strings, addresses or which Midgard action a leg was filed under.
 *
 * @typedef {object} OutboundLeg
 * @property {'output'|'refund'|'affiliate'} kind
 * @property {string} asset
 * @property {string} amount base units (the sent amount once sent)
 * @property {string|null} to
 * @property {string|null} txid null until sent; zero hash for THOR-internal
 * @property {'sent'|'queued'|'planned'} state
 * @property {number|null} height sent height (Midgard only), queued height,
 *   or the originally scheduled outbound height
 * @property {Array|null} gas
 * @property {string|null} memo
 * @property {'thornode'|'midgard'} source
 */

const ZERO_HASH =
  '0000000000000000000000000000000000000000000000000000000000000000'

const lower = (s) => String(s ?? '').toLowerCase()
const upper = (s) => String(s ?? '').toUpperCase()

// Trade (`~`) and secure (`CHAIN-SYMBOL`) assets settle inside THORChain.
function isLedgerAsset(asset) {
  const s = String(asset ?? '')
  if (s.includes('~')) return true
  const dot = s.indexOf('.')
  const dash = s.indexOf('-')
  return dash > 0 && (dot < 0 || dash < dot)
}

/**
 * Pairs each planned leg with the record in `candidates` that describes the
 * same leg (same memo, destination and asset), consuming each candidate at
 * most once. Exact amounts are paired first so that several legs with the
 * same memo/destination/asset (a split outbound) pair correctly; the rest
 * pair in order, since a sent amount can be net of gas on some chains.
 */
function pairLegs(planned, candidates, key) {
  const pool = candidates.map((c) => ({ c, used: false }))
  const result = new Array(planned.length).fill(null)
  const same = (p, c) => key(p) === key(c)
  const amountOf = (x) => String(x.coin?.amount ?? x.coins?.[0]?.amount)
  for (const exact of [true, false]) {
    planned.forEach((p, i) => {
      if (result[i]) return
      const hit = pool.find(
        (e) =>
          !e.used && same(p, e.c) && (!exact || amountOf(p) === amountOf(e.c))
      )
      if (hit) {
        hit.used = true
        result[i] = hit.c
      }
    })
  }
  return result
}

const legKey = (x) =>
  [
    upper(x.memo),
    lower(x.to_address),
    upper(x.coin?.asset ?? x.coins?.[0]?.asset),
  ].join('|')

/**
 * Output vs affiliate for an `OUT:` leg. The memo's destination is the
 * user's, so when any OUT leg goes there every other OUT leg is an
 * affiliate payout (THORNode gives affiliate payouts the same OUT: memo).
 * When none does (a THORName destination), fall back to Midgard's affiliate
 * flag and to the usual shape of a fee payout: RUNE on a non-RUNE swap.
 */
function classifyOutLegs(
  outLegs,
  { destAddresses, midgardAffiliates, targetIsRune }
) {
  const toDest = (l) => destAddresses.has(lower(l.to))
  const destMatched = outLegs.some(toDest)
  const hasNonRune = outLegs.some((l) => upper(l.asset) !== 'THOR.RUNE')
  for (const leg of outLegs) {
    if (destMatched) {
      leg.kind = toDest(leg) ? 'output' : 'affiliate'
    } else if (midgardAffiliates.has(lower(leg.to))) {
      leg.kind = 'affiliate'
    } else if (
      upper(leg.asset) === 'THOR.RUNE' &&
      !targetIsRune &&
      hasNonRune
    ) {
      leg.kind = 'affiliate'
    } else {
      leg.kind = 'output'
    }
  }
}

function legsFromThornode({ thorTx, thorStatus, queue, inHash }) {
  const detailActions = thorTx?.actions
  const planned = detailActions?.length
    ? detailActions.map((a) => ({
        ...a,
        isRefund: upper(a.memo).startsWith('REFUND:'),
      }))
    : (thorStatus?.planned_out_txs ?? []).map((p) => ({
        ...p,
        // planned_out_txs has no memo; rebuild the one THORNode will use so
        // the entry can be paired with its out_tx.
        memo: `${p.refund ? 'REFUND' : 'OUT'}:${upper(inHash)}`,
        isRefund: !!p.refund,
      }))
  if (!planned.length) return null

  const sentTxs =
    (thorTx?.actions?.length ? thorTx?.out_txs : null) ??
    thorStatus?.out_txs ??
    thorTx?.out_txs ??
    []
  const sent = pairLegs(planned, sentTxs, legKey)
  const unsentIdx = planned.map((_, i) => i).filter((i) => !sent[i])
  const queued = pairLegs(
    unsentIdx.map((i) => planned[i]),
    (queue ?? []).filter((q) => upper(q.in_hash) === upper(inHash)),
    legKey
  )
  const queuedByIdx = new Map(unsentIdx.map((i, j) => [i, queued[j]]))
  const scheduledHeight = Number(thorTx?.outbound_height) || null

  return planned.map((p, i) => {
    const out = sent[i]
    const q = queuedByIdx.get(i)
    return {
      kind: p.isRefund ? 'refund' : 'output',
      asset: p.coin?.asset,
      amount: String(out?.coins?.[0]?.amount ?? p.coin?.amount ?? 0),
      to: p.to_address ?? null,
      txid: out ? out.id || ZERO_HASH : null,
      state: out ? 'sent' : q ? 'queued' : 'planned',
      height: out ? null : Number(q?.height) || scheduledHeight,
      gas: out?.gas ?? null,
      memo: out?.memo ?? p.memo ?? null,
      source: 'thornode',
    }
  })
}

function legsFromMidgard(midgardActions, { inHash, inboundAsset }) {
  const byKey = new Map()
  for (const action of midgardActions ?? []) {
    for (const out of action.out ?? []) {
      const coin = out.coins?.[0]
      if (!coin) continue
      const hasHash = out.txID && out.txID !== ZERO_HASH
      // A trade/secure-asset swap funded by a deposit to the module address
      // files that deposit under the inbound's own hash — it is the inbound,
      // not an outbound.
      if (hasHash && upper(out.txID) === upper(inHash)) continue
      const key = hasHash
        ? `id:${upper(out.txID)}:${coin.asset}`
        : `leg:${coin.asset}:${coin.amount}:${lower(out.address)}`
      const existing = byKey.get(key)
      if (existing) {
        // Copies of one leg don't always agree on the affiliate flag.
        if (out.affiliate) existing.kind = 'affiliate'
        continue
      }
      byKey.set(key, {
        kind: out.affiliate
          ? 'affiliate'
          : coin.asset === inboundAsset
            ? 'refund'
            : 'output',
        asset: coin.asset,
        amount: String(coin.amount),
        to: out.address ?? null,
        txid: hasHash ? out.txID : ZERO_HASH,
        state: 'sent',
        height: Number(out.height) || null,
        gas: null,
        memo: null,
        source: 'midgard',
      })
    }
  }
  return Array.from(byKey.values())
}

/**
 * @param {object} p
 * @param {object} [p.thorTx] THORNode tx/details response
 * @param {object} [p.thorStatus] THORNode tx/status response
 * @param {Array} [p.midgardActions] Midgard `actions`
 * @param {Array} [p.queue] THORNode queue/outbound (optional)
 * @param {object} [p.memo] parsed inbound memo (destAddr, asset)
 * @param {string} [p.targetAsset] memo target asset as a full asset string
 * @returns {OutboundLeg[]} outputs first, then refunds, then affiliate legs
 */
export function resolveOutboundLegs({
  thorTx,
  thorStatus,
  midgardActions,
  queue,
  memo,
  targetAsset,
}) {
  const inbound = thorTx?.tx?.tx ?? thorStatus?.tx
  const midgardIn = midgardActions?.find((a) => a.in?.[0]?.coins?.[0])?.in[0]
  const inHash = inbound?.id ?? thorTx?.tx_id ?? midgardIn?.txID ?? ''
  const inboundAsset = inbound?.coins?.[0]?.asset ?? midgardIn?.coins[0].asset
  const destAddresses = new Set(
    (memo?.destAddr?.split('/') ?? []).map(lower).filter(Boolean)
  )
  const midgardAffiliates = new Set(
    (midgardActions ?? [])
      .flatMap((a) => a.out ?? [])
      .filter((o) => o.affiliate)
      .map((o) => lower(o.address))
  )

  let legs = legsFromThornode({ thorTx, thorStatus, queue, inHash })
  if (legs) {
    classifyOutLegs(
      legs.filter((l) => l.kind === 'output'),
      {
        destAddresses,
        midgardAffiliates,
        targetIsRune: upper(targetAsset) === 'THOR.RUNE',
      }
    )
    // THORNode doesn't say at which height a leg was sent; Midgard does.
    const midgardOuts = (midgardActions ?? []).flatMap((a) => a.out ?? [])
    for (const leg of legs) {
      if (leg.state !== 'sent') continue
      const internal = leg.txid === ZERO_HASH
      const match = midgardOuts.find((o) =>
        internal
          ? o.coins?.[0]?.asset === leg.asset &&
            lower(o.address) === lower(leg.to)
          : upper(o.txID) === upper(leg.txid)
      )
      leg.height = Number(match?.height) || null
    }
  } else {
    legs = legsFromMidgard(midgardActions, { inHash, inboundAsset })
  }

  const refundAction = midgardActions?.find((a) => a.type === 'refund')
  const refundIn = refundAction?.in?.[0]
  const refundCoin = refundIn?.coins?.[0]
  const hasSwap = midgardActions?.some(
    (a) => a.type === 'swap' || a.type === 'limit_swap'
  )
  if (
    refundCoin &&
    hasSwap &&
    isLedgerAsset(inboundAsset) &&
    refundCoin.asset === inboundAsset &&
    !legs.some((l) => l.kind === 'refund')
  ) {
    legs.push({
      kind: 'refund',
      asset: refundCoin.asset,
      amount: String(refundCoin.amount),
      to: refundIn.address || inbound?.from_address || null,
      txid: ZERO_HASH,
      state: 'sent',
      height: Number(refundAction.height) || null,
      gas: null,
      memo: null,
      source: 'midgard',
    })
  }

  const order = { output: 0, refund: 1, affiliate: 2 }
  return legs
    .map((l, i) => ({ l, i }))
    .sort((a, b) => order[a.l.kind] - order[b.l.kind] || a.i - b.i)
    .map(({ l }) => l)
}

/**
 * USD value of one leg, priced by what the leg is: a refund returns the
 * input asset (inPriceUSD), an output is the swap's target (outPriceUSD).
 * Anything unpriced by Midgard falls back to the pool price.
 *
 * @param {OutboundLeg} leg
 * @param {{ swapMeta?: object, poolUSD: (asset: string, amount: number) => number }} ctx
 */
export function legAmountUSD(leg, { swapMeta, poolUSD }) {
  const amount = Number(leg.amount) || 0
  const price =
    leg.kind === 'refund'
      ? +(swapMeta?.inPriceUSD ?? 0)
      : leg.kind === 'output'
        ? +(swapMeta?.outPriceUSD ?? 0)
        : 0
  if (price) return { amountUSD: (price * amount) / 1e8, usdAtExecution: true }
  return {
    amountUSD: poolUSD(leg.asset, amount) || 0,
    usdAtExecution: false,
  }
}

/** Whether THORChain has more legs to send for this tx. */
export function hasUnsentLegs(thorTx) {
  const planned = thorTx?.actions?.length ?? 0
  const sent = thorTx?.out_txs?.length ?? 0
  return planned > sent
}
