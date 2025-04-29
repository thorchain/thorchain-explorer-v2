<template>
  <div>
    <div class="burn-container">
      <div class="burn-card">
        <h3>
          <burn class="burn-icon"></burn>
          Burned RUNE
        </h3>
        <div class="total-res-data">
          <div class="burned-value">
            <h1 v-if="totalBurned">
              <rune v-if="selectedUnit === 'rune'" class="rune-cur"></rune>
              <span v-else>$</span>
              {{ displayTotalBurned | number('0,0.00') }}
            </h1>
            <skeleton-loader
              v-else
              height="1rem"
              width="12rem"
            ></skeleton-loader>
          </div>
        </div>

        <div class="total-burned-container">
          <div class="unit-switcher">
            <label class="switch">
              <input
                type="checkbox"
                :checked="selectedUnit === 'dollar'"
                @change="toggleUnit"
              />
              <span class="slider round"></span>
            </label>
            <span class="unit-label">{{
              selectedUnit === 'rune' ? 'RUNE' : 'USD'
            }}</span>
          </div>
          <div v-if="selectedInterval === '24h'" class="burned-item">
            <div class="total-burned">
              <skeleton-item
                v-if="selectedUnit === 'rune'"
                style="min-width: 100px"
                :loading="!totalBurned24h"
              >
                {{ totalBurned24h | number('0,0.00') }}
                <small>RUNE</small>
              </skeleton-item>
              <span v-else>
                {{ (totalBurned24h * runePrice) | currency() }}
              </span>
            </div>
            <h3>24H</h3>
          </div>
          <div v-else-if="selectedInterval === '7d'" class="burned-item">
            <div class="total-burned">
              <skeleton-item
                v-if="selectedUnit === 'rune'"
                style="min-width: 100px"
                :loading="!totalBurned7d"
              >
                {{ totalBurned7d | number('0,0.00') }}
                <small>RUNE</small>
              </skeleton-item>
              <span v-else>
                {{ (totalBurned7d * runePrice) | currency() }}
              </span>
            </div>
            <h3>7D</h3>
          </div>
          <div v-else-if="selectedInterval === '30d'" class="burned-item">
            <div class="total-burned">
              <skeleton-item
                v-if="selectedUnit === 'rune'"
                style="min-width: 100px"
                :loading="!totalBurned30d"
              >
                {{ totalBurned30d | number('0,0.00') }}
                <small>RUNE</small>
              </skeleton-item>
              <span v-else>
                {{ (totalBurned30d * runePrice) | currency() }}
              </span>
            </div>
            <h3>30D</h3>
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
    <div class="balance-details">
      <cards-header :table-general-stats="generalStatsDetails" />
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
            <skeleton-loader height="1rem"></skeleton-loader>
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
      selectedUnit: 'rune',
      totalBurned24h: undefined,
      totalBurned7d: undefined,
      totalBurned30d: undefined,
      updateInterval: undefined,
      totalBurned: undefined,
      burnedBlocks: [],
      totalSupply: undefined,
      uncirculatedSupply: undefined,
      circulatingSupply: undefined,
      burnChart: undefined,
      selectedInterval: '24h',
      intervals: {
        '24h': '24H',
        '7d': '7D',
        '30d': '30D',
      },
      generalStatsDetails: [
        {
          name: 'Total Supply',
        },
        {
          name: 'Reserve',
        },
      ],
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
    displayTotalBurned() {
      if (this.selectedUnit === 'dollar') {
        return this.totalBurned * this.runePrice
      }
      return this.totalBurned
    },
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
          this.totalBurned7d = +incomeBurn / 1e8
        } else if (intervalKey === '30d') {
          resData = (await this.$api.earnings('day', 30)).data
          incomeBurn =
            resData?.meta?.pools?.find((pool) => pool.pool === 'income_burn')
              ?.earnings || 0
          this.totalBurned30d = +incomeBurn / 1e8
        } else if (intervalKey === '24h') {
          resData = (await this.$api.earnings('hour', 24)).data
          incomeBurn =
            resData?.meta?.pools?.find((pool) => pool.pool === 'income_burn')
              ?.earnings || 0
          this.totalBurned24h = +incomeBurn / 1e8
        }

        const supplyData = await this.$api.getSupply()
        this.totalSupply = +supplyData.data.amount.amount / 1e8

        // get reserve address balance
        const uncirculatedData = await this.$api.getBalance(
          'thor1dheycdevq39qlkxs2a6wuuzyn4aqxhve4qxtxt'
        )

        const runeBalance = uncirculatedData.data.result.find(
          (item) => item.denom === 'rune'
        )

        this.uncirculatedSupply = runeBalance
          ? Number(runeBalance.amount) / 1e8
          : 0

        this.circulatingSupply = this.totalSupply - this.uncirculatedSupply

        this.burnChart = this.formatBurn(
          resData,
          intervalKey.includes('d') ? 'day' : 'hour'
        )
        this.updateStatsDetails()
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    },
    updateStatsDetails() {
      this.generalStatsDetails = [
        {
          name: 'Total Supply',
          value: `${this.$options.filters.number(this.totalSupply, '0.00a')} ${this.runeCur()}`,
          extraText: this.$options.filters.currency(
            this.totalSupply * this.runePrice
          ),
          description: 'Total RUNE breakdown (click for more info)',
          link: '/network',
        },
        {
          name: 'Reserve',
          value: `${this.$options.filters.number(this.uncirculatedSupply, '0.00a')} ${this.runeCur()}`,
          extraText: this.$options.filters.currency(
            this.uncirculatedSupply * this.runePrice
          ),
        },
      ]
    },
    toggleUnit() {
      this.selectedUnit = this.selectedUnit === 'rune' ? 'dollar' : 'rune'
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
            left: '2%',
            right: '2%',
            bottom: '2%',
            containLabel: true,
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            axisLine: { show: false },
            splitLine: { show: false },
            axisTick: { show: false },
            data: xAxis,
            min: 'dataMin',
            max: 'dataMax',
            onZero: false,
          },
          yAxis: [
            {
              type: 'value',
              axisLine: { show: false },
              splitLine: { show: false },
              axisTick: { show: false },
              minorTick: { show: false },
              position: 'right',
              min: 'dataMin',
              max: 'dataMax',
              show: true,
              splitNumber: 2,
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
  },
}
</script>

