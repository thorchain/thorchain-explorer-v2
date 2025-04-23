<template>
  <div
    class="customized"
    @mouseover="emitHovered"
    @mouseleave="emitRemoveHovered"
  >
    <div
      v-if="row"
      :class="[
        'type-class',
        getTypeClass(row.type),
        {
          highlighted: hoveredType === row.type,
        },
      ]"
    >
      <span class="type-name">
        {{ typeName(row.type) }}
      </span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    row: {
      type: Object,
      default: () => {},
    },
    hoveredType: {
      type: String,
      default: '',
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
          return this.$options.filters?.capitalize(type) || type
      }
    },
    getTypeClass(type) {
      switch (type) {
        case 'send':
          return 'send-type'
        case 'swap':
          return 'swap-type'
        case 'refund':
          return 'refund-type'
        case 'unbond':
          return 'unbond-type'
        case 'failed':
          return 'failed-type'
        case 'addLiquidity':
          return 'add-liquidity-type'
        case 'withdraw':
          return 'withdraw-type'
        case 'runePoolDeposit':
          return 'rune-deposit-type'
        case 'runePoolWithdraw':
          return 'rune-withdraw-type'
        default:
          return 'default-type'
      }
    },
    emitHovered() {
      if (this.row?.type) {
        this.$emit('setHoveredType', this.row.type)
      }
    },
    emitRemoveHovered() {
      this.$emit('removeHoveredType')
    },
  },
}
</script>

<style lang="scss" scoped>
.customized {
  display: flex;
  align-items: center;
  .type-class {
    padding: 0.375rem !important;
    color: var(--sec-font-color);
    background-color: var(--bgl-color);
    border: 1px solid var(--border-color) !important;
    border-radius: 0.375rem !important;
    transition: all 0.2s ease;

    &.highlighted {
      border: 1px dashed var(--highlight);
      border-radius: 2px;
      &.send-type {
        color: var(--highlight) !important;
        border: 1px dashed var(--highlight) !important;
      }

      &.swap-type {
        color: var(--green) !important;
        border: 1px dashed var(--green) !important;
      }

      &.refund-type,
      &.unbond-type {
        color: #f39c12 !important;
        border: 1px dashed #f39c12 !important;
      }

      &.failed-type {
        color: var(--red) !important;
        border: 1px dashed var(--red) !important;
      }

      &.add-liquidity-type {
        color: #9b59b6 !important;
        border: 1px dashed #9b59b6 !important;
      }

      &.withdraw-type,
      &.rune-withdraw-type {
        color: var(--green) !important;
        border: 1px dashed var(--green) !important;
      }

      &.rune-deposit-type {
        color: var(--highlight) !important;
        border: 1px dashed var(--highlight) !important;
      }

      &.default-type {
        color: var(--highlight) !important;
        border: 1px dashed var(--highlight) !important;
      }
    }
  }

  .type-name {
    font-size: 0.7rem;
    line-height: 0.875rem;
    font-weight: 500;
  }
}
</style>
