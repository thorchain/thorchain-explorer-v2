<template>
  <div v-if="row" :class="['mini-bubble', { yellow: row.type === 'refund' }]">
    <swap-icon v-if="row.type === 'swap'" class="status-icon" />
    <dove-icon v-else-if="row.type === 'refund'" class="status-icon" />

    <span>
      {{ row.type | capitalize }}
    </span>
  </div>
</template>

<script>
import SwapIcon from '~/assets/images/transform.svg?inline'
import DoveIcon from '~/assets/images/dove.svg?inline'

export default {
  components: { SwapIcon, DoveIcon },
  props: {
    row: {
      type: Object,
      default: () => {},
    },
  },
}
</script>

<style lang="scss" scoped>
.status-icon {
  height: 12px;
  width: 12px;
  fill: inherit;
  margin-right: 0.5rem;
}
</style>
