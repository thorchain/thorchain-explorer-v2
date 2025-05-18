<template>
  <div>
    <div class="header-swap">
      <Nav
        :active-mode.sync="chartPeriod"
        :nav-items="chartPeriods"
        pre-text="Period :"
      />
      <div class="dropdown" :class="{ open: dropdownOpen }">
        <div>
          <button
            class="button-swap"
            :class="{
              'selected-all': selectedOption === 'All',
              'selected-asset': selectedOption !== 'All',
            }"
            @click="toggleDropdown"
          >
            <template v-if="selectedOption !== 'All'">
              <asset-icon :asset="selectedOption" class="asset-icon" />
            </template>
            {{ displayText }}
            <AngleIcon class="dropdown-icon" />
          </button>
        </div>
        <div v-if="dropdownOpen" class="dropdown-menu">
          <div class="all-section" @click="selectOption('All')">All</div>
          <div
            v-for="asset in assets"
            :key="asset"
            class="selected-options"
            @click="selectOption(asset)"
          >
            <asset-icon :asset="asset" class="asset-icon" />
            {{ showAsset(asset) }}
          </div>
        </div>
      </div>
    </div>
    <card title="Swaps Volume" :is-loading="loading">
      <VChart
        :option="swapHistory"
        :loading="!swapHistory"
        :loading-options="showLoading"
        :theme="chartTheme"
        :autoresize="true"
      />
    </card>
  </div>
</template>

