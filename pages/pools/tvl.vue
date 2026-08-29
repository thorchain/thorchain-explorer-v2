<template>
  <div class="container-page tvl-page">
    <Nav
      :active-mode="chartPeriod"
      :nav-items="chartPeriods"
      pre-text="Period :"
      @update:activeMode="onPeriodChange"
    />
    <Card>
      <VChart
        v-if="tvlOption && !loading"
        class="chart"
        :option="tvlOption"
        :autoresize="true"
        :theme="chartTheme"
      />
      <ChartLoader v-if="!tvlOption || loading" :bar-count="90" />
    </Card>
  </div>
</template>

<script>
import moment from 'moment'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import { mapGetters } from 'vuex'
import VChart from 'vue-echarts'
import { assetFromString } from '@xchainjs/xchain-util'
import { orderBy } from 'lodash'
import ChartLoader from '~/components/ChartLoader.vue'

use([
  SVGRenderer,
  GridComponent,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
])

const CHART_PERIODS = [
  { text: '90 Days', mode: '90d', interval: 'day', count: 90 },
  { text: '180 Days', mode: '180d', interval: 'day', count: 180 },
  { text: '1 Year', mode: '1y', interval: 'week', count: 52 },
  { text: '2 Years', mode: '2y', interval: 'week', count: 104 },
  { text: 'All', mode: 'all', interval: 'month', count: 100 },
]

export default {
  name: 'TVLPool',
  components: {
    VChart,
    ChartLoader,
  },
  data() {
    return {
      tvlOption: undefined,
      loading: false,
      chartPeriods: CHART_PERIODS,
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
    chartPeriod() {
      const { period } = this.$route.query
      return CHART_PERIODS.some((p) => p.mode === period) ? period : '90d'
    },
    periodConfig() {
      return CHART_PERIODS.find((p) => p.mode === this.chartPeriod)
    },
  },
  watch: {
    chartPeriod: {
      handler() {
        this.updateDatum()
      },
      immediate: true,
    },
  },
  methods: {
    onPeriodChange(period) {
      if (period === this.chartPeriod) {
        return
      }
      this.$router.push({ query: { ...this.$route.query, period } })
    },
    dateFormat(interval) {
      const mid = Math.floor((~~interval.endTime + ~~interval.startTime) / 2)
      return moment(mid * 1e3).format(
        this.periodConfig.interval === 'month' ? 'YY/MM' : 'YY/MM/DD'
      )
    },
    async updateDatum() {
      const { interval, count } = this.periodConfig
      this.loading = true

      try {
        const {
          data: { intervals = [] },
        } = await this.$api.getTVLHistory(count, interval)

        // chain -> usd depth per interval, zero filled so every
        // series stays aligned with the x axis even when a chain
        // drops to zero depth in the middle of the range
        const chains = {}
        const xAxis = []

        intervals.forEach((it, i) => {
          it?.poolsDepth?.forEach((pd) => {
            if (+pd.totalDepth === 0) {
              return
            }

            const { chain } = assetFromString(pd.pool)
            if (chain === 'BNB') {
              return
            }

            if (!(chain in chains)) {
              chains[chain] = new Array(intervals.length).fill(0)
            }
            chains[chain][i] += (+pd.totalDepth / 1e8) * +it.runePriceUSD
          })

          xAxis.push(this.dateFormat(it))
        })

        const seriesPools = orderBy(
          Object.entries(chains),
          [([, data]) => data.reduce((a, b) => a + b, 0)],
          ['desc']
        ).map(([chain, data]) => {
          const chainColor = this.getChainColor(chain)
          return {
            name: chain,
            type: 'bar',
            stack: 'Total',
            showSymbol: false,
            symbol: 'circle',
            areaStyle: { color: chainColor },
            lineStyle: { color: chainColor },
            itemStyle: { color: chainColor },
            data,
            smooth: true,
          }
        })

        const formatter = (param) => {
          const pds = orderBy(param, ['value'], ['desc']).filter(
            (p) => +p.value > 0
          )
          return `
          <div class="tooltip-header">
            ${param[0].axisValue}
          </div>
          ${pds
            .map(
              (p) => `
            <div class="tooltip-body">
              <div class="tooltip-item">
                <div class="data-color" style="background-color: ${p.color}"></div>
                <span>${p.seriesName}</span>
              </div>
              <b>$${this.$options.filters.number(p.value, '0,0.00 a')}</b>
            </div>
          `
            )
            .join('')}
          <hr>
          <div class="tooltip-item space">
            <div style="display: flex; align-items: center;">
              <span>Total</span>
            </div>
            <b>$${this.$options.filters.number(
              pds.reduce((a, b) => a + b.value, 0),
              '0,0.00 a'
            )}</b>
          </div>
        `
        }

        this.tvlOption = this.basicChartFormat(
          undefined,
          seriesPools,
          xAxis,
          {
            legend: {
              type: 'scroll',
              pageIconColor: 'var(--primary-color)',
              icon: 'rect',
              textStyle: {
                color: 'var(--sec-font-color)',
              },
            },
          },
          formatter
        )
      } catch (error) {
        console.error('Error fetching TVL history:', error)
      } finally {
        this.loading = false
      }
    },
  },
  head: {
    title: 'THORChain Network Explorer | TVL',
  },
}
</script>

<style lang="scss">
.tvl-page {
  .echarts {
    width: 100%;
    height: 400px;
  }

  .tooltip-body {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
