<template>
  <Page class="pool-overview">
    <div v-if="!loading" class="pool-header">
      <div>
        <img :src="pool && assetImage(pool.asset)" class="asset-icon" />
      </div>
      <div>
        {{ pool && pool.asset }}
      </div>
    </div>
    <div class="cards-container">
      <info-card :options="poolDetailStats" />
      <card :is-loading="loading">
        <VChart
          :option="volumeHistory"
          :loading="!volumeHistory"
          :loading-options="showLoading"
          :theme="chartTheme"
          :autoresize="true"
        />
      </card>
    </div>
    <info-card :options="poolStats" />
    <div class="footer-stat">
      <small>
        <sup>*</sup>
        All of the stat are based on 14 days period
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
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  SVGRenderer,
  GridComponent,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
])

export default {
  components: {
    VChart,
  },
  async asyncData({ params }) {
    return { poolName: params.poolName }
  },
  data() {
    return {
      pool: undefined,
      poolDetail: undefined,
      volumeHistory: undefined,
      loading: true,
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
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
              filter: (v) => `${this.$options.filters.currency(v)}`,
            },
            {
              name: 'Pool APY',
              value: this.pool?.poolAPY,
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
                `${this.$options.filters.number(v, '0,0')} ${this.pool?.asset}`,
            },
            {
              name: 'Rune Depth',
              value: this.pool?.runeDepth / 10 ** 8,
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: 'Units',
              value: this.pool?.units / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: 'Pending Inbound RUNE',
              value: this.poolDetail?.pending_inbound_rune / 10 ** 8,
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,00')} ${this.pool?.asset}`,
            },
            {
              name: 'Pending Inbound Asset',
              value: this.poolDetail?.pending_inbound_asset / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
          ],
        },
      ]
    },
    poolStats() {
      return [
        {
          title: 'Deposit',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Add Liquidity Count',
              value: this.pool?.addLiquidityCount,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: 'Unique Member Count',
              value: this.pool?.uniqueMemberCount,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: 'Add Asset Liquidity Volume',
              value: this.pool?.addAssetLiquidityVolume / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
              usdValue: true,
            },
            {
              name: 'Add RUNE Liquidity Volume',
              value: this.pool?.addRuneLiquidityVolume / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
              usdValue: true,
            },
            {
              name: 'Add Liquidity Volume',
              value: this.pool?.addLiquidityVolume / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
              usdValue: true,
            },
            {
              header: 'Withdraw',
            },
            {
              name: 'Withdraw Count',
              value: this.pool?.withdrawCount,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: 'Withdraw Asset Volume',
              value: this.pool?.withdrawAssetVolume / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
              usdValue: true,
            },
            {
              name: 'Withdraw RUNE Volume',
              value: this.pool?.withdrawRuneVolume / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
              usdValue: true,
            },
            {
              name: 'Withdraw Volume',
              value: this.pool?.withdrawVolume / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
              usdValue: true,
            },
          ],
        },
        {
          title: 'Swap',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'To Asset Fees',
              value: this.pool?.toAssetFees / 10 ** 8,
              usdValue: true,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: 'To RUNE Fees',
              value: this.pool?.toRuneFees / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
              usdValue: true,
            },
            {
              name: 'Total Fees',
              value: this.pool?.totalFees / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
              usdValue: true,
            },
            {
              name: 'To Asset Count',
              value: this.pool?.toAssetCount,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: 'To RUNE Count',
              value: this.pool?.toRuneCount,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: 'Swap Count',
              value: this.pool?.swapCount,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: 'To Asset Volume',
              value: this.pool?.toAssetVolume / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
              usdValue: true,
            },
            {
              name: 'To RUNE Volume',
              value: this.pool?.toRuneVolume / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
              usdValue: true,
            },
            {
              name: 'Swap Volume',
              value: this.pool?.swapVolume / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
              usdValue: true,
            },
          ],
        },
      ]
    },
  },
  mounted() {
    this.loadData()
  },
  methods: {
    loadData() {
      this.loading = true

      this.$api
        .getPoolStats(this.poolName)
        .then((res) => {
          this.pool = res.data
        })
        .catch((e) => console.error('Error fetching pool stats:', e))

      this.$api
        .getPoolDetail(this.poolName)
        .then((res) => {
          this.poolDetail = res?.data
        })
        .catch((e) => {
          console.error('Error fetching pool detail:', e)
        })

      this.$api
        .getPoolVolume(this.poolName)
        .then((res) => {
          this.volumeHistory = this.formatVol(res?.data)
        })
        .catch((e) => {
          console.error(e)
        })
        .finally(() => {
          this.loading = false
        })
    },
    assetString(assetStr) {
      const { chain, ticker } = assetFromString(assetStr)
      return `${chain}.${ticker}`
    },
    formatVol(d) {
      const xAxis = []
      const av = []
      const wv = []
      const tv = []
      d?.intervals.forEach((interval) => {
        xAxis.push(
          moment(
            Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format('dddd, MMM D')
        )
        av.push(
          (+interval.addLiquidityVolume * +interval.runePriceUSD) / 10 ** 8
        )
        wv.push(
          -1 * ((+interval.withdrawVolume * +interval.runePriceUSD) / 10 ** 8)
        )
        tv.push(
          ((+interval.addLiquidityVolume - +interval.withdrawVolume) *
            +interval.runePriceUSD) /
            10 ** 8
        )
      })
      return this.basicChartFormat(
        (value) => `$ ${this.normalFormat(value)}`,
        [
          {
            type: 'line',
            name: 'Total Liquidity Change',
            showSymbol: false,
            data: tv,
            smooth: true,
          },
          {
            type: 'line',
            name: 'Add Liquidity Volume',
            showSymbol: false,
            data: av,
            smooth: true,
          },
          {
            type: 'line',
            name: 'Withdraw Liquidity Volume',
            showSymbol: false,
            data: wv,
            smooth: true,
          },
        ],
        xAxis
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
  border-radius: 0.5rem;
  padding: 0.8rem;
}
.pool-overview {
  width: 100%;
  .chart-wrapper {
    border-color: transparent;
  }
}
</style>
