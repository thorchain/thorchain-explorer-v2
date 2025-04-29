<template>
  <div>
    <cards-header :table-general-stats="saversGeneralStats" />
    <Page>
      <Card title="Savers">
        <TableLoader v-if="loading" :cols="cols" />

        <vue-good-table
          v-else
          :columns="cols"
          :rows="saversRow"
          style-class="vgt-table net-table"
          :pagination-options="{
            enabled: true,
            perPage: 30,
            perPageDropdownEnabled: false,
          }"
          :sort-options="{
            enabled: true,
            initialSortBy:
              networkEnv === 'mainnet'
                ? { field: 'saversDepthUSD', type: 'desc' }
                : {},
          }"
          @on-row-click="gotoSaver"
        >
          <template slot="table-column" slot-scope="props">
            <div
              v-if="props.column.field == 'saversDepthRatio'"
              class="table-asset end"
            >
              {{ props.column.label }}
              <info-icon class="header-icon" />
            </div>
            <div
              v-else-if="props.column.field == 'filled'"
              class="table-asset end"
            >
              {{ props.column.label }}
              <info-icon class="header-icon" />
            </div>
            <div
              v-else-if="props.column.field == 'saversReturn'"
              class="table-asset end"
            >
              {{ props.column.label }}
              <info-icon class="header-icon" />
            </div>
            <span v-else>
              {{ props.column.label }}
            </span>
          </template>
          <template slot="table-row" slot-scope="props">
            <div
              v-if="props.column.field == 'asset'"
              v-tooltip="props.row.asset"
              class="cell-content"
            >
              <AssetIcon :asset="props.row.asset" />
              <span class="clickable">{{
                props.formattedRow[props.column.field]
              }}</span>
            </div>
            <span v-else-if="props.column.field == 'saversDepth'">
              <span>
                {{ props.formattedRow[props.column.field] }}
                <progress-icon
                  v-if="props.row.delta && props.row.delta[props.column.field]"
                  :data-number="
                    smallBaseAmountFormat(props.row.delta[props.column.field])
                  "
                  :is-down="+props.row.delta[props.column.field] < 0"
                />
                <span
                  class="extra-text"
                  style="font-size: 0.6rem; font-weight: bold"
                >
                  {{ showAsset(props.row.asset) }}
                </span>
              </span>
            </span>
            <span v-else>
              {{ props.formattedRow[props.column.field] }}
              <progress-icon
                v-if="props.row.delta && props.row.delta[props.column.field]"
                :data-number="
                  getFormattedValue(
                    props.column.field,
                    props.row.delta[props.column.field]
                  )
                "
                :is-down="+props.row.delta[props.column.field] < 0"
              />
            </span>
          </template>
        </vue-good-table>
      </Card>
    </Page>
    <div v-if="saversRow && saversRow.length > 0" class="footer-stat">
      <small>
        <sup>*</sup>
        All of the stat changes are based on 24 hours period
      </small>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { forEach as eachLod } from 'lodash'
import ProgressIcon from '~/components/ProgressIcon.vue'
import InfoIcon from '~/assets/images/info.svg?inline'
import { formatAsset } from '~/utils'

