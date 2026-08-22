<template>
  <section class="tx-info-card">
    <button class="tx-tech-header" type="button" @click="expanded = !expanded">
      <span class="tx-section-title">Technical Details</span>
      <span class="tx-tech-arrow">{{ expanded ? '−' : '+' }}</span>
    </button>
    <div v-if="preview && !expanded" class="tx-tech-preview">
      {{ preview }}
    </div>
    <div v-if="expanded" class="tx-tech-list">
      <div v-for="row in rows" :key="row.label" class="tx-tech-row">
        <div class="tx-tech-key">{{ row.label }}</div>
        <div
          v-tooltip="row.label === 'Memo' ? memoTooltip(memo) : undefined"
          :class="[
            'tx-tech-value',
            { 'tx-tech-value--truncate': row.label === 'Memo' },
            { 'tx-tech-value--copyable': row.label === 'Memo' && memo },
          ]"
          @click="row.label === 'Memo' ? copyMemo(memo) : null"
        >
          {{ row.value }}
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import copyMemo from '~/mixins.js/copyMemo'

// Collapsed-by-default memo/raw-fields reveal. Matches the shipped swap
// hero's own Technical Details card exactly: .tx-tech-header/.tx-tech-arrow/
// .tx-tech-list/.tx-tech-row, and collapsed shows ONLY the header by
// default (no memo preview line) — the shipped version doesn't have one.
// The optional `preview` prop is additive, for cases worth surfacing before
// expanding (e.g. a failed send's "Raw log · ..." summary) — most callers
// leave it unset and get the plain collapsed header. Deliberately a plain
// expanded:false toggle rather than components/Accordion.vue, which bakes
// in countdown-ring/pending/error semantics this card has no use for.
export default {
  mixins: [copyMemo],
  props: {
    memo: {
      type: String,
      default: '',
    },
    // [{ label, value }] — additional raw fields shown alongside Memo.
    rawFields: {
      type: Array,
      default: () => [],
    },
    // One-line summary shown under the header even while collapsed.
    preview: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      expanded: false,
    }
  },
  computed: {
    rows() {
      const memoRow = { label: 'Memo', value: this.memo || 'No memo' }
      return [memoRow, ...this.rawFields]
    },
  },
}
</script>
