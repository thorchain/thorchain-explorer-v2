<template>
  <div :class="['icon-asset-container', ...classes]" :style="heightStyle">
    <div v-if="isTokenFactory" class="asset-group">
      <div class="left-icon">
        <img
          class="asset-icon"
          :src="assetImage(tokens[0])"
          alt="asset-icon"
          @error="imgErr"
        />
      </div>
      <div class="right-icon">
        <img
          class="asset-icon"
          :src="assetImage(tokens[1])"
          alt="asset-icon"
          @error="imgErr"
        />
      </div>
    </div>
    <template v-else>
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
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { assetFromString, assetToString } from '~/utils'

export default {
  props: ['asset', 'chain', 'height', 'classes', 'chainHeight'],
  computed: {
    ...mapGetters({
      pools: 'getPools',
    }),
    heightStyle() {
      return {
        '--asset-height': this.height ?? '1.5rem',
        '--asset-width': this.height ?? '1.5rem',
        '--chain-asset-height': this.chainHeight ?? '0.7rem',
        '--chain-asset-width': this.chainHeight ?? '0.7rem',
      }
    },
    isTokenFactory() {
      return this.asset && typeof this.asset === 'object' && this.asset.id
    },
    tokens() {
      let asset = this.asset
      if (typeof asset === 'string') {
        asset = assetFromString(asset)
      }

      if (asset.id) {
        const [x, y] = asset.symbol.toUpperCase().split('/')
        return [this.findAssetInPools(x), this.findAssetInPools(y)]
      }

      return [asset]
    },
  },
  methods: {
    findAssetInPools(assetSymbol) {
      const pool = this.pools?.find((p) => {
        const poolAsset = assetFromString(p.asset)
        if (poolAsset.symbol === assetSymbol) {
          return true
        }
        return false
      })

      return pool ? pool.asset : assetSymbol
    },
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

.asset-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;

  .left-icon,
  .right-icon {
    width: calc(var(--asset-width) / 2);
    display: flex;
    overflow: hidden;
  }

  .right-icon {
    justify-content: flex-end;
  }

  .asset-icon {
    margin: 0;
  }
}
</style>
