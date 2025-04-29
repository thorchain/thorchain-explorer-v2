<template>
  <div class="pools-container">
    <template v-if="pools">
      <div
        v-for="(pool, idx) in pools"
        :key="idx"
        class="pool-item"
        @click="gotoPool(pool.asset)"
      >
        <div class="row">
          <div class="pool-chain">
            <img
              class="asset-chain"
              :src="assetImage(assetToChain(pool.asset))"
            />
          </div>
          <div class="pool-status">
            <div
              :class="[
                'bubble-container',
                {
                  yellow: pool.status === 'staged',
                  red: pool.status === 'suspended',
                },
              ]"
            >
              {{ pool.status | capitalize }}
            </div>
          </div>
          <div class="pool-price">
            {{ (pool.price * runePrice) | currency }}
          </div>
        </div>
        <div
          class="row"
          style="align-items: center; flex-direction: column; padding: 2rem"
        >
          <img
            class="asset-icon"
            :src="assetImage(pool.asset)"
            @error="imgErr"
          />
          <span class="asset-name">{{
            pool.asset.split('-')[0].split('.')[1]
          }}</span>
          <span class="symbol-name">{{ pool.asset.split('-')[1] }}</span>
        </div>
        <div
          class="row"
          style="justify-content: space-between; margin-top: auto"
        >
          <div class="detail">
            <div class="header">24H Volume</div>
            <div class="value">
              ${{ ((pool.volume24h / 10 ** 8) * runePrice) | number('0 a') }}
            </div>
          </div>
          <div class="detail">
            <div class="header">Pool APY</div>
            <div class="value">
              {{ pool.poolAPY | percent }}
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <LoadingCard v-for="p in 8" :key="p" extra-class="pool-item" />
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  props: ['pools'],
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
  },
}
</script>

<style lang="scss">
.pools-container {
  display: grid;
  grid-gap: 0.5rem;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));

  .pool-item {
    cursor: pointer;
    display: flex;
    flex-direction: column;
    background-color: var(--bg-color);
    border: 1px solid var(--border-color);
    padding: $space-16;
    border-radius: $radius-md;

    .asset-chain {
      width: 1rem;
      height: 1rem;
      margin-right: $space-5;
      border-radius: $radius-full;
    }

    .pool-status {
      color: var(--sec-font-color);
    }

    .pool-price {
      margin-left: auto;
    }

    .asset-icon {
      width: 2rem;
      height: 2rem;
      border-radius: $radius-full;
      margin: $space-16 $space-0;
    }

    .asset-name {
      color: var(--sec-font-color);
      font-size: $font-size-xl;
    }

    .symbol-name {
      margin-top: $space-5;
      text-align: center;
      word-break: break-all;
    }

    .row {
      display: flex;
      width: 100%;

      .pool-chain {
        display: flex;
        align-items: center;
      }
    }

    .detail {
      text-align: center;

      .header {
        font-size: $font-size-s;
      }

      .value {
        font-size: $font-size-md;
        color: var(--sec-font-color);
      }
    }
  }
}
</style>
