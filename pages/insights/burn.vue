<template>
  <div>
    <div class="burn-container">
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

        <div class="total-burned-container">
          <div v-if="selectedInterval === '24h'">
            <h3>24H Burned</h3>
            <div class="total-burned">
              {{ totalBurned24h | currency }}
            </div>
          </div>
          <div v-else-if="selectedInterval === '7d'">
            <h3>7D Burned</h3>
            <div class="total-burned">
              {{ totalBurned7d | currency }}
            </div>
          </div>
          <div v-else-if="selectedInterval === '30d'">
            <h3>30D Burned</h3>
            <div class="total-burned">
              {{ totalBurned30d | currency }}
            </div>
          </div>
          <div v-else>Please select an interval</div>
        </div>

        <VChart
          :option="burnChart"
          :loading="!burnChart"
          :loading-options="showLoading"
          :theme="chartTheme"
          class="burn-chart"
          :autoresize="true"
        />
        <div class="interval-buttons">
          <button
            v-for="(label, key) in intervals"
            :key="key"
            :class="{ active: selectedInterval === key }"
            @click="changeInterval(key)"
          >
            {{ label }}
          </button>
        </div>
      </div>
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
      totalBurned24h: undefined,
      totalBurned7d: undefined,
      totalBurned30d: undefined,
      updateInterval: undefined,
      totalBurned: undefined,
      burnedBlocks: [],
      burnChart: undefined,
      selectedInterval: '24h',
      intervals: {
        '24h': '24H',
        '7d': '7D',
        '30d': '30D',
      },
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
    this.fetchData(this.selectedInterval)
  },
  destroyed() {
    clearInterval(this.updateInterval)
  },
  methods: {
    async fetchData(intervalKey) {
      try {
        let resData
        let incomeBurn

        if (intervalKey === '7d') {
          resData = (await this.$api.earnings('day', 7)).data
          incomeBurn =
            resData?.meta?.pools?.find((pool) => pool.pool === 'income_burn')
              ?.earnings || 0
          this.totalBurned7d = (+incomeBurn * this.runePrice) / 1e8
        } else if (intervalKey === '30d') {
          resData = (await this.$api.earnings('day', 30)).data
          incomeBurn =
            resData?.meta?.pools?.find((pool) => pool.pool === 'income_burn')
              ?.earnings || 0
          this.totalBurned30d = (+incomeBurn * this.runePrice) / 1e8
        } else if (intervalKey === '24h') {
          resData = (await this.$api.earnings('hour', 24)).data
          incomeBurn =
            resData?.meta?.pools?.find((pool) => pool.pool === 'income_burn')
              ?.earnings || 0
          this.totalBurned24h = (+incomeBurn * this.runePrice) / 1e8
        }

        this.burnChart = this.formatBurn(
          resData,
          intervalKey.includes('d') ? 'day' : 'hour'
        )
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    },

    formatBurn(data, intervalType) {
      const xAxis = []
      const runeBurned = []

      const dateFormat = intervalType === 'hour' ? 'H:mm' : 'MMM DD'

      data?.intervals.forEach((interval, index) => {
        if (index === data?.intervals?.length - 1) {
          return
        }

        const time = moment(interval.endTime * 1000).format(dateFormat)
        xAxis.push(time)

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
            areaStyle: {
              color: 'rgba(255, 153, 98, 0.2)',
            },
          },
        ],
        xAxis,
        {
          legend: {
            show: false,
          },
          grid: {
            right: '2%',
            bottom: '2%',
            containLabel: true,
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            axisLine: { show: false },
            splitLine: { show: false },
            data: xAxis,
            min: 'dataMin',
            max: 'dataMax',
          },
          yAxis: [
            {
              type: 'value',
              axisLine: { show: false },
              splitLine: { show: false },
              axisTick: { show: false },
              minorTick: { show: false },
              position: 'right',
              show: true,

              min: Math.min(...runeBurned) * 0.9,
              max: Math.max(...runeBurned) * 1,
              axisLabel: {
                formatter: (value) =>
                  this.$options.filters.number(value, '0,0a'),
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

    changeInterval(intervalKey) {
      this.selectedInterval = intervalKey
      this.fetchData(intervalKey)
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
.total-burned-container {
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;

  h3 {
    margin-bottom: 10px;
    font-size: 16px;
    color: var(--font-color);
  }

  .total-burned {
    font-size: 20px;
    font-weight: bold;
    color: var(--sec-font-color);
    margin-top: 0.4rem;
  }
}
.burn-container {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
}
.burn-card {
  flex: 1;
  justify-content: center;
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
    height: 200px;
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
        font-size: 5rem;
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

.interval-buttons {
  display: flex;
  align-items: center;
  margin-top: 2rem;
  background-color: var(--sidebar);
  border-radius: 0.5rem;
  padding: 4px 5px;
  gap: 2rem;
  width: 28rem;

  button {
    align-items: center;
    display: flex;
    justify-content: center;

    flex: 1;
    padding: 10px 4px;
    font-size: 1rem;
    color: var(--bs-secondary-color);

    background-color: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease-in-out;

    &.active {
      padding: 0.5rem;
      border-radius: 0.5rem;
      margin: 1.5px 5px;
      background-color: var(--border-color);
      color: var(--sec-font-color);
    }

    &:hover {
      color: #ffa86b;
    }
  }
}

.block-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  margin: 1rem;
  border-bottom: 1px solid var(--border-color);

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
