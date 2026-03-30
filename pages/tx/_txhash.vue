<template>
  <Page>
    <div v-if="swapOverview" class="tx-detail-page">
      <div class="tx-detail-back">
        <nuxt-link to="/txs" class="tx-back-link">
          ← All Transactions
        </nuxt-link>
      </div>

      <div class="tx-detail-meta">
        <span>{{ swapOverview.metaLabel }}</span>
        <span :class="['tx-detail-status', `tx-detail-status--${swapOverview.status.tone}`]">
          {{ swapOverview.status.label }}
        </span>
      </div>

      <h1 class="tx-detail-title">
        {{ swapOverview.title }}
      </h1>

      <div class="tx-detail-grid">
        <div class="tx-detail-main">
          <section class="tx-swap-card card-bg">
            <div class="tx-swap-head">
              <div class="tx-asset-panel">
                <div class="tx-asset-label">Input</div>
                <div class="tx-asset-primary">
                  <AssetIcon
                    v-if="swapOverview.input.asset"
                    :asset="swapOverview.input.asset"
                    :height="'2.25rem'"
                  />
                  <span>{{ swapOverview.input.name }}</span>
                </div>
                <div class="tx-asset-badge">
                  {{ swapOverview.input.badge }}
                </div>
                <div class="tx-asset-values">
                  <span>{{ swapOverview.input.amount }}</span>
                  <strong v-if="swapOverview.input.usd">{{
                    swapOverview.input.usd
                  }}</strong>
                </div>
              </div>

              <div class="tx-swap-arrow">→</div>

              <div class="tx-asset-panel tx-asset-panel--accent">
                <div class="tx-asset-label">Output</div>
                <div class="tx-asset-primary">
                  <AssetIcon
                    v-if="swapOverview.output.asset"
                    :asset="swapOverview.output.asset"
                    :height="'2.25rem'"
                  />
                  <span>{{ swapOverview.output.name }}</span>
                </div>
                <div class="tx-asset-badge">
                  {{ swapOverview.output.badge }}
                </div>
                <div class="tx-asset-values">
                  <span>{{ swapOverview.output.amount }}</span>
                  <strong v-if="swapOverview.output.usd">{{
                    swapOverview.output.usd
                  }}</strong>
                </div>
              </div>
            </div>

            <div v-if="swapOverview.metricRows.length" class="tx-metric-strip">
              <div
                v-for="metric in swapOverview.metricRows"
                :key="metric.label"
                class="tx-metric-item"
              >
                <div class="tx-asset-label">{{ metric.label }}</div>
                <div class="tx-metric-value">{{ metric.value }}</div>
              </div>
            </div>
          </section>

          <section class="tx-info-card card-bg">
            <div class="tx-section-title">Details</div>
            <div class="tx-detail-rows">
              <div
                v-for="row in swapOverview.detailRows"
                :key="row.label"
                class="tx-detail-row"
              >
                <div class="tx-detail-key">{{ row.label }}</div>
                <div class="tx-detail-value">
                  <template v-if="row.type === 'status'">
                    <span :class="['tx-detail-status', `tx-detail-status--${swapOverview.status.tone}`]">
                      {{ row.value }}
                    </span>
                  </template>
                  <template v-else-if="row.type === 'link'">
                    <nuxt-link :to="row.to" class="tx-link">
                      {{ row.value }}
                    </nuxt-link>
                  </template>
                  <template v-else>
                    {{ row.value }}
                  </template>
                </div>
              </div>
            </div>
          </section>

          <section v-if="swapOverview.lifecycleRows.length" class="tx-info-card card-bg">
            <div class="tx-section-title">Lifecycle Events</div>
            <div class="tx-lifecycle-list">
              <div
                v-for="event in swapOverview.lifecycleRows"
                :key="event.title"
                class="tx-lifecycle-item"
              >
                <div class="tx-lifecycle-dot">{{ event.icon }}</div>
                <div class="tx-lifecycle-copy">
                  <div class="tx-lifecycle-title">{{ event.title }}</div>
                  <div class="tx-lifecycle-body">{{ event.body }}</div>
                  <div v-if="event.meta" class="tx-lifecycle-meta">{{ event.meta }}</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="tx-detail-side">
          <section class="tx-info-card card-bg">
            <div class="tx-section-title">Transaction Hash</div>
            <div class="tx-hash-box">
              <div class="tx-asset-label">Full hash</div>
              <div class="tx-hash-full mono">{{ $route.params.txhash }}</div>
            </div>
            <div class="tx-hash-actions">
              <div class="tx-hash-action">
                <Copy :str-copy="$route.params.txhash" :hide-toast="true" />
                <span>Copy</span>
              </div>
              <div class="tx-hash-action">
                <qr-btn :qrcode="$route.params.txhash"></qr-btn>
                <span>View QR</span>
              </div>
            </div>
          </section>

          <section v-if="swapOverview.feeRows.length" class="tx-info-card card-bg">
            <div class="tx-section-title">Fee Breakdown</div>
            <div class="tx-fee-list">
              <div
                v-for="fee in swapOverview.feeRows"
                :key="fee.label"
                class="tx-fee-row"
              >
                <div class="tx-fee-label">{{ fee.label }}</div>
                <div class="tx-fee-value-wrap">
                  <div class="tx-fee-value">{{ fee.value }}</div>
                  <div v-if="fee.subtle" class="tx-fee-subtle">{{ fee.subtle }}</div>
                </div>
              </div>
            </div>
          </section>

          <section class="tx-info-card card-bg">
            <button class="tx-tech-header" type="button" @click="technicalExpanded = !technicalExpanded">
              <span class="tx-section-title">Technical Details</span>
              <span class="tx-tech-arrow">{{ technicalExpanded ? '−' : '+' }}</span>
            </button>
            <div v-if="technicalExpanded" class="tx-tech-list">
              <div
                v-for="row in swapOverview.technicalRows"
                :key="row.label"
                class="tx-tech-row"
              >
                <div class="tx-tech-key">{{ row.label }}</div>
                <div
                  :class="[
                    'tx-tech-value',
                    { 'tx-tech-value--truncate': row.label === 'Memo' },
                  ]"
                >
                  <template v-if="row.type === 'link'">
                    <nuxt-link :to="row.to" class="tx-link">
                      {{ row.value }}
                    </nuxt-link>
                  </template>
                  <template v-else>
                    {{ row.value }}
                  </template>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
    <div v-else class="tx-header">
      <div class="item tx-id">
        <span class="mono">
          {{ $route.params.txhash }}
        </span>
      </div>
      <div class="item">
        <Copy :str-copy="$route.params.txhash" />
      </div>
      <div id="qrcode" class="item">
        <qr-btn :qrcode="$route.params.txhash"></qr-btn>
      </div>
    </div>
    <template v-if="!isError && !isLoading && pools">
      <template v-if="cards && cards.length > 0">
        <tx-card
          v-for="(c, i) in visibleCards"
          :key="i"
          :tx-data="c.details"
        >
          <template
            v-for="(s, j) in c.accordions.filter(
              (c) => c.data.title && !c.data.hide
            )"
            #[s.name]
          >
            <accordion
              :key="i + '.' + j"
              :title="s.data.title"
              :pending="s.data.pending"
              :done="s.data.done"
              :remaining-time="s.data.remainingTime"
              :total-time="s.data.totalTime"
              :asset="s.data.asset"
              :stacks="s.data.stacks"
              :error="s.data.error"
              :show-at-first="true"
              :attributes="s.data.attributes"
              :events="s.data.events"
            />
          </template>
        </tx-card>
        <streaming-swap
          v-if="inboundHash"
          :inbound-hash="inboundHash"
          :quote="quote"
          :height="height"
        />
      </template>
      <tx-loader v-else></tx-loader>
    </template>
    <div v-else-if="isError" class="notify-card card-bg">
      <h3>{{ error.title }}</h3>
      <span>{{ error.message }}</span>
      <DisconnectIcon class="disconnect-icon" />
    </div>
    <div v-else-if="isLoading && !isError">
      <tx-loader />
    </div>
  </Page>
</template>

<script>
import moment from 'moment'
import { orderBy, groupBy, sumBy } from 'lodash'
import { mapGetters } from 'vuex'
import streamingSwap from './components/streamingSwap.vue'
import txCard from './components/txCard.vue'
import { createCard as buildCard } from './state/cardBuilder.js'
import {
  BUILDERS as BUILDERS_MODULE,
  createFailedState as createFailedStateBuilder,
} from './state/builders.js'
import DisconnectIcon from '~/assets/images/disconnect.svg?inline'
import AssetIcon from '~/components/AssetIcon.vue'
import {
  assetFromString,
  assetToTrade,
  assetToSecure,
  tradeToAsset,
  assetToString,
  securedToAsset,
  sumAffiliateFee,
} from '~/utils'
import Accordion from '~/components/Accordion.vue'