export default {
  components: { ProgressIcon, InfoIcon },
  data() {
    return {
      loading: true,
      error: false,
      cols: [
        {
          label: 'Asset',
          field: 'asset',
          formatFn: formatAsset,
        },
        {
          label: 'Savers Depth (USD)',
          field: 'saversDepthUSD',
          type: 'number',
          formatFn: this.smallBaseAmountFormatWithCur,
          tdClass: 'mono',
        },
        {
          label: 'Savers Depth',
          field: 'saversDepth',
          type: 'number',
          formatFn: this.baseAmountFormat,
          tdClass: 'mono',
        },
        {
          label: 'Savers / Depth',
          field: 'saversDepthRatio',
          type: 'percentage',
          tooltip: 'Savers depth to the Asset Depth in the pool',
          tdClass: 'mono',
        },
        {
          label: 'Savers Filled',
          field: 'filled',
          type: 'percentage',
          tooltip: 'Savers depth to the max synth per pool depth threshold',
          tdClass: 'mono',
        },
        {
          label: 'Savers Count',
          field: 'saversCount',
          type: 'number',
          tdClass: 'mono',
          formatFn: this.normalFormat,
        },
        {
          label: 'Savers APR',
          field: 'saversReturn',
          tooltip:
            'This week savers yield based on its depth and units growth over an extended of a year',
          type: 'percentage',
          tdClass: 'mono',
        },
      ],
      saversGeneralStats: [
        {
          name: 'Total Savers',
        },
        {
          name: 'Total Saved Value',
        },
        {
          name: 'Total Earned',
        },
        {
          name: 'APR Mean',
        },
      ],
      saversInfo: {},
      saversRow: [],
      totalSaversFilled: 0,
      totalSaversValue: undefined,
      totalSaverFormatter: undefined,
      maxSaverCap: 0.6,
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
    networkEnv() {
      return process.env.NETWORK
    },
  },
  mounted() {
    // Disable column 5 if stagenet
    this.cols[5].hidden = this.networkEnv === 'stagenet'

    this.$api
      .getSaversInfo()
      .then(({ data }) => {
        if (!data) {
          return
        }
        this.saversInfo = data
        this.saversRow = this.formatSaversInfo()
        this.fillSaversTotal()
        this.fillTotalSaversValue()
        this.loading = false
      })
      .catch((e) => {
        console.error(e)
        this.loading = false
      })

    this.$api
      .getMimir()
      .then(({ data }) => {
        this.maxSaverCap = (data.MAXSYNTHPERPOOLDEPTH * 2) / 10e3
      })
      .catch((err) => {
        console.error("didn't catch the max synth per asset depth", err)
        this.loading = false
      })
  },
  methods: {
    formatSaversInfo() {
      const ret = []
      for (const asset of Object.keys(this.saversInfo)) {
        const s = this.saversInfo[asset]
        const delta = {}

        eachLod(s.oldSavers, (v, k) => {
          delta[k] = +s.savers[k] - +v
        })

        ret.push({
          ...s.savers,
          saversDepthUSD: +s.savers.assetPriceUSD * +s.savers.saversDepth,
          saversDepthRatio: +s.savers.saversDepth / +s.savers.assetDepth,
          delta: {
            ...delta,
            saversDepthUSD:
              (+s.savers.saversDepth - +s.oldSavers.saversDepth) *
              +s.savers.assetPriceUSD,
          },
        })
      }

      return ret
    },
    getFormattedValue(field, value) {
      switch (field) {
        case 'saversDepthUSD':
          return this.smallBaseAmountFormatWithCur(+value)
        case 'saversReturn':
        case 'filled':
          return this.percentageFormat(+value, 2)
        default:
          return +value
      }
    },
    fillSaversTotal() {
      const g = {
        saversCount: 0,
        totalUSDSaved: 0,
        totalEarn: 0,
        meanAPR: 0,
        totalFilled: 0,
      }

      const o = {
        saversCount: 0,
        totalUSDSaved: 0,
        totalEarn: 0,
        meanAPR: 0,
        totalFilled: 0,
      }

      eachLod(this.saversInfo, (v, k) => {
        g.saversCount += v.savers.saversCount
        g.totalUSDSaved +=
          (v.savers.saversDepth * +v.savers.assetPriceUSD) / 1e8
        g.totalEarn += (v.savers.earned * +v.savers.assetPriceUSD) / 1e8
        g.meanAPR += +v.savers.saversReturn / this.saversRow.length
        g.totalFilled += +v.savers.filled
      })

      eachLod(this.saversInfo, (v, k) => {
        o.saversCount += v.oldSavers.saversCount
        o.totalUSDSaved +=
          (v.oldSavers.saversDepth * +v.savers.assetPriceUSD) / 1e8
        o.totalEarn += (v.oldSavers.earned * +v.savers.assetPriceUSD) / 1e8
        o.meanAPR += +v.oldSavers.saversReturn / this.saversRow.length
        o.totalFilled += +v.oldSavers.filled
      })

      this.saversGeneralStats = [
        {
          name: 'Total Savers',
          value: g.saversCount,
          isDown: g.saversCount < o.saversCount,
        },
        {
          name: 'Total Value',
          value:
            '$' + this.$options.filters.number(g.totalUSDSaved || 0, '0,0a'),
          isDown: g.totalUSDSaved < o.totalUSDSaved,
        },
        {
          name: 'Total Earned',
          value: '$' + this.$options.filters.number(g.totalEarn || 0, '0,0a'),
          isDown: g.totalEarn < o.totalEarn,
        },
        {
          name: 'APR Mean',
          value: this.$options.filters.percent(g.meanAPR, 2),
          isDown: g.meanAPR < o.meanAPR,
        },
      ]
    },
    fillTotalSaversValue() {
      this.totalSaversValue = this.saversRow.map((saver) => ({
        value: saver?.saversDepthUSD,
        name: saver?.asset,
        itemStyle: {
          color: this.getAssetColor(saver?.asset),
        },
        emphasis: {
          itemStyle: {
            color: this.getAssetColor(saver?.asset),
          },
        },
      }))

      this.totalSaverFormatter = (param) => {
        return `
          <div class="tooltip-header">
            <div class="data-color" style="background-color: ${param.color}"></div>
            ${param.name}
          </div>
          <div class="tooltip-body">
            <span>
              <span>Value</span>
              <b>$${this.$options.filters.number(param.value, '0,0.00 a')}</b>
            </span>
            <span>
              <span>Percentage</span>
              <b>${this.$options.filters.percent(param.percent / 100, 2)}</b>
            </span>
          </div>
        `
      }
    },
  },
  head: {
    title: 'THORChain Network Explorer | Savers',
  },
}
</script>

<style lang="scss" scoped>
.savers-box {
  .nav-headers.box.pools-type-table {
    margin: $space-0 !important;
    border: 1px solid var(--border-color);
    border-bottom: 0;
    border-radius: 7px 8px 0 0;
  }
}

.savers-filled-card {
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-width: 350px;
}

.chart-edition {
  margin-bottom: $space-16;
  display: flex;
  gap: $space-16;
  flex-wrap: wrap;

  .card-container {
    border: 1px solid var(--border-color);
    border-radius: $radius-lg;
    margin: auto;
  }

  h4 {
    color: var(--sec-font-color);
    text-align: center;
  }
}

.footer-stat {
  margin: $space-24 $space-16 $space-0 $space-16;

  small {
    font-size: small;
    font-family: 'Roboto Mono';
  }
}
</style>
