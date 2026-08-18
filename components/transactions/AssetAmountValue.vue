<template>
  <span v-tooltip="tooltip">{{ prefix }}{{ short }}</span>
</template>

<script>
// A .tx-asset-values amount line, shown rounded to 2dp for scannability —
// full base-unit precision (baseAmountFormatOrZero's usual 8dp) is still
// one hover/tap away via v-tooltip (floating-vue, already used elsewhere on
// this page e.g. the swap hero's own USD value) rather than lost, since a
// swap/withdrawal amount can carry meaningful detail past 2 decimals.
// showTicker (not showAsset) throughout — the panel's own network badge
// already states the chain, so repeating it here would be redundant (see
// precise()/formatAssetAmount in _txhash.vue, which this mirrors exactly
// except for the fixed 2dp rounding).
export default {
  props: {
    // Raw base-unit amount (i.e. 1e8-scaled), matching baseAmountFormatOrZero's
    // own input convention.
    amount: {
      type: [Number, String],
      default: null,
    },
    asset: {
      type: String,
      default: null,
    },
    // Rendered before the amount, inside the same hover target (e.g. "-",
    // "+", "~") — kept as a prop rather than a sibling text node so the
    // sign is part of what the tooltip's hover target covers.
    prefix: {
      type: String,
      default: '',
    },
  },
  computed: {
    numeric() {
      const n = Number(this.amount)
      return Number.isFinite(n) ? n / 1e8 : null
    },
    short() {
      if (this.numeric == null || !this.asset) return '-'
      const displayAmount = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(this.numeric)
      return `${displayAmount} ${this.showTicker(this.asset)}`
    },
    full() {
      if (this.numeric == null || !this.asset) return this.short
      return `${this.baseAmountFormatOrZero(this.amount)} ${this.showTicker(this.asset)}`
    },
    // Only offer a tooltip when rounding actually hid something — a round
    // number's hover target shouldn't pop up a tooltip that just repeats
    // what's already on screen.
    tooltip() {
      return this.full !== this.short ? this.full : null
    },
  },
}
</script>
