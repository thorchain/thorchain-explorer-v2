<template>
  <div class="customized">
    <div
      v-if="row"
      :class="[
        'mini-bubble',
        {
          yellow: row.type === 'refund',
          info: row.type === 'send' || row.type === 'withdraw',
        },
      ]"
    >
      <swap-icon v-if="row.type === 'swap'" class="status-icon" />
      <refund-icon v-else-if="row.type === 'refund'" class="status-icon" />
      <dove-icon v-else-if="row.type === 'send'" class="status-icon" />
      <piggy-icon v-else-if="row.type === 'addLiquidity'" class="status-icon" />
      <span class="type-name">
        {{ typeName(row.type) }}
      </span>
    </div>
  </div>
</template>

<script>
import SwapIcon from '~/assets/images/transform.svg?inline'
import DoveIcon from '~/assets/images/dove.svg?inline'
import RefundIcon from '~/assets/images/refund.svg?inline'
import PiggyIcon from '~/assets/images/piggy.svg?inline'

export default {
  components: { SwapIcon, DoveIcon, RefundIcon, PiggyIcon },
  props: {
    row: {
      type: Object,
      default: () => {},
    },
  },
  methods: {
    typeName(type) {
      switch (type) {
        case 'addLiquidity':
          return 'Add LP'
        case 'withdraw':
          return 'Remove LP'
        default:
          return this.$options.filters.capitalize(type)
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.customized {
  display: flex;

  .mini-bubble {
    padding: 4px 6px;
  }
  .type-name {
    font-size: 0.9rem;
    line-height: 0.875rem;
  }
}

.status-icon {
  height: 1.1rem;
  width: 1.1rem;
  fill: inherit;
  margin-right: 0.5rem;
}
</style>
