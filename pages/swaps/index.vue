<template>
  <Page>
    <Nav
      :active-mode.sync="chartPeriod"
      :nav-items="chartPeriods"
      pre-text="Period :"
    />
    <card title="Swaps Volume">
      <VChart
        :option="swapHistory"
        :loading="!swapHistory"
        :loading-options="showLoading"
        :theme="chartTheme"
        :autoresize="true"
      />
    </card>
    <div>
      <Header title="Top Swaps" />
      <Nav
        :active-mode.sync="tablePeriod"
        :nav-items="tablePeriods"
        pre-text="Period :"
      />
      <transactions :txs="swaps" :loading="!swaps" :props="formatProp">
        <template #volume="{ props }">
          <span class="mono">
            {{ smallBaseAmountFormatWithCur(getVolume(props.row)) }}
          </span>
        </template>
      </transactions>
    </div>
  </Page>
</template>

<script>
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import moment from 'moment'

use([
  SVGRenderer,
  GridComponent,
  BarChart,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
])
export default {
  components: {
    VChart,
  },
  data() {
    return {
      swaps: undefined,
      swapHistory: undefined,
      allSwapHistory: undefined, 
      formatProp: [
        {
          label: 'Volume',
          field: 'volume',
          sortFn: this.volumeSort,
        },
      ],
      chartPeriod: '90', 
      chartPeriods: [
        { text: '90 Days', mode: '90' }, 
        { text: '180 Days', mode: '180' }, 
        { text: '1 Year', mode: '365' }, 
      ],
      tablePeriod: 'day',
      tablePeriods: [
        { text: '1 Day', mode: 'day' },
        { text: '1 Week', mode: 'week' },
        { text: '1 Month', mode: 'month' },
      ],
    }
  },
  watch: {
    chartPeriod(newPeriod) {
      this.$router.push({
        query: {
          ...this.$route.query,
          chartPeriod: newPeriod, 
        },
      })
      this.filterDataByPeriod(newPeriod) 
    },
    tablePeriod(newPeriod) {
      this.$router.push({
        query: {
          ...this.$route.query,
          tablePeriod: newPeriod,
        },
      })
      this.fetchTableData(newPeriod)
    },
  },
  async mounted() {
    const queryChartPeriod = this.$route.query.chartPeriod
    const queryTablePeriod = this.$route.query.tablePeriod

    let shouldUpdateQuery = false

    if (queryChartPeriod) {
      this.chartPeriod = queryChartPeriod
    } else {
      shouldUpdateQuery = true
    }

    if (queryTablePeriod) {
      this.tablePeriod = queryTablePeriod
    } else {
      shouldUpdateQuery = true
    }

    if (shouldUpdateQuery) {
      this.$router.push({
        query: {
          ...this.$route.query,
          chartPeriod: this.chartPeriod,
          tablePeriod: this.tablePeriod,
        },
      })
    }

    await this.fetchAllData() 
    this.filterDataByPeriod(this.chartPeriod) 
    this.fetchTableData(this.tablePeriod)
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
    async fetchTableData(period) {
      try {
        this.swaps = (await this.getTopSwaps(period)).data
      } catch (err) {
        console.error(err)
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
    getTopSwaps(period) {
      switch (period) {
        case 'day':
          return this.$api.getTopSwaps()
        case 'month':
          return this.$api.getTopSwapsMonthly()
        case 'week':
          return this.$api.getTopSwapsWeekly()
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
  },
}
</script>

<style lang="scss"></style>