/**
 * Sub-swap counts for a streaming swap.
 *
 * THORNode's `count` goes up on every sub-swap attempt, including ones that
 * failed (e.g. emitted less than the price limit), so it is how far along the
 * stream is, not how many sub-swaps executed. Only /swap/streaming/{hash}
 * lists the failures (`failed_swaps`); tx/status and Midgard don't, so
 * `failed` is null when that response isn't available.
 *
 * @param {{ count?: number|string, quantity?: number|string, failedSwaps?: Array|null }} p
 */
export function resolveSubSwapCounts({ count, quantity, failedSwaps }) {
  const processed = Number(count) || 0
  const failed = Array.isArray(failedSwaps)
    ? Math.min(failedSwaps.length, processed)
    : null
  return {
    processed,
    quantity: Number(quantity) || 0,
    failed,
    executed: failed == null ? null : processed - failed,
  }
}

/**
 * Timeline text for the streaming step, e.g.
 * "822 of 1000 sub-swaps processed — 57 executed, 765 failed, one every 60 secs (10 Blocks)."
 * The interval suffix is left off for a rapid swap (interval 0), which has no
 * fixed spacing between sub-swaps.
 */
export function describeSubSwapProgress(counts, { interval, intervalDisplay } = {}) {
  let text = `${counts.processed} of ${counts.quantity} sub-swaps processed`
  if (counts.failed) {
    text += ` — ${counts.executed} executed, ${counts.failed} failed`
  }
  if (Number(interval) > 0 && intervalDisplay) {
    text += `, one every ${intervalDisplay}`
  }
  return `${text}.`
}
