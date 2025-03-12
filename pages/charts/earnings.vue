<template>
  <Page>
    <div class="header-swap">
      <Nav
        :active-mode.sync="chartPeriod"
        :nav-items="chartPeriods"
        pre-text="Period :"
        @update:active-mode="handlePeriodChange"
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
            {{ displayText }}
            <AngleIcon class="dropdown-icon" />
          </button>
        </div>
        <div v-if="dropdownOpen" class="dropdown-menu">
          <div class="all-section" @click="selectOption('All')">All</div>
          <div
            v-for="pool in filteredPools"
            :key="pool"
            class="selected-options"
            @click="selectOption(pool)"
          >
            {{
              ['income_burn', 'dev_fund_reward'].includes(pool)
                ? pool
                : showAsset(pool)
            }}
          </div>
        </div>
      </div>
    </div>
    <card title="Swaps Volume" :is-loading="loading">
      <VChart
        :option="chartOptions"
        :loading="!chartOptions"
        :autoresize="true"
        :loading-options="showLoading"
        :theme="chartTheme"
      />
    </card>
  </Page>
</template>

<script>
import { earnings } from '~/api/midgard.api'
import moment from 'moment'
import { use } from 'echarts/core'
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
      dropdownOpen: false,
      selectedOption: this.$route.query.pool || 'All',
      pools: [],
      chartOptions: undefined,
      chartPeriod: this.$route.query.period || '90',
      chartInterval: 'day',
      chartPeriods: [
        { text: '90 D', mode: '90' },
        { text: '180 D', mode: '180' },
        { text: '365 D', mode: '365' },
        { text: '50 W', mode: '50w' },
        { text: '100 W', mode: '100w' },
      ],
      loading: false,
    }
  },

  computed: {
    filteredPools() {
      return this.pools
    },
    displayText() {
      if (this.selectedOption === 'All') {
        return this.selectedOption
      } else if (
        ['income_burn', 'dev_fund_reward'].includes(this.selectedOption)
      ) {
        return this.selectedOption
      } else {
        return this.showAsset(this.selectedOption)
      }
    },
  },
  watch: {
    chartPeriod(newPeriod) {
      this.updateQueryParams({ period: newPeriod })
      this.loadData(newPeriod)
    },
    selectedOption(newOption) {
      this.updateQueryParams({ pool: newOption })
      this.loadData(this.chartPeriod, newOption)
    },
  },
  async mounted() {
    this.loadData()
  },

  methods: {
    handlePeriodChange(newPeriod) {
      this.chartPeriod = newPeriod
    },

    updateQueryParams(newParams) {
      this.$router.push({
        query: {
          ...this.$route.query,
          ...newParams,
        },
      })
    },

    async loadData(
      period = this.chartPeriod,
      selectedPool = this.selectedOption
    ) {
      this.loading = true

      if (period === '50w' || period === '100w') {
        this.chartInterval = 'week'
      } else {
        this.chartInterval = 'day'
      }

      const count = this.getCountFromPeriod(period)
      try {
        const resEarning = (await earnings(this.chartInterval, count)).data
        const latestInterval =
          resEarning.intervals[resEarning.intervals.length - 1]

        this.pools = latestInterval.pools.map((pool) => pool.pool)

        const poolEarnings =
          selectedPool === 'All'
            ? this.formatEarnings(resEarning)
            : this.formatEarnings(resEarning, selectedPool)

        this.chartOptions = poolEarnings
      } catch (error) {
        console.error('Error fetching earnings:', error)
      } finally {
        this.loading = false
      }
    },

    getCountFromPeriod(period) {
      switch (period) {
        case '90':
          return 90
        case '180':
          return 180
        case '365':
          return 365
        case '50w':
          return 50
        case '100w':
          return 100
        default:
          return 90
      }
    },

    formatEarnings(d, selectedPool = 'All') {
      const xAxis = []
      const earningsData = []

      d?.intervals.forEach((interval, index) => {
        if (index === d?.intervals?.length - 1) {
          return
        }

        const formatType =
          this.chartInterval === 'week' ? 'YYYY , MMM D' : 'dddd, MMM D'
        xAxis.push(
          moment(
            ((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format(formatType)
        )

        const earnings =
          selectedPool === 'All'
            ? +interval.liquidityEarnings / 10 ** 8
            : +interval.pools.find((pool) => pool.pool === selectedPool)
                ?.earnings /
              10 ** 8

        earningsData.push(earnings)
      })

      return this.basicChartFormat(
        (value) => `$ ${this.normalFormat(value)}`,
        [
          {
            type: 'bar',
            name: selectedPool === 'All' ? 'Liquidity Earnings' : 'Earnings',
            showSymbol: false,
            areaStyle: {},
            data: earningsData,
            smooth: true,
            lineStyle: {
              width: 2,
            },
            z: 3,
          },
        ],
        xAxis,
        {
          yAxis: [
            {
              type: 'value',
              position: 'left',
              show: false,
              splitLine: {
                show: true,
              },
              axisLine: {
                show: false,
              },
              min: 'dataMin',
              max: 'dataMax',
            },
          ],
        },
        (param) => {
          const filteredParam = param.filter(
            (p) =>
              p.seriesName ===
              (selectedPool === 'All' ? 'Liquidity Earnings' : 'Earnings')
          )

          if (filteredParam.length === 0) return ''

          return `
            <div class="tooltip-header">
              ${filteredParam[0].name}
            </div>
            <div class="tooltip-body">
              ${filteredParam
                .map(
                  (p) => `
                    <span>
                      <div class="tooltip-item">
                        <div class="data-color" style="background-color: ${p.color}"></div>
                        <span style="text-align: left;">
                          ${p.seriesName}
                        </span>
                      </div>
                      <b>$${this.$options.filters.number(p.value, '0,0.00a')}</b>
                    </span>`
                )
                .join('')}
            </div>
          `
        }
      )
    },
    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen
    },
    selectOption(pool) {
      this.selectedOption = pool
      this.dropdownOpen = false
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
