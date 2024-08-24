<template>
  <div>
    <div v-if="row && row.type === 'swap'" class="action-cell">
      <span v-for="(ops, i) in row.in" :key="'in-' + i" class="mini-bubble">
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'16px'"
          :chain-height="'13px'"
        />
        <span class="asset-name">{{
          (ops.coins[0].amount / 1e8) | number('0,0.0000')
        }}</span>
      </span>
      <right-arrow class="action-type" />
      <span v-for="(ops, i) in row.out" :key="'out-' + i" class="mini-bubble">
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'16px'"
          :chain-height="'13px'"
        ></asset-icon>
        <span class="asset-name">{{
          (ops.coins[0].amount / 1e8) | number('0,0.0000')
        }}</span>
      </span>
      <span
        v-if="row.out == undefined || row.out.length === 0"
        class="mini-bubble info"
        >Pending</span
      >
    </div>
    <div v-else-if="row && row.type === 'withdraw'" class="action-cell">
      <right-arrow class="action-type" />
      <span v-for="(ops, i) in row.out" :key="'out-' + i" class="mini-bubble">
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'16px'"
          :chain-height="'13px'"
        ></asset-icon>
        <span class="asset-name">{{
          (ops.coins[0].amount / 1e8) | number('0,0.0000')
        }}</span>
      </span>
    </div>
    <div v-else-if="row && row.type === 'addLiquidity'" class="action-cell">
      <span v-for="(ops, i) in row.in" :key="'in-' + i" class="mini-bubble">
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'16px'"
          :chain-height="'13px'"
        ></asset-icon>
        <span class="asset-name">{{
          (ops.coins[0].amount / 1e8) | number('0,0.0000')
        }}</span>
      </span>
      <right-arrow />
    </div>
  </div>
</template>

<script>
import RightArrow from '~/assets/images/arrow-small-right.svg?inline'

export default {
  components: { RightArrow },
  props: {
    row: {
      type: Object,
      default: () => {},
    },
  },
}
</script>

<style lang="scss" scoped>
.action-cell {
  display: flex;

  .mini-bubble {
    display: flex;
    align-items: center;
  }

  .asset-name {
    line-height: 14px;
  }

  .action-type {
    box-sizing: content-box;
    border-radius: 50%;
    height: 0.9rem;
    width: 0.9rem;
    fill: var(--sec-font-color);
    background: var(--border-color);
    padding: 4px;
    margin: 0 -3px;
    z-index: 2;
  }
}
</style>
