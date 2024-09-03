<template>
  <Page>
    <div class="chart-container">
      <div class="network-stats">
        <div class="stat-group">
          <nuxt-link to="/insights" class="stat-item stat-item-link">
            <exchange class="stat-image" />
            <div class="item-detail">
              <div class="header">Swap Volume (24hr)</div>
              <skeleton-item :loading="!totalSwap24USD" class="value">
                {{ (totalSwap24USD / 1e2) | currency('$', 0) }}
              </skeleton-item>
            </div>
            <arrow-right-icon class="arrow-icon" />
          </nuxt-link>
          <hr />
          <nuxt-link to="/pools" class="stat-item stat-item-link">
            <Piggy class="stat-image" />
            <div class="item-detail">
              <div class="header">Bond | Pool APY</div>
              <skeleton-item :loading="!runeSupply" class="value">
                {{ network.bondingAPY | percent(2) }} |
                {{ network.liquidityAPY | percent(2) }}
              </skeleton-item>
            </div>
            <arrow-right-icon class="arrow-icon" />
          </nuxt-link>
          <hr />
        </div>
        <div class="stat-group">
          <nuxt-link to="/pools/tvl" class="stat-item stat-item-link">
            <LockIcon class="stat-image" />
            <div class="item-detail">
              <div class="header">Total Value Locked (Pool + Bond)</div>
              <skeleton-item
                :loading="!(totalValuePooled && network && network.bondMetrics)"
                class="value"
              >
                <template v-if="network && network.bondMetrics">
                  {{ tvl | currency('$', 0) }}
                </template>
              </skeleton-item>
            </div>
            <arrow-right-icon class="arrow-icon" />
          </nuxt-link>
          <hr />
          <nuxt-link to="/insights" class="stat-item stat-item-link">
            <money class="stat-image" />
            <div class="item-detail">
              <div class="header">Protocol Earnings (24hr)</div>
              <skeleton-item :loading="!runeVolume" class="value">
                {{ earnings24USD | currency('$', 0) }}
              </skeleton-item>
            </div>
            <arrow-right-icon class="arrow-icon" />
          </nuxt-link>
          <hr />
        </div>
        <div class="stat-group">
          <div class="stat-item">
            <book class="stat-image" />
            <div class="item-detail">
              <div class="header">Total Addresses</div>
              <skeleton-item :loading="!totalAddresses" class="value">
                {{ totalAddresses | number('0,0') }}
              </skeleton-item>
            </div>
          </div>
          <hr />
          <div class="stat-item">
            <stack-dollar class="stat-image" />
            <div class="item-detail">
              <div class="header">Total Earnings (24hr)</div>
              <skeleton-item :loading="!totalEarning24" class="value">
                {{ totalEarning24 | currency('$', 0) }}
              </skeleton-item>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="chart-inner-container">
      <Card
        :navs="[
          { title: 'Swap Volume', value: 'swap-vol' },
          { title: 'Pool Volume', value: 'pools-vol' },
        ]"
        :act-nav.sync="swapMode"
      >
        <VChart
          v-if="swapMode == 'swap-vol'"
          :key="1"
          class="swap-volume-chart"
          :option="swapHistory"
          :loading="!swapHistory"
          :autoresize="true"
          :loading-options="showLoading"
          :theme="chartTheme"
        />
        <div
          v-if="swapMode == 'pools-vol'"
          :key="1"
          class="pool-depth-container"
        >
          <div class="pool-depth-chart">
            <VChart
              :option="poolsOption"
              :autoresize="true"
              :loading-options="showLoading"
              style="width: 275px; height: 250px; min-height: initial"
              :theme="chartTheme"
            />
          </div>
          <div v-if="poolsData" class="pool-depth-extra">
            <table>
              <thead>
                <tr>
                  <th>Pool Name</th>
                  <th style="text-align: center">Volume</th>
                  <th>Depth</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in poolsData">
                  <td>
                    <div class="pool-name-container">
                      {{ p.name }}
                    </div>
                  </td>
                  <td style="text-align: center">
                    ${{ p.vol | number('0,0 a') }}
                  </td>
                  <td style="text-align: center">
                    ${{ p.value | number('0,0 a') }}
                  </td>
                </tr>
                <tr class="table-footer">
                  <td colspan="2" style="padding-right: 8px">
                    Total value locked in pools:
                  </td>
                  <td style="text-align: center">
                    ${{ totalValuePooled | number('0,0 a') }}
                  </td>
                </tr>
              </tbody>
            </table>
            <router-link to="/pools" class="view-all-link">
              <button class="view-all-button">
                View All
                <arrow-right-icon class="arrow-icon" />
              </button>
            </router-link>
          </div>
        </div>
      </Card>
      <Card
        :navs="[{ title: 'Earnings Volume', value: 'earnings-vol' }]"
        :act-nav.sync="poolMode"
      >
        <VChart
          v-if="poolMode == 'earnings-vol'"
          :key="2"
          :option="earningsHistory"
          :loading="!earningsHistory"
          :autoresize="true"
          :loading-options="showLoading"
          :theme="chartTheme"
        />
      </Card>
    </div>
    <div class="cards-container">
      <outbounds />
      <streamings />
    </div>
    <div class="cards-container">
      <info-card :options="statsSettings" />
      <info-card :options="networkSettings" />
    </div>
    <div class="cards-container">
      <div class="card">
        <div class="card-header">
          <div class="card-header-title">
            <h2 style="color: var(--sec-font-color)">Latest Blocks</h2>
          </div>
        </div>
        <div class="card-body">
          <template v-if="blocks">
            <template v-for="(b, i) in blocks">
              <div :key="i" class="row-item">
                <div class="meta">
                  <span class="header">
                    {{ b.height | number('0,0') }}
                  </span>
                  <span class="timestamp">
                    {{ b.date }}
                  </span>
                </div>
                <div class="txs" style="width: 40%">
                  <span
                    >Tx Size: <span class="value">{{ b.txs }}</span></span
                  >
                  <span
                    >Block Size:
                    <span class="value">{{
                      b.size | number('0,0')
                    }}</span></span
                  >
                </div>
              </div>
              <hr :key="i + 'hr'" class="hr-space" />
            </template>
          </template>
          <div v-else class="loading">
            <BounceLoader color="var(--font-color)" size="3rem" />
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-header-title">
            <h2 style="color: var(--sec-font-color)">Latest Transactions</h2>
          </div>
        </div>
        <div class="card-body">
          <template v-if="txs">
            <template v-for="(t, i) in txs">
              <div :key="i" class="row-item">
                <div class="meta">
                  <span class="header">
                    {{ t.height | number('0,0') }}
                  </span>
                  <span class="timestamp">
                    {{ formatMoment(t.date) }}
                  </span>
                </div>
                <div class="txs">
                  <span
                    >TxID
                    <a class="value" @click="gotoTx(t.in && t.in[0].txID)">{{
                      showTx(t.in && t.in[0].txID)
                    }}</a></span
                  >
                  <span
                    >From
                    <a class="value" @click="gotoAddr(t.in[0].address)">{{
                      t.in && t.in[0].address
                    }}</a></span
                  >
                </div>
              </div>
              <hr :key="i + 'hr'" class="hr-space" />
            </template>
          </template>
          <div v-else class="loading">
            <BounceLoader color="var(--font-color)" size="3rem" />
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>

