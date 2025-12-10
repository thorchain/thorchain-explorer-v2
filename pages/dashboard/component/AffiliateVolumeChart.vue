<template>
  <div class="affiliate-volume-chart">
    <!-- <VChart
      v-if="affiliateStatsChart && !loading"
      :key="affiliateStatsChartKey"
      :option="affiliateStatsChart"
      :autoresize="true"
      :theme="chartTheme"
    /> -->
    <ChartLoader :bar-count="30" />
  </div>
</template>

<script>
import moment from 'moment'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { orderBy } from 'lodash'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import ChartLoader from '~/components/ChartLoader.vue'
import { affiliateMap, interfaces } from '~/utils'

use([
  SVGRenderer,
  GridComponent,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
])

export default {
  name: 'AffiliateVolumeChart',
  components: {
    VChart,
    ChartLoader,
  },
  data() {
    return {
      affiliateStatsChart: null,
      affiliateStatsChartKey: 0,
      loading: false,
    }
  },
  computed: {
    chartInterval() {
      return 'day'
    },
    chartCount() {
      return 30
    },
  },
  mounted() {
    this.fetchAffiliateStatsData()
  },
  methods: {
    async fetchAffiliateStatsData() {
      try {
        this.loading = true
        const params = {
          count: this.chartCount,
          interval: this.chartInterval,
        }
        const response = await this.$api.getAffiliateStats(params)
        let data = response.data || []

        // Fetch the last day with from/to params
        if (data.length > 0) {
          const lastInterval = data[data.length - 1]
          const lastDayStart = moment.utc(lastInterval.startTime * 1000).startOf('day')
          const lastDayEnd = moment.utc(lastInterval.startTime * 1000).endOf('day')

          try {
            const lastDayResponse = await this.$api.getAffiliateStats( {
            from: Math.floor(lastDayStart.valueOf() / 1000),
            to: Math.floor(lastDayEnd.valueOf() / 1000),
            })
            if (lastDayResponse.data && lastDayResponse.data.length > 0) {
              data[data.length - 1] = lastDayResponse.data[0]
            }
          } catch (error) {
            console.error('Error fetching last day stats:', error)
          }
        }

        this.affiliateStatsChart = this.formatAffiliateStats(data)
        this.affiliateStatsChartKey += 1
      } catch (error) {
        console.error('Error fetching affiliate stats:', error)
      } finally {
        this.loading = false
      }
    },

    formatAffiliateStats(data) {
      if (!data || !Array.isArray(data) || data.length === 0) return null

      const xAxis = []
      const thornames = []
      const others = []

      data.forEach((interval, index) => {
        const date = this.formatDate(interval)
        xAxis.push(date)

        let filteredNames = {}

        const affiliateIncludes = (affiliates, affiliateEntry) => {
          const affiliatesSplit = affiliateEntry.split('/')
          return affiliatesSplit.some((aff) => affiliates.includes(aff))
        }

        const ignoreAggregator = (affiliates) => {
          const affiliatesSplit = affiliates.split('/')
          if (affiliatesSplit.length === 1) {
            return affiliates
          }
          if (
            affiliatesSplit.length > 1 &&
            (affiliatesSplit.includes('-_') || affiliatesSplit.includes('ro'))
          ) {
            const nonAggregator = affiliatesSplit.find((aff) => aff !== '-_' && aff !== 'ro')
            return nonAggregator || affiliates
          }
          return affiliates
        }

        const normalizeAffiliate = (affiliate) => {
          const affiliatesSplit = affiliate.split('/')
          // If all parts are the same (e.g., "sto/sto"), return just one
          if (affiliatesSplit.length > 1) {
            const firstPart = affiliatesSplit[0]
            if (affiliatesSplit.every((part) => part === firstPart)) {
              return firstPart
            }
          }
          return affiliate
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

          // Normalize the key to handle duplicates like "sto/sto" -> "sto"
          if (key && key !== 't' && key !== 'ti' && key !== 'va') {
            key = normalizeAffiliate(key)
          }

          // Filter out entries where key === ''
          if (key === '') {
            return acc
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

    formatDate(interval) {
      const timestamp = +interval.startTime * 1e3
      const date = moment.utc(timestamp).local()
      return date.format('dddd, MMM D')
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
  },
}
</script>

<style scoped>
.affiliate-volume-chart {
  width: 100%;
  height: 100%;
}
</style>
