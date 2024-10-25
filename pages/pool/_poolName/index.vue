<template>
  <Page class="pool-overview">
    <div class="cards-container">
      <info-card :options="poolDetailStats" />
      <card :is-loading="loading" :title="`${showAsset(poolName)} Earnings`">
        <VChart
          :option="volumeHistory"
          :loading="!volumeHistory"
          :loading-options="showLoading"
          :theme="chartTheme"
          :autoresize="true"
        />
      </card>
    </div>
    <div class="cards-container">
      <card :is-loading="loading" :title="`${showAsset(poolName)} Depth`">
        <VChart
          :option="depthHistory"
          :loading="!depthHistory"
          :loading-options="showLoading"
          :theme="chartTheme"
          :autoresize="true"
        />
      </card>
      <card :is-loading="loading" :title="`${showAsset(poolName)} Swaps`">
        <VChart
          :option="swapHistory"
          :loading="!swapHistory"
          :loading-options="showLoading"
          :theme="chartTheme"
          :autoresize="true"
        />
      </card>
    </div>
    <div class="footer-stat">
      <small>
        <sup>*</sup>
        All of the stat are based on 30 days period
      </small>
    </div>
  </Page>
</template>

<script>
import { assetFromString } from '@xchainjs/xchain-util'
import { mapGetters } from 'vuex'
import moment from 'moment'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  SVGRenderer,
  GridComponent,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
])

