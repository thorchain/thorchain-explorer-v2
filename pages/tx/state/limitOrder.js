/**
 * Live state of a limit order (`=<` / `=>` memo) from THORNode's
 * thorchain/queue/limit_swaps.
 *
 * Neither tx/status nor Midgard knows how far a resting order has got:
 * tx/status only says `swap_status.pending`, and Midgard's `limit_swap`
 * action records the order being placed — its `out` repeats the limit
 * target and its status is always `success` (see midgardSwapOutAmount).
 * The queue entry is the only source for fill progress and expiry. An order
 * leaves the queue once it fills or expires.
 */

const upper = (s) => String(s ?? '').toUpperCase()

/**
 * The queue entry for an inbound tx. One inbound can place several orders,
 * listed as `<hash>`, `<hash>-1`, `<hash>-2`…; the exact hash wins, else the
 * first sub-order.
 *
 * @param {object} queue - queue/limit_swaps response ({ limit_swaps: [...] })
 * @param {string} txid - inbound hash
 */
export function findLimitOrder(queue, txid) {
  const id = upper(txid)
  if (!id) return null
  const entries = queue?.limit_swaps ?? []
  return (
    entries.find((e) => upper(e?.swap?.tx?.id) === id) ??
    entries.find((e) => upper(e?.swap?.tx?.id).startsWith(`${id}-`)) ??
    null
  )
}

/**
 * Progress of a queued limit order.
 *
 * `state.count` counts every attempt, including ones that missed the price
 * limit, so it can exceed `quantity`; executed sub-swaps are count minus
 * `failed_swaps`. Fill is measured by value (`in / deposit`), which is what
 * the user cares about.
 *
 * `status` is 'resting' while nothing has filled, 'filling' once part has.
 *
 * @param {object} entry - one queue/limit_swaps entry
 * @returns {object|null}
 */
export function resolveLimitOrderProgress(entry) {
  const swap = entry?.swap
  const st = swap?.state
  if (!swap || !st) return null

  const attempts = Number(st.count) || 0
  const failed = Math.min((st.failed_swaps ?? []).length, attempts)
  const deposit = Number(st.deposit) || 0
  const swappedIn = Number(st.in) || 0
  const reasons = st.failed_swap_reasons ?? []

  return {
    txid: swap.tx?.id ?? null,
    status: swappedIn > 0 ? 'filling' : 'resting',
    quantity: Number(st.quantity) || 0,
    attempts,
    failed,
    executed: attempts - failed,
    deposit,
    swappedIn,
    swappedOut: Number(st.out) || 0,
    remainingIn: Math.max(deposit - swappedIn, 0),
    fillPercent: deposit ? Math.min((swappedIn / deposit) * 100, 100) : 0,
    // Minimum total output the order accepts, in the target asset.
    tradeTarget: Number(swap.trade_target) || 0,
    targetAsset: swap.target_asset ?? null,
    expiryBlocks: Number(entry.time_to_expiry_blocks) || 0,
    ageBlocks: Number(entry.blocks_since_created) || 0,
    lastFailureReason: reasons.length ? reasons[reasons.length - 1] : null,
    lastFailure: parsePriceMiss(reasons[reasons.length - 1]),
  }
}

/**
 * `emit asset X less than price limit Y` → { emit, limit } (1e8 units of the
 * target asset), else null. For a limit order this means the sub-swap was
 * skipped and will be retried, not that anything was refunded.
 */
function parsePriceMiss(reason) {
  const m = String(reason ?? '').match(
    /emit asset (\d+) less than price limit (\d+)/i
  )
  return m ? { emit: Number(m[1]), limit: Number(m[2]) } : null
}

/**
 * Output amount Midgard has recorded for the swap, or 0.
 *
 * Only `swap` actions count: a `limit_swap` action's `out` is the order's
 * limit target, recorded when the order is placed, not anything sent. A
 * resting order with no fills has only that action.
 *
 * Trade/secure outputs (`ledger`) can come as several sub-outs per swap, so
 * they are summed per txID (first group); other assets use the first
 * non-affiliate out in the target asset.
 *
 * @param {Array} actions - Midgard actions
 * @param {string|null} outAsset - target asset string
 * @param {{ ledger?: boolean }} opts
 */
export function midgardSwapOutAmount(actions, outAsset, { ledger } = {}) {
  const swap = (actions ?? []).find((a) => a.type === 'swap')
  const outs = (swap?.out ?? []).filter((o) => o.coins?.[0]?.asset === outAsset)
  if (ledger) {
    const byTx = new Map()
    for (const o of outs) {
      byTx.set(o.txID, (byTx.get(o.txID) ?? 0) + +(o.coins[0].amount ?? 0))
    }
    return parseInt(byTx.values().next().value ?? 0) || 0
  }
  const out = outs.find((o) => !o.affiliate)
  return parseInt(out?.coins?.[0]?.amount ?? 0) || 0
}
