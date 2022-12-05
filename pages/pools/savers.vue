<template>
  <div>
    <div v-show="networkEnv === 'mainnet' && saversGeneralStats && saversGeneralStats.length > 0" class="savers-stat-header">
      <div v-for="(stat, i) in saversGeneralStats" :key="i" class="savers-stat-card">
        <div class="value">
          {{ stat.value }}
        </div>
        <div v-if="stat.change" class="stat-change">
          <progress-icon
            :data-number="stat.change"
            :is-down="stat.isDown"
            size="1rem"
          />
        </div>
        <div class="name">
          {{ stat.name }}
        </div>
      </div>
    </div>
    <div class="chart-edition savers-distro">
      <Card title="Savers Distribution" :is-loading="!totalSaversValue" class="inner-pie-chart">
        <pie-chart :pie-data="totalSaversValue" :formatter="totalSaverFormatter" />
      </Card>
      <Card title="Savers Cap Filled" :is-loading="!saversFilled" class="savers-filled-card">
        <ProgressBar :width="(saversFilled*100)" />
        <h4>
          {{
            $options.filters.percent(saversFilled, 2)
          }}
          <progress-icon
            v-if="saversChange"
            :data-number="$options.filters.percent(saversChange, 2)"
            :is-down="!saversChange"
            size=".9rem"
          />
          Total Savers Filled
        </h4>
      </Card>
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
          :sort-options="{
            enabled: true,
            initialSortBy: {field: 'saverDepthPrice', type: 'desc'}
          }"
          @on-row-click="gotoSaver"
        >
          <template slot="table-row" slot-scope="props">
            <div v-if="props.column.field == 'asset'" v-tooltip="props.row.asset" class="cell-content">
              <AssetIcon :asset="props.row.asset" />
              <span>{{ props.formattedRow[props.column.field] }}</span>
            </div>
            <span v-else-if="props.column.field == 'saversDepth'">
              <span>
                {{ props.formattedRow[props.column.field] }}
                <progress-icon :data-number="props.row.changes[props.column.field].value" :is-down="props.row.changes.saversDepth.isDown" />
                <span class="extra-text" style="font-size: .6rem; font-weight: bold;">
                  {{ showAsset(props.row.asset) }}
                </span>
              </span>
            </span>
            <span v-else>
              {{ props.formattedRow[props.column.field] }}
              <progress-icon :data-number="props.row.changes[props.column.field].value" :is-down="props.row.changes[props.column.field].isDown" />
            </span>
          </template>
        </vue-good-table>
      </Card>
    </Page>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import PieChart from '~/components/PieChart.vue'
import ProgressIcon from '~/components/ProgressIcon.vue'

