<template>
  <section class="tx-info-card">
    <span class="tx-section-title">Lifecycle Events</span>
    <div class="tx-lifecycle-list">
      <div
        v-for="(event, index) in events"
        :key="index"
        class="tx-lifecycle-item"
      >
        <div
          :class="[
            'tx-lifecycle-dot',
            event.tone ? `tx-lifecycle-dot--${event.tone}` : null,
            event.dashed ? 'tx-lifecycle-dot--dashed' : null,
          ]"
        >
          <component
            :is="event.icon"
            class="tx-lifecycle-icon"
            :style="
              event.iconRotate
                ? { transform: `rotate(${event.iconRotate}deg)` }
                : {}
            "
          />
        </div>
        <div class="tx-lifecycle-copy">
          <div
            :class="[
              'tx-lifecycle-title',
              event.tone ? `tx-lifecycle-title--${event.tone}` : null,
            ]"
          >
            {{ event.title }}
          </div>
          <div class="tx-lifecycle-body">{{ event.body }}</div>
          <div v-if="event.meta" class="tx-lifecycle-meta">
            {{ event.meta }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import ArrowIcon from '~/assets/images/arrow.svg?inline'
import ExchangeIcon from '~/assets/images/exchange.svg?inline'
import WarningIcon from '~/assets/images/warning.svg?inline'
import BlockIcon from '~/assets/images/block.svg?inline'
import CrossIcon from '~/assets/images/cross.svg?inline'
import AddIcon from '~/assets/images/add.svg?inline'

// Renders the events array produced by a hero's own lifecycle builder (e.g.
// bondOverview's inline array, or a future pages/tx/state/lifecycleEvents.js
// helper). Reuses the shipped swap hero's own .tx-lifecycle-list/-item/-dot/
// -icon/-title/-body/-meta classes and the same icon-component-by-name
// pattern (`event.icon` is a registered component name, matching
// buildLifecycleRows' 'ArrowIcon'/'ExchangeIcon' usage) rather than the
// text-glyph rail the mockup prototype used. `tone: 'danger'` is additive —
// the swap hero's own lifecycle is always a success story, so it never
// needed a failure-styled step. `tone: 'upcoming'` and `dashed` are further
// additions for StreamingSwapHero: a step that hasn't happened yet (a
// forward-looking expectation, not a concerning wait) reads dimmer than
// every other tone, and a step that's only partially true so far (e.g.
// "Output accumulating") gets a dashed border instead of every other
// step's solid one.
export default {
  components: {
    ArrowIcon,
    ExchangeIcon,
    WarningIcon,
    BlockIcon,
    CrossIcon,
    AddIcon,
  },
  props: {
    // [{ icon: 'ArrowIcon'|'ExchangeIcon'|'WarningIcon'|'BlockIcon'|
    //    'CrossIcon'|'AddIcon', iconRotate?: number,
    //    tone?: 'danger'|'warning'|'upcoming', dashed?: boolean, title,
    //    body, meta? }]
    events: {
      type: Array,
      required: true,
    },
  },
}
</script>