export default {
  components: {
    DisconnectIcon,
    AssetIcon,
    streamingSwap,
    txCard,
    Accordion,
  },
  data() {
    return {
      tx: undefined,
      extraSwapDetails: undefined,
      isLoading: true,
      isError: false,
      copyText: 'Copy',
      loadingPercentage: 0,
      progressText: '',
      txFormatted: undefined,
      error: {
        title: "Couldn't find the Transaction",
        message: 'Something bad happened.',
      },
      updateInterval: undefined,
      cards: [],
      inboundHash: undefined,
      thorStatus: undefined,
      thorHeight: 0,
      quote: undefined,
      height: undefined,
      technicalExpanded: false,
    }
  },
  head: {
    title: 'THORChain Network Explorer | TX',
  },
  computed: {
    ...mapGetters({
      chainsHeight: 'getChainsHeight',
      pools: 'getPools',
      runePrice: 'getRunePrice',
    }),
    swapCardIndex() {
      if (!this.cards?.length) return -1
      return this.cards.findIndex((card) =>
        /swap/i.test(card?.details?.title || '')
      )
    },
    visibleCards() {
      if (!this.cards?.length) return []
      if (!this.swapOverview) return this.cards
      return this.cards.filter((_, index) => index !== this.swapCardIndex)
    },
    swapOverview() {
      if (this.swapCardIndex < 0) return null

      const card = this.cards[this.swapCardIndex]
      const details = card?.details
      const actionAccordion = card?.accordions?.find(
        (entry) => entry.name === 'accordion-action'
      )
      const inboundAccordion = card?.accordions?.find((entry) =>
        entry.name.startsWith('accordion-in-')
      )
      const outboundAccordion = card?.accordions?.find((entry) =>
        entry.name.startsWith('accordion-out-')
      )

      const input = details?.overall?.in?.[0]
      const output = details?.overall?.out?.[0]

      if (!input?.asset || !output?.asset) {
        return null
      }

      const actionStacks = actionAccordion?.data?.stacks || []
      const inboundStacks = inboundAccordion?.data?.stacks || []
      const outboundStacks = outboundAccordion?.data?.stacks || []

      const inputAsset = assetFromString(input.asset)
      const outputAsset = assetFromString(output.asset)
      const status = this.getOverviewStatus(details?.overall?.middle)
      const inboundHeight = this.getNumericStackValue(inboundStacks, 'Block Height')
      const outboundHeight = this.getNumericStackValue(outboundStacks, 'Executed at')
      const settledSeconds =
        inboundHeight && outboundHeight && outboundHeight >= inboundHeight
          ? (outboundHeight - inboundHeight) * this.blockSeconds('THOR')
          : null

      const rate = this.getStackDisplayValue(actionStacks, 'Rate')
      const slip = this.getStackDisplayValue(actionStacks, 'Swap Slip')
      const affiliateBasis = this.getStackDisplayValue(actionStacks, 'Affiliate Basis')
      const liquidityFee = this.getStackDisplayValueByPrefix(actionStacks, 'Liquidity Fee')
      const interfaceFee = this.getStackDisplayValue(actionStacks, 'Interface Fee')
      const networkFees = outboundStacks
        .filter((stack) => stack.key === 'Outbound Fee' && stack.is)
        .map((stack) => this.formatStackValue(stack.value))
      const totalFees = [liquidityFee, interfaceFee, ...networkFees].filter(Boolean)

      return {
        title: `Swapped ${this.formatAssetAmount(input.amount, input.asset)} for ${this.formatAssetAmount(output.amount, output.asset)}`,
        metaLabel: `${this.getSwapActionLabel(inputAsset, outputAsset)} · ${this.getSwapProductLabel(outputAsset)}`,
        status,
        input: {
          asset: input.asset,
          name: this.getAssetDisplayName(input.asset),
          badge: this.getNetworkBadge(inputAsset),
          amount: this.formatAssetAmount(input.amount, input.asset),
          usd: this.formatUsdValue(input.amountUSD),
        },
        output: {
          asset: output.asset,
          name: this.getAssetDisplayName(output.asset),
          badge: this.getNetworkBadge(outputAsset),
          amount: this.formatAssetAmount(output.amount, output.asset),
          usd: this.formatUsdValue(output.amountUSD),
        },
        metricRows: [
          rate ? { label: 'Exchange Rate', value: rate } : null,
          slip ? { label: 'Slippage', value: slip } : null,
          settledSeconds
            ? { label: 'Settled In', value: moment.duration(settledSeconds, 'seconds').humanize() }
            : null,
        ].filter(Boolean),
        detailRows: [
          { label: 'Product', value: this.getSwapProductLabel(outputAsset) },
          { label: 'Action', value: this.getSwapActionLabel(inputAsset, outputAsset) },
          { label: 'Status', value: status.label, type: 'status' },
          {
            label: 'Time',
            value: this.getStackDisplayValue(actionStacks, 'Timestamp') || '-',
          },
          {
            label: 'Block',
            value: inboundHeight ? `#${this.normalFormat(inboundHeight)}` : '-',
          },
          {
            label: 'User',
            value: this.formatAddress(this.thorStatus?.tx?.from_address),
            to: this.thorStatus?.tx?.from_address
              ? `/address/${this.thorStatus.tx.from_address}`
              : undefined,
            type: this.thorStatus?.tx?.from_address ? 'link' : undefined,
          },
        ],
        lifecycleRows: this.buildLifecycleRows({
          input,
          output,
          inboundHeight,
          outboundHeight,
          actionStacks,
          inboundStacks,
          outboundStacks,
          inputAsset,
          outputAsset,
        }),
        feeRows: [
          ...networkFees.map((value, index) => ({
            label: index === 0 ? 'Network Fee' : `Network Fee ${index + 1}`,
            value,
          })),
          liquidityFee
            ? {
                label: 'Liquidity Fee',
                value: liquidityFee,
              }
            : null,
          interfaceFee
            ? {
                label: 'Affiliate Fee',
                value: interfaceFee,
              }
            : null,
          totalFees.length
            ? {
                label: 'Fee Entries',
                value: `${totalFees.length}`,
                subtle: totalFees.join(' · '),
              }
            : null,
        ].filter(Boolean),
        technicalRows: [
          this.buildTechRow('From address', this.getStackDisplayValue(inboundStacks, 'From'), 'address'),
          this.buildTechRow('To address', this.getStackDisplayValue(outboundStacks, 'Destination'), 'address'),
          this.buildTechRow('Memo', this.getStackDisplayValue(actionStacks, 'Memo')),
          this.buildTechRow('Inbound stage', this.getStackDisplayValue(inboundStacks, 'Inbound Stage')),
          this.buildTechRow('Exchange rate', rate),
          this.buildTechRow('Affiliate basis', affiliateBasis),
          this.buildTechRow('Limit', this.getStackDisplayValue(actionStacks, 'Limit')),
        ].filter(Boolean),
      }
    },
  },
  async mounted() {
    let txHash = this.$route.params.txhash
    if (txHash.toLowerCase().startsWith('0x')) {
      txHash = txHash.slice(2)
    }

    let isPending = false
    try {
      isPending = await this.fetchTx(txHash)
    } catch (error) {
      if (txHash.length <= 45) {
        const addrTxs = await this.$api.getAddress(txHash, 0)
        if (addrTxs?.data?.actions?.length > 0) {
          this.gotoAddr(this.$route.params.txhash)
        }
      }
      console.error(error)
      this.isError = true
      this.isLoading = false
      return
    }

    // if has no outbound
    if (isPending) {
      const uI = setInterval(async () => {
        try {
          isPending = await this.fetchTx(txHash)
        } catch (error) {
          if (txHash.length <= 45) {
            const addrTxs = await this.$api.getAddress(txHash, 0)
            if (addrTxs?.data?.actions?.length > 0) {
              this.gotoAddr(this.$route.params.txhash)
            }
          }
          console.error(error)
          this.isError = true
          this.isLoading = false
          return
        }
        if (!isPending) {
          clearInterval(uI)
        }
      }, 5000)

      this.updateInterval = uI
    }
  },
  destroyed() {
    this.clearIntervalId(this.updateInterval)
  },
  methods: {
    getOverviewStatus(middle = {}) {
      if (middle.fail) {
        return { label: 'Failed', tone: 'red' }
      }
      if (middle.pending) {
        return { label: 'Pending', tone: 'yellow' }
      }
      return { label: 'Success', tone: 'green' }
    },
    getStackDisplayValue(stacks = [], key) {
      const stack = stacks.find((entry) => entry.key === key && entry.is)
      return this.formatStackValue(stack?.value)
    },
    getStackDisplayValueByPrefix(stacks = [], prefix) {
      const stack = stacks.find(
        (entry) => entry.key?.startsWith(prefix) && entry.is
      )
      return this.formatStackValue(stack?.value)
    },
    getNumericStackValue(stacks = [], key) {
      const stack = stacks.find((entry) => entry.key === key && entry.is)
      const numeric = Number(String(this.formatStackValue(stack?.value)).replace(/[^0-9.-]/g, ''))
      return Number.isFinite(numeric) && numeric > 0 ? numeric : null
    },
    formatStackValue(value) {
      if (Array.isArray(value)) {
        return value.map((item) => item?.text || '').filter(Boolean).join(' · ')
      }
      if (value == null || value === '') return ''
      return `${value}`
    },
    formatAssetAmount(amount, asset) {
      const formattedAmount = `${this.baseAmountFormatOrZero(amount)}`
      const numericAmount = Number(formattedAmount.replace(/,/g, ''))
      const displayAmount = Number.isFinite(numericAmount)
        ? new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(numericAmount)
        : formattedAmount

      return `${displayAmount} ${this.showAsset(asset)}`
    },
    formatUsdValue(value) {
      if (value == null || value === '' || Number.isNaN(+value)) return ''
      return this.formatCurrency(value)
    },
    getAssetDisplayName(asset) {
      if (!asset) return '-'
      const parsed = assetFromString(asset)
      const chainNames = {
        BTC: 'Bitcoin',
        BCH: 'Bitcoin Cash',
        ETH: 'Ethereum',
        LTC: 'Litecoin',
        BNB: 'Binance Coin',
        BSC: 'Binance Smart Chain',
        DOGE: 'Dogecoin',
        SOL: 'Solana',
        AVAX: 'Avalanche',
        GAIA: 'Cosmos',
        BASE: 'Base',
        THOR: parsed.ticker === 'RUNE' ? 'RUNE' : parsed.ticker,
      }
      if (parsed.ticker === parsed.chain || (parsed.chain === 'THOR' && parsed.ticker === 'RUNE')) {
        return chainNames[parsed.chain] || parsed.ticker
      }
      return parsed.ticker
    },
    getNetworkBadge(asset) {
      if (!asset) return '-'
      if (asset.trade) return 'Rujira network'
      if (asset.secure) return 'Secure network'
      if (asset.synth) return 'Synth network'
      if (asset.chain === 'THOR') return 'THORChain network'
      return `${this.getAssetDisplayName(`${asset.chain}.${asset.chain}`)} network`
    },
    getSwapActionLabel(inputAsset, outputAsset) {
      if (inputAsset?.chain && outputAsset?.chain && inputAsset.chain !== outputAsset.chain) {
        return 'Cross-chain Swap'
      }
      return 'Swap'
    },
    getSwapProductLabel(outputAsset) {
      if (outputAsset?.trade || outputAsset?.secure) {
        return 'RUJI Trade'
      }
      return 'THORChain'
    },
    buildTechRow(label, value, kind) {
      if (!value) return null
      if (kind === 'address') {
        return {
          label,
          value: this.formatAddress(value),
          to: `/address/${value}`,
          type: 'link',
        }
      }
      return { label, value }
    },
    buildLifecycleRows({
      input,
      output,
      inboundHeight,
      outboundHeight,
      actionStacks,
      inboundStacks,
      outboundStacks,
      outputAsset,
    }) {
      const rows = []
      const timeText = this.getStackDisplayValue(actionStacks, 'Timestamp')
      rows.push({
        icon: '↓',
        title: `${this.getAssetDisplayName(input.asset)} received by THORChain`,
        body: `${this.formatAssetAmount(input.amount, input.asset)} entered the swap flow from ${this.formatAddress(this.getStackDisplayValue(inboundStacks, 'From'))}.`,
        meta: [timeText, inboundHeight ? `Block #${this.normalFormat(inboundHeight)}` : '']
          .filter(Boolean)
          .join(' · '),
      })
      rows.push({
        icon: '↻',
        title: 'Swap executed',
        body: `${this.getSwapProductLabel(outputAsset)} converted ${this.getAssetDisplayName(input.asset)} to ${this.getAssetDisplayName(output.asset)} at the current exchange rate.`,
        meta: this.getStackDisplayValue(actionStacks, 'Rate'),
      })
      rows.push({
        icon: '↑',
        title: `${this.getAssetDisplayName(output.asset)} delivered`,
        body: `${this.formatAssetAmount(output.amount, output.asset)} was sent to ${this.formatAddress(this.getStackDisplayValue(outboundStacks, 'Destination'))}.`,
        meta: outboundHeight ? `Block #${this.normalFormat(outboundHeight)}` : '',
      })
      return rows
    },
    // TODO: check hash in saver with streaming
    async fetchTx(hash) {
      if (!this.pools) {
        return true
      }

      // Here the hash can be outbound but the inbound should be caught if it's not
      // Get Midgard details
      const md = (
        await this.$api.getActions({ txid: hash }).catch((e) => {
          if (e?.response?.status === 404) {
            this.error.message =
              'Transaction is not found in Midgard. Please make sure the correct transaction hash or account address is inserted.'
          }
        })
      )?.data

      // See if the hash is outbound
      const swapAction = md?.actions?.find((a) => a.type === 'swap')
      if (swapAction) {
        hash = swapAction.in?.[0]?.txID
      }

      // get inbound hash
      this.inboundHash = hash

      // Get THORNode details
      let archival = false
      let thorRes = await this.$api.getThornodeDetailTx(hash).catch((e) => {
        if (e?.response?.status / 200 !== 1) {
          this.error.message =
            'Transaction is not found in Thornode. Please make sure the correct transaction hash or account address is inserted.'
        }
      })

      if (!thorRes) {
        thorRes = await this.$api.getThornodeArchiveTx(hash).catch((e) => {
          if (e?.response?.status / 200 !== 1) {
            this.error.message =
              'Transaction is not found in Thornode. Please make sure the correct transaction hash or account address is inserted.'
          }
        })
        archival = true
      }

      // Assign header and data if available
      let td, tdh
      if (thorRes) {
        td = thorRes.data
        tdh = thorRes.headers
      }

      let ts = (
        await this.$api.getTxStatus(hash).catch((e) => {
          if (e?.response?.status / 200 !== 1) {
            this.error.message =
              "Can't find transaction status. Please make sure the correct transaction hash or account address is inserted."
          }
        })
      )?.data

      if (archival) {
        ts = (
          await this.$api.getTxArchiveStatus(hash).catch((e) => {
            if (e?.response?.status / 200 !== 1) {
              this.error.message =
                "Can't find transaction status. Please make sure the correct transaction hash or account address is inserted."
            }
          })
        )?.data
      }

      this.thorStatus = ts
      this.isLoading = false

      const nt = md?.actions?.find((a) => a.type === 'send')
      const memo = this.parseMemo(td?.tx?.tx?.memo)
      // TODO: add proper error handling
      if (nt && (!memo.type || memo.type === 'unknown')) {
        this.createNativeTx(nt)
        return false
      } else {
        if (tdh) {
          this.thorHeight = parseInt(tdh['x-thorchain-height'] ?? 0)
        }
        this.createTxState(md, td, ts, tdh, this.pools)
        return this.isTxInPending(ts, md)
      }
    },
    isTxInPending(thorStatus, actions) {
      const memo = this.parseMemo(thorStatus?.tx?.memo)

      const userAddresses = new Set([
        thorStatus?.tx?.from_address?.toLowerCase(),
        memo.destAddr?.toLowerCase(),
      ])

      let outTxs = thorStatus?.out_txs?.filter((tx) =>
        userAddresses.has(tx?.to_address?.toLowerCase())
      )

      if (!outTxs) {
        outTxs = thorStatus?.planned_out_txs
          ?.filter((tx) => userAddresses.has(tx.to_address.toLowerCase()))
          .map((tx) => ({
            ...tx,
            coins: [{ amount: tx.coin.amount, asset: tx.coin.asset }],
          }))
      }

      const outAsset = this.parseMemoAsset(
        outTxs?.length > 0 ? outTxs[0]?.coins?.[0]?.asset : memo?.asset,
        this.pools
      )

      if (actions && actions.actions?.length > 0) {
        if (memo.type !== 'swap') {
          const success = actions.actions.some((e, i) => e.status === 'success')
          if (success) {
            return false
          }
        }
        let ta
        if (outAsset) {
          ta = assetFromString(outAsset)
        }
        const isRefund = actions.actions.some((e, i) => e.type === 'refund')
        if (isRefund && (ta?.synth || ta?.trade || ta?.secure)) {
          return false
        }
      }

      const inboundFinalised = thorStatus?.stages?.inbound_finalised?.completed
      let actionFinalised = true
      if (memo.type === 'swap') {
        actionFinalised =
          (outAsset?.chain !== 'THOR' &&
            thorStatus?.stages.swap_finalised?.completed) ||
          !thorStatus?.stages.swap_status?.pending
      }
      const outboundFinalised =
        (thorStatus?.stages.outbound_signed?.completed ||
          outAsset?.chain === 'THOR' ||
          outAsset?.synth ||
          outAsset?.trade ||
          outAsset?.secure) &&
        (thorStatus?.stages?.outbound_delay?.completed ?? true)

      return !inboundFinalised || !actionFinalised || !outboundFinalised
    },
    getBuilderContext() {
      return {
        parseMemo: this.parseMemo.bind(this),
        parseMemoAsset: this.parseMemoAsset.bind(this),
        pools: this.pools,
      }
    },
    getCardContext() {
      return {
        amountToUSD: this.amountToUSD.bind(this),
        formatAddress: this.formatAddress.bind(this),
        showAsset: this.showAsset.bind(this),
        formatCurrency: this.formatCurrency.bind(this),
        formatSmallCurrency: this.formatSmallCurrency.bind(this),
        percentageFormat: this.percentageFormat.bind(this),
        baseAmountFormatOrZero: this.baseAmountFormatOrZero.bind(this),
        normalFormat: this.normalFormat.bind(this),
        getInboundStages: this.getInboundStages.bind(this),
        getOutboundStages: this.getOutboundStages.bind(this),
        chainsHeight: this.chainsHeight,
        blockSeconds: this.blockSeconds.bind(this),
        height: this.height,
        runePrice: this.runePrice,
        pools: this.pools,
        pluralize: (value, singular, options) =>
          this.$options.filters.pluralize(value, singular, options),
      }
    },
    createCard(cardBase, accordions) {
      return buildCard(cardBase, accordions, this.getCardContext())
    },
    async createTxState(midgardAction, thorTx, thorStatus, thorHeader, pools) {
      const memo = this.parseMemo(thorTx?.tx?.tx?.memo)

      if (memo.type === 'outbound') {
        this.gotoTx(memo.hash)
        return
      }

      // Swap: fetch quote when pending, then build state
      if (memo.type === 'swap') {
        const inAsset = this.parseMemoAsset(
          thorStatus?.tx?.coins?.[0]?.asset,
          this.pools
        )
        const inAmount = parseInt(thorStatus?.tx?.coins?.[0]?.amount ?? 0)
        const outAsset = this.parseMemoAsset(memo?.asset, this.pools)
        const affiliateFee = sumAffiliateFee(memo.fee || 0)
        if (thorStatus?.stages.swap_status?.pending && !this.quote) {
          try {
            const { data: quoteData } = await this.$api.getQuote({
              amount: inAmount,
              from_asset: inAsset ? assetToString(inAsset) : '',
              to_asset: outAsset ? assetToString(outAsset) : '',
              destination: memo.destAddr,
              streaming_interval:
                thorStatus?.stages.swap_status?.streaming?.interval ||
                memo.interval,
              ...(affiliateFee && { affiliate: memo.affiliate }),
              ...(affiliateFee && { affiliate_bps: affiliateFee }),
              height: midgardAction?.actions[0]?.height,
            })
            this.quote = quoteData
          } catch (error) {
            console.error(error)
          }
        }
        const { cards, accordions } = await this.createSwapState(
          thorStatus,
          thorTx,
          midgardAction,
          memo,
          thorHeader
        )
        this.$set(this, 'cards', [this.createCard(cards, accordions)])
        this.appendContractCards(midgardAction, thorStatus, thorTx, memo)
        return
      }

      // Add liquidity (possibly with asymmetry second card)
      if (memo.type === 'add') {
        const finalCards = []
        const { cards, accordions } = this.createAddLiquidityState(
          thorStatus,
          midgardAction,
          thorTx,
          memo
        )
        finalCards.push(this.createCard(cards, accordions))
        if (memo.asymmetry) {
          const ts = await this.getOtherActionHash(midgardAction, thorStatus)
          if (ts?.tx) {
            const m = this.parseMemo(ts.tx?.memo)
            const addState = this.createAddLiquidityState(
              ts,
              midgardAction,
              thorTx,
              m
            )
            finalCards.push(
              this.createCard(addState.cards, addState.accordions)
            )
          }
        }
        this.$set(this, 'cards', finalCards)
        this.appendContractCards(midgardAction, thorStatus, thorTx, memo)
        return
      }

      // Registry: memo.type -> builder (method name or function from module)
      const BUILDERS = {
        withdraw: 'createRemoveLiquidityState',
        runePoolWithdraw: 'createRunePoolWithdraw',
        runePoolDeposit: 'createRunePoolDeposit',
        tradeWithdraw: 'createTradeWithdrawState',
        secureWithdraw: 'createTradeWithdrawState',
        tradeDeposit: 'createTradeDepositState',
        secureDeposit: 'createTradeDepositState',
        bond: 'createBondState',
        unbound: 'createUnbondState',
        thorname: BUILDERS_MODULE.thorname,
        loanRepayment: 'createLoanRepayment',
        tcyUnstake: 'createTCYUnstake',
        tcyStake: 'createTCYStake',
      }

      const builder = BUILDERS[memo.type]
      if (builder) {
        const result =
          typeof builder === 'function'
            ? builder(
                thorStatus,
                midgardAction,
                thorTx,
                memo,
                this.getBuilderContext()
              )
            : this[builder](thorStatus, midgardAction, thorTx, memo)
        this.$set(this, 'cards', [
          this.createCard(result.cards, result.accordions),
        ])
        this.appendContractCards(midgardAction, thorStatus, thorTx, memo)
        return
      }

      // Failed deposit (by action type, not memo)
      if (
        midgardAction?.actions?.length > 0 &&
        midgardAction.actions[0]?.type === 'failed'
      ) {
        const { cards, accordions } = createFailedStateBuilder(
          thorStatus,
          midgardAction,
          thorTx,
          memo,
          this.getBuilderContext()
        )
        this.$set(this, 'cards', [this.createCard(cards, accordions)])
        this.appendContractCards(midgardAction, thorStatus, thorTx, memo)
        return
      }

      // Default: one card per action (createAbstractState). Skip contract
      // actions here; appendContractCards adds proper "Contract Event" cards.
      // Refund is no longer skipped so standalone refunds (e.g. empty memo) get a card.
      const finalCards = []
      for (let i = 0; i < midgardAction?.actions?.length; i++) {
        const action = midgardAction.actions[i]
        if (action?.type === 'contract') continue
        const { cards, accordions } = this.createAbstractState(
          thorStatus,
          action,
          thorTx,
          memo
        )
        finalCards.push(this.createCard(cards, accordions))
      }
      this.$set(this, 'cards', finalCards)
      this.appendContractCards(midgardAction, thorStatus, thorTx, memo)
    },
    appendContractCards(midgardAction, thorStatus, thorTx, memo) {
      if (!midgardAction?.actions?.map((a) => a.type).includes('contract')) {
        return
      }
      const contractCards = []
      for (let i = 0; i < midgardAction?.actions?.length; i++) {
        if (midgardAction.actions[i].type !== 'contract') continue
        const { cards, accordions } = this.createContractState(
          thorStatus,
          midgardAction.actions[i],
          thorTx,
          memo
        )
        contractCards.push(this.createCard(cards, accordions))
      }
      this.$set(this, 'cards', [...contractCards, ...this.cards])
    },
    createLoanRepayment(thorStatus, actions, thorTx) {
      const action = actions.actions[0]

      const ins = action?.in.map((a) => ({
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
        txid: a?.txID,
        from: a?.address,
        done: true,
      }))

      let outs = []
      outs = action?.out.map((a) => ({
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
        txid: a?.txID,
        to: a?.address,
        height: a?.height,
        done: true,
      }))

      if (outs?.length === 0 && thorStatus.planned_out_txs?.length > 0) {
        thorStatus.planned_out_txs.map((t) => ({
          asset: this.parseMemoAsset(t.coin.asset),
          amount: t.coin.amount,
          to: t.to_address,
          done: false,
          pending: true,
        }))
      }

      return {
        cards: {
          title: 'Loan Repay',
          in: ins,
          middle: {
            pending: false,
          },
          out: outs,
        },
        accordions: {
          in: ins,
          action: {
            type: 'Repay',
            timeStamp: moment.unix(action?.date / 1e9) || null,
            height: action?.height,
            done: true,
          },
          out: outs,
        },
      }
    },
    createContractState(thorStatus, action) {
      const ins = action?.in.map((a) => ({
        type: 'Caller',
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
        txid: a?.txID,
        from: a?.address,
        height: action?.height,
        timestamp: moment.unix(action?.date / 1e9),
        done: true,
      }))

      const code = action.metadata?.contract?.code ?? 0
      const logs = action.metadata?.contract?.logs
      const memo = action.metadata?.contract?.memo
      const hasError = code > 0

      return {
        cards: {
          title: 'Contract Event',
          in: [
            {
              icon: require('@/assets/images/wallet.svg?inline'),
              address: action?.in[0]?.address,
            },
          ],
          middle: {
            pending: false,
            fail: hasError,
            success: !hasError,
            empty: true,
          },
          out: [
            {
              icon: require('@/assets/images/contract.svg?inline'),
              address: action?.out[0]?.address,
            },
          ],
        },
        accordions: {
          in: ins,
          action: {
            type: 'Contract Call',
            attributes: {
              attributes: action.metadata?.contract?.attributes,
              funds: action.metadata?.contract?.funds,
              msg: action.metadata?.contract?.msg,
            },
            memo,
            logs,
            code,
            error: hasError,
            reason: hasError ? logs : undefined,
            done: true,
          },
          events: action.metadata?.contract?.contractEvents,
          out: [],
        },
      }
    },
    createBondState(thorStatus, action, thorTx) {
      action = action.actions[0]
      const timeStamp = moment.unix(action?.date / 1e9)

      const ins = action?.in.map((a) => ({
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
        gas: thorStatus?.tx?.gas ? thorStatus?.tx?.gas?.[0]?.amount : null,
        gasAsset: thorStatus?.tx?.gas
          ? this.parseMemoAsset(thorStatus?.tx?.gas?.[0]?.asset, this.pools)
          : null,
        txid: a?.txID,
        from: a?.address,
        done: true,
      }))

      const outs = action?.out.map((a) => ({
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
        txid: a?.txID,
        to: a?.address,
        done: true,
      }))

      const isWhitelist = action.metadata?.bond?.provider

      return {
        cards: {
          title: 'Bond' + (isWhitelist ? ' Whitelist' : ''),
          in: ins,
          middle: {
            pending: false,
          },
          out: [
            {
              icon: require('@/assets/images/node.svg?inline'),
              address: action.metadata?.bond?.nodeAddress,
              class: 'pad-icon',
            },
          ],
        },
        accordions: {
          in: ins,
          action: {
            type: 'Bond',
            memo: action.metadata?.bond?.memo,
            nodeAddress: action.metadata?.bond?.nodeAddress,
            provider: action.metadata?.bond?.provider,
            timeStamp,
            height: action?.height,
            done: true,
          },
          out: outs,
        },
      }
    },
    createUnbondState(thorStatus, action, thorTx) {
      action = action.actions[0]
      const timeStamp = moment.unix(action?.date / 1e9)

      const ins = action?.in.map((a) => ({
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
        gas: thorStatus?.tx?.gas ? thorStatus?.tx?.gas?.[0]?.amount : null,
        gasAsset: thorStatus?.tx?.gas
          ? this.parseMemoAsset(thorStatus?.tx?.gas?.[0]?.asset, this.pools)
          : null,
        txid: a?.txID,
        from: a?.address,
        done: true,
      }))

      const outs = action?.out.map((a) => ({
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
        txid: a?.txID,
        to: a?.address,
        done: true,
      }))

      return {
        cards: {
          title: 'Unbond',
          in: [
            {
              icon: require('@/assets/images/node.svg?inline'),
              address: action.metadata?.bond?.nodeAddress,
              class: 'pad-icon',
            },
          ],
          middle: {
            pending: false,
          },
          out: outs,
        },
        accordions: {
          in: ins,
          action: {
            type: 'Unbond',
            memo: action.metadata?.bond?.memo,
            nodeAddress: action.metadata?.bond?.nodeAddress,
            timeStamp,
            height: action?.height,
            done: true,
          },
          out: outs,
        },
      }
    },
    createTradeDepositState(thorStatus, action, thorTx) {
      action = action.actions[0]
      const timeStamp = moment.unix(action?.date / 1e9)
      const memo = this.parseMemo(thorStatus?.tx?.memo)

      const ast = this.parseMemoAsset(
        thorStatus?.tx?.coins?.[0]?.asset,
        this.pools
      )

      let isSecure = false
      if (memo?.type?.includes('secure')) {
        isSecure = true
      }

      let error = false
      let reason = ''
      if (action.type === 'refund') {
        error = true
        reason = action.metadata?.refund?.reason
      }

      const ins = [
        {
          asset: ast,
          amount: thorStatus?.tx?.coins?.[0]?.amount ?? 0,
          txid: thorStatus?.tx?.id,
          from: thorStatus?.tx?.from_address,
          gas: thorStatus?.tx?.gas ? thorStatus?.tx?.gas?.[0]?.amount : null,
          gasAsset: thorStatus?.tx?.gas
            ? this.parseMemoAsset(thorStatus?.tx?.gas?.[0]?.asset, this.pools)
            : null,
          done: true,
        },
      ]

      const outs = [
        {
          asset: isSecure ? assetToSecure(ast) : assetToTrade(ast),
          amount: thorStatus.out_txs
            ? thorStatus.out_txs[0]?.coins?.[0]?.amount
            : thorStatus?.tx?.coins?.[0]?.amount ?? 0,
          txid: thorStatus.out_txs ? thorStatus.out_txs[0]?.id : null,
          to: memo.address,
          done: true,
        },
      ]

      return {
        cards: {
          title: this.camelCase(memo.type),
          in: ins,
          middle: {
            fail: error,
            pending: false,
          },
          out: error ? [] : outs,
        },
        accordions: {
          in: ins,
          action: {
            type: 'Deposit',
            memo: thorStatus?.tx?.memo,
            height: action?.height,
            timeStamp,
            done: true,
            error,
            reason,
          },
          out: error ? [] : outs,
        },
      }
    },
    createTradeWithdrawState(thorStatus, action, thorTx) {
      action = action.actions[0]
      const timeStamp = moment.unix(action?.date / 1e9)
      const memo = this.parseMemo(thorStatus?.tx?.memo)

      const ast = this.parseMemoAsset(
        thorStatus?.tx?.coins?.[0]?.asset,
        this.pools
      )

      let isSecure = false
      if (memo?.type?.includes('secure')) {
        isSecure = true
      }

      const ins = [
        {
          asset: isSecure ? assetToSecure(ast) : assetToTrade(ast),
          amount: thorStatus?.tx?.coins?.[0]?.amount ?? 0,
          txid: thorStatus?.tx?.id,
          from: thorStatus?.tx?.from_address,
          gas: thorStatus?.tx?.gas ? thorStatus?.tx?.gas?.[0]?.amount : null,
          gasAsset: thorStatus?.tx?.gas
            ? this.parseMemoAsset(thorStatus?.tx?.gas?.[0]?.asset, this.pools)
            : null,
          done: true,
        },
      ]

      const outs = [
        {
          asset: isSecure ? securedToAsset(ast) : tradeToAsset(ast),
          amount: thorStatus.out_txs
            ? thorStatus.out_txs[0]?.coins?.[0]?.amount
            : thorStatus?.tx?.coins?.[0]?.amount ?? 0,
          txid: thorStatus.out_txs ? thorStatus.out_txs[0]?.id : null,
          to: memo.address,
          gas: thorStatus.out_txs
            ? thorStatus.out_txs[0]?.gas?.[0]?.amount
            : null,
          gasAsset: thorStatus.out_txs
            ? this.parseMemoAsset(
                thorStatus.out_txs[0]?.gas?.[0]?.asset,
                this.pools
              )
            : null,
          outboundSigned:
            thorStatus?.stages.outbound_signed?.completed ?? false,
          outboundETA:
            thorStatus?.stages.outbound_signed?.scheduled_outbound_height -
            this.thorHeight,
          done: thorStatus?.stages?.outbound_signed?.completed === true,
        },
      ]

      return {
        cards: {
          title: this.camelCase(memo.type),
          in: ins,
          middle: {
            pending: this.isTxInPending(thorStatus, action),
          },
          out: outs,
        },
        accordions: {
          in: ins,
          action: {
            type: 'Withdraw',
            memo: thorStatus?.tx?.memo,
            height: action?.height,
            timeStamp,
            done: true,
          },
          out: outs,
        },
      }
    },
    createTCYUnstake(thorStatus, actions, thorTx) {
      const TCYUnstake = actions?.actions?.find((a) => a.type === 'tcy_unstake')
      const RefundAction = actions?.actions?.find((a) => a.type === 'refund')

      let memo = TCYUnstake?.metadata?.tcy?.memo
      let reason = ''
      let outs = []
      let ins = []

      let isRefund = false
      if (RefundAction) {
        const m = Object.keys(RefundAction.metadata)[0]
        memo = RefundAction.metadata[m]?.memo ?? undefined
        reason =
          RefundAction.metadata[m]?.reason ??
          RefundAction.metadata[m]?.code ??
          undefined
        isRefund = true
      }

      let action = TCYUnstake
      if (isRefund) {
        action = RefundAction
      }

      if (isRefund === false) {
        outs = [
          {
            asset: TCYUnstake.out?.[0]?.coins?.[0]?.asset,
            amount: TCYUnstake.out?.[0]?.coins?.[0]?.amount,
            txid: TCYUnstake.out[0].txID,
            to: TCYUnstake.out[0].address,
            done: true,
          },
        ]

        ins = [
          {
            from: TCYUnstake.out[0].address,
            txid: TCYUnstake.out[0].txID,
            done: true,
          },
        ]
      }

      return {
        cards: {
          title: 'Unstake ' + (isRefund ? '(Refund)' : ''),
          in: [
            {
              icon: require('@/assets/images/vault.svg?inline'),
              text: 'Stake Module',
              class: 'pad-icon',
            },
          ],
          middle: {
            fail: isRefund,
            pending: false,
          },
          out: outs,
        },
        accordions: {
          in: ins,
          action: {
            type: 'Unstake',
            timeStamp: moment.unix(action?.date / 1e9) || null,
            height: action?.height,
            memo,
            reason,
            done: true,
          },
          out: outs,
        },
      }
    },
    createTCYStake(thorStatus, actions, thorTx) {
      const TCYStake = actions?.actions?.find((a) => a.type === 'tcy_stake')
      const RefundAction = actions?.actions?.find((a) => a.type === 'refund')

      let memo = TCYStake?.metadata?.tcy?.memo
      let reason = ''
      let outs = []
      let ins = []

      let isRefund = false
      if (RefundAction) {
        const m = Object.keys(RefundAction.metadata)[0]
        memo = RefundAction.metadata[m]?.memo ?? undefined
        reason =
          RefundAction.metadata[m]?.reason ??
          RefundAction.metadata[m]?.code ??
          undefined
        isRefund = true
      }

      let action = TCYStake
      if (isRefund) {
        action = RefundAction
      }

      if (isRefund === false) {
        ins = [
          {
            asset: TCYStake.in?.[0]?.coins?.[0]?.asset,
            amount: TCYStake.in?.[0]?.coins?.[0]?.amount,
            txid: TCYStake.in[0].txID,
            from: TCYStake.in[0].address,
            done: true,
          },
        ]

        outs = [
          {
            to: TCYStake.in[0].address,
            txid: TCYStake.in[0].txID,
            done: true,
          },
        ]
      }

      return {
        cards: {
          title: 'Stake ' + (isRefund ? '(Refund)' : ''),
          in: ins,
          middle: {
            fail: isRefund,
            pending: false,
          },
          out: [
            {
              icon: require('@/assets/images/vault.svg?inline'),
              text: 'Stake Module',
              class: 'pad-icon',
            },
          ],
        },
        accordions: {
          in: ins,
          action: {
            type: 'Stake',
            timeStamp: moment.unix(action?.date / 1e9) || null,
            height: action?.height,
            memo,
            reason,
            done: true,
          },
          out: outs,
        },
      }
    },
    createAbstractState(thorStatus, action, thorTx) {
      let ins = action?.in.map((a) => ({
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
        txid: a?.txID,
        from: a?.address,
        done: true,
      }))

      let outs = action?.out.map((a) => ({
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
        txid: a?.txID,
        to: a?.address,
        done: true,
      })) ?? []
      // Trade/secure only: when multiple outbounds have same asset and amount, only show one
      const hasTradeOrSecureOut = outs.some(
        (o) => o?.asset?.trade || o?.asset?.secure
      )
      if (hasTradeOrSecureOut) {
        const outKey = (o) =>
          `${o?.asset ? assetToString(o.asset) : ''}:${o?.amount ?? ''}`
        const seenOuts = new Set()
        outs = outs.filter((o) => {
          const key = outKey(o)
          if (seenOuts.has(key)) return false
          seenOuts.add(key)
          return true
        })
      }

      let memo
      let reason
      let isRefund = false
      if (action.metadata) {
        const m = Object.keys(action.metadata)[0]
        memo = action.metadata[m]?.memo ?? undefined
        reason =
          action.metadata[m]?.reason ?? action.metadata[m]?.code ?? undefined
        if (Object.keys(action.metadata).length === 1) {
          isRefund = m === 'refund'
        }
      }

      let cardAction = {
        type: action?.type === 'refund' ? 'Refund' : 'Action',
        timeStamp: moment.unix(action?.date / 1e9) || null,
        height: action?.height,
        memo,
        reason,
        done: true,
      }

      function kebabToTitle(kebab) {
        if (!kebab || typeof kebab !== 'string') return ''
        return kebab
          .split('_')
          .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join(' ')
      }

      let title = kebabToTitle(action.type) ?? 'Action'
      if (action.type === 'tcy_claim') {
        title = 'Tcy Claim'

        ins = [
          {
            icon: require('@/assets/images/vault.svg?inline'),
            text: 'Claim Module',
            class: 'pad-icon',
            from: action?.in[0].address,
            txid: action?.in[0].txID,
            done: true,
          },
        ]
      }

      if (action.type === 'limit_swap') {
        let ttl = 43200
        let swapLimit = 'N/A'
        if (memo.split(':')[3].split('/').length > 0) {
          ttl = memo.split(':')[3].split('/')[1] ?? 43200
          swapLimit = memo.split(':')[3].split('/')[0]
        }

        cardAction = {
          type: 'Order',
          timeStamp: moment.unix(action?.date / 1e9) || null,
          height: action?.height,
          memo,
          ttl,
          swapLimit,
          done: true,
        }

        outs[0] = { ...outs[0], hide: true }
      }

      return {
        cards: {
          title,
          in: ins,
          middle: {
            fail: isRefund,
            refund: isRefund,
            pending: false,
          },
          out: outs,
        },
        accordions: {
          in: ins,
          action: cardAction,
          out: outs,
        },
      }
    },
    async getOtherActionHash(actions, thorStatus) {
      let hash = thorStatus?.tx?.id

      hash = actions.actions
        ?.reduce(
          (r, a) => [
            ...a.in.map((i) => i.txID),
            ...a.out.map((o) => o.txID),
            ...r,
          ],
          []
        )
        .find((a) => a !== hash)

      const ts = (
        await this.$api.getTxStatus(hash).catch((e) => {
          if (e?.response?.status / 200 !== 1) {
            this.error.message =
              "Can't find transaction status. Please make sure the correct transaction hash or account address is inserted."
          }
        })
      )?.data

      return ts
    },
    createNativeTx(nativeTx) {
      const inAsset = nativeTx?.in?.[0]?.coins?.[0]?.asset
      const inAmount = nativeTx?.in?.[0]?.coins?.[0]?.amount
      const timeStamp = moment(nativeTx.date / 1e6)

      const cards = {
        title: 'Send',
        in: [
          {
            asset: inAsset,
            amount: inAmount,
          },
        ],
        middle: {
          send: true,
        },
        out: [
          {
            icon: require('@/assets/images/wallet.svg?inline'),
            address: nativeTx?.out[0]?.address,
          },
        ],
      }

      const isError = nativeTx?.metadata?.send?.code !== '0'

      const accordions = {
        in: [],
        action: {
          type: 'send',
          txid: nativeTx?.in[0]?.txID,
          memo: nativeTx.metadata?.send?.memo || '',
          from: nativeTx?.in[0]?.address,
          to: nativeTx?.out[0]?.address,
          height: nativeTx?.height,
          gas: nativeTx?.metadata?.send?.networkFees?.[0]?.amount,
          gasAsset: 'THOR.RUNE',
          timeStamp,
          pending: false,
          error: isError,
          reason: isError ? nativeTx?.metadata?.send?.reason : undefined,
          done: true,
          showAtFirst: true,
        },
        out: [],
      }

      this.$set(this, 'cards', [this.createCard(cards, accordions)])
      this.technicalExpanded = false
    },
    createAddLiquidityState(thorStatus, actions, thorTx, memo) {
      const isSaver = this.parseMemoAsset(memo?.asset)?.synth

      const inAsset = this.parseMemoAsset(
        thorStatus?.tx?.coins?.[0]?.asset,
        this.pools
      )
      const inAmount = parseInt(thorStatus?.tx?.coins?.[0]?.amount ?? 0)
      const addAction = actions?.actions?.find(
        (a) => a.type === 'addLiquidity' && a.in?.[0]?.address !== ''
      )
      const timeStamp = moment.unix(addAction?.date / 1e9)

      const isRefund = actions?.actions?.find((a) => a.type === 'refund')

      const outboundDelayRemaining =
        (thorStatus?.stages.outbound_delay?.remaining_delay_seconds ?? 0) ||
        (thorStatus?.stages.outbound_delay?.remaining_delay_blocks ?? 0) *
          this.blockSeconds('THOR')

      const pending =
        thorStatus?.stages.swap_status?.pending ||
        !thorStatus?.stages.inbound_observed?.completed ||
        !(thorStatus?.stages.inbound_confirmation_counted?.completed ?? true) ||
        !thorStatus?.stages.inbound_finalised?.completed ||
        (inAsset?.chain === 'THOR' && addAction.status === 'pending')

      const memoText =
        thorStatus?.tx?.memo || isRefund?.metadata?.refund?.memo

      return {
        cards: {
          title: 'add Liquidity' + (isRefund ? ' (Refunded)' : ''),
          in: [
            {
              asset: inAsset,
              amount: inAmount,
            },
          ],
          middle: {
            pending,
            fail: isRefund,
          },
          out: [
            {
              text: isSaver ? 'THORChain Vault' : 'THORChain Pool',
              icon: require('@/assets/images/safe.svg?inline'),
              borderColor: 'var(--primary-color)',
            },
          ],
        },
        accordions: {
          in: [
            {
              txid: thorStatus?.tx?.id,
              from: thorStatus?.tx?.from_address,
              asset: inAsset,
              amount: inAmount,
              done: true,
            },
          ],
          action: {
            type: isRefund ? 'Refund' : 'Add',
            timeStamp: timeStamp || null,
            liquidityUnits:
              parseInt(addAction?.metadata?.addLiquidity?.liquidityUnits) ||
              null,
            affiliateName: memo.affiliate,
            affiliateFee: sumAffiliateFee(memo.fee),
            outboundDelayRemaining: outboundDelayRemaining || 0,
            outboundETA:
              thorStatus?.stages.outbound_signed?.scheduled_outbound_height -
              this.thorHeight,
            outboundSigned:
              thorStatus?.stages.outbound_signed?.completed ?? false,
            refundReason: isRefund
              ? isRefund?.metadata?.refund?.reason
              : undefined,
            memo: memoText,
            done:
              !thorStatus?.stages.swap_status?.pending &&
              !(inAsset?.chain === 'THOR' && addAction.status === 'pending'),
          },
          out: [],
        },
      }
    },
    getInboundStages(inbound) {
      const ret = []

      if (inbound?.done) {
        ret.push({
          text: 'done',
        })
      }

      if (inbound?.inboundConfCount) {
        ret.push({
          text: 'Confirm Counted',
        })
      }

      if (inbound?.observationsCompleted) {
        ret.push({
          text: 'Observed',
        })
      }

      return ret
    },
    getOutboundStages(outbound) {
      const ret = []

      if (outbound?.done) {
        ret.push({
          text: 'done',
        })
      }

      if (outbound?.outboundDelayRemaining) {
        ret.push({
          text: 'delayed',
          class: 'yellow',
        })
      }

      if (outbound?.outboundSigned) {
        ret.push({
          text: 'signed',
        })
      } else if (outbound?.outboundSigned !== undefined) {
        ret.push({
          text: 'not signed',
          class: 'yellow',
        })
      }

      return ret
    },
    createRemoveLiquidityState(thorStatus, actions, thorTx, memo) {
      const inAsset = this.parseMemoAsset(
        thorStatus?.tx?.coins?.[0]?.asset,
        this.pools
      )
      const inAmount = parseInt(thorStatus?.tx?.coins?.[0]?.amount ?? 0)
      const withdrawAction = actions?.actions?.find(
        (a) => a.type === 'withdraw'
      )

      const refundAction = actions?.actions?.find((a) => a.type === 'refund')

      const outboundFees =
        withdrawAction?.metadata.withdraw?.networkFees.map((n) => n?.amount) ??
        []
      const outboundFeeAssets =
        outboundFees?.length > 0
          ? this.parseMemoAsset(
              withdrawAction?.metadata.withdraw?.networkFees.map(
                (n) => n?.asset
              ),
              this.pools
            )
          : []
      const timeStamp = moment.unix(
        (withdrawAction || refundAction)?.date / 1e9
      )

      const outTxs = thorStatus?.out_txs ?? undefined
      const userTxs =
        outTxs && new Set([outTxs.map((t) => t?.id?.toUpperCase())])

      let hasOngoing = false
      if (thorStatus.planned_out_txs > 0) {
        hasOngoing = thorStatus.planned_out_txs?.some(
          (tx) => !userTxs.has(tx.to_address.toUpperCase())
        )
        outTxs.push(
          thorStatus.planned_out_txs?.filter(
            (tx) => !userTxs.has(tx.to_address.toUpperCase())
          )
        )
      }

      let outAsset
      let outAmount
      const isOut = outTxs && outTxs[0]
      if (isOut) {
        outAsset = this.parseMemoAsset(
          outTxs[0]?.coins?.[0]?.asset,
          this.pools
        )
        outAmount =
          outTxs?.length > 0 ? parseInt(outTxs[0]?.coins?.[0]?.amount ?? 0) : 0
      }

      const outs = []
      if (outAsset) {
        outs.push({
          asset: outAsset,
          amount: outAmount,
        })
      }

      const moreOuts = outTxs?.slice(1)
      if (moreOuts && moreOuts.length > 0) {
        outs.push(
          ...moreOuts.map((o) => ({
            asset: this.parseMemoAsset(o.coins?.[0]?.asset, this.pools),
            amount: parseInt(o.coins?.[0]?.amount ?? 0),
          }))
        )
      }

      const outboundDelayRemaining =
        (thorStatus?.stages.outbound_delay?.remaining_delay_seconds ?? 0) ||
        (thorStatus?.stages.outbound_delay?.remaining_delay_blocks ?? 0) *
          this.blockSeconds('THOR')

      const outboundETA =
        this.thorHeight <
        thorStatus?.stages.outbound_signed?.scheduled_outbound_height
          ? thorStatus?.stages.outbound_signed?.scheduled_outbound_height -
            this.thorHeight
          : 0

      const outActions = []
      if (isOut) {
        outActions.push({
          fees: outboundFees,
          feeAssets: outboundFeeAssets,
          outboundDelayRemaining: outboundDelayRemaining || 0,
          outboundETA,
          outboundSigned:
            thorStatus?.stages.outbound_signed?.completed ?? false,
          done:
            thorStatus?.stages.outbound_signed?.completed ||
            outAsset?.chain === 'THOR',
        })

        if (moreOuts && moreOuts.length > 0) {
          outActions.push(
            ...moreOuts.map((o) => ({
              txid: o.id,
              to: o.to_address,
              asset: this.parseMemoAsset(o.coins?.[0]?.asset, this.pools),
              amount: parseInt(o.coins?.[0]?.amount ?? 0),
              gas: o.gas ? o.gas?.[0]?.amount : null,
              gasAsset: o.gas
                ? this.parseMemoAsset(o.gas?.[0]?.asset, this.pools)
                : null,
              outboundSigned:
                thorStatus?.stages.outbound_signed?.completed ?? false,
              done:
                thorStatus?.stages.outbound_signed?.completed ||
                outAsset?.chain === 'THOR',
            }))
          )
        }
      }

      let refundReason
      if (refundAction) {
        refundReason = refundAction?.metadata?.refund?.reason
      }

      return {
        cards: {
          title: 'Withdraw Liquidity',
          in: [
            {
              asset: inAsset,
              amount: inAmount,
            },
          ],
          middle: {
            pending: this.isTxInPending(thorStatus),
            fail: refundAction,
          },
          out: outs,
        },
        accordions: {
          in: [
            {
              txid: thorStatus?.tx.id,
              from: thorStatus?.tx.from_address,
              asset: inAsset,
              amount: inAmount,
              done: true,
            },
          ],
          action: {
            type: 'Withdraw',
            timeStamp: timeStamp || null,
            liquidityUnits:
              parseInt(withdrawAction?.metadata?.withdraw?.liquidityUnits) ||
              null,
            refundReason,
            done: !hasOngoing,
          },
          out: outActions,
        },
      }
    },
    createRunePoolDeposit(thorStatus, actions, thorTx, memo) {
      const action = actions.actions.find((a) => a.type === 'runePoolDeposit')

      const ins = action?.in.map((a) => ({
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
        txid: a?.txID,
        from: a?.address,
        done: true,
      }))

      const outs = action?.out.map((a) => ({
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
        txid: a?.txID,
        to: a?.address,
        done: true,
      }))

      return {
        cards: {
          title: 'RUNEPool Deposit',
          in: ins,
          middle: {
            pending: false,
          },
          out: [
            {
              text: 'THORChain Vault',
              icon: require('@/assets/images/safe.svg?inline'),
              borderColor: 'var(--primary-color)',
            },
          ],
        },
        accordions: {
          in: ins,
          action: {
            type: 'RUNEPool Deposit',
            timeStamp: moment.unix(action?.date / 1e9) || null,
            height: action?.height,
            units: parseInt(action?.metadata?.runePoolDeposit?.units) || null,
            done: true,
          },
          out: outs,
        },
      }
    },
    createRunePoolWithdraw(thorStatus, actions, thorTx, memo) {
      const action = actions.actions.find((a) => a.type === 'runePoolWithdraw')

      const ins = action?.in.map((a) => ({
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
        txid: a?.txID,
        from: a?.address,
        done: true,
      }))

      const outs = action?.out.map((a) => ({
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
        txid: a?.txID,
        to: a?.address,
        done: true,
      }))

      return {
        cards: {
          title: 'RUNEPool Withdraw',
          in: ins,
          middle: {
            pending: false,
          },
          out: outs,
        },
        accordions: {
          in: ins,
          action: {
            type: 'Withdraw',
            timeStamp: moment.unix(action?.date / 1e9) || null,
            height: action?.height,
            units: parseInt(action?.metadata?.runePoolWithdraw?.units) || null,
            done: true,
          },
          out: outs,
        },
      }
    },
    createSwapState(thorStatus, thorTx, actions, memo, thorHeader, quote) {
      // swap user addresses
      const userAddresses = new Set([
        thorStatus?.tx.from_address.toLowerCase(),
        memo.destAddr?.toLowerCase(), // TODO: sometimes the memo destAddr will be THORName
      ])
      // Non affiliate outs
      const memoAssetStr = (() => {
        const parsed = this.parseMemoAsset(memo?.asset)
        return parsed ? assetToString(parsed) : null
      })()
      let outTxs = thorStatus.out_txs?.filter(
        (tx) =>
          userAddresses.has(tx.to_address?.toLowerCase()) ||
          (tx.coins?.[0]?.asset === memoAssetStr &&
            tx.id !==
              '0000000000000000000000000000000000000000000000000000000000000000' &&
            tx.id !== '')
      )
      // get affiliate out if available
      const affiliateOut = thorStatus.out_txs?.filter(
        (tx) =>
          !userAddresses.has(tx.to_address?.toLowerCase()) &&
          (tx.id !==
            '0000000000000000000000000000000000000000000000000000000000000000' ||
            tx.id !== '')
      )
      // TODO: fix this in track code
      if (
        !outTxs ||
        outTxs?.length === 0 ||
        outTxs.every((o) => o.to_address === thorStatus?.tx.from_address) // Add scheduled outbound while having a refund
      ) {
        outTxs = thorStatus.planned_out_txs
          ?.filter((tx) => userAddresses.has(tx.to_address.toLowerCase()))
          .map((tx) => ({
            ...tx,
            coins: [{ amount: tx.coin.amount, asset: tx.coin.asset }],
          }))
      }

      // order by target swapped asset if we have refund in swap
      outTxs = orderBy(
        outTxs,
        (o) =>
          o.coins?.[0]?.asset === thorStatus?.tx?.coins?.[0]?.asset
      )

      // Trade/secure asset swap only: when multiple outbounds have same asset and amount, only show one
      const memoOutAsset = this.parseMemoAsset(memo?.asset, this.pools)
      if (memoOutAsset?.trade || memoOutAsset?.secure) {
        const outboundKey = (o) =>
          `${o.coins?.[0]?.asset ?? ''}:${o.coins?.[0]?.amount ?? ''}`
        const seenOut = new Set()
        outTxs = outTxs.filter((o) => {
          const key = outboundKey(o)
          if (seenOut.has(key)) return false
          seenOut.add(key)
          return true
        })
      }

      // Add native in/out search
      const inAsset = this.parseMemoAsset(
        thorStatus?.tx?.coins?.[0]?.asset,
        this.pools
      )
      const inAmount = parseInt(thorStatus?.tx?.coins?.[0]?.amount ?? 0)

      const outAsset = this.parseMemoAsset(
        outTxs?.length > 0 ? outTxs[0]?.coins?.[0]?.asset : memo?.asset,
        this.pools
      )
      let outAmount =
        outTxs?.length > 0 ? parseInt(outTxs[0]?.coins?.[0]?.amount ?? 0) : 0
      if (
        !outAmount &&
        actions?.actions?.length > 0 &&
        (outAsset?.trade || outAsset?.secure)
      ) {
        const outAssetStr = outAsset ? assetToString(outAsset) : null
        outAmount = parseInt(
          Object.values(
            groupBy(
              actions?.actions
                ?.find((a) => a.type === 'swap')
                ?.out?.filter(
                  (a) =>
                    a.coins?.[0]?.asset === outAssetStr
                ),
              'txID'
            )
          ).map((group) =>
            sumBy(group, (item) => +(item.coins?.[0]?.amount ?? 0))
          )[0]
        )
      }

      const outMemoAsset = this.parseMemoAsset(memo?.asset)

      // Midgard
      // There are multiple outbound fee
      // also there might be refund involved
      const swapAction = actions?.actions?.find((a) => a.type === 'swap')
      const outboundFees =
        swapAction?.metadata.swap?.networkFees.map((n) => n?.amount) ?? []
      const outboundFeeAssets =
        outboundFees?.length > 0
          ? this.parseMemoAsset(
              swapAction?.metadata.swap?.networkFees.map((n) => n?.asset),
              this.pools
            )
          : null
      let timeStamp = swapAction?.date
      const height = swapAction?.height
      this.height = height

      // Refunds
      const outboundHasRefund = outTxs?.some(
        (tx) => tx.refund || tx.memo?.toLowerCase().startsWith('refund')
      )
      // sometimes the outbound doesn't come out if the outbound is in native chain
      const outboundHasSuccess = outTxs?.some((tx) =>
        tx.memo?.toLowerCase().startsWith('out')
      )

      const inAmountUSD =
        (+swapAction?.metadata.swap.inPriceUSD * inAmount) / 1e8
      let outAmountUSD =
        (+swapAction?.metadata.swap.outPriceUSD *
          (outAmount || +this.quote?.expected_amount_out)) /
        1e8
      if (!outboundHasSuccess && outboundHasRefund) {
        outAmountUSD = (+swapAction?.metadata.swap.inPriceUSD * outAmount) / 1e8
      }

      const outboundRefundReason = actions?.actions.find(
        (action) => action.type === 'refund'
      )?.metadata?.refund?.reason

      // only refund happened
      const onlyRefund =
        actions?.actions.length > 0 &&
        actions?.actions.every((action) => action?.type === 'refund')

      const refundAction = actions?.actions?.find((a) => a.type === 'refund')
      if (onlyRefund) {
        timeStamp = refundAction?.date
      }
      let isRefund = false
      if (refundAction) {
        isRefund = true
      }

      // TODO: add nice check with animation (transition from pending to complete)
      // TODO: add failed swaps from midgard
      // TODO: Add refunded swap info
      // TODO: fix the loading check/spinner on complete
      // TODO: fix streaming card when finished
      // TODO: sometimes the pools price is fetched after the status

      const outboundDelayRemaining =
        (thorStatus?.stages.outbound_delay?.remaining_delay_seconds ?? 0) ||
        (thorStatus?.stages.outbound_delay?.remaining_delay_blocks ?? 0) *
          this.blockSeconds('THOR')

      if (timeStamp) {
        timeStamp = moment.unix(timeStamp / 1e9)
      }

      const rates = []
      if (inAmount && outAmount) {
        rates.push(
          `1 ${this.showTicker(inAsset)} = ${outAmount / inAmount} ${this.showTicker(outAsset)}`
        )
        rates.push(
          `1 ${this.showTicker(outAsset)} = ${inAmount / outAmount} ${this.showTicker(inAsset)}`
        )
      }

      return {
        cards: {
          title: onlyRefund ? 'refunded Swap' : 'swap',
          labels: onlyRefund ? [] : isRefund ? ['Refund'] : [],
          in: [
            {
              asset: inAsset,
              amount: inAmount,
              amountUSD: inAmountUSD,
            },
          ],
          middle: {
            pending: this.isTxInPending(thorStatus, actions),
            fail: onlyRefund,
          },
          out: [
            {
              asset: outAsset,
              amount: outAmount || +this.quote?.expected_amount_out,
              amountUSD: outAmountUSD,
              filter: outAmount
                ? undefined
                : (v) => `~ ${this.baseAmountFormatOrZero(v)}`,
            },
            ...(outTxs ?? []).slice(1).map((o) => {
              const oAmount = parseInt(o.coins?.[0]?.amount ?? 0)
              const isRefundTx =
                o.refund || o.memo?.toLowerCase().startsWith('refund')
              const priceUSD = isRefundTx
                ? +swapAction?.metadata?.swap?.inPriceUSD
                : +swapAction?.metadata?.swap?.outPriceUSD
              return {
                asset: this.parseMemoAsset(o.coins?.[0]?.asset, this.pools),
                amount: oAmount,
                amountUSD: (priceUSD * oAmount) / 1e8,
              }
            }),
          ],
        },
        accordions: {
          in: [
            {
              txid: thorStatus?.tx.id,
              from: thorStatus?.tx.from_address,
              asset: inAsset,
              amount: inAmount,
              gas: thorStatus?.tx.gas ? thorStatus?.tx?.gas?.[0]?.amount : null,
              gasAsset: thorStatus?.tx.gas
                ? this.parseMemoAsset(thorStatus?.tx?.gas?.[0]?.asset, this.pools)
                : null,
              preObservations:
                thorStatus?.stages?.inbound_observed?.pre_confirmation_count,
              observations: thorStatus?.stages?.inbound_observed?.final_count,
              observationsCompleted:
                thorStatus?.stages?.inbound_observed?.completed,
              finalisedHeight: thorTx.finalised_height,
              inboundObserved:
                thorStatus?.stages?.inbound_observed?.completed || false,
              inboundConfCount:
                thorStatus?.stages?.inbound_confirmation_counted || 0,
              preConfirmationCount:
                thorStatus?.stages?.inbound_observed?.pre_confirmation_count ||
                0,
              confirmationRemainingSeconds:
                thorStatus?.stages?.inbound_confirmation_counted
                  ?.remaining_confirmation_seconds || 0,
              done: thorStatus?.stages?.inbound_finalised?.completed,
            },
          ],
          action: {
            type: onlyRefund || isRefund ? 'refunded Swap' : 'swap',
            timeStamp: timeStamp || null,
            limit: memo?.limit,
            limitAsset: outMemoAsset,
            affiliateName: memo?.affiliate,
            affiliateFee: sumAffiliateFee(memo?.fee || 0),
            liquidityFee:
              parseInt(swapAction?.metadata.swap?.liquidityFee) || null,
            liquidityUnits: null,
            refundReason: onlyRefund || isRefund ? outboundRefundReason : null,
            asymmetry: null,
            affiliateOut: affiliateOut || undefined,
            swapSlip: parseInt(swapAction?.metadata.swap?.swapSlip),
            height,
            rate: rates,
            streaming: {
              count: thorStatus?.stages.swap_status?.streaming?.count,
              interval:
                thorStatus?.stages.swap_status?.streaming?.interval ||
                memo?.interval,
              quantity:
                thorStatus?.stages.swap_status?.streaming?.quantity ||
                memo?.quantity,
              lastHeight: null, // Add on midgard if available
            },
            memo: swapAction?.metadata.swap?.memo,
            done:
              thorStatus?.stages?.inbound_finalised?.completed &&
              (thorStatus?.stages.swap_finalised?.completed ||
                !thorStatus?.stages.swap_status?.pending),
            error: onlyRefund,
          },
          out: [
            {
              txid: outTxs?.length > 0 ? outTxs[0]?.id : null,
              to: (outTxs?.length > 0 && outTxs[0]?.to_address) || memo?.destAddr,
              asset: outAsset,
              amount: parseInt(outAmount),
              gas:
                outTxs?.length > 0 && outTxs[0]?.gas
                  ? outTxs[0]?.gas?.[0]?.amount
                  : null,
              gasAsset:
                outTxs?.length > 0 && outTxs[0]?.gas
                  ? this.parseMemoAsset(outTxs[0]?.gas?.[0]?.asset, this.pools)
                  : null,
              height: outTxs?.length > 0 ? outTxs[0]?.height : null,
              fees: outboundFees,
              feeAssets: outboundFeeAssets,
              delayBlocksRemaining:
                thorStatus?.stages.outbound_delay?.remaining_delay_blocks || 0,
              outboundDelayRemaining: outboundDelayRemaining || 0,
              outboundETA:
                thorStatus?.stages.outbound_signed?.scheduled_outbound_height -
                this.thorHeight,
              outboundSigned:
                thorStatus?.stages.outbound_signed?.completed ?? undefined,
              done:
                (outTxs?.length > 0 && outTxs[0]?.id) ||
                (!thorStatus?.stages.swap_status?.pending &&
                  (thorStatus?.stages.outbound_signed?.completed ||
                    outAsset?.chain === 'THOR' ||
                    outAsset?.synth ||
                    outAsset?.trade ||
                    outAsset?.secure) &&
                  (thorStatus?.stages.outbound_delay?.completed ?? true)),
            },
            ...(outTxs ?? []).slice(1).map((o) => ({
              txid: o.id,
              to: o.to_address,
              asset: this.parseMemoAsset(o.coins?.[0]?.asset, this.pools),
              amount: parseInt(o.coins?.[0]?.amount ?? 0),
              gas: o.gas ? o.gas?.[0]?.amount : null,
              height: o.height,
              gasAsset: o.gas
                ? this.parseMemoAsset(o.gas?.[0]?.asset, this.pools)
                : null,
              done:
                !!o.id ||
                (!thorStatus?.stages.swap_status?.pending &&
                  (thorStatus?.stages.outbound_signed?.completed ||
                    outAsset?.chain === 'THOR' ||
                    outAsset?.synth ||
                    outAsset?.trade ||
                    outAsset?.secure)),
            })),
          ],
        },
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.tx-detail-page {
  margin: $space-8 auto $space-24;
  max-width: 1140px;
  padding: 0 $space-16;
}

.tx-detail-back {
  margin-bottom: $space-12;
}

.tx-back-link,
.tx-link {
  color: var(--font-color);
  font-weight: 500;
  text-decoration: none;

  &:hover {
    color: color-mix(in srgb, var(--green) 82%, white);
  }
}

.tx-link {
  color: var(--green);
}

.tx-detail-meta {
  align-items: center;
  color: var(--font-color);
  display: flex;
  font-size: $font-size-sm;
  flex-wrap: wrap;
  gap: $space-10;
  margin-bottom: $space-12;
}

.tx-detail-status {
  align-items: center;
  border-radius: 999px;
  display: inline-flex;
  font-size: $font-size-sm;
  font-weight: 600;
  padding: $space-4 $space-10;
}

.tx-detail-status--green {
  background: color-mix(in srgb, var(--green) 12%, transparent);
  color: #35f09a;
}

.tx-detail-status--yellow {
  background: color-mix(in srgb, #e4bc47 15%, transparent);
  color: #f0cf71;
}

.tx-detail-status--red {
  background: color-mix(in srgb, var(--red) 12%, transparent);
  color: #ff8d8d;
}

.tx-detail-title {
  color: var(--sec-font-color);
  font-size: clamp(2.1rem, 4.2vw, 3.4rem);
  letter-spacing: -0.03em;
  line-height: 1.06;
  margin: 0 0 $space-24;
}

.tx-detail-grid {
  display: grid;
  gap: $space-18;

  @include lg {
    align-items: start;
    grid-template-columns: minmax(0, 1.95fr) minmax(300px, 0.92fr);
  }
}

.tx-detail-main,
.tx-detail-side {
  display: flex;
  flex-direction: column;
  gap: $space-18;
}

.tx-swap-card,
.tx-info-card {
  background: color-mix(in srgb, var(--card-bg-color) 96%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color) 92%, transparent);
  border-radius: 20px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.16);
  padding: $space-20;
}

.tx-detail-side {
  @include lg {
    position: sticky;
    top: $space-20;
  }
}

.tx-swap-head {
  display: grid;
  gap: $space-14;

  @include md {
    align-items: center;
    grid-template-columns: minmax(0, 1fr) 60px minmax(0, 1fr);
  }
}

.tx-asset-panel {
  background: color-mix(in srgb, #26323d 60%, var(--card-bg-color));
  border: 1px solid color-mix(in srgb, var(--border-color) 92%, transparent);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: $space-10;
  min-height: 156px;
  padding: $space-18 $space-20;
}

.tx-asset-panel--accent {
  border-color: color-mix(in srgb, var(--green) 62%, var(--border-color));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--green) 14%, transparent);
}

.tx-asset-label {
  color: var(--font-color);
  font-size: $font-size-xxs;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.tx-asset-primary {
  align-items: center;
  color: var(--sec-font-color);
  display: flex;
  font-size: 1.75rem;
  font-weight: 700;
  gap: $space-10;
}

.tx-asset-badge {
  align-self: flex-start;
  background: color-mix(in srgb, var(--highlight) 8%, transparent);
  border-radius: 999px;
  color: var(--font-color);
  font-size: $font-size-sm;
  padding: $space-6 $space-10;
}

.tx-asset-values {
  align-items: end;
  color: var(--font-color);
  display: flex;
  justify-content: space-between;
  margin-top: auto;
  gap: $space-12;

  span,
  strong {
    color: var(--sec-font-color);
    font-size: 1.5rem;
    font-weight: 600;
  }

  strong {
    font-size: 1.25rem;
  }
}

.tx-swap-arrow {
  align-items: center;
  background: color-mix(in srgb, #26323d 40%, var(--card-bg-color));
  border: 1px solid color-mix(in srgb, var(--green) 18%, var(--border-color));
  border-radius: 999px;
  color: var(--green);
  display: flex;
  font-size: 1.15rem;
  font-weight: 700;
  height: 60px;
  justify-content: center;
  margin: auto;
  width: 60px;
}

.tx-metric-strip {
  display: grid;
  gap: $space-12;
  margin-top: $space-14;
  padding-top: $space-14;
  position: relative;

  @include md {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  &::before {
    background: color-mix(in srgb, var(--border-color) 92%, transparent);
    content: '';
    height: 1px;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
  }
}

.tx-metric-item {
  min-height: 56px;

  @include md {
    padding-right: $space-12;

    &:not(:last-child) {
      border-right: 1px solid color-mix(in srgb, var(--border-color) 92%, transparent);
    }
  }
}

.tx-metric-value {
  color: var(--sec-font-color);
  font-size: $font-size-md;
  font-weight: 600;
  margin-top: $space-4;
}

.tx-section-title {
  color: var(--font-color);
  font-size: $font-size-xxs;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.tx-detail-rows,
.tx-fee-list,
.tx-tech-list {
  border-top: 1px solid color-mix(in srgb, var(--border-color) 92%, transparent);
  margin-top: $space-16;
  padding-top: $space-2;
}

.tx-detail-row,
.tx-fee-row,
.tx-tech-row {
  align-items: start;
  border-top: 1px solid color-mix(in srgb, var(--border-color) 90%, transparent);
  display: grid;
  gap: $space-10;
  grid-template-columns: minmax(110px, 0.8fr) minmax(0, 1.2fr);
  padding: $space-12 0;
}

.tx-detail-key,
.tx-fee-label,
.tx-tech-key {
  color: var(--font-color);
  font-size: $font-size-sm;
}

.tx-detail-value,
.tx-fee-value,
.tx-tech-value {
  color: var(--sec-font-color);
  font-size: $font-size-sm;
  font-weight: 500;
  text-align: right;
}

.tx-tech-value--truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tx-lifecycle-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: $space-20;
  margin-top: $space-18;
  padding-left: $space-4;

  &::before {
    background: color-mix(in srgb, var(--border-color) 88%, transparent);
    bottom: $space-14;
    content: '';
    left: 20px;
    position: absolute;
    top: $space-14;
    width: 1px;
  }
}

.tx-lifecycle-item {
  position: relative;
  display: grid;
  gap: $space-12;
  grid-template-columns: 40px minmax(0, 1fr);
}

.tx-lifecycle-dot {
  align-items: center;
  background: color-mix(in srgb, var(--green) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--green) 35%, transparent);
  border-radius: 999px;
  color: var(--green);
  display: flex;
  font-size: 1rem;
  height: 40px;
  justify-content: center;
  position: relative;
  width: 40px;
  z-index: 1;
}

.tx-lifecycle-title {
  color: var(--sec-font-color);
  font-weight: 600;
  margin-bottom: $space-4;
}

.tx-lifecycle-body,
.tx-lifecycle-meta,
.tx-fee-subtle,
.tx-hash-full {
  color: var(--font-color);
}

.tx-lifecycle-meta {
  margin-top: $space-4;
}

.tx-hash-box {
  background: color-mix(in srgb, #26323d 60%, var(--card-bg-color));
  border: 1px solid color-mix(in srgb, var(--border-color) 92%, transparent);
  border-radius: 16px;
  margin-top: $space-14;
  padding: $space-14;
}

.tx-hash-full {
  color: var(--sec-font-color);
  font-size: $font-size-sm;
  line-height: 1.55;
  margin-top: $space-8;
  overflow-wrap: anywhere;
}

.tx-hash-actions {
  display: grid;
  gap: $space-10;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: $space-14;
}

.tx-hash-action {
  align-items: center;
  background: color-mix(in srgb, #26323d 38%, var(--card-bg-color));
  border: 1px solid color-mix(in srgb, var(--border-color) 92%, transparent);
  border-radius: 14px;
  color: var(--sec-font-color);
  cursor: pointer;
  display: flex;
  font-size: $font-size-sm;
  font-weight: 500;
  gap: $space-8;
  justify-content: center;
  min-height: 50px;
  padding: 0 $space-12;

  &:hover {
    border-color: color-mix(in srgb, var(--green) 40%, var(--border-color));
    color: var(--green);
  }

  :deep(.item) {
    align-items: center;
    background: transparent;
    border: none;
    display: flex;
    justify-content: center;
    min-height: auto;
    min-width: 16px;
    padding: 0;
    width: auto;
  }

  :deep(svg),
  :deep(path),
  :deep(span) {
    fill: var(--sec-font-color);
    color: var(--sec-font-color);
  }

  &:hover :deep(svg),
  &:hover :deep(path),
  &:hover :deep(span) {
    fill: var(--green);
    color: var(--green);
  }
}

.tx-fee-value-wrap {
  text-align: right;
}

.tx-tech-header {
  align-items: center;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  padding: 0;
  width: 100%;
}

.tx-tech-arrow {
  color: var(--font-color);
  font-size: 1rem;
  font-weight: 700;
}

.tx-header {
  display: flex;
  max-width: 680px;
  gap: 8px;
  align-items: center;
  justify-content: center;
  margin: $space-0 $space-10;

  @include lg {
    margin: auto;
    width: 100%;
  }

  @include md {
    justify-content: flex-start;
  }

  .item {
    border: 1px solid var(--border-color);
    background-color: var(--card-bg-color);
    padding: $space-8;
    border-radius: $radius-s;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: $space-0;
    flex-grow: 1;
    max-width: 100%;
    min-width: 32px;

    &:not(.tx-id) {
      height: 32px;
      width: 32px;
    }

    span {
      color: var(--sec-font-color);
      line-height: 15px;
      height: 16px;
    }

    &:hover {
      span {
        color: var(--primary-color);
      }

      * {
        fill: var(--primary-color);
      }
    }

    * {
      fill: var(--sec-font-color);
    }
  }
}

.qr-icon {
  fill: var(--font-color);
  width: 16px;
  height: 16px;
}

.tx-wrapper {
  position: relative;

  .arrow {
    display: none;
    flex: 1;
    justify-content: center;
    align-items: center;

    .icon {
      margin-right: $space-0;
    }

    @include md {
      display: flex;
    }
  }
}
.tx-container {
  border: 1px solid var(--border-color);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  background: var(--card-bg-color);
  border-radius: $radius-s;
  padding: $space-20;
  gap: $space-10;
}

.tx-contain {
  display: flex;
  flex-direction: column;
  gap: $space-10;

  .asset-icon-container {
    margin-top: $space-10;
    display: flex;
    align-items: center;

    span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 300px;
    }
  }

  .address {
    margin-top: $space-10;
  }

  .txid {
    width: 300px;
    display: flex;
    align-items: center;
    gap: 10px;

    .tx-hash {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
}

.icon {
  fill: var(--sec-font-color);
  height: 1.5rem;

  &.small {
    margin-right: $space-0;
    height: 0.8rem;
    width: 0.8rem;
  }
}

.extra-details {
  margin-top: $space-16;

  .pool-box {
    margin: $space-5 $space-0;
    display: flex;
    align-items: center;
  }
}

.utility,
.tx-date {
  padding: $space-0 $space-16;
}

.utility {
  justify-content: space-between;
  gap: $space-16;
}

.asset-text {
  font-size: $font-size-md;
}

.tx-id {
  flex-shrink: 5;
  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
