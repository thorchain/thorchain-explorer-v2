<template>
  <Page>
    <div class="chart-container">
      <NetworkStats />
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
                    ${{ p.vol | number('0,0a') }}
                  </td>
                  <td style="text-align: center">
                    ${{ p.value | number('0,0a') }}
                  </td>
                </tr>
                <tr class="table-footer">
                  <td colspan="2" style="padding-right: 8px">
                    Total value locked in pools:
                  </td>
                  <td style="text-align: center">
                    ${{ totalValuePooled | number('0,0a') }}
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
        :navs="[
          { title: 'Earnings & Fees', value: 'total-earnings' },
          { title: 'LP Earnings', value: 'pool-earnings' },
          ...(isMainnet()
            ? [{ title: 'Affiliate Fees', value: 'affiliates-fees' }]
            : []),
        ]"
        :act-nav.sync="poolMode"
      >
        <div class="open-button">
          <button
            v-if="['pool-earnings', 'affiliates-fees'].includes(poolMode)"
            class="button-charts"
            @click="openChartEarnings"
          >
            {{ poolMode === 'pool-earnings' ? 'Open Chart' : 'Open Chart' }}
          </button>
        </div>
        <div>
          <VChart
            v-if="poolMode == 'total-earnings'"
            :key="1"
            :option="earningsHistory"
            :loading="!earningsHistory"
            :autoresize="true"
            :loading-options="showLoading"
            :theme="chartTheme"
          />
        </div>
        <VChart
          v-if="poolMode == 'pool-earnings'"
          :key="2"
          :option="poolEarnings"
          :loading="!poolEarnings"
          :autoresize="true"
          :loading-options="showLoading"
          :theme="chartTheme"
        />
        <VChart
          v-if="poolMode == 'affiliates-fees'"
          :key="3"
          :option="affiliateChart"
          :loading="!affiliateChart"
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
    <div v-if="isMainnet()">
      <affiliate-tables
        :affiliate-data="affiliateData"
        :is-overview="true"
        :limit="5"
      />
    </div>
    <div class="cards-container">
      <LatestBlocks :burned-blocks="burnedBlocks" />
      <LatestTransactions :transactions="txs"></LatestTransactions>
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
import { range, orderBy, fill } from 'lodash'
import affiliateTables from '../insights/component/affiliateTables.vue'
import NetworkStats from './NetworkStats.vue'
import LatestTransactions from './LatestTransactions.vue'
import LatestBlocks from './LatestBlocks.vue'
import { blockTime } from '~/utils'
import StackDollar from '~/assets/images/sack-dollar.svg?inline'
import LockIcon from '~/assets/images/lock.svg?inline'
import ArrowRightIcon from '~/assets/images/arrow-right.svg?inline'
import Exchange from '~/assets/images/exchange.svg?inline'
import Burn from '~/assets/images/burn.svg?inline'
import Rune from '~/assets/images/rune.svg?inline'
import Piggy from '~/assets/images/piggy.svg?inline'
import Chart from '~/assets/images/chart.svg?inline'
import TransactionAction from '~/components/transactions/TransactionAction.vue'
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
    Exchange,
    LockIcon,
    Burn,
    Rune,
    Chart,
    StackDollar,
    ArrowRightIcon,
    TransactionAction,
    affiliateTables,
    NetworkStats,
    LatestTransactions,
    LatestBlocks,
  },
  layout: 'dashboard',
  data() {
    return {
      burnedBlocks: [],
      affiliateData: [],
      oldRunePool: [],
      polOverview: undefined,
      rune: '',
      affiliateDaily: undefined,
      lastblock: undefined,
      stats: [],
      volumeHistory: undefined,
      swapHistory: undefined,
      earningsHistory: undefined,
      poolEarnings: undefined,
      affiliateChart: undefined,
      runeSupply: undefined,
      lastHeight: undefined,
      blocks: undefined,
      txs: undefined,
      totalSwapVolume: undefined,
      totalSwap24USD: undefined,
      affiliateEarning: 0,
      earnings24USD: undefined,
      totalSwapVolumeUSD: undefined,
      totalAddresses: undefined,
      thorHeight: undefined,
      poolsOption: undefined,
      poolsData: undefined,
      totalValuePooled: undefined,
      totalBurnedRune: undefined,
      earningsData: undefined,
      poolMode: 'total-earnings',
      swapMode: 'swap-vol',
      inboundInfo: undefined,
      mimirInfo: undefined,
      network: undefined,
      ui: undefined,
      volumeUSDData: undefined,
      tcyInfo: undefined,
    }
  },
  head: {
    title: 'THORChain Network Explorer | Dashboard',
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
      chainsHeight: 'getChainsHeight',
      theme: 'getTheme',
    }),
    calculatedAPY() {
      if (!this.tcyInfo || !this.runePrice) return 0

      const lastWeekEarnings = this.tcyInfo.last_week_earnings
      const tcySupply = this.tcyInfo.TCYSupply
      const price = this.tcyInfo.price

      return (
        ((lastWeekEarnings / 1e8) * this.runePrice * 52) / tcySupply / price
      )
    },
    totalEarning24() {
      return this.earnings24USD + this.affiliateEarning
    },
    tvl() {
      if (!this.network?.bondMetrics || !this.totalValuePooled) {
        return
      }
      return (
        ((+this.network?.totalPooledRune * 2 +
          +this.network?.bondMetrics.totalActiveBond) *
          this.runePrice) /
        1e8
      )
    },
    circulating() {
      if (!this.network) {
        return
      }

      return +this.runeSupply - +this.network?.totalReserve / 1e8
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
      // const sbn = this.nodes
      //   .filter((n) => n.status === 'Active')
      //   .map((e) => +e.total_bond)
      //   .sort((a, b) => a - b)

      // let t = (sbn.length * 2) / 3
      // if (sbn.length % 3 === 0) {
      //   t -= 1
      // }

      // const bondHardCap = sbn[t]

      // let totalEffectiveBond = 0
      // for (const i in sbn) {
      //   let bond = sbn[i]
      //   if (bond > bondHardCap) {
      //     bond = bondHardCap
      //   }

      //   totalEffectiveBond += bond
      // }
      // totalEffectiveBond = totalEffectiveBond / 1e8

      // let totalHardCap = 0
      // for (let i = 0; i <= t; i++) {
      //   totalHardCap += sbn[i]
      // }
      // totalHardCap = totalHardCap / 1e8

      return [
        {
          title: 'Nodes',
          rowStart: 1,
          colSpan: 1,
          link: '/nodes',
          items: [
            {
              name: 'Active Bond',
              value: +this.network?.bondMetrics?.totalActiveBond / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'Standby Bond',
              value: +this.network?.bondMetrics?.totalStandbyBond / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'Active Nodes',
              value: this.network?.activeNodeCount,
            },
            {
              name: 'Standby Nodes',
              value: this.network?.standbyNodeCount,
            },
          ],
        },
        {
          title: 'Churning',
          rowStart: 3,
          colSpan: 1,
          link: '/network/churn',
          items: [
            {
              name: 'Next Churn',
              value: this.getNextChurn(),
            },
            {
              name: 'Next Pool',
              value:
                this.network?.poolActivationCountdown > 500
                  ? blockTime(this.network?.poolActivationCountdown, true)
                  : `${this.network?.poolActivationCountdown} Blocks`,
            },
          ],
        },
        {
          title: 'TCY ',
          rowStart: 5,
          colSpan: 1,
          link: '/thorfi/tcy',
          items: [
            {
              name: 'Claimed',
              value: this.tcyInfo?.claimed_info?.total,
              filter: (v) =>
                this.$options.filters.percent(v / 20660654128874864, 2),
            },
            {
              name: 'Total Stakers',
              value: this.tcyInfo?.staker_info?.total || 0,
              filter: (v) =>
                `${this.$options.filters.number(v / 1e8, '0,0.00a')} TCY`,
              extraText: `$${this.$options.filters.number((this.tcyInfo?.staker_info.total / 1e8) * this.tcyInfo?.price, '0,0.00a')}`,
            },
            {
              name: 'APR',
              value: this.calculatedAPY || 0,
              filter: (v) => this.$options.filters.percent(v, 2),
            },
          ],
        },
      ]
    },
    statsSettings() {
      const pol = this.polOverview

      return [
        {
          title: 'Swap',
          rowStart: 1,
          colSpan: 1,
          link: '/txs',
          items: [
            {
              name: 'Swap Count (30D)',
              value: this.stats.swapCount30d ?? 0,
              filter: (v) => `${this.$options.filters.number(v, '0,0a')}`,
            },
            {
              name: 'Total Swap Count',
              value: this.stats.swapCount ?? 0,
              filter: (v) => `${this.$options.filters.number(v, '0,0a')}`,
            },
            {
              name: 'Total Addresses',
              value: this.totalAddresses,
              filter: (v) => `${this.$options.filters.number(v, '0,0a')}`,
            },
          ],
        },
        {
          title: 'Value Locked',
          rowStart: 2,
          colSpan: 1,
          link: '/network',
          items: [
            {
              name: 'Reserve',
              value: (this.network?.totalReserve ?? 0) / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'Pools',
              value: (this.network?.totalPooledRune * 2 ?? 0) / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'Pool Share Factor',
              value: this.network?.poolShareFactor,
              filter: (v) => `${this.$options.filters.percent(v, 2)}`,
            },
            {
              name: 'RUNEPool',
              value: pol?.current_deposit / 1e8 || 0,
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'RUNEPool Share of Pools',
              value: pol?.value / (this.network?.totalPooledRune * 2),
              filter: (v) => `${this.$options.filters.percent(v, 2)}`,
            },
          ],
        },
      ]
    },
  },
  mounted() {
    this.$api
      .getTcyInfo()
      .then(({ data }) => {
        this.tcyInfo = data
      })
      .catch((error) => {
        console.error('Error fetching TCY info:', error)
      })

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
        this.network = data?.networkData
        this.earnings24USD =
          (data?.stats.earnings24 / 1e8) * +data?.stats.runePriceUSD

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

    const affiliatePromise = this.$api
      .getAffiliateHistory({ interval: 'day', count: '30' })
      .then(({ data }) => {
        this.affiliateChart = this.formatAffiliateHistory(data)
        this.volumeUSDData = data.intervals.map((interval) => {
          return (interval.thornames || []).reduce((sum, item) => {
            return sum + (Number(item.volumeUSD) || 0)
          }, 0)
        })
      })
      .catch((error) => {
        console.error('API error:', error)
      })

    const dashboardPromise = this.$api
      .getDashboardPlots()
      .then(({ data }) => {
        if (!data) {
          throw new Error('Cant read the data')
        }

        this.volumeHistory = this.formatLPChange(data?.LPChange)
        ;({ resVolume: this.swapHistory } = this.formatSwap(data?.swaps))

        this.poolEarnings = this.formatPoolEarnings(data?.earning)
        this.earningsData = data?.earning
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
          .getTVLHistory()
          .then((res) => (this.getTVLHistory = this.formatTvl(res.data)))
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

    Promise.all([affiliatePromise, dashboardPromise]).then((values) => {
      this.earningsHistory = this.formatEarnings(this.earningsData)
    })

    this.$api
      .getRPCLastBlockHeight()
      .then((res) => {
        this.lastHeight = +res?.data?.block?.header?.height
      })
      .catch((error) => {
        console.error(error)
      })

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

    this.$api.getAffiliateDaily().then(({ data }) => {
      this.affiliateDaily = data
      this.affiliateEarning =
        data[data.length - 1]?.daily_affiliate_fees_usd ?? 0
    })

    this.$api.getEarnings().then(({ data }) => {
      this.totalBurnedRune =
        data?.meta?.pools?.find((p) => p.pool === 'income_burn').earnings / 1e8
    })

    this.$api
      .getAffiliateSwapsByWallet()
      .then((data) => {
        if (data && data.data) {
          this.affiliateData = data.data.map((item) => ({
            affiliate: item.affiliate,
            affiliate_fees_usd: item.affiliate_fees_usd ?? 0,
            total_swaps: item.total_swaps,
            total_volume_usd: item.total_volume_usd,
            vc: item.vc,
            avg_bps: item.avg_affiliate_fee_basis_points / 1e4,
          }))
        } else {
          console.error('Data structure is not as expected:', data)
        }
      })
      .catch((error) => {
        console.error('Error fetching affiliate swaps by wallet:', error)
      })

    // Get inbound info
    this.getNetworkStatus()

    this.updateRunePool()

    this.ui = setInterval(() => {
      this.getNetworkStatus()
      this.getBurnData()
    }, 10000)
  },
  destroyed() {
    this.clearIntervalId(this.ui)
  },
  methods: {
    async updateRunePool() {
      try {
        const { data } = await this.$api.getRunePool()
        this.polOverview = data.pol || {}
      } catch (error) {
        console.error('Error updating RUNE pool data:', error)
      }
    },
    getBurnData() {
      this.$api
        .getBurnedBlocks()
        .then(({ data }) => {
          this.totalBurned = 500_000_000 - +data.totalBurned / 1e8
          this.burnedBlocks = data.burnedBlocks.reverse()
        })
        .catch((error) => {
          console.error('Error fetching swap history:', error)
        })
    },
    stringToPercentage(val) {
      return (Number.parseFloat(val ?? 0) * 100).toFixed(2).toString() + ' %'
    },
    openChartSwap() {
      this.$router.push('/charts/swap')
    },
    openChartEarnings() {
      if (this.poolMode === 'pool-earnings') {
        this.$router.push('/charts/earnings')
      } else if (this.poolMode === 'affiliates-fees') {
        this.$router.push('/charts/affiliates')
      }
    },
    isChurnHalted() {
      if (this.mimirInfo && this.mimirInfo.HALTCHURNING) {
        return true
      }
      if (+this.network?.nextChurnHeight === -1) {
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
          ).format('dddd, MMM D')
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
      const now = moment().utc(0)

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
          if (now.diff(moment().utc(0).startOf('day'), 'hours') < 6) {
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
          ).format('dddd, MMM D')
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
            <div class="data-color" style="background-color: ${
              param[0].color
            }"></div>
            ${param[0].name}
          </div>
          <div class="tooltip-body">
            <span>
              <span>Volume</span>
              <b>$${this.$options.filters.number(param[0].value, '0,0.00a')}</b>
            </span>
            ${
              EODSwap[param[0].dataIndex] !== 0
                ? `<span><span>Volume (EOD)</span><b>$${this.$options.filters.number(
                    param[0].value + EODSwap[param[0].dataIndex].value,
                    '0,0.00a'
                  )}</b></span>`
                : ''
            }
            <span>
              <span>Count</span>
              <b>${this.$options.filters.number(
                swapCount?.total[param[0].dataIndex],
                '0,0a'
              )}</b>
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
          ).format('dddd, MMM D')
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
    formatPoolEarnings(d) {
      const poolEarnings = orderBy(
        d.intervals[d.intervals.length - 2].pools,
        [(o) => +o.earnings],
        ['desc']
      )
        .filter(
          (p) =>
            p.pool !== 'dev_fund_reward' &&
            p.pool !== 'income_burn' &&
            p.pool !== 'tcy_stake_reward'
        )
        .map((p) => p.pool)

      const xAxis = []
      const pe = []

      d?.intervals.forEach((interval, index) => {
        // Date
        const date = moment(
          Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
        )
        xAxis.push(date.format('dddd, MMM D'))

        const topPool =
          d.intervals[0].pools.length > 8 ? 8 : d.intervals[0].pools.length

        let otherEarnings = interval.pools.filter(
          (p) =>
            !poolEarnings.slice(0, topPool).includes(p.pool) &&
            p.pool !== 'income_burn' &&
            p.pool !== 'dev_fund_reward' &&
            p.pool !== 'tcy_stake_reward'
        )

        // sum them all
        otherEarnings = otherEarnings.reduce(
          (a, c) => a + (+c.earnings * +interval.runePriceUSD) / 1e8,
          0
        )

        if (index === 0) {
          pe.push({
            type: 'bar',
            name: 'Other Pools',
            showSymbol: false,
            stack: 'Total',
            data: [otherEarnings],
          })
        } else {
          pe[0].data.push(otherEarnings)
        }

        // Pool Earning
        for (let pi = 0; pi < topPool; pi++) {
          const color = this.assetColorPalette(poolEarnings[pi])
          const pool = interval.pools.find((p) => p.pool === poolEarnings[pi])
          const isRound = !!(
            pi === topPool - 1 && d?.intervals.length - 1 !== index
          )

          const earning = {
            value: (+pool?.earnings / 1e8) * +interval.runePriceUSD,
            areaStyle: {
              color,
            },
            lineStyle: {
              color,
            },
            itemStyle: {
              color,
              borderRadius: isRound ? [8, 8, 0, 0] : [0, 0, 0, 0],
            },
          }

          if (index === 0) {
            pe.push({
              type: 'bar',
              name: this.showAsset(poolEarnings[pi]),
              showSymbol: false,
              stack: 'Total',
              data: [earning],
            })
          } else {
            pe[pi + 1].data.push(earning)
          }
        }
      })

      // Add EOD to the earnings
      const EODEarnings = range(0, d?.intervals.length - 1, 0)
      let EODValue =
        (+d?.intervals[d?.intervals.length - 1]?.EODLiquidityEarnings *
          +d?.intervals[d?.intervals.length - 1].runePriceUSD) /
          1e8 ?? 0
      // subtract the dev_fund_reward
      const lastTotalEarning =
        d?.intervals[d?.intervals.length - 2]?.liquidityEarnings
      const lastDevFundEarning = +d?.intervals[
        d?.intervals.length - 2
      ]?.pools?.find((p) => p.pool === 'dev_fund_reward')?.earnings
      EODValue -= ((lastDevFundEarning / lastTotalEarning) * EODValue) / 1e8

      EODEarnings.push({
        value: EODValue > 0 ? EODValue : 0,
        itemStyle: {
          color: 'transparent',
          borderColor: '#F3BA2F',
          borderWidth: 1,
          borderRadius: [8, 8, 0, 0],
        },
      })

      pe.push({
        type: 'bar',
        name: 'EOD',
        showSymbol: false,
        stack: 'Total',
        data: EODEarnings,
      })

      return this.basicChartFormat(
        (value) => `$ ${this.normalFormat(value, '0,0.00a')}`,
        pe,
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
                  if (a.seriesName === 'Other Pools') return 1
                  if (b.seriesName === 'Other Pools') return -1
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
            <span>
              <span>Total Earnings</span>
              <b>$${this.$options.filters.number(
                param.reduce((a, c) => a + (c.value ? c.value : 0), 0),
                '0,0a'
              )}</b>
            </span>
          `
        }
      )
    },
    formatEarnings(d) {
      const xAxis = []
      const le = []
      const be = []
      const af = []
      const df = []
      const ib = []
      const tc = []
      const EODEarning = []
      let affiliateEOD = 0
      d?.intervals.forEach((interval, index) => {
        const date = moment(
          Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
        )
        xAxis.push(date.format('dddd, MMM D'))
        const devFund =
          (+interval.pools.find((p) => p.pool === 'dev_fund_reward')?.earnings /
            10 ** 8) *
          Number.parseFloat(interval.runePriceUSD)
        const incomeBurn =
          (+interval.pools.find((p) => p.pool === 'income_burn')?.earnings /
            10 ** 8) *
          Number.parseFloat(interval.runePriceUSD)
        const tcyStakeReward =
          (+interval.pools.find((p) => p.pool === 'tcy_stake_reward')
            ?.earnings /
            10 ** 8) *
          Number.parseFloat(interval.runePriceUSD)

        le.push(
          (+interval.liquidityEarnings / 10 ** 8) *
            Number.parseFloat(interval.runePriceUSD) -
            devFund -
            incomeBurn -
            tcyStakeReward
        )
        be.push(
          (+interval.bondingEarnings / 10 ** 8) *
            Number.parseFloat(interval.runePriceUSD)
        )
        df.push(devFund)
        ib.push(incomeBurn)
        tc.push(tcyStakeReward)

        const volumeUSD = (this.volumeUSDData[index] || 0) / 1e2
        af.push({
          value: Math.max(volumeUSD, 0),
          itemStyle: {
            borderRadius: [8, 8, 0, 0],
          },
        })

        if (d?.intervals.length === index + 1) {
          affiliateEOD = volumeUSD || 0
          if (affiliateEOD === 0) {
            affiliateEOD =
              this.volumeUSDData?.slice(-3).reduce((a, c) => a + +c / 1e2, 0) /
              3
          }

          EODEarning.push({
            value:
              ((+interval.EODBondEarnings + +interval.EODLiquidityEarnings) *
                +interval.runePriceUSD) /
                1e8 +
              (affiliateEOD || 0),
            itemStyle: {
              color: 'transparent',
              borderColor: '#f3ba2f',
              borderWidth: 1,
              borderRadius: [8, 8, 0, 0],
            },
          })

          af[index] = {
            value: 0,
          }
          be[index] = {
            value: be[index],
          }
          le[index] = {
            value: le[index],
          }
          ib[index] = {
            value: ib[index],
          }
          tc[index] = {
            value: tc[index],
          }
        } else {
          EODEarning.push(0)
        }
      })

      return this.basicChartFormat(
        (value) => `$ ${this.normalFormat(value)}`,
        [
          {
            type: 'bar',
            name: 'Bond Earning',
            stack: 'Total',
            showSymbol: false,
            data: be,
            smooth: true,
          },
          {
            type: 'bar',
            name: 'LP Earning',
            showSymbol: false,
            stack: 'Total',
            data: le,
            smooth: true,
          },
          {
            type: 'bar',
            name: 'Dev Fund Earning',
            stack: 'Total',
            showSymbol: false,
            data: df,
            smooth: true,
          },
          {
            type: 'bar',
            name: 'System Burn',
            stack: 'Total',
            showSymbol: false,
            data: ib,
            smooth: true,
          },
          {
            type: 'bar',
            name: 'TCY Stake Reward',
            stack: 'Total',
            showSymbol: false,
            data: tc,
            smooth: true,
          },
          this.volumeUSDData && {
            type: 'bar',
            name: 'Affiliate Fee',
            showSymbol: false,
            stack: 'Total',
            data: af,
            smooth: true,
          },
          {
            type: 'bar',
            name: 'EOD Earning',
            color: '#f3ba2f',
            stack: 'Total',
            showSymbol: false,
            data: EODEarning,
            smooth: true,
          },
        ],
        xAxis,
        {
          legend: {
            type: 'scroll',
            x: 'right',
            y: 'top',
            icon: 'circle',
            textStyle: {
              color: 'var(--font-color)',
            },
            data: [
              'Bond Earning',
              'LP Earning',
              'Dev Fund Earning',
              'Affiliate Fee',
              'Burn',
              'TCY Stake Reward',
            ],
          },
        },
        (param) => {
          return `
        <div class="tooltip-header">
          <div class="data-color" style="background-color: ${
            param[0].color
          }"></div>
          ${param[0].name}
        </div>
        <div class="tooltip-body">
          ${param
            .filter(
              (p) =>
                p.seriesName !== 'EOD Earning' &&
                p.seriesName !== 'Affiliate Fee' &&
                +p.value > 0
            )
            .map(
              (p) => `<span>
              <span>${p.seriesName}</span>
              <b>$${p.value ? this.$options.filters.number(p.value, '0,0a') : '-'}</b>
            </span>`
            )
            .join('')}
          <span style="border-top: 1px solid var(--border-color); margin: 2px 0;"></span>
          <span>
            <span>Gross System Income</span>
            <b>$${this.$options.filters.number(
              param
                .filter(
                  (p) =>
                    p.seriesName !== 'EOD Earning' &&
                    p.seriesName !== 'Affiliate Fee'
                )
                .reduce((a, c) => a + (c.value ? c.value : 0), 0),
              '0,0a'
            )}</b>
          </span>
           ${
             EODEarning[param[0].dataIndex] !== 0
               ? `
                  <span><span>Gross System Income (EOD)</span><b>$${this.$options.filters.number(
                    param
                      .filter(
                        (p) =>
                          p.seriesName !== 'EOD Earning' &&
                          p.seriesName !== 'Affiliate Fee'
                      )
                      .reduce((a, c) => a + (c.value ? c.value : 0), 0) +
                      EODEarning[param[0].dataIndex].value -
                      affiliateEOD,
                    '0,0a'
                  )}</b></span>`
               : ''
           }
          <span style="border-top: 1px solid var(--border-color); margin: 2px 0;"></span>
          ${
            param.find((p) => p.seriesName === 'Affiliate Fee')
              ? `<span>
            <span>Affiliate Fee</span>
            <b>${
              param.find((p) => p.seriesName === 'Affiliate Fee').value
                ? '$' +
                  this.$options.filters.number(
                    param.find((p) => p.seriesName === 'Affiliate Fee').value,
                    '0,0a'
                  )
                : affiliateEOD != 0
                  ? `$${this.$options.filters.number(
                      affiliateEOD,
                      '0,0a'
                    )} (EOD)`
                  : '-'
            }</b>
          </span>`
              : ``
          }
        </div>
      `
        }
      )
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

        let filteredNames = {}

        // Map out the same affiliates
        filteredNames = interval.thornames.reduce((acc, thorname) => {
          const key = ['t', 'tl', 'T'].includes(thorname.thorname)
            ? 't'
            : ['ti', 'te', 'tr', 'td', 'tb'].includes(thorname.thorname)
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

        const topNames = 3
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

      const getInterfaceIcon = (detail) => {
        if (!detail.icons) {
          return ''
        }

        console.log(this.theme)
        return this.theme === 'light' ? detail.icons.url : detail.icons.urlDark
      }

      return this.basicChartFormat(
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
    },
    getNextChurn() {
      if (this.isChurnHalted()) {
        return 'Churn Halted'
      }

      if (!this.chainsHeight || this.network?.nextChurnHeight === undefined) {
        return '-'
      }

      if (+this.network?.nextChurnHeight - +this.chainsHeight.THOR > 500) {
        return blockTime(
          this.network?.nextChurnHeight - this.chainsHeight?.THOR,
          true
        )
      }

      return `${this.network?.nextChurnHeight - this.chainsHeight?.THOR} Blocks`
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
              <div class="data-color" style="background-color: ${
                param.color
              }"></div>
              ${param.name}
            </div>
            <div class="tooltip-body">
              <span>
                <span>Depth</span>
                <b>$${this.$options.filters.number(param.value, '0,0a')}</b>
              </span>
              <span>
                <span>Volume</span>
                <b>$${this.$options.filters.number(
                  poolData[param.dataIndex].vol,
                  '0,0a'
                )}</b>
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
.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-size: $font-size-sm;
  font-weight: 600;
  margin-bottom: $space-0;

  h2 {
    margin: $space-0;
  }
}

.block-items {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  padding: $space-8 $space-0;
  border-bottom: 1px solid var(--border-color);
  &:last-child {
    border-bottom: none;
  }
  .block-info-overview {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;

    .height {
      color: var(--primary-color);
      text-decoration: none;
    }
  }
  .block-burned-item {
    padding: $space-4 $space-5;
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 0.3rem;
  }
  .amount-burn {
    font-size: $font-size-xs;
    color: var(--sec-font-color);
    font-weight: 500;
  }

  .burn-item {
    display: flex;
    gap: 0.2rem;
    align-items: center;
  }
  .middle-section-overview {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
}
.block-enter-active {
  transition: all 1s;
  .block-info-overview.height {
    color: #ffa86b;
  }
}

.burn-icon {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: $radius-full;
  fill: #ffa86b;
}

.rune-icon {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: $radius-full;
  fill: var(--sec-font-color);
}

.block-enter {
  opacity: 0;
  transform: translateY(-30px);
}
.more-link {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: $font-size-sm;

  svg {
    fill: currentColor;
    height: 1rem;
    width: 1rem;
  }
}

.row-item-transactions {
  justify-content: space-between;
  display: flex;
  align-items: flex-start;
  flex-direction: column;

  @include md {
    flex-direction: row;
    align-items: center;
  }

  .txs {
    display: flex;
    flex-direction: column;
    text-overflow: ellipsis;
    overflow: hidden;

    > span {
      overflow: hidden;
      text-overflow: ellipsis;

      white-space: nowrap;
      word-break: keep-all;
      font-size: $font-size-sm;
      color: var(--sec-font-color);

      .value {
        color: var(--primary-color);
      }
    }

    a {
      cursor: pointer;
    }
  }
}

.transactions {
  display: flex;
  flex-direction: column;
}
.container {
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
  padding: $space-0 $space-10;

  .stat-item {
    display: flex;
    align-items: center;

    .header {
      color: var(--font-color);
      font-size: $font-size-sm;
    }

    .value {
      .extra {
        color: var(--font-color);
        font-size: $font-size-xs;
      }
    }

    .stat-image {
      margin-right: $space-12;
      width: 2rem;
      height: 2rem;
      fill: var(--sec-font-color);
    }

    .item-detail {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      .value {
        font-size: $font-size-desktop;
        font-weight: bold;
        color: var(--sec-font-color);
        @include lg {
          font-size: $font-size-md;
        }
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
    margin: $space-12 $space-0;
    opacity: 0.65;
    overflow: visible;
    height: 0;
    border: 0;
    border-top: 1px solid var(--border-color);
  }

  .rune-symbol {
    color: var(--font-color);
    margin: $space-0 $space-10;
    font-size: font-size-xxl;
    line-height: 28px;
    width: 1.6rem;
  }

  .stat-group {
    border: 1px solid var(--border-color);
    min-width: 280px;
    background-color: var(--bg-color);
    border-radius: $radius-lg;
    padding: $space-14;
    flex: 1;
  }
}

.stat-group hr:last-child {
  display: none;
}

@include md {
  .network-stats {
    padding: $space-0;
    justify-content: space-between;

    .stat-group {
      position: relative;
      padding: $space-16;
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
    margin: $space-0;
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
  padding-right: $space-24 !important;
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
    margin-top: $space-24;

    @include lg {
      margin-top: $space-0;
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
          padding-bottom: $space-8;
          font-size: $font-size-sm;
        }
      }

      th {
        font-weight: 700;
        text-align: inherit;
      }

      tbody td {
        font-weight: 700;
        padding: $space-8 $space-0;
        color: var(--sec-font-color);
        font-size: $font-size-sm;
      }

      .table-footer {
        border-top: 1px solid var(--border-color);
      }
    }
  }
  .view-all-link {
    display: flex;
    justify-content: center;
    margin-top: $space-16;
    width: 100%;
    text-align: center;
    text-decoration: none;
  }

  .view-all-button {
    background-color: var(--bg-color);
    border-radius: $radius-lg;
    border: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $space-10 $space-8;
    color: var(--font-color);
    cursor: pointer;
    width: 80%;
    font-size: $font-size-sm;
    font-weight: 500;

    .arrow-icon {
      fill: var(--sec-font-color);
      width: 1.2rem;
      height: 1.2rem;
      margin-left: $space-5;
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

.swaps-nav {
  background-color: var(--bg-color);
  border-radius: $radius-lg;
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-10 $space-8;
  color: var(--font-color);
  cursor: pointer;
  font-size: $font-size-sm;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    color: var(--primary-color);
    background-color: var(--active-bg-color);
    .arrow-icon {
      fill: var(--primary-color);
    }
  }
}
.open-button {
  display: flex;
  justify-content: flex-end;
}
.button-charts {
  background-color: var(--bg-color);
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 10px 8px;
  color: var(--font-color);
  cursor: pointer;
  font-size: 14px;
  text-decoration: none;
  font-weight: 500;
  position: absolute;
  z-index: 10;

  &:hover {
    color: var(--primary-color);
    background-color: var(--active-bg-color);
    .arrow-icon {
      fill: var(--primary-color);
    }
  }
}
</style>