<script>
import moment from 'moment'
import { use } from 'echarts/core'
import { mapGetters } from 'vuex'
import { SVGRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import AngleIcon from '~/assets/images/angle-down.svg?inline'

use([
  SVGRenderer,
  GridComponent,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
])

export default {
  components: {
    VChart,
    AngleIcon,
  },
  data() {
    return {
      selectedPool: 'All',
      swaps: undefined,
      swapHistory: undefined,
      allSwapHistory: undefined,
      dropdownOpen: false,
      selectedOption: 'All',
      chartPeriod: '90',
      chartInterval: 'day',
      chartPeriods: [
        { text: '90 D', mode: '90' },
        { text: '180 D', mode: '180' },
        { text: '365 D', mode: '365' },
        { text: '100 W', mode: '100w' },
      ],
    }
  },
  computed: {
    ...mapGetters({
      pools: 'getPools',
    }),
    assets() {
      return this.pools?.map((pool) => pool.asset) || []
    },
    displayText() {
      return this.selectedOption === 'All'
        ? this.selectedOption
        : this.showAsset(this.selectedOption)
    },
  },
  watch: {
    chartPeriod(newPeriod, oldPeriod) {
      this.$router.replace({
        query: {
          ...this.$route.query,
          chartPeriod: newPeriod,
        },
      })
      localStorage.setItem('selectedPeriod', newPeriod)

      if (newPeriod.includes('w') !== oldPeriod.includes('w')) {
        this.fetchSwapHistory()
      } else {
        this.filterDataByPeriod(newPeriod)
      }
    },
  },
  async mounted() {
    const queryPool = this.$route.query.pool
    this.selectedOption = queryPool || 'All'

    const queryChartPeriod = this.$route.query.chartPeriod
    const savedPeriod = localStorage.getItem('selectedPeriod')
    if (!queryChartPeriod && !savedPeriod) {
      this.chartPeriod = '90'
      this.$router.replace({
        query: {
          ...this.$route.query,
          chartPeriod: this.chartPeriod,
        },
      })
    } else {
      this.chartPeriod = queryChartPeriod || savedPeriod || '90'
    }

    await this.fetchAllData()
    await this.fetchSwapHistory()
    this.filterDataByPeriod(this.chartPeriod)
  },
  methods: {
    async fetchAllData() {
      const resSwaps = (
        await this.$api.getSwapsHistory({
          interval: 'day',
          count: 365,
        })
      ).data
      this.allSwapHistory = resSwaps
    },
    async fetchSwapHistory() {
      this.allSwapHistory = undefined
      this.swapHistory = undefined

      const interval = this.chartPeriod.includes('w') ? 'week' : 'day'
      let count = 365

      if (interval === 'week') {
        count = 100
      }

      const resSwaps = (
        await this.$api.getSwapsHistory({
          interval,
          count,
          pool: this.selectedOption === 'All' ? undefined : this.selectedOption,
        })
      ).data
      this.allSwapHistory = resSwaps
      this.filterDataByPeriod(this.chartPeriod)
    },
    filterDataByPeriod(period) {
      let count
      switch (period) {
        case '90':
          count = 90
          break
        case '180':
          count = 180
          break
        case '365':
          count = 365
          break
        case '100w':
          count = 100
          break
        default:
          count = 90
      }

      if (this.allSwapHistory) {
        const filteredData = {
          ...this.allSwapHistory,
          intervals: this.allSwapHistory.intervals.slice(-count),
        }
        this.swapHistory = this.formatSwaps(filteredData)
      }
    },
    formatSwaps(d) {
      const xAxis = []
      const pn = []
      const pt = []
      const ps = []
      d?.intervals.forEach((interval, index) => {
        if (index === d?.intervals?.length - 1) {
          return
        }
        xAxis.push(
          moment(
            Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format('dddd, MMM D')
        )
        ps.push(
          (+interval.synthRedeemVolumeUSD + +interval.synthMintVolumeUSD) /
            10 ** 2
        )
        pt.push(
          (+interval.fromTradeVolumeUSD + +interval.toTradeVolumeUSD) / 10 ** 2
        )
        pn.push(
          (+interval.toRuneVolumeUSD + +interval.toAssetVolumeUSD) / 10 ** 2
        )
      })
      return this.basicChartFormat(
        (value) => `$ ${this.$options.filters.number(+value, '0,0.00a')}`,
        [
          {
            type: 'bar',
            name: 'Native Swaps',
            stack: 'total',
            showSymbol: false,
            data: pn,
          },
          {
            type: 'bar',
            name: 'Trade Swaps',
            stack: 'total',
            showSymbol: false,
            data: pt,
          },
          {
            type: 'bar',
            name: 'Synth Swaps',
            stack: 'total',
            showSymbol: false,
            data: ps,
          },
        ],
        xAxis,
        undefined,
        (param) => {
          return `
                    <div class="tooltip-header">
                      ${param[0].name}
                    </div>
                    <div class="tooltip-body">
                      ${param
                        .sort((a, b) => {
                          return b.value - a.value
                        })
                        .map(
                          (p) => `
                          <span>
                            <div class="tooltip-item">
                              <div class="data-color" style="background-color: ${p.color}">
                              </div>
                              <span style="text-align: left;">
                                ${p.seriesName}
                              </span>
                            </div>
                            <b>$${p.value ? this.$options.filters.number(p.value, '0,0.00a') : '-'}</b>
                          </span>`
                        )
                        .join('')}
                    </div>
                    <span style="border-top: 1px solid var(--border-color); margin: 2px 0;"></span>
                    <hr>
                    <span class="tooltip-item space">
                      <span>Total Volume</span>
                      <b>$${this.$options.filters.number(
                        param.reduce((a, c) => a + (c.value ? c.value : 0), 0),
                        '0,0.00a'
                      )}</b>
                    </span>
                    <span class="tooltip-item space">
                      <span style="text-align: left;">
                        Swap Count
                      </span>
                      <b>${this.$options.filters.number(d?.intervals[param[0]?.dataIndex]?.totalCount, '0,0.00a')}</b>
                    </span>
                  `
        }
      )
    },
    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen
    },
    selectOption(option) {
      this.selectedOption = option
      this.dropdownOpen = false
      this.$router.replace({
        query: {
          ...this.$route.query,
          pool: option === 'All' ? undefined : option,
        },
      })
      localStorage.setItem('selectedAsset', option)
      this.fetchSwapHistory()
    },
  },
}
</script>

<style lang="scss" scoped>
.header-swap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;

  .dropdown {
    position: relative;
    display: inline-block;
    margin-bottom: 10px;

    .button-swap {
      background-color: var(--bg-color);
      border-radius: 8px;
      border: 1px solid var(--border-color);
      padding: 12px 16px;
      color: var(--font-color);
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      align-items: center;

      &:hover {
        background-color: var(--active-bg-color);
        color: var(--primary-color);
      }

      .dropdown-icon {
        width: 1rem;
        height: 1rem;
        fill: var(--sec-font-color);
      }

      &.selected-all {
        padding: 12.5px 16px;
      }

      &.selected-asset {
        padding: 9px 16px;
      }
    }

    .dropdown-menu {
      margin-top: 0.3rem;
      position: absolute;
      top: 100%;
      left: 0;
      background-color: var(--bg-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
      z-index: 10;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.3s ease-in-out;
      pointer-events: none;
      cursor: pointer;
      max-height: 300px;
      width: 178px;
      overflow: auto;

      .all-section {
        border-bottom: 1px solid var(--border-color);
        padding: 0.75rem;

        &:hover {
          background-color: var(--active-bg-color);
          color: var(--primary-color);
        }
      }

      .selected-options {
        display: flex;
        padding: 0.5rem;
        align-items: center;

        &:hover {
          background-color: var(--active-bg-color);
          color: var(--primary-color);
        }
      }
    }

    &.open .dropdown-menu {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
  }
}
</style>
