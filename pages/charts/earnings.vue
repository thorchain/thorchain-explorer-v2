<template>
  <Page>
    <div class="header-earning">
      <Nav
        :active-mode.sync="chartPeriod"
        :nav-items="chartPeriods"
        pre-text="Period :"
        @update:active-mode="handlePeriodChange"
      />
      <div class="dropdown" :class="{ open: dropdownOpen }">
        <div>
          <button
            class="button-earning"
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
            <asset-icon
              v-if="!['income_burn', 'dev_fund_reward'].includes(pool)"
              :asset="pool"
              class="asset-icon"
            />
            {{
              ['income_burn', 'dev_fund_reward'].includes(pool)
                ? pool
                : showAsset(pool)
            }}
          </div>
        </div>
      </div>
    </div>
    <card title="Earnings" :is-loading="loading">
      <VChart
        ref="mainChart"
        :option="chartOptions"
        :loading="!chartOptions"
        :autoresize="true"
        :loading-options="showLoading"
        :theme="chartTheme"
      />
    </card>
    <card title="Liquidity Fees" :is-loading="loading">
      <VChart
        :option="liquidityFees"
        :loading="!liquidityFees"
        :autoresize="true"
        :loading-options="showLoading"
        :theme="chartTheme"
      />
    </card>
    <card title="Bonding Earnings" :is-loading="loading">
      <div class="bond-earnings-switcher">
        <label class="switch">
          <input
            type="checkbox"
            :checked="isDividedByAvgNodeCount"
            @change="toggleDividedByAvgNodeCount"
          />
          <span class="slider round"></span>
        </label>
        <span class="mode-label">{{
          isDividedByAvgNodeCount ? 'Bond Earning Per Node' : 'Bonding Earnings'
        }}</span>
      </div>

      <VChart
        :option="bondingEarnings"
        :loading="!bondingEarnings"
        :autoresize="true"
        :loading-options="showLoading"
        :theme="chartTheme"
      />
    </card>
  </Page>
</template>

