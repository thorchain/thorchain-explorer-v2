<template>
  <div
    :class="[
      'arrow-container',
      { down: isDown },
      { netural: dataNumber == '0' },
    ]"
    :style="{ '--font-size': extraStyles.fontSize }"
  >
    <template v-if="dataNumber != '0' || dataNumber != 0">
      ({{ isDown ? '' : '+' }}{{ filter(dataNumber) }}<arrow-icon />)
    </template>
    <template v-else> ({{ filter(dataNumber) }}-) </template>
  </div>
</template>

<script>
import ArrowIcon from '@/assets/images/arrow.svg?inline'

export default {
  components: {
    ArrowIcon,
  },
  props: {
    isDown: {
      type: [Boolean, Number],
      required: true,
    },
    dataNumber: {
      type: [String, Number],
      required: true,
    },
    size: {
      type: String,
      default: '.7rem',
    },
    filter: {
      type: Function,
      default(value) {
        return value
      },
    },
  },
  computed: {
    extraStyles() {
      return {
        fontSize: this.size,
      }
    },
  },
}
</script>

<style lang="scss">
.arrow-container {
  display: inline-flex;
  justify-content: center;
  align-items: center;

  color: #76ff03;
  font-size: var(--font-size);

  svg {
    height: var(--font-size);
    width: var(--font-size);
    fill: #76ff03;
    margin-left: $space-0 0.1rem;
  }

  &.down {
    color: #ff1744;

    svg {
      transform: rotate(180deg);
      fill: #ff1744;
    }
  }

  &.netural {
    color: #b0bec5;

    svg {
      fill: #b0bec5;
    }
  }
}

[theme='light'] .arrow-container {
  color: #4caf50;

  svg {
    fill: #4caf50;
  }

  &.down {
    color: #ff1744;

    svg {
      transform: rotate(180deg);
      fill: #ff1744;
    }
  }

  &.netural {
    color: #616161;

    svg {
      fill: #616161;
    }
  }
}
</style>
