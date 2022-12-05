<template>
  <div
    :class="['arrow-container', {'down': isDown}, {'netural': dataNumber == '0'}]"
    :style="{'--font-size': extraStyles.fontSize}"
  >
    <template v-if="(dataNumber !== '0')">
      ({{ isDown ? '':'+' }}{{ dataNumber }}<arrow-icon />)
    </template>
    <template v-else>
      ({{ dataNumber }} -)
    </template>
  </div>
</template>

<script>
import ArrowIcon from '@/assets/images/arrow.svg?inline'

export default {
  components: {
    ArrowIcon
  },
  props: ['isDown', 'dataNumber', 'size'],
  computed: {
    extraStyles () {
      return {
        fontSize: this.size ?? '.7rem'
      }
    }
  }
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
    margin-left: 0 .1rem;
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
</style>