export default {
  components: {
    VChart,
  },
  asyncData({ params }) {
    return { poolName: params.poolName }
  },
  data() {
    return {
      pool: undefined,
      poolDetail: undefined,
      volumeHistory: undefined,
      depthHistory: undefined,
      swapHistory: undefined,
      loading: true,
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
    poolDetailStats() {
      return [
        {
          title: 'Overview',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Asset Price',
              value: this.pool?.assetPriceUSD,
              filter: (v) => `$${this.$options.filters.number(v, '0,0a')}`,
            },
            {
              name: 'Earning Annual to Depth',
              value: this.pool?.earningsAnnualAsPercentOfDepth,
              filter: (v) => `${this.$options.filters.percent(v)}`,
            },
            {
              name: 'Status',
              value:
                this.pool?.status.charAt(0).toUpperCase() +
                this.pool?.status.slice(1),
            },
            {
              name: 'Asset Depth',
              value: this.pool?.assetDepth / 10 ** 8,
              filter: (v) =>
                `${this.$options.filters.number(v, '0,0')} ${this.showAsset(this.pool?.asset)}`,
            },
            {
              name: 'Rune Depth',
              value: this.pool?.runeDepth / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
            },
            {
              name: 'Units',
              value: this.pool?.units / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: 'Pending Inbound RUNE',
              value: this.poolDetail?.pending_inbound_rune / 10 ** 8,
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,00')}`,
            },
            {
              name: 'Pending Inbound Asset',
              value: this.poolDetail?.pending_inbound_asset / 10 ** 8,
              filter: (v) =>
                `${this.$options.filters.number(v, '0,0')} ${this.showAsset(this.pool?.asset)}`,
            },
          ],
        },
      ]
    },
  },
  mounted() {
    this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true

      this.pool = (await this.$api.getPoolStats(this.poolName)).data

      this.poolDetail = (await this.$api.getPoolDetail(this.poolName)).data

      const resEarning = (await this.$api.getEarningHistory()).data
      this.volumeHistory = this.formatEarnings(resEarning)

      const resDepth = (await this.$api.getPoolDepth(this.poolName, 30)).data
      this.depthHistory = this.formatDepth(resDepth)

      const resSwaps = (
        await this.$api.getSwapsHistory({
          pool: this.poolName,
        })
      ).data
      this.swapHistory = this.formatSwaps(resSwaps)

      this.loading = false
    },
    assetString(assetStr) {
      const { chain, ticker } = assetFromString(assetStr)
      return `${chain}.${ticker}`
    },
    formatSwaps(d) {
      const xAxis = []
      const ps = []
      d?.intervals.forEach((interval, index) => {
        // ignore the last index
        if (index === d?.intervals?.length - 1) {
          return
        }
        xAxis.push(
          moment(
            Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format('dddd, MMM D')
        )
        // usd is in 2 decimal precision
        ps.push(+interval.totalVolumeUSD / 10 ** 2)
      })
      return this.basicChartFormat(
        (value) => `$ ${this.$options.filters.number(+value, '0,0.00a')}`,
        [
          {
            type: 'bar',
            name: 'Volume USD',
            showSymbol: false,
            data: ps,
          },
        ],
        xAxis
      )
    },
    formatDepth(d) {
      const xAxis = []
      const pe = []
      const pr = []
      d?.intervals.forEach((interval, index) => {
        // ignore the last index
        if (index === d?.intervals?.length - 1) {
          return
        }
        xAxis.push(
          moment(
            Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format('dddd, MMM D')
        )
        pe.push(+interval.assetDepth / 10 ** 8)
        pr.push(+interval.runeDepth / 10 ** 8)
      })
      return this.basicChartFormat(
        (value) => `${this.$options.filters.number(+value, '0,0.00a')}`,
        [
          {
            type: 'bar',
            name: 'Asset Depth',
            showSymbol: false,
            yAxisIndex: 1,
            data: pe,
          },
          {
            type: 'bar',
            name: 'Rune Depth',
            showSymbol: false,
            yAxisIndex: 0,
            data: pr,
          },
        ],
        xAxis,
        {
          yAxis: [
            {
              type: 'value',
              name: '',
              position: 'right',
              show: false,
              splitLine: {
                show: true,
              },
              max: 'dataMax',
            },
            {
              type: 'value',
              name: '',
              position: 'left',
              show: false,
              splitLine: {
                show: true,
              },
              max: 'dataMax',
            },
          ],
        }
      )
    },
    formatEarnings(d) {
      const xAxis = []
      const pe = []
      const pw = []
      const pf = []
      d?.intervals.forEach((interval, index) => {
        // ignore the last index
        if (index === d?.intervals?.length - 1) {
          return
        }
        xAxis.push(
          moment(
            Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format('dddd, MMM D')
        )
        const pool = interval?.pools?.find((p) => p.pool === this.poolName)
        pe.push((+pool.earnings * +interval.runePriceUSD) / 10 ** 8)
        pw.push((+pool.rewards * +interval.runePriceUSD) / 10 ** 8)
        pf.push(
          (+pool.totalLiquidityFeesRune * +interval.runePriceUSD) / 10 ** 8
        )
      })
      return this.basicChartFormat(
        (value) => `$ ${this.normalFormat(value)}`,
        [
          {
            type: 'bar',
            name: 'Liquidity Fee',
            stack: 'total',
            showSymbol: false,
            data: pf,
          },
          {
            type: 'bar',
            name: 'Rewards',
            stack: 'total',
            showSymbol: false,
            data: pw,
          },
          {
            type: 'line',
            name: 'Total Earnings',
            showSymbol: false,
            areaStyle: {
              color: 'rgba(243, 186, 47, 0.2)',
            },
            data: pe,
            smooth: true,
            lineStyle: {
              width: 2,
            },
            z: 3,
          },
        ],
        xAxis,
        {
          yAxis: [
            {
              type: 'value',
              position: 'left',
              show: false,
              splitLine: {
                show: true,
              },
              axisLine: {
                show: false,
              },
              min: 'dataMin',
              max: 'dataMax',
            },
          ],
        }
      )
    },
  },
}
</script>

<style lang="scss" scoped>
.pool-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: var(--card-bg-color);
  color: var(--sec-font-color);
  border-radius: 0.5rem;
  padding: 0.8rem;
}
.pool-overview {
  width: 100%;
  .chart-wrapper {
    border-color: transparent;
  }
}
</style>
