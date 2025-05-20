<template>
  <Page>
    <div class="view-toggle">
      <button
        class="toggle-button"
        :class="{ active: activeView === 'pool' }"
        @click="setActiveView('pool')"
      >
        Pool Earnings
      </button>
      <button
        class="toggle-button"
        :class="{ active: activeView === 'bond' }"
        @click="setActiveView('bond')"
      >
        Bond Earnings
      </button>
    </div>
    <div class="header-earning">
      <Nav
        :active-mode.sync="chartPeriod"
        :nav-items="chartPeriods"
        pre-text="Period :"
        @update:active-mode="chartPeriod = $event"
      />
      <div
        v-if="activeView === 'pool'"
        class="dropdown"
        :class="{ open: dropdownOpen }"
      >
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
            <angle-icon class="dropdown-icon" />
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
              v-if="isValidAsset(pool)"
              :asset="pool"
              class="asset-icon"
            />
            {{ showAsset(pool) }}
          </div>
        </div>
      </div>
    </div>

    <template v-if="activeView === 'pool'">
      <StatsPanel :metrics="poolStats" />

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
    </template>

    <template v-else>
      <StatsPanel :metrics="bondStats" />

      <card title="Bond Earnings" :is-loading="loading">
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
            isDividedByAvgNodeCount
              ? 'Bond Earning Per Node'
              : 'Bonding Earnings'
          }}</span>
        </div>

        <VChart
          :key="'bonding-chart-' + bondingChartKey"
          :option="bondingEarnings"
          :loading="!bondingEarnings"
          :autoresize="true"
          :loading-options="showLoading"
          :theme="chartTheme"
        />
      </card>
    </template>
  </Page>
</template>

