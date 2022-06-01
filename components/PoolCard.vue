<template>
  <div class="pools-container">
    <template v-if="pools">
      <div class="pool-item" v-for="(pool, idx) in pools" :key="idx"  @click="gotoPool(pool.asset)">
        <div class="row">
          <div class="pool-chain">
            <img class="asset-chain" :src="assetImage(assetToChain(pool.asset))">
          </div>
          <div class="pool-status">
            <div :class="['bubble-container', {'yellow': pool.status === 'staged', 'red': pool.status === 'suspended'}]">
              {{pool.status | capitalize}}
            </div>
          </div>
          <div class="pool-price">{{pool.price*runePrice | currency}}</div>
        </div>
        <div class="row" style="align-items: center; flex-direction: column; padding: 2rem;">
          <img class="asset-icon" :src="assetImage(pool.asset)" @error="imgErr">
          <span class="asset-name">{{pool.asset.split('-')[0].split('.')[1]}}</span>
          <span class="symbol-name">{{pool.asset.split('-')[1]}}</span>
        </div>
        <div class="row" style="justify-content: space-between; margin-top: auto;">
          <div class="detail">
            <div class="header">24H Volume</div>
            <div class="value">${{(pool.volume24h/10**8)*runePrice | number('0 a')}}</div>
          </div>
          <div class="detail">
            <div class="header">Pool APY</div>
            <div class="value">{{pool.poolAPY | percent}}</div>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <LoadingCard v-for="p in 8" :key="p" extraClass="pool-item"></LoadingCard>
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  props: ['pools'],
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice'
    }),
  }
}
</script>

<style lang="scss">
.pools-container {
  display: grid;
  grid-gap: .5rem;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));

  .pool-item {
    cursor: pointer;
    display: flex;
    flex-direction: column;
    background-color: var(--bg-color);
    border: 1px solid var(--border-color);
    padding: 1rem;
    border-radius: .4rem;

    .asset-chain {
      width: 1rem;
      height: 1rem;
      margin-right: .4rem;
      border-radius: 50%;
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
      border-radius: 50%;
      margin: 1rem 0;
    }

    .asset-name {
      color: var(--sec-font-color);
      font-size: 1.5rem;
    }

    .symbol-name {
      margin-top: .3rem;
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
        font-size: .8rem;
      }

      .value {
        font-size: 1.1rem;
        color: var(--sec-font-color);
      }
    }
  }
}
</style>