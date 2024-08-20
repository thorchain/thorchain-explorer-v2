<template>
  <VChart
    :option="options"
    :autoresize="true"
    :loading-options="showLoading"
    style="width: 275px; height: 250px; min-height: initial"
    :theme="chartTheme"
  />
</template>

<script>
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  SVGRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
])

export default {
  components: {
    VChart,
  },
  props: ['pieData', 'formatter', 'name'],
  computed: {
    options() {
      return {
        formatter: this.formatter,
        tooltip: {
          trigger: 'item',
        },
        series: [
          {
            name: this.name ?? '',
            type: 'pie',
            radius: [0, 80],
            center: ['50%', '50%'],
            width: 275,
            height: 250,
            itemStyle: {
              borderRadius: 5,
            },
            label: {
              show: false,
            },
            data: this.pieData,
          },
        ],
      }
    },
  },
}
</script>

<style></style>
