<template>
   <Card title="📊 Rune Price Chart (From Flipside)" extraClass="priceChart">
      <VChart v-if="priceChart" :option="priceChart" :loading="!priceChart" :autoresize="true"></VChart>
   </Card>
</template>

<script>
import { use } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { BarChart, CandlestickChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
} from "echarts/components";
import VChart from "vue-echarts";

use([
  SVGRenderer,
  GridComponent,
  CandlestickChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  DataZoomComponent,
  LegendComponent
]);

export default {
  components: {
    VChart
  },
  data() {
    return {
      priceChart: undefined
    }
  },
  mounted() {
    this.$api.getOhclPrice().then(({data}) => {
      this.priceChart = this.addChart(data);
    })
  },
  methods: {
    addChart(data) {
      let option = {
        title: {
          show: false,
        },
        tooltip: {
          confine: true,
          trigger: "axis",
          axisPointer: {
            type: 'cross',
            link: { xAxisIndex: 'all' },
          }
        },
        legend: {
          show: false,
          x: 'center',
          y: 'bottom',
          icon: 'rect',
          textStyle: {
            color: "var(--font-color)"
          }
        },
        dataZoom: [
          {
            type: 'inside',
            xAxisIndex: [0, 1],
            start: 80,
            end: 100
          },
          {
            show: true,
            xAxisIndex: [0, 1],
            type: 'slider',
            top: '85%',
            start: 80,
            end: 100
          }
        ],
        xAxis: [
          {
            type: 'category',
            data: data.map(d => d.date),
            boundaryGap: false,
            splitLine: {
              show: false,
            },
            axisLine: {
              lineStyle: {
                color: 'var(--font-color)'
              }
            },
            axisLabel: {
              color: 'var(--font-color)',
              fontFamily: 'ProductSans',
            }
          },
          {
            type: 'category',
            gridIndex: 1,
            data: data.map(d => d.date),
            scale: true,
            boundaryGap: false,
            axisLine: { onZero: false },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            splitNumber: 20,
            min: 'dataMin',
            max: 'dataMax',
          }
        ],
        yAxis: [
          {
            axisLine: {
              lineStyle: {
                color: 'var(--font-color)'
              }
            },
            splitLine: {
              lineStyle: {
                color: 'var(--border-color)'
              }
            }
          },
          {
            show: false,
            gridIndex: 1,
            max: 1e9
          }
        ],
        grid: [
          {
            left: '8%',
            right: '8%',
            height: '55%'
          },
          {
            left: '8%',
            right: '8%',
            bottom: '20%',
            height: '25%'
          }
        ],
        series: [
          {
            type: 'candlestick',
            name: 'Rune Price',
            data: data.map(d => d.prices),
            itemStyle: {
              color: "green",
              color0: "#c23531",
              borderColor: 'green',
              borderColor0: '#c23531'
            }
          },
          {
            name: 'Thorchain Trade Volume',
            type: 'bar',
            data: data.map(d => d.volume),
            yAxisIndex: 1,
            xAxisIndex: 1,
            itemStyle: {
              color: '#2962ff'
            },
          }
        ]
      };

      return option;
    }
  }
}
</script>

<style lang="scss" coped>
.priceChart .echarts {
  height: 700px;
}
</style>