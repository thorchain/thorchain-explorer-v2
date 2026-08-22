<template>
  <span :class="['mini-bubble', toneClass]">{{ chipLabel }}</span>
</template>

<script>
// Exactly the 4-word status vocabulary the tx-detail redesign standardizes
// on: a leg (or the tx as a whole) is Delivered, Scheduled, Overdue, or
// Refunded — never any other word. Maps onto the app's existing global
// .mini-bubble chip (assets/styles/bubbles.scss, already used by the
// shipped swap hero's own Status row) instead of inventing a new chip
// style, so this reads as the same component family everywhere it appears.
const LABELS = {
  delivered: 'Delivered',
  scheduled: 'Scheduled',
  overdue: 'Overdue',
  refunded: 'Refunded',
  refund: 'Refund',
}

const TONE_CLASSES = {
  delivered: '',
  scheduled: 'yellow',
  overdue: 'orange',
  refunded: 'danger',
  // Distinct from 'refunded' (danger/red — a leg that failed to deliver
  // and got reversed): a swap's own unfilled-remainder refund is an
  // expected outcome, not a failure, so it reads amber like the rest of
  // this hero's refund treatment (the callout, the "Refund" chip in the
  // mockup), not alarming red.
  refund: 'yellow',
}

export default {
  props: {
    status: {
      type: String,
      required: true,
      validator: (value) => Object.keys(LABELS).includes(value),
    },
    label: {
      type: String,
      default: null,
    },
  },
  computed: {
    chipLabel() {
      return this.label || LABELS[this.status]
    },
    toneClass() {
      return TONE_CLASSES[this.status] || null
    },
  },
}
</script>
