<template>
  <Page class="pool-overview">
    <div class="cards-container">
      <info-card :options="poolDetailStats" />
      <card :is-loading="loading" :title="`${showAsset(poolName)} Earnings`">
        <VChart
          :option="earningsHistory"
          :loading="!earningsHistory"
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
import { BarChart, LineChart } from 'echarts/charts'
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
  BarChart,
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
      earningsHistory: undefined,
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
              filter: (v) => `$${this.$options.filters.number(v, '0,0.00a')}`,
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
              header: 'All Time Stats',
            },
            {
              name: 'Total Swaps',
              value: this.pool?.swapVolume / 10 ** 8,
              filter: (v) =>
                `${this.$options.filters.number(v, '0,0.00a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'Total Earning',
              value: this.pool?.earnings / 10 ** 8,
              filter: (v) =>
                `${this.$options.filters.number(v, '0,0.00a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'Average Slip',
              value: this.pool?.averageSlip / 10000,
              filter: (v) => `${this.$options.filters.percent(v, 2)}`,
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
      this.earningsHistory = this.formatEarnings(resEarning)

      const resDepth = (await this.$api.getPoolDepth(this.poolName, 30)).data
      this.depthHistory = this.formatDepth(resDepth)

      const resSwaps = (
        await this.$api.getSwapsHistory({
          interval: 'day',
          count: 30,
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
      const pn = []
      const pt = []
      const ps = []
      const psec = []
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
        ps.push(
          (+interval.synthRedeemVolumeUSD + +interval.synthMintVolumeUSD) /
            10 ** 2
        )
        pt.push(
          (+interval.fromTradeVolumeUSD + +interval.toTradeVolumeUSD) / 10 ** 2
        )
        pn.push(
          (+interval.toRuneVolumeUSD + +interval.toAssetVolumeUSD) / 10 ** 2
        )
        psec.push(
          (+interval.toSecuredVolumeUSD + +interval.fromSecuredVolumeUSD) /
            10 ** 2
        )
      })
      return this.basicChartFormat(
        (value) => `$ ${this.$options.filters.number(+value, '0,0.00a')}`,
        [
          {
            type: 'bar',
            name: 'Native Swaps',
            stack: 'total',
            showSymbol: false,
            data: pn,
          },
          {
            type: 'bar',
            name: 'Trade Swaps',
            stack: 'total',
            showSymbol: false,
            data: pt,
          },
          {
            type: 'bar',
            name: 'Synth Swaps',
            stack: 'total',
            showSymbol: false,
            data: ps,
          },
          {
            type: 'bar',
            name: 'Secured Swaps',
            stack: 'total',
            showSymbol: false,
            data: psec,
          },
        ],
        xAxis,
        undefined,
        (param) => {
          return `
            <div class="tooltip-header">
              ${param[0].name}
            </div>
            <div class="tooltip-body">
              ${param
                .sort((a, b) => {
                  return b.value - a.value
                })
                .map(
                  (p) => `
                  <span>
                    <div class="tooltip-item">
                      <div class="data-color" style="background-color: ${p.color}">
                      </div>
                      <span style="text-align: left;">
                        ${p.seriesName}
                      </span>
                    </div>
                    <b>$${p.value ? this.$options.filters.number(p.value, '0,0.00a') : '-'}</b>
                  </span>`
                )
                .join('')}
            </div>
            <span style="border-top: 1px solid var(--border-color); margin: 2px 0;"></span>
            <hr>
            <span class="tooltip-item space">
              <span>Total Volume</span>
              <b>$${this.$options.filters.number(
                param.reduce((a, c) => a + (c.value ? c.value : 0), 0),
                '0,0.00a'
              )}</b>
            </span>
            <span class="tooltip-item space">
              <span style="text-align: left;">
                Swap Count
              </span>
              <b>${this.$options.filters.number(d?.intervals[param[0]?.dataIndex]?.totalCount, '0,0.00a')}</b>
            </span>
          `
        }
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
        const earnings = (+pool?.earnings * +interval.runePriceUSD) / 10 ** 8
        const rewards = (+pool?.rewards * +interval.runePriceUSD) / 10 ** 8
        const liquidityFee =
          (+pool?.totalLiquidityFeesRune * +interval.runePriceUSD) / 10 ** 8

        pe.push(earnings)
        pw.push(rewards < 0 ? null : rewards)
        pf.push(liquidityFee)
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
          ...(pw.some((v) => v !== null)
            ? [
                {
                  type: 'bar',
                  name: 'Rewards',
                  stack: 'total',
                  showSymbol: false,
                  data: pw,
                },
              ]
            : []),
          {
            type: 'line',
            name: `LP Earnings`,
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
        },
        (param) => {
          const filteredParam = param.filter(
            (p) => p.seriesName !== 'Rewards' || p.value >= 0
          )

          if (filteredParam.length === 0) return ''

          return `
    <div class="tooltip-header">
      ${filteredParam[0].name}
    </div>
    <div class="tooltip-body">
      ${filteredParam
        .map(
          (p) => `
          <span>
            <div class="tooltip-item">
              <div class="data-color" style="background-color: ${p.color}"></div>
              <span style="text-align: left;">
                ${p.seriesName}
              </span>
            </div>
            <b>$${this.$options.filters.number(p.value, '0,0.00a')}</b>
          </span>`
        )
        .join('')}
           </div>
          `
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
  border-radius: $radius-lg;
  padding: $space-12;
}
.pool-overview {
  width: 100%;
  .chart-wrapper {
    border-color: transparent;
  }
}
</style>
