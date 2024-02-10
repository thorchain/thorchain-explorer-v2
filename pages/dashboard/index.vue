<template>
  <Page>
    <div class="chart-container">
      <div class="network-stats base-container">
        <div class="stat-group">
          <div class="stat-item">
            <img class="stat-image" src="~/assets/images/blockchain.png" alt="blockchain">
            <div class="item-detail">
              <div class="header">
                Block Height
              </div>
              <skeleton-item :loading="!thorHeight" class="value">
                {{ thorHeight | number("0,0") }}
              </skeleton-item>
            </div>
          </div>
          <hr>
          <div class="stat-item">
            <!-- <globe class="stat-image" /> -->
            <Globe class="stat-image" />
            <div class="item-detail">
              <div class="header">
                RUNE Supply
              </div>
              <skeleton-item :loading="!runeSupply" class="value">
                {{ runeSupply | number("0,0") }}
                <span style="font-size: 0.75rem">RUNE</span>
                <span v-if="stats" class="extra">(${{
                  (runeSupply * stats.runePriceUSD) | number("0.00 a")
                }})</span>
              </skeleton-item>
            </div>
          </div>
          <hr>
        </div>
        <div class="stat-group">
          <div class="stat-item">
            <img class="stat-image" src="~/assets/images/coin.png" alt="rune-coin">
            <div class="item-detail">
              <div class="header">
                RUNE Price
              </div>
              <skeleton-item :loading="!(stats && stats.runePriceUSD)" class="value">
                {{ stats.runePriceUSD | currency }}
              </skeleton-item>
            </div>
          </div>
          <hr>
          <div class="stat-item">
            <circulate class="stat-image" />
            <div class="item-detail">
              <div class="header">
                Total Historical Volume (On Chain)
              </div>
              <skeleton-item :loading="!runeVolume" class="value">
                {{ runeVolume | number("0,0") }}
                <span style="font-size: 0.75rem">RUNE</span>
                <span v-if="stats" class="extra">(${{
                  (runeVolume * stats.runePriceUSD) | number("0.00 a")
                }})</span>
              </skeleton-item>
            </div>
          </div>
          <hr>
        </div>
        <div class="stat-group">
          <div class="stat-item">
            <img
              class="stat-image"
              src="~/assets/images/book.png"
              style="width: 2rem; height: auto; padding: 0.3rem"
              alt="rune-coin"
            >
            <div class="item-detail">
              <div class="header">
                Total Addresses
              </div>
              <skeleton-item :loading="!totalAddresses" class="value">
                {{ totalAddresses | number("0,0") }}
              </skeleton-item>
            </div>
          </div>
          <hr>
          <div class="stat-item">
            <Chart class="stat-image" />
            <div class="item-detail">
              <div class="header">
                Total Swap, Add, and Withdraw txs
              </div>
              <skeleton-item :loading="!totalTxs" class="value">
                {{ totalTxs | number("0,0") }}
              </skeleton-item>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="break" />
    <div class="chart-inner-container">
      <Card :navs="[{title: 'Swap History Volume', value: 'swap-vol'}, {title: 'Swap History Count', value: 'swap-count'}]" :act-nav.sync="swapMode">
        <VChart v-if="swapMode == 'swap-vol'" :option="swapHistory" :loading="!swapHistory" :autoresize="true" :loading-options="showLoading" />
        <VChart v-if="swapMode == 'swap-count'" :option="swapHistoryCount" :loading="!swapHistoryCount" :autoresize="true" :loading-options="showLoading" />
      </Card>
      <Card title="Pool Depth & Volume" class="pool-depth-container" :is-loading="!poolsOption">
        <div class="pool-depth-chart">
          <VChart :option="poolsOption" :autoresize="true" :loading-options="showLoading" style="width: 275px;height:250px;min-height: initial;" />
        </div>
        <div v-if="poolsData" class="pool-depth-extra">
          <table>
            <thead>
              <tr>
                <th>Pool Name</th>
                <th style="text-align: center;">
                  Volume
                </th>
                <th>Depth</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in poolsData">
                <td>
                  <div class="pool-name-container">
                    <div class="data-color" :style="{backgroundColor: p.color}" />
                    {{ p.name }}
                  </div>
                </td>
                <td style="text-align: center;">
                  ${{ p.vol | number('0,0 a') }}
                </td>
                <td style="text-align: center;">
                  ${{ p.value | number('0,0 a') }}
                </td>
              </tr>
              <tr class="table-footer">
                <td colspan="2">
                  Total value locked in pools:
                </td>
                <td style="text-align: center;">
                  ${{ totalValuePooled | number('0,0 a') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
    <div class="chart-inner-container">
      <Card title="Earnings Volume">
        <VChart :option="earningsHistory" :loading="!earningsHistory" :autoresize="true" :loading-options="showLoading" />
      </Card>
      <Card title="Chains Status" :is-loading="!inboundInfo">
        <template #header>
          <dot-live />
        </template>
        <vue-good-table
          :columns="inboundCols"
          :rows="inboundInfo"
          style-class="vgt-table net-table"
        >
          <template slot="table-column" slot-scope="props">
            <div v-if="props.column.field == 'haltHeight'" v-tooltip="'Scanning'">
              <ScanIcon class="table-icon" style="color: var(--sec-font-color)" />
            </div>
            <div v-else-if="props.column.field == 'haltTradingHeight'" v-tooltip="'Trading'">
              <SwapIcon class="table-icon" style="color: var(--sec-font-color)" />
            </div>
            <div v-else-if="props.column.field == 'haltLPHeight'" v-tooltip="'LP'">
              <FinanceIcon class="table-icon" style="color: var(--sec-font-color)" />
            </div>
            <div v-else-if="props.column.field == 'haltSigningHeight'" v-tooltip="'Signing'">
              <SignIcon class="table-icon" style="color: var(--sec-font-color)" />
            </div>
            <span v-else>
              {{ props.column.label }}
            </span>
          </template>
          <template slot="table-row" slot-scope="props">
            <div v-if="props.column.field == 'chain'" class="chain-col">
              <asset-icon :asset="baseChainAsset(props.row.chain)" />
              <span>
                {{ props.formattedRow[props.column.field] }}
              </span>
            </div>
            <span v-else>
              <template v-if="props.row[props.column.field] > 1">
                <danger-icon v-tooltip="`Scheduled halt: ${props.row[props.column.field]}`" class="table-icon" style="fill: #EF5350;" />
              </template>
              <template v-if="props.row[props.column.field] == 1">
                <danger-icon v-tooltip="`Mimir halt`" class="table-icon" style="fill: #EF5350;" />
              </template>
              <span v-else class="mono" style="color: #81C784;">OK</span>
            </span>
          </template>
        </vue-good-table>
      </Card>
    </div>
    <div class="break" />
    <div class="cards-container">
      <outbounds />
      <streamings />
    </div>
    <div class="cards-container">
      <div class="card">
        <div class="card-header">
          <div class="card-header-title">
            <h2 style="color: var(--sec-font-color);">
              Latest Blocks
            </h2>
          </div>
        </div>
        <div class="card-body">
          <template v-if="blocks">
            <template v-for="(b, i) in blocks">
              <div :key="i" class="row-item">
                <div class="meta">
                  <span class="header">
                    {{ b.height | number("0,0") }}
                  </span>
                  <span class="timestamp">
                    {{ b.date }}
                  </span>
                </div>
                <div class="txs" style="width: 40%">
                  <span>Tx Size: <span class="value">{{ b.txs }}</span></span>
                  <span>Block Size:
                    <span class="value">{{
                      b.size | number("0,0")
                    }}</span></span>
                </div>
              </div>
              <hr :key="i + 'hr'" class="hr-space">
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
            <h2 style="color: var(--sec-font-color);">
              Latest Transactions
            </h2>
          </div>
        </div>
        <div class="card-body">
          <template v-if="txs">
            <template v-for="(t, i) in txs">
              <div :key="i" class="row-item">
                <div class="meta">
                  <span class="header">
                    {{ t.height | number("0,0") }}
                  </span>
                  <span class="timestamp">
                    {{ formatMoment(t.date) }}
                  </span>
                </div>
                <div class="txs">
                  <span>TxID
                    <a class="value" @click="gotoTx(t.in && t.in[0].txID)">{{
                      showTx(t.in && t.in[0].txID)
                    }}</a></span>
                  <span>From
                    <a class="value" @click="gotoAddr(t.in[0].address)">{{
                      t.in && t.in[0].address
                    }}</a></span>
                </div>
              </div>
              <hr :key="i + 'hr'" class="hr-space">
            </template>
          </template>
          <div v-else class="loading">
            <BounceLoader color="var(--font-color)" size="3rem" />
          </div>
        </div>
      </div>
    </div>
    <div class="footer-stats">
      <stat-table header="Stats" :table-settings="statsSettings" />
      <stat-table header="Network" :table-settings="networkSettings" />
    </div>
  </Page>
</template>

<script>
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
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import Chart from '~/assets/images/chart.svg?inline'
import Circulate from '~/assets/images/stats.svg?inline'
import { blockTime } from '~/utils'

import Globe from '~/assets/images/world.svg?inline'
import DangerIcon from '@/assets/images/danger.svg?inline'
import SwapIcon from '~/assets/images/exchange-selected.svg?inline'
import FinanceIcon from '~/assets/images/finance.svg?inline'
import ScanIcon from '~/assets/images/scan.svg?inline'
import SignIcon from '~/assets/images/sign.svg?inline'

use([
  SVGRenderer,
  GridComponent,
  BarChart,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent
])

export default {
  name: 'OverviewPage',
  components: {
    VChart,
    Chart,
    Globe,
    Circulate,
    BounceLoader,
    DangerIcon,
    SwapIcon,
    FinanceIcon,
    SignIcon,
    ScanIcon
  },
  data () {
    return {
      nodes: [],
      network: [],
      rune: '',
      lastblock: undefined,
      stats: [],
      volumeHistory: undefined,
      swapHistory: undefined,
      swapHistoryCount: undefined,
      earningsHistory: undefined,
      runeSupply: undefined,
      lastHeight: undefined,
      blocks: undefined,
      txs: undefined,
      totalTxs: undefined,
      totalAddresses: undefined,
      thorHeight: undefined,
      poolsOption: undefined,
      poolsData: undefined,
      totalValuePooled: undefined,
      swapMode: 'swap-vol',
      inboundInfo: undefined,
      inboundCols: [
        {
          label: 'Chain',
          field: 'chain',
          type: 'text'
        },
        {
          label: 'Scanning',
          field: 'haltHeight',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono center',
          thClass: 'th-center'
        },
        {
          label: 'Trading',
          field: 'haltTradingHeight',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono center',
          thClass: 'th-center'
        },
        {
          label: 'LP',
          field: 'haltLPHeight',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono center',
          thClass: 'th-center'
        },
        {
          label: 'Signing',
          field: 'haltSigningHeight',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono center',
          thClass: 'th-center'
        }
      ]
    }
  },
  async fetch () {
    const resBlock = await this.$api.getRPCLastBlockHeight()
    this.lastHeight = +resBlock?.data?.block?.header?.height
  },
  computed: {
    runeSymbol () {
      return AssetCurrencySymbol.RUNE
    },
    runeVolume () {
      return (
        (+this.stats?.swapVolume +
          +this.stats?.withdrawVolume +
          +this.stats?.addLiquidityVolume) /
        10 ** 8
      )
    },
    networkSettings () {
      // From Thornode - https://gitlab.com/thorchain/thornode/-/blob/7016020ef3566e1e2855fee0a38e14fbfa069425/x/thorchain/helpers.go#L1008
      // Refactored for readability
      const sbn = this.nodes.filter(n => n.status === 'Active').map(e => +e.total_bond)
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
        [
          {
            name: 'Total Bond (Effective)',
            value: totalEffectiveBond,
            filter: true,
            runeValue: true,
            usdValue: true
          },
          {
            name: 'Hard Cap',
            value: totalHardCap,
            filter: true,
            runeValue: true,
            usdValue: true
          }
        ],
        [
          {
            name: 'Bonding APY',
            value:
              this.network.bondingAPY &&
              this.stringToPercentage(this.network.bondingAPY),
            filter: true
          },
          {
            name: 'Liquidity APY',
            value:
              this.network.bondingAPY &&
              this.stringToPercentage(this.network.liquidityAPY),
            filter: true
          }
        ],
        [
          {
            name: 'Total Standby Bonded',
            value: +this.network.bondMetrics?.totalStandbyBond / 10 ** 8,
            usdValue: true
          },
          {
            name: 'Total Active Bonded',
            value: +this.network.bondMetrics?.totalActiveBond / 10 ** 8,
            usdValue: true
          }
        ],
        [
          {
            name: 'Active Node Count',
            value: this.network.activeNodeCount
          },
          {
            name: 'Standby Node Count',
            value: this.network.standbyNodeCount
          }
        ],
        [
          {
            name: 'Next Churn Height',
            value: this.network.nextChurnHeight,
            extraText: this.nextChurnTime()
          }
        ],
        [
          {
            name: 'Pool Activation Countdown',
            value: this.network.poolActivationCountdown,
            extraText: blockTime(this.network.poolActivationCountdown)
          }
        ],
        [
          {
            name: 'Pool Share Factor',
            value:
              this.network.bondingAPY &&
              this.stringToPercentage(this.network.poolShareFactor),
            filter: true
          }
        ],
        [
          {
            name: 'Total Reserve',
            value: (this.network.totalReserve ?? 0) / 10 ** 8,
            usdValue: true
          }
        ],
        [
          {
            name: 'Total Pooled Rune',
            value: (this.network.totalPooledRune ?? 0) / 10 ** 8,
            usdValue: true
          }
        ]
      ]
    },
    statsSettings () {
      return [
        [
          {
            name: 'RUNE Price USD',
            value: this.$options.filters.currency(this.stats.runePriceUSD),
            filter: true
          },
          {
            name: 'RUNE Depth',
            value: Math.ceil(this.stats.runeDepth / 10 ** 8) ?? 0,
            usdValue: true
          }
        ],
        [
          {
            name: '24h Swap Count',
            value: this.stats.swapCount24h ?? 0
          },
          {
            name: '30d Swap Count',
            value: this.stats.swapCount30d ?? 0
          },
          {
            name: 'Total Swap Count',
            value: this.stats.swapCount ?? 0
          }
        ],
        [
          {
            name: 'Synth Burn Count',
            value: this.stats.synthBurnCount ?? 0
          },
          {
            name: 'Synth Mint Count',
            value: this.stats.synthMintCount ?? 0
          }
        ],
        [
          {
            name: 'Swap To Asset Count',
            value: this.stats.toAssetCount ?? 0
          },
          {
            name: 'Swap To RUNE Count',
            value: this.stats.toRuneCount ?? 0
          }
        ],
        [
          {
            name: 'Swap Volume',
            value: this.stats?.swapVolume / 10 ** 8 ?? 0,
            usdValue: true
          },
          {
            name: 'Switched RUNE',
            value: this.stats.switchedRune / 10 ** 8 ?? 0,
            usdValue: true
          }
        ],
        [
          {
            name: 'Add Liquidity Volume',
            value: this.stats.addLiquidityVolume / 10 ** 8 ?? 0,
            usdValue: true
          },
          {
            name: 'Add Liquidity Count',
            value: this.stats.addLiquidityCount ?? 0
          }
        ],
        [
          {
            name: 'Withdraw Volume',
            value: this.stats.withdrawVolume / 10 ** 8 ?? 0,
            usdValue: true
          },
          {
            name: 'Withdraw Count',
            value: this.stats.withdrawCount ?? 0
          }
        ],
        [
          {
            name: 'Impermanent Loss Protection Paid',
            value: this.stats.impermanentLossProtectionPaid / 10 ** 8 ?? 0,
            usdValue: true
          }
        ]
      ]
    }
  },
  activated () {
    // Call fetch again if last fetch more than 30 sec ago
    if (this.$fetchState.timestamp <= Date.now() - 6000) {
      this.$fetch()
    }
  },
  fetchOnServer: false,
  mounted () {
    this.$api
      .getDashboardData()
      .then(({ data }) => {
        if (!data) {
          throw new Error('Cant read the data')
        }

        this.stats = data?.stats
        this.runeSupply = +data?.runeSupply?.amount?.amount / 10 ** 8
        this.lastblock = data?.lastBlockHeight
        this.thorHeight = data?.lastBlockHeight.find(
          e => e.chain === 'BTC'
        ).thorchain
        this.txs = data?.txs?.actions
        this.totalTxs = +data?.txs?.count
        this.totalAddresses = +data?.addresses?.pagination?.total

        this.$api.getPools().then(({ data }) => {
          this.formatPoolsData(data)
        })
      })
      .catch(async (e) => {
        await this.$api
          .getStats()
          .then(res => (this.stats = res.data))
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
            this.thorHeight = res.data.find(e => e.chain === 'BTC').thorchain
          })
          .catch((error) => {
            console.error(error)
          })

        this.$api
          .getSupplyRune()
          .then(
            res => (this.runeSupply = +res?.data?.amount?.amount / 10 ** 8)
          )
          .catch((error) => {
            console.error(error)
          })

        this.$api
          .getTxs()
          .then((res) => {
            this.txs = res?.data?.actions
            this.totalTxs = +res?.data?.count
          })
          .catch((error) => {
            console.error(error)
          })

        this.$api
          .getAddresses()
          .then(res => (this.totalAddresses = +res?.data?.pagination?.total))
          .catch((error) => {
            console.error(error)
          })
      })

    this.$api
      .getDashboardPlots()
      .then(({ data }) => {
        if (!data) {
          throw new Error('Cant read the data')
        }

        this.volumeHistory = this.formatLPChange(data?.LPChange);
        ({ resVolume: this.swapHistory, resCount: this.swapHistoryCount } = this.formatSwap(data?.swaps))
        this.earningsHistory = this.formatEarnings(data?.earning)
      })
      .catch((error) => {
        console.error(error)

        this.$api
          .volumeHistory()
          .then(res => (this.volumeHistory = this.formatLPChange(res.data)))
          .catch((error) => {
            console.error(error)
          })

        this.$api
          .swapHistory()
          .then(res => ({ resVolume: this.swapHistory, resCount: this.swapHistoryCount } = this.formatSwap(res.data)))
          .catch((error) => {
            console.error(error)
          })

        this.$api
          .tvlHistory()
          .then(res => (this.tvlHistory = this.formatTvl(res.data)))
          .catch((error) => {
            console.error(error)
          })

        this.$api
          .earningsHistory()
          .then(res => (this.earningsHistory = this.formatEarnings(res.data)))
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
            res =>
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

    // Get inbound info
    this.getNetworkStatus()

    setInterval(() => {
      this.getNetworkStatus()
    }, 10000)
  },
  methods: {
    stringToPercentage (val) {
      return (Number.parseFloat(val ?? 0) * 100).toFixed(2).toString() + ' %'
    },
    nextChurnTime () {
      if (this.lastblock && this.network) {
        return blockTime(
          this.network.nextChurnHeight - this.lastblock[0].thorchain
        )
      }
    },
    async getNetworkStatus () {
      const ret = (await this.$api.getInboundAddresses()).data
      const mimirInfo = (await this.$api.getMimir()).data

      this.inboundInfo = ret.map(chain => ({
        ...chain,
        haltHeight: Math.max(
          ...Object.keys(mimirInfo)
            .filter(
              key =>
                new RegExp(`.*HALT.*${chain.chain}CHAIN`).test(key) &&
                mimirInfo[key] !== 0
            )
            .map(key => mimirInfo[key])
        ),
        haltTradingHeight: Math.max(
          ...Object.keys(mimirInfo)
            .filter(
              key =>
                new RegExp(`HALT${chain.chain}TRADING`).test(key) &&
                mimirInfo[key] !== 0
            )
            .map(key => mimirInfo[key])
        ),
        haltSigningHeight: Math.max(
          ...Object.keys(mimirInfo)
            .filter(
              key =>
                new RegExp(`HALTSIGNING${chain.chain}`).test(key) &&
                mimirInfo[key] !== 0
            )
            .map(key => mimirInfo[key])
        ),
        haltLPHeight: Math.max(
          ...Object.keys(mimirInfo)
            .filter(
              key =>
                new RegExp(`PAUSELP${chain.chain}`).test(key) &&
                mimirInfo[key] !== 0
            )
            .map(key => mimirInfo[key])
        )
      }))
    },
    formatLPChange (d) {
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
        value => `$ ${this.normalFormat(value)}`,
        [
          {
            type: 'bar',
            name: 'Total Change',
            showSymbol: false,
            data: lv,
            smooth: true
          },
          {
            type: 'bar',
            name: 'Add Volume',
            showSymbol: false,
            data: alv,
            smooth: true
          },
          {
            type: 'bar',
            name: 'Withdraw Volume',
            showSymbol: false,
            data: wv,
            smooth: true
          }
        ],
        xAxis
      )
    },
    formatSwap (d) {
      const xAxis = []

      const swapVolume = {
        synthMint: [],
        synthRedeem: [],
        toRune: [],
        toAsset: [],
        total: []
      }

      const swapCount = {
        synthMint: [],
        synthRedeem: [],
        toRune: [],
        toAsset: [],
        total: []
      }

      d?.intervals.forEach((interval) => {
        xAxis.push(
          moment(
            Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format('MM/DD')
        )
        swapVolume?.total.push(
          (+interval.totalVolume / 10 ** 8) *
          Number.parseFloat(interval.runePriceUSD)
        )
        swapVolume?.toAsset.push((+interval.toAssetVolume * +interval.runePriceUSD) / 10 ** 8)
        swapVolume?.toRune.push((+interval.toRuneVolume * +interval.runePriceUSD) / 10 ** 8)
        swapVolume?.synthMint.push((+interval.synthMintVolume * +interval.runePriceUSD) / 10 ** 8)
        swapVolume?.synthRedeem.push((+interval.synthRedeemVolume * +interval.runePriceUSD) / 10 ** 8)

        swapCount.synthRedeem.push((+interval.synthRedeemCount))
        swapCount.toAsset.push((+interval.toAssetCount))
        swapCount.toRune.push((+interval.toRuneCount))
        swapCount.synthMint.push((+interval.synthMintCount))
        swapCount.total.push((+interval.totalCount))
      })

      const resVolume = this.basicChartFormat(
        value => `$ ${this.normalFormat(value)}`,
        [
          {
            type: 'bar',
            name: 'Total Volume',
            showSymbol: false,
            data: swapVolume?.total,
            smooth: true
          },
          {
            type: 'bar',
            name: 'to Asset Volume',
            showSymbol: false,
            data: swapVolume?.toAsset,
            smooth: true
          },
          {
            type: 'bar',
            name: 'to Rune Volume',
            showSymbol: false,
            data: swapVolume?.toRune,
            smooth: true
          },
          {
            type: 'bar',
            name: 'Synth mint Volume',
            showSymbol: false,
            data: swapVolume?.synthMint,
            smooth: true
          },
          {
            type: 'bar',
            name: 'Synth redeem Volume',
            showSymbol: false,
            data: swapVolume?.synthRedeem,
            smooth: true
          }
        ],
        xAxis,
        {
          legend: {
            x: 'center',
            y: 'bottom',
            icon: 'rect',
            textStyle: {
              color: 'var(--font-color)'
            },
            data: ['Total Volume', 'to Asset Volume', 'to Rune Volume', 'Synth mint Volume', 'Synth redeem Volume'],
            selected: {
              'Total Volume': true,
              'to Asset Volume': false,
              'to Rune Volume': false,
              'Synth mint Volume': false,
              'Synth redeem Volume': false
            }
          }
        }
      )

      const resCount = this.basicChartFormat(
        value => `${this.normalFormat(value)}`,
        [
          {
            type: 'bar',
            name: 'Total Count',
            showSymbol: false,
            data: swapCount.total,
            smooth: true
          },
          {
            type: 'bar',
            name: 'to Asset Count',
            showSymbol: false,
            data: swapCount.toAsset,
            smooth: true
          },
          {
            type: 'bar',
            name: 'to Rune Count',
            showSymbol: false,
            data: swapCount.toRune,
            smooth: true
          },
          {
            type: 'bar',
            name: 'Synth mint Count',
            showSymbol: false,
            data: swapCount.synthMint,
            smooth: true
          },
          {
            type: 'bar',
            name: 'Synth redeem Count',
            showSymbol: false,
            data: swapCount.synthRedeem,
            smooth: true
          }
        ],
        xAxis
      )

      return { resVolume, resCount }
    },
    formatTvl (d) {
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
        value => `$ ${this.normalFormat(value)}`,
        [
          {
            type: 'line',
            name: 'Total Value Pooled',
            showSymbol: false,
            data: tvp,
            smooth: true
          }
        ],
        xAxis
      )
    },
    formatEarnings (d) {
      const xAxis = []
      const le = []
      const be = []
      d?.intervals.pop()
      d?.intervals.forEach((interval) => {
        xAxis.push(
          moment(
            Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format('MM/DD')
        )
        le.push(
          (+interval.liquidityEarnings / 10 ** 8) *
          Number.parseFloat(interval.runePriceUSD)
        )
        be.push(
          (+interval.bondingEarnings / 10 ** 8) *
          Number.parseFloat(interval.runePriceUSD)
        )
      })

      return this.basicChartFormat(
        value => `$ ${this.normalFormat(value)}`,
        [
          {
            type: 'line',
            name: 'Liquidity Earning',
            showSymbol: false,
            data: le,
            smooth: true
          },
          {
            type: 'line',
            name: 'Bond Earning',
            showSymbol: false,
            data: be,
            smooth: true
          }
        ],
        xAxis
      )
    },
    formatTendermintBlocks (blocks) {
      const blockJsons = []
      for (const block of blocks) {
        blockJsons.push({
          height: block?.header?.height,
          date: moment(block?.header?.time).fromNow(),
          txs: block?.num_txs,
          size: block?.block_size
        })
      }
      return blockJsons.slice(0, 10)
    },
    showTx (txID) {
      if (txID === '0000000000000000000000000000000000000000000000000000000000000000') {
        return 'Internal Tx'
      }
      return txID
    },
    formatMoment (time) {
      return moment(Number.parseInt(time / 10 ** 6)).fromNow()
    },
    formatPoolsData (d) {
      const poolData = []
      const runePrice = this.stats.runePriceUSD
      let totalValuePooled = 0
      let otherPoolsVolume = 0
      let otherValuePooled = 0
      const defaultColors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc']
      d.sort((a, b) => (+b.runeDepth) - (+a.runeDepth)).forEach((p, i) => {
        const runeInPools = (+p.runeDepth)
        const assetsInRune = (+p.assetDepth) * +p.assetPrice
        totalValuePooled += ((runeInPools + assetsInRune) * runePrice) / 1e8
        if (i < 6) {
          const asset = assetFromString(p.asset)
          poolData.push({
            value: ((runeInPools + assetsInRune) * runePrice) / 1e8,
            name: `${asset.chain}.${asset.ticker}`,
            vol: (+p.volume24h) * runePrice / 1e8,
            color: defaultColors[i]
          })
        } else if (i >= 6) {
          otherPoolsVolume += (+p.volume24h) * runePrice / 1e8
          otherValuePooled += ((runeInPools + assetsInRune) * runePrice) / 1e8

          if (i === d.length - 1) {
            poolData.push({
              value: otherValuePooled,
              name: 'Other pools',
              vol: otherPoolsVolume,
              color: defaultColors[6]
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
          trigger: 'item'
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
              borderRadius: 5
            },
            label: {
              show: false
            },
            data: poolData
          }
        ]
      }

      this.poolsOption = option
      this.poolsData = poolData
      this.totalValuePooled = totalValuePooled
    }
  }
}
</script>

<style lang="scss">
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
      fill: #9f9f9f;
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
}

@include md {
  .network-stats {
    padding: 0;
    display: flex;
    justify-content: space-between;

    .stat-group {
      position: relative;
      padding: 1rem;
      flex: 1;

      &::after {
        position: absolute;
        right: 0;
        top: 0;
        content: "";
        display: block;
        height: calc(100% - 1rem);
        border-left: 0;
        border-right: 1px solid var(--border-color);
        margin: 0.5rem 0;
      }

      &:last-of-type::after {
        display: none;
      }
    }

    .stat-group hr:last-child {
      display: none;
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

  .card-body {
    flex: 1;
    display: flex;
    align-items: center;
    flex-direction: column;
    padding-right: 1.5rem !important;

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
  }
}

.chain-col {
  display: flex;
  gap: 5px;
  align-items: center;
}
</style>
