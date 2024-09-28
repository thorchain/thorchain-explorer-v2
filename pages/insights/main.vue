<template>
  <div class="container-page">
    <div class="coin-info">
      <info-card :options="coinMarketInfo" />
    </div>
    <div class="chart-inner-container">
      <Card title="Type Swap Chart">
        <template #header>
          <flip-side style="fill: var(--sec-font-color)"></flip-side>
        </template>
        <VChart
          :option="swapChartVolume"
          :loading="!swapChartVolume"
          :autoresize="true"
          :loading-options="showLoading"
          :theme="chartTheme"
        />
      </Card>
      <Card title="Swap Chart Normalized">
        <template #header>
          <flip-side style="fill: var(--sec-font-color)"></flip-side>
        </template>
        <VChart
          :option="swapChartVolumeNorm"
          :loading="!swapChartVolumeNorm"
          :autoresize="true"
          :loading-options="showLoading"
          :theme="chartTheme"
        />
      </Card>
    </div>
    <div class="chart-inner-container">
      <Card title="Fees/Reward Chart">
        <template #header>
          <flip-side style="fill: var(--sec-font-color)"></flip-side>
        </template>
        <VChart
          :option="feesRewardsChart"
          :loading="!feesRewardsChart"
          :autoresize="true"
          :loading-options="showLoading"
          :theme="chartTheme"
        />
      </Card>
      <Card title="Fees/Reward Chart Normalized">
        <template #header>
          <flip-side style="fill: var(--sec-font-color)"></flip-side>
        </template>
        <VChart
          :option="feesRewardsChartNorm"
          :loading="!feesRewardsChartNorm"
          :autoresize="true"
          :loading-options="showLoading"
          :theme="chartTheme"
        />
      </Card>
    </div>
    <div class="chart-inner-container">
      <Card title="Top 20 Affiliate by Volume (30D)">
        <template #header>
          <flip-side style="fill: var(--sec-font-color)"></flip-side>
        </template>
        <VChart
          :option="affiliateVolumeChart"
          :loading="!affiliateVolumeChart"
          :autoresize="true"
          :loading-options="showLoading"
          :theme="chartTheme"
        />
      </Card>
      <Card title="Top 20 Affiliate earned by Wallet (30D)">
        <template #header>
          <flip-side style="fill: var(--sec-font-color)"></flip-side>
        </template>
        <VChart
          :option="affiliateChart"
          :loading="!affiliateChart"
          :autoresize="true"
          :loading-options="showLoading"
          :theme="chartTheme"
        />
      </Card>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'

import FlipSide from '~/assets/images/flipside.svg?inline'

use([
  SVGRenderer,
  GridComponent,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
])

