<template>
  <div :class="['arrow-container', {'down': isDown}, {'netural': dataNumber == '0'}]">
    <template v-if="(dataNumber !== '0')">
      ({{ dataNumber }}<arrow-icon />)
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
  props: ['isDown', 'dataNumber']
}
</script>

<style lang="scss">
.arrow-container {
  display: inline-flex;
  justify-content: center;
  align-items: center;

  color: #76ff03;
  font-size: .7rem;

  svg {
    height: .7rem;
    width: .7rem;
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
