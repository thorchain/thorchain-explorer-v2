<template>
  <Card
    title="Balance History"
    :is-loading="loading"
    style="height: 100%; display: flex; flex-direction: column"
  >
    <template #header>
      <div class="card-header-content">
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
    </template>
    <VChart
      v-if="!loading && chartOptions"
      :option="chartOptions"
      :loading="!chartOptions"
      :autoresize="true"
      :loading-options="showLoading"
      :theme="chartTheme"
      class="address-history-chart"
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
    getUniqueValues(values, precision = 2) {
      const rounded = values.map(
        (v) => Math.round(v * Math.pow(10, precision)) / Math.pow(10, precision)
      )
      return [...new Set(rounded)]
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

      const currentSeries = this.showValue ? valueSeries : balanceSeries
      const uniqueValues = this.getUniqueValues(currentSeries)

      const series = this.showValue
        ? [
            {
              type: 'line',
              name: 'Balance Value (USD)',
              showSymbol: false,
              data: valueSeries,
              areaStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    {
                      offset: 0,
                      color: 'rgba(99, 253, 217, 0.3)',
                    },
                    {
                      offset: 1,
                      color: 'rgba(99, 253, 217, 0.05)',
                    },
                  ],
                },
              },
            },
          ]
        : [
            {
              type: 'line',
              name: 'Balance (RUNE)',
              showSymbol: false,
              data: balanceSeries,
              areaStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    {
                      offset: 0,
                      color: 'rgba(99, 253, 217, 0.3)',
                    },
                    {
                      offset: 1,
                      color: 'rgba(99, 253, 217, 0.05)',
                    },
                  ],
                },
              },
            },
          ]

      return this.basicChartFormat(
        (value) => {
          return this.showValue
            ? `${this.$options.filters.currency(value, '0,0.00')}`
            : `${this.$options.filters.number(value, '0,0.00')} RUNE`
        },
        series,
        xAxis,
        {
          legend: {
            show: false,
          },
          grid: {
            left: '2%',
            right: '2%',
            bottom: '2%',
            top: '2%',
            containLabel: true,
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            splitLine: {
              show: true,
              lineStyle: {
                color: 'rgba(255, 255, 255, 0.05)',
                type: 'dashed',
              },
            },
            axisLabel: {
              fontSize: 11,
              margin: 12,
              padding: [4, 8],
            },
            axisTick: { show: false },
            axisLine: { show: false },
            data: xAxis,
            min: 'dataMin',
            max: 'dataMax',
            onZero: false,
          },
          yAxis: [
            {
              type: 'value',
              splitLine: {
                show: true,
                lineStyle: {
                  color: 'rgba(255, 255, 255, 0.05)',
                  type: 'dashed',
                },
              },
              axisTick: {
                show: false,
                lineStyle: {
                  color: 'rgba(255, 255, 255, 0.1)',
                },
              },
              position: 'left',
              min(val) {
                const offset = val.max - val.min
                return Math.max(0, val.min - offset)
              },
              max: 'dataMax',
              show: true,
              splitNumber: 4,
              axisLine: { show: false },
              axisLabel: {
                fontSize: 10,
                margin: 12,
                padding: [4, 8],
                formatter: (value) => {
                  return `${this.$options.filters.number(value, '0,0a')} RUNE`
                },
              },
            },
          ],
        },
        (param) => {
          if (!param || !Array.isArray(param) || param.length === 0) return ''

          const date = param[0].name

          return `
          <div class="tooltip-header">
            <div class="data-color" style="background-color: ${param[0].color}"></div>
            ${date}
          </div>
          <div class="tooltip-body">
            ${param
              .map(
                (p) => `
                <span>
                  <div class="tooltip-item">
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
.card-header-content {
  display: flex;
  align-items: center;
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

.address-history-chart {
  height: 250px;
  min-height: 250px;
}
</style>
