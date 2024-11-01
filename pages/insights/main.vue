<template>
  <div class="container-page">
    <card title="RUNE" class="coin-info">
      <template #header>
        <coinmarketcap style="fill: var(--sec-font-color)" />
      </template>
      <info-card :options="coinMarketInfo" :inner="true" />
    </card>
    <div class="chart-inner-container">
      <Card title="Reserve income from Pools">
        <VChart
          :option="rewardsHistory"
          :loading="!rewardsHistory"
          :autoresize="true"
          :loading-options="showLoading"
          :theme="chartTheme"
        />
      </Card>
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
      <Card title="Fees/Block Reward Chart">
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
      <Card title="Fees/Block Reward Chart Normalized">
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
      <Card title="Supply / Burn">
        <VChart
          :option="supplyHistory"
          :loading="!supplyHistory"
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
import { orderBy } from 'lodash'
import FlipSide from '~/assets/images/flipside.svg?inline'
import Coinmarketcap from '~/assets/images/coinmarketcap.svg?inline'

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
    Coinmarketcap,
  },
  data() {
    return {
      churnHistory: undefined,
      rewardsHistory: undefined,
      supplyHistory: undefined,
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
          title: '',
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
              filter: (v) => `$${this.$options.filters.number(v, '0,0a')}`,
            },
            {
              name: 'Trade Volume',
              value: this.marketInfo.tradeVolume,
              filter: (v) => `$${this.$options.filters.number(v, '0,0a')}`,
              progress: {
                data: this.marketInfo.change_24h,
                down: this.marketInfo.change_24h,
                filter: (v) => this.$options.filters.percent(v, '0,0', 1),
              },
            },
            {
              name: 'Total Supply',
              value: this.marketInfo.totalSupply,
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
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

    this.getCoinMarketInfo()
    this.$api.getEarningHistory(60).then(({ data }) => {
      this.supplyBurn(data)
      this.rewardsHistory = this.formatRewards(data)
    })
  },
  methods: {
    formatRewards(d) {
      const top = 6
      const poolEarnings = orderBy(
        d.intervals[d.intervals.length - 2].pools,
        [(o) => Math.abs(+o.rewards)],
        ['desc']
      )
        .filter((p) => p.pool !== 'dev_fund_reward' && p.pool !== 'income_burn')
        .slice(0, top)
        .map((p) => p.pool)

      const xAxis = []
      const pr = []
      const pt = []

      d?.intervals.forEach((interval, index) => {
        if (index === d?.intervals?.length - 1) {
          return
        }

        // Date
        const date = moment(
          Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
        )
        xAxis.push(date.format('dddd, MMM D'))

        let otherEarnings = interval.pools.filter(
          (p) =>
            !poolEarnings.slice(0, top).includes(p.pool) &&
            p.pool !== 'income_burn' &&
            p.pool !== 'dev_fund_reward'
        )

        // sum them all
        otherEarnings = otherEarnings.reduce(
          (a, c) => a + (-1 * +c.rewards * +interval.runePriceUSD) / 1e8,
          0
        )

        if (index === 0) {
          pr.push({
            type: 'bar',
            name: 'Other Pools',
            showSymbol: false,
            stack: 'Total',
            data: [otherEarnings],
          })
        } else {
          pr[0].data.push(otherEarnings)
        }

        // Pool Earning
        let total = 0
        for (let pi = 0; pi < top; pi++) {
          const pool = interval.pools.find((p) => p.pool === poolEarnings[pi])
          const value = (+pool.rewards * -1 * +interval.runePriceUSD) / 1e8
          total += value

          const earning = {
            value,
          }

          if (index === 0) {
            pr.push({
              type: 'bar',
              name: this.showAsset(poolEarnings[pi]),
              showSymbol: false,
              stack: 'Total',
              data: [earning],
            })
          } else {
            pr[pi + 1].data.push(earning)
          }
        }

        pt.push({
          value: total,
        })
      })

      return this.basicChartFormat(
        (value) => `$${this.normalFormat(value, '0,0.00a')}`,
        [
          ...pr,
          {
            type: 'line',
            name: 'Total Income',
            showSymbol: false,
            areaStyle: {
              color: 'rgba(0, 0, 47, 0.2)',
            },
            data: pt,
            smooth: true,
            lineStyle: {
              width: 2,
            },
            z: 3,
          },
        ],
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
        },
        (param) => {
          return `
            <div class="tooltip-header">
              ${param[0].name}
            </div>
            <div class="tooltip-body">
              ${param
                .filter((a) => a.value)
                .sort((a, b) => {
                  if (
                    a.seriesName === 'Total Income' ||
                    a.seriesName === 'Other Pools'
                  )
                    return 1
                  if (
                    b.seriesName === 'Total Income' ||
                    b.seriesName === 'Other Pools'
                  )
                    return -1
                  return b.value - a.value
                })
                .map(
                  (p, i) => `
                  ${
                    param.length - 2 === i
                      ? ` <span style="border-top: 1px solid var(--border-color); margin: 2px 0;"></span>`
                      : ''
                  }
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
          `
        }
      )
    },
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
      const filteredData = []
      d.forEach((interval, index) => {
        if (interval.affiliate === 'No Affiliate') {
          return
        }
        filteredData.push(interval)
      })
      const sortedData = filteredData.sort(
        (a, b) => b.total_volume_usd - a.total_volume_usd
      )
      sortedData.forEach((interval) => {
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
          name: 'Block Rewards',
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
    supplyBurn(data) {
      try {
        const xAxis = []
        const su = []
        const bu = []
        let burnCumulative = 0

        if (data.length === 0) {
          console.warn('No earnings data available to format.')
          return
        }

        data.intervals.forEach((interval, index) => {
          // ignore the last day
          if (index === data.intervals.length - 1) {
            return
          }

          // fill the data
          xAxis.push(
            moment(
              Math.floor((+interval.endTime + +interval.startTime) / 2) * 1e3
            ).format('dddd, MMM D')
          )
          const burns = interval?.pools?.find(
            (p) => p.pool === 'income_burn'
          )?.earnings

          const burn = +burns / 1e8
          burnCumulative += burn
          bu.push(burn)
          su.push(5 * 1e8 - burnCumulative)
        })

        this.supplyHistory = this.basicChartFormat(
          (value) => `$ ${this.normalFormat(value, '0,0.00')}`,
          [
            {
              type: 'line',
              name: 'Max Supply',
              showSymbol: false,
              data: su,
              smooth: true,
              yAxisIndex: 0,
            },
            {
              type: 'bar',
              name: 'Burned Rune',
              showSymbol: false,
              data: bu,
              yAxisIndex: 1,
              itemStyle: {
                borderRadius: [8, 8, 0, 0],
                color: '#ff9962',
              },
            },
          ],
          xAxis,
          {
            yAxis: [
              {
                type: 'value',
                name: 'Max Supply',
                position: 'left',
                show: false,
                splitLine: {
                  show: true,
                },
                min: su[su.length - 1] - 50,
                max: 'dataMax',
              },
              {
                type: 'value',
                name: 'Burned Rune',
                position: 'right',
                show: false,
                splitLine: {
                  show: true,
                },
                min: 'dataMin',
                max: 'dataMax',
              },
            ],
          },
          (param) => {
            return `
        <div class="tooltip-header">
          <div class="data-color" style="background-color: ${param[0].color}"></div>
          ${param[0].name}
        </div>
        <div class="tooltip-body">
          ${param
            .map(
              (p) => `<span>
              <span>${p.seriesName}</span>
              <b>${p.value ? this.$options.filters.number(p.value, '0,0.00') : '-'}</b>
            </span>`
            )
            .join('')}
        </div>
      `
          }
        )
      } catch (error) {
        console.error('Error fetching supply history:', error)
      }
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