export default {
  components: {
    VChart,
    FlipSide,
  },
  data() {
    return {
      churnHistory: undefined,
      marketInfo: {
        price: undefined,
        rank: undefined,
        marketCap: undefined,
        tradeVolume: undefined,
        totalSupply: undefined,
      },
      cols: [
        {
          label: 'Churn Occurred',
          field: 'timestamp',
        },
        {
          label: 'Block ID',
          field: 'BLOCK_ID',
          type: 'number',
          tdClass: 'mono',
          formatFn: this.normalFormat,
        },
        {
          label: 'Churn Length (days)',
          field: 'DAYS_SINCE_LAST_CHURN',
          type: 'number',
          tdClass: 'mono',
        },
      ],
      tvlOption: undefined,
      swapChartVolumeNorm: undefined,
      swapChartVolume: undefined,
      feesRewardsChart: undefined,
      feesRewardsChartNorm: undefined,
      affiliateVolumeChart: undefined,
      affiliateChart: undefined,
    }
  },

  computed: {
    coinMarketInfo() {
      return [
        {
          title: 'RUNE-CoinMarketCap',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Price',
              value: this.marketInfo.price,
              filter: (v) => `${this.$options.filters.currency(v)}`,
              progress: {
                data: this.marketInfo.percent_change_24h,
                down: this.marketInfo.percent_change_24h,
                filter: (v) => this.$options.filters.percent(v, '0,0', 1),
              },
            },
            {
              name: 'Crypto Rank',
              value: this.marketInfo.rank,
            },
            {
              name: 'Market Cap',
              value: this.marketInfo.marketCap,
              filter: (v) => `$${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: 'Trade Volume',
              value: this.marketInfo.tradeVolume,
              filter: (v) => `$${this.$options.filters.number(v, '0,0')}`,
              progress: {
                data: this.marketInfo.change_24h,
                down: this.marketInfo.change_24h,
                filter: (v) => this.$options.filters.percent(v, '0,0', 1),
              },
            },
            {
              name: 'Total Supply',
              value: this.marketInfo.totalSupply,
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,0')}`,
            },
          ],
        },
      ]
    },
  },

  mounted() {
    this.$api.getSwapsWeekly().then(({ data }) => {
      this.swapsStats(data)
    })

    this.$api.getFeesRewardsMonthly().then(({ data }) => {
      this.feesRewards(data)
    })

    this.$api.getAffiliateSwapsByWallet().then(({ data }) => {
      this.affiliateWallets(data)
    })

    this.$api.getAffiliateByWallet().then(({ data }) => {
      this.affiliateEarningsWallets(data)
    })
    this.getCoinMarketInfo()
  },
  methods: {
    async getCoinMarketInfo() {
      try {
        const response = await this.$api.getCoinMarketInfo()
        const data = response.data

        this.marketInfo.price = data.quote.USD.price
        this.marketInfo.rank = data.cmc_rank
        this.marketInfo.marketCap = data.quote.USD.market_cap
        this.marketInfo.tradeVolume = data.quote.USD.volume_24h
        this.marketInfo.change_24h = data.quote.USD.volume_change_24h
        this.marketInfo.percent_change_24h = data.quote.USD.percent_change_24h
        this.marketInfo.totalSupply = data.total_supply
      } catch (error) {
        console.error('Error coin market info:', error)
      }
    },
    affiliateWallets(d) {
      const xAxis = []
      const volume = []
      d.forEach((interval, index) => {
        if (interval.affiliate === 'No Affiliate') {
          return
        }
        xAxis.push(interval.affiliate)
        volume.push(interval.total_volume_usd)
      })

      let colors = ['#63FDD9', '#00CCFF', '#F3BA2F', '#FF4954']
      if (this.theme === 'light') {
        colors = ['#3ca38b', '#00CCFF', '#F3BA2F', '#FF4954']
      }

      const series = [
        {
          name: 'Volume',
          type: 'bar',
          stack: 'Total',
          showSymbol: false,
          symbol: 'circle',
          emphasis: {
            focus: 'series',
          },
          data: volume,
          itemStyle: {
            color(param) {
              return colors[param.dataIndex % 4]
            },
          },
        },
      ]

      this.affiliateVolumeChart = this.basicChartFormat(
        (value) => `$${this.$options.filters.number(value, '0,0.00 a')}`,
        series,
        xAxis,
        {
          legend: {
            show: false,
          },
          yAxis: [
            {
              type: 'value',
              name: '',
              position: 'right',
              show: false,
              splitLine: {
                show: true,
              },
            },
          ],
        }
      )
    },
    affiliateEarningsWallets(d) {
      const xAxis = []
      const volume = []
      d.forEach((interval, index) => {
        xAxis.push(interval.affiliate)
        volume.push(interval.affiliate_fees_usd)
      })

      let colors = ['#63FDD9', '#00CCFF', '#F3BA2F', '#FF4954']
      if (this.theme === 'light') {
        colors = ['#3ca38b', '#00CCFF', '#F3BA2F', '#FF4954']
      }

      const series = [
        {
          name: 'Volume',
          type: 'bar',
          stack: 'Total',
          showSymbol: false,
          symbol: 'circle',
          emphasis: {
            focus: 'series',
          },
          data: volume,
          itemStyle: {
            color(param) {
              return colors[param.dataIndex % 4]
            },
          },
        },
      ]

      this.affiliateChart = this.basicChartFormat(
        (value) => `$${this.$options.filters.number(value, '0,0.00 a')}`,
        series,
        xAxis,
        {
          legend: {
            show: false,
          },
          yAxis: [
            {
              type: 'value',
              name: '',
              position: 'right',
              show: false,
              splitLine: {
                show: true,
              },
            },
          ],
        }
      )
    },
    focusFormatter(series, totalVolume, axis = false) {
      let colors = ['#63FDD9', '#00CCFF', '#F3BA2F', '#FF4954']
      if (this.theme === 'light') {
        colors = ['#3ca38b', '#00CCFF', '#F3BA2F', '#FF4954']
      }

      if (axis) {
        const formatter = (param) => {
          return `
            <div class="tooltip-header">
              ${param[0].name}
            </div>
            <div class="tooltip-body">
              ${param
                .map((p) => {
                  if (p.value > 0) {
                    return `
                  <div class="tooltip-body">
                    <span>
                      <span class="series-name-color">
                        <div class="data-color" style="background-color: ${p.color}"></div>
                        ${p.seriesName}
                      </span>
                      <b>$${this.$options.filters.number(p.value, '0,0.00 a')}</b>
                    </span>
                  </div>
                  `
                  } else {
                    return ''
                  }
                })
                .join('\n')}
              <span class="tooltip-total">
                <span>Total</span>
                <b>$${this.$options.filters.number(totalVolume[param[0].dataIndex], '0,0.00 a')}</b>
              </span>
            </div>
          `
        }

        return formatter
      }

      const formatter = (param) => {
        return `
            <div class="tooltip-header">
              ${param.name}
            </div>
            <div class="tooltip-body">
              ${series
                .map((p, i) => {
                  if (p.data[param.dataIndex] > 0) {
                    return `
                    <span>
                      <span class="series-name-color">
                        <div class="data-color" style="background-color: ${colors[i]}"></div>
                        ${p.name}
                      </span>
                      <b style="color: ${param.seriesIndex === i ? param.color : 'rgb(102, 102, 102)'}">$${this.$options.filters.number(p.data[param.dataIndex], '0,0.00 a')}</b>
                    </span>
                  `
                  } else {
                    return ''
                  }
                })
                .join('\n')}
              <span class="tooltip-total">
                <span>Total</span>
                <b>$${this.$options.filters.number(totalVolume[param.dataIndex], '0,0.00 a')}</b>
              </span>
            </div>
          `
      }

      return formatter
    },
    feesRewards(d) {
      const xAxis = []
      const liquidityFees = []
      const rewards = []
      const halfLine = []
      const pctLiquidityFees = []
      const totalVolume = []
      d.forEach((interval, index) => {
        xAxis.push(moment(interval.date).format('YY/MM/DD'))
        liquidityFees.push(interval.liquidity_fees_usd)
        rewards.push(interval.block_rewards_usd)
        halfLine.push(interval.half_line)
        totalVolume.push(interval.fees_plus_rewards)
        pctLiquidityFees.push(interval.pct_liquidty_fees)
      })

      const series = [
        {
          name: 'Liquidity Fees',
          type: 'bar',
          stack: 'Total',
          showSymbol: false,
          symbol: 'circle',
          data: liquidityFees,
        },
        {
          name: 'Rewards',
          type: 'bar',
          stack: 'Total',
          showSymbol: false,
          symbol: 'circle',
          data: rewards,
        },
      ]

      const formatter = this.focusFormatter(series, totalVolume, true)

      this.feesRewardsChart = this.basicChartFormat(
        undefined,
        series,
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
            },
          ],
        },
        formatter
      )

      const normSeries = series.map((s, i) => {
        return {
          name: s.name,
          type: 'bar',
          stack: 'total',
          yAxisIndex: 0,
          data: s.data.map((d, j) => d / totalVolume[j]),
        }
      })

      normSeries.push({
        name: 'Half Line',
        type: 'line',
        stack: 'Total',
        showSymbol: false,
        symbol: 'circle',
        emphasis: {
          focus: 'series',
        },
        yAxisIndex: 1,
        data: halfLine,
      })

      this.feesRewardsChartNorm = this.basicChartFormat(
        (value) => `${this.percentageFormat(value, 2)}`,
        normSeries,
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
              max: 1,
            },
            {
              type: 'value',
              name: '',
              position: 'left',
              show: false,
              splitLine: {
                show: true,
              },
              max: 1,
            },
          ],
        }
      )
    },
    swapsStats(d) {
      const xAxis = []
      const taSwapVolume = []
      const synthSwapVolume = []
      const nativeSwapVolume = []
      const affiliateFees = []
      let totalVolume = []
      d.forEach((interval, index) => {
        if (index % 2 === 1) {
          nativeSwapVolume[Math.floor(index / 2)] +=
            interval.native_swap_volume_usd
          synthSwapVolume[Math.floor(index / 2)] +=
            interval.synth_swap_volume_usd
          taSwapVolume[Math.floor(index / 2)] += interval.ta_swap_volume_usd
          affiliateFees[Math.floor(index / 2)] +=
            interval.total_affiliate_fees_usd
          totalVolume[Math.floor(index / 2)] +=
            interval.native_swap_volume_usd +
            interval.synth_swap_volume_usd +
            interval.ta_swap_volume_usd +
            interval.total_affiliate_fees_usd
          return
        }
        xAxis.push(moment(interval.date).format('YY/MM/DD'))
        nativeSwapVolume.push(interval.native_swap_volume_usd)
        synthSwapVolume.push(interval.synth_swap_volume_usd)
        taSwapVolume.push(interval.ta_swap_volume_usd)
        affiliateFees.push(interval.total_affiliate_fees_usd)
        totalVolume.push(
          interval.native_swap_volume_usd +
            interval.synth_swap_volume_usd +
            interval.ta_swap_volume_usd +
            interval.total_affiliate_fees_usd
        )
      })

      totalVolume = totalVolume.reverse()

      const series = [
        {
          name: 'Native Swap Volume',
          type: 'bar',
          stack: 'Total',
          showSymbol: false,
          symbol: 'circle',
          data: nativeSwapVolume.reverse(),
        },
        {
          name: 'Trade Swap Volume',
          type: 'bar',
          stack: 'Total',
          showSymbol: false,
          symbol: 'circle',
          data: taSwapVolume.reverse(),
        },
        {
          name: 'Synth Swap Volume',
          type: 'bar',
          stack: 'Total',
          showSymbol: false,
          symbol: 'circle',
          emphasis: {
            focus: 'series',
          },
          data: synthSwapVolume.reverse(),
        },
        {
          name: 'Affiliate fees Volume',
          type: 'bar',
          stack: 'Total',
          showSymbol: false,
          symbol: 'circle',
          emphasis: {
            focus: 'series',
          },
          data: affiliateFees.reverse(),
        },
      ]

      const formatter = this.focusFormatter(series, totalVolume)

      this.swapChartVolume = this.basicChartFormat(
        undefined,
        series,
        xAxis.reverse(),
        {
          tooltip: {
            confine: true,
            valueFormatter: (value) => `$ ${this.normalFormat(value)}`,
            formatter,
            className: 'custom-tooltip',
          },
          yAxis: [
            {
              type: 'value',
              name: '',
              position: 'right',
              show: false,
              splitLine: {
                show: true,
              },
            },
          ],
        },
        undefined
      )

      const normSeries = series.map((s, i) => {
        return {
          name: s.name,
          type: 'bar',
          stack: 'total',
          data: s.data.map((d, j) => d / totalVolume[j]),
        }
      })

      this.swapChartVolumeNorm = this.basicChartFormat(
        (value) => `${this.percentageFormat(value, 2)}`,
        normSeries,
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
              max: 1,
            },
          ],
        }
      )
    },
  },
}
</script>

<style lang="scss">
.echarts {
  width: 100%;
  height: 400px;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  padding: 0 0.1rem;

  .legend-fill {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    margin-right: 5px;
  }

  .value {
    font-weight: bold;
    margin-left: 5px;
  }
}

.container-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