<script>
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
      bondingChartKey: 0,
      chartKey: 0,
      bondingEarnings: undefined,
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
      earningsData: null,
      isDividedByAvgNodeCount: false,
      activeView: 'pool',
    }
  },
  computed: {
    poolStats() {
      return [
        {
          label: 'Total Liquidity Fees',
          value: `$${this.formatNumber(this.totalLiquidityFees)}`,
          tooltip: 'Total fees collected from all swaps',
        },
        {
          label: 'Total Pool Earnings',
          value: `$${this.formatNumber(this.totalPoolEarnings)}`,
          tooltip: 'LP earnings',
        },
        {
          label: 'Total Bond Earnings',
          value: `$${this.formatNumber(this.totalBondEarnings)}`,
          tooltip: 'Total earnings from bonding',
        },
        {
          label: 'Total Burned',
          value: `$${this.formatNumber(this.totalBurned)}`,
          tooltip: 'Total income burn earnings',
        },
        {
          label: 'Total TCY Reward',
          value: `$${this.formatNumber(this.totalTCYReward)}`,
          tooltip: 'Total tcy stake reward earnings',
        },
      ]
    },
    bondStats() {
      const totalDays =
        (this.earningsData?.meta?.endTime -
          this.earningsData?.meta?.startTime) /
        (24 * 60 * 60)

      const earningsPerDayPerNode =
        this.totalBondEarnings / this.averageNodeCount / totalDays

      return [
        {
          label: 'Total Bond Earnings',
          value: `$${this.formatNumber(this.totalBondEarnings)}`,
          tooltip: 'Total earnings from bonding across all intervals',
        },
        {
          label: 'Monthly Earnings',
          value: `$${this.formatNumber(earningsPerDayPerNode * 31)}`,
          tooltip: 'Estimated monthly earnings per node during this period',
          subValue: 'Per Node',
        },
        {
          label: 'Weekly Earnings',
          value: `$${this.formatNumber(earningsPerDayPerNode * 7)}`,
          tooltip: 'Estimated weekly earnings per node during this period',
          subValue: 'Per Node',
        },
        {
          label: 'Yearly Earnings',
          value: `$${this.formatNumber(earningsPerDayPerNode * 365)}`,
          tooltip: 'Estimated yearly earnings per node during this period',
          subValue: 'Per Node',
        },
      ]
    },

    totalBondEarnings() {
      if (!this.earningsData) return 0
      return (
        this.earningsData.intervals.reduce((total, interval) => {
          return total + +interval.bondingEarnings * +interval.runePriceUSD
        }, 0) / 1e8
      )
    },

    averageNodeCount() {
      if (!this.earningsData || !this.earningsData.intervals.length) return 1
      return (
        this.earningsData.intervals.reduce((sum, interval) => {
          return sum + (+interval.avgNodeCount || 0)
        }, 0) / this.earningsData.intervals.length
      )
    },
    filteredPools() {
      const normalPools = Array.isArray(this.pools)
        ? this.pools.filter(
            (pool) =>
              pool && typeof pool === 'string' && this.isValidAsset(pool)
          )
        : []
      return normalPools
    },
    totalLiquidityFees() {
      if (!this.earningsData) return 0
      return (
        this.earningsData.intervals.reduce((total, interval) => {
          return total + +interval.liquidityFees * +interval.runePriceUSD
        }, 0) / 1e8
      )
    },
    totalPoolEarnings() {
      if (!this.earningsData) return 0
      return (
        this.earningsData.intervals.reduce((total, interval) => {
          const devFund =
            interval.pools.find((p) => p.pool === 'dev_fund_reward')
              ?.earnings || 0
          const incomeBurn =
            interval.pools.find((p) => p.pool === 'income_burn')?.earnings || 0
          const tcyStake =
            interval.pools.find((p) => p.pool === 'tcy_stake_reward')
              ?.earnings || 0
          const totalEarnings = +interval.liquidityEarnings
          return (
            total +
            (totalEarnings - devFund - incomeBurn - tcyStake) *
              +interval.runePriceUSD
          )
        }, 0) / 1e8
      )
    },
    totalBurned() {
      if (!this.earningsData) return 0
      return (
        this.earningsData.intervals.reduce((total, interval) => {
          const incomeBurn =
            interval.pools.find((p) => p.pool === 'income_burn')?.earnings || 0
          return total + +incomeBurn * +interval.runePriceUSD
        }, 0) / 1e8
      )
    },
    totalTCYReward() {
      if (!this.earningsData) return 0
      return (
        this.earningsData.intervals.reduce((total, interval) => {
          const tcyStake =
            interval.pools.find((p) => p.pool === 'tcy_stake_reward')
              ?.earnings || 0
          return total + +tcyStake * +interval.runePriceUSD
        }, 0) / 1e8
      )
    },

    displayText() {
      if (this.selectedOption === 'All') {
        return this.selectedOption
      } else if (
        ['income_burn', 'dev_fund_reward', 'tcy_stake_reward'].includes(
          this.selectedOption
        )
      ) {
        return this.selectedOption
      } else {
        return this.showAsset(this.selectedOption)
      }
    },
    chartData() {
      if (!this.earningsData) return null
      return this.formatChartData(this.earningsData, this.selectedOption)
    },
    liquidityFeesData() {
      if (!this.earningsData) return null
      return this.formatLiquidityFees(this.earningsData, this.selectedOption)
    },
    bondingEarningsData() {
      if (!this.earningsData) return null
      return this.formatBondingEarnings(this.earningsData)
    },
  },
  watch: {
    chartPeriod(newPeriod, oldPeriod) {
      let intervalChange = true
      if (
        (newPeriod.includes('w') && oldPeriod.includes('w')) ||
        (newPeriod.includes('d') && oldPeriod.includes('d'))
      ) {
        intervalChange = false
      }
      this.updateQueryParams({ period: newPeriod })
      this.filterDataByPeriod(newPeriod, intervalChange)
    },
    selectedOption(newOption) {
      this.updateQueryParams({ pool: newOption })
      this.chartKey++
      this.updateCharts(this.earningsData, newOption)
    },
  },
  async mounted() {
    await this.loadInitialData()
  },
  methods: {
    setActiveView(view) {
      this.activeView = view
    },
    formatNumber(value) {
      return this.$options.filters.number(value, '0,0.00a')
    },
    async loadInitialData() {
      try {
        const isWeekly = this.chartPeriod.includes('w')
        const interval = isWeekly ? 'week' : 'day'
        const count = this.getCountFromPeriod(this.chartPeriod)

        const response = await earnings(interval, count)

        const intervals = response.data?.intervals || []

        this.chartInterval = interval
        this.earningsData = { ...response.data, intervals }

        const latestInterval = intervals[intervals.length - 1]
        this.pools = latestInterval?.pools
          ? latestInterval.pools
              .map((pool) => pool?.pool)
              .filter(
                (pool) =>
                  pool && typeof pool === 'string' && this.isValidAsset(pool)
              )
          : []

        this.updateCharts(this.earningsData, this.selectedOption)
      } catch (error) {
        console.error('Error fetching earnings data:', error)
        this.pools = []
      }
    },
    isValidAsset(assetStr) {
      if (!assetStr) return false
      return assetStr.includes('.')
    },
    async filterDataByPeriod(period, intervalChange = true) {
      const isWeekly = period.includes('w')
      const newInterval = isWeekly ? 'week' : 'day'

      if (intervalChange && newInterval !== this.chartInterval) {
        this.chartPeriod = period
        await this.loadInitialData()
        return
      }

      const count = this.getCountFromPeriod(period)

      const response = await earnings(newInterval, count)
      this.chartInterval = newInterval
      this.earningsData = {
        ...response.data,
        intervals: response.data.intervals.slice(-count),
      }

      this.updateCharts(this.earningsData, this.selectedOption)
    },
    updateQueryParams(newParams) {
      this.$router.replace({
        query: {
          ...this.$route.query,
          ...newParams,
        },
      })
    },

    updateCharts(data, selectedPool) {
      const poolEarnings =
        selectedPool === 'All'
          ? this.formatEarnings(data)
          : this.formatEarnings(data, selectedPool)
      poolEarnings.notMerge = true

      if (this.$refs.mainChart?.chart) {
        this.$refs.mainChart.chart.clear()
      }
      this.chartOptions = { ...poolEarnings }

      const liquidityFeesData =
        selectedPool === 'All'
          ? this.formatLiquidityFees(data)
          : this.formatLiquidityFees(data, selectedPool)
      this.liquidityFees = liquidityFeesData

      const bondingEarningsData = this.formatBondingEarnings(data)
      this.bondingEarnings = bondingEarningsData
    },

    getCountFromPeriod(period) {
      const periodMap = {
        90: 90,
        180: 180,
        365: 365,
        '50w': 50,
        '100w': 100,
      }
      return periodMap[period] || 90
    },

    formatEarnings(d, selectedPool = 'All') {
      const xAxis = []
      const series = []
      const specialPools = [
        'income_burn',
        'dev_fund_reward',
        'tcy_stake_reward',
      ]

      d?.intervals.forEach((interval, index) => {
        if (index === d.intervals.length - 1) return

        const formatType =
          this.chartInterval === 'week' ? 'YYYY, MMM D' : 'dddd, MMM D'
        xAxis.push(
          moment(
            ((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format(formatType)
        )

        if (selectedPool === 'All') {
          const liquidity = +interval.liquidityEarnings * +interval.runePriceUSD
          const bonding = interval.bondingEarnings
            ? +interval.bondingEarnings * +interval.runePriceUSD
            : 0

          const specialEarnings = specialPools.map((pool) => {
            const poolData = interval.pools.find((p) => p.pool === pool)
            return poolData ? +poolData.earnings * +interval.runePriceUSD : 0
          })

          series[0] = series[0] || []
          series[0].push(liquidity / 1e8)

          series[1] = series[1] || []
          series[1].push(bonding / 1e8)

          specialPools.forEach((pool, i) => {
            series[2 + i] = series[2 + i] || []
            series[2 + i].push(specialEarnings[i] / 1e8)
          })
        } else {
          const poolObj = interval.pools.find(
            (pool) => pool.pool === selectedPool
          )
          const value = poolObj ? +poolObj.earnings * +interval.runePriceUSD : 0
          series[0] = series[0] || []
          series[0].push(value / 1e8)
        }
      })

      const chartSeries =
        selectedPool === 'All'
          ? [
              {
                type: 'bar',
                name: 'Pool Earnings',
                stack: 'Total',
                showSymbol: false,
                areaStyle: {},
                data: series[0],
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
                data: series[1],
                smooth: true,
                lineStyle: { width: 2 },
                z: 2,
              },
              {
                type: 'bar',
                name: 'Income Burn',
                stack: 'Total',
                showSymbol: false,
                areaStyle: {},
                data: series[2],
                smooth: true,
                lineStyle: { width: 2 },
                z: 1,
              },
              {
                type: 'bar',
                name: 'Dev Fund Reward',
                stack: 'Total',
                showSymbol: false,
                areaStyle: {},
                data: series[3],
                smooth: true,
                lineStyle: { width: 2 },
                z: 1,
              },
              {
                type: 'bar',
                name: 'TCY Stake Reward',
                stack: 'Total',
                showSymbol: false,
                areaStyle: {},
                data: series[4],
                smooth: true,
                lineStyle: { width: 2 },
                z: 1,
              },
            ]
          : [
              {
                type: 'bar',
                name: 'Earnings',
                showSymbol: false,
                areaStyle: {},
                data: series[0],
                smooth: true,
                lineStyle: { width: 2 },
                z: 3,
              },
            ]

      return this.basicChartFormat(
        (value) => `$ ${this.normalFormat(value)}`,
        chartSeries,
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
    },

    formatLiquidityFees(d, selectedPool = 'All') {
      const xAxis = []
      const series = []

      d?.intervals.forEach((interval, index) => {
        if (index === d?.intervals?.length - 1) return

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

        series[0] = series[0] || []
        series[0].push(fees / 1e8)
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
            data: series[0],
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
      const series = []

      d?.intervals.forEach((interval, index) => {
        if (index === d?.intervals?.length - 1) return

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

        series[0] = series[0] || []
        series[0].push(finalEarnings / 1e8)
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
            data: series[0],
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
      this.bondingChartKey += 1
      if (this.earningsData) {
        this.bondingEarnings = this.formatBondingEarnings(this.earningsData)
      }
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
.view-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin: 2px 10px;

  @include lg {
    margin: 0;
  }

  .toggle-button {
    font-size: 12px;
    font-weight: 500;
    padding: 8px 12px;
    background-color: var(--bg-color);
    border-radius: 8px;
    border: 1px solid var(--border-color);
    color: var(--font-color);
    cursor: pointer;
    transition: all 0.2s ease;

    @include lg {
      font-size: 14px;
      font-weight: 500;
      padding: 12px 16px;
    }

    &:hover {
      background-color: var(--active-bg-color);
      color: var(--primary-color);
    }

    &.active {
      background-color: var(--active-bg-color);
      color: var(--primary-color);
      border: 1px solid var(--primary-color);
    }
  }
}

.header-earning {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;

  .dropdown {
    position: relative;
    display: inline-block;
    margin: 0 10px;

    @include md {
      margin: 0;
    }

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
