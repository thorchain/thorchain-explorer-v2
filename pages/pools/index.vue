<template>
  <Page>
    <Nav :active-mode.sync="mode" :nav-items="navItems" />
    <template v-if="mode == 'grid'">
      <pool-card :pools="sortedPools" />
    </template>
    <template v-else-if="pools && pools.length > 0 && mode == 'table'">
      <Nav :active-mode.sync="tableMode" :nav-items="tableModeItems" />
      <template v-for="(k, v, i) in tables">
        <vue-good-table
          v-if="k.data.length > 0"
          v-show="tableMode == k.mode"
          :key="i"
          :columns="cols"
          :rows="k.data"
          style-class="vgt-table net-table"
          :pagination-options="{
            enabled: true,
            perPage: 30,
            perPageDropdownEnabled: false,
          }"
          :sort-options="{
            enabled: true,
            initialSortBy: {field: 'apy', type: 'desc'}
          }"
          @on-row-click="gotoPoolTable"
        >
          <template slot="table-row" slot-scope="props">
            <div v-if="props.column.field == 'asset'" class="cell-content" v-tooltip="props.row.asset">
              <img class="table-asset-icon" :src="assetImage(props.row.asset)" alt="asset-icon">
              <span>{{ props.formattedRow[props.column.field] }}</span>
            </div>
            <span v-else-if="props.column.field == 'status'">
              <div :class="['bubble-container', {'yellow': k.mode == 'staged'}]">
                <span>{{ props.row.status | capitalize }}</span>
              </div>
            </span>
            <span v-else>
              {{ props.formattedRow[props.column.field] }}
            </span>
          </template>
        </vue-good-table>
      </template>
    </template>
  </Page>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  data () {
    return {
      error: false,
      mode: 'table',
      navItems: [
        { text: 'Grid', mode: 'grid' },
        { text: 'Table', mode: 'table' }
      ],
      tableModeItems: [
        { text: 'Active Pools', mode: 'active' },
        { text: 'Staged/Suspended Pools', mode: 'staged' }
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
          label: 'Volume 24H',
          field: 'volume',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono'
        },
        {
          label: 'Depth',
          field: 'depth',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono'
        },
        {
          label: 'Volume/Depth',
          field: 'vd',
          type: 'percentage',
          tdClass: 'mono'
        },
        {
          label: 'APY',
          field: 'apy',
          type: 'percentage',
          tdClass: 'mono'
        }
      ],
      pools: undefined,
      tables: {
        activeRows: {
          data: [],
          mode: 'active'
        },
        standbyRows: {
          data: [],
          mode: 'staged'
        }
      }
    }
  },
  mounted () {
    this.$api.getPools().then(async ({ data }) => {
      this.pools = data

      const runePrice = (await this.$api.getStats()).data.runePriceUSD

      const ps = this.pools.map(p => ({
        status: p.status,
        price: p.assetPriceUSD,
        depth: ((+p.assetDepth / 10 ** 8) * p.assetPriceUSD) + ((+p.runeDepth / 10 ** 8) * runePrice),
        apy: p.poolAPY,
        volume: (+p.volume24h / 10 ** 8) * runePrice,
        vd: (+p.volume24h) / ((+p.assetDepth * +p.assetPrice) + (+p.runeDepth)),
        asset: p.asset
      }))
      this.sepPools(ps)
    }).catch((e) => {
      console.error(e)
    })
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice'
    }),
    sortedPools () {
      if (!this.pools) { return undefined }
      return this.pools?.sort((a, b) => {
        return (+b.runeDepth) - (+a.runeDepth)
      })
    }
  },
  methods: {
    numberFormat (number, filter) {
      return '$' + this.$options.filters.number(number, '0.00a')
    },
    curFormat (number) {
      return this.$options.filters.currency(number)
    },
    formatAsset (asset) {
      return asset.length > 10
        ? asset.slice(0, 14) + '...'
        : asset
    },
    gotoPoolTable (params) {
      this.gotoPool(params.row.asset)
    },
    sepPools (pools) {
      if (!pools && pools.length <= 0) { return }
      for (const i in pools) {
        if (pools[i].status === 'available') {
          this.tables.activeRows.data.push(pools[i])
        } else {
          this.tables.standbyRows.data.push(pools[i])
        }
      }
    }
  }
}
</script>

<style>
</style>
