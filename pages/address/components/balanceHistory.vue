<template>
  <Card
    title="Balance History"
    :is-loading="loading"
    style="height: 100%; display: flex; flex-direction: column"
  >
    <div class="chart-header">
      <div class="unit-switcher">
        <label class="switch">
          <input
            type="checkbox"
            :checked="showValue"
            @change="showValue = !showValue"
          />
          <span class="slider round"></span>
        </label>
        <span class="unit-label">{{ showValue ? 'USD' : 'RUNE' }}</span>
      </div>
    </div>
    <VChart
      :option="chartOptions"
      :loading="!chartOptions"
      :autoresize="true"
      :loading-options="showLoading"
      :theme="chartTheme"
      style="flex: 1; min-height: 300px"
    />
  </Card>
</template>

<script>
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
import moment from 'moment'

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
  props: {
    address: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      loading: true,
      balanceData: [],
      chartOptions: undefined,
      showValue: false,
    }
  },
  computed: {},
  watch: {
    address: {
      handler() {
        this.fetchBalanceHistory()
      },
      immediate: true,
    },
    showValue: {
      handler() {
        if (this.balanceData.length > 0) {
          this.chartOptions = this.formatBalanceHistory(this.balanceData)
        }
      },
    },
  },
  methods: {
    async fetchBalanceHistory() {
      this.loading = true
      try {
        const response = await this.$api.getBalanceHistory(
          this.address,
          'day',
          30
        )
        this.balanceData = response.data || []
        this.chartOptions = this.formatBalanceHistory(this.balanceData)
      } catch (error) {
        console.error('Error fetching balance history:', error)
        this.balanceData = []
        this.chartOptions = undefined
      } finally {
        this.loading = false
      }
    },
    formatBalanceHistory(d) {
      const xAxis = []
      const balanceSeries = []
      const valueSeries = []

      d?.forEach((item) => {
        const time = moment(item.date * 1000).format('MMM DD')
        xAxis.push(time)

        const balance = parseFloat(item.balance) / 1e8
        const price = parseFloat(item.price)
        const value = balance * price

        balanceSeries.push(balance)
        valueSeries.push(value)
      })

      const series = this.showValue
        ? [
            {
              type: 'line',
              name: 'Balance Value (USD)',
              showSymbol: false,
              data: valueSeries,
              yAxisIndex: 0,
              itemStyle: {
                color: '#63FDD9',
              },
              areaStyle: {
                color: 'rgba(99, 253, 217, 0.1)',
              },
              smooth: true,
            },
          ]
        : [
            {
              type: 'line',
              name: 'Balance (RUNE)',
              showSymbol: false,
              data: balanceSeries,
              yAxisIndex: 0,
              itemStyle: {
                color: '#63FDD9',
              },
              areaStyle: {
                color: 'rgba(99, 253, 217, 0.1)',
              },
              smooth: true,
            },
          ]

      return this.basicChartFormat(
        (value) =>
          this.showValue
            ? `$${this.$options.filters.currency(value, '0,0a')}`
            : `${this.$options.filters.number(value, '0,0a')} RUNE`,
        series,
        xAxis,
        {
          grid: {
            left: '2%',
            right: '2%',
            containLabel: true,
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            axisLine: { show: false },
            splitLine: { show: false },
            axisTick: { show: false },
            data: xAxis,
            min: 'dataMin',
            max: 'dataMax',
            onZero: false,
          },
          yAxis: [
            {
              type: 'value',
              axisLine: { show: false },
              splitLine: { show: false },
              axisTick: { show: false },
              minorTick: { show: false },
              position: 'left',
              min: 'dataMin',
              max: 'dataMax',
              show: true,
              splitNumber: 2,
              axisLabel: {
                formatter: (value) =>
                  this.showValue
                    ? `$${this.$options.filters.number(value, '0,0a')}`
                    : `${this.$options.filters.number(value, '0,0a')} RUNE`,
              },
            },
          ],
        },
        (param) => {
          if (!param || !Array.isArray(param) || param.length === 0) return ''

          const date = param[0].name

          return `
            <div class="tooltip-header">
              ${date}
            </div>
            <div class="tooltip-body">
              ${param
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
                    <b>${
                      this.showValue
                        ? `$${this.$options.filters.number(p.value, '0,0.00')}`
                        : `${this.$options.filters.number(p.value, '0,0.00')} RUNE`
                    }</b>
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
.chart-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.unit-switcher {
  display: flex;
  align-items: center;
  justify-content: center;
}

.switch {
  position: relative;
  display: inline-block;
  width: 53px;
  height: 27px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border-color);
  transition: 0.4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 19px;
  width: 21px;
  border-radius: 50%;
  left: 4px;
  bottom: 4px;
  background-color: var(--sec-font-color);
  transition: 0.4s;
}

input:checked + .slider {
  background-color: var(--primary-color);
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.unit-label {
  font-size: 14px;
  color: var(--font-color);
  margin-left: 10px;
}

.tooltip-header {
  font-weight: bold;
  margin-bottom: 8px;
  color: var(--font-color);
}

.tooltip-body {
  .tooltip-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .data-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
  }
}
</style>
