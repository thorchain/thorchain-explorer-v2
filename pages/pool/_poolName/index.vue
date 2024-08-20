<template>
  <Card
    :is-loading="!pool"
    class="pool-container"
    :title="pool && pool.asset"
    :img-src="pool && assetImage(pool.asset)"
  >
    <template v-if="pool">
      <div class="pool-overview">
        <div class="pool-detail-header">
          <div class="item">
            <div class="header">Asset Price</div>
            <div class="value">
              {{ Number.parseFloat(pool.assetPriceUSD) | currency }}
            </div>
          </div>
          <div class="item">
            <div class="header">Pool APY</div>
            <div class="value">
              {{ Number.parseFloat(pool.poolAPY) | percent }}
            </div>
          </div>
          <div class="item">
            <div class="header">Status</div>
            <div class="value">
              {{ pool.status | capitalize }}
            </div>
          </div>
          <div class="item">
            <div class="header">Asset Depth</div>
            <div class="value">
              {{ (pool.assetDepth / 10 ** 8) | number('0,0') }}
              <span style="font-size: 0.7rem">{{
                assetString(pool.asset)
              }}</span>
            </div>
          </div>
          <div class="item">
            <div class="header">Rune Depth</div>
            <div class="value">
              {{ (pool.runeDepth / 10 ** 8) | number('0,0') }}
              <span style="font-size: 0.7rem">THOR.RUNE</span>
            </div>
          </div>
          <div class="item">
            <div class="header">Units</div>
            <div class="value">
              {{ (pool.units / 10 ** 8) | number('0,0.00') }}
            </div>
          </div>
          <div v-if="poolDetail" class="item">
            <div class="header">Pending Inbound RUNE</div>
            <div class="value">
              {{
                (poolDetail.pending_inbound_rune / 10 ** 8) | number('0,0.00')
              }}
              <span style="font-size: 0.7rem">THOR.RUNE</span>
            </div>
          </div>
          <div v-if="poolDetail" class="item">
            <div class="header">Pending Inbound asset</div>
            <div class="value">
              {{
                (poolDetail.pending_inbound_asset / 10 ** 8) | number('0,0.00')
              }}
              <span style="font-size: 0.7rem">
                {{ assetString(pool.asset) }}
              </span>
            </div>
          </div>
          <div v-if="poolDetail" class="item">
            <div class="header">Synth Supply</div>
            <div class="value">
              {{ (poolDetail.synth_supply / 10 ** 8) | number('0,0.00') }}
            </div>
          </div>
        </div>
        <div style="margin: 1rem 0">
          <VChart
            :option="volumeHistory"
            :loading="!volumeHistory"
            :loading-options="showLoading"
            :theme="chartTheme"
          />
        </div>
        <div class="pool-detail-container">
          <div
            v-for="(settings, i) in poolStats"
            :key="i"
            class="pool-swap-detail"
          >
            <stat-table
              :table-settings="settings.content"
              :header="settings.header"
            />
          </div>
        </div>
      </div>
    </template>
  </Card>
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
import { AssetImage } from '~/classes/assetImage'

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
  methods: {
    assetImage(assetStr) {
      try {
        return AssetImage(assetStr) ?? require('~/assets/images/unknown.png')
      } catch (error) {
        return require('~/assets/images/unknown.png')
      }
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
          ).format('MM/DD')
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
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
  },
  mounted() {
    this.$api
      .getPoolStats(this.poolName)
      .then((res) => {
        this.pool = res.data
        this.poolStats = [
          {
            header: 'Swap',
            content: [
              [
                {
                  name: 'To Asset Fees',
                  value: Number.parseInt(res.data?.toAssetFees) / 10 ** 8,
                  usdValue: true,
                },
                {
                  name: 'To RUNE Fees',
                  value: Number.parseInt(res.data?.toRuneFees) / 10 ** 8,
                  usdValue: true,
                },
                {
                  name: 'Total Fees',
                  value: Number.parseInt(res.data?.totalFees) / 10 ** 8,
                  usdValue: true,
                },
              ],
              [
                {
                  name: 'To Asset Count',
                  value: Number.parseInt(res.data?.toAssetCount),
                },
                {
                  name: 'To RUNE Count',
                  value: Number.parseInt(res.data?.toRuneCount),
                },
                {
                  name: 'Swap Count',
                  value: Number.parseInt(res.data?.swapCount),
                },
                {
                  name: 'Unique Swapper Count',
                  value: Number.parseInt(res.data?.uniqueSwapperCount),
                },
              ],
              [
                {
                  name: 'To Asset Volume',
                  value: Number.parseInt(res.data?.toAssetVolume) / 10 ** 8,
                  usdValue: true,
                },
                {
                  name: 'To RUNE Volume',
                  value: Number.parseInt(res.data?.toRuneVolume) / 10 ** 8,
                  usdValue: true,
                },
                {
                  name: 'Swap Volume',
                  value: Number.parseInt(res.data?.swapVolume) / 10 ** 8,
                  usdValue: true,
                },
              ],
            ],
          },
          {
            header: 'Deposit',
            content: [
              [
                {
                  name: 'Add Liquidity Count',
                  value: Number.parseInt(res.data?.addLiquidityCount),
                },
                {
                  name: 'Unique Member Count',
                  value: Number.parseInt(res.data?.uniqueMemberCount),
                },
                {
                  name: 'Loss Protection Paid',
                  value:
                    Number.parseInt(res.data?.impermanentLossProtectionPaid) /
                    10 ** 8,
                  usdValue: true,
                },
              ],
              [
                {
                  name: 'Add Asset Liquidity Volume',
                  value:
                    Number.parseInt(res.data?.addAssetLiquidityVolume) /
                    10 ** 8,
                  usdValue: true,
                },
                {
                  name: 'Add RUNE Liquidity Volume',
                  value:
                    Number.parseInt(res.data?.addRuneLiquidityVolume) / 10 ** 8,
                  usdValue: true,
                },
                {
                  name: 'Add Liquidity Volume',
                  value:
                    Number.parseInt(res.data?.addLiquidityVolume) / 10 ** 8,
                  usdValue: true,
                },
              ],
            ],
          },
          {
            header: 'Withdraw',
            content: [
              [
                {
                  name: 'Withdraw Count',
                  value: Number.parseInt(res.data?.withdrawCount),
                },
              ],
              [
                {
                  name: 'Withdraw Asset Volume',
                  value:
                    Number.parseInt(res.data?.withdrawAssetVolume) / 10 ** 8,
                  usdValue: true,
                },
                {
                  name: 'Withdraw RUNE Volume',
                  value:
                    Number.parseInt(res.data?.withdrawRuneVolume) / 10 ** 8,
                  usdValue: true,
                },
                {
                  name: 'Withdraw Volume',
                  value: Number.parseInt(res.data?.withdrawVolume) / 10 ** 8,
                  usdValue: true,
                },
              ],
            ],
          },
        ]
      })
      .catch((e) => console.error(e))

    this.$api
      .getPoolDetail(this.poolName)
      .then((res) => {
        this.poolDetail = res?.data
      })
      .catch((e) => {
        console.error(e)
      })

    this.$api
      .getPoolVolume(this.poolName)
      .then((res) => {
        this.volumeHistory = this.formatVol(res?.data)
      })
      .catch((e) => {
        console.error(e)
      })
  },
  data() {
    return {
      pool: undefined,
      poolStats: [],
      poolDetail: undefined,
      volumeHistory: undefined,
      showLoading: {
        color: 'var(--primary-color)',
        textColor: 'var(--primary-color)',
        maskColor: 'var(--card-bg-color)',
      },
    }
  },
}
</script>

<style lang="scss" scoped>
.asset-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  margin-bottom: 1rem;
}

.pool-header {
  font-weight: bold;
  color: var(--sec-font-color);
  text-align: center;
}

.pool-overview {
  margin-top: 1rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  padding: 1rem;
  border-radius: 0.4rem;

  .chart-wrapper {
    border-color: transparent;
  }
}

.pool-detail-header {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  grid-gap: 0.5rem;

  .item {
    .header {
      font-size: 0.8rem;
    }

    .value {
      color: var(--sec-font-color);
    }
  }
}

.pool-detail-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
