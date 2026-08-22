/**
 * Best-effort human explanation for a raw error/refund reason string from
 * THORChain or the underlying Cosmos SDK. Shared across every action type
 * that can surface one of these strings — a failed send, a refunded swap,
 * a generic protocol-level rejection — rather than one parser per screen,
 * since the same underlying messages show up in more than one place. Only
 * handles patterns actually seen in the wild; anything unrecognized
 * returns null so the caller falls back to showing the raw reason text
 * verbatim. Add a pattern here only when a real tx needs it — do not
 * expand this into a speculative error-code table.
 *
 * @param {string} reason
 * @param {{ formatAmount?: (raw: number) => string, heightDisplay?: string }} [ctx]
 *   Optional context a specific pattern may use (e.g. an asset-aware
 *   amount formatter, the tx's already-formatted block height). Patterns
 *   that don't need it ignore ctx entirely.
 * @returns {{ title: string, body: string } | null} null when nothing is
 *   recognized.
 */
export function parseActionReason(reason, ctx = {}) {
  const str = String(reason || '')

  // Cosmos SDK: a native send rejected during execution because the
  // sender's spendable balance had already dropped below the requested
  // amount (e.g. a prior tx spent it first).
  const insufficientMatch = str.match(
    /spendable balance (\d+)rune is smaller than (\d+)rune/i
  )
  if (insufficientMatch) {
    const fmt = ctx.formatAmount || ((raw) => `${raw / 1e8} RUNE`)
    return {
      title: 'Insufficient funds',
      body: `The sender held ${fmt(Number(insufficientMatch[1]))}${ctx.heightDisplay ? ` at block ${ctx.heightDisplay}` : ''} but the transfer requested ${fmt(Number(insufficientMatch[2]))}. The transaction was included in a block and rejected during execution — the transfer never happened, and gas was still charged.`,
    }
  }

  // THORChain: the swap's calculated output fell short of the memo's
  // minimum, so it refunded the deposit instead of executing at a worse
  // rate. Both numbers are 1e8 base units of the swap's output asset — the
  // ticker isn't recoverable from this string alone, so they're shown as
  // plain decimals rather than guessing one.
  const priceLimitMatch = str.match(
    /emit asset (\d+) less than price limit (\d+)/i
  )
  if (priceLimitMatch) {
    const dec = (raw) =>
      (Number(raw) / 1e8).toLocaleString('en-US', { maximumFractionDigits: 8 })
    return {
      title: 'Price limit not met',
      body: `THORChain calculated the swap would produce ${dec(priceLimitMatch[1])} — below the ${dec(priceLimitMatch[2])} minimum output set on this swap (a slip/price-limit safeguard) — so it refunded the deposit instead of executing at a worse rate.`,
    }
  }

  return null
}
