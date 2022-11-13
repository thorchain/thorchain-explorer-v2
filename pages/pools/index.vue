<template>
  <Page>
    <Nav :active-mode.sync="poolType" :nav-items="poolTypes" />
    <!-- <Nav :active-mode.sync="viewMode" :nav-items="viewPools" /> -->
    <template v-if="poolType == 'regular'">
      <template v-if="viewMode == 'grid'">
        <pool-card :pools="sortedPools" />
      </template>
      <div v-else-if="pools && pools.length > 0 && viewMode == 'table'" class="pools-box">
        <Nav :active-mode.sync="tableMode" :nav-items="tableModeItems" :extra-classes="['pools-type-table']"/>
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
    </template>
    <template v-else>
      <vue-good-table
        v-if="tables.activeRows.data.length > 0"
        :columns="saverCols"
        :rows="tables.saversRows.data"
        style-class="vgt-table net-table"
        :pagination-options="{
          enabled: true,
          perPage: 30,
          perPageDropdownEnabled: false,
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
  </Page>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  data () {
    return {
      error: false,
      poolType: 'regular',
      poolTypes: [
        { text: 'Pools', mode: 'regular' },
        { text: 'Savers', mode: 'savers' }
      ],
      viewMode: 'table',
      viewPools: [
        { text: 'Grid', mode: 'grid' },
        { text: 'Table', mode: 'table' }
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
      saverCols: [
        {
          label: 'Asset',
          field: 'asset',
          formatFn: this.formatAsset
        },
        {
          label: 'USD Price',
          field: 'price',
          type: 'number',
          formatFn: this.curFormat,
          tdClass: 'mono'
        },
        {
          label: 'Saver Depth',
          field: 'saversDepth',
          type: 'number',
          formatFn: this.formattedPrice,
          tdClass: 'mono'
        },
        {
          label: 'Total Saver Units',
          field: 'saversUnits',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono'
        },
        {
          label: 'Total Depth/Units Ratio',
          field: 'depthToUnitsRatio',
          type: 'number',
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
        },
        saversRows: {
          data: []
        }
      }
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice'
    }),
    sortedPools () {
      if (!this.pools) {
        return undefined
      }
      return this.pools?.sort((a, b) => {
        return (+b.runeDepth) - (+a.runeDepth)
      })
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
        asset: p.asset,
        saversDepth: (+p.saversDepth / 10 ** 8) * p.assetPriceUSD,
        saversUnits: (+p.saversUnits),
        depthToUnitsRatio: this.$options.filters.number(+p.saversDepth / +p.saversUnits, '0.00000')
      }))
      this.sepPools(ps)
      this.setSavers(ps)
    }).catch((e) => {
      console.error(e)
    })
  },
  methods: {
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
      for (const i in pools) {
        if (pools[i].status === 'available') {
          this.tables.activeRows.data.push(pools[i])
        } else {
          this.tables.standbyRows.data.push(pools[i])
        }
      }
    },
    setSavers (pools) {
      if (!pools && pools.length <= 0) {
        return
      }
      for (const i in pools) {
        if (+pools[i].saversUnits > 0) {
          this.tables.saversRows.data.push(pools[i])
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
