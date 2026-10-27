<template>
  <Page class="pool-overview">
    <div class="cards-container">
      <info-card :options="poolDetailStats">
        <template #name="{ item }">
          <VDropdown
            v-if="item.flow"
            theme="dropdown"
            placement="bottom-start"
            popper-class="counterparty-popper"
            class="counterparty-trigger"
            :distance="8"
            :triggers="['hover', 'click']"
            :hide-triggers="['hover']"
            :popper-triggers="['hover']"
            :delay="{ show: 80, hide: 200 }"
          >
            <span class="counterparty-name">
              <img :src="assetImage(item.pool)" alt="" @error="imgErr" />
              {{ item.name }}
              <unknown-icon class="counterparty-info" />
            </span>
            <template #popper>
              <div class="cp-popover">
                <div class="cp-head">
                  <span class="cp-pair-icons">
                    <img
                      :src="assetImage(item.flow.otherAsset)"
                      alt=""
                      @error="imgErr"
                    />
                    <img
                      :src="assetImage(item.flow.selfAsset)"
                      alt=""
                      @error="imgErr"
                    />
                  </span>
                  <span class="cp-pair-name">
                    {{ item.flow.other }} <span class="cp-dim">⇄</span>
                    {{ item.flow.self }}
                  </span>
                </div>
                <div class="cp-total">
                  <span class="mono cp-total-value">
                    {{ item.flow.totalDisplay }}
                  </span>
                  <span class="cp-dim">
                    {{ item.flow.countDisplay }} swaps · 30D
                  </span>
                </div>

                <div v-if="item.flow.isRune" class="cp-note">
                  Includes swaps with RUNE as well as trade and secure assets.
                </div>

                <div
                  v-if="item.flow.directions.length"
                  class="cp-split"
                  role="presentation"
                >
                  <span
                    v-for="d in item.flow.directions"
                    :key="d.key"
                    :class="['cp-split-seg', `cp-${d.key}`]"
                    :style="{ width: `${d.sharePct}%` }"
                  />
                </div>

                <div
                  v-for="d in item.flow.directions"
                  :key="d.key"
                  class="cp-dir"
                >
                  <span :class="['cp-dot', `cp-${d.key}`]" />
                  <div class="cp-dir-main">
                    <div class="cp-dir-line">
                      <span class="cp-dir-label">
                        {{ d.from }} <span class="cp-dim">→</span> {{ d.to }}
                      </span>
                      <span class="mono cp-dir-value">
                        {{ d.volumeDisplay }}
                      </span>
                    </div>
                    <div class="cp-dir-line cp-dim">
                      <span>
                        {{ d.countDisplay }} swaps<template v-if="d.avgDisplay">
                          · avg {{ d.avgDisplay }}</template
                        >
                      </span>
                      <span class="mono">{{ d.shareDisplay }}</span>
                    </div>
                  </div>
                </div>

                <nuxt-link
                  v-if="item.link"
                  :to="item.link"
                  class="cp-link clickable"
                >
                  View {{ item.flow.other }} pool →
                </nuxt-link>
              </div>
            </template>
          </VDropdown>
          <span v-else class="counterparty-name">{{ item.name }}</span>
        </template>
      </info-card>
      <card :is-loading="loading" :title="`${showAsset(poolName)} Earnings`">
        <VChart
          :option="earningsHistory"
          :loading="!earningsHistory"
          :loading-options="showLoading"
          :theme="chartTheme"
          :autoresize="true"
        />
      </card>
    </div>
    <div class="cards-container">
      <card :is-loading="loading" :title="`${showAsset(poolName)} Depth`">
        <VChart
          :option="depthHistory"
          :loading="!depthHistory"
          :loading-options="showLoading"
          :theme="chartTheme"
          :autoresize="true"
        />
      </card>
      <card :is-loading="loading" :title="`${showAsset(poolName)} Swaps`">
        <VChart
          :option="swapHistory"
          :loading="!swapHistory"
          :loading-options="showLoading"
          :theme="chartTheme"
          :autoresize="true"
        />
      </card>
    </div>
    <div class="footer-stat">
      <small>
        <sup>*</sup>
        All of the stat are based on 30 days period
      </small>
    </div>
  </Page>
</template>

