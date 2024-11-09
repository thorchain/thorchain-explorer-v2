<template>
  <div class="customized">
    <span v-if="isPending" class="pending-icon">
      <Clock :class="['mini-bubble yellow']" />
    </span>
    <div
      v-if="row"
      :class="[
        'mini-bubble',
        {
          yellow: row.type === 'refund' || row.type === 'unbond',
          info:
            row.type === 'send' ||
            row.type === 'withdraw' ||
            row.type === 'runePoolWithdraw',
          danger: row.type === 'failed',
        },
      ]"
    >
      <swap-icon v-if="row.type === 'swap'" class="status-icon" />
      <name v-else-if="row.type === 'thorname'" class="status-icon" />
      <refund-icon v-else-if="row.type === 'refund'" class="status-icon" />
      <dove-icon v-else-if="row.type === 'send'" class="status-icon" />
      <piggy-icon v-else-if="row.type === 'addLiquidity'" class="status-icon" />
      <deposit v-else-if="row.type === 'runePoolDeposit'" class="status-icon" />
      <exit v-else-if="row.type === 'runePoolWithdraw'" class="status-icon" />
      <unbond v-else-if="row.type === 'unbond'" class="status-icon" />
      <unbond
        v-else-if="row.type === 'bond'"
        class="status-icon"
        style="transform: rotate(180deg)"
      />
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
import Deposit from '~/assets/images/deposit.svg?inline'
import Exit from '~/assets/images/exit.svg?inline'
import Unbond from '~/assets/images/unbond.svg?inline'
import Name from '~/assets/images/name.svg?inline'
import Clock from '~/assets/images/clock.svg?inline'

export default {
  components: {
    SwapIcon,
    DoveIcon,
    RefundIcon,
    PiggyIcon,
    Deposit,
    Exit,
    Unbond,
    Name,
    Clock,
  },
  props: {
    row: {
      type: Object,
      default: () => {},
    },
  },
  computed: {
    isPending() {
      const isSwap = this.row.type === 'swap'
      if (isSwap && this.row.metadata.swap.txType !== 'swap') {
        return false
      }
      return this.row.status === 'pending'
    },
  },
  methods: {
    typeName(type) {
      switch (type) {
        case 'addLiquidity':
          return 'Add LP'
        case 'withdraw':
          return 'Remove LP'
        case 'runePoolDeposit':
          return 'RUNEPool Deposit'
        case 'runePoolWithdraw':
          return 'RUNEPool Withdraw'
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

.pending-icon {
  height: 24px;
  margin-right: 5px;

  .mini-bubble {
    height: 24px;
  }
}
</style>
