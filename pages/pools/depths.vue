<template>
  <div class="container-page depths-page">
    <div class="depths-controls">
      <div class="control-item">
        <span class="control-label">Pool :</span>
        <Select
          :options="poolOptions"
          :option="poolOption"
          name="pool"
          @update:option="onPoolChange"
        >
          <template>
            <div class="pool-label">
              <AssetIcon :asset="poolName" :height="'22px'" />
              <span class="pool-ticker">{{ poolOption.label }}</span>
              <span v-if="poolStatus" class="pool-status">{{
                poolStatus
              }}</span>
            </div>
          </template>
          <template #option="{ option }">
            <div class="pool-label">
              <AssetIcon :asset="option.value" :height="'1.25rem'" />
              <span class="overflow-label">{{ option.label }}</span>
            </div>
          </template>
        </Select>
      </div>
      <Nav
        :active-mode="chartPeriod"
        :nav-items="chartPeriods"
        pre-text="Period :"
        @update:activeMode="onPeriodChange"
      />
    </div>

    <cards-header :table-general-stats="depthStats" />

    <Card :title="'Pool depth \u00b7 both sides'" extra-class="depth-card">
      <template #header>
        <div class="depth-pills">
          <div v-for="pill in seriesPills" :key="pill.name" class="depth-pill">
            <span
              class="pill-dot"
              :style="{ backgroundColor: pill.color }"
            ></span>
            <span class="pill-name" :style="{ color: pill.color }">{{
              pill.name
            }}</span>
            <span class="pill-value">{{ pill.value }}</span>
          </div>
        </div>
      </template>

      <div class="chart-caption">{{ chartCaption }}</div>
      <VChart
        v-if="depthChart && !loading"
        :option="depthChart"
        :autoresize="true"
        :theme="chartTheme"
      />
      <ChartLoader v-if="!depthChart || loading" :bar-count="60" />
    </Card>
  </div>
</template>

<script>
import moment from 'moment'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkLineComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import { assetFromString } from '@xchainjs/xchain-util'
import { compact, orderBy } from 'lodash'
import { mapGetters } from 'vuex'
import ChartLoader from '~/components/ChartLoader.vue'
import CardsHeader from '~/components/CardsHeader.vue'

use([
  SVGRenderer,
  GridComponent,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
])

const DEFAULT_POOL = 'BTC.BTC'

// fixed pair rather than getChainColor() - several chain colours
// (ETH's #87e9b5, BCH's #4DCA48) sit right on top of the RUNE green
const ASSET_COLOR = '#f1b90a'

// a both-sides move this large is an LP entering or leaving, which is
// the thing worth calling out on a year-long view
const EVENT_THRESHOLD = 0.25
const MAX_EVENTS = 2

// midgard caps a depth request at 400 points, so anything past a
// year of dailies has to step up to a coarser bucket
const CHART_PERIODS = [
  { text: '90 Days', mode: '90d', interval: 'day', count: 90 },
  { text: '180 Days', mode: '180d', interval: 'day', count: 180 },
  { text: '1 Year', mode: '1y', interval: 'day', count: 365 },
  { text: '2 Years', mode: '2y', interval: 'week', count: 104 },
  { text: 'All', mode: 'all', interval: 'month', count: 100 },
]

