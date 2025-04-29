<template>
  <div class="gauge-container">
    <Card :is-loading="loading" title="Security">
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
        <div v-if="!legendLoaded" class="skeleton-wrapper">
          <div class="skeleton">
            <div class="legend-item">
              <skeleton-loader height="0.5rem" width="3rem"></skeleton-loader>
            </div>
            <div class="legend-item">
              <skeleton-loader height="0.5rem" width="3rem"></skeleton-loader>
            </div>
          </div>
        </div>
        <div v-else class="legend-content">
          <div class="legend-item">
            <span class="color-box" style="background-color: #07c86e"></span>
            <span>Pooled</span>
          </div>
          <div class="legend-item">
            <span class="color-box" style="background-color: #f3ba2f"></span>
            <span>Bonded</span>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<script>
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { GaugeChart } from 'echarts/charts'
import {
  GraphicComponent,
  TitleComponent,
  TooltipComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  SVGRenderer,
  GridComponent,
  GaugeChart,
  TitleComponent,
  TooltipComponent,
  GraphicComponent,
])

export default {
  name: 'GaugeChart',
  components: {
    VChart,
  },
  data() {
    return {
      legendLoaded: false,
      loading: true,
      chartOption: null,
      pooledValue: 0,
      bondedValue: 0,
    }
  },
  mounted() {
    this.fetchData()
    setTimeout(() => {
      this.legendLoaded = true
    }, 2000)
  },
  methods: {
    async fetchData() {
      try {
        const { data } = await this.$api.getNetwork()
        const pooled = (data?.totalPooledRune ?? 0) / 1e8
        const bonded = (data?.bondMetrics?.totalActiveBond ?? 0) / 1e8
        this.updateChartOption(pooled, bonded)
        this.loading = false
      } catch (error) {
        console.error('Failed to fetch network data:', error)
        this.loading = false
      }
    },
    updateChartOption(pooled, bonded) {
      const total = pooled + bonded

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
                width: 40,
                color: [
                  [pooled / total, '#07C86E'],
                  [1, '#f3ba2f'],
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
              show: false,
            },
            detail: {
              show: false,
            },
          },
        ],
        graphic: [
          {
            type: 'text',
            left: '1%',
            top: '20%',
            style: {
              text: `${this.$options.filters.number(pooled, '0,0a')}`,
              fill: '#07C86E',
              align: 'center',
            },
          },
          {
            type: 'text',
            left: '88%',
            top: '15%',
            style: {
              text: `${this.$options.filters.number(bonded, '0,0a')}`,
              fill: '#f3ba2f',
              align: 'center',
            },
          },
        ],
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.gauge-container {
  display: flex;
  height: 100%;
  width: 100%;
}
.chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: auto;

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
  .skeleton {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5rem;
  }
  .legend-content {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: $space-10;
    gap: 5rem;

    @include lg {
      gap: 10rem;
    }
    .legend-item {
      display: flex;
      align-items: center;
      margin: $space-0 $space-10;

      .color-box {
        width: 15px;
        height: 15px;
        border-radius: $radius-full;
        margin-right: $space-10;
      }
    }
  }
}
</style>
