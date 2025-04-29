<template>
  <div :class="['icon-asset-container', ...classes]" :style="heightStyle">
    <img
      class="asset-icon"
      :src="assetImage(asset)"
      alt="asset-icon"
      @error="imgErr"
    />
    <img
      v-if="showChainImage()"
      class="chain-asset-icon"
      :src="assetImage(chain ? chain : assetToChain(asset))"
      alt="asset-chain-icon"
    />
  </div>
</template>

<script>
import { assetToString } from '~/utils'

export default {
  props: ['asset', 'chain', 'height', 'classes', 'chainHeight'],
  computed: {
    heightStyle() {
      return {
        '--asset-height': this.height ?? '1.5rem',
        '--asset-width': this.height ?? '1.5rem',
        '--chain-asset-height': this.chainHeight ?? '0.7rem',
        '--chain-asset-width': this.chainHeight ?? '0.7rem',
      }
    },
  },
  methods: {
    showChainImage() {
      if (this.chain === false) {
        return false
      }

      let asset = this.asset
      if (typeof asset === 'object') {
        asset = assetToString(asset)
      }

      if (this.chain) {
        return true
      } else if (this.assetToChain(this.asset) !== asset) {
        return true
      }
      return false
    },
  },
}
</script>

<style lang="scss">
.icon-asset-container {
  position: relative;
  width: var(--asset-width);
  height: var(--asset-height);
  border-radius: $radius-full;
  margin-right: $space-8;

  .asset-icon {
    width: var(--asset-width);
    height: var(--asset-height);
    border-radius: $radius-full;
  }

  .chain-asset-icon {
    border: 1px solid var(--border-color);
    width: var(--chain-asset-width);
    height: var(--chain-asset-height);
    border-radius: $radius-full;
    position: absolute;
    right: calc(var(--chain-asset-width) * -1 / 3);
    bottom: calc(var(--chain-asset-width) * -1 / 3);
  }

  &.no-margin {
    margin: $space-0;
  }
}
</style>