<style lang="scss" scoped>
.total-res-data {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: $space-16;
  width: 100%;
  justify-content: center;
}
.interval-buttons {
  display: flex;
  align-items: center;
  margin-top: $space-16;
  border: 1px solid var(--border-color);
  border-radius: $radius-lg;
  padding: $space-4 $space-5;
  gap: $space-2;
  width: 21rem;
  margin-top: $space-20;

  @include lg {
    width: 28rem;
  }

  button {
    align-items: center;
    display: flex;
    justify-content: center;

    flex: 1;
    padding: $space-10 $space-4;
    font-size: $font-size-desktop;
    color: var(--bs-secondary-color);

    background-color: transparent;
    border: none;
    border-radius: $radius-lg;
    cursor: pointer;
    transition: all 0.3s ease-in-out;

    &.active {
      padding: $space-8;
      border-radius: $radius-lg;
      margin: 1.5px $space-5;
      background-color: var(--border-color);
      color: #ffa86b;
    }

    &:hover {
      color: #ffa86b;
    }
  }
}
.balance-details {
  align-items: center;
  text-align: center;
  max-width: 50rem;
  margin: $space-8 auto;
}
.unit-switcher {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
}

.switch {
  position: relative;
  display: inline-block;
  width: 53px;
  height: 27px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border-color);
  transition: 0.4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 19px;
  width: 21px;
  border-radius: $radius-full;
  left: 4px;
  bottom: 4px;
  background-color: var(--sec-font-color);
  transition: 0.4s;
}

input:checked + .slider {
  background-color: #ffa86b;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.unit-label {
  font-size: $font-size-sm;
  color: var(--font-color);
  margin-left: $space-10;
}
.total-burned-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  margin-top: $space-16;
}

.burned-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: $space-8;
  flex: 1;
}

h3 {
  margin-bottom: $space-10;
  font-size: $font-size-desktop;
  color: var(--font-color);
}

.total-burned {
  font-size: $font-size-desktop;
  font-weight: bold;
  color: var(--sec-font-color);
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
  border-radius: $radius-2xl;
  padding: $space-16 $space-32;
  font-size: 1.875rem;
  color: var(--sec-font-color);
  max-width: 50rem;
  margin: $space-0 $space-10;

  @include lg {
    margin: auto;
  }
  h3 {
    font-size: $font-size-lg;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: $space-0;
  }

  .burn-chart {
    height: 200px;
    min-height: 200px;
  }

  .rune-cur {
    height: 3rem;
    fill: currentColor;
    font-size: 3rem;
  }

  .burned-value {
    display: flex;
    justify-content: center;
    width: 100%;
    margin: auto;

    h1 {
      margin: $space-8;
      font-size: 3rem;
      display: flex;
      gap: 0.5rem;

      @include md {
        .rune-cur {
          height: 4rem;
        }
        font-size: 4rem;
      }
    }
  }

  .burn-icon {
    width: 2rem;
    height: 2rem;
    border-radius: $radius-full;
    margin-right: $space-8;
    fill: #ffa86b;
  }
}

.block-card {
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-2xl;
  padding: $space-8 $space-16;
  max-width: 50rem;
  margin: auto;
  margin-top: $space-16;
  margin: $space-16 $space-10;

  @include lg {
    margin: auto;
  }

  .block-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex: 1;
    margin: $space-10;

    .block-info {
      display: flex;
      flex-direction: column;

      .height {
        font-size: $font-size-lg;
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
    margin: $space-32 $space-0;
  }
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
