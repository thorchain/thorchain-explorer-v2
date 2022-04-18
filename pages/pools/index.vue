<template>
  <div class="pool-wrapper">
    <div class="nav-headers">
      <div class="nav-item" @click="mode = 'grid'" :class="{'active': mode == 'grid'}">Grid</div>
      <div class="nav-item" @click="mode = 'table'" :class="{'active': mode == 'table'}">Table</div>
    </div>
    <div v-if="pools && pools.length > 0 && mode == 'grid'" class="pools-container">
      <div class="pool-item" v-for="(pool, idx) in sortedPools" :key="idx"  @click="gotoPool(pool.asset)">
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
            <div class="value">{{(pool.volume24h/10**8)*runePrice | number('0a')}}</div>
          </div>
          <div class="detail">
            <div class="header">Pool APY</div>
            <div class="value">{{pool.poolAPY | percent}}</div>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="pools && pools.length > 0 && mode == 'table'">
      <h2 style="margin-left: .5rem">Active Pools</h2>
      <div class="base-container" style="margin-bottom: 1.5rem;">
        <vue-good-table
          v-if="cols && activeRows.length > 0"
          :columns="cols"
          :rows="activeRows"
          styleClass="vgt-table net-table vgt-compact"
          :pagination-options="{
            enabled: true,
            perPage: 30,
            perPageDropdownEnabled: false,
          }"
          @on-row-click="gotoPoolTable"
        >
          <template slot="table-row" slot-scope="props">
            <span v-if="props.column.field == 'status'">
              <div :class="['bubble-container']">
                <span>{{props.row.status | capitalize}}</span>
              </div>
            </span>
            <span v-else>
              {{props.formattedRow[props.column.field]}}
            </span>
          </template>
        </vue-good-table>
      </div>
      <h2 style="margin-left: .5rem">Staged/Suspended Pools</h2>
      <div class="base-container">
        <vue-good-table
          v-if="cols && standbyRows.length > 0"
          :columns="cols"
          :rows="standbyRows"
          styleClass="vgt-table net-table vgt-compact"
          :pagination-options="{
            enabled: true,
            perPage: 30,
            perPageDropdownEnabled: false,
          }"
          @on-row-click="gotoPoolTable"
        >
          <template slot="table-row" slot-scope="props">
            <span v-if="props.column.field == 'status'">
              <div :class="['bubble-container yellow', {'red': props.row.status === 'suspended'}]">
                <span>{{props.row.status | capitalize}}</span>
              </div>
            </span>
            <span v-else>
              {{props.formattedRow[props.column.field]}}
            </span>
          </template>
        </vue-good-table>
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
  data: function () {
    return {
      mode: 'grid',
      cols: [
        {
          label: 'Asset',
          field: 'asset',
          formatFn: this.formatAsset
        },
        {
          label: 'Status',
          field: 'status'
        },
        {
          label: 'USD Price',
          field: 'price',
          type: 'number',
          formatFn: this.curFormat,
          tdClass: 'mono'
        },
        {
          label: 'Volume',
          field: 'volume',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono'
        },
        {
          label: 'Depth',
          field: 'depth',
          type: 'number',
          formatFn: this.curFormat,
          tdClass: 'mono'
        },
        {
          label: 'APY',
          field: 'apy',
          type: 'percentage',
          tdClass: 'mono'
        }
      ],
      activeRows: [],
      standbyRows: []
    }
  },
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
    }),
    sortedPools() {
      return this.pools.sort((a,b) => {
        return b.depth.poolDepth - a.depth.poolDepth
      })
    }
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
    },
    numberFormat(number, filter) {
      return this.$options.filters.number(number, '0a')
    },
    curFormat(number) {
      return this.$options.filters.currency(number)
    },
    formatAsset(asset) {
      return asset.length > 10 ? 
        asset.slice(0, 14) + '...':
        asset
    },
    addRow(pool) {
      return {
        asset: pool.asset,
        status: pool.status,
        price: pool.price*this.runePrice,
        volume: (pool.volume24h/10**8)*this.runePrice,
        depth: Number.parseInt((pool.depth?.poolDepth/10**8)*this.runePrice),
        apy: pool.poolAPY,
      }
    },
    gotoPoolTable(params) {
      this.gotoPool(params.row.asset)
    }
  },
  watch: {
    pools: function() {
      this.activeRows = [];
      this.standbyRows = [];
      if (!this.pools && this.pools.length <= 0)
        return
      for(let i in this.pools) {
        if (this.pools[i].status === "available") {
          this.activeRows.push(this.addRow(this.pools[i]))
        }
        else {
          this.standbyRows.push(this.addRow(this.pools[i]))
        }
      }
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
        color: #e6e6e6;
      }
    }
  }
}
</style>