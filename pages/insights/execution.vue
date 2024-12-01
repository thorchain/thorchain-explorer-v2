<template>
  <div class="container-page">
    <div class="chart-inner-container">
      <Card title="Execution Quality Scatter">
        <VChart
          :option="executionData"
          :loading="!executionData"
          :autoresize="true"
          :loading-options="showLoading"
          :theme="chartTheme"
        />
      </Card>
    </div>
    <div class="chart-inner-container">
      <Card title="Pair Execution Quality">
        <div class="pool-nav-wrapper">
          <div>
            <span>Pair:</span>
            <Select
              :options="pairOptions"
              :option.sync="pairOption"
              name="pair"
            >
            </Select>
          </div>
        </div>
        <VChart
          :option="executionQuality"
          :loading="!executionQuality"
          :autoresize="true"
          :loading-options="showLoading"
          :theme="chartTheme"
        />
      </Card>
    </div>
  </div>
</template>

<script>
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { LineChart, BarChart, ScatterChart } from 'echarts/charts'
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
  ScatterChart,
])

export default {
  components: {
    VChart,
  },
  data() {
    return {
      executionData: undefined,
      executionQuality: undefined,
      executionQualityData: undefined,
      pairOptions: [],
      pairOption: {
        label: 'BTC.BTC <> ETH.ETH',
        value: 'BTC.BTC <> ETH.ETH',
      },
    }
  },

  watch: {
    pairOption(val) {
      this.formatBarExc()
    },
  },

  async mounted() {
    this.executionQualityData = (await this.$api.getExecutionQuality()).data
    this.formatExcQuality(this.executionQualityData)
    this.pairOptions = this.executionQualityData.map((it) => ({
      label: it.SWAP_PAIR,
      value: it.SWAP_PAIR,
    }))

    this.formatBarExc()
  },
  methods: {
    formatBarExc() {
      const pairDetails = []
      this.executionQualityData.forEach((it) => {
        if (it.SWAP_PAIR === this.pairOption.value) {
          pairDetails.push(it)
        }
      })

      const intervals = pairDetails.sort((a, b) => +a.INTERVAL - +b.INTERVAL)
      this.executionQuality = this.basicChartFormat(
        (value) => `$ ${this.$options.filters.number(value, '0,0.00a')}`,
        [
          {
            type: 'line',
            name: 'Execution Quality',
            showSymbol: false,
            data: intervals.map((it) => it.EXC_QUALITY),
          },
          {
            type: 'line',
            name: '100%',
            showSymbol: false,
            data: intervals.map((it) => 1),
          },
        ],
        intervals.map((it) => it.INTERVAL),
        {
          legend: {
            show: false,
          },
          grid: {
            left: '2%',
            right: '2%',
            bottom: '2%',
            containLabel: true,
          },
          yAxis: [
            {
              type: 'value',
              axisLine: { show: true },
              splitLine: { show: false },
              axisTick: { show: false },
              minorTick: { show: false },
              min: 'dataMin',
              max: 'dataMax',
              show: true,
              axisLabel: {
                formatter: (value) => this.$options.filters.percent(value, 2),
              },
            },
          ],
          xAxis: {
            type: 'category',
            boundaryGap: false,
            axisLine: { show: false },
            splitLine: { show: false },
            axisTick: { show: false },
            data: intervals.map((it) => it.INTERVAL),
            min: 'dataMin',
            max: 'dataMax',
            onZero: false,
          },
        },
        (param) => {
          return ` 
            <div class="tooltip-body">
               <span>
                <span>Quality</span>
                <b>${param[0].value ? this.$options.filters.percent(param[0].value, 2) : '-'}</b>
               </span>
               <span>
                <span>Count</span>
                <b>${intervals[param[0].dataIndex] ? intervals[param[0].dataIndex].COUNT : '-'}</b>
               </span>
            </div>`
        }
      )
    },
    formatExcQuality(d) {
      const sortedData = d.sort((a, b) => +a.INTERVAL - +b.INTERVAL)

      const seriesData = sortedData.map((item, index) => ({
        value: [item.INTERVAL, item.EXC_QUALITY, item.COUNT],
        pair: item.SWAP_PAIR,
        itemStyle: {
          color: this.assetColorPalette(item.SWAP_PAIR.split('<>')[0].trim()),
        },
      }))

      this.executionData = this.basicChartFormat(
        undefined,
        [
          {
            type: 'scatter',
            data: seriesData,
            symbolSize: (data) => {
              const size = Math.log(data[2] + 1) * 10
              return size > 30 ? 30 : size
            },
            label: {
              show: false,
              formatter: (params) => params.value[3],
              position: 'inside',
              fontWeight: 'bold',
            },
          },
        ],
        undefined,
        {
          xAxis: {
            type: 'category',
            splitLine: { show: false },
            axisTick: { show: false },
            boundaryGap: [0.05, 0.05],
          },
          yAxis: {
            type: 'value',
            name: 'Execution',
            splitLine: { show: false },
            axisTick: { show: false },
            min: (value) => 0.96,
            max: (value) => 1.08,
            axisLabel: {
              formatter: (value) => this.$options.filters.percent(value),
            },
          },
          grid: {
            left: '2%',
            right: '2%',
            bottom: '2%',
            containLabel: true,
          },
          tooltip: {
            trigger: 'item',
            formatter: (params) => `
                <small>Swap Pair:</small> ${params.data.pair}<br>
                <small>Count:</small> ${params.value[2]}<br>
                <small>Execution Quality:</small> ${this.$options.filters.percent(params.value[1], 3)}<br>
                <small>Interval:</small> ${params.value[0]}
            `,
          },
        }
      )
    },
  },
}
</script>

<style lang="scss">
.pool-nav-wrapper {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;

  > div {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

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
