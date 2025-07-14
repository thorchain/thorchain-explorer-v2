<template>
  <page>
    <div class="header-affiliate">
      <div class="header-controls">
        <Nav
          :active-mode.sync="chartPeriod"
          :nav-items="chartPeriods"
          pre-text="Period :"
        />

        <div class="custom-dropdown">
          <div class="dropdown-container">
            <div class="dropdown-select" @click="toggleDropdown">
              <div v-if="selectedFilter" class="selected-item">
                <affiliate
                  :affiliate-address="selectedFilter"
                  :use-new-icons="false"
                  :show-link="false"
                  class="item-label"
                />
              </div>
              <div v-else class="placeholder">All Affiliates</div>
              <angle-icon :class="{ trigger: true, rotated: isDropdownOpen }" />
            </div>
            <div v-if="isDropdownOpen" class="dropdown-menu">
              <div class="dropdown-item" @click="selectAffiliate('')">
                <span class="all-affiliates-text">All Affiliates</span>
              </div>
              <div
                v-for="affiliate in affiliateList"
                :key="affiliate"
                class="dropdown-item"
                @click="selectAffiliate(affiliate)"
              >
                <affiliate
                  :affiliate-address="affiliate"
                  :show-link="false"
                  class="item-label"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <cards-header :table-general-stats="affiliateGeneralStats" />

      <div class="charts-container">
        <div class="chart-item">
          <card title="Affiliate Fees" :is-loading="loading">
            <VChart
              v-if="affiliateChart"
              :key="affiliateChartKey"
              :option="affiliateChart"
              :autoresize="true"
              :theme="chartTheme"
            />
            <ChartLoader v-if="!affiliateChart" :bar-count="30" />
          </card>
        </div>

        <div class="chart-item">
          <card title="Affiliate Volume">
            <VChart
              v-if="affiliateStatsChart"
              :key="affiliateStatsChartKey"
              :option="affiliateStatsChart"
              :autoresize="true"
              :theme="chartTheme"
            />
            <ChartLoader v-if="!affiliateStatsChart" :bar-count="30" />
          </card>
        </div>
      </div>

      <div class="affiliate-table-section">
        <Header title="Affiliate Swaps" />
        <Nav
          :active-mode.sync="tablePeriod"
          :nav-items="tablePeriods"
          pre-text="Period :"
        />
        <transactions
          :txs="affiliateSwaps"
          :loading="!affiliateSwaps || isTableLoading"
          :props="formatProp"
        >
          <template #volume="{ props }">
            <span class="mono">
              {{ smallBaseAmountFormatWithCur(getVolume(props.row)) }}
            </span>
          </template>
        </transactions>
      </div>
    </div>
  </page>
</template>

