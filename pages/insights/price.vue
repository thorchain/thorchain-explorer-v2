<template>
  <Card title="📊 Rune Price Chart (From Flipside)" extra-class="priceChart">
    <VChart
      v-if="priceChart"
      :option="priceChart"
      :loading="!priceChart"
      :autoresize="true"
    />
  </Card>
</template>

<script>
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { BarChart, CandlestickChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  SVGRenderer,
  GridComponent,
  CandlestickChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  DataZoomComponent,
  LegendComponent,
])

export default {
  components: {
    VChart,
  },
  data() {
    return {
      priceChart: undefined,
    }
  },
  mounted() {
    this.$api.getOhclPrice().then(({ data }) => {
      this.priceChart = this.addChart(data)
    })
  },
  methods: {
    addChart(data) {
      const option = {
        title: {
          show: false,
        },
        tooltip: {
          confine: true,
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
          },
          position(pos, params, el, elRect, size) {
            const obj = { top: 10 }
            obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 30
            return obj
          },
          formatter: (param) => {
            const prices = param[0]
            return [
              'Date: ' + prices.name + '<hr size=1 style="margin: 3px 0">',
              'Open: $' + prices.data[1]?.toFixed(2) + '<br/>',
              'Close: $' + prices.data[2]?.toFixed(2) + '<br/>',
              'Lowest: $' + prices.data[3]?.toFixed(2) + '<br/>',
              'Highest: $' + prices.data[4]?.toFixed(2) + '<br/>',
              'Volume: $' +
                this.$options.filters.number(param[1].data, '0 a') +
                '<br/>',
            ].join('')
          },
        },
        axisPointer: {
          link: { xAxisIndex: 'all' },
        },
        legend: {
          show: false,
          x: 'center',
          y: 'bottom',
          icon: 'rect',
          textStyle: {
            color: 'var(--font-color)',
          },
        },
        dataZoom: [
          {
            type: 'inside',
            xAxisIndex: [0, 1],
            start: 80,
            end: 100,
          },
          {
            show: true,
            xAxisIndex: [0, 1],
            type: 'slider',
            top: '85%',
            start: 80,
            end: 100,
          },
        ],
        xAxis: [
          {
            type: 'category',
            data: data.map((d) => d.date),
            boundaryGap: false,
            splitLine: {
              show: false,
            },
            axisLine: {
              lineStyle: {
                color: 'var(--font-color)',
              },
            },
            axisLabel: {
              color: 'var(--font-color)',
              fontFamily: 'ProductSans',
            },
          },
          {
            type: 'category',
            gridIndex: 1,
            data: data.map((d) => d.date),
            scale: true,
            boundaryGap: false,
            axisLine: { onZero: false },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            splitNumber: 20,
            min: 'dataMin',
            max: 'dataMax',
            axisPointer: {
              label: {
                formatter: (params) => {
                  const seriesValue = (params.seriesData[0] || {}).value
                  return this.$options.filters.number(
                    seriesValue.toString() ?? '0',
                    '0 a'
                  )
                },
              },
            },
          },
        ],
        yAxis: [
          {
            axisLine: {
              lineStyle: {
                color: 'var(--font-color)',
              },
            },
            splitLine: {
              lineStyle: {
                color: 'var(--border-color)',
              },
            },
          },
          {
            show: false,
            gridIndex: 1,
          },
        ],
        grid: [
          {
            left: '8%',
            right: '8%',
            height: '50%',
          },
          {
            left: '8%',
            right: '8%',
            bottom: '20%',
            height: '15%',
          },
        ],
        series: [
          {
            type: 'candlestick',
            name: 'Rune Price',
            data: data.map((d) => d.prices),
            itemStyle: {
              color: 'green',
              color0: '#c23531',
              borderColor: 'green',
              borderColor0: '#c23531',
            },
          },
          {
            name: 'Thorchain Trade Volume',
            type: 'bar',
            data: data.map((d) => d.volume),
            yAxisIndex: 1,
            xAxisIndex: 1,
            itemStyle: {
              color: '#2962ff',
            },
          },
        ],
      }

      return option
    },
  },
}
</script>

<style lang="scss" coped>
.priceChart .echarts {
  height: 700px;
}
</style>
