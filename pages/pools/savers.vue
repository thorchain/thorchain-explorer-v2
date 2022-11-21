<template>
  <div>
    <div v-show="networkEnv === 'mainnet' && saversGeneralStats && saversGeneralStats.length > 0" class="savers-stat-header">
      <div v-for="(stat, i) in saversGeneralStats" :key="i" class="savers-stat-card">
        <div class="value">
          {{ stat.value }}
        </div>
        <div class="name">
          {{ stat.name }}
        </div>
      </div>
    </div>
    <Page>
      <Card :is-loading="tables.saversRows.data.length <= 0">
        <vue-good-table
          v-if="tables.saversRows.data.length > 0"
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
            <span v-else-if="props.column.field == 'saversDepth'">
              <span v-tooltip="(+props.row.depth / 10e8) * +props.row.price">{{ props.formattedRow[props.column.field] }}
                <span class="extra-text" style="font-size: .6rem; font-weight: bold;">
                  {{ showAsset(props.row.asset) }}
                </span>
              </span>
            </span>
            <span v-else>
              {{ props.formattedRow[props.column.field] }}
            </span>
          </template>
        </vue-good-table>
      </Card>
    </Page>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  data () {
    return {
      error: false,
      saverCols: [
        {
          label: 'Asset',
          field: 'asset',
          formatFn: this.formatAsset
        },
        {
          label: 'Savers Depth Price',
          field: 'saverDepthPrice',
          type: 'number',
          formatFn: this.formattedPrice,
          tdClass: 'mono'
        },
        {
          label: 'Savers Depth',
          field: 'saversDepth',
          type: 'number',
          formatFn: this.normalNumberFormat,
          tdClass: 'mono'
        },
        {
          label: 'Savers Filled',
          field: 'filled',
          type: 'percentage',
          tdClass: 'mono'
        },
        {
          label: 'Savers Count',
          field: 'saversCount',
          type: 'number',
          tdClass: 'mono',
          formatFn: this.normalFormat
        },
        {
          label: 'Savers APR',
          field: 'saverReturn',
          type: 'percentage',
          tdClass: 'mono'
        }
      ],
      tables: {
        saversRows: {
          data: []
        }
      },
      maxSaverCap: 0.3
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice'
    }),
    saversGeneralStats () {
      if (this.tables.saversRows.data.length <= 0) {
        return []
      }
      const saversStat = {
        saversCount: 0,
        totalUSDSaved: 0,
        totalEarn: 0,
        meanAPR: 0,
        totalFilled: 0
      }
      const totalPoolDepthUSD = this.tables.saversRows.data
        .map(d => d.assetDepthUSD).reduce((a, b) => a + b, 0)
      this.tables.saversRows.data.forEach((saver, index) => {
        saversStat.saversCount += saver.saversCount
        saversStat.totalUSDSaved += +saver.saversDepth * +saver.price
        saversStat.totalEarn += (+saver.saversDepth - +(saver.saversUnits / 1e8)) * +saver.price
        saversStat.meanAPR += (saver.saverReturn)
        saversStat.totalFilled += +saver.saversDepth * +saver.price
      })
      return [
        {
          name: 'Total Savers',
          value: saversStat.saversCount
        },
        {
          name: 'Total Saved Value',
          value: this.$options.filters.currency(saversStat.totalUSDSaved)
        },
        {
          name: 'Total Earned',
          value: this.$options.filters.currency(saversStat.totalEarn)
        },
        {
          name: 'APR Mean',
          value: this.$options.filters.percent(saversStat.meanAPR / this.tables.saversRows.data.length, 2)
        },
        {
          name: 'Total Filled',
          value: this.$options.filters.percent(saversStat.totalFilled / (totalPoolDepthUSD * this.maxSaverCap), 2)
        }
      ]
    },
    networkEnv () {
      return process.env.NETWORK
    }
  },
  mounted () {
    this.saverCols[5].hidden = this.networkEnv === 'stagenet'
    this.$api.getPools().then(async ({ data }) => {
      const runePrice = (await this.$api.getStats()).data.runePriceUSD
      const saversExtraData = (await this.$api.getSaversExtraData()).data
      this.maxSaverCap = (await this.$api.getMimir()).data.MAXSYNTHPERASSETDEPTH / 10e3
      const ps = data.map(p => ({
        status: p.status,
        price: p.assetPriceUSD,
        saverDepthPrice: (+p.saversDepth / 10 ** 8) * p.assetPriceUSD,
        depth: ((+p.assetDepth / 10 ** 8) * p.assetPriceUSD) + ((+p.runeDepth / 10 ** 8) * runePrice),
        assetDepthUSD: (+p.assetDepth / 10 ** 8) * p.assetPriceUSD,
        apy: p.poolAPY,
        volume: (+p.volume24h / 10 ** 8) * runePrice,
        vd: (+p.volume24h) / ((+p.assetDepth * +p.assetPrice) + (+p.runeDepth)),
        asset: p.asset,
        saversDepth: (+p.saversDepth / 10 ** 8),
        saversUnits: (+p.saversUnits),
        depthToUnitsRatio: this.$options.filters.number(+p.saversDepth / +p.saversUnits, '0.00000'),
        filled: saversExtraData[p.asset]?.filled,
        saversCount: saversExtraData[p.asset]?.saversCount,
        saverReturn: saversExtraData[p.asset]?.saverReturn
      }))
      this.setSavers(ps)
    }).catch((e) => {
      console.error(e)
    })
  },
  methods: {
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

.savers-stat-header {
  display: grid;
  gap: 15px;
  margin-bottom: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  grid-template-rows: auto;

  .savers-stat-card {
    padding: 2rem 0;
    border-radius: 8px;
    background-color: var(--card-bg-color);
    border: 1px solid var(--border-color);

    .value {
      color: var(--sec-font-color);
      font-size: 1.5rem;
      text-align: center;
    }

    .name {
      color: var(--font-color);
      text-align: center;
    }
  }
}
</style>