<script>
import moment from 'moment'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { orderBy } from 'lodash'
import { LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import ChartLoader from '~/components/ChartLoader.vue'
import CardsHeader from '~/components/CardsHeader.vue'
import Affiliate from '~/components/Affiliate.vue'
import { affiliateMap } from '~/utils'
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
    ChartLoader,
    CardsHeader,
    Affiliate,
    AngleIcon,
  },
  data() {
    return {
      affiliateChartKey: 0,
      isFetching: false,
      affiliateChart: undefined,
      affiliate: [],
      filters: {
        affiliate: [],
      },
      chartPeriod: '7d',
      chartInterval: 'day',
      chartPeriods: [
        { text: '1 Day', mode: '24h' },
        { text: '7 Days', mode: '7d' },
        { text: '30 Days', mode: '30d' },
      ],
      affiliateSwaps: undefined,
      tablePeriod: '24h',
      tablePeriods: [
        { text: '1 Day', mode: '24h' },
        { text: '1 Month', mode: '30d' },
        { text: '1 Week', mode: '7d' },
      ],
      formatProp: [
        {
          label: 'Volume',
          field: 'volume',
          sortFn: this.volumeSort,
        },
      ],
      debounceTimer: null,
      tableDebounceTimer: null,
      isTableLoading: false,
      isSearchLoading: false,
      affiliateStatsChart: undefined,
      affiliateStatsChartKey: 0,
      statsLoading: false,
      affiliateGeneralStats: [
        {
          name: 'Total Volume',
          value: '-',
        },
        {
          name: 'Total Count',
          value: '-',
        },
        {
          name: 'Total Earnings',
          value: '-',
        },
      ],
      selectedFilter: '',
      isDropdownOpen: false,
      affiliateList: [],
    }
  },
  computed: {},
  watch: {
    chartPeriod(newVal) {
      this.updateQuery({ period: newVal })
      this.fetchAffiliateHistory()
      this.fetchAffiliateStats()
      this.updateAffiliateStats()
    },
    selectedFilter(newVal) {
      this.updateQuery({ affiliate: newVal })
    },
    'filters.affiliate': {
      handler(newVal) {
        if (newVal.length > 1) {
          this.filters.affiliate = [newVal[newVal.length - 1]]
        }
        this.fetchAffiliateSwaps()
        this.fetchAffiliateStats()
        this.updateAffiliateStats()
      },
      deep: true,
    },
    tablePeriod(newPeriod) {
      if (this.tableDebounceTimer) {
        clearTimeout(this.tableDebounceTimer)
      }
      this.isTableLoading = true
      this.tableDebounceTimer = setTimeout(() => {
        this.updateQuery({ tablePeriod: newPeriod })
        this.fetchAffiliateSwaps()
        this.tableDebounceTimer = null
      }, 300)
    },
  },
  mounted() {
    const queryPeriod = this.$route.query.period
    const queryAffiliate = this.$route.query.affiliate
    const queryTablePeriod = this.$route.query.tablePeriod

    if (queryPeriod && this.chartPeriods.some((p) => p.mode === queryPeriod)) {
      this.chartPeriod = queryPeriod
    }

    if (queryAffiliate) {
      this.filters.affiliate = [queryAffiliate]
      this.selectedFilter = queryAffiliate
    }

    if (
      queryTablePeriod &&
      this.tablePeriods.some((p) => p.mode === queryTablePeriod)
    ) {
      this.tablePeriod = queryTablePeriod
    }

    this.fetchAffiliateHistory()
    this.fetchAffiliateStats()
    this.fetchAffiliateSwaps()
    this.updateAffiliateStats()
    this.fetchAffiliateList()

    document.addEventListener('click', this.handleClickOutside)
  },

  beforeDestroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    if (this.tableDebounceTimer) {
      clearTimeout(this.tableDebounceTimer)
    }
    document.removeEventListener('click', this.handleClickOutside)
  },
  methods: {
    fillArrayWithZero(array, length) {
      while (array.length < length) {
        array.push(0)
      }
      return array
    },
    formatAffiliateHistory(d) {
      const xAxis = []
      const thornames = []
      const others = []

      d?.intervals.forEach((interval, index) => {
        if (index === d.intervals.length - 1) {
          return
        }

        const date = moment(
          Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
        )
        xAxis.push(date.format('dddd, MMM D'))

        const groupedThornames = interval.thornames.reduce((acc, thorname) => {
          const key = ['t', 'tl', 'T'].includes(thorname.thorname)
            ? 't'
            : ['ti', 'te', 'tr', 'td', 'tb'].includes(thorname.thorname)
              ? 'ti'
              : ['va', 'vi', 'v0'].includes(thorname.thorname)
                ? 'va'
                : thorname.thorname

          if (acc[key]) {
            acc[key].volumeUSD += +thorname.volumeUSD
          } else {
            acc[key] = {
              volumeUSD: +thorname.volumeUSD,
              thorname: key,
            }
          }
          return acc
        }, {})

        const sortedThornames = orderBy(
          Object.values(groupedThornames),
          [(o) => +o.volumeUSD],
          ['desc']
        )

        const topThornames = sortedThornames.slice(0, 5)
        const otherThornames = sortedThornames.slice(5)

        let otherTotal = 0
        otherThornames.forEach((thorname) => {
          otherTotal += +thorname.volumeUSD / 1e2
        })

        topThornames.forEach((thorname) => {
          const thornameIndex = thornames.findIndex(
            (t) => t.name === thorname.thorname
          )

          if (thornameIndex >= 0) {
            if (thornames[thornameIndex].data.length < index + 1) {
              thornames[thornameIndex].data = this.fillArrayWithZero(
                thornames[thornameIndex].data,
                index
              )
            }
            thornames[thornameIndex].data.push(+thorname.volumeUSD / 1e2)
          } else {
            let data = []
            if (index > 0) {
              data = this.fillArrayWithZero(data, index)
            }
            data.push(+thorname.volumeUSD / 1e2)
            thornames.push({
              type: 'bar',
              name: thorname.thorname,
              showSymbol: false,
              stack: 'Total',
              data,
            })
          }
        })

        if (others.length < index + 1) {
          others.push(0)
        }
        others[index] += otherTotal
      })

      const getInterfaceIcon = (detail) => {
        if (!detail.icons) {
          return ''
        }
        return this.theme === 'light' ? detail.icons.url : detail.icons.urlDark
      }

      const foramtchart = this.basicChartFormat(
        (value) => `$ ${this.normalFormat(value, '0,0.00a')}`,
        [
          ...thornames,
          {
            type: 'bar',
            name: 'Others',
            showSymbol: false,
            stack: 'Total',
            data: others,
          },
        ],
        xAxis,
        {
          legend: {
            show: false,
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
          ${param[0].name}
        </div>
        <div class="tooltip-body">
          ${param
            .filter((a) => a.value)
            .sort((a, b) => {
              if (a.seriesName === 'Others') return 1
              if (b.seriesName === 'Others') return -1
              return b.value - a.value
            })
            .map(
              (p) => `
                <span>
                  <div class="tooltip-item">
                    <div class="data-color" style="background-color: ${p.color}">
                    </div>
                    ${
                      this.mapInterfaceName(p.seriesName)
                        ? `<img class="tooltip-interface-icon" src="${getInterfaceIcon(this.mapInterfaceName(p.seriesName))}"/>`
                        : `<span style="text-align: left;">
                          ${p.seriesName}
                        </span>`
                    }

                  </div>
                  <b>$${p.value ? this.$options.filters.number(p.value, '0,0.00a') : '-'}</b>
                </span>`
            )
            .join('')}
        </div>
        <span style="border-top: 1px solid var(--border-color); margin: 2px 0;"></span>
        <hr>
        <span>
          <span>Total Fees</span>
          <b>$${this.$options.filters.number(
            param.reduce((a, c) => a + (c.value ? c.value : 0), 0),
            '0,0a'
          )}</b>
        </span>
      `
        }
      )
      return foramtchart
    },
    updateTags(type, tags) {
      this.filters[type] = tags
      this.fetchAffiliateHistory()
    },
    fetchAffiliateHistory() {
      let count, interval
      if (this.chartPeriod.includes('w')) {
        count = parseInt(this.chartPeriod.replace('w', ''))
        interval = 'week'
      } else {
        count = parseInt(this.chartPeriod)
        interval = 'day'
      }

      const params = {
        count,
        interval,
      }

      if (this.filters.affiliate.length > 0) {
        params.thorname = this.filters.affiliate.join(',')
      }

      this.$api
        .getAffiliateHistory(params)
        .then(async ({ data }) => {
          const af = this.formatAffiliateHistory(data)
          this.affiliateChart = af
          this.affiliateChartKey += 1
          await this.updateAffiliateStats()
        })
        .catch((error) => {
          console.error('Error fetching affiliate history:', error)
        })
        .finally(() => {
          this.isSearchLoading = false
        })
    },
    async fetchAffiliateSwaps() {
      try {
        if (this.filters.affiliate.length > 0) {
          const thorname = this.filters.affiliate[0]
          const response = await this.$api.getSwapsByThorname(
            thorname,
            this.tablePeriod
          )
          this.affiliateSwaps = response.data
        } else {
          const response = await this.$api.getSwapsByThorname(
            null,
            this.tablePeriod
          )
          this.affiliateSwaps = response.data
        }
      } catch (error) {
        console.error('Error fetching swaps:', error)
        this.affiliateSwaps = { actions: [] }
      } finally {
        this.isTableLoading = false
      }
    },
    getVolume(props) {
      const inPrice = +props?.metadata?.swap?.inPriceUSD ?? 0
      const inAmount = +props?.in[0]?.coins[0].amount ?? 0
      return inPrice * inAmount
    },
    volumeSort(x, y, col, rowX, rowY) {
      return this.getVolume(rowX) < this.getVolume(rowY)
        ? -1
        : this.getVolume(rowX) > this.getVolume(rowY)
          ? 1
          : 0
    },
    updateQuery(params) {
      const newQuery = { ...this.$route.query }

      // Update with new params
      Object.keys(params).forEach((key) => {
        if (
          params[key] === undefined ||
          params[key] === null ||
          params[key] === ''
        ) {
          delete newQuery[key]
        } else {
          newQuery[key] = params[key]
        }
      })

      this.$router.replace({ query: newQuery })
    },
    async fetchAffiliateStats() {
      try {
        this.statsLoading = true

        const period = this.chartPeriod === '24h' ? '24h' : this.chartPeriod
        const thorname =
          this.filters.affiliate.length > 0 ? this.filters.affiliate[0] : null

        const response = await this.$api.getAffiliateStats(period, thorname)
        const stats = this.formatAffiliateStats(response.data)
        this.affiliateStatsChart = stats
        this.affiliateStatsChartKey += 1
        await this.updateAffiliateStats()
      } catch (error) {
        console.error('Error fetching affiliate stats:', error)
        this.affiliateStatsChart = undefined
      } finally {
        this.statsLoading = false
      }
    },
    formatAffiliateStats(data) {
      if (!data || !Array.isArray(data) || data.length === 0) {
        return undefined
      }

      const xAxis = []
      const volumeSeries = []
      const countSeries = []

      data.forEach((item) => {
        const date = moment(item.date * 1000)
        if (this.chartPeriod === '24h') {
          xAxis.push(date.format('HH:mm'))
        } else {
          xAxis.push(date.format('dddd, MMM D'))
        }

        const volumeUSD = item.total_volume / 1e8
        volumeSeries.push(volumeUSD)
        countSeries.push(item.count)
      })

      const series = [
        {
          type: 'bar',
          name: 'Total Volume (USD)',
          showSymbol: false,
          stack: 'Total',
          data: volumeSeries,
          itemStyle: {
            color: '#00D4AA',
          },
        },
        {
          type: 'bar',
          name: 'Count',
          showSymbol: false,
          stack: 'Total',
          data: countSeries,
          itemStyle: {
            color: '#FF6B6B',
          },
        },
      ]

      const getInterfaceIcon = (detail) => {
        if (!detail.icons) {
          return ''
        }
        return this.theme === 'light' ? detail.icons.url : detail.icons.urlDark
      }

      const formattedChart = this.basicChartFormat(
        (value) => `$ ${this.normalFormat(value, '0,0.00a')}`,
        series,
        xAxis,
        {
          legend: {
            show: false,
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
          ${param[0].name}
        </div>
        <div class="tooltip-body">
          ${param
            .filter((a) => a.value)
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
                  <b>${p.seriesName === 'Total Volume (USD)' ? '$' : ''}${p.value ? this.$options.filters.number(p.value, '0,0.00a') : '-'}</b>
                </span>`
            )
            .join('')}
        </div>
      `
        }
      )
      return formattedChart
    },
    async updateAffiliateStats() {
      try {
        const period = this.chartPeriod
        const thorname =
          this.filters.affiliate.length > 0 ? this.filters.affiliate[0] : null

        const statsResponse = await this.$api.getAffiliateStats(
          period,
          thorname
        )
        let totalVolume = 0
        let totalCount = 0

        if (statsResponse.data && Array.isArray(statsResponse.data)) {
          statsResponse.data.forEach((item) => {
            totalVolume += item.total_volume / 1e8
            totalCount += item.count
          })
        }

        const historyParams = {
          count: period === '24h' ? 24 : period === '7d' ? 7 : 30,
          interval: period === '24h' ? 'hour' : 'day',
        }

        if (thorname) {
          historyParams.thorname = thorname
        }

        const historyResponse =
          await this.$api.getAffiliateHistory(historyParams)
        let totalEarnings = 0

        if (historyResponse.data && historyResponse.data.intervals) {
          historyResponse.data.intervals.forEach((interval) => {
            interval.thornames.forEach((thorname) => {
              totalEarnings += +thorname.volumeUSD / 1e2
            })
          })
        }

        this.affiliateGeneralStats = [
          {
            name: 'Total Volume',
            value: '$' + this.$options.filters.number(totalVolume, '0,0a'),
          },
          {
            name: 'Total Count',
            value: this.$options.filters.number(totalCount, '0,0'),
          },
          {
            name: 'Total Earnings',
            value: '$' + this.$options.filters.number(totalEarnings, '0,0a'),
          },
        ]
      } catch (error) {
        console.error('Error updating affiliate stats:', error)
      }
    },

    onFilterChange() {
      console.log('Selected filter:', this.selectedFilter)
    },

    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen
    },

    selectAffiliate(affiliate) {
      this.selectedFilter = affiliate
      this.filters.affiliate = affiliate ? [affiliate] : []
      this.isDropdownOpen = false
      this.updateQuery({ affiliate: affiliate || undefined })
      this.fetchAffiliateHistory()
      this.fetchAffiliateStats()
      this.updateAffiliateStats()
    },

    handleClickOutside(event) {
      const dropdown = this.$el.querySelector('.dropdown-container')
      if (dropdown && !dropdown.contains(event.target)) {
        this.isDropdownOpen = false
      }
    },

    fetchAffiliateList() {
      this.affiliateList = Object.keys(affiliateMap)
    },
  },
}
</script>

<style lang="scss" scoped>
.header-controls {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.custom-dropdown {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 10px 0px 10px;

  @include md {
    margin: 0 0px 0px 0px;
  }

  .dropdown-container {
    position: relative;
    min-width: 150px;
    padding: 3px;

    .dropdown-select {
      padding: $space-10 $space-12;
      border: 1px solid var(--border-color);
      border-radius: $radius-lg;
      background-color: var(--card-bg-color);
      color: var(--sec-font-color);
      font-size: $font-size-sm;
      min-width: 150px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      transition:
        border-color 0.3s ease,
        box-shadow 0.3s ease;

      &:hover {
        border-color: var(--primary-color);
        background-color: var(--active-bg-color);
      }

      &:focus {
        outline: none;
        border-color: var(--primary-color);
      }

      .selected-item {
        display: flex;
        align-items: center;
        flex: 1;
      }

      .placeholder {
        color: var(--sec-font-color);
        font-size: $font-size-sm;
      }

      .trigger {
        width: 1rem;
        height: 1rem;
        fill: var(--font-color);
        cursor: pointer;
        transition: transform 0.3s ease;

        &.rotated {
          transform: rotate(180deg);
        }
      }
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background-color: var(--card-bg-color);
      border: 1px solid var(--border-color);
      border-radius: $radius-lg;
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
      margin-top: $space-5;
      padding: $space-5;

      .dropdown-item {
        padding: $space-10 $space-12;
        cursor: pointer;
        border-radius: $radius-s;
        display: flex;
        align-items: center;
        transition: background-color 0.3s ease;
        margin-bottom: $space-2;

        &:hover {
          background-color: var(--active-bg-color);
          color: var(--primary-color);
        }

        &:last-child {
          margin-bottom: 0;
        }

        .all-affiliates-text {
          font-weight: 500;
          color: var(--sec-font-color);
          font-size: $font-size-sm;
        }
      }
    }
  }
}

.charts-container {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.chart-item {
  flex: 1;
}

@media (max-width: 768px) {
  .header-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .charts-container {
    flex-direction: column;
  }
}

.affiliate-table-section {
  margin-top: 1rem;
}

.mt-4 {
  margin-top: 1rem;
}
</style>