export default {
  name: 'PoolDepths',
  components: {
    VChart,
    ChartLoader,
    CardsHeader,
  },
  data() {
    return {
      chartPeriods: CHART_PERIODS,
      poolOptions: [],
      depthChart: undefined,
      seriesPills: [],
      chartCaption: '',
      loading: true,
      depthStats: [
        { name: 'Asset Depth', value: '-' },
        { name: 'RUNE Depth', value: '-' },
        { name: 'Pool Value', value: '-' },
        { name: 'Members', value: '-' },
      ],
    }
  },
  computed: {
    ...mapGetters({
      pools: 'getPools',
    }),
    chartPeriod() {
      const { period } = this.$route.query
      return CHART_PERIODS.some((p) => p.mode === period) ? period : '1y'
    },
    periodConfig() {
      return CHART_PERIODS.find((p) => p.mode === this.chartPeriod)
    },
    poolName() {
      return this.$route.query.pool || DEFAULT_POOL
    },
    poolOption() {
      return { label: this.showAsset(this.poolName), value: this.poolName }
    },
    poolStatus() {
      const status = (this.pools ?? []).find(
        (p) => p.asset === this.poolName
      )?.status
      return status ? status.charAt(0).toUpperCase() + status.slice(1) : ''
    },
    assetTicker() {
      return assetFromString(this.poolName)?.ticker ?? 'Asset'
    },
  },
  watch: {
    pools: {
      handler(pools) {
        this.poolOptions = compact(
          (pools ?? []).map((p) =>
            p.status === 'available'
              ? { label: this.showAsset(p.asset), value: p.asset }
              : false
          )
        )
      },
      immediate: true,
    },
    poolName() {
      this.updateDatum()
    },
    chartPeriod() {
      this.updateDatum()
    },
  },
  mounted() {
    this.updateDatum()
  },
  methods: {
    onPoolChange({ value }) {
      if (value === this.poolName) {
        return
      }
      this.$router.push({ query: { ...this.$route.query, pool: value } })
    },
    onPeriodChange(period) {
      if (period === this.chartPeriod) {
        return
      }
      this.$router.push({ query: { ...this.$route.query, period } })
    },
    dateFormat(interval) {
      const mid = Math.floor((~~interval.endTime + ~~interval.startTime) / 2)
      return moment(mid * 1e3).format(
        this.periodConfig.interval === 'month' ? 'YY/MM' : 'YY/MM/DD'
      )
    },
    // echarts paints series colors into SVG presentation attributes,
    // where `var(--x)` is not a valid value - resolve it to a real
    // color before handing it over
    themeColor(name, fallback) {
      if (typeof window === 'undefined') {
        return fallback
      }
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim()
      return value || fallback
    },
    amountFormat(value, suffix) {
      return `${this.$options.filters.number(+value, '0,0.00 a')} ${suffix}`
    },
    compactFormat(value) {
      // vue2-filters cannot parse numeral's optional-decimal syntax
      // ('0,0.[00] a') - it throws inside parseFormat
      return this.$options.filters.number(+value, '0,0.0a')
    },
    // echarts writes series colours into SVG presentation attributes,
    // so a fill needs a real rgba() - `var(--x)` never paints
    fadeColor(hex, alpha) {
      const parsed = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      if (!parsed) {
        return hex
      }
      const [r, g, b] = parsed.slice(1).map((c) => parseInt(c, 16))
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    },
    // 160 BTC against 26M RUNE cannot share a linear axis - the small
    // side flatlines on zero. Rebase both to 100 at the first non-zero
    // point so the axis carries relative movement, and keep the real
    // amounts in the tooltip and the pills.
    seriesBase(data) {
      return data.find((v) => v > 0) ?? 0
    },
    // pull a series onto another's scale by anchoring both at their
    // first non-zero point. Plotting RUNE against the asset's base
    // keeps the shared baseline while leaving the axis in asset units,
    // so echarts still picks round ticks.
    rebase(data, targetBase) {
      const base = this.seriesBase(data)
      if (!base) {
        return data.map(() => 0)
      }
      return data.map((v) => (v / base) * targetBase)
    },
    depthSeries(name, data, color, suffix) {
      return {
        type: 'line',
        name,
        suffix,
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 6,
        smooth: false,
        lineStyle: { color, width: 2 },
        itemStyle: { color },
        emphasis: { focus: 'none' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: this.fadeColor(color, 0.28) },
              { offset: 1, color: this.fadeColor(color, 0) },
            ],
          },
        },
        data,
      }
    },
    // a single interval where both sides move together by a lot is an
    // LP entering or leaving - worth a marker on a year-long view
    findEvents(assetDepth, runeDepth) {
      const moves = []
      for (let i = 1; i < assetDepth.length; i++) {
        const prevAsset = assetDepth[i - 1]
        const prevRune = runeDepth[i - 1]
        if (!prevAsset || !prevRune) {
          continue
        }
        const assetChange = (assetDepth[i] - prevAsset) / prevAsset
        const runeChange = (runeDepth[i] - prevRune) / prevRune
        if (Math.sign(assetChange) !== Math.sign(runeChange)) {
          continue
        }
        const size = Math.min(Math.abs(assetChange), Math.abs(runeChange))
        if (size >= EVENT_THRESHOLD) {
          moves.push({ index: i, size, up: assetChange > 0 })
        }
      }
      return orderBy(moves, ['size'], ['desc']).slice(0, MAX_EVENTS)
    },
    buildChart(xAxis, assetDepth, runeDepth, poolValueUSD) {
      const runeColor = this.themeColor('--primary-color', '#2cbe8c')
      const axisColor = this.themeColor('--font-color', '#9f9f9f')
      const gridColor = this.themeColor('--border-color', '#2b2f35')
      // the rails should frame the plot, not compete with the series
      const railColor = this.fadeColor(axisColor, 0.35)
      const ticker = this.assetTicker

      const real = [assetDepth, runeDepth]
      const assetBase = this.seriesBase(assetDepth)
      const series = [
        this.depthSeries(`${ticker} depth`, assetDepth, ASSET_COLOR, ticker),
        this.depthSeries(
          'RUNE depth',
          this.rebase(runeDepth, assetBase),
          runeColor,
          'RUNE'
        ),
      ]

      const events = this.findEvents(assetDepth, runeDepth)
      if (events.length) {
        series[0].markLine = {
          silent: true,
          symbol: ['none', 'circle'],
          symbolSize: 5,
          lineStyle: { color: axisColor, type: 'dashed', width: 1 },
          label: {
            show: true,
            position: 'end',
            distance: 8,
            color: axisColor,
            fontSize: 11,
            fontFamily: 'ProductSans',
            formatter: ({ data }) => data.eventLabel,
          },
          data: events.map((e) => ({
            xAxis: e.index,
            eventLabel: `Both sides ${e.up ? '+' : '-'}${Math.round(
              e.size * 100
            )}%`,
            // near the right edge the label has to run leftwards or it
            // gets clipped by the grid
            label: {
              align: e.index > assetDepth.length * 0.8 ? 'right' : 'left',
            },
          })),
        }
      }

      this.seriesPills = series.map((serie, i) => ({
        name: serie.suffix,
        color: serie.lineStyle.color,
        value: this.compactFormat(
          (i === 0 ? assetDepth : runeDepth)[assetDepth.length - 1]
        ),
      }))

      this.depthChart = {
        title: { show: false },
        legend: { show: false },
        tooltip: {
          confine: true,
          trigger: 'axis',
          axisPointer: {
            type: 'line',
            lineStyle: { color: axisColor, type: 'dashed', width: 1 },
          },
          formatter: (param) => `
            <div class="tooltip-header">${param[0].axisValue}</div>
            ${param
              .map(
                (p) => `
              <div class="tooltip-body">
                <div class="tooltip-item">
                  <div class="data-color" style="background-color: ${
                    p.color
                  }"></div>
                  <span>${p.seriesName}</span>
                </div>
                <b>${this.compactFormat(
                  real[p.seriesIndex][p.dataIndex]
                )} <small>${series[p.seriesIndex].suffix}</small></b>
              </div>
            `
              )
              .join('')}
            <hr>
            <div class="tooltip-body">
              <span>Pool value</span>
              <b>$${this.compactFormat(poolValueUSD[param[0].dataIndex])}</b>
            </div>
          `,
        },
        xAxis: {
          type: 'category',
          data: xAxis,
          boundaryGap: false,
          splitLine: { show: false },
          axisTick: { show: false },
          axisLine: { show: true, lineStyle: { color: railColor } },
          axisLabel: {
            fontFamily: 'ProductSans',
            color: axisColor,
            // a year of dailies otherwise crams ~25 ticks along the axis
            interval: Math.max(0, Math.ceil(xAxis.length / 8) - 1),
          },
        },
        yAxis: {
          type: 'value',
          // both series share one axis, so anchoring at zero keeps the
          // two sides visually comparable
          min: 0,
          // the shared theme turns split lines off and the ticks on;
          // keep the rail, drop the tick stubs
          axisLine: { show: true, lineStyle: { color: railColor } },
          axisTick: { show: false },
          axisLabel: {
            fontFamily: 'ProductSans',
            color: axisColor,
            formatter: (value) => this.compactFormat(value),
          },
          splitLine: {
            show: true,
            lineStyle: { color: gridColor, type: 'solid' },
          },
        },
        grid: {
          left: 0,
          right: 12,
          // headroom for the event labels sitting on top of the lines
          top: events.length ? 40 : 16,
          bottom: 0,
          containLabel: true,
        },
        series,
      }
    },
    async updateDatum() {
      const { interval, count } = this.periodConfig
      this.loading = true

      try {
        const {
          data: { intervals = [] },
        } = await this.$api.getPoolDepth(
          this.poolName,
          count,
          undefined,
          interval
        )

        const xAxis = []
        const assetDepth = []
        const runeDepth = []
        const poolValueUSD = []

        intervals.forEach((it) => {
          xAxis.push(this.dateFormat(it))
          assetDepth.push(+it.assetDepth / 1e8)
          runeDepth.push(+it.runeDepth / 1e8)
          poolValueUSD.push((+it.assetDepth / 1e8) * +it.assetPriceUSD * 2)
        })

        this.chartCaption = xAxis.length
          ? `Axis in ${this.assetTicker} \u00B7 RUNE rebased to the same ` +
            `start \u00B7 ${xAxis[0]} \u2192 ${xAxis[xAxis.length - 1]} ` +
            `\u00B7 hover for both amounts`
          : ''

        this.buildChart(xAxis, assetDepth, runeDepth, poolValueUSD)
        this.setStats(intervals)
      } catch (error) {
        console.error('Error fetching pool depth history:', error)
        this.depthChart = undefined
        this.seriesPills = []
      } finally {
        this.loading = false
      }
    },
    setStats(intervals) {
      const last = intervals[intervals.length - 1]
      const first = intervals[0]
      if (!last) {
        return
      }

      const asset = +last.assetDepth / 1e8
      const startAsset = +first.assetDepth / 1e8
      const change = startAsset ? ((asset - startAsset) / startAsset) * 100 : 0

      this.depthStats = [
        {
          name: 'Asset Depth',
          value: this.amountFormat(asset, this.assetTicker),
          // CardsHeader renders ProgressIcon without its `filter` prop,
          // so the unit has to travel with the value
          change: `${Math.abs(change).toFixed(2)}%`,
          isDown: change < 0,
          description: `Change over the selected period, from ${this.amountFormat(
            startAsset,
            this.assetTicker
          )}`,
        },
        {
          name: 'RUNE Depth',
          value: this.amountFormat(+last.runeDepth / 1e8, 'RUNE'),
        },
        {
          name: 'Pool Value',
          value: `$${this.$options.filters.number(
            (+last.assetDepth / 1e8) * +last.assetPriceUSD * 2,
            '0,0.00 a'
          )}`,
          description: 'Both sides of the pool at the latest asset price',
        },
        {
          name: 'Members',
          value: this.$options.filters.number(+last.membersCount, '0,0'),
        },
      ]
    },
  },
  head() {
    return {
      title: `THORChain Network Explorer | ${this.poolName} Depth`,
    }
  },
}
</script>