<script>
import { assetFromString } from '@xchainjs/xchain-util'
import { mapGetters } from 'vuex'
import moment from 'moment'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import UnknownIcon from '~/assets/images/unknown.svg?inline'

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
    UnknownIcon,
  },
  asyncData({ params }) {
    return { poolName: params.poolName }
  },
  data() {
    return {
      pool: undefined,
      earningsHistory: undefined,
      depthHistory: undefined,
      swapHistory: undefined,
      loading: true,
      periodFees: 0,
      periodFeesUSD: 0,
      // undefined while loading, [] when the pool had no swaps in the period
      counterparties: undefined,
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
    counterpartyItems() {
      if (!this.counterparties) {
        // value undefined -> InfoCard shows a skeleton row
        return [1, 2, 3].map(() => ({ name: '', value: undefined }))
      }
      if (!this.counterparties.length) {
        return [{ name: 'No swaps', value: '-' }]
      }
      const usd = (v) => `$${this.$options.filters.number(v, '0,0.00a')}`
      const count = (v) => this.$options.filters.number(v, '0,0')
      const pct = (v) => this.$options.filters.percent(v, 1)
      const self = this.showAsset(this.poolName)
      return this.counterparties.map((row) => {
        const other = this.showAsset(row.pool)
        // RUNE has no pool page, and its bucket also holds trade/secure
        // swaps, so its in/out split isn't meaningful.
        const isRune = row.pool === 'THOR.RUNE'
        const directional = row.inVolume + row.outVolume
        // `in` is counterpart -> this pool, `out` this pool -> counterpart.
        const direction = (key, from, to, volume, n) => {
          const share = directional > 0 ? volume / directional : 0
          return {
            key,
            from,
            to,
            volumeDisplay: usd(volume),
            countDisplay: count(n),
            avgDisplay: n > 0 ? usd(volume / n) : null,
            sharePct: share * 100,
            shareDisplay: pct(share),
          }
        }
        return {
          name: other,
          nameSlot: true,
          pool: row.pool,
          link: isRune ? null : `/pool/${row.pool}`,
          value: row.volume,
          filter: usd,
          extraText: `${count(row.count)} swaps`,
          flow: {
            self,
            other,
            selfAsset: this.poolName,
            otherAsset: row.pool,
            totalDisplay: usd(row.volume),
            countDisplay: count(row.count),
            isRune,
            directions: isRune
              ? []
              : [
                  direction('in', other, self, row.inVolume, row.inCount),
                  direction('out', self, other, row.outVolume, row.outCount),
                ],
          },
        }
      })
    },
    poolDetailStats() {
      return [
        {
          title: 'Overview',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Asset Price',
              value: this.pool?.assetPriceUSD,
              filter: (v) => `$${this.$options.filters.number(v, '0,0.00a')}`,
            },
            {
              name: 'Fees Annual to Depth (30D)',
              value:
                (this.periodFeesUSD * 12) /
                (this.pool?.assetDepth * this.pool?.assetPriceUSD),
              filter: (v) => `${this.$options.filters.percent(v, 2)}`,
            },
            {
              name: 'Status',
              value:
                this.pool?.status.charAt(0).toUpperCase() +
                this.pool?.status.slice(1),
            },
            {
              name: 'Asset Depth',
              value: this.pool?.assetDepth / 10 ** 8,
              filter: (v) =>
                `${this.$options.filters.number(v, '0,0')} ${this.showAsset(this.pool?.asset)}`,
              extraText:
                this.pool?.assetPriceUSD > 0
                  ? `$${this.$options.filters.number((this.pool.assetDepth / 10 ** 8) * this.pool.assetPriceUSD, '0.00a')}`
                  : undefined,
            },
            {
              name: 'Rune Depth',
              value: this.pool?.runeDepth / 10 ** 8,
              filter: (v) => this.formatRune(v, '0,0a'),
              usdValue: true,
            },
            {
              header: 'All Time Stats',
            },
            {
              name: 'Total Swaps (Overall)',
              value: this.pool?.swapVolume / 10 ** 8,
              filter: (v) =>
                `${this.$options.filters.number(v, '0,0.00a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'Total Fees Earned by Pool (30D)',
              value: this.periodFees / 10 ** 8,
              filter: (v) =>
                `${this.$options.filters.number(v, '0,0.00a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'Average Slip',
              value: this.pool?.averageSlip / 10000,
              filter: (v) => `${this.$options.filters.percent(v, 2)}`,
            },
            {
              header: `Top Counterpart Pools (30D)`,
            },
            ...this.counterpartyItems,
          ],
        },
      ]
    },
  },
  mounted() {
    this.loadData()
    this.loadCounterparties()
  },
  methods: {
    async loadData() {
      this.loading = true

      // Fetch in parallel; each section fills in as its response lands, and
      // one failed request doesn't block the others.
      const results = await Promise.allSettled([
        this.$api.getPoolStats(this.poolName).then(({ data }) => {
          this.pool = data
        }),
        this.$api.getEarningHistory().then(({ data }) => {
          this.earningsHistory = this.formatEarnings(data)
        }),
        this.$api.getPoolDepth(this.poolName, 30).then(({ data }) => {
          this.depthHistory = this.formatDepth(data)
        }),
        this.$api
          .getSwapsHistory({ interval: 'day', count: 30, pool: this.poolName })
          .then(({ data }) => {
            this.swapHistory = this.formatSwaps(data)
          }),
      ])
      results
        .filter((r) => r.status === 'rejected')
        .forEach((r) => console.error('Failed to load pool data:', r.reason))

      this.loading = false
    },
    async loadCounterparties() {
      try {
        const { data } = await this.$api.getPoolCounterparts(
          this.poolName,
          '30d'
        )
        // USD values are 1e8-scaled strings; counts are strings too.
        this.counterparties = (data?.counterparts || [])
          .map((c) => ({
            pool: c.pool,
            volume: Number(c.volumeUSD) / 1e8,
            count: Number(c.swapCount),
            inVolume: Number(c.inVolumeUSD) / 1e8,
            inCount: Number(c.inSwapCount),
            outVolume: Number(c.outVolumeUSD) / 1e8,
            outCount: Number(c.outSwapCount),
          }))
          .sort((a, b) => b.volume - a.volume)
          .slice(0, 3)
      } catch (error) {
        console.error('Failed to load pool counterparts:', error)
        this.counterparties = []
      }
    },
    assetString(assetStr) {
      const { chain, ticker } = assetFromString(assetStr)
      return `${chain}.${ticker}`
    },
    formatSwaps(d) {
      const xAxis = []
      const pn = []
      const pt = []
      const ps = []
      const psec = []
      d?.intervals.forEach((interval, index) => {
        // ignore the last index
        if (index === d?.intervals?.length - 1) {
          return
        }
        xAxis.push(
          moment(
            Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format('dddd, MMM D')
        )
        // usd is in 2 decimal precision
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
        psec.push(
          (+interval.toSecuredVolumeUSD + +interval.fromSecuredVolumeUSD) /
            10 ** 2
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
          {
            type: 'bar',
            name: 'Secured Swaps',
            stack: 'total',
            showSymbol: false,
            data: psec,
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
    formatDepth(d) {
      const xAxis = []
      const pe = []
      const pr = []
      const usd = []
      d?.intervals.forEach((interval, index) => {
        // ignore the last index
        if (index === d?.intervals?.length - 1) {
          return
        }
        xAxis.push(
          moment(
            Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format('dddd, MMM D')
        )
        pe.push(+interval.assetDepth / 10 ** 8)
        pr.push(+interval.runeDepth / 10 ** 8)
        // assetPrice is the asset priced in RUNE, so the RUNE USD price for
        // the same interval is assetPriceUSD / assetPrice.
        const assetPriceUSD = +interval.assetPriceUSD || 0
        const runePriceUSD =
          +interval.assetPrice > 0 ? assetPriceUSD / +interval.assetPrice : 0
        usd.push({
          'Asset Depth': (+interval.assetDepth / 10 ** 8) * assetPriceUSD,
          'Rune Depth': (+interval.runeDepth / 10 ** 8) * runePriceUSD,
        })
      })
      return this.basicChartFormat(
        (value) => `${this.$options.filters.number(+value, '0,0.00a')}`,
        [
          {
            type: 'bar',
            name: 'Asset Depth',
            showSymbol: false,
            yAxisIndex: 1,
            data: pe,
          },
          {
            type: 'bar',
            name: 'Rune Depth',
            showSymbol: false,
            yAxisIndex: 0,
            data: pr,
          },
        ],
        xAxis,
        {
          yAxis: [
            {
              type: 'value',
              name: '',
              position: 'right',
              show: false,
              splitLine: {
                show: true,
              },
              max: 'dataMax',
            },
            {
              type: 'value',
              name: '',
              position: 'left',
              show: false,
              splitLine: {
                show: true,
              },
              max: 'dataMax',
            },
          ],
        },
        (param) => {
          const rowUSD = usd[param[0]?.dataIndex] || {}
          const totalUSD = Object.values(rowUSD).reduce((a, c) => a + c, 0)
          return `
            <div class="tooltip-header">
              ${param[0].name}
            </div>
            <div class="tooltip-body">
              ${param
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
                    <span>
                      <b>
                        ${this.$options.filters.number(p.value, '0,0.00a')}
                        ${p.seriesName === 'Asset Depth' ? this.showAsset(this.poolName) : 'RUNE'}
                      </b>
                      <small class="tooltip-sub">
                        $${this.$options.filters.number(rowUSD[p.seriesName] || 0, '0,0.00a')}
                      </small>
                    </span>
                  </span>`
                )
                .join('')}
            </div>
            <hr>
            <span class="tooltip-item space">
              <span>Total Depth</span>
              <b>$${this.$options.filters.number(totalUSD, '0,0.00a')}</b>
            </span>
          `
        }
      )
    },
    formatEarnings(d) {
      const xAxis = []
      const pe = []
      const pw = []
      const pf = []
      d?.intervals.forEach((interval, index) => {
        // ignore the last index
        if (index === d?.intervals?.length - 1) {
          return
        }
        xAxis.push(
          moment(
            Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format('dddd, MMM D')
        )
        const pool = interval?.pools?.find((p) => p.pool === this.poolName)
        const earnings = (+pool?.earnings * +interval.runePriceUSD) / 10 ** 8
        const rewards = (+pool?.rewards * +interval.runePriceUSD) / 10 ** 8
        const liquidityFee =
          (+pool?.totalLiquidityFeesRune * +interval.runePriceUSD) / 10 ** 8

        this.periodFeesUSD +=
          +pool?.totalLiquidityFeesRune * +interval.runePriceUSD
        this.periodFees += +pool?.totalLiquidityFeesRune
        pe.push(earnings)
        pw.push(rewards < 0 ? null : rewards)
        pf.push(liquidityFee)
      })
      return this.basicChartFormat(
        (value) => `$ ${this.normalFormat(value)}`,
        [
          {
            type: 'bar',
            name: 'Liquidity Fee',
            stack: 'total',
            showSymbol: false,
            data: pf,
          },
          ...(pw.some((v) => v !== null)
            ? [
                {
                  type: 'bar',
                  name: 'Rewards',
                  stack: 'total',
                  showSymbol: false,
                  data: pw,
                },
              ]
            : []),
          {
            type: 'line',
            name: `LP Earnings`,
            showSymbol: false,
            areaStyle: {
              color: 'rgba(243, 186, 47, 0.2)',
            },
            data: pe,
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
            (p) => p.seriesName !== 'Rewards' || p.value >= 0
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
  },
}
</script>

<style lang="scss" scoped>
.pool-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: var(--card-bg-color);
  color: var(--sec-font-color);
  border-radius: $radius-lg;
  padding: $space-12;
}
.counterparty-trigger {
  display: inline-flex;
  cursor: pointer;
}

.counterparty-name {
  display: inline-flex;
  align-items: center;
  gap: $space-8;

  img {
    width: 18px;
    height: 18px;
    border-radius: $radius-full;
  }

  .counterparty-info {
    width: 14px;
    height: 14px;
    fill: var(--sec-font-color);
    opacity: 0.6;
    transition: opacity 0.15s;
  }

  &:hover .counterparty-info {
    opacity: 1;
  }
}

// Popover content: slot content keeps this component's scope id, so these
// scoped rules reach it even though floating-vue mounts it elsewhere.
.cp-popover {
  display: flex;
  flex-direction: column;
  gap: $space-10;
  width: 260px;
  max-width: 100%;
  font-size: $font-size-xs;
  color: var(--sec-font-color);

  .cp-dim {
    color: var(--text-dim-color);
  }

  .cp-head {
    display: flex;
    align-items: center;
    gap: $space-8;
  }

  .cp-pair-icons {
    display: inline-flex;

    img {
      width: 20px;
      height: 20px;
      border-radius: $radius-full;
      border: 2px solid var(--card-bg-color);
      background: var(--card-bg-color);

      & + img {
        margin-left: -$space-6;
      }
    }
  }

  .cp-pair-name {
    font-size: $font-size-s;
    font-weight: 600;
  }

  .cp-total {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: $space-8;
    padding-bottom: $space-10;
    border-bottom: 1px solid var(--border-color);
  }

  .cp-total-value {
    font-size: $font-size-md;
    font-weight: 600;
    color: var(--primary-color);
  }

  .cp-note {
    line-height: 1.4;
    color: var(--text-dim-color);
  }

  .cp-split {
    display: flex;
    height: 6px;
    gap: 2px;
    border-radius: $radius-full;
    overflow: hidden;
    background: var(--border-color);
  }

  .cp-split-seg {
    min-width: 2px;
  }

  .cp-in {
    background: var(--primary-color);
  }

  .cp-out {
    background: var(--warning-color);
  }

  .cp-dir {
    display: flex;
    align-items: flex-start;
    gap: $space-8;
  }

  .cp-dot {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    margin-top: 4px;
    border-radius: $radius-full;
  }

  .cp-dir-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  .cp-dir-line {
    display: flex;
    justify-content: space-between;
    gap: $space-8;
  }

  .cp-dir-label {
    font-weight: 500;
  }

  .cp-dir-value {
    font-weight: 600;
  }

  .cp-link {
    padding-top: $space-8;
    border-top: 1px solid var(--border-color);
    font-size: $font-size-xs;
    text-align: right;
  }
}
.pool-overview {
  width: 100%;
  .chart-wrapper {
    border-color: transparent;
  }
}
</style>
