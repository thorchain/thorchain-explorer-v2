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
      <span class="type-name" :title="row.type"> {{ typeName(row.type) }}</span>
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
        case 'tcy_claim':
          return 'TCY Claim'
        case 'tcy_stake':
          return 'TCY Stake'
        case 'tcy_unstake':
          return 'TCY Unstake'
        default:
          return this.$options.filters?.capitalize(type) || type
      }
    },
    getTypeClass(type) {
      switch (type) {
        case 'send':
          return 'blue-type'
        case 'swap':
        case 'runePoolDeposit':
        case 'bond':
        case 'tcy_claim':
        case 'tcy_stake':
          return 'green-type'
        case 'refund':
          return 'yellow-type'
        case 'unbond':
        case 'withdraw':
        case 'runePoolWithdraw':
        case 'failed':
        case 'tcy_unstake':
          return 'red-type'
        case 'switch':
        case 'addLiquidity':
          return 'alert-type'
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
    padding: $space-5 !important;
    color: var(--sec-font-color);
    background-color: var(--bgl-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-sm;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    width: 90px;
    justify-content: center;
    cursor: pointer;

    &.blue-type {
      background-color: color-mix(in srgb, var(--highlight) 10%, transparent);
    }

    &.green-type {
      background-color: color-mix(in srgb, var(--green) 10%, transparent);
    }

    &.yellow-type {
      background-color: color-mix(in srgb, #f39c12 10%, transparent);
    }

    &.red-type {
      background-color: color-mix(in srgb, var(--red) 10%, transparent);
    }

    &.alert-type {
      background-color: color-mix(in srgb, #9b59b6 10%, transparent);
    }

    &.default-type {
      background-color: color-mix(in srgb, var(--highlight) 10%, transparent);
    }

    &.highlighted {
      border: 1px dashed;
      border-radius: $radius-xs;
      &.blue-type {
        border-color: var(--highlight);
      }

      &.green-type {
        border-color: var(--green);
      }

      &.yellow-type {
        border-color: #f39c12;
      }

      &.red-type {
        border-color: var(--red);
      }

      &.alert-type {
        border-color: #9b59b6;
      }

      &.default-type {
        border-color: var(--highlight);
      }
    }
  }

  .type-name {
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: bold;
    font-size: $font-size-xxs;
    line-height: 0.875rem;
    white-space: nowrap;
  }
}
</style>
