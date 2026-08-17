<template>
  <div class="tx-delivery">
    <div class="tx-delivery-caption">
      <span class="tx-asset-label">Delivered</span>
      <span class="mono">
        {{ deliveredDisplay }} of {{ totalDisplay }} ·
        {{ (percent * 100).toFixed(1) }}%
      </span>
    </div>
    <div class="tx-delivery-bar">
      <div
        class="tx-delivery-bar__fill"
        :style="{ width: `${Math.min(percent, 1) * 100}%` }"
      />
      <div
        v-if="percent < 1"
        :class="[
          'tx-delivery-bar__pending',
          overdue ? 'tx-delivery-bar__pending--overdue' : null,
        ]"
        :style="{ width: `${(1 - Math.min(percent, 1)) * 100}%` }"
      />
    </div>
  </div>
</template>

<script>
// Two-segment delivery progress for a multi-leg outbound — solid green for
// what's landed, a hatched fill for what hasn't (amber if nothing's overdue
// yet, red-hatched once at least one leg is). No swap-hero equivalent (a
// swap only ever has one outbound, so it has no concept of partial
// delivery) — genuinely new. Percent is of the original withdrawn amount,
// not just of what's been scheduled to go out (matches the mockup: 11.4%
// = delivered / withdrawn, not delivered / sum-of-outbound-legs) — see
// resolveTxOutboundTotals.
export default {
  props: {
    percent: {
      type: Number,
      required: true,
    },
    deliveredDisplay: {
      type: String,
      required: true,
    },
    totalDisplay: {
      type: String,
      required: true,
    },
    overdue: {
      type: Boolean,
      default: false,
    },
  },
}
</script>
