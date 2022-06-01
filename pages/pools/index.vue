<template>
  <Page>
    <Nav :activeMode.sync="mode" :navItems="navItems" />
    <template v-if="mode == 'grid'">
      <pool-card :pools="sortedPools"></pool-card>
    </template>
    <template v-else-if="pools && pools.length > 0 && mode == 'table'">
      <Nav :activeMode.sync="tableMode" :navItems="tableModeItems" />
      <Card v-show="tableMode == 'active'">
        <vue-good-table
          v-if="cols && activeRows.length > 0"
          :columns="cols"
          :rows="activeRows"
          styleClass="vgt-table net-table"
          :pagination-options="{
            enabled: true,
            perPage: 30,
            perPageDropdownEnabled: false,
          }"
          @on-row-click="gotoPoolTable"
        >
          <template slot="table-row" slot-scope="props">
            <div v-if="props.column.field == 'asset'" class="cell-content" v-tooltip="props.row.asset">
              <img class="table-asset-icon" :src="assetImage(props.row.asset)" alt="asset-icon">
              <span>{{props.formattedRow[props.column.field]}}</span>
            </div>
            <span v-else-if="props.column.field == 'status'">
              <div :class="['bubble-container']">
                <span>{{props.row.status | capitalize}}</span>
              </div>
            </span>
            <span v-else>
              {{props.formattedRow[props.column.field]}}
            </span>
          </template>
        </vue-good-table>
      </Card>
      <Card v-show="tableMode == 'staged'">
        <vue-good-table
          v-if="cols && standbyRows.length > 0"
          :columns="cols"
          :rows="standbyRows"
          styleClass="vgt-table net-table"
          :pagination-options="{
            enabled: true,
            perPage: 30,
            perPageDropdownEnabled: false,
          }"
          @on-row-click="gotoPoolTable"
        >
          <template slot="table-row" slot-scope="props">
            <div v-if="props.column.field == 'asset'" class="cell-content" v-tooltip="props.row.asset">
              <img class="table-asset-icon" :src="assetImage(props.row.asset)" alt="asset-icon">
              <span>{{props.formattedRow[props.column.field]}}</span>
            </div>
            <span v-else-if="props.column.field == 'status'">
              <div :class="['bubble-container yellow', {'red': props.row.status === 'suspended'}]">
                <span>{{props.row.status | capitalize}}</span>
              </div>
            </span>
            <span v-else>
              {{props.formattedRow[props.column.field]}}
            </span>
          </template>
        </vue-good-table>
      </Card>
    </template>
  </Page>
</template>

<script>
import { pools } from '~/_gql_queries';
import { mapGetters } from 'vuex';
import BounceLoader from 'vue-spinner/src/BounceLoader.vue';

export default {
  data: function () {
    return {
      mode: 'grid',
      navItems: [
        {text: 'Grid', mode: 'grid'},
        {text: 'Table', mode: 'table'},
      ],
      tableModeItems: [
        {text: 'Active Pools', mode: 'active'},
        {text: 'Staged/Suspended Pools', mode: 'staged'}
      ],
      tableMode: 'active',
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
    BounceLoader,
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice'
    }),
    sortedPools() {
      if (!this.pools)
        return undefined
      return this.pools.sort((a,b) => {
        return b.depth.poolDepth - a.depth.poolDepth
      })
    }
  },
  methods: {
    
    numberFormat(number, filter) {
      return '$' + this.$options.filters.number(number, '0a')
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
    },
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

<style>
</style>