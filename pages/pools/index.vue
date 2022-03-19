<template>
  <div class="pool-wrapper">
    <div v-if="pools && pools.length > 0" class="pools-container">
      <div class="pool-item" v-for="(pool, idx) in pools" :key="idx"  @click="gotoPool(pool.asset)">
        <div class="row">
          <div class="pool-chain">
            <img class="asset-chain" :src="assetImage(assetToChain(pool.asset))">
          </div>
          <div class="pool-status">{{pool.status | capitalize}}</div>
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
            <div class="value">{{(pool.volume24h/10**8)*runePrice | number('0a')}}</div>
          </div>
          <div class="detail">
            <div class="header">Pool APY</div>
            <div class="value">{{pool.poolAPY | percent}}</div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="loading">
      <BounceLoader color="#9F9F9F" size="3rem"/>
    </div>
  </div>
</template>

<script>
import { assetFromString } from '@xchainjs/xchain-util';
import { AssetImage } from '~/classes/assetImage';
import { pools } from '~/_gql_queries';
import { mapGetters } from 'vuex';
import BounceLoader from 'vue-spinner/src/BounceLoader.vue';

export default {
  apollo: {
    $prefetch: false,
    pools: pools,
  },
  components: {
    BounceLoader
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice'
    })
  },
  methods: {
    assetImage(assetStr) {
      try {
        return AssetImage(assetStr) ?? require('~/assets/images/unknown.png');
      } catch (error) {
        return require('~/assets/images/unknown.png');
      }
    },
    assetToChain(assetStr) {
      const { chain } = assetFromString(assetStr);
      let asset = `${chain}.${chain}`;
      switch (chain) {
        default:
          break;
      }
      return asset;
    },
    gotoPool(pool) {
      this.$router.push({ path: `/pool/${pool}`});
    },
    imgErr(e) {
      e.target.src = require('~/assets/images/unknown.png');
    }
  }
}
</script>

<style lang="scss" scoped>
.pool-wrapper {
  display: flex;
  flex-direction: column;

  .loading {
    display: flex;
    justify-content: center;
  }
}

.pools-container {
  display: grid;
  grid-gap: .5rem;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));

  .pool-item {
    cursor: pointer;
    display: flex;
    flex-direction: column;
    background-color: #191C1E;
    border: 1px solid #263238;
    padding: 1rem;
    border-radius: .4rem;

    .asset-chain {
      width: 1rem;
      height: 1rem;
      margin-right: .4rem;
      border-radius: 50%;
    }

    .pool-status {
      color: #e6e6e6;
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
      color: #e6e6e6;
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
    }

    .detail {
      text-align: center;

      .header {
        font-size: .8rem;
      }

      .value {
        font-size: 1.1rem;
        color: #e6e6e6;
      }
    }
  }
}
</style>