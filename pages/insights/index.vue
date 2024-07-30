<template>
  <div class="container-page">
    <Card title="Total Value Locked (from Flipside)">
      <VChart
        v-if="tvlOption"
        class="chart"
        :option="tvlOption"
        :loading="!tvlOption"
        :autoresize="true"
      />
    </Card>
    <Card title="Rune Price History (from Flipside)">
      <VChart
        v-if="runePriceOption"
        :option="runePriceOption"
        :loading="!runePriceOption"
        :autoresize="true"
      />
    </Card>
    <Card title="Swap Count Chart (from Flipside)">
      <VChart
        v-if="swapCountChart"
        :option="swapCountChart"
        :loading="!swapCountChart"
        :autoresize="true"
      />
    </Card>
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
import { runeCur } from '~/utils'

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
      runePriceOption: undefined,
      swapCountChart: undefined,
    }
  },
  mounted() {
    this.$api
      .getFlipTVL()
      .then(({ data }) => {
        this.flipTVLFormat(data)
      })
      .catch((e) => {
        console.error(e)
      })

    this.$api
      .getRunePrice()
      .then(({ data }) => {
        this.runePriceFormat(data)
      })
      .catch((e) => {
        console.error(e)
      })

    this.$api
      .getDailySwap()
      .then(({ data }) => {
        this.dailySwapFormat(data)
      })
      .catch((e) => {
        console.error(e)
      })
  },
  methods: {
    flipTVLFormat(d) {
      const xAxis = []
      const tvp = []
      const tvl = []
      const tvb = []
      d.forEach((interval) => {
        xAxis.push(moment(interval.DAY).format('YY/MM/DD'))
        tvp.push(interval.total_value_pooled)
        tvl.push(interval.total_value_locked)
        tvb.push(interval.total_value_bonded)
      })

      const option = {
        title: {
          show: false,
        },
        tooltip: {
          confine: true,
          trigger: 'axis',
          valueFormatter: (value) => `${this.normalFormat(value)} ${runeCur()}`,
        },
        legend: {
          x: 'center',
          y: 'bottom',
          icon: 'rect',
          textStyle: {
            color: 'var(--font-color)',
          },
        },
        xAxis: {
          data: xAxis.reverse(),
          boundaryGap: false,
          splitLine: {
            show: false,
          },
          axisLine: {
            lineStyle: {
              color: '#9f9f9f',
            },
          },
          axisLabel: {
            color: '#9f9f9f',
            fontFamily: 'ProductSans',
          },
        },
        yAxis: {
          show: false,
        },
        grid: {
          left: '20px',
          right: '20px',
        },
        series: [
          {
            type: 'line',
            name: 'Total Value Locked (In Rune)',
            showSymbol: false,
            data: tvl.reverse(),
            smooth: true,
          },
          {
            type: 'line',
            name: 'Total Value Pooled (In Rune)',
            showSymbol: false,
            data: tvp.reverse(),
            smooth: true,
          },
          {
            type: 'line',
            name: 'Total Value Bonded (In Rune)',
            showSymbol: false,
            data: tvb.reverse(),
            smooth: true,
          },
        ],
      }

      this.tvlOption = option
    },
    runePriceFormat(d) {
      const xAxis = []
      const runePrice = []
      const determinPrice = []
      d.forEach((interval) => {
        xAxis.push(moment(interval.date).format('YY/MM/DD HH:MM A'))
        runePrice.push(interval.daily_rune_price)
        determinPrice.push(interval.deterministic_rune_price)
      })

      const option = {
        title: {
          show: false,
        },
        tooltip: {
          confine: true,
          trigger: 'axis',
          valueFormatter: (value) => `$${value.toFixed(2)}`,
        },
        legend: {
          x: 'center',
          y: 'bottom',
          icon: 'rect',
          textStyle: {
            color: 'var(--font-color)',
          },
        },
        xAxis: {
          data: xAxis,
          boundaryGap: false,
          splitLine: {
            show: false,
          },
          axisLine: {
            lineStyle: {
              color: '#9f9f9f',
            },
          },
          axisLabel: {
            color: '#9f9f9f',
            fontFamily: 'ProductSans',
          },
        },
        yAxis: {
          show: false,
        },
        grid: {
          left: '20px',
          right: '20px',
        },
        series: [
          {
            type: 'line',
            name: 'Rune Price',
            showSymbol: false,
            data: runePrice,
            smooth: true,
          },
          {
            type: 'line',
            name: 'Deterministic Rune Price',
            showSymbol: false,
            data: determinPrice,
            smooth: true,
          },
        ],
      }

      this.runePriceOption = option
    },
    dailySwapFormat(d) {
      const xAxis = []
      const swapCount = []
      const cumSwapCount = []
      const uniqueSwapperCount = []
      d.forEach((interval) => {
        xAxis.push(moment(interval.DATE).format('YY/MM/DD'))
        swapCount.push(interval.SWAP_COUNT)
        cumSwapCount.push(interval.SWAP_COUNT_CUMULATIVE)
        uniqueSwapperCount.push(interval.UNIQUE_SWAPERS)
      })

      const option = {
        title: {
          show: false,
        },
        tooltip: {
          confine: true,
          trigger: 'axis',
        },
        legend: {
          x: 'center',
          y: 'bottom',
          icon: 'rect',
          textStyle: {
            color: 'var(--font-color)',
          },
        },
        xAxis: {
          data: xAxis,
          boundaryGap: false,
          splitLine: {
            show: false,
          },
          axisLine: {
            lineStyle: {
              color: '#9f9f9f',
            },
          },
          axisLabel: {
            color: '#9f9f9f',
            fontFamily: 'ProductSans',
          },
        },
        yAxis: [
          {
            show: false,
          },
          {
            show: false,
          },
        ],
        grid: {
          left: '20px',
          right: '20px',
        },
        series: [
          {
            type: 'bar',
            name: 'Swap Count',
            yAxisIndex: 0,
            showSymbol: false,
            data: swapCount,
            smooth: true,
          },
          {
            type: 'bar',
            name: 'Unique Swappers Count',
            yAxisIndex: 0,
            showSymbol: false,
            data: uniqueSwapperCount,
            smooth: true,
          },
          {
            type: 'line',
            name: 'Cumluative Swap Count',
            yAxisIndex: 1,
            showSymbol: false,
            data: cumSwapCount,
            smooth: true,
          },
        ],
      }

      this.swapCountChart = option
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