export default {
  components: { PieChart, ProgressIcon },
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
      maxSaverCap: 0.3,
      saversFilled: 0,
      totalSaversValue: 0,
      totalSaverFormatter: undefined,
      oldSavers: {},
      saversChange: 0
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

      const oldSaversStat = {
        saversCount: 0,
        totalUSDSaved: 0,
        totalEarn: 0,
        meanAPR: 0,
        totalFilled: 0,
        assetDepthUSD: 0
      }
      Object.keys(this.oldSavers).forEach((saver) => {
        oldSaversStat.saversCount += this.oldSavers[saver].saversCount
        oldSaversStat.totalUSDSaved += +this.oldSavers[saver].saversDepth / 1e8 * +this.oldSavers[saver].assetPrice
        oldSaversStat.totalEarn += +this.oldSavers[saver].earned / 1e8 * +this.oldSavers[saver].assetPrice
        oldSaversStat.meanAPR += (this.oldSavers[saver].saverReturn)
        oldSaversStat.totalFilled += +this.oldSavers[saver].saversDepth * +this.oldSavers[saver].assetPrice
        oldSaversStat.assetDepthUSD += (+this.oldSavers[saver].assetDepth * +this.oldSavers[saver].assetPrice)
      })

      this.setSaversFilled(
        saversStat.totalFilled / (totalPoolDepthUSD * this.maxSaverCap),
        oldSaversStat.totalFilled / (oldSaversStat.assetDepthUSD * this.maxSaverCap)
      )
      return [
        {
          name: 'Total Savers',
          value: saversStat.saversCount,
          change: saversStat.saversCount - oldSaversStat.saversCount
        },
        {
          name: 'Total Saved Value',
          value: this.$options.filters.currency(saversStat.totalUSDSaved),
          change: this.$options.filters.currency(saversStat.totalUSDSaved - oldSaversStat.totalUSDSaved),
          isDown: +saversStat.totalUSDSaved < +oldSaversStat.totalUSDSaved
        },
        {
          name: 'Total Earned',
          value: this.$options.filters.currency(saversStat.totalEarn),
          change: this.$options.filters.currency(saversStat.totalEarn - oldSaversStat.totalEarn),
          isDown: saversStat.totalEarn < oldSaversStat.totalEarn
        },
        {
          name: 'APR Mean',
          value: this.$options.filters.percent(saversStat.meanAPR / this.tables.saversRows.data.length, 2),
          change: this.$options.filters.percent((saversStat.meanAPR - oldSaversStat.meanAPR) / this.tables.saversRows.data.length, 4),
          isDown: saversStat.meanAPR < oldSaversStat.meanAPR
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
      const saversOldData = (await this.$api.getOldSaversExtraData()).data
      const changes = this.getSaversChanges(saversOldData, saversExtraData)
      this.oldSavers = saversOldData
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
        saverReturn: saversExtraData[p.asset]?.saverReturn,
        changes: changes[p.asset]
      }))
      this.setSavers(ps)
    }).catch((e) => {
      console.error(e)
    })
    this.$api.getMimir().then(({ data }) => {
      this.maxSaverCap = data.MAXSYNTHPERASSETDEPTH / 10e3
    }).catch(err => console.error('didn\'t catch the max synth per asset depth', err))
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
    gotoSaver (params) {
      if (!params) { return }
      this.$router.push(`/savers/${params.row.asset}`)
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
      this.fillTotalSaversValue()
    },
    fillTotalSaversValue () {
      this.totalSaversValue = this.tables.saversRows.data.map(saver => ({
        value: saver.saverDepthPrice,
        name: saver.asset
      }))

      this.totalSaverFormatter = (param) => {
        return (`
          <div class="tooltip-header">
            <div class="data-color" style="background-color: ${param.color}"></div>
            ${param.name}
          </div>
          <div class="tooltip-body">
            <span>
              <span>Value</span>
              <b>$${this.$options.filters.number(param.value, '0,0.00 a')}</b>
            </span>
          </div>
        `)
      }
    },
    setSaversFilled (saversFilled, oldSaversFilled) {
      this.saversFilled = saversFilled
      this.saversChange = saversFilled - oldSaversFilled
    },
    getSaversChanges (oldData, newData) {
      const ret = {}
      Object.keys(newData).forEach((asset) => {
        ret[asset] = {
          saversCount: {
            value: this.$options.filters.number(newData[asset].saversCount - (oldData[asset].saversCount ?? 0), '0,0'),
            isDown: (newData[asset].saversCount < (oldData[asset].saversCount ?? 0))
          },
          saverReturn: {
            value: this.percentageFormat(newData[asset].saverReturn - (oldData[asset].saverReturn ?? 0), 2),
            isDown: (newData[asset].saverReturn < (oldData[asset].saverReturn ?? 0))
          },
          earned: {
            value: this.baseAmountFormat(newData[asset].earned - (oldData[asset].earned ?? 0)),
            isDown: (newData[asset].earned < (oldData[asset].earned ?? 0))
          },
          filled: {
            value: this.percentageFormat(newData[asset].filled - (oldData[asset].filled ?? 0), 2),
            isDown: (newData[asset].filled < (oldData[asset].filled ?? 0))
          },
          saversDepth: {
            value: this.smallBaseAmountFormat(+newData[asset].saversDepth - (+oldData[asset].saversDepth ?? 0)),
            isDown: (+newData[asset].saversDepth < (+oldData[asset].saversDepth ?? 0))
          },
          saverDepthPrice: {
            value: '$' + this.smallBaseAmountFormat((+newData[asset].saversDepth - (+oldData[asset].saversDepth ?? 0)) * newData[asset].assetPrice),
            isDown: (+newData[asset].saversDepth < (+oldData[asset].saversDepth ?? 0))
          }
        }
      })
      return ret
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

.savers-filled-card {
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-width: 350px;
}

.chart-edition {
  margin-bottom: 15px;
  display: flex;
  gap: 15px;
  flex-wrap: wrap;

  .card-container {
    border: 1px solid var(--border-color);
    border-radius: .5rem;
    margin: auto;
  }

  h4 {
    color: var(--sec-font-color);
    text-align: center;
  }
}

.inner-pie-chart {
  max-width: 300px;
}

.stat-change {
  display: flex;
  justify-content: center;
  margin: .2rem 0;
}
</style>
