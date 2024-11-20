<template>
  <div>
    <div class="burn-card">
      <h3>
        <burn class="burn-icon"></burn>
        Burned RUNE
      </h3>
      <div class="burned-value">
        <h1 v-if="totalBurned">
          <rune class="rune-cur"></rune>
          {{ totalBurned | number('0,0.00') }}
        </h1>
        <skeleton-loader v-else height="1rem" width="12rem"></skeleton-loader>
      </div>
      <small v-if="totalBurned && runePrice">
        {{ (totalBurned * runePrice) | currency }}
      </small>
      <VChart
        :option="burnChart"
        :loading="!burnChart"
        :loading-options="showLoading"
        :theme="chartTheme"
        class="burn-chart"
        :autoresize="true"
      />
    </div>
    <div class="block-card">
      <transition-group name="block" tag="div">
        <div
          v-for="block in burnedBlocks"
          :key="block.blockHeight"
          class="block-item"
        >
          <div class="block-info">
            <span class="height">{{ block.blockHeight | number('0,0') }}</span>
            <small class="duration">
              {{ getDuration(block.timestamp) }} Seconds
            </small>
          </div>
          <div class="right-section">
            <div class="burn-info">
              {{ runeCur() }}
              {{ block.burnedAmount / 1e8 }}
            </div>
            <small>
              {{ ((block.burnedAmount / 1e8) * runePrice) | currency }}
            </small>
          </div>
        </div>
        <template v-if="burnedBlocks.length == 0">
          <div v-for="index in 10" :key="index" class="loader-item">
            <skeleton-loader
              class="value-loader"
              height="1rem"
            ></skeleton-loader>
          </div>
        </template>
      </transition-group>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'

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
import Rune from '~/assets/images/rune.svg?inline'
import Burn from '~/assets/images/burn.svg?inline'

use([
  SVGRenderer,
  GridComponent,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
])
export default {
  components: { Burn, Rune, VChart },
  data() {
    return {
      updateInterval: undefined,
      totalBurned: undefined,
      burnedBlocks: [],
      burnChart: undefined,
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
  },
  mounted() {
    this.updateInterval = setInterval(() => {
      this.getBurnData()
    }, 5000)
    this.getChartData()
  },
  destroyed() {
    clearInterval(this.updateInterval)
  },
  methods: {
    async getChartData() {
      try {
        const { data: chartData } = await this.$api.earnings('hour', 48)
        const chart = this.formatBurn(chartData)
        this.burnChart = chart
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    },
    formatBurn(data) {
      const xAxis = []
      const runeBurned = []

      data?.intervals.forEach((interval, index) => {
        if (index === data?.intervals?.length - 1) {
          return
        }

        const date = moment(interval.endTime * 1000).format('MMM DD, H:mm')
        xAxis.push(date)

        const burns = interval?.pools?.find(
          (p) => p.pool === 'income_burn'
        )?.earnings

        runeBurned.push(+burns / 1e8)
      })

      return this.basicChartFormat(
        (value) => `$ ${this.$options.filters.number(value, '0,0.00a')}`,
        [
          {
            type: 'line',
            name: 'Burned Rune',
            showSymbol: false,
            data: runeBurned,
            itemStyle: {
              color: '#ff9962',
            },
          },
        ],
        xAxis,
        {
          legend: {
            show: false,
          },
          grid: {
            top: '0%',
            left: '2%',
            height: '100%',
          },
          yAxis: [
            {
              type: 'value',
              name: '',
              position: 'right',
              show: false,
              splitLine: {
                show: true,
              },
            },
          ],
        },
        (param) => {
          return `
          <div class="tooltip-header">
            <div class="data-color" style="background-color: ${param[0].color}"></div>
            ${param[0].name}
          </div>
          <div class="tooltip-body">
            ${param
              .map(
                (p) => `<span>
                <span>${p.seriesName}</span>
                <b>${p.value ? this.$options.filters.number(p.value, '0,0.00') : '-'} RUNE</b>
              </span>`
              )
              .join('')}
          </div>`
        }
      )
    },
    getBurnData() {
      this.$api
        .getBurnedBlocks()
        .then(({ data }) => {
          this.totalBurned = 500_000_000 - +data.totalBurned / 1e8
          this.burnedBlocks = data.burnedBlocks.reverse()
        })
        .catch((error) => {
          console.error('Error fetching swap history:', error)
        })
    },
    getDuration(timestamp) {
      const now = moment()
      const before = moment(timestamp)
      return moment.duration(now.diff(before)).asSeconds().toFixed()
    },
  },
}
</script>

<style lang="scss" scoped>
.burn-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1rem 2rem;
  font-size: 1.875rem;
  color: var(--sec-font-color);
  max-width: 50rem;
  margin: auto;
  h3 {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
  }

  .burn-chart {
    min-height: 200px;
  }

  .rune-cur {
    height: 2.5rem;
    fill: currentColor;
  }

  .burned-value {
    display: flex;
    justify-content: center;

    h1 {
      margin: 0.5rem;

      @include md {
        .rune-cur {
          height: 5rem;
        }
        font-size: 7rem;
      }
    }
  }

  .burn-icon {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    margin-right: 0.5rem;
    fill: #ffa86b;
  }
}

.block-card {
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 0.5rem 1rem;
  max-width: 50rem;
  margin: auto;
  margin-top: 1rem;
}

.block-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  margin: 1rem;

  .block-info {
    display: flex;
    flex-direction: column;

    .height {
      font-size: 1.2rem;
      color: var(--sec-font-color);
    }
  }

  .right-section {
    display: flex;
    flex-direction: column;
    align-items: end;
  }

  .burn-info {
    color: #ffa86b;
  }
}

.loader-item {
  margin: 2rem 0;
}

.block-enter-active {
  transition: all 1s;
  .block-info .height {
    color: #ffa86b;
  }
}

.block-enter {
  opacity: 0;
  transform: translateY(-30px);
}
</style>
