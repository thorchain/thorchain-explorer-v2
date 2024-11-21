<template>
  <Card :is-loading="loading">
    <div class="chart-container">
      <VChart
        v-if="chartOption"
        class="chart"
        :option="chartOption"
        :autoresize="true"
        :theme="chartTheme"
      />
    </div>
    <div class="legend-container">
      <div class="legend-item">
        <span class="color-box" style="background-color: #ff6e76"></span>
        <span>Pooled</span>
        <span class="value">{{ pooledValue }}</span>
      </div>
      <div class="legend-item">
        <span class="color-box" style="background-color: #a279ff"></span>
        <span>Bonded</span>
        <span class="value">{{ bondedValue }}</span>
      </div>
    </div>
  </Card>
</template>

<script>
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { GaugeChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'

use([SVGRenderer, GridComponent, GaugeChart, TitleComponent, TooltipComponent])

export default {
  name: 'GaugeChart',
  components: {
    VChart,
  },
  data() {
    return {
      loading: true,
      chartOption: null,
      pooledValue: 0,
      bondedValue: 0,
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      try {
        const { data } = await this.$api.getNetwork()
        const pooled = data?.totalPooledRune / 1e8
        const bonded = data?.bondMetrics?.totalActiveBond / 1e8
        this.updateChartOption(pooled, bonded)
        this.loading = false
      } catch (error) {
        console.error('Failed to fetch network data:', error)
        this.loading = false
      }
    },
    updateChartOption(pooled, bonded) {
      const total = pooled + bonded
      this.pooledValue = this.$options.filters.number(pooled, '0,0a')
      this.bondedValue = this.$options.filters.number(bonded, '0,0a')

      this.chartOption = {
        series: [
          {
            type: 'gauge',
            startAngle: 180,
            endAngle: 0,
            min: 0,
            max: total,
            radius: '100%',
            center: ['50%', '50%'],
            axisLine: {
              lineStyle: {
                width: 50,
                color: [
                  [pooled / total, '#FF6E76'],
                  [1, '#A279FF'],
                ],
              },
            },
            pointer: {
              show: false,
            },
            axisTick: {
              show: false,
            },
            splitLine: {
              show: false,
            },
            axisLabel: {
              color: 'var(--sec-font-color)',
              fontSize: 10,
              distance: -60,
              formatter: function (value) {
                if (value === pooled) {
                  return 'POOLED'
                } else if (value === bonded) {
                  return 'BONDED'
                }
                return ''
              },
            },
          },
        ],
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  max-height: 100vh;

  .chart {
    width: 100%;
    position: relative;
    top: 6rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.legend-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
  gap: 5rem;

  @include md {
    gap: 7rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    margin: 0 10px;

    .color-box {
      width: 15px;
      height: 15px;
      border-radius: 50%;
      margin-right: 10px;
    }

    .value {
      font-size: 14px;
      margin-left: 5px;
      color: var(--sec-font-color);
    }
  }
}
</style>
