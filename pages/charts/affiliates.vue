<template>
  <page>
    <div class="header-affiliate">
      <Nav
        :active-mode.sync="chartPeriod"
        :nav-items="chartPeriods"
        pre-text="Period :"
      />
      <div class="search-container">
        <div id="vote-search-container">
          <input
            v-model="affiliateInput"
            placeholder="Enter Affiliate and press enter"
            class="search-input"
          />
          <SearchIcon class="search-icon" />
        </div>
      </div>

      <card title="Affiliate Fees" :is-loading="loading">
        <VChart
          :key="affiliateChartKey"
          :option="affiliateChart"
          :loading="!affiliateChart"
          :autoresize="true"
          :loading-options="showLoading"
          :theme="chartTheme"
        />
      </card>
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
import SearchIcon from '~/assets/images/search.svg?inline'

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
    SearchIcon,
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
      chartPeriod: '90',
      chartInterval: 'day',
      chartPeriods: [
        { text: '90 D', mode: '90' },
        { text: '180 D', mode: '180' },
        { text: '20 W', mode: '20w' },
      ],
      affiliateInput: '',
      isFocused: false,
    }
  },
  watch: {
    chartPeriod(newVal) {
      this.updateQuery({ period: newVal })
      this.fetchAffiliateHistory()
    },
    'filters.affiliate': {
      handler(newVal) {
        if (newVal.length > 1) {
          this.filters.affiliate = [newVal[newVal.length - 1]]
        }
      },
      deep: true,
    },
    affiliateInput(newVal) {
      if (newVal.trim() === '') {
        this.filters.affiliate = []
        this.updateQuery({ thorname: undefined, period: undefined })
        this.fetchAffiliateHistory()
      } else {
        this.filters.affiliate = [newVal.trim()]
        this.updateQuery({ thorname: newVal.trim() })
        this.fetchAffiliateHistory()
      }
    },
  },
  mounted() {
    const queryPeriod = this.$route.query.period
    const queryThorname = this.$route.query.thorname

    if (queryPeriod && this.chartPeriods.some((p) => p.mode === queryPeriod)) {
      this.chartPeriod = queryPeriod
    }

    if (queryThorname) {
      this.filters.affiliate = [queryThorname]
      this.affiliateInput = queryThorname
    }

    this.fetchAffiliateHistory()
  },
  methods: {
    addAffiliate() {
      if (this.affiliateInput.trim() !== '') {
        this.filters.affiliate = [this.affiliateInput.trim()]
        this.updateQuery({ thorname: this.affiliateInput.trim() })
        this.fetchAffiliateHistory()
      }
    },
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
        .then(({ data }) => {
          const af = this.formatAffiliateHistory(data)
          this.affiliateChart = af
          this.affiliateChartKey += 1
        })
        .catch((error) => {
          console.error('Error fetching affiliate history:', error)
        })
    },
    updateQuery(params) {
      this.$router.replace({ query: { ...this.$route.query, ...params } })
    },
  },
}
</script>

<style lang="scss" scoped>
.search-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
#vote-search-container {
  display: flex;
  position: relative;
  flex: 1;
  margin-bottom: 0.5rem;

  .search-input {
    flex: 1;
    color: var(--sec-font-color);
    background-color: var(--bg-color);
    border: 1px solid var(--border-color) !important;
    border-radius: 0.5rem;
    outline: none;
    margin: 2px;
    padding: 12px;
    font-size: 0.9062rem;
    font-weight: 450;

    &:focus {
      border-color: transparent;
      box-shadow: 0 0 0 0.15rem rgba(255, 255, 255, 0.1);
      color: var(--primary-color);
    }
  }

  .search-icon {
    position: absolute;
    width: 20px;
    height: 24px;
    fill: var(--font-color);
    right: 0.8rem;
    top: calc(50% - 0.8rem);
    cursor: pointer;
    transition: fill 0.3s ease;
    box-sizing: content-box;
    background: var(--card-bg-color);
    padding-left: 0.3rem;
  }
}
</style>
