<template>
  <div :class="['icon-asset-container', ...classes]" :style="heightStyle">
    <img class="asset-icon" :src="assetImage(asset)" alt="asset-icon" @error="imgErr">
    <img v-if="showChainImage()" class="chain-asset-icon" :src="assetImage(chain? chain:assetToChain(asset))" alt="asset-chain-icon">
  </div>
</template>

<script>
export default {
  props: [
    'asset',
    'chain',
    'height',
    'classes'
  ],
  computed: {
    heightStyle () {
      return {
        '--asset-height': this.height ?? '1.5rem',
        '--asset-width': this.height ?? '1.5rem'
      }
    }
  },
  methods: {
    showChainImage () {
      if (this.chain) {
        return true
      } else if (this.assetToChain(this.asset) !== this.asset) {
        return true
      }
      return false
    }
  }
}
</script>

<style lang="scss">
.icon-asset-container {
  position: relative;
  width: var(--asset-width);
  height: var(--asset-height);
  border-radius: 50%;
  margin-right: 0.5rem;

  .asset-icon {
    width: var(--asset-width);
    height: var(--asset-height);
    border-radius: 50%;
  }

  .chain-asset-icon {
    width: 0.9rem;
    height: 0.9rem;
    border-radius: 50%;
    position: absolute;
    right: -0.4rem;
    bottom: -0.4rem;
  }

  &.no-margin {
    margin: 0;
  }
}
</style>
