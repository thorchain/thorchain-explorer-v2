<template>
  <VChart
    :option="options"
    :autoresize="true"
    :loading-options="showLoading"
    :style="{
      width: width ? width : '100%',
      height: '250px',
      minHeight: 'initial',
    }"
    :theme="chartTheme"
    @click="click"
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
  props: [
    'pieData',
    'formatter',
    'name',
    'extraSeries',
    'extra',
    'width',
    'click',
  ],
  data() {
    return {
      isMobile: false,
    }
  },
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
            label: {
              distanceToLabelLine: 5,
              fontFamily: 'Montserrat',
            },
            data: this.pieData,
            ...this.extraSeries,
          },
        ],
        ...this.extra,
        ...(this.isMobile && { legend: { show: false } }),
      }
    },
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    handleResize() {
      this.isMobile = window.innerWidth <= 990
    },
  },
}
</script>

<style></style>
