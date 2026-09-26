import { resolveOutboundLegs } from './outboundLegs.js'

/**
 * Adapter from resolveOutboundLegs (see outboundLegs.js) to the THORNode
 * out_tx shape the tx page builders read: `{ id, to_address, coins, height,
 * gas, memo, refund }`, plus the leg's own `kind`, `state` and
 * `scheduledHeight`.
 *
 * `id` is null until the leg is sent (zero hash for a THOR-internal leg),
 * `height` is the height it was sent at, and `scheduledHeight` the height
 * an unsent leg is queued or scheduled for.
 *
 * @param {object} thorStatus - THORNode tx/status response
 * @param {object} thorTx - THORNode tx/details response
 * @param {object} actions - Midgard actions response ({ actions: [...] })
 * @param {object} memo - parsed memo (ctx.parseMemo output)
 * @param {{ parseMemoAsset: Function, assetToString: Function, pools?: Array, queue?: Array }} ctx
 * @returns {{ outTxs: Array, affiliateOut: Array, legs: Array }}
 */
export function resolveOutboundTxs(thorStatus, thorTx, actions, memo, ctx) {
  const target = ctx.parseMemoAsset(memo?.asset, ctx.pools)
  const legs = resolveOutboundLegs({
    thorTx,
    thorStatus,
    midgardActions: actions?.actions,
    queue: ctx.queue,
    memo,
    targetAsset: target ? ctx.assetToString(target) : null,
  })

  const toOutTx = (leg) => ({
    id: leg.txid,
    to_address: leg.to,
    coins: [{ asset: leg.asset, amount: leg.amount }],
    height: leg.state === 'sent' ? leg.height : null,
    scheduledHeight: leg.state === 'sent' ? null : leg.height,
    gas: leg.gas,
    memo: leg.memo,
    refund: leg.kind === 'refund',
    kind: leg.kind,
    state: leg.state,
  })

  return {
    outTxs: legs.filter((l) => l.kind !== 'affiliate').map(toOutTx),
    affiliateOut: legs.filter((l) => l.kind === 'affiliate').map(toOutTx),
    legs,
  }
}