<script>
import { mapGetters } from 'vuex'
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
import { earnings } from '~/api/midgard.api'
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
      chartKey: 0,
      bondingEarnings: undefined,
      isDividedByAvgNodeCount: false,
      dropdownOpen: false,
      selectedOption: this.$route.query.pool || 'All',
      pools: [],
      chartOptions: undefined,
      liquidityFees: undefined,
      chartPeriod: this.$route.query.period || '90',
      chartInterval: 'day',
      chartPeriods: [
        { text: '90 D', mode: '90' },
        { text: '180 D', mode: '180' },
        { text: '365 D', mode: '365' },
        { text: '50 W', mode: '50w' },
        { text: '100 W', mode: '100w' },
      ],
      dataCache: {},
      loading: false,
    }
  },

  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
    filteredPools() {
      const specialPools = ['income_burn', 'dev_fund_reward']
      const normalPools = this.pools.filter(
        (pool) => !specialPools.includes(pool)
      )
      return [...normalPools, ...specialPools]
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
    chartPeriod(newPeriod, oldPeriod) {
      let intervalCHange = true
      if (
        (newPeriod.includes('w') && oldPeriod.includes('w')) ||
        (newPeriod.includes('d') && oldPeriod.includes('d'))
      ) {
        intervalCHange = false
      }
      this.updateQueryParams({ period: newPeriod })
      this.loadData(newPeriod, this.selectedOption, intervalCHange)
    },
    selectedOption(newOption) {
      this.updateQueryParams({ pool: newOption })
      this.chartKey++
      this.loadData(this.chartPeriod, newOption, false)
    },
  },
  mounted() {
    this.loadData()
  },

  methods: {
    handlePeriodChange(newPeriod) {
      this.chartPeriod = newPeriod
    },

    updateQueryParams(newParams) {
      this.$router.replace({
        query: {
          ...this.$route.query,
          ...newParams,
        },
      })
    },

    async loadData(
      period = this.chartPeriod,
      selectedPool = this.selectedOption,
      intervalChange = false
    ) {
      if (period === '50w' || period === '100w') {
        this.chartInterval = 'week'
      } else {
        this.chartInterval = 'day'
      }

      const count = this.getCountFromPeriod(period)
      if (!intervalChange && this.dataCache[count]) {
        this.updateChart(this.dataCache[count], selectedPool)
        this.updateLiquidityFeesChart(this.dataCache[count], selectedPool)
        this.updateBondingEarningsChart(this.dataCache[count])
        return
      }

      try {
        const resEarning = (await earnings(this.chartInterval, count)).data
        if (intervalChange) {
          this.dataCache[count] = {}
        }
        this.dataCache[count] = resEarning

        const latestInterval =
          resEarning.intervals[resEarning.intervals.length - 1]

        this.pools = latestInterval.pools.map((pool) => pool.pool)

        this.updateChart(resEarning, selectedPool)
        this.updateLiquidityFeesChart(resEarning, selectedPool)
        this.updateBondingEarningsChart(resEarning)
      } catch (error) {
        console.error('Error fetching earnings:', error)
      }
    },
    updateChart(data, selectedPool) {
      const poolEarnings =
        selectedPool === 'All'
          ? this.formatEarnings(data)
          : this.formatEarnings(data, selectedPool)

      poolEarnings.notMerge = true

      if (this.$refs.mainChart && this.$refs.mainChart.chart) {
        this.$refs.mainChart.chart.clear()
      }

      this.chartOptions = { ...poolEarnings }
    },
    updateLiquidityFeesChart(data, selectedPool) {
      const liquidityFeesData =
        selectedPool === 'All'
          ? this.formatLiquidityFees(data)
          : this.formatLiquidityFees(data, selectedPool)

      this.liquidityFees = liquidityFeesData
    },

    updateBondingEarningsChart(data) {
      const bondingEarningsData = this.formatBondingEarnings(data)
      this.bondingEarnings = bondingEarningsData
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
      if (selectedPool === 'All') {
        const liquidityEarningsData = []
        const bondingEarningsData = []

        d?.intervals.forEach((interval, index) => {
          if (index === d.intervals.length - 1) return

          const formatType =
            this.chartInterval === 'week' ? 'YYYY, MMM D' : 'dddd, MMM D'
          xAxis.push(
            moment(
              ((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
            ).format(formatType)
          )
          const liquidity = +interval.earnings * +interval.runePriceUSD
          liquidityEarningsData.push(liquidity / 1e8)

          const bonding = interval.bondingEarnings
            ? +interval.bondingEarnings * +interval.runePriceUSD
            : 0
          bondingEarningsData.push(bonding / 1e8)
        })

        return this.basicChartFormat(
          (value) => `$ ${this.normalFormat(value)}`,
          [
            {
              type: 'bar',
              name: 'Pool Earnings',
              stack: 'Total',
              showSymbol: false,
              areaStyle: {},
              data: liquidityEarningsData,
              smooth: true,
              lineStyle: { width: 2 },
              z: 3,
            },
            {
              type: 'bar',
              name: 'Bonding Earnings',
              stack: 'Total',
              showSymbol: false,
              areaStyle: {},
              data: bondingEarningsData,
              smooth: true,
              lineStyle: { width: 2 },
              z: 2,
            },
          ],
          xAxis,
          {
            yAxis: [
              {
                type: 'value',
                position: 'left',
                show: false,
                splitLine: { show: true },
                axisLine: { show: false },
                min: 'dataMin',
                max: 'dataMax',
              },
            ],
          },
          (params) => {
            if (!params || !Array.isArray(params) || params.length === 0)
              return ''
            return `
          <div class="tooltip-header">${params[0].name}</div>
          <div class="tooltip-body">
            ${params
              .map(
                (p) => `
              <span>
                <div class="tooltip-item">
                  <div class="data-color" style="background-color: ${p.color}"></div>
                  <span style="text-align: left;">${p.seriesName}</span>
                </div>
                <b>$${this.$options.filters.number(p.value, '0,0.00a')}</b>
              </span>
            `
              )
              .join('')}
          </div>
        `
          }
        )
      } else {
        const earningsData = []

        d?.intervals.forEach((interval, index) => {
          if (index === d.intervals.length - 1) return

          const formatType =
            this.chartInterval === 'week' ? 'YYYY, MMM D' : 'dddd, MMM D'
          xAxis.push(
            moment(
              ((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
            ).format(formatType)
          )

          const poolObj = interval.pools.find(
            (pool) => pool.pool === selectedPool
          )
          const value = poolObj ? +poolObj.earnings * +interval.runePriceUSD : 0
          earningsData.push(value / 1e8)
        })

        return this.basicChartFormat(
          (value) => `$ ${this.normalFormat(value)}`,
          [
            {
              type: 'bar',
              name: 'Earnings',
              showSymbol: false,
              areaStyle: {},
              data: earningsData,
              smooth: true,
              lineStyle: { width: 2 },
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
                splitLine: { show: true },
                axisLine: { show: false },
                min: 'dataMin',
                max: 'dataMax',
              },
            ],
          },
          (params) => {
            const filtered = params.filter((p) => p.seriesName === 'Earnings')
            if (filtered.length === 0) return ''
            return `
          <div class="tooltip-header">${filtered[0].name}</div>
          <div class="tooltip-body">
            ${filtered
              .map(
                (p) => `
              <span>
                <div class="tooltip-item">
                  <div class="data-color" style="background-color: ${p.color}"></div>
                  <span style="text-align: left;">${p.seriesName}</span>
                </div>
                <b>$${this.$options.filters.number(p.value, '0,0.00a')}</b>
              </span>
            `
              )
              .join('')}
          </div>
        `
          }
        )
      }
    },

    formatLiquidityFees(d, selectedPool = 'All') {
      const xAxis = []
      const liquidityFeesData = []

      d?.intervals.forEach((interval, index) => {
        if (index === d?.intervals?.length - 1) {
          return
        }

        const formatType =
          this.chartInterval === 'week' ? 'YYYY, MMM D' : 'dddd, MMM D'
        xAxis.push(
          moment(
            ((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format(formatType)
        )

        const fees =
          selectedPool === 'All'
            ? +interval.liquidityFees * +interval.runePriceUSD
            : +interval.pools.find((pool) => pool.pool === selectedPool)
                ?.totalLiquidityFeesRune * +interval.runePriceUSD

        liquidityFeesData.push(fees / 1e8)
      })

      return this.basicChartFormat(
        (value) => `$ ${this.normalFormat(value)}`,
        [
          {
            type: 'bar',
            name:
              selectedPool === 'All'
                ? 'Liquidity Fees'
                : 'Total Liquidity Fees RUNE',
            showSymbol: false,
            areaStyle: {},
            data: liquidityFeesData,
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
              (selectedPool === 'All'
                ? 'Liquidity Fees'
                : 'Total Liquidity Fees RUNE')
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

    formatBondingEarnings(d) {
      const xAxis = []
      const bondingEarningsData = []

      d?.intervals.forEach((interval, index) => {
        if (index === d?.intervals?.length - 1) {
          return
        }

        const formatType =
          this.chartInterval === 'week' ? 'YYYY, MMM D' : 'dddd, MMM D'
        xAxis.push(
          moment(
            ((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format(formatType)
        )

        const earnings = +interval.bondingEarnings * +interval.runePriceUSD
        const avgNodeCount = +interval.avgNodeCount || 1

        const finalEarnings = this.isDividedByAvgNodeCount
          ? earnings / avgNodeCount
          : earnings

        bondingEarningsData.push(finalEarnings / 1e8)
      })

      return this.basicChartFormat(
        (value) => `$ ${this.normalFormat(value)}`,
        [
          {
            type: 'bar',
            name: this.isDividedByAvgNodeCount
              ? 'Bond Earning Per Node'
              : 'Bond Earnings',
            showSymbol: false,
            areaStyle: {},
            data: bondingEarningsData,
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
              (this.isDividedByAvgNodeCount
                ? 'Bond Earning Per Node'
                : 'Bond Earnings')
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

    toggleDividedByAvgNodeCount() {
      this.isDividedByAvgNodeCount = !this.isDividedByAvgNodeCount
      this.updateBondingEarningsChart(
        this.dataCache[this.getCountFromPeriod(this.chartPeriod)]
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
.header-earning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;

  .dropdown {
    position: relative;
    display: inline-block;
    margin-bottom: 10px;

    .button-earning {
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
      width: 164px;
      overflow: auto;
      display: flex;
      flex-direction: column;
      align-content: center;
      align-items: center;

      .all-section {
        border-bottom: 1px solid var(--border-color);
        padding: 0.75rem;
        width: 100%;
        display: flex;
        justify-content: center;

        &:hover {
          background-color: var(--active-bg-color);
          color: var(--primary-color);
        }
      }

      .selected-options {
        display: flex;
        padding: 0.5rem;
        align-items: center;
        width: 100%;
        gap: 8px;

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
.bond-earnings-switcher {
  display: flex;
  align-items: center;
  justify-content: flex-start;
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
  border-radius: 50%;
  left: 4px;
  bottom: 4px;
  background-color: var(--sec-font-color);
  transition: 0.4s;
}

input:checked + .slider {
  background-color: var(--primary-color);
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.mode-label {
  font-size: 14px;
  color: var(--font-color);
  margin-left: 10px;
}
</style>
