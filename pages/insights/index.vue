<template>
  <div class="container-page">
    <div class="two-insight">
      <Card title="Swap Chart (from Flipside)">
        <VChart
          :option="swapChartVolume"
          :loading="!swapChartVolume"
          :autoresize="true"
        />
      </Card>
      <Card title="Swap Chart Normalized (from Flipside)">
        <VChart
          :option="swapChartVolumeNorm"
          :loading="!swapChartVolumeNorm"
          :autoresize="true"
        />
      </Card>
    </div>
    <div class="two-insight">
      <Card title="Fees/Reward Chart (from Flipside)">
        <VChart
          :option="feesRewardsChart"
          :loading="!feesRewardsChart"
          :autoresize="true"
        />
      </Card>
      <Card title="Fees/Reward Chart Normalized (from Flipside)">
        <VChart
          :option="feesRewardsChartNorm"
          :loading="!feesRewardsChartNorm"
          :autoresize="true"
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
  },
  data() {
    return {
      churnHistory: undefined,
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
    }
  },
  mounted() {
    this.$api.getSwapsWeekly().then(({ data }) => {
      this.swapsStats(data)
    })

    this.$api.getStatsDaily().then(({ data }) => {})

    this.$api.getFeesRewardsMonthly().then(({ data }) => {
      this.feesRewards(data)
    })
  },
  methods: {
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
          emphasis: {
            focus: 'series',
          },
          data: liquidityFees,
        },
        {
          name: 'Trade Swap Volume',
          type: 'bar',
          stack: 'Total',
          showSymbol: false,
          symbol: 'circle',
          emphasis: {
            focus: 'series',
          },
          data: rewards,
        },
      ]

      const formatter = this.focusFormatter(series, totalVolume, true)

      this.feesRewardsChart = this.basicChartFormat(
        undefined,
        series,
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
          legend: {
            type: 'scroll',
            pageIconColor: 'var(--primary-color)',
            icon: 'rect',
            textStyle: {
              color: 'var(--sec-font-color)',
            },
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
          emphasis: {
            focus: 'series',
          },
          data: nativeSwapVolume.reverse(),
        },
        {
          name: 'Trade Swap Volume',
          type: 'bar',
          stack: 'Total',
          showSymbol: false,
          symbol: 'circle',
          emphasis: {
            focus: 'series',
          },
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
          legend: {
            type: 'scroll',
            pageIconColor: 'var(--primary-color)',
            icon: 'rect',
            textStyle: {
              color: 'var(--sec-font-color)',
            },
          },
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
              max: 'dataMax',
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
          legend: {
            type: 'scroll',
            pageIconColor: 'var(--primary-color)',
            icon: 'rect',
            textStyle: {
              color: 'var(--sec-font-color)',
            },
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

.two-insight {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex-direction: column;

  @include md {
    flex-direction: row;
  }
}
</style>