<script>
import { mapGetters } from 'vuex'
import { AssetCurrencySymbol, assetFromString } from '@xchainjs/xchain-util'
import BounceLoader from 'vue-spinner/src/BounceLoader.vue'
import moment from 'moment'
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
import { range } from 'lodash'
import { blockTime } from '~/utils'

import StackDollar from '~/assets/images/sack-dollar.svg?inline'
import LockIcon from '~/assets/images/lock.svg?inline'
import ArrowRightIcon from '~/assets/images/arrow-right.svg?inline'
import Exchange from '~/assets/images/exchange.svg?inline'
import Book from '~/assets/images/book.svg?inline'
import Piggy from '~/assets/images/piggy.svg?inline'
import DangerIcon from '@/assets/images/danger.svg?inline'
import Money from '~/assets/images/money.svg?inline'
import External from '@/assets/images/external.svg?inline'

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
  name: 'OverviewPage',
  components: {
    VChart,
    Piggy,
    BounceLoader,
    DangerIcon,
    Exchange,
    LockIcon,
    Book,
    Money,
    StackDollar,
    ArrowRightIcon,
    External,
  },
  data() {
    return {
      nodes: [],
      network: [],
      rune: '',
      affiliateDaily: undefined,
      lastblock: undefined,
      stats: [],
      volumeHistory: undefined,
      swapHistory: undefined,
      earningsHistory: undefined,
      runeSupply: undefined,
      lastHeight: undefined,
      blocks: undefined,
      txs: undefined,
      totalSwapVolume: undefined,
      totalSwap24USD: undefined,
      earnings24USD: undefined,
      totalEarning24: undefined,
      totalSwapVolumeUSD: undefined,
      totalAddresses: undefined,
      thorHeight: undefined,
      poolsOption: undefined,
      poolsData: undefined,
      totalValuePooled: undefined,
      poolMode: 'earnings-vol',
      swapMode: 'swap-vol',
      inboundInfo: undefined,
      mimirInfo: undefined,
    }
  },
  async fetch() {
    const resBlock = await this.$api.getRPCLastBlockHeight()
    this.lastHeight = +resBlock?.data?.block?.header?.height
  },
  head: {
    title: 'THORChain Network Explorer | Dashboard',
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
      chainsHeight: 'getChainsHeight',
    }),
    tvl() {
      if (!this.network.bondMetrics || !this.totalValuePooled) {
        return
      }
      return (
        ((+this.network.totalPooledRune +
          +this.network.bondMetrics.totalStandbyBond +
          +this.network.bondMetrics.totalActiveBond) *
          this.runePrice) /
        1e8
      )
    },
    runeSymbol() {
      return AssetCurrencySymbol.RUNE
    },
    runeVolume() {
      return (
        (+this.stats?.swapVolume +
          +this.stats?.withdrawVolume +
          +this.stats?.addLiquidityVolume) /
        10 ** 8
      )
    },
    networkSettings() {
      // From Thornode - https://gitlab.com/thorchain/thornode/-/blob/7016020ef3566e1e2855fee0a38e14fbfa069425/x/thorchain/helpers.go#L1008
      // Refactored for readability
      const sbn = this.nodes
        .filter((n) => n.status === 'Active')
        .map((e) => +e.total_bond)
        .sort((a, b) => a - b)

      let t = (sbn.length * 2) / 3
      if (sbn.length % 3 === 0) {
        t -= 1
      }

      const bondHardCap = sbn[t]

      let totalEffectiveBond = 0
      for (const i in sbn) {
        let bond = sbn[i]
        if (bond > bondHardCap) {
          bond = bondHardCap
        }

        totalEffectiveBond += bond
      }
      totalEffectiveBond = totalEffectiveBond / 1e8

      let totalHardCap = 0
      for (let i = 0; i <= t; i++) {
        totalHardCap += sbn[i]
      }
      totalHardCap = totalHardCap / 1e8

      return [
        {
          title: 'Nodes',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Total Active Bonded',
              value:
                (+this.network.bondMetrics?.totalActiveBond / 10 ** 8) *
                this.runePrice,
              filter: (v) => `${this.$options.filters.currency(v)}`,
            },
            {
              name: 'Total Standby Bonded',
              value:
                (+this.network.bondMetrics?.totalStandbyBond / 10 ** 8) *
                this.runePrice,
              filter: (v) => `${this.$options.filters.currency(v)}`,
            },
            {
              name: 'Total Bond (Effective)',
              value: totalEffectiveBond * this.runePrice,
              filter: (v) => `${this.$options.filters.currency(v)}`,
            },
            {
              name: 'Hard Cap',
              value: totalHardCap * this.runePrice,
              filter: (v) => `${this.$options.filters.currency(v)}`,
            },
            {
              name: 'Active Node Count',
              value: this.network.activeNodeCount,
            },
            {
              name: 'Standby Node Count',
              value: this.network.standbyNodeCount,
            },
          ],
        },

        {
          title: 'APYs',
          rowStart: 2,
          colSpan: 1,
          items: [
            {
              name: 'Bonding APY',
              value: this.network.bondingAPY,
              filter: (v) => `${this.$options.filters.percent(v, 2)}`,
            },
            {
              name: 'Liquidity APY',
              value: this.network.liquidityAPY,
              filter: (v) => `${this.$options.filters.percent(v, 2)}`,
            },
            {
              name: 'Pool Share Factor',
              value: this.network.poolShareFactor,
              filter: (v) => `${this.$options.filters.percent(v, 2)}`,
            },
          ],
        },
      ]
    },
    statsSettings() {
      const sbn = this.nodes
        .filter((n) => n.status === 'Active')
        .map((e) => +e.total_bond)
        .sort((a, b) => a - b)

      let t = (sbn.length * 2) / 3
      if (sbn.length % 3 === 0) {
        t -= 1
      }

      const bondHardCap = sbn[t]

      let totalEffectiveBond = 0
      for (const i in sbn) {
        let bond = sbn[i]
        if (bond > bondHardCap) {
          bond = bondHardCap
        }

        totalEffectiveBond += bond
      }
      totalEffectiveBond = totalEffectiveBond / 1e8

      let totalHardCap = 0
      for (let i = 0; i <= t; i++) {
        totalHardCap += sbn[i]
      }
      totalHardCap = totalHardCap / 1e8
      return [
        {
          title: 'Swap',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Swap Count (24hr)',
              value: this.stats.swapCount24h ?? 0,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: 'Swap Count (30D)',
              value: this.stats.swapCount30d ?? 0,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: 'Total Swap Count',
              value: this.stats.swapCount ?? 0,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
          ],
        },
        {
          title: 'Value Locked',
          rowStart: 2,
          colSpan: 1,
          items: [
            {
              name: 'Total Value in Reserve',
              value:
                ((this.network.totalReserve ?? 0) / 10 ** 8) * this.runePrice,
              filter: (v) => `${this.$options.filters.currency(v)}`,
            },
            {
              name: 'Total Value in Pool',
              value:
                ((this.network.totalPooledRune * 2 ?? 0) / 10 ** 8) *
                this.runePrice,
              filter: (v) => `${this.$options.filters.currency(v)}`,
            },
          ],
        },
        {
          title: 'Churning',
          rowStart: 3,
          colSpan: 1,
          items: [
            {
              name: 'Next Churn Countdown',
              value: `${
                this.isChurnHalted()
                  ? 'Churn paused'
                  : this.chainsHeight &&
                    blockTime(
                      this.network.nextChurnHeight - this.chainsHeight.THOR
                    )
              }`,
            },
            {
              name: 'Pool Activation Countdown',
              value: blockTime(this.network.poolActivationCountdown),
            },
          ],
        },
      ]
    },
  },
  activated() {
    // Call fetch again if last fetch more than 30 sec ago
    if (this.$fetchState.timestamp <= Date.now() - 6000) {
      this.$fetch()
    }
  },
  fetchOnServer: false,
  mounted() {
    this.$api
      .getDashboardData()
      .then(({ data }) => {
        if (!data) {
          throw new Error('Cant read the data')
        }

        this.stats = data?.stats
        this.runeSupply = +data?.runeSupply?.amount?.amount / 10 ** 8
        this.lastblock = data?.lastBlockHeight
        this.txs = data?.txs?.actions
        this.totalAddresses = +data?.addresses?.pagination?.total
        this.totalSwap24USD = +data?.stats?.volume24USD

        this.$api.getPools().then(({ data }) => {
          this.formatPoolsData(data)
        })
      })
      .catch(async (e) => {
        await this.$api
          .getStats()
          .then((res) => (this.stats = res.data))
          .catch((error) => {
            console.error(error)
          })

        this.$api.getPools().then(({ data }) => {
          this.formatPoolsData(data)
        })

        this.$api
          .getLastBlockHeight()
          .then((res) => {
            this.lastblock = res.data
            this.thorHeight = res.data.find((e) => e.chain === 'BTC').thorchain
          })
          .catch((error) => {
            console.error(error)
          })

        this.$api
          .getSupplyRune()
          .then(
            (res) => (this.runeSupply = +res?.data?.amount?.amount / 10 ** 8)
          )
          .catch((error) => {
            console.error(error)
          })

        this.$api
          .getTxs()
          .then((res) => {
            this.txs = res?.data?.actions
          })
          .catch((error) => {
            console.error(error)
          })

        this.$api
          .getAddresses()
          .then((res) => (this.totalAddresses = +res?.data?.pagination?.total))
          .catch((error) => {
            console.error(error)
          })
      })

    this.$api
      .getDashboardPlots()
      .then(async ({ data }) => {
        if (!data) {
          throw new Error('Cant read the data')
        }

        this.volumeHistory = this.formatLPChange(data?.LPChange)
        ;({ resVolume: this.swapHistory } = this.formatSwap(data?.swaps))

        this.earningsHistory = await this.formatEarnings(data?.earning)
        this.earnings24USD =
          (+data?.earning?.intervals[data?.earning?.intervals.length - 1]
            .earnings /
            1e8) *
          +data?.earning?.intervals[data?.earning?.intervals.length - 1]
            .runePriceUSD

        const affiliate = this.affiliateDaily.find((d) => {
          return moment(d.date).isSame(
            moment.unix(
              data?.earning?.intervals[data?.earning?.intervals.length - 1]
                .startTime
            ),
            'day'
          )
        })
        this.totalEarning24 =
          this.earnings24USD + affiliate.daily_affiliate_fees_usd
        this.totalSwapVolumeUSD = data.swaps?.meta?.totalVolumeUSD
        this.totalSwapVolume = data.swaps?.meta?.totalVolume
      })
      .catch((error) => {
        console.error(error)

        this.$api
          .volumeHistory()
          .then((res) => (this.volumeHistory = this.formatLPChange(res.data)))
          .catch((error) => {
            console.error(error)
          })

        this.$api
          .swapHistory()
          .then((res) => {
            ;({ resVolume: this.swapHistory } = this.formatSwap(res.data))
            this.totalSwapVolumeUSD = res?.meta?.totalVolumeUSD
            this.totalSwapVolume = res?.meta?.totalVolume
          })
          .catch((error) => {
            console.error(error)
          })

        this.$api
          .tvlHistory()
          .then((res) => (this.tvlHistory = this.formatTvl(res.data)))
          .catch((error) => {
            console.error(error)
          })

        this.$api
          .earningsHistory()
          .then(
            async (res) =>
              (this.earningsHistory = await this.formatEarnings(res.data))
          )
          .catch((error) => {
            console.error(error)
          })
      })

    this.$api
      .getRPCLastBlockHeight()
      .then((res) => {
        this.lastHeight = +res?.data?.block?.header?.height
        this.$api
          .getTendermintLatestBlocks()
          .then(
            (res) =>
              (this.blocks = this.formatTendermintBlocks(
                res?.data?.result.block_metas
              ))
          )
          .catch((error) => {
            console.error(error)
          })
      })
      .catch((error) => {
        console.error(error)
      })

    this.$api.getNetwork().then(({ data }) => {
      this.network = data
    })

    this.$api.getNodes().then(({ data }) => {
      this.nodes = data
    })

    this.$api.getAffiliateDaily().then(({ data }) => {
      this.affiliateDaily = data
    })

    // Get inbound info
    this.getNetworkStatus()

    setInterval(() => {
      this.getNetworkStatus()
    }, 10000)
  },
  methods: {
    stringToPercentage(val) {
      return (Number.parseFloat(val ?? 0) * 100).toFixed(2).toString() + ' %'
    },
    isChurnHalted() {
      if (this.mimirInfo && this.mimirInfo.HALTCHURNING) {
        return true
      }

      return false
    },
    async getNetworkStatus() {
      const mi = (await this.$api.getMimir()).data
      this.mimirInfo = mi
    },
    formatLPChange(d) {
      const xAxis = []
      const lv = []
      const wv = []
      const alv = []
      d?.intervals.forEach((interval) => {
        xAxis.push(
          moment(
            Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format('MM/DD')
        )
        alv.push(
          (+interval.addLiquidityVolume * +interval.runePriceUSD) / 10 ** 8
        )
        wv.push(
          -1 * ((+interval.withdrawVolume * +interval.runePriceUSD) / 10 ** 8)
        )
        lv.push(
          ((+interval.addLiquidityVolume - +interval.withdrawVolume) *
            +interval.runePriceUSD) /
            10 ** 8
        )
      })

      return this.basicChartFormat(
        (value) => `$ ${this.normalFormat(value)}`,
        [
          {
            type: 'bar',
            name: 'Total Change',
            showSymbol: false,
            data: lv,
            smooth: true,
          },
          {
            type: 'bar',
            name: 'Add Volume',
            showSymbol: false,
            data: alv,
            smooth: true,
          },
          {
            type: 'bar',
            name: 'Withdraw Volume',
            showSymbol: false,
            data: wv,
            smooth: true,
          },
        ],
        xAxis
      )
    },
    formatSwap(d) {
      const xAxis = []

      const swapVolume = {
        total: [],
      }

      const swapCount = {
        total: [],
      }

      let EODVolume = 0

      d?.intervals.forEach((interval, index) => {
        if (d?.intervals.length === index + 1) {
          if (+interval.totalVolumeUSD === 0) {
            return
          }
          swapVolume?.total.push({
            value: +interval.totalVolumeUSD / 10 ** 2,
            itemStyle: {
              color: '#F3BA2F',
              borderRadius: [0, 0, 0, 0],
            },
          })
          if (+interval.totalCount < +d?.intervals[index - 1].totalCount / 3) {
            EODVolume =
              d?.intervals
                .slice(-4, -1)
                .reduce((a, c) => a + +c.totalVolumeUSD, 0) /
                (1e2 * 3) -
              +interval.totalVolumeUSD / 1e2
          } else {
            EODVolume = interval.EODVolume / 1e2
          }
        } else {
          swapVolume?.total.push({
            value: +interval.totalVolumeUSD / 10 ** 2,
            itemStyle: {
              borderRadius: [8, 8, 0, 0],
            },
          })
        }
        xAxis.push(
          moment(
            Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format('MM/DD')
        )
        swapCount?.total.push(+interval.totalCount)
      })

      const EODSwap = range(0, swapVolume.total.length - 1, 0)

      EODSwap.push({
        value: EODVolume,
        itemStyle: {
          color: 'transparent',
          borderColor: '#F3BA2F',
          borderWidth: 1,
          borderRadius: [8, 8, 0, 0],
        },
      })

      const resVolume = this.basicChartFormat(
        undefined,
        [
          {
            type: 'bar',
            name: 'Total Volume',
            stack: 'Total',
            showSymbol: false,
            data: swapVolume?.total,
            smooth: true,
          },
          {
            type: 'bar',
            name: 'EOD Volume',
            stack: 'Total',
            showSymbol: false,
            data: EODSwap,
            smooth: true,
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
            <div class="data-color" style="background-color: ${param[0].color}"></div>
            ${param[0].name}
          </div>
          <div class="tooltip-body">
            <span>
              <span>Volume</span>
              <b>$${this.$options.filters.number(param[0].value, '0,0.00')}</b>
            </span>
            ${
              EODSwap[param[0].dataIndex] !== 0
                ? `<span><span>Volume (EOD)</span><b>$${this.$options.filters.number(param[0].value + EODSwap[param[0].dataIndex].value, '0,0.00')}</b></span>`
                : ''
            }
            <span>
              <span>Count</span>
              <b>${this.$options.filters.number(swapCount?.total[param[0].dataIndex], '0,0')}</b>
            </span>
          </div>
        `
        }
      )

      return { resVolume }
    },
    formatTvl(d) {
      const xAxis = []
      const tvp = []
      d?.intervals.forEach((interval) => {
        xAxis.push(
          moment(
            Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format('MM/DD')
        )
        tvp.push(
          (+interval.totalValuePooled / 10 ** 8) *
            Number.parseFloat(interval.runePriceUSD)
        )
      })

      return this.basicChartFormat(
        (value) => `$ ${this.normalFormat(value)}`,
        [
          {
            type: 'line',
            name: 'Total Value Pooled',
            showSymbol: false,
            data: tvp,
            smooth: true,
          },
        ],
        xAxis
      )
    },
    async formatEarnings(d) {
      const xAxis = []
      const le = []
      const be = []
      const af = []

      if (process.env.NETWORK === 'mainnet') {
        this.affiliateDaily = (await this.$api.getAffiliateDaily()).data
      }

      d?.intervals.pop()
      d?.intervals.forEach((interval, index) => {
        const date = moment(
          Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
        )
        xAxis.push(date.format('MM/DD'))
        le.push(
          (+interval.liquidityEarnings / 10 ** 8) *
            Number.parseFloat(interval.runePriceUSD)
        )
        be.push(
          (+interval.bondingEarnings / 10 ** 8) *
            Number.parseFloat(interval.runePriceUSD)
        )
        const affiliate = this.affiliateDaily.find((d) => {
          return moment(d.date).isSame(date, 'day')
        })
        af.push({
          value: affiliate.daily_affiliate_fees_usd,
          itemStyle: {
    borderRadius: [8, 8, 0, 0],
  },
        })
      })

      return this.basicChartFormat(
        (value) => `$ ${this.normalFormat(value)}`,
        [
          {
            type: 'bar',
            name: 'Liquidity Earning',
            showSymbol: false,
            stack: 'Total',
            data: le,
            smooth: true,
          },
          {
            type: 'bar',
            name: 'Bond Earning',
            stack: 'Total',
            showSymbol: false,
            data: be,
            smooth: true,
          },
          this.affiliateDaily && {
            type: 'bar',
            name: 'Affiliate Earning',
            showSymbol: false,
            stack: 'Total',
            data: af,
            smooth: true,
          },
        ],
        xAxis,
        undefined,
        (param) => {
          return `
            <div class="tooltip-header">
              <div class="data-color" style="background-color: ${param[0].color}"></div>
              ${param[0].name}
            </div>
            <div class="tooltip-body">
              ${param
                .map(
                  (p) => `<span>
                  <span>${p.seriesName}</span>
                  <b>$${this.$options.filters.number(p.value, '0,0')}</b>
                </span>`
                )
                .join('')}
              <span style="border-top: 1px solid var(--border-color); margin: 2px 0;"></span>
              <span>
                <span>Total Earning</span>
                <b>$${this.$options.filters.number(
                  param.reduce((a, c) => a + c.value, 0),
                  '0,0'
                )}</b>
              </span>
            </div>
          `
        }
      )
    },
    formatTendermintBlocks(blocks) {
      const blockJsons = []
      for (const block of blocks) {
        blockJsons.push({
          height: block?.header?.height,
          date: moment(block?.header?.time).fromNow(),
          txs: block?.num_txs,
          size: block?.block_size,
        })
      }
      return blockJsons.slice(0, 10)
    },
    showTx(txID) {
      if (
        txID ===
        '0000000000000000000000000000000000000000000000000000000000000000'
      ) {
        return 'Internal Tx'
      }
      return txID
    },
    formatMoment(time) {
      return moment(Number.parseInt(time / 10 ** 6)).fromNow()
    },
    formatPoolsData(d) {
      const poolData = []
      const runePrice = this.stats.runePriceUSD
      let totalValuePooled = 0
      let otherPoolsVolume = 0
      let otherValuePooled = 0
      const defaultColors = [
        '#5470c6',
        '#91cc75',
        '#fac858',
        '#ee6666',
        '#73c0de',
        '#3ba272',
        '#fc8452',
        '#9a60b4',
        '#ea7ccc',
      ]
      d.sort((a, b) => +b.runeDepth - +a.runeDepth).forEach((p, i) => {
        const runeInPools = +p.runeDepth
        const assetsInRune = +p.assetDepth * +p.assetPrice
        totalValuePooled += ((runeInPools + assetsInRune) * runePrice) / 1e8
        if (i < 6) {
          const asset = assetFromString(p.asset)
          poolData.push({
            value: ((runeInPools + assetsInRune) * runePrice) / 1e8,
            name: `${asset.chain}.${asset.ticker}`,
            vol: (+p.volume24h * runePrice) / 1e8,
            color: defaultColors[i],
          })
        } else if (i >= 6) {
          otherPoolsVolume += (+p.volume24h * runePrice) / 1e8
          otherValuePooled += ((runeInPools + assetsInRune) * runePrice) / 1e8

          if (i === d.length - 1) {
            poolData.push({
              value: otherValuePooled,
              name: 'Other pools',
              vol: otherPoolsVolume,
              color: defaultColors[6],
            })
          }
        }
      })

      const option = {
        formatter: (param) => {
          return `
            <div class="tooltip-header">
              <div class="data-color" style="background-color: ${param.color}"></div>
              ${param.name}
            </div>
            <div class="tooltip-body">
              <span>
                <span>Depth</span>
                <b>$${this.$options.filters.number(param.value, '0,0 a')}</b>
              </span>
              <span>
                <span>Volume</span>
                <b>$${this.$options.filters.number(poolData[param.dataIndex].vol, '0,0 a')}</b>
              </span>
            </div>
          `
        },
        tooltip: {
          trigger: 'item',
        },
        series: [
          {
            name: 'Pool Value',
            type: 'pie',
            radius: [0, 80],
            center: ['50%', '50%'],
            width: 275,
            height: 250,
            itemStyle: {
              borderRadius: 5,
            },
            label: {
              show: false,
            },
            data: poolData,
          },
        ],
      }

      this.poolsOption = option
      this.poolsData = poolData
      this.totalValuePooled = totalValuePooled
    },
  },
}
</script>

<style lang="scss">
.container {
  border: 1px solid var(--border-color);
  border: 1px solid var(--border-color);
  border-width: 1px 0 1px 0;
  color: var(--sec-font-color);
}
.overview-container {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}

.footer-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-wrap: wrap;
  flex: 1;

  @include lg {
    flex-direction: row;
  }
}

.break {
  flex-basis: 100%;
  height: 0;
}

.network-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .stat-item {
    display: flex;
    align-items: center;

    .header {
      color: var(--font-color);
      font-size: 0.875rem;
    }

    .value {
      .extra {
        color: var(--font-color);
        font-size: 0.78rem;
      }
    }

    .stat-image {
      margin-right: 0.75rem;
      width: 2rem;
      height: 2rem;
      fill: var(--sec-font-color);
    }

    .item-detail {
      .value {
        font-weight: bold;
        color: var(--sec-font-color);
      }
    }

    &.stat-item-link {
      text-decoration: none;

      .arrow-icon {
        display: none;
        fill: var(--sec-font-color);
        height: 1.5rem;
        width: 1.5rem;
        margin-left: auto;
        transform: rotate(-45deg);
        align-self: flex-start;
      }

      &:hover {
        .header {
          color: var(--sec-font-color);
        }
        .value {
          color: var(--primary-color);
        }
        .arrow-icon {
          display: block;
          fill: var(--primary-color);
        }
      }
    }
  }

  hr {
    margin: 0.75rem 0;
    opacity: 0.65;
    overflow: visible;
    height: 0;
    border: 0;
    border-top: 1px solid var(--border-color);
  }

  .rune-symbol {
    color: var(--font-color);
    margin: 0 0.6rem;
    font-size: 2rem;
    line-height: 28px;
    width: 1.6rem;
  }

  .stat-group {
    border: 1px solid var(--border-color);
    min-width: 280px;
    background-color: var(--bg-color);
    border-radius: 8px;
    padding: 15px;
    flex: 1;
  }
}

.stat-group hr:last-child {
  display: none;
}

@include md {
  .network-stats {
    padding: 0;
    justify-content: space-between;

    .stat-group {
      position: relative;
      padding: 1rem;
      flex: 1;

      &:last-of-type::after {
        display: none;
      }
    }
  }
}

.cards-container {
  display: grid;
  width: 100%;
  grid-gap: 10px;
  grid-auto-columns: minmax(100px, auto);

  .card {
    margin: 0;
  }

  @include lg {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.echarts {
  min-height: 400px;
}

.pool-depth-container {
  flex: 1;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding-right: 1.5rem !important;
  min-height: 100%;

  @include lg {
    flex-wrap: wrap;
    flex-direction: initial;

    .pool-depth-chart {
      min-width: 250px;
    }
  }

  .pool-depth-chart {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .pool-depth-extra {
    flex: 1;
    margin-top: 1.5rem;

    @include lg {
      margin-top: 0;
    }

    .pool-name-container {
      display: flex;
      align-items: center;
    }

    table {
      border-collapse: collapse;
      margin: auto;

      thead {
        text-transform: uppercase;
        border-bottom: 1px solid var(--border-color);

        th {
          padding-bottom: 7px;
          font-size: 0.875rem;
        }
      }

      th {
        font-weight: 700;
        text-align: inherit;
      }

      tbody td {
        font-weight: 700;
        padding: 7px 0;
        color: var(--sec-font-color);
        font-size: 0.875rem;
      }

      .table-footer {
        border-top: 1px solid var(--border-color);
      }
    }
  }
  .view-all-link {
    display: flex;
    justify-content: center;
    margin-top: 16px;
    width: 100%;
    text-align: center;
    text-decoration: none;
  }

  .view-all-button {
    background-color: var(--bg-color);
    border-radius: 0.5rem;
    border: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 8px;
    color: var(--font-color);
    cursor: pointer;
    width: 80%;
    font-size: 14px;
    font-weight: 500;

    .arrow-icon {
      fill: var(--sec-font-color);
      width: 1.2rem;
      height: 1.2rem;
      margin-left: 6px;
    }

    &:hover {
      color: var(--primary-color);
      background-color: var(--active-bg-color);
      .arrow-icon {
        fill: var(--primary-color);
      }
    }
  }
}
.chain-col {
  display: flex;
  gap: 5px;
  align-items: center;
}

.chain-status {
  .status-header {
    color: var(--sec-font-color);
  }
}
</style>
