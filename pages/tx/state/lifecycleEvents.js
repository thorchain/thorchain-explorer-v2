/**
 * Generic 2-3 stage lifecycle (inbound observed -> [processed] -> outbound
 * delivered/pending), built from a THORNode tx-status response. Produces the
 * shape LifecycleTimeline.vue's `events` prop expects — the same
 * icon-component-name + iconRotate + meta-string shape the shipped swap
 * hero's own buildLifecycleRows() method already uses (icon: 'ArrowIcon',
 * iconRotate: 180, meta: '<time> · Block #<height>').
 *
 * This is the sensible default for single-inbound/single-outbound screens
 * (send, bond, refund) — it is NOT meant to cover every hero. Mimir's exact
 * three-step wording ("vote observed" / "vote recorded" / "consensus
 * reached — value applied") is intentionally type-specific narrative (a tx
 * only records the vote cast, never the key's prior value) and multi-
 * outbound/streaming screens need one entry per leg; both assemble their own
 * event arrays against this same shape instead of calling this helper.
 *
 * ctx (all optional): { meta, inboundBody, internalTitle, internalBody,
 * outboundBody }
 */
export function buildLifecycleEvents(thorStatus, ctx = {}) {
  const stages = thorStatus?.stages || {}
  const events = []

  const inboundObserved = stages.inbound_observed?.completed
  const outboundSigned = stages.outbound_signed?.completed

  events.push({
    icon: 'ArrowIcon',
    iconRotate: 180,
    title: inboundObserved ? 'Inbound received' : 'Awaiting inbound',
    body: ctx.inboundBody || 'Transaction observed by THORChain.',
    meta: ctx.meta,
  })

  if (ctx.internalBody) {
    events.push({
      icon: 'ExchangeIcon',
      title: ctx.internalTitle || 'Processed',
      body: ctx.internalBody,
    })
  }

  events.push({
    icon: outboundSigned ? 'ArrowIcon' : 'WarningIcon',
    iconRotate: 0,
    title: outboundSigned ? 'Outbound delivered' : 'Outbound pending',
    body:
      ctx.outboundBody ||
      (outboundSigned
        ? 'Funds sent to the destination address.'
        : 'Waiting for the outbound to be signed and broadcast.'),
  })

  return events
}
