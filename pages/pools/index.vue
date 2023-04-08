<template>
  <Page>
    <!-- <Nav :active-mode.sync="viewMode" :nav-items="viewPools" /> -->
    <Nav :active-mode.sync="period" :nav-items="periods" pre-text="APY Period :" />
    <Card :is-loading="loading">
      <!-- <template>
        <pool-card/>
      </template> -->
      <div v-if="pools && pools.length > 0" class="pools-box">
        <Nav :active-mode.sync="tableMode" :nav-items="tableModeItems" :extra-classes="['pools-type-table']" />
        <template v-for="(k, v, i) in tables">
          <vue-good-table
            v-if="k.data.length > 0"
            v-show="tableMode == k.mode"
            :key="i"
            :columns="poolCols"
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
              <div v-if="props.column.field == 'asset'" v-tooltip="props.row.asset" class="cell-content">
                <AssetIcon :asset="props.row.asset" />
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
      </div>
    </Card>
  </Page>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  data () {
    return {
      loading: false,
      error: false,
      period: '30d',
      periods: [
        { text: '1 Hour', mode: '1h' },
        { text: '24 Hours', mode: '24h' },
        { text: '7 Days', mode: '7d' },
        { text: '1 Month', mode: '30d' },
        { text: '3 Month', mode: '90d' },
        { text: '100 Days', mode: '100d' },
        { text: '6 Months', mode: '180d' },
        { text: '1 Year', mode: '365d' },
        { text: 'All', mode: 'all' }
      ],
      tableModeItems: [
        { text: 'Active Pools', mode: 'active' },
        { text: 'Staged/Suspended Pools', mode: 'staged' }
      ],
      tableMode: 'active',
      poolCols: [
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
          formatFn: this.formattedPrice,
          tdClass: 'mono'
        },
        {
          label: 'Depth',
          field: 'depth',
          type: 'number',
          formatFn: this.formattedPrice,
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
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice'
    })
  },
  watch: {
    period (period) {
      this.updatePool(period)
    }
  },
  mounted () {
    this.updatePool(this.period)
  },
  methods: {
    updatePool (period) {
      this.loading = true
      this.$api.getPools(period).then(async ({ data }) => {
        this.pools = data
        const runePrice = (await this.$api.getStats()).data.runePriceUSD
        const ps = this.pools.map(p => ({
          status: p.status,
          price: p.assetPriceUSD,
          depthPrice: (+p.saversDepth / 10 ** 8) * p.assetPriceUSD,
          depth: ((+p.assetDepth / 10 ** 8) * p.assetPriceUSD) + ((+p.runeDepth / 10 ** 8) * runePrice),
          apy: p.annualPercentageRate,
          volume: (+p.volume24h / 10 ** 8) * runePrice,
          vd: (+p.volume24h) / ((+p.assetDepth * +p.assetPrice) + (+p.runeDepth)),
          asset: p.asset,
          saversDepth: (+p.saversDepth / 10 ** 8),
          saversUnits: (+p.saversUnits),
          depthToUnitsRatio: this.$options.filters.number(+p.saversDepth / +p.saversUnits, '0.00000')
        }))
        this.sepPools(ps)
        this.loading = false
      }).catch((e) => {
        console.error(e)
      })
    },
    normalNumberFormat (number, filter) {
      return number ? this.$options.filters.number(+number, '0,0.00') : '-'
    },
    formattedPrice (number, filter) {
      return '$' + this.$options.filters.number(number, '0.00a')
    },
    numberFormat (number, filter) {
      return this.$options.filters.number(number, '0.00a')
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
      if (!pools && pools.length <= 0) {
        return
      }

      this.tables.standbyRows.data = []
      this.tables.activeRows.data = []

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

<style lang="scss">
.pools-box {
  .nav-headers.box.pools-type-table {
    margin: 0 !important;
    border: 1px solid var(--border-color);
    border-bottom: 0;
    border-radius: 7px 8px 0 0;
  }
}
</style>
