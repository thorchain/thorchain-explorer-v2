<template>
  <div class="tx-detail-page">
    <div class="tx-detail-back">
      <nuxt-link :to="backTo" class="tx-back-link">
        <ArrowIcon class="tx-back-icon" />
        <slot name="back-label">All Transactions</slot>
      </nuxt-link>
    </div>

    <div class="tx-detail-meta">
      <span v-if="eyebrow">{{ eyebrow }}</span>
      <span
        v-for="chip in chips"
        :key="chip.label"
        :class="['bubble-pill', chip.tone ? `bubble-pill--${chip.tone}` : null]"
      >
        <component :is="chip.icon" v-if="chip.icon" class="bubble-pill__icon" />
        <span v-if="chip.dot" class="bubble-pill__dot" />
        {{ chip.label }}
      </span>
      <span
        v-if="statusPill"
        :class="['bubble-pill', `bubble-pill--${statusPill.tone}`]"
      >
        {{ statusPill.label }}
      </span>
    </div>

    <h1 class="tx-detail-title">
      <slot name="title">{{ title }}</slot>
    </h1>

    <div class="tx-detail-grid">
      <div class="tx-detail-main">
        <slot name="main" />
      </div>
      <div class="tx-detail-side">
        <slot name="rail" />
      </div>
    </div>
  </div>
</template>

<script>
import ArrowIcon from '~/assets/images/arrow.svg?inline'

// Shared shell for every tx-detail hero screen (mimir/send/bond/streaming/
// refund/multi-outbound). Reuses the shipped swapOverview hero's own shell
// classes (.tx-detail-page/.tx-detail-back/.tx-back-link/.tx-detail-meta/
// .tx-detail-title/.tx-detail-grid, copied into assets/styles/_tx-detail.scss)
// so every hero kind is visually identical to the already-completed swap
// page, not a parallel design. Owns only layout + eyebrow/title chrome; all
// screen-specific content is supplied via the #main and #rail slots.
export default {
  components: { ArrowIcon },
  props: {
    backTo: {
      type: String,
      default: '/txs',
    },
    // e.g. "Mimir Vote · THORChain" / "Transfer · THORChain"
    eyebrow: {
      type: String,
      default: '',
    },
    // [{ label, icon?, tone?: 'blue'|'green'|'yellow'|'red' }] — renders as
    // .bubble-pill, same as the swap hero's type/product badges.
    chips: {
      type: Array,
      default: () => [],
    },
    // { label, tone: 'green'|'yellow'|'red' } | null — renders as a
    // .bubble-pill too, matching the swap hero's status badge.
    statusPill: {
      type: Object,
      default: null,
    },
    // Plain-string fallback for the H1; use the #title slot instead when the
    // verdict line needs inline-colored spans or monospace amounts.
    title: {
      type: String,
      default: '',
    },
  },
}
</script>
