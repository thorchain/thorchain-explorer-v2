/**
 * Best-effort human explanation for a failed native-send's raw Cosmos SDK
 * error string. Only handles the patterns actually seen in the wild —
 * anything unrecognized falls back to the raw code + reason text verbatim,
 * per the "parse it for human if possible, otherwise just show the code and
 * whole reason" instruction. Do not expand this into a general Cosmos SDK
 * error-code table; add a pattern here only when a real tx needs it.
 *
 * @param {string} reason - e.g. "failed to execute message; message index:
 *   0: spendable balance 1810685165rune is smaller than 1812679165rune:
 *   insufficient funds"
 * @param {string|number} code
 * @param {{ formatAmount: (raw: number) => string, heightDisplay: string }} ctx
 *   formatAmount receives base units (e.g. 1810685165) and returns a
 *   display string (e.g. "18.11 RUNE"); heightDisplay is the tx's own
 *   already-formatted block height (e.g. "#27,436,701").
 * @returns {{ title: string, body: string, codeLine: string, code: string|number }}
 */
export function parseSendFailure(reason, code, ctx) {
  const insufficientMatch = String(reason || '').match(
    /spendable balance (\d+)rune is smaller than (\d+)rune/i
  )

  if (insufficientMatch) {
    const heldRaw = Number(insufficientMatch[1])
    const requestedRaw = Number(insufficientMatch[2])
    const held = heldRaw / 1e8
    const requested = requestedRaw / 1e8
    const fmt = (n) => {
      const s = n.toFixed(2)
      return s.endsWith('.00') ? s.slice(0, -3) : s
    }
    return {
      title: 'Insufficient funds',
      code,
      body: `The sender held ${ctx.formatAmount(heldRaw)} at block ${ctx.heightDisplay} but the transfer requested ${ctx.formatAmount(requestedRaw)}. The transaction was included in a block and rejected during execution — the transfer never happened, and the gas below was still charged.`,
      codeLine: `code ${code} · insufficient funds: ${fmt(held)} rune < ${fmt(requested)} rune`,
    }
  }

  return {
    title: 'Transaction failed',
    code,
    body: 'The transaction was included in a block and rejected during execution — the transfer never happened, and the gas below was still charged.',
    codeLine: `code ${code}${reason ? ` · ${reason}` : ''}`,
  }
}
