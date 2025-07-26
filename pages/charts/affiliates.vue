<template>
  <page>
    <div class="header-affiliate">
      <div class="header-controls">
        <Nav
          :active-mode="chartPeriod"
          :nav-items="chartPeriods"
          pre-text="Period :"
          @update:activeMode="onPeriodChange"
        />

        <AffiliateDropdown
          :selected="selectedFilter"
          :affiliate-list="affiliateList"
          :is-open="isDropdownOpen"
          @toggle="toggleDropdown"
          @select="onAffiliateChange"
        />
      </div>

      <cards-header :table-general-stats="affiliateGeneralStats" />
      <div class="charts-container">
        <div class="chart-item">
          <card title="Fees Stats">
            <template #header>
              <div
                class="csv-download"
                title="Download CSV"
                @click="downloadAffiliateFeesChart()"
              >
                <file-download class="clickable"></file-download>
              </div>
            </template>
            <VChart
              v-if="affiliateChart && !loading"
              :key="affiliateChartKey"
              :option="affiliateChart"
              :autoresize="true"
              :theme="chartTheme"
            />
            <ChartLoader v-if="!affiliateChart || loading" :bar-count="15" />
          </card>
        </div>

        <div class="chart-item">
          <card title="Swaps Stats">
            <template #header>
              <div
                class="csv-download"
                title="Download CSV"
                @click="downloadAffiliateSwapsChart()"
              >
                <file-download class="clickable"></file-download>
              </div>
            </template>
            <VChart
              v-if="affiliateStatsChart && !loading"
              :key="affiliateStatsChartKey"
              :option="affiliateStatsChart"
              :autoresize="true"
              :theme="chartTheme"
            />
            <ChartLoader
              v-if="!affiliateStatsChart || loading"
              :bar-count="15"
            />
          </card>
        </div>
      </div>

      <div class="affiliate-table-section">
        <div class="table-header">
          <Header title="Top Swaps" />
          <div
            class="csv-download"
            title="Download CSV"
            @click="downloadAffiliateSwaps(affiliateSwaps)"
          >
            <file-download class="clickable"></file-download>
          </div>
        </div>
        <transactions
          :txs="affiliateSwaps"
          :loading="!affiliateSwaps || isTableLoading"
          :props="tableColumns"
        >
          <template #volume="{ props }">
            <span class="mono">
              {{ formatVolume(props.row) }}
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
import AffiliateDropdown from '~/components/AffiliateDropdown.vue'
import { affiliateList, affiliateMap, interfaces } from '~/utils'
import FileDownload from '~/assets/images/file-download.svg?inline'

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
  name: 'AffiliatesChart',
  components: {
    VChart,
    ChartLoader,
    CardsHeader,
    AffiliateDropdown,
    FileDownload,
  },

  data() {
    return {
      affiliateChart: null,
      affiliateStatsChart: null,
      affiliateChartKey: 0,
      affiliateStatsChartKey: 0,

      loading: false,
      isTableLoading: false,

      selectedFilter: '',
      isDropdownOpen: false,
      affiliate: '',

      chartPeriods: [
        { text: '1 Day', mode: '24h' },
        { text: '14 Days', mode: '14d' },
        { text: '30 Days', mode: '30d' },
      ],

      affiliateSwaps: null,
      affiliateGeneralStats: [
        { name: 'Volume', value: '-' },
        { name: 'Swaps', value: '-' },
        { name: 'Earnings', value: '-' },
        { name: 'Volume per Swap', value: '-' },
      ],

      tableColumns: [
        {
          label: 'Volume',
          field: 'volume',
          sortFn: this.sortByVolume,
        },
      ],
    }
  },
  computed: {
    chartPeriod() {
      const { period } = this.$route.query
      return period && this.chartPeriods.some((p) => p.mode === period)
        ? period
        : '24h'
    },

    chartInterval() {
      return this.chartPeriod === '24h' ? 'hour' : 'day'
    },

    chartCount() {
      return parseInt(this.chartPeriod)
    },

    affiliateList() {
      return affiliateList().map(({ id }) => id)
    },
  },

  watch: {
    '$route.query': {
      handler(query) {
        this.handleQueryChange(query)
      },
      immediate: true,
      deep: true,
    },
  },

  mounted() {
    this.setupEventListeners()
  },

  beforeDestroy() {
    this.cleanupEventListeners()
  },

  methods: {
    async handleQueryChange(newQuery) {
      this.affiliate =
        affiliateList()
          .find((affiliate) => affiliate.id === newQuery.affiliate)
          ?.thornames?.join(',') ||
        newQuery.affiliate ||
        ''
      this.selectedFilter = newQuery.affiliate || ''
      await this.fetchAllData()
    },

    setupEventListeners() {
      document.addEventListener('click', this.handleClickOutside)
    },

    cleanupEventListeners() {
      document.removeEventListener('click', this.handleClickOutside)
    },

    async fetchAllData() {
      try {
        this.loading = true
        this.isTableLoading = true

        const [historyData, statsData, swapsData] = await Promise.all([
          this.fetchAffiliateHistoryData(),
          this.fetchAffiliateStatsData(),
          this.fetchAffiliateSwapsData(),
        ])

        this.processAllData(historyData, statsData, swapsData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        this.loading = false
        this.isTableLoading = false
      }
    },

    async fetchAffiliateHistoryData() {
      try {
        const params = {
          count: this.chartCount,
          interval: this.chartInterval,
        }
        if (this.affiliate) {
          params.thorname = this.affiliate
        }
        const { data } = await this.$api.getAffiliateHistory(params)
        return data
      } catch (error) {
        console.error('Error fetching affiliate history:', error)
        return null
      }
    },

    async fetchAffiliateSwapsData() {
      try {
        const response = await this.$api.getSwapsByThorname(
          this.affiliate,
          this.chartPeriod
        )
        return response.data
      } catch (error) {
        console.error('Error fetching swaps:', error)
        return { actions: [] }
      }
    },

    async fetchAffiliateStatsData() {
      try {
        const params = {
          count: this.chartCount,
          interval: this.chartInterval,
        }
        if (this.affiliate) {
          params.thorname = this.affiliate
        }
        const response = await this.$api.getAffiliateStats(params)
        return response.data
      } catch (error) {
        console.error('Error fetching affiliate stats:', error)
        return null
      }
    },

    processAllData(historyData, statsData, swapsData) {
      this.affiliateChart = this.formatAffiliateHistory(historyData)
      this.affiliateStatsChart = this.formatAffiliateStats(statsData)
      this.affiliateSwaps = swapsData

      this.affiliateChartKey += 1
      this.affiliateStatsChartKey += 1

      this.updateStatsFromData(historyData, statsData)
    },

    updateStatsFromData(historyData, statsData) {
      const { totalVolume, totalCount } = this.calculateStatsTotals(statsData)
      const totalEarnings = this.calculateTotalEarnings(historyData)
      const volumePerSwap = totalCount > 0 ? totalVolume / totalCount : 0

      this.affiliateGeneralStats = [
        {
          name: 'Volume',
          value: '$' + this.$options.filters.number(totalVolume, '0,0a'),
        },
        {
          name: 'Swaps',
          value: this.$options.filters.number(totalCount, '0,0'),
        },
        {
          name: 'Earnings',
          value: '$' + this.$options.filters.number(totalEarnings, '0,0a'),
        },
        {
          name: 'Volume per Swap',
          value: '$' + this.$options.filters.number(volumePerSwap, '0,0a'),
        },
      ]
    },

    formatAffiliateHistory(data) {
      if (!data?.intervals) return null

      const xAxis = []
      const thornames = []
      const others = []

      data.intervals.forEach((interval, index) => {
        if (index === data.intervals.length - 1) return

        const date = this.formatDate(interval)
        xAxis.push(date)

        let filteredNames = {}

        filteredNames = interval.thornames.reduce((acc, thorname) => {
          const key = ['t', 'tl', 'T'].includes(thorname.thorname)
            ? 't'
            : ['ti', 'te', 'tr', 'td', 'tb', 't1'].includes(thorname.thorname)
              ? 'ti'
              : ['va', 'vi', 'v0'].includes(thorname.thorname)
                ? 'va'
                : thorname.thorname

          if (acc[key]) {
            acc[key].volumeUSD += +thorname.volumeUSD
            acc[key].count += +thorname.count
          } else {
            acc[key] = {
              volumeUSD: +thorname.volumeUSD,
              thorname: key,
              count: +thorname.count,
            }
          }
          return acc
        }, {})

        filteredNames = orderBy(
          Object.values(filteredNames),
          [(o) => +o.volumeUSD],
          ['desc']
        )

        const topNames = 5
        let otherTotal = 0

        for (let ti = 0; ti < filteredNames.length; ti++) {
          if (topNames < ti) {
            otherTotal += +filteredNames[ti]?.volumeUSD / 1e2
            if (filteredNames.length - 1 === ti) {
              others.push(otherTotal)
            }
            continue
          }

          const thornameIndex = thornames.findIndex(
            (t) => t.name === filteredNames[ti].thorname
          )

          if (thornameIndex >= 0) {
            if (thornames[thornameIndex].data.length < index + 1) {
              thornames[thornameIndex].data = this.fillArrayWithZero(
                thornames[thornameIndex].data,
                index
              )
            }
            thornames[thornameIndex].data.push(
              +filteredNames[ti]?.volumeUSD / 1e2
            )
          } else {
            let data = []
            if (index > 0) {
              data = this.fillArrayWithZero(data, index)
            }
            data.push(+filteredNames[ti]?.volumeUSD / 1e2)
            thornames.push({
              type: 'bar',
              name: filteredNames[ti].thorname,
              showSymbol: false,
              stack: 'Total',
              data,
            })
          }
        }
      })

      return this.createChartOption(
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
        this.createTooltip()
      )
    },

    formatDate(interval) {
      const timestamp = +interval.startTime * 1e3
      const date = moment.utc(timestamp).local()
      return this.chartPeriod === '24h'
        ? date.format('MMM Do, HH:mm')
        : date.format('dddd, MMM D')
    },

    formatAffiliateStats(data) {
      if (!data || !Array.isArray(data) || data.length === 0) return null

      const xAxis = []
      const thornames = []
      const others = []

      data.forEach((interval, index) => {
        if (index === data.length - 1) return

        const date = this.formatDate(interval)
        xAxis.push(date)

        let filteredNames = {}

        const affiliateIncludes = (affiliates, affiliateEntry) => {
          const affiliatesSplit = affiliateEntry.split('/')
          return affiliatesSplit.some((aff) => affiliates.includes(aff))
        }

        const ignoreAggregator = (affiliates) => {
          const affiliatesSplit = affiliates.split('/')
          if (
            affiliates.length > 0 &&
            (affiliatesSplit.includes('-_') || affiliatesSplit.includes('ro'))
          ) {
            return affiliatesSplit.find((aff) => aff !== '-_' && aff !== 'ro')
          }
          return affiliates
        }

        filteredNames = interval.affiliates.reduce((acc, affiliate) => {
          let key = affiliateIncludes(['t', 'tl', 'T'], affiliate.affiliate)
            ? 't'
            : affiliateIncludes(
                  ['ti', 'te', 'tr', 'td', 'tb', 't1'],
                  affiliate.affiliate
                )
              ? 'ti'
              : affiliateIncludes(['va', 'vi', 'v0'], affiliate.affiliate)
                ? 'va'
                : ignoreAggregator(affiliate.affiliate)

          if (key === '') {
            key = 'No Affiliate'
          }

          if (acc[key]) {
            acc[key].volume += +affiliate.volume
            acc[key].count += +affiliate.count
          } else {
            acc[key] = {
              volume: +affiliate.volume,
              affiliate: key,
              count: +affiliate.count,
            }
          }
          return acc
        }, {})

        filteredNames = orderBy(
          Object.values(filteredNames),
          [(o) => +o.volume],
          ['desc']
        )

        const topNames = 5
        let otherTotal = 0

        for (let ti = 0; ti < filteredNames.length; ti++) {
          if (topNames < ti) {
            otherTotal += +filteredNames[ti]?.volume / 1e8
            if (filteredNames.length - 1 === ti) {
              others.push(otherTotal)
            }
            continue
          }

          const thornameIndex = thornames.findIndex(
            (t) => t.name === filteredNames[ti].affiliate
          )

          if (thornameIndex >= 0) {
            if (thornames[thornameIndex].data.length < index + 1) {
              thornames[thornameIndex].data = this.fillArrayWithZero(
                thornames[thornameIndex].data,
                index
              )
            }
            thornames[thornameIndex].data.push(+filteredNames[ti]?.volume / 1e8)
          } else {
            let data = []
            if (index > 0) {
              data = this.fillArrayWithZero(data, index)
            }
            data.push(+filteredNames[ti]?.volume / 1e8)
            thornames.push({
              type: 'bar',
              name: filteredNames[ti].affiliate,
              showSymbol: false,
              stack: 'Total',
              data,
            })
          }
        }
      })

      return this.createChartOption(
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
        this.createTooltip('Volume')
      )
    },

    createChartOption(series, xAxis, tooltipFormatter) {
      return this.basicChartFormat(
        (value) => `$ ${this.normalFormat(value, '0,0.00a')}`,
        series,
        xAxis,
        {
          legend: { show: false },
          yAxis: [
            {
              type: 'value',
              name: '',
              position: 'right',
              show: false,
              splitLine: { show: true },
            },
          ],
        },
        tooltipFormatter
      )
    },

    createTooltip(label = 'Fees') {
      return (param) => {
        const getInterfaceIcon = (detail) => {
          if (!detail.icons) return ''
          return this.theme === 'light'
            ? detail.icons.url
            : detail.icons.urlDark
        }

        const sortedParams = param
          .filter((a) => a.value)
          .sort((a, b) => {
            if (a.seriesName === 'Others') return 1
            if (b.seriesName === 'Others') return -1
            return b.value - a.value
          })

        const totalFees = param.reduce((sum, c) => sum + (c.value || 0), 0)

        return `
          <div class="tooltip-header">${param[0].name}</div>
          <div class="tooltip-body">
            ${sortedParams
              .map(
                (p) => `
              <span>
                <div class="tooltip-item">
                  <div class="data-color" style="background-color: ${p.color}"></div>
                  ${
                    this.mapInterfaceName(p.seriesName)
                      ? `<img class="tooltip-interface-icon" src="${getInterfaceIcon(this.mapInterfaceName(p.seriesName))}"/>`
                      : `<span style="text-align: left;">${p.seriesName}</span>`
                  }
                </div>
                <b>$${p.value ? this.$options.filters.number(p.value, '0,0.00a') : '-'}</b>
              </span>
            `
              )
              .join('')}
          </div>
          <span style="border-top: 1px solid var(--border-color); margin: 2px 0;"></span>
          <hr>
          <span>
            <span>Total ${label}</span>
            <b>$${this.$options.filters.number(totalFees, '0,0.00a')}</b>
          </span>
        `
      }
    },

    createStatsTooltip() {
      return (param) => {
        const sortedParams = param
          .filter((a) => a.value)
          .sort((a, b) => b.value - a.value)

        return `
          <div class="tooltip-header">${param[0].name}</div>
          <div class="tooltip-body">
            ${sortedParams
              .map(
                (p) => `
              <span>
                <div class="tooltip-item">
                  <div class="data-color" style="background-color: ${p.color}"></div>
                  <span style="text-align: left;">${p.seriesName}</span>
                </div>
                <b>${p.seriesName === 'Total Volume (USD)' ? '$' : ''}${p.value ? this.$options.filters.number(p.value, '0,0.00a') : '-'}</b>
              </span>
            `
              )
              .join('')}
          </div>
        `
      }
    },

    calculateStatsTotals(data) {
      let totalVolume = 0
      let totalCount = 0

      if (data && Array.isArray(data)) {
        data.forEach((item) => {
          totalVolume += item.total_volume / 1e8
          totalCount += item.count
        })
      }

      return { totalVolume, totalCount }
    },

    calculateTotalEarnings(data) {
      let totalEarnings = 0

      if (data?.intervals) {
        data.intervals.forEach((interval) => {
          interval.thornames.forEach((thorname) => {
            totalEarnings += +thorname.volumeUSD / 1e2
          })
        })
      }

      return totalEarnings
    },

    formatVolume(row) {
      const inPrice = +row?.metadata?.swap?.inPriceUSD ?? 0
      const inAmount = +row?.in[0]?.coins[0].amount ?? 0
      return this.smallBaseAmountFormatWithCur(inPrice * inAmount)
    },

    sortByVolume(x, y, col, rowX, rowY) {
      const volumeX = this.getVolumeFromRow(rowX)
      const volumeY = this.getVolumeFromRow(rowY)
      return volumeX < volumeY ? -1 : volumeX > volumeY ? 1 : 0
    },

    getVolumeFromRow(row) {
      const inPrice = +row?.metadata?.swap?.inPriceUSD ?? 0
      const inAmount = +row?.in[0]?.coins[0].amount ?? 0
      return inPrice * inAmount
    },

    onPeriodChange(newPeriod) {
      this.$router.push({
        query: { ...this.$route.query, period: newPeriod },
      })
    },

    onAffiliateChange(affiliate) {
      const query = { ...this.$route.query }
      if (affiliate) {
        query.affiliate = affiliate
      } else {
        delete query.affiliate
      }
      this.$router.push({ query })
    },

    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen
    },

    handleClickOutside(event) {
      const dropdown = this.$el.querySelector('.dropdown-container')
      if (dropdown && !dropdown.contains(event.target)) {
        this.isDropdownOpen = false
      }
    },

    fillArrayWithZero(array, length) {
      while (array.length < length) {
        array.push(0)
      }
      return array
    },

    mapInterfaceName(s) {
      let ifc = interfaces[s.toLowerCase()]

      if (!ifc) {
        ifc = affiliateMap[s.toLowerCase()]
        if (!ifc) {
          return undefined
        }
      }

      const icons = {
        url: undefined,
        urlDark: undefined,
      }

      if (ifc.icon) {
        icons.url = require(`@/assets/images/${ifc.icon}.png`)
        icons.urlDark = require(`@/assets/images/${ifc.icon}-dark.png`)
      }

      return {
        name: ifc.name ?? ifc,
        icons,
        addName: ifc.addName ?? false,
      }
    },

    downloadAffiliateSwaps(data) {
      let swapsData = data
      if (data.actions && Array.isArray(data.actions)) {
        swapsData = data.actions
      } else if (Array.isArray(data)) {
        swapsData = data
      } else {
        console.error('Unexpected data structure:', data)
        return
      }

      if (!swapsData.length) {
        console.error('No swaps data available for CSV download.')
        return
      }

      const csvData = swapsData.map((swap) => {
        const inPrice = +swap?.metadata?.swap?.inPriceUSD ?? 0
        const inAmount = +swap?.in[0]?.coins[0]?.amount ?? 0
        const volume = inPrice * inAmount

        const nonAffiliateOuts = swap.out?.filter((out) => !out.affiliate) || []
        const firstNonAffiliateOut = nonAffiliateOuts[0]

        return {
          hash:
            swap.tx?.hash ||
            swap.hash ||
            swap.txHash ||
            swap.in?.[0]?.txID ||
            swap.tx?.id ||
            '',
          date: swap.tx?.date
            ? moment.unix(swap.tx.date).format('YYYY-MM-DD HH:mm:ss')
            : swap.date
              ? moment(swap.date / 1e6).format('YYYY-MM-DD HH:mm:ss')
              : '',
          volume: volume / 1e8,
          volumeUSD: this.$options.filters.number(volume / 1e8, '0,0.00a'),
          from: swap.in?.[0]?.address || '',
          to: firstNonAffiliateOut?.address || '',
          inAsset: swap.in[0]?.coins[0]?.asset || '',
          inAmount: (swap.in[0]?.coins[0]?.amount || 0) / 1e8,
          outAsset: firstNonAffiliateOut?.coins[0]?.asset || '',
          outAmount: (firstNonAffiliateOut?.coins[0]?.amount || 0) / 1e8,
        }
      })

      const csvContent = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map((row) =>
          Object.values(row)
            .map((value) => `"${value}"`)
            .join(',')
        ),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      const affiliateName = this.affiliate || 'all'
      const period = this.chartPeriod
      const timestamp = moment().format('YYYY-MM-DD')

      link.setAttribute('href', url)
      link.setAttribute(
        'download',
        `affiliate-swaps-${affiliateName}-${period}-${timestamp}.csv`
      )
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },

    downloadAffiliateFeesChart() {
      if (!this.affiliateChart) {
        console.error('No chart data available for CSV download.')
        return
      }

      const series = this.affiliateChart.series
      const xAxis = this.affiliateChart.xAxis.data

      if (!xAxis || !Array.isArray(xAxis)) {
        console.error('Invalid chart data structure.')
        return
      }

      const csvData = []
      xAxis.forEach((date, index) => {
        const row = { date }
        series.forEach((s) => {
          const value = s.data[index] || 0
          if (s.name && s.name !== 'undefined') {
            row[s.name] = value
          }
        })
        csvData.push(row)
      })

      const csvContent = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map((row) =>
          Object.values(row)
            .map((value) => `"${value}"`)
            .join(',')
        ),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      const affiliateName = this.affiliate || 'all'
      const period = this.chartPeriod
      const timestamp = moment().format('YYYY-MM-DD')

      link.setAttribute('href', url)
      link.setAttribute(
        'download',
        `affiliate-fees-${affiliateName}-${period}-${timestamp}.csv`
      )
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },

    downloadAffiliateSwapsChart() {
      if (!this.affiliateStatsChart) {
        console.error('No chart data available for CSV download.')
        return
      }

      const series = this.affiliateStatsChart.series
      const xAxis = this.affiliateStatsChart.xAxis.data

      if (!xAxis || !Array.isArray(xAxis)) {
        console.error('Invalid chart data structure.')
        return
      }

      const csvData = []
      xAxis.forEach((date, index) => {
        const row = { date }
        series.forEach((s) => {
          const value = s.data[index] || 0
          if (s.name && s.name !== 'undefined') {
            row[s.name] = value
          }
        })
        csvData.push(row)
      })

      const csvContent = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map((row) =>
          Object.values(row)
            .map((value) => `"${value}"`)
            .join(',')
        ),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      const affiliateName = this.affiliate || 'all'
      const period = this.chartPeriod
      const timestamp = moment().format('YYYY-MM-DD')

      link.setAttribute('href', url)
      link.setAttribute(
        'download',
        `affiliate-swaps-${affiliateName}-${period}-${timestamp}.csv`
      )
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
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

.charts-container {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.chart-item {
  flex: 1;
}

.affiliate-table-section {
  margin-top: 1rem;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.csv-download {
  padding: $space-6;
  cursor: pointer;
  background-color: var(--card-bg-color);
  border-radius: $radius-s;
  border: 1px solid var(--border-color);
  margin: 0px 10px;
  display: flex;
  align-items: center;
  margin-left: auto;

  &:hover svg {
    fill: var(--primary-color);
  }

  svg {
    fill: var(--sec-font-color);
    height: 1.2rem;
    width: 1.2rem;
  }
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
</style>
