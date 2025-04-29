<template>
  <div class="container-page">
    <div class="chart-inner-container">
      <info-card :options="executionInfo"></info-card>
    </div>
    <suggestion-input
      :tags="pairOption"
      placeholder="Enter Pairs, press enter"
      label="Pairs"
      :suggestions="pairOptions"
      :format="false"
      @update:tags="updatePairs($event)"
    />
    <div v-if="pairOption.length > 0" class="chart-inner-container">
      <Card title="Execution Scatter">
        <VChart
          :option="scatterOptions"
          :loading="!scatterOptions"
          :autoresize="true"
          :loading-options="showLoading"
          :theme="chartTheme"
        />
      </Card>
      <Card title="Execution Line">
        <VChart
          :option="barOptions"
          :loading="!barOptions"
          :autoresize="true"
          :loading-options="showLoading"
          :theme="chartTheme"
        />
      </Card>
    </div>
    <span v-else> No option selected </span>
    <div class="footer-stat">
      <small>
        <sup>*</sup>
        The data is for the last 90 days performance.
      </small>
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
      scatterOptions: undefined,
      barOptions: undefined,
      executionQualityData: undefined,
      pairOptions: [],
      pairOption: ['BTC.BTC <> ETH.ETH'],
    }
  },

  computed: {
    executionInfo() {
      if (!this.executionQualityData) {
        return [
          {
            title: 'Performance',
            rowStart: 1,
            colSpan: 1,
            items: [
              {
                name: 'L1 Pairs',
              },
              {
                name: 'BTC.BTC Pairs',
              },
              {
                name: 'ETH.ETH Pairs',
              },
              {
                name: 'GAIA.ATOM Pairs',
              },
              {
                name: 'AVAX.AVAX Pairs',
              },
              {
                name: 'BSC.BNB Pairs',
              },
              {
                name: 'BCH.BCH Pairs',
              },
              {
                name: 'DOGE.DOGE Pairs',
              },
              {
                name: 'LTC.LTC Pairs',
              },
            ],
          },
        ]
      }

      return [
        {
          title: 'Performance',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'L1 Pairs',
              value: this.getPairsPerformance(
                this.getOnlyPairs([
                  'BTC.BTC',
                  'ETH.ETH',
                  'GAIA.ATOM',
                  'BSC.BNB',
                  'AVAX.AVAX',
                  'DOGE.DOGE',
                  'LTC.LTC',
                  'BCH.BCH',
                ])
              ),
              filter: (v) =>
                `${this.$options.filters.number(v * 10_000, '0,0.00')} bps`,
            },
            // {
            //   name: 'Stables',
            //   value: this.getPairsPerformance(
            //     this.getPairs([
            //       'ETH.USDT',
            //       'ETH.USDC',
            //       'AVAX.USDT',
            //       'BSC.USDT',
            //       'BSC.USDC',
            //       'AVAX.USDC',
            //       'ETH.LUSD',
            //       'ETH.DAI',
            //       'ETH.USDP',
            //       'ETH.GUSD',
            //     ])
            //   ),
            //   filter: (v) =>
            //     `${this.$options.filters.number(v * 10_000, '0,0.00')} bps`,
            // },
            {
              name: 'BTC.BTC Pairs',
              value: this.getPairsPerformance(this.getPairs(['BTC.BTC'])),
              filter: (v) =>
                `${this.$options.filters.number(v * 10_000, '0,0.00')} bps`,
            },
            {
              name: 'ETH.ETH Pairs',
              value: this.getPairsPerformance(this.getPairs(['ETH.ETH'])),
              filter: (v) =>
                `${this.$options.filters.number(v * 10_000, '0,0.00')} bps`,
            },
            {
              name: 'GAIA.ATOM Pairs',
              value: this.getPairsPerformance(this.getPairs(['GAIA.ATOM'])),
              filter: (v) =>
                `${this.$options.filters.number(v * 10_000, '0,0.00')} bps`,
            },
            {
              name: 'AVAX.AVAX Pairs',
              value: this.getPairsPerformance(this.getPairs(['AVAX.AVAX'])),
              filter: (v) =>
                `${this.$options.filters.number(v * 10_000, '0,0.00')} bps`,
            },
            {
              name: 'BSC.BNB Pairs',
              value: this.getPairsPerformance(this.getPairs(['BSC.BNB'])),
              filter: (v) =>
                `${this.$options.filters.number(v * 10_000, '0,0.00')} bps`,
            },
            {
              name: 'BCH.BCH Pairs',
              value: this.getPairsPerformance(this.getPairs(['BCH.BCH'])),
              filter: (v) =>
                `${this.$options.filters.number(v * 10_000, '0,0.00')} bps`,
            },
            {
              name: 'DOGE.DOGE Pairs',
              value: this.getPairsPerformance(this.getPairs(['DOGE.DOGE'])),
              filter: (v) =>
                `${this.$options.filters.number(v * 10_000, '0,0.00')} bps`,
            },
            {
              name: 'LTC.LTC Pairs',
              value: this.getPairsPerformance(this.getPairs(['LTC.LTC'])),
              filter: (v) =>
                `${this.$options.filters.number(v * 10_000, '0,0.00')} bps`,
            },
          ],
        },
      ]
    },
  },

  watch: {
    pairOption(val) {
      this.formatExcQuality()
      this.formatBarExc()
    },
  },

  async mounted() {
    this.executionQualityData = (await this.$api.getExecutionQuality()).data
    this.pairOptions = this.executionQualityData.map((it) => it.SWAP_PAIR)

    this.formatExcQuality()
    this.formatBarExc()
  },
  methods: {
    getPairs(pairs) {
      const ret = []
      const executionPairs = this.executionQualityData.map((it) =>
        it.SWAP_PAIR.split(' <> ')
      )
      for (let i = 0; i < executionPairs.length; i++) {
        const ep = executionPairs[i]
        if (ep.some((p) => pairs.includes(p))) {
          ret.push(this.executionQualityData[i])
        }
      }
      return ret
    },

    getOnlyPairs(pairs) {
      const ret = []
      const executionPairs = this.executionQualityData.map((it) =>
        it.SWAP_PAIR.split(' <> ')
      )
      for (let i = 0; i < executionPairs.length; i++) {
        const ep = executionPairs[i]
        if (ep.every((p) => pairs.includes(p))) {
          ret.push(this.executionQualityData[i])
        }
      }
      return ret
    },

    getPairsPerformance(results) {
      let qu = 0
      const sumUsd = results.reduce((a, c) => a + c.OUT_AMOUNT_USD, 0)
      for (let i = 0; i < results.length; i++) {
        const e = results[i]
        qu = Math.abs(1 - e.EXC_QUALITY) * e.OUT_AMOUNT_USD + qu
      }
      return qu / sumUsd
    },

    updatePairs(values) {
      this.pairOption = values
    },

    formatBarExc() {
      const pairDetails = []

      if (this.pairOption.includes('All')) {
        this.executionQualityData.forEach((it) => {
          const p = pairDetails.findIndex((p) => p.INTERVAL === it.INTERVAL)
          if (p >= 0) {
            pairDetails[p] = {
              COUNT: pairDetails[p].COUNT + it.COUNT,
              EXC_QUALITY:
                (pairDetails[p].EXC_QUALITY * pairDetails[p].COUNT +
                  it.EXC_QUALITY * it.COUNT) /
                (pairDetails[p].COUNT + it.COUNT),
              INTERVAL: pairDetails[p].INTERVAL,
              SWAP_PAIR: pairDetails[p].SWAP_PAIR,
            }
          } else {
            pairDetails.push(it)
          }
        })
      } else {
        this.executionQualityData.forEach((it) => {
          if (this.pairOption.includes(it.SWAP_PAIR)) {
            const p = pairDetails.findIndex((p) => p.INTERVAL === it.INTERVAL)
            if (p >= 0) {
              pairDetails[p] = {
                COUNT: pairDetails[p].COUNT + it.COUNT,
                EXC_QUALITY:
                  (pairDetails[p].EXC_QUALITY * pairDetails[p].COUNT +
                    it.EXC_QUALITY * it.COUNT) /
                  (pairDetails[p].COUNT + it.COUNT),
                INTERVAL: pairDetails[p].INTERVAL,
                SWAP_PAIR: pairDetails[p].SWAP_PAIR,
              }
            } else {
              pairDetails.push(it)
            }
          }
        })
      }

      const intervals = pairDetails.sort((a, b) => a.INTERVAL - b.INTERVAL)
      this.barOptions = this.basicChartFormat(
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
    formatExcQuality() {
      let pairedAssets
      if (this.pairOption.includes('All')) {
        pairedAssets = this.executionQualityData
      } else {
        pairedAssets = this.executionQualityData.filter((a) =>
          this.pairOption.includes(a.SWAP_PAIR)
        )
      }
      const sortedData = pairedAssets.sort((a, b) => +a.INTERVAL - +b.INTERVAL)

      const seriesData = sortedData.map((item, index) => ({
        value: [item.INTERVAL, item.EXC_QUALITY, item.COUNT],
        pair: item.SWAP_PAIR,
        amount: item.OUT_AMOUNT_USD,
        itemStyle: {
          color: this.vaultColor(item.SWAP_PAIR),
        },
      }))

      this.scatterOptions = this.basicChartFormat(
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
            min: 'dataMin',
            max: 'dataMax',
            axisLabel: {
              formatter: (value) => this.$options.filters.percent(value, 2),
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
                <small>Amount:</small> $${this.$options.filters.number(params.data.amount, '0,0.00a')}<br>
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

<style lang="scss" scoped>
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
  font-size: $font-size-s;
  padding: $space-0 0.1rem;

  .legend-fill {
    width: 5px;
    height: 5px;
    border-radius: $radius-full;
    margin-right: $space-5;
  }

  .value {
    font-weight: bold;
    margin-left: $space-5;
  }
}

.container-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
