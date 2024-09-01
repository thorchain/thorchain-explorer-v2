<template>
  <div>
    <div v-if="row && row.type === 'swap'" class="action-cell">
      <span
        v-for="(ops, i) in row.in"
        :key="'in-' + i"
        class="mini-bubble customized"
      >
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'1rem'"
        />
        <span class="asset-name">{{
          (ops.coins[0].amount / 1e8) | number('0,0.0000')
        }}</span>
      </span>
      <right-arrow class="action-type" />
      <span
        v-for="(ops, i) in row.out.filter((o) => !o.affiliate)"
        :key="'out-' + i"
        class="mini-bubble customized"
      >
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'1rem'"
        ></asset-icon>
        <span class="asset-name">{{
          (ops.coins[0].amount / 1e8) | number('0,0.0000')
        }}</span>
      </span>
      <span
        v-if="
          row.out == undefined ||
          row.out.length === 0 ||
          row.status === 'pending'
        "
        class="mini-bubble customized info"
        >Pending</span
      >
    </div>
    <div
      v-else-if="
        row && (row.type === 'withdraw' || row.type === 'runePoolWithdraw')
      "
      class="action-cell"
    >
      <div class="mini-bubble">
        <asset-icon
          :height="'1.2rem'"
          :chain-height="'1rem'"
          :asset="row.pools[0] || row.out[0].coins[0].asset"
        />
        <vault-icon class="action-icon" />
      </div>
      <right-arrow class="action-type" />
      <span
        v-for="(ops, i) in row.out"
        :key="'out-' + i"
        class="mini-bubble customized"
      >
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'1rem'"
        ></asset-icon>
        <span class="asset-name">{{
          (ops.coins[0].amount / 1e8) | number('0,0.0000')
        }}</span>
      </span>
    </div>
    <div
      v-else-if="
        row && (row.type === 'addLiquidity' || row.type === 'runePoolDeposit')
      "
      class="action-cell"
    >
      <span
        v-for="(ops, i) in row.in"
        :key="'in-' + i"
        class="mini-bubble customized"
      >
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'1rem'"
        ></asset-icon>
        <span class="asset-name">{{
          (ops.coins[0].amount / 1e8) | number('0,0.0000')
        }}</span>
      </span>
      <right-arrow class="action-type" />
      <div class="mini-bubble">
        <asset-icon
          :height="'1.2rem'"
          :chain-height="'1rem'"
          :asset="row.pools[0] || row.in[0].coins[0].asset"
        />
        <vault-icon class="action-icon" />
      </div>
    </div>
    <div v-else-if="row && row.type === 'refund'" class="action-cell">
      <span
        v-for="(ops, i) in row.in"
        :key="'in-' + i"
        class="mini-bubble customized"
      >
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'1rem'"
        ></asset-icon>
        <span class="asset-name">{{
          (ops.coins[0].amount / 1e8) | number('0,0.0000')
        }}</span>
      </span>
      <redo-icon class="action-type" />
    </div>
    <div v-else-if="row && row.type === 'send'" class="action-cell">
      <span
        v-for="(ops, i) in row.in"
        :key="'in-' + i"
        class="mini-bubble customized"
      >
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'1rem'"
        ></asset-icon>
        <span class="asset-name">{{
          (ops.coins[0].amount / 1e8) | number('0,0.0000')
        }}</span>
      </span>
      <right-arrow class="action-type" />
      <span
        v-for="(ops, i) in row.out"
        :key="'out-' + i"
        class="mini-bubble info customized"
      >
        <small class="asset-name">{{
          addressFormatV2(ops.address, 6, true)
        }}</small>
      </span>
    </div>
    <div v-else-if="row && row.type === 'trade'" class="action-cell">
      <span
        v-for="(ops, i) in row.in"
        :key="'in-' + i"
        class="mini-bubble customized"
      >
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'1rem'"
        ></asset-icon>
        <span class="asset-name">{{
          (ops.coins[0].amount / 1e8) | number('0,0.0000')
        }}</span>
      </span>
      <right-arrow class="action-type" />
      <div class="mini-bubble">
        <vault-icon class="action-icon" />
      </div>
      <right-arrow class="action-type" />
      <span
        v-for="(ops, i) in row.out"
        :key="'out-' + i"
        class="mini-bubble customized"
      >
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'1rem'"
        ></asset-icon>
        <span class="asset-name">{{
          (ops.coins[0].amount / 1e8) | number('0,0.0000')
        }}</span>
      </span>
    </div>
  </div>
</template>

<script>
import RightArrow from '~/assets/images/arrow-right.svg?inline'
import VaultIcon from '~/assets/images/safe.svg?inline'
import RedoIcon from '~/assets/images/refresh.svg?inline'

export default {
  components: { RightArrow, VaultIcon, RedoIcon },
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
  align-items: center;

  .mini-bubble {
    display: flex;
    align-items: center;

    &.customized {
      padding: 4px 6px;
    }
  }

  .asset-name {
    font-size: 0.9rem;
    line-height: 14px;
  }

  small.asset-name {
    font-size: 0.775rem;
  }

  .action-type {
    box-sizing: content-box;
    height: 1rem;
    width: 1rem;
    fill: var(--sec-font-color);
    padding: 4px;
  }

  .action-icon {
    box-sizing: content-box;
    border-radius: 5px;
    height: 1.2rem;
    width: 1.2rem;
    padding: 4px 0;
  }
}
</style>