<style lang="scss" scoped>
.depths-page {
  .depths-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $space-16;
    margin-bottom: $space-10;
  }

  .control-item {
    display: flex;
    align-items: center;
    gap: $space-8;
  }

  .control-label {
    color: var(--sec-font-color);
  }

  .pool-label {
    display: flex;
    align-items: center;
  }

  .overflow-label {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .depth-pills {
    display: flex;
    flex-wrap: wrap;
    gap: $space-8;
  }

  .depth-pill {
    display: flex;
    align-items: center;
    gap: $space-6;
    padding: $space-5 $space-10;
    border: 1px solid var(--border-color);
    border-radius: $radius-full;
    background-color: var(--darker-bg);
    font-size: $font-size-sm;

    .pill-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: $radius-full;
    }

    .pill-name {
      color: var(--sec-font-color);
      font-weight: 700;
    }

    .pill-value {
      color: var(--font-color);
    }
  }

  .chart-caption {
    color: var(--font-color);
    font-size: $font-size-xs;
    margin-bottom: $space-12;
    padding-left: $space-12;
  }

  .echarts {
    width: 100%;
    // other pages leak a global `.echarts { min-height: 400px }`, so
    // pin both here to keep the height the same however you got here
    height: 400px;
    min-height: 400px;
  }
}
</style>

<style lang="scss">
.depths-page {
  // pool chip, per spec section 2. `.option-dialog` lives inside
  // `.option-wrapper`, so every rule here is direct-child scoped to
  // keep it off the dropdown rows.
  .option-wrapper {
    align-items: center;
    padding: 7px 13px 7px 9px;
    border-radius: 9px;
    background-color: var(--surface-4-color);
    // spec #263238 - no repo token for it yet
    border: 1px solid #263238;

    > .pool-label {
      align-items: center;

      .icon-asset-container {
        margin-right: 9px;
      }
    }

    .pool-ticker {
      font-weight: 700;
      font-size: 14px;
      color: var(--sec-font-color);
    }

    .pool-status {
      margin-left: 9px;
      font-weight: 400;
      font-size: 11px;
      color: var(--text-dim-color);
    }

    .select-caret {
      margin-left: 9px;
    }
  }

  // the reference runs title, caption and plot together as one block -
  // Card's default header rule draws a divider between them
  .depth-card {
    .card-header {
      border-bottom: none;
      padding-bottom: $space-0;
    }

    .card-body {
      padding-top: $space-8;
    }
  }

  .tooltip-body {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
