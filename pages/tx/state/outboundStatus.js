/**
 * Shared outbound-leg status derivation.
 *
 * Consolidates the outbound_delay / outbound_signed / scheduled-ETA
 * derivation that was previously hand-rolled near-identically inside
 * createTradeWithdrawState, createAddLiquidityState,
 * createRemoveLiquidityState and createSwapState in _txhash.vue.
 *
 * ctx: { getScheduledOutboundETA(thorStatus) => number|undefined,
 *        blockSeconds(chain) => number }
 */

/**
 * Tx-level outbound signal: how far along THORChain's outbound_delay /
 * outbound_signed stages are for this transaction's outbound. `signed` is
 * intentionally left as the raw `completed` value (may be undefined when the
 * stage itself is absent) — callers that need a boolean default apply their
 * own `?? false`, matching each call site's pre-refactor behavior.
 */
export function resolveOutboundSignal(thorStatus, ctx) {
  const outboundDelay = thorStatus?.stages?.outbound_delay
  const delayRemaining =
    (outboundDelay?.remaining_delay_seconds ?? 0) ||
    (outboundDelay?.remaining_delay_blocks ?? 0) * ctx.blockSeconds('THOR')

  return {
    signed: thorStatus?.stages?.outbound_signed?.completed,
    eta: ctx.getScheduledOutboundETA(thorStatus),
    delayRemaining: delayRemaining || 0,
    delayBlocksRemaining: outboundDelay?.remaining_delay_blocks || 0,
  }
}

/**
 * Per-leg refinement of a tx-level signal: once a specific outbound leg has
 * its own matched completed tx, it's definitionally signed and has no ETA
 * (it already landed) regardless of what the tx-level signal says about
 * other still-pending legs. Mirrors createTradeWithdrawState's
 * `completed ? true : outboundSigned` / `completed ? null : outboundETA`
 * pattern.
 */
export function resolveOutboundLegState(completedTx, signal) {
  return {
    signed: completedTx ? true : signal.signed,
    eta: completedTx ? null : signal.eta,
  }
}

/**
 * Derive-never-store totals across a transaction's outbound legs, per the
 * tx-detail redesign's state-management rule. `legs` must already carry a
 * `status` field ('delivered' | 'scheduled' | 'overdue' | 'refunded') and a
 * numeric `amount` (base units). `inputAmount`, when provided via ctx, lets
 * callers surface a withheld-fee figure (inbound − sum(outbounds)).
 *
 * Not yet wired into any UI — lands in Phase 0 so the outbound-status module
 * is complete, actually consumed starting with the multi-outbound/streaming
 * heroes in Phase 5.
 */
export function resolveTxOutboundTotals(legs, ctx = {}) {
  const toNum = (v) => parseInt(v ?? 0, 10) || 0
  const total = legs.reduce((sum, leg) => sum + toNum(leg.amount), 0)
  const delivered = legs
    .filter((leg) => leg.status === 'delivered')
    .reduce((sum, leg) => sum + toNum(leg.amount), 0)
  const outstanding = Math.max(total - delivered, 0)
  const percent = total > 0 ? delivered / total : 0
  const feesWithheld =
    ctx.inputAmount != null ? toNum(ctx.inputAmount) - total : undefined

  return {
    delivered,
    outstanding,
    percent,
    feesWithheld,
    allDelivered:
      legs.length > 0 && legs.every((leg) => leg.status === 'delivered'),
  }
}
