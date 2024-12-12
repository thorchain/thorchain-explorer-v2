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
        '--chain-asset-height': this.chainHeight ?? '0.9rem',
        '--chain-asset-width': this.chainHeight ?? '0.9rem',
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
  border-radius: 50%;
  margin-right: 0.5rem;

  .asset-icon {
    width: var(--asset-width);
    height: var(--asset-height);
    border-radius: 50%;
  }

  .chain-asset-icon {
    width: var(--chain-asset-width);
    height: var(--chain-asset-height);
    border-radius: 50%;
    position: absolute;
    right: calc(var(--chain-asset-width) * -1 / 2);
    bottom: calc(var(--chain-asset-width) * -1 / 2);
  }

  &.no-margin {
    margin: 0;
  }
}
</style>
