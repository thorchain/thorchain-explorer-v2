<template>
  <Page>
    <div v-if="swapOverview || contractOverview" class="tx-detail-page">
      <div class="tx-detail-back">
        <nuxt-link to="/txs" class="tx-back-link">
          <ArrowIcon class="tx-back-icon" />
          All Transactions
        </nuxt-link>
      </div>

      <div class="tx-detail-meta">
        <span>{{ activeOverview.metaLabel }}</span>
        <div
          class="bubble-stack"
          :class="{ 'bubble-stack--expanded': overviewBubbleExpanded }"
          tabindex="0"
          @mouseenter="overviewBubbleExpanded = true"
          @mouseleave="overviewBubbleExpanded = false"
          @focusin="overviewBubbleExpanded = true"
          @focusout="overviewBubbleExpanded = false"
        >
          <div
            v-for="(item, index) in overviewBubbleItems"
            :key="index"
            class="bubble-pill"
            :class="item.colorClass"
          >
            <component
              :is="item.icon"
              v-if="item.icon"
              class="bubble-pill__icon"
            />
            <span class="bubble-pill__label">{{ item.label }}</span>
          </div>
        </div>
        <affiliate
          v-if="activeOverview.affiliateAddress"
          :affiliate-address="activeOverview.affiliateAddress"
        />
      </div>

      <h1 class="tx-detail-title">
        {{ activeOverview.title }}
      </h1>

      <div class="tx-detail-grid">
        <div class="tx-detail-main">
          <section class="tx-swap-card card-bg">
            <div class="tx-swap-head" :style="panelVars">
              <div class="tx-asset-panel">
                <div class="tx-asset-label">Input</div>
                <div class="tx-asset-primary">
                  <AssetIcon
                    v-if="activeOverview.input.asset"
                    :asset="activeOverview.input.asset"
                    :height="'2.25rem'"
                  />
                  <span>{{ activeOverview.input.name }}</span>
                </div>
                <div class="tx-asset-badge">
                  {{ activeOverview.input.badge }}
                </div>
                <div class="tx-asset-values">
                  <span>{{ activeOverview.input.amount }}</span>
                  <strong v-if="activeOverview.input.usd">{{
                    safeUsdDisplay(activeOverview.input.usd)
                  }}</strong>
                </div>
              </div>

              <div class="tx-swap-arrow">
                <OrderIcon
                  v-if="activeOverview.hasContractAction"
                  class="tx-swap-arrow-icon order"
                />
                <ArrowIcon v-else class="tx-swap-arrow-icon" />
              </div>

              <div
                :class="[
                  'tx-asset-panel',
                  activeOverview.returnedOutput
                    ? 'tx-asset-panel--accent tx-asset-panel--split'
                    : 'tx-asset-panel--accent',
                ]"
              >
                <div class="tx-asset-label">Output</div>
                <div class="tx-asset-primary">
                  <AssetIcon
                    v-if="activeOverview.output.asset"
                    :asset="activeOverview.output.asset"
                    :height="'2.25rem'"
                  />
                  <span>{{ activeOverview.output.name }}</span>
                </div>
                <div class="tx-asset-badge">
                  {{ activeOverview.output.badge }}
                </div>
                <div class="tx-asset-values">
                  <span>{{ activeOverview.output.amount }}</span>
                  <strong v-if="activeOverview.output.usd">{{
                    safeUsdDisplay(activeOverview.output.usd)
                  }}</strong>
                </div>
                <template v-if="activeOverview.returnedOutput">
                  <div class="tx-asset-divider" />
                  <div class="tx-returned-panel">
                    <div class="tx-asset-label tx-asset-label--returned">
                      Returned
                    </div>
                    <div class="tx-returned-row">
                      <AssetIcon
                        v-if="activeOverview.returnedOutput.asset"
                        :asset="activeOverview.returnedOutput.asset"
                        :height="'1.1rem'"
                        :chain-height="'0.7rem'"
                      />
                      <span class="tx-returned-name">{{
                        activeOverview.returnedOutput.name
                      }}</span>
                      <span class="tx-returned-amount">{{
                        activeOverview.returnedOutput.amount
                      }}</span>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <div
              v-if="activeOverview.metricRows.length"
              class="tx-metric-strip"
            >
              <div
                v-for="metric in activeOverview.metricRows"
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
                v-for="row in activeOverview.detailRows"
                :key="row.label"
                class="tx-detail-row"
              >
                <div class="tx-detail-key">{{ row.label }}</div>
                <div class="tx-detail-value">
                  <template v-if="row.type === 'product'">
                    <ProductBadge :label="row.value" :tone="row.tone" />
                  </template>
                  <template v-else-if="row.type === 'status'">
                    <span
                      :class="[
                        'mini-bubble',
                        statusToneClass(activeOverview.status.tone),
                      ]"
                    >
                      {{ row.value }}
                    </span>
                  </template>
                  <template v-else-if="row.type === 'exchange-rate'">
                    <span class="exchange-rate-value">
                      {{
                        rateFlipped && row.valueFlipped
                          ? row.valueFlipped
                          : row.value
                      }}
                      <rate-change-icon
                        v-if="row.valueFlipped"
                        v-tooltip="'Flip exchange rate'"
                        class="exchange-rate-flip-icon"
                        @click="rateFlipped = !rateFlipped"
                      />
                    </span>
                  </template>
                  <template v-else-if="row.type === 'address'">
                    <AddressComponent :address="row.address" />
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

          <section
            v-if="activeOverview.lifecycleRows.length"
            class="tx-info-card card-bg"
          >
            <div class="tx-section-title">Lifecycle Events</div>
            <div class="tx-lifecycle-list">
              <div
                v-for="event in activeOverview.lifecycleRows"
                :key="event.title"
                class="tx-lifecycle-item"
              >
                <div class="tx-lifecycle-dot">
                  <component
                    :is="event.icon"
                    class="tx-lifecycle-icon"
                    :style="
                      event.iconRotate
                        ? { transform: `rotate(${event.iconRotate}deg)` }
                        : {}
                    "
                  />
                </div>
                <div class="tx-lifecycle-copy">
                  <div class="tx-lifecycle-title">{{ event.title }}</div>
                  <div class="tx-lifecycle-body">{{ event.body }}</div>
                  <div v-if="event.meta" class="tx-lifecycle-meta">
                    {{ event.meta }}
                  </div>
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
              <div
                class="tx-hash-action"
                @click="$refs.copyBtn.onlyCopy($route.params.txhash)"
              >
                <Copy
                  ref="copyBtn"
                  :str-copy="$route.params.txhash"
                  :hide-toast="true"
                />
                <span>Copy</span>
              </div>
              <div class="tx-hash-action" @click="$refs.qrBtn.showQR = true">
                <qr-btn ref="qrBtn" :qrcode="$route.params.txhash" />
                <span>View QR</span>
              </div>
              <a
                v-if="inputExplorerUrl"
                class="tx-hash-action"
                :href="inputExplorerUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalIcon class="tx-hash-action-icon" />
                <span>Input Tx</span>
              </a>
              <a
                v-if="outputExplorerUrl"
                class="tx-hash-action"
                :href="outputExplorerUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalIcon class="tx-hash-action-icon" />
                <span>Output Tx</span>
              </a>
            </div>
          </section>

          <section
            v-if="activeOverview.feeRows.length"
            class="tx-info-card card-bg"
          >
            <div class="tx-section-title">Fee Breakdown</div>
            <div class="tx-fee-list">
              <div
                v-for="fee in activeOverview.feeRows"
                :key="fee.label"
                class="tx-fee-row"
              >
                <div
                  :class="[
                    'tx-fee-label',
                    { 'tx-fee-label--total': fee.isTotal },
                  ]"
                >
                  {{ fee.label }}
                </div>
                <div class="tx-fee-value-wrap">
                  <div
                    :class="[
                      'tx-fee-value',
                      { 'tx-fee-value--total': fee.isTotal },
                    ]"
                  >
                    {{ fee.usd }}
                  </div>
                  <div v-if="fee.subtle" class="tx-fee-subtle">
                    {{ fee.subtle }}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="tx-info-card card-bg">
            <button
              class="tx-tech-header"
              type="button"
              @click="technicalExpanded = !technicalExpanded"
            >
              <span class="tx-section-title">Technical Details</span>
              <span class="tx-tech-arrow">{{
                technicalExpanded ? '−' : '+'
              }}</span>
            </button>
            <div v-if="technicalExpanded" class="tx-tech-list">
              <div
                v-for="row in activeOverview.technicalRows"
                :key="row.label"
                class="tx-tech-row"
              >
                <div class="tx-tech-key">{{ row.label }}</div>
                <div
                  v-tooltip="row.label === 'Memo' ? row.value : undefined"
                  :class="[
                    'tx-tech-value',
                    { 'tx-tech-value--truncate': row.label === 'Memo' },
                    { hoverable: row.label === 'Memo' },
                  ]"
                >
                  <template v-if="row.type === 'address'">
                    <AddressComponent :address="row.address" />
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
        <tx-card v-for="(c, i) in visibleCards" :key="i" :tx-data="c.details">
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
import ProductBadge from '~/components/ProductBadge.vue'
import Affiliate from '~/components/Affiliate.vue'
import DisconnectIcon from '~/assets/images/disconnect.svg?inline'
import ArrowIcon from '~/assets/images/arrow.svg?inline'
import OrderIcon from '~/assets/images/order.svg?inline'
import ExchangeIcon from '~/assets/images/exchange.svg?inline'
import RateChangeIcon from '~/assets/images/rate-change.svg?inline'
import CheckIcon from '~/assets/images/square-checkmark.svg?inline'
import ClockIcon from '~/assets/images/clock.svg?inline'
import WarningIcon from '~/assets/images/warning.svg?inline'
import SwapIcon from '~/assets/images/swap.svg?inline'
import SendTypeIcon from '~/assets/images/send-outline.svg?inline'
import RefreshIcon from '~/assets/images/refresh.svg?inline'
import AssetIcon from '~/components/AssetIcon.vue'
import AddressComponent from '~/components/transactions/Address.vue'
import {
  blockTime,
  assetFromString,
  assetToTrade,
  assetToSecure,
  tradeToAsset,
  assetToString,
  securedToAsset,
  sumAffiliateFee,
  getExplorerAddressUrl,
} from '~/utils'
import Accordion from '~/components/Accordion.vue'
import {
  getRujiraContractLabel,
  getRujiraContractProduct,
} from '~/utils/rujiraContracts'
import ExternalIcon from '~/assets/images/external.svg?inline'

export default {
  components: {
    ProductBadge,
    Affiliate,
    DisconnectIcon,
    ArrowIcon,
    OrderIcon,
    ExchangeIcon,
    RateChangeIcon,
    CheckIcon,
    ClockIcon,
    WarningIcon,
    SwapIcon,
    SendTypeIcon,
    RefreshIcon,
    AssetIcon,
    AddressComponent,
    ExternalIcon,
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
      rawActions: null,
      inboundHash: undefined,
      thorStatus: undefined,
      thorHeight: 0,
      quote: undefined,
      height: undefined,
      technicalExpanded: false,
      overviewBubbleExpanded: false,
      rateFlipped: false,
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
    activeOverview() {
      return this.swapOverview || this.contractOverview || null
    },
    inputExplorerUrl() {
      const asset = this.activeOverview?.input?.asset
      if (!asset) return null
      if (this.activeOverview?.input?.secure) return null
      const parsed = assetFromString(asset)
      const chain = parsed?.chain
      if (!chain || chain === 'THOR') return null
      const inTxId = this.activeOverview?.input?.txId
      if (!inTxId) return null
      return getExplorerAddressUrl(chain, inTxId, 'hash')
    },
    outputExplorerUrl() {
      const asset = this.activeOverview?.output?.asset
      if (!asset) return null
      const parsed = assetFromString(asset)
      const chain = parsed?.chain
      if (!chain || chain === 'THOR') return null
      const outTxId = this.activeOverview?.output?.txId
      if (!outTxId) return null
      return getExplorerAddressUrl(chain, outTxId, 'hash')
    },
    panelVars() {
      const overview = this.activeOverview
      if (!overview) return {}
      return {
        '--left-border':
          this.assetColorPalette(overview.input?.asset) ??
          'var(--border-color)',
        '--right-border':
          this.assetColorPalette(overview.output?.asset) ??
          'var(--border-color)',
      }
    },
    overviewBubbleItems() {
      const overview = this.activeOverview
      if (!overview) return []
      const items = []
      const typeTitle = overview.actionTypeTitle || ''
      if (typeTitle) {
        const typeKey = this.getBubbleTypeFromTitle(typeTitle)
        items.push({
          label: this.$options.filters?.capitalize?.(typeTitle) ?? typeTitle,
          colorClass: this.bubbleTypeToColorClass(typeKey),
          icon:
            typeKey === 'swap'
              ? SwapIcon
              : typeKey === 'send'
                ? SendTypeIcon
                : null,
        })
      }
      const s = overview.status
      if (s) {
        if (s.tone === 'red') {
          items.push({
            label: s.label,
            colorClass: 'bubble-pill--red',
            icon: WarningIcon,
          })
        } else if (s.tone === 'yellow') {
          items.push({
            label: s.label,
            colorClass: 'bubble-pill--yellow',
            icon: ClockIcon,
          })
        } else {
          items.push({
            label: s.label,
            colorClass: 'bubble-pill--green',
            icon: CheckIcon,
          })
        }
      }
      ;(overview.labels || []).forEach((l) => {
        const isRefund = String(l).toLowerCase() === 'refund'
        items.push({
          label: l,
          colorClass: isRefund ? 'bubble-pill--yellow' : 'bubble-pill--grey',
          icon: isRefund ? RefreshIcon : null,
        })
      })
      return items
    },
    swapCardIndex() {
      if (!this.cards?.length) return -1
      return this.cards.findIndex((card) =>
        /swap/i.test(card?.details?.title || '')
      )
    },
    visibleCards() {
      if (!this.cards?.length) return []
      if (this.contractOverview) return [] // hide all contract cards when contractOverview is active
      if (!this.swapOverview) return this.cards
      return this.cards.filter((_, index) => index !== this.swapCardIndex)
    },
    swapOverview() {
      if (this.swapCardIndex < 0) return null

      const card = this.cards[this.swapCardIndex]
      const details = card?.details
      const middle = details?.overall?.middle || {}

      // Fall back to old UI for refunds, pending, or multiple outputs
      if (middle.fail || middle.refund || middle.pending) return null
      if ((details?.overall?.out?.length ?? 0) > 1) return null

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
      const inboundHeight = this.getNumericStackValue(
        inboundStacks,
        'Block Height'
      )
      const outboundHeight = this.getNumericStackValue(
        outboundStacks,
        'Executed at'
      )
      const inboundHash = this.getStackDisplayValue(inboundStacks, 'Hash')
      const outboundHash = this.getStackDisplayValue(outboundStacks, 'Hash')

      const settledSeconds =
        inboundHeight && outboundHeight && outboundHeight >= inboundHeight
          ? (outboundHeight - inboundHeight) * this.blockSeconds('THOR')
          : null

      const midgardSwap = (this.rawActions || []).find((a) => a.type === 'swap')
      const contractAction = (this.rawActions || []).find(
        (a) => a.type === 'contract'
      )
      const actionHeight = midgardSwap ? parseInt(midgardSwap.height) : null
      const outAssetStr = assetToString(outputAsset)
      const outHeights = (midgardSwap?.out || [])
        .filter((o) => !o.affiliate && o.coins?.[0]?.asset === outAssetStr)
        .map((o) => parseInt(o.height))
        .filter(Boolean)
      const latestOutHeight = outHeights.length ? Math.max(...outHeights) : null
      const duration =
        actionHeight && latestOutHeight && latestOutHeight >= actionHeight
          ? blockTime(latestOutHeight - actionHeight)
          : null

      const rate = this.getStackDisplayValue(actionStacks, 'Rate')
      const slip = this.getStackDisplayValue(actionStacks, 'Swap Slip')
      const affiliateBasis = this.getStackDisplayValue(
        actionStacks,
        'Affiliate Basis'
      )
      const liquidityFee = this.formatFeeDisplay(
        this.getStackDisplayValueByPrefix(actionStacks, 'Liquidity Fee')
      )
      const interfaceFee = this.formatFeeDisplay(
        this.getStackDisplayValue(actionStacks, 'Interface Fee')
      )
      const networkFees = outboundStacks
        .filter((stack) => stack.key === 'Outbound Fee' && stack.is)
        .map((stack) =>
          this.formatFeeDisplay(this.formatStackValue(stack.value))
        )
        .filter(Boolean)
      const contractActionType = this.getContractActionType(contractAction)

      // When the contract action is a Market Order (FIN DEX), extract the
      // true user-facing amounts from the contract events rather than using
      // the midgard amounts which only reflect the tiny THORChain-native leg.
      let contractDisplay = null
      if (contractAction && contractActionType) {
        const cEvents =
          contractAction.metadata?.contract?.contractEvents || []
        const cToAttrs = (e) =>
          Object.fromEntries(
            (e.attributes || []).map(({ key, value }) => [key, value])
          )
        // Prefer the swap action's sender; the contractAction.in address is often
        // the CosmWasm executor module account, not the actual user
        const cUserAddr =
          midgardSwap?.in?.[0]?.address ||
          contractAction.in?.[0]?.address ||
          ''

        // Input: prefer metadata.funds, fall back to first non-rune coin_spent by user
        let cFundsAmount = 0
        let cFundsDenom = ''
        const cFundsStr = contractAction.metadata?.contract?.funds || ''
        if (cFundsStr) {
          cFundsAmount = parseInt(cFundsStr) || 0
          cFundsDenom = cFundsStr.replace(/^\d+/, '').trim()
        }
        if (!cFundsAmount && cUserAddr) {
          const spentAttr = cEvents
            .filter((e) => e.type === 'coin_spent')
            .map(cToAttrs)
            .find(
              (a) =>
                a.spender === cUserAddr &&
                a.amount &&
                !/rune$/i.test(a.amount)
            )
          if (spentAttr) {
            cFundsAmount = parseInt(spentAttr.amount) || 0
            cFundsDenom = spentAttr.amount.replace(/^\d+/, '').trim()
          }
        }

        // Output: prefer bid sum from fin/trade events (actual DEX distribution),
        // fall back to coin_received by user for non-fin-trade contract actions
        const cReceivedByDenom = {}
        const finTradesForOutput = cEvents.filter(
          (e) => e.type === 'wasm-rujira-fin/trade'
        )
        if (finTradesForOutput.length > 0) {
          // bid = output token (base token) going to takers; only count real fills (offer > 0)
          // Infer output denom from the swap action's outbound asset
          const swapOutDenom =
            midgardSwap?.out
              ?.flatMap((o) => o.coins || [])
              .find((c) => c.asset)
              ?.asset?.toLowerCase() || ''
          finTradesForOutput.forEach((e) => {
            const a = cToAttrs(e)
            const bid = parseInt(a.bid || 0)
            const offer = parseInt(a.offer || 0)
            if (bid > 0 && offer > 0 && swapOutDenom) {
              cReceivedByDenom[swapOutDenom] =
                (cReceivedByDenom[swapOutDenom] || 0) + bid
            }
          })
        }
        if (Object.keys(cReceivedByDenom).length === 0 && cUserAddr) {
          // Fallback: aggregate coin_received by user
          cEvents
            .filter((e) => e.type === 'coin_received')
            .map(cToAttrs)
            .filter(
              (a) =>
                a.receiver === cUserAddr &&
                a.amount &&
                !/^[\d]+rune$/.test(a.amount)
            )
            .forEach((a) => {
              a.amount.split(',').forEach((part) => {
                const p = part.trim()
                const amt = parseInt(p) || 0
                const denom = p.replace(/^\d+/, '').trim()
                if (denom && amt > 0 && !/^rune$/i.test(denom))
                  cReceivedByDenom[denom] =
                    (cReceivedByDenom[denom] || 0) + amt
              })
            })
        }
        const cOutDenoms = Object.keys(cReceivedByDenom)
        const cPrimaryDenom =
          cOutDenoms.find((d) => d !== cFundsDenom) || cOutDenoms[0] || ''
        const cReceivedAmt = cReceivedByDenom[cPrimaryDenom] || 0

        if (cFundsAmount > 0 || cReceivedAmt > 0) {
          const cInAssetStr = cFundsDenom
            ? securedToAsset(cFundsDenom).toUpperCase()
            : ''
          // Preserve secure: true flag for badge; fall back to converted form
          const cInAsset = cFundsDenom
            ? (assetFromString(cFundsDenom.toUpperCase()) ??
                assetFromString(cInAssetStr))
            : null
          const cInTicker = cInAsset?.ticker || cFundsDenom
          const cOutAssetStr = cPrimaryDenom
            ? securedToAsset(cPrimaryDenom).toUpperCase()
            : ''
          const cOutAsset = cPrimaryDenom
            ? (assetFromString(cPrimaryDenom.toUpperCase()) ??
                assetFromString(cOutAssetStr))
            : null
          const cOutTicker = cOutAsset?.ticker || cPrimaryDenom
          // Use historical prices from the swap event when available — these
          // reflect the asset prices at the time the contract executed, giving
          // accurate price impact and fee calculations rather than current prices.
          const swapMeta = midgardSwap?.metadata?.swap
          const cInUsdRaw = swapMeta?.inPriceUSD
            ? (cFundsAmount / 1e8) * parseFloat(swapMeta.inPriceUSD)
            : this.amountToUSD(cInAssetStr, cFundsAmount, this.pools)
          const cOutUsdRaw = swapMeta?.outPriceUSD
            ? (cReceivedAmt / 1e8) * parseFloat(swapMeta.outPriceUSD)
            : this.amountToUSD(cOutAssetStr, cReceivedAmt, this.pools)
          contractDisplay = {
            inputAsset: cInAssetStr || null,
            inputName:
              this.getAssetDisplayName(cInAssetStr) || cInTicker || 'Input',
            inputBadge: this.getNetworkBadge(cInAsset) || '',
            inputAmount: cFundsAmount
              ? `${this.baseAmountFormatOrZero(cFundsAmount)} ${cInTicker}`
              : '-',
            inputUsd: this.formatUsdValue(cInUsdRaw),
            inputUsdRaw: cInUsdRaw,
            outputAsset: cOutAssetStr || null,
            outputName:
              this.getAssetDisplayName(cOutAssetStr) || cOutTicker || 'Output',
            outputBadge: this.getNetworkBadge(cOutAsset) || '',
            outputAmount: cReceivedAmt
              ? `${this.baseAmountFormatOrZero(cReceivedAmt)} ${cOutTicker}`
              : '-',
            outputUsd: this.formatUsdValue(cOutUsdRaw),
            outputUsdRaw: cOutUsdRaw,
            inAmt: cFundsAmount / 1e8,
            outAmt: cReceivedAmt / 1e8,
            inTicker: cInTicker,
            outTicker: cOutTicker,
            inputSecure: cInAsset?.secure ?? false,
          }
        }
      }

      const inAmt = contractDisplay
        ? contractDisplay.inAmt
        : parseFloat(input.amount) / 1e8
      const outAmt = contractDisplay
        ? contractDisplay.outAmt
        : parseFloat(output.amount) / 1e8
      const rateInTicker = contractDisplay
        ? contractDisplay.inTicker
        : inputAsset?.ticker || ''
      const rateOutTicker = contractDisplay
        ? contractDisplay.outTicker
        : outputAsset?.ticker || ''
      const computedRate =
        inAmt > 0 && outAmt > 0
          ? `1 ${rateInTicker} = ${this.decimalFormat(outAmt / inAmt)} ${rateOutTicker}`
          : null
      const computedRateFlipped =
        inAmt > 0 && outAmt > 0
          ? `1 ${rateOutTicker} = ${this.decimalFormat(inAmt / outAmt)} ${rateInTicker}`
          : null
      const displayInputAmount = contractDisplay
        ? contractDisplay.inputAmount
        : this.formatAssetAmount(input.amount, input.asset)
      const displayOutputAmount = contractDisplay
        ? contractDisplay.outputAmount
        : this.formatAssetAmount(output.amount, output.asset)
      return {
        title: contractActionType
          ? `${contractActionType}: ${displayInputAmount} for ${displayOutputAmount}`
          : `Swapped ${displayInputAmount} for ${displayOutputAmount}`,
        metaLabel: `${contractActionType || this.getSwapActionLabel(inputAsset, outputAsset)} · ${this.getSwapProductLabel(contractAction)}`,
        hasContractAction: !!contractAction,
        status,
        affiliateAddress: details?.interface || '',
        actionTypeTitle: details?.title || '',
        labels: details?.labels || [],
        input: contractDisplay
          ? {
              asset: contractDisplay.inputAsset,
              name: contractDisplay.inputName,
              badge: contractDisplay.inputBadge,
              amount: contractDisplay.inputAmount,
              usd: contractDisplay.inputUsd,
              txId: inboundHash,
              secure: contractDisplay.inputSecure ?? false,
            }
          : {
              asset: input.asset,
              name: this.getAssetDisplayName(input.asset),
              badge: this.getNetworkBadge(inputAsset),
              amount: this.formatAssetAmount(input.amount, input.asset),
              usd: this.formatUsdValue(input.amountUSD),
              txId: inboundHash,
            },
        output: contractDisplay
          ? {
              asset: contractDisplay.outputAsset,
              name: contractDisplay.outputName,
              badge: contractDisplay.outputBadge,
              amount: contractDisplay.outputAmount,
              usd: contractDisplay.outputUsd,
              txId: outboundHash,
            }
          : {
              asset: output.asset,
              name: this.getAssetDisplayName(output.asset),
              badge: this.getNetworkBadge(outputAsset),
              amount: this.formatAssetAmount(output.amount, output.asset),
              usd: this.formatUsdValue(output.amountUSD),
              txId: outboundHash,
            },
        metricRows: (() => {
          const base = [
            !contractDisplay && slip
              ? { label: 'Slippage', value: slip }
              : null,
            duration ? { label: 'Settled In', value: duration } : null,
            settledSeconds
              ? {
                  label: 'Settled In',
                  value: moment.duration(settledSeconds, 'seconds').humanize(),
                }
              : null,
          ].filter(Boolean)

          const cEvents =
            contractAction?.metadata?.contract?.contractEvents || []
          const strategyCount = cEvents.filter(
            (e) => e.type === 'wasm-calc-manager/strategy.execute'
          ).length
          const finPairs = new Set(
            cEvents
              .filter((e) => e.type === 'wasm-rujira-fin/trade')
              .map(
                (e) =>
                  Object.fromEntries(
                    (e.attributes || []).map(({ key, value }) => [key, value])
                  )._contract_address
              )
              .filter(Boolean)
          ).size
          if (strategyCount > 0)
            base.push({ label: 'Strategies', value: String(strategyCount) })
          if (finPairs > 0)
            base.push({ label: 'FIN Pairs', value: String(finPairs) })
          const showPriceImpact = contractDisplay || base.length < 3
          if (showPriceImpact) {
            const inUsd = contractDisplay
              ? contractDisplay.inputUsdRaw || 0
              : parseFloat(input.amountUSD) || 0
            const outUsd = contractDisplay
              ? contractDisplay.outputUsdRaw || 0
              : parseFloat(output.amountUSD) || 0
            if (inUsd > 0 && outUsd > 0) {
              const impact = ((outUsd / inUsd - 1) * 100).toFixed(2)
              const sign = parseFloat(impact) > 0 ? '+' : ''
              base.unshift({
                label: 'Price Impact',
                value: `${sign}${impact}%`,
              })
            }
          }
          return base
        })(),
        detailRows: (() => {
          const rows = [
            {
              label: 'Product',
              value: this.getSwapProductLabel(contractAction),
              tone: this.getProductTone(
                this.getSwapProductLabel(contractAction)
              ),
              type: 'product',
            },
            contractActionType
              ? {
                  label: 'Action',
                  value: contractActionType,
                  tone: this.getContractTypeTone(contractActionType),
                  type: 'product',
                }
              : {
                  label: 'Action',
                  value: this.getSwapActionLabel(inputAsset, outputAsset),
                },
            contractAction
              ? {
                  label: 'Contract',
                  value:
                    getRujiraContractLabel(contractAction?.out?.[0]?.address) ||
                    this.formatAddress(contractAction?.out?.[0]?.address),
                }
              : null,
            computedRate || rate
              ? {
                  label: 'Exchange Rate',
                  value: computedRate || rate,
                  valueFlipped: computedRateFlipped,
                  type: 'exchange-rate',
                }
              : null,
            { label: 'Status', value: status.label, type: 'status' },
            {
              label: 'Time',
              value:
                this.getStackDisplayValue(actionStacks, 'Timestamp') || '-',
            },
            {
              label: 'Block',
              value: (() => {
                const h = parseInt(
                  contractAction?.height || midgardSwap?.height
                )
                return h ? `#${this.normalFormat(h)}` : '-'
              })(),
            },
            {
              label: 'User',
              address:
                contractAction?.in?.[0]?.address ||
                this.thorStatus?.tx?.from_address,
              type: 'address',
            },
          ]

          if (
            contractAction &&
            (contractActionType === 'Limit Order' ||
              contractActionType === 'Market Order')
          ) {
            const cEvents =
              contractAction.metadata?.contract?.contractEvents || []
            const toAttrs = (e) =>
              Object.fromEntries(
                (e.attributes || []).map(({ key, value }) => [key, value])
              )

            const firstTrade = cEvents.find(
              (e) => e.type === 'wasm-rujira-fin/trade'
            )
            if (firstTrade) {
              const pairAddr = toAttrs(firstTrade)._contract_address || ''
              const pairLabel =
                getRujiraContractLabel(pairAddr) || this.formatAddress(pairAddr)
              rows.push({ label: 'FIN Pair', value: pairLabel })
            }

            if (contractActionType === 'Limit Order') {
              const msg = contractAction.metadata?.contract?.msg || {}
              const fixedPrice = msg.order?.[0]?.[0]?.[1]?.fixed
              const side = msg.order?.[0]?.[0]?.[0]
              const orderWithdraw = cEvents.find(
                (e) => e.type === 'wasm-rujira-fin/order.withdraw'
              )
              const withdrawAttrs = orderWithdraw ? toAttrs(orderWithdraw) : {}
              const limitPrice =
                fixedPrice || withdrawAttrs.price?.split(':')?.[1] || null
              const orderSide = side || withdrawAttrs.side || null
              const fillAmount = withdrawAttrs.amount || null

              if (orderSide)
                rows.push({
                  label: 'Side',
                  value:
                    orderSide === 'quote'
                      ? 'Buy'
                      : orderSide === 'base'
                        ? 'Sell'
                        : orderSide,
                })
              if (limitPrice)
                rows.push({
                  label: 'Limit Price',
                  value: parseFloat(limitPrice).toPrecision(6),
                })
              if (fillAmount)
                rows.push({ label: 'Filled Amount', value: fillAmount })
            } else {
              const tradeEvents = cEvents.filter(
                (e) => e.type === 'wasm-rujira-fin/trade'
              )
              const avgRate = (() => {
                let wSum = 0
                let wTotal = 0
                tradeEvents.forEach((e) => {
                  const a = toAttrs(e)
                  const r = parseFloat(a.rate)
                  const w = parseInt(a.bid || 0)
                  if (!isNaN(r) && w > 0) {
                    wSum += r * w
                    wTotal += w
                  }
                })
                if (wTotal > 0) return (wSum / wTotal).toFixed(6)
                const rs = tradeEvents
                  .map((e) => parseFloat(toAttrs(e).rate))
                  .filter((r) => !isNaN(r))
                return rs.length
                  ? (rs.reduce((s, r) => s + r, 0) / rs.length).toFixed(6)
                  : null
              })()
              rows.push({
                label: 'CCL Fills',
                value: String(tradeEvents.length),
              })
              if (avgRate) rows.push({ label: 'Avg Rate', value: avgRate })
            }
          }

          return rows.filter(Boolean)
        })(),
        lifecycleRows: (() => {
          if (contractDisplay) {
            const userAddr =
              contractAction?.in?.[0]?.address ||
              this.thorStatus?.tx?.from_address ||
              ''
            const timeText = this.getStackDisplayValue(
              actionStacks,
              'Timestamp'
            )
            const contractFailed = (contractAction?.metadata?.contract?.code ?? 0) > 0
            const contractLogs = contractAction?.metadata?.contract?.logs
            return [
              {
                icon: 'ArrowIcon',
                iconRotate: 180,
                title: `${contractDisplay.inputName} sent to contract`,
                body: `${contractDisplay.inputAmount}${contractDisplay.inputUsd ? ` (${contractDisplay.inputUsd})` : ''} provided as input${userAddr ? ` from ${this.formatAddress(userAddr)}` : ''}.`,
                meta: [
                  timeText,
                  inboundHeight
                    ? `Block #${this.normalFormat(inboundHeight)}`
                    : '',
                ]
                  .filter(Boolean)
                  .join(' · '),
              },
              ...this.extractContractEventRows(contractAction),
              contractFailed
                ? {
                    icon: 'WarningIcon',
                    title: 'Contract execution failed',
                    body: contractLogs || '',
                  }
                : {
                    icon: 'ArrowIcon',
                    iconRotate: 0,
                    title: `${contractDisplay.outputName} delivered`,
                    body: `${contractDisplay.outputAmount}${contractDisplay.outputUsd ? ` (${contractDisplay.outputUsd})` : ''} sent to ${this.formatAddress(userAddr)}.`,
                    meta: outboundHeight
                      ? `Block #${this.normalFormat(outboundHeight)}`
                      : '',
                  },
            ]
          }
          return this.buildLifecycleRows({
            input,
            output,
            inboundHeight,
            outboundHeight,
            actionStacks,
            inboundStacks,
            outboundStacks,
            inputAsset,
            outputAsset,
            action: contractAction,
          })
        })(),
        feeRows: (() => {
          const toRow = (label, formatted) => {
            const { usd, subtle } = this.splitFeeValue(formatted)
            return { label, usd, subtle }
          }

          if (contractDisplay) {
            const inUsd = contractDisplay.inputUsdRaw || 0
            const outUsd = contractDisplay.outputUsdRaw || 0
            const totalCost = inUsd - outUsd

            const rows = networkFees.map((value, i) =>
              toRow(i === 0 ? 'Network Fee' : `Network Fee ${i + 1}`, value)
            )

            const networkFeesUsd = rows.reduce(
              (sum, r) => sum + this.parseUsdAmount(r.usd),
              0
            )
            const dexCost = totalCost - networkFeesUsd
            if (dexCost > 0) {
              rows.push({
                label: 'DEX Cost',
                usd: `$${this.formatFeeDisplay(dexCost)}`,
                subtle: null,
              })
            }

            const totalPct =
              inUsd > 0 && totalCost > 0
                ? `${((totalCost / inUsd) * 100).toFixed(3)}% of swap value`
                : null
            rows.push({
              label: 'Total Fees Paid',
              usd: `$${this.formatFeeDisplay(Math.max(totalCost, 0))}`,
              subtle: totalPct,
              isTotal: true,
            })

            return rows
          }

          const rows = [
            ...networkFees.map((value, i) =>
              toRow(i === 0 ? 'Network Fee' : `Network Fee ${i + 1}`, value)
            ),
            liquidityFee ? toRow('Liquidity Fee', liquidityFee) : null,
            toRow('Affiliate Fee', interfaceFee || null),
          ].filter(Boolean)

          const totalUsd = rows.reduce(
            (sum, r) => sum + this.parseUsdAmount(r.usd),
            0
          )
          const inputUsdNum = this.parseUsdAmount(
            this.formatUsdValue(input.amountUSD)
          )
          const totalPct =
            inputUsdNum > 0
              ? `${((totalUsd / inputUsdNum) * 100).toFixed(3)}% of swap value`
              : null

          rows.push({
            label: 'Total Fees Paid',
            usd: `$${this.formatFeeDisplay(totalUsd)}`,
            subtle: totalPct,
            isTotal: true,
          })

          return rows
        })(),
        technicalRows: [
          this.buildTechRow(
            'From address',
            contractAction?.in?.[0]?.address ||
              this.getStackDisplayValue(inboundStacks, 'From'),
            'address'
          ),
          this.buildTechRow(
            'To address',
            contractAction?.out?.[0]?.address ||
              this.getStackDisplayValue(outboundStacks, 'Destination'),
            'address'
          ),
          this.buildTechRow(
            'Memo',
            this.getStackDisplayValue(actionStacks, 'Memo')
          ),
          this.buildTechRow(
            'Inbound stage',
            this.getStackDisplayValue(inboundStacks, 'Inbound Stage')
          ),
          this.buildTechRow('Exchange rate', rate),
          this.buildTechRow('Affiliate basis', affiliateBasis),
          this.buildTechRow(
            'Limit',
            this.getStackDisplayValue(actionStacks, 'Limit')
          ),
        ].filter(Boolean),
      }
    },
    contractOverview() {
      if (!this.rawActions?.length) return null

      // Applies when all actions are contract, or contract + refund combination
      const contractActions = this.rawActions.filter(
        (a) => a.type === 'contract'
      )
      if (contractActions.length === 0) return null
      if (
        this.rawActions.some(
          (a) => a.type !== 'contract' && a.type !== 'refund'
        )
      )
        return null

      // Limit order placement: single contract action with msg.order
      const singleAction =
        contractActions.length === 1 ? contractActions[0] : null
      const limitOrderMsg = singleAction?.metadata?.contract?.msg?.order
      if (limitOrderMsg) {
        const action = singleAction
        const orders = limitOrderMsg[0] || []
        const contractAddress = action.out?.[0]?.address || ''
        const contractLabel =
          getRujiraContractLabel(contractAddress) ||
          this.formatAddress(contractAddress)
        const userAddress = action.in?.[0]?.address || ''
        const hasError = (action.metadata?.contract?.code ?? 0) > 0
        const logs = action.metadata?.contract?.logs
        const status = hasError
          ? { label: 'Failed', tone: 'red' }
          : action.status === 'success'
            ? { label: 'Success', tone: 'green' }
            : { label: 'Pending', tone: 'blue' }
        const date = action.date
        const timestamp = date ? moment.unix(parseInt(date) / 1e9) : null
        const height = parseInt(action.height)
        const orderCount = orders.length
        const prices = orders
          .map(([, priceSpec]) => parseFloat(priceSpec?.fixed))
          .filter((p) => !isNaN(p))
        const priceList = prices.map((p) => p.toFixed(2)).join(', ')
        const productLabel =
          getRujiraContractProduct(contractAddress) || 'RUJI Trade'

        // Detect immediate CCL fills on placement
        const events = action.metadata?.contract?.contractEvents || []
        const toAttrs = (e) =>
          Object.fromEntries(
            (e.attributes || []).map(({ key, value }) => [key, value])
          )
        const cclFills = events
          .filter((e) => e.type === 'wasm-rujira-fin/trade')
          .map(toAttrs)
          .filter((a) => String(a.price || '').startsWith('ccl:'))
        const cclFillCount = cclFills.length
        const fillRates = cclFills
          .map((a) => parseFloat(a.rate))
          .filter((r) => !isNaN(r))
        const avgFillRate = fillRates.length
          ? fillRates.reduce((s, r) => s + r, 0) / fillRates.length
          : null

        const titleSuffix = cclFillCount
          ? ` · ${cclFillCount} fill${cclFillCount !== 1 ? 's' : ''} at avg ${avgFillRate.toFixed(2)}`
          : ''

        return {
          title: `${orderCount} Limit Order${orderCount !== 1 ? 's' : ''} placed on ${contractLabel}${titleSuffix}`,
          metaLabel: `Limit Order · ${contractLabel}`,
          status,
          affiliateAddress: '',
          actionTypeTitle: 'contract',
          hasContractAction: true,
          labels: [],
          input: {
            asset: null,
            name: 'User',
            badge: userAddress ? this.formatAddress(userAddress) : '',
            amount: `${orderCount} order${orderCount !== 1 ? 's' : ''}`,
            usd: null,
          },
          output: {
            asset: null,
            name: 'FIN Pair',
            badge: contractLabel,
            amount: cclFillCount
              ? `${cclFillCount} fill${cclFillCount !== 1 ? 's' : ''} · avg ${avgFillRate.toFixed(2)}`
              : priceList
                ? `At ${priceList}`
                : 'Placed',
            usd: null,
          },
          metricRows: [
            { label: 'Orders Placed', value: `${orderCount}` },
            priceList ? { label: 'Limit Prices', value: priceList } : null,
            cclFillCount
              ? { label: 'Immediate Fills', value: `${cclFillCount}` }
              : null,
            avgFillRate
              ? { label: 'Avg Fill Rate', value: avgFillRate.toFixed(6) }
              : null,
            timestamp
              ? {
                  label: 'Time',
                  value: timestamp.format('YYYY-MM-DD HH:mm:ss'),
                }
              : null,
          ].filter(Boolean),
          detailRows: [
            {
              label: 'Product',
              value: productLabel,
              tone: this.getProductTone(productLabel),
              type: 'product',
            },
            {
              label: 'Action',
              value: 'Limit Order',
              tone: this.getContractTypeTone('Limit Order'),
              type: 'product',
            },
            { label: 'Contract', value: contractLabel },
            { label: 'Status', value: status.label, type: 'status' },
            timestamp
              ? { label: 'Time', value: timestamp.format('lll') }
              : null,
            height
              ? { label: 'Block', value: `#${this.normalFormat(height)}` }
              : null,
            userAddress
              ? { label: 'User', address: userAddress, type: 'address' }
              : null,
          ].filter(Boolean),
          lifecycleRows: [
            {
              icon: 'CheckIcon',
              title: `${orderCount} limit order${orderCount !== 1 ? 's' : ''} submitted`,
              body: priceList ? `Fixed prices: ${priceList}` : '',
            },
            ...this.extractContractEventRows(action),
            ...(hasError && logs ? [{ icon: 'WarningIcon', title: 'Contract execution failed', body: logs }] : []),
          ],
          feeRows: [],
          technicalRows: [
            userAddress
              ? this.buildTechRow('From address', userAddress, 'address')
              : null,
            contractAddress
              ? this.buildTechRow('To address', contractAddress, 'address')
              : null,
          ].filter(Boolean),
        }
      }

      // Cancel strategy: single contract action with msg.cancel_instance
      const cancelMsg = singleAction?.metadata?.contract?.msg?.cancel_instance
      if (cancelMsg) {
        const action = singleAction
        const contractAddress = action.out?.[0]?.address || ''
        const contractLabel =
          getRujiraContractLabel(contractAddress) ||
          this.formatAddress(contractAddress)
        const productLabel =
          getRujiraContractProduct(contractAddress) || 'AutoRujira'
        const userAddress = action.in?.[0]?.address || ''
        const instanceId = cancelMsg.instance_id
        const hasError = (action.metadata?.contract?.code ?? 0) > 0
        const logs = action.metadata?.contract?.logs
        const status = hasError
          ? { label: 'Failed', tone: 'red' }
          : action.status === 'success'
            ? { label: 'Success', tone: 'green' }
            : { label: 'Pending', tone: 'blue' }
        const date = action.date
        const timestamp = date ? moment.unix(parseInt(date) / 1e9) : null
        const height = parseInt(action.height)

        return {
          title: `Strategy #${instanceId} cancelled`,
          metaLabel: `Cancel Strategy · ${productLabel}`,
          status,
          affiliateAddress: '',
          actionTypeTitle: 'contract',
          hasContractAction: true,
          labels: [],
          input: {
            asset: null,
            name: 'User',
            badge: userAddress ? this.formatAddress(userAddress) : '',
            amount: `Instance #${instanceId}`,
            usd: null,
          },
          output: {
            asset: null,
            name: productLabel,
            badge: contractLabel,
            amount: 'Cancelled',
            usd: null,
          },
          metricRows: [
            { label: 'Instance ID', value: `#${instanceId}` },
            timestamp
              ? {
                  label: 'Time',
                  value: timestamp.format('YYYY-MM-DD HH:mm:ss'),
                }
              : null,
          ].filter(Boolean),
          detailRows: [
            {
              label: 'Product',
              value: productLabel,
              tone: this.getProductTone(productLabel),
              type: 'product',
            },
            {
              label: 'Action',
              value: 'Cancel Strategy',
              tone: this.getContractTypeTone('Cancel Strategy'),
              type: 'product',
            },
            { label: 'Contract', value: contractLabel },
            { label: 'Instance ID', value: `#${instanceId}` },
            { label: 'Status', value: status.label, type: 'status' },
            timestamp
              ? { label: 'Time', value: timestamp.format('lll') }
              : null,
            height
              ? { label: 'Block', value: `#${this.normalFormat(height)}` }
              : null,
            userAddress
              ? { label: 'User', address: userAddress, type: 'address' }
              : null,
          ].filter(Boolean),
          lifecycleRows: [
            {
              icon: 'CheckIcon',
              title: `Strategy #${instanceId} cancelled`,
              body: `Workflow instance cancelled on ${productLabel}`,
            },
            ...(hasError && logs ? [{ icon: 'WarningIcon', title: 'Contract execution failed', body: logs }] : []),
          ],
          feeRows: [],
          technicalRows: [
            userAddress
              ? this.buildTechRow('From address', userAddress, 'address')
              : null,
            contractAddress
              ? this.buildTechRow('To address', contractAddress, 'address')
              : null,
          ].filter(Boolean),
        }
      }

      // FIN market swap: single contract action with msg.swap
      const swapMsg = singleAction?.metadata?.contract?.msg?.swap
      if (swapMsg) {
        const action = singleAction
        const contractAddress = action.out?.[0]?.address || ''
        const contractLabel =
          getRujiraContractLabel(contractAddress) ||
          this.formatAddress(contractAddress)
        const productLabel =
          getRujiraContractProduct(contractAddress) || 'RUJI Trade'
        const userAddress = action.in?.[0]?.address || ''
        const hasError = (action.metadata?.contract?.code ?? 0) > 0
        const logs = action.metadata?.contract?.logs
        const status = hasError
          ? { label: 'Failed', tone: 'red' }
          : action.status === 'success'
            ? { label: 'Success', tone: 'green' }
            : { label: 'Pending', tone: 'blue' }
        const date = action.date
        const timestamp = date ? moment.unix(parseInt(date) / 1e9) : null
        const height = parseInt(action.height)
        const events = action.metadata?.contract?.contractEvents || []
        const toAttrs = (e) =>
          Object.fromEntries(
            (e.attributes || []).map(({ key, value }) => [key, value])
          )
        const fundsStr = action.metadata?.contract?.funds || ''
        const fundsAmount = parseInt(fundsStr) || 0
        const fundsAsset = fundsStr.replace(/^[\d]+/, '').trim()

        const tradeEvents = events.filter(
          (e) => e.type === 'wasm-rujira-fin/trade'
        )
        const avgRate = (() => {
          let wSum = 0
          let wTotal = 0
          tradeEvents.forEach((e) => {
            const a = toAttrs(e)
            const r = parseFloat(a.rate)
            const w = parseInt(a.bid || 0)
            if (!isNaN(r) && w > 0) {
              wSum += r * w
              wTotal += w
            }
          })
          if (wTotal > 0) return wSum / wTotal
          const rs = tradeEvents
            .map((e) => parseFloat(toAttrs(e).rate))
            .filter((r) => !isNaN(r))
          return rs.length ? rs.reduce((s, r) => s + r, 0) / rs.length : null
        })()

        // Collect all coin_received for the user, group by denom and sum
        const receivedByDenom = {}
        events
          .filter((e) => e.type === 'coin_received')
          .map(toAttrs)
          .filter(
            (a) =>
              a.receiver === userAddress &&
              a.amount &&
              !/^[\d]+rune$/.test(a.amount)
          )
          .forEach((a) => {
            a.amount.split(',').forEach((part) => {
              const p = part.trim()
              const amt = parseInt(p) || 0
              const denom = p.replace(/^\d+/, '').trim()
              if (denom && amt > 0 && !/^rune$/i.test(denom))
                receivedByDenom[denom] = (receivedByDenom[denom] || 0) + amt
            })
          })

        // Prefer non-input denom (output asset), fall back to any received denom
        const outputDenoms = Object.keys(receivedByDenom)
        const primaryDenom =
          outputDenoms.find((d) => d !== fundsAsset) || outputDenoms[0] || ''
        const receivedAmount = receivedByDenom[primaryDenom] || 0
        const receivedAssetDenom = primaryDenom

        const fundsAssetStr = fundsAsset
          ? securedToAsset(fundsAsset).toUpperCase()
          : ''
        // Parse raw denom first so secure: true is preserved for badge display,
        // fall back to the securedToAsset version for non-secured denoms
        const fundsAssetParsed = fundsAsset
          ? (assetFromString(fundsAsset.toUpperCase()) ??
              assetFromString(fundsAssetStr))
          : null
        const fundsTicker = fundsAssetParsed?.ticker || fundsAsset

        const receivedAssetStr = receivedAssetDenom
          ? securedToAsset(receivedAssetDenom).toUpperCase()
          : ''
        const receivedAssetParsed = receivedAssetDenom
          ? (assetFromString(receivedAssetDenom.toUpperCase()) ??
              assetFromString(receivedAssetStr))
          : null
        const receivedTicker = receivedAssetParsed?.ticker || receivedAssetDenom

        const returnedAmount = receivedByDenom[fundsAsset] || 0
        const filledAmount = fundsAmount - returnedAmount
        const isPartialFill = returnedAmount > 0 && filledAmount > 0

        const refundAction = this.rawActions.find((a) => a.type === 'refund')
        const refundReason = refundAction?.metadata?.refund?.reason || null

        return {
          title: `Market Order: ${contractLabel}`,
          metaLabel: `Market Order · ${productLabel}`,
          status,
          affiliateAddress: '',
          actionTypeTitle: 'contract',
          hasContractAction: true,
          labels: isPartialFill ? ['Partial Fill'] : [],
          input: {
            asset: fundsAssetParsed ? fundsAssetStr : null,
            name: fundsTicker || 'Input',
            badge: this.getNetworkBadge(fundsAssetParsed) || '',
            amount: fundsAmount
              ? `${this.baseAmountFormatOrZero(fundsAmount)} ${fundsTicker}`
              : '-',
            usd: this.formatUsdValue(
              this.amountToUSD(fundsAssetStr, fundsAmount, this.pools)
            ),
            secure: fundsAssetParsed?.secure ?? false,
          },
          output: {
            asset: receivedAssetParsed ? receivedAssetStr : null,
            name: receivedTicker || contractLabel,
            badge: this.getNetworkBadge(receivedAssetParsed) || productLabel,
            amount: receivedAmount
              ? `${this.baseAmountFormatOrZero(receivedAmount)} ${receivedTicker}`
              : avgRate
                ? `Rate ${avgRate.toFixed(6)}`
                : 'Filled',
            usd: receivedAmount
              ? this.formatUsdValue(
                  this.amountToUSD(receivedAssetStr, receivedAmount, this.pools)
                )
              : null,
          },
          returnedOutput: (() => {
            if (isPartialFill) {
              return {
                asset: fundsAssetParsed ? fundsAssetStr : null,
                name: fundsTicker,
                amount: `${this.baseAmountFormatOrZero(returnedAmount)} ${fundsTicker}`,
              }
            }
            if (refundAction) {
              const refundCoin = refundAction.out?.[0]?.coins?.[0]
              if (refundCoin) {
                const refundAssetStr = this.parseMemoAsset(refundCoin.asset)
                const refundAssetParsed = assetFromString(
                  refundAssetStr || refundCoin.asset
                )
                const refundTicker =
                  refundAssetParsed?.ticker || refundCoin.asset
                return {
                  asset: refundAssetStr || null,
                  name: refundTicker,
                  amount: `${this.baseAmountFormatOrZero(refundCoin.amount)} ${refundTicker}`,
                }
              }
            }
            return null
          })(),
          metricRows: [
            avgRate ? { label: 'Rate', value: avgRate.toFixed(6) } : null,
            tradeEvents.length
              ? { label: 'CCL Fills', value: String(tradeEvents.length) }
              : null,
            timestamp
              ? {
                  label: 'Time',
                  value: timestamp.format('YYYY-MM-DD HH:mm:ss'),
                }
              : null,
          ].filter(Boolean),
          detailRows: [
            {
              label: 'Product',
              value: productLabel,
              tone: this.getProductTone(productLabel),
              type: 'product',
            },
            {
              label: 'Action',
              value: isPartialFill ? 'Partial Fill' : 'Market Order',
              tone: this.getContractTypeTone('Market Order'),
              type: 'product',
            },
            { label: 'Contract', value: contractLabel },
            isPartialFill
              ? {
                  label: 'Filled',
                  value: `${this.baseAmountFormatOrZero(filledAmount)} ${fundsTicker}`,
                }
              : null,
            isPartialFill
              ? {
                  label: 'Returned',
                  value: `${this.baseAmountFormatOrZero(returnedAmount)} ${fundsTicker}`,
                }
              : null,
            { label: 'Status', value: status.label, type: 'status' },
            refundReason
              ? { label: 'THORChain Refund', value: refundReason }
              : null,
            timestamp
              ? { label: 'Time', value: timestamp.format('lll') }
              : null,
            height
              ? { label: 'Block', value: `#${this.normalFormat(height)}` }
              : null,
            userAddress
              ? { label: 'User', address: userAddress, type: 'address' }
              : null,
          ].filter(Boolean),
          lifecycleRows: [
            {
              icon: hasError ? 'WarningIcon' : 'CheckIcon',
              title: hasError ? 'Contract execution failed' : isPartialFill ? 'Market order partially filled' : 'Market order filled',
              body: hasError
                ? logs || ''
                : [
                    isPartialFill
                      ? `${this.baseAmountFormatOrZero(filledAmount)} ${fundsTicker} filled`
                      : fundsAmount
                        ? `${this.baseAmountFormatOrZero(fundsAmount)} ${fundsTicker} in`
                        : null,
                    receivedAmount
                      ? `${this.baseAmountFormatOrZero(receivedAmount)} ${receivedTicker} out`
                      : null,
                    avgRate ? `avg rate ${avgRate.toFixed(6)}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · '),
            },
            ...this.extractContractEventRows(action),
            isPartialFill
              ? {
                  icon: 'RefreshIcon',
                  iconRotate: 0,
                  title: 'Unfilled amount returned',
                  body: `${this.baseAmountFormatOrZero(returnedAmount)} ${fundsTicker} returned to sender`,
                }
              : null,
            refundAction
              ? {
                  icon: 'RefreshIcon',
                  iconRotate: 0,
                  title: 'THORChain swap refunded',
                  body: refundReason || 'THORChain leg was refunded',
                }
              : null,
          ].filter(Boolean),
          feeRows: [],
          technicalRows: [
            userAddress
              ? this.buildTechRow('From address', userAddress, 'address')
              : null,
            contractAddress
              ? this.buildTechRow('To address', contractAddress, 'address')
              : null,
          ].filter(Boolean),
        }
      }

      // Liquid bond / unbond
      const liquidMsg = singleAction?.metadata?.contract?.msg?.liquid
      if (liquidMsg && ('bond' in liquidMsg || 'unbond' in liquidMsg)) {
        const isBond = 'bond' in liquidMsg
        const action = singleAction
        const contractAddress = action.out?.[0]?.address || ''
        const contractLabel =
          getRujiraContractLabel(contractAddress) ||
          this.formatAddress(contractAddress)
        const productLabel =
          getRujiraContractProduct(contractAddress) || 'Utilities'
        const userAddress = action.in?.[0]?.address || ''
        const hasError = (action.metadata?.contract?.code ?? 0) > 0
        const logs = action.metadata?.contract?.logs
        const status = hasError
          ? { label: 'Failed', tone: 'red' }
          : action.status === 'success'
            ? { label: 'Success', tone: 'green' }
            : { label: 'Pending', tone: 'blue' }
        const date = action.date
        const timestamp = date ? moment.unix(parseInt(date) / 1e9) : null
        const height = parseInt(action.height)
        const events = action.metadata?.contract?.contractEvents || []
        const toAttrs = (e) =>
          Object.fromEntries(
            (e.attributes || []).map(({ key, value }) => [key, value])
          )
        const bondEvent = events.find(
          (e) =>
            e.type ===
            `wasm-rujira-staking/liquid.${isBond ? 'bond' : 'unbond'}`
        )
        const bondAttrs = bondEvent ? toAttrs(bondEvent) : {}
        const amountRaw = parseInt(
          bondAttrs.amount || action.metadata?.contract?.funds || 0
        )
        const sharesRaw = parseInt(bondAttrs.shares || 0)
        const fundsStr = action.metadata?.contract?.funds || ''
        const fundsAsset = fundsStr.replace(/^[\d]+/, '').trim()
        const actionType = isBond ? 'Liquid Bond' : 'Liquid Unbond'

        return {
          title: `${actionType}: ${contractLabel}`,
          metaLabel: `${actionType} · ${productLabel}`,
          status,
          affiliateAddress: '',
          actionTypeTitle: 'contract',
          hasContractAction: true,
          labels: [],
          input: {
            asset: null,
            name: 'User',
            badge: userAddress ? this.formatAddress(userAddress) : '',
            amount: amountRaw
              ? `${this.baseAmountFormatOrZero(amountRaw)} ${fundsAsset || 'tokens'}`
              : '-',
            usd: null,
          },
          output: {
            asset: null,
            name: contractLabel,
            badge: productLabel,
            amount: sharesRaw
              ? `${this.baseAmountFormatOrZero(sharesRaw)} shares`
              : isBond
                ? 'Bonded'
                : 'Unbonded',
            usd: null,
          },
          metricRows: [
            amountRaw
              ? {
                  label: isBond ? 'Amount Bonded' : 'Amount Unbonded',
                  value: `${this.baseAmountFormatOrZero(amountRaw)} ${fundsAsset}`,
                }
              : null,
            sharesRaw
              ? {
                  label: 'Shares',
                  value: this.baseAmountFormatOrZero(sharesRaw),
                }
              : null,
            timestamp
              ? {
                  label: 'Time',
                  value: timestamp.format('YYYY-MM-DD HH:mm:ss'),
                }
              : null,
          ].filter(Boolean),
          detailRows: [
            {
              label: 'Product',
              value: productLabel,
              tone: this.getProductTone(productLabel),
              type: 'product',
            },
            {
              label: 'Action',
              value: actionType,
              tone: this.getContractTypeTone(actionType),
              type: 'product',
            },
            { label: 'Contract', value: contractLabel },
            { label: 'Status', value: status.label, type: 'status' },
            timestamp
              ? { label: 'Time', value: timestamp.format('lll') }
              : null,
            height
              ? { label: 'Block', value: `#${this.normalFormat(height)}` }
              : null,
            userAddress
              ? { label: 'User', address: userAddress, type: 'address' }
              : null,
          ].filter(Boolean),
          lifecycleRows: [
            {
              icon: hasError ? 'WarningIcon' : 'CheckIcon',
              title: hasError ? 'Contract execution failed' : actionType,
              body: hasError
                ? logs || ''
                : [
                    amountRaw
                      ? `${this.baseAmountFormatOrZero(amountRaw)} ${fundsAsset} ${isBond ? 'deposited' : 'withdrawn'}`
                      : null,
                    sharesRaw
                      ? `${this.baseAmountFormatOrZero(sharesRaw)} shares ${isBond ? 'minted' : 'burned'}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' → '),
            },
          ],
          feeRows: [],
          technicalRows: [
            userAddress
              ? this.buildTechRow('From address', userAddress, 'address')
              : null,
            contractAddress
              ? this.buildTechRow('To address', contractAddress, 'address')
              : null,
          ].filter(Boolean),
        }
      }

      // Ghost Credit Account: msg.account dispatches sub-messages through a credit sub-account
      const creditAccountMsg = singleAction?.metadata?.contract?.msg?.account
      if (creditAccountMsg) {
        const action = singleAction
        const contractAddress = action.out?.[0]?.address || ''
        const contractLabel =
          getRujiraContractLabel(contractAddress) ||
          this.formatAddress(contractAddress)
        const productLabel =
          getRujiraContractProduct(contractAddress) || 'RUJI Money Market'
        const userAddress = action.in?.[0]?.address || ''
        const creditAccountAddr = creditAccountMsg.addr || ''
        const subMsgs = creditAccountMsg.msgs || []
        const hasError = (action.metadata?.contract?.code ?? 0) > 0
        const logs = action.metadata?.contract?.logs
        const status = hasError
          ? { label: 'Failed', tone: 'red' }
          : action.status === 'success'
            ? { label: 'Success', tone: 'green' }
            : { label: 'Pending', tone: 'blue' }
        const date = action.date
        const timestamp = date ? moment.unix(parseInt(date) / 1e9) : null
        const height = parseInt(action.height)
        const events = action.metadata?.contract?.contractEvents || []
        const toAttrs = (e) =>
          Object.fromEntries(
            (e.attributes || []).map(({ key, value }) => [key, value])
          )

        // Extract borrow sub-messages
        const borrowMsgs = subMsgs.filter((m) => m.borrow)
        const borrowEvent = events.find(
          (e) => e.type === 'wasm-rujira-ghost-credit/account.msg/borrow'
        )
        const borrowAttrs = borrowEvent ? toAttrs(borrowEvent) : {}
        const borrowAmountStr = borrowAttrs.amount || ''
        const borrowAmountRaw = parseInt(borrowAmountStr) || 0
        const borrowDenom =
          borrowAmountStr.replace(/^\d+/, '').trim() ||
          borrowMsgs[0]?.borrow?.denom ||
          ''
        const borrowAssetStr = borrowDenom
          ? securedToAsset(borrowDenom).toUpperCase()
          : ''
        const borrowAssetParsed = borrowAssetStr
          ? assetFromString(borrowAssetStr)
          : null
        const borrowTicker = borrowAssetParsed?.ticker || borrowDenom

        // Extract FIN trade fill (CCL or limit)
        const finTradeEvent = events.find(
          (e) => e.type === 'wasm-rujira-fin/trade'
        )
        const finAttrs = finTradeEvent ? toAttrs(finTradeEvent) : {}
        const finPairAddr = finAttrs._contract_address || ''
        const finPairLabel =
          getRujiraContractLabel(finPairAddr) || this.formatAddress(finPairAddr)
        const bidRaw = parseInt(finAttrs.bid || 0)
        const offerRaw = parseInt(finAttrs.offer || 0)
        const fillPrice = parseFloat(finAttrs.rate || 0)
        const isCCLFill = String(finAttrs.price || '').startsWith('ccl:')

        // Find the output asset received by the credit account
        const creditReceivedEvent = events.find(
          (e) =>
            e.type === 'coin_received' &&
            (e.attributes || []).some(
              (a) => a.key === 'receiver' && a.value === creditAccountAddr
            ) &&
            (e.attributes || []).some(
              (a) => a.key === 'amount' && !a.value.includes(borrowDenom)
            )
        )
        const outputAmountStr = creditReceivedEvent
          ? ((e) =>
              (e.attributes || []).find((a) => a.key === 'amount')?.value ||
              '')(creditReceivedEvent)
          : ''
        const outputRaw = parseInt(outputAmountStr) || 0
        const outputDenom = outputAmountStr.replace(/^\d+/, '').trim()
        const outputAssetStr = outputDenom
          ? securedToAsset(outputDenom).toUpperCase()
          : ''
        const outputAssetParsed = outputAssetStr
          ? assetFromString(outputAssetStr)
          : null
        const outputTicker = outputAssetParsed?.ticker || outputDenom

        // Retract event
        const retractEvent = events.find(
          (e) => e.type === 'wasm-rujira-fin/order.retract'
        )
        const retractAttrs = retractEvent ? toAttrs(retractEvent) : {}
        const retractAmount = parseInt(retractAttrs.amount || 0)

        const subMsgCount = subMsgs.length

        return {
          title: `Credit Account: ${this.formatAddress(creditAccountAddr)}`,
          metaLabel: `Credit Account · ${productLabel}`,
          status,
          affiliateAddress: '',
          actionTypeTitle: 'contract',
          hasContractAction: true,
          labels: [],
          input: {
            asset: borrowAssetParsed ? borrowAssetStr : null,
            name: borrowTicker || 'Borrowed',
            badge: borrowMsgs.length
              ? `${borrowMsgs.length} borrow${borrowMsgs.length !== 1 ? 's' : ''}`
              : '',
            amount: borrowAmountRaw
              ? this.baseAmountFormatOrZero(borrowAmountRaw)
              : '-',
            usd: null,
          },
          output: {
            asset: outputAssetParsed ? outputAssetStr : null,
            name: outputTicker || 'Received',
            badge: isCCLFill ? 'CCL fill' : finTradeEvent ? 'Limit fill' : '',
            amount: outputRaw ? this.baseAmountFormatOrZero(outputRaw) : '-',
            usd: null,
          },
          metricRows: [
            borrowAmountRaw
              ? {
                  label: 'Borrowed',
                  value: `${this.baseAmountFormatOrZero(borrowAmountRaw)} ${borrowTicker}`,
                }
              : null,
            outputRaw
              ? {
                  label: 'Received',
                  value: `${this.baseAmountFormatOrZero(outputRaw)} ${outputTicker}`,
                }
              : null,
            fillPrice
              ? { label: 'Fill price', value: fillPrice.toFixed(2) }
              : null,
            { label: 'Sub-messages', value: String(subMsgCount) },
            timestamp
              ? {
                  label: 'Time',
                  value: timestamp.format('YYYY-MM-DD HH:mm:ss'),
                }
              : null,
          ].filter(Boolean),
          detailRows: [
            {
              label: 'Product',
              value: productLabel,
              tone: this.getProductTone(productLabel),
              type: 'product',
            },
            {
              label: 'Action',
              value: 'Credit Account',
              tone: this.getContractTypeTone('Credit Account'),
              type: 'product',
            },
            { label: 'Contract', value: contractLabel },
            { label: 'Sub-messages', value: String(subMsgCount) },
            { label: 'Status', value: status.label, type: 'status' },
            timestamp
              ? { label: 'Time', value: timestamp.format('lll') }
              : null,
            height
              ? { label: 'Block', value: `#${this.normalFormat(height)}` }
              : null,
            userAddress
              ? { label: 'User', address: userAddress, type: 'address' }
              : null,
            creditAccountAddr
              ? {
                  label: 'Credit account',
                  address: creditAccountAddr,
                  type: 'address',
                }
              : null,
          ].filter(Boolean),
          lifecycleRows: [
            borrowAmountRaw
              ? {
                  icon: 'RefreshIcon',
                  title: 'Borrowed from Ghost Vault',
                  body: `${this.baseAmountFormatOrZero(borrowAmountRaw)} ${borrowTicker}`,
                }
              : null,
            finTradeEvent
              ? {
                  icon: 'ExchangeIcon',
                  title: `${isCCLFill ? 'CCL' : 'Limit'} fill: ${finPairLabel}`,
                  body: [
                    offerRaw ? `${offerRaw} ${borrowTicker} offered` : null,
                    bidRaw ? `${bidRaw} ${outputTicker} received` : null,
                    fillPrice ? `@ ${fillPrice.toFixed(2)}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · '),
                }
              : null,
            retractEvent
              ? {
                  icon: 'SubtractIcon',
                  title: 'Unfilled order retracted',
                  body: retractAmount
                    ? `${retractAmount} ${borrowTicker} returned`
                    : '',
                }
              : null,
            hasError && logs ? { icon: 'WarningIcon', title: 'Contract execution failed', body: logs } : null,
          ].filter(Boolean),
          feeRows: [],
          technicalRows: [
            userAddress
              ? this.buildTechRow('From address', userAddress, 'address')
              : null,
            creditAccountAddr
              ? this.buildTechRow(
                  'Credit account',
                  creditAccountAddr,
                  'address'
                )
              : null,
            contractAddress
              ? this.buildTechRow('To address', contractAddress, 'address')
              : null,
          ].filter(Boolean),
        }
      }

      // AutoRujira Reset Instance: msg.reset_instance
      const resetInstanceMsg =
        singleAction?.metadata?.contract?.msg?.reset_instance
      if (resetInstanceMsg) {
        const action = singleAction
        const contractAddress = action.out?.[0]?.address || ''
        const contractLabel =
          getRujiraContractLabel(contractAddress) ||
          this.formatAddress(contractAddress)
        const productLabel =
          getRujiraContractProduct(contractAddress) || 'AutoRujira'
        const callerAddress = action.in?.[0]?.address || ''
        const instanceId = resetInstanceMsg.instance_id
        const targetUser = resetInstanceMsg.user_address || ''
        const hasError = (action.metadata?.contract?.code ?? 0) > 0
        const logs = action.metadata?.contract?.logs
        const status = hasError
          ? { label: 'Failed', tone: 'red' }
          : action.status === 'success'
            ? { label: 'Success', tone: 'green' }
            : { label: 'Pending', tone: 'blue' }
        const date = action.date
        const timestamp = date ? moment.unix(parseInt(date) / 1e9) : null
        const height = parseInt(action.height)
        const events = action.metadata?.contract?.contractEvents || []
        const toAttrs = (e) =>
          Object.fromEntries(
            (e.attributes || []).map(({ key, value }) => [key, value])
          )
        const resetEvent = events.find(
          (e) => e.type === 'wasm-autorujira-workflow-manager/reset_instance'
        )
        const resetAttrs = resetEvent ? toAttrs(resetEvent) : {}
        const executionType = resetAttrs.execution_type || ''

        return {
          title: `Reset Instance #${instanceId}`,
          metaLabel: `Reset Instance · ${productLabel}`,
          status,
          affiliateAddress: '',
          actionTypeTitle: 'contract',
          hasContractAction: true,
          labels: [],
          input: {
            asset: null,
            name: productLabel,
            badge: contractLabel,
            amount: `Instance #${instanceId}`,
            usd: null,
          },
          output: {
            asset: null,
            name: 'User',
            badge: targetUser ? this.formatAddress(targetUser) : '',
            amount: executionType ? `${executionType} reset` : 'Reset',
            usd: null,
          },
          metricRows: [
            { label: 'Instance', value: `#${instanceId}` },
            executionType
              ? { label: 'Execution type', value: executionType }
              : null,
            timestamp
              ? {
                  label: 'Time',
                  value: timestamp.format('YYYY-MM-DD HH:mm:ss'),
                }
              : null,
          ].filter(Boolean),
          detailRows: [
            {
              label: 'Product',
              value: productLabel,
              tone: this.getProductTone(productLabel),
              type: 'product',
            },
            {
              label: 'Action',
              value: 'Reset Instance',
              tone: this.getContractTypeTone('Reset Instance'),
              type: 'product',
            },
            { label: 'Contract', value: contractLabel },
            { label: 'Instance ID', value: `#${instanceId}` },
            executionType
              ? { label: 'Execution type', value: executionType }
              : null,
            { label: 'Status', value: status.label, type: 'status' },
            timestamp
              ? { label: 'Time', value: timestamp.format('lll') }
              : null,
            height
              ? { label: 'Block', value: `#${this.normalFormat(height)}` }
              : null,
            targetUser
              ? { label: 'User', address: targetUser, type: 'address' }
              : null,
            callerAddress
              ? { label: 'Caller', address: callerAddress, type: 'address' }
              : null,
          ].filter(Boolean),
          lifecycleRows: [
            {
              icon: hasError ? 'WarningIcon' : 'RefreshIcon',
              title: hasError ? 'Contract execution failed' : `Instance #${instanceId} reset`,
              body: hasError
                ? logs || ''
                : [
                    executionType ? `Execution type: ${executionType}` : null,
                    targetUser ? `for ${this.formatAddress(targetUser)}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · '),
            },
          ],
          feeRows: [],
          technicalRows: [
            callerAddress
              ? this.buildTechRow('Caller address', callerAddress, 'address')
              : null,
            targetUser
              ? this.buildTechRow('User address', targetUser, 'address')
              : null,
            contractAddress
              ? this.buildTechRow('To address', contractAddress, 'address')
              : null,
          ].filter(Boolean),
        }
      }

      // Ghost Vault Withdraw / Deposit: msg.withdraw or msg.deposit
      const ghostVaultMsg = singleAction?.metadata?.contract?.msg
      const isGhostWithdraw = ghostVaultMsg && 'withdraw' in ghostVaultMsg
      const isGhostDeposit = ghostVaultMsg && 'deposit' in ghostVaultMsg
      if (isGhostWithdraw || isGhostDeposit) {
        const action = singleAction
        const contractAddress = action.out?.[0]?.address || ''
        const contractLabel =
          getRujiraContractLabel(contractAddress) ||
          this.formatAddress(contractAddress)
        const productLabel =
          getRujiraContractProduct(contractAddress) || 'RUJI Money Market'
        const userAddress = action.in?.[0]?.address || ''
        const hasError = (action.metadata?.contract?.code ?? 0) > 0
        const logs = action.metadata?.contract?.logs
        const status = hasError
          ? { label: 'Failed', tone: 'red' }
          : action.status === 'success'
            ? { label: 'Success', tone: 'green' }
            : { label: 'Pending', tone: 'blue' }
        const date = action.date
        const timestamp = date ? moment.unix(parseInt(date) / 1e9) : null
        const height = parseInt(action.height)
        const events = action.metadata?.contract?.contractEvents || []
        const toAttrs = (e) =>
          Object.fromEntries(
            (e.attributes || []).map(({ key, value }) => [key, value])
          )
        const vaultEvent = events.find(
          (e) =>
            e.type ===
            `wasm-rujira-ghost-vault/${isGhostWithdraw ? 'withdraw' : 'deposit'}`
        )
        const vaultAttrs = vaultEvent ? toAttrs(vaultEvent) : {}

        // Parse funds denom (e.g. "9158098048x/ghost-vault/eth-usdc-0xa...")
        const fundsStr = action.metadata?.contract?.funds || ''
        const fundsAmountRaw = parseInt(fundsStr) || 0
        const fundsDenom = fundsStr.replace(/^\d+/, '').trim()
        const vaultAssetName = fundsDenom.replace('x/ghost-vault/', '')

        // Find the coin_received event for the user to get the actual output denom
        const userCoinReceived = events.find(
          (e) =>
            e.type === 'coin_received' &&
            (e.attributes || []).some(
              (a) => a.key === 'receiver' && a.value === userAddress
            ) &&
            (e.attributes || []).some(
              (a) => a.key === 'amount' && !a.value.includes('ghost-vault')
            )
        )
        const userReceivedAmountStr = userCoinReceived
          ? ((e) =>
              (e.attributes || []).find((a) => a.key === 'amount')?.value ||
              '')(userCoinReceived)
          : ''
        const userReceivedDenom = userReceivedAmountStr
          .replace(/^\d+/, '')
          .trim()
        // Convert trade-asset denom (e.g. "eth-usdc-0xa...") to asset string ("ETH.USDC-0XA...")
        const underlyingAssetStr = userReceivedDenom
          ? securedToAsset(userReceivedDenom).toUpperCase()
          : vaultAssetName.toUpperCase()
        const underlyingAssetParsed = assetFromString(underlyingAssetStr)
        const underlyingTicker =
          underlyingAssetParsed?.ticker || underlyingAssetStr

        // Underlying amount from vault event
        const underlyingRaw = parseInt(vaultAttrs.amount || 0)
        const sharesRaw = parseInt(vaultAttrs.shares || fundsAmountRaw || 0)

        const actionType = isGhostWithdraw
          ? 'Ghost Vault Withdraw'
          : 'Ghost Vault Deposit'
        const vaultName =
          contractLabel.replace('rujira-ghost-vault:', '') || contractLabel

        return {
          title: `${actionType}: ${vaultName}`,
          metaLabel: `${actionType} · ${productLabel}`,
          status,
          affiliateAddress: '',
          actionTypeTitle: 'contract',
          hasContractAction: true,
          labels: [],
          input: {
            asset: null,
            name: isGhostWithdraw ? 'Shares burned' : 'User',
            badge: isGhostWithdraw
              ? vaultName
              : userAddress
                ? this.formatAddress(userAddress)
                : '',
            amount: isGhostWithdraw
              ? sharesRaw
                ? `${this.baseAmountFormatOrZero(sharesRaw)} shares`
                : '-'
              : fundsAmountRaw
                ? `${this.baseAmountFormatOrZero(fundsAmountRaw)} ${fundsDenom}`
                : '-',
            usd: null,
          },
          output: {
            asset: isGhostWithdraw
              ? underlyingAssetParsed
                ? underlyingAssetStr
                : null
              : null,
            name: isGhostWithdraw ? underlyingTicker : 'Shares minted',
            badge: isGhostWithdraw
              ? userAddress
                ? this.formatAddress(userAddress)
                : ''
              : vaultName,
            amount: isGhostWithdraw
              ? underlyingRaw
                ? this.baseAmountFormatOrZero(underlyingRaw)
                : 'Withdrawn'
              : sharesRaw
                ? `${this.baseAmountFormatOrZero(sharesRaw)} shares`
                : 'Deposited',
            usd: null,
          },
          metricRows: [
            sharesRaw
              ? {
                  label: 'Shares',
                  value: this.baseAmountFormatOrZero(sharesRaw),
                }
              : null,
            underlyingRaw
              ? {
                  label: isGhostWithdraw
                    ? 'Underlying Received'
                    : 'Underlying Deposited',
                  value: `${this.baseAmountFormatOrZero(underlyingRaw)} ${underlyingTicker}`,
                }
              : null,
            timestamp
              ? {
                  label: 'Time',
                  value: timestamp.format('YYYY-MM-DD HH:mm:ss'),
                }
              : null,
          ].filter(Boolean),
          detailRows: [
            {
              label: 'Product',
              value: productLabel,
              tone: this.getProductTone(productLabel),
              type: 'product',
            },
            {
              label: 'Action',
              value: actionType,
              tone: this.getContractTypeTone(actionType),
              type: 'product',
            },
            { label: 'Vault', value: vaultName },
            { label: 'Status', value: status.label, type: 'status' },
            timestamp
              ? { label: 'Time', value: timestamp.format('lll') }
              : null,
            height
              ? { label: 'Block', value: `#${this.normalFormat(height)}` }
              : null,
            userAddress
              ? { label: 'User', address: userAddress, type: 'address' }
              : null,
          ].filter(Boolean),
          lifecycleRows: [
            {
              icon: hasError ? 'WarningIcon' : isGhostWithdraw ? 'SubtractIcon' : 'AddIcon',
              title: hasError ? 'Contract execution failed' : actionType,
              body: hasError
                ? logs || ''
                : isGhostWithdraw
                  ? [
                      sharesRaw
                        ? `${this.baseAmountFormatOrZero(sharesRaw)} shares burned`
                        : null,
                      underlyingRaw
                        ? `${this.baseAmountFormatOrZero(underlyingRaw)} ${underlyingTicker} received`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' → ')
                  : [
                      fundsAmountRaw
                        ? `${this.baseAmountFormatOrZero(fundsAmountRaw)} ${fundsDenom} deposited`
                        : null,
                      sharesRaw
                        ? `${this.baseAmountFormatOrZero(sharesRaw)} shares minted`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' → '),
            },
          ],
          feeRows: [],
          technicalRows: [
            userAddress
              ? this.buildTechRow('From address', userAddress, 'address')
              : null,
            contractAddress
              ? this.buildTechRow('To address', contractAddress, 'address')
              : null,
          ].filter(Boolean),
        }
      }

      // CALC Scheduler batch execute: msg.execute is an array of instance IDs
      const batchExecuteMsg = singleAction?.metadata?.contract?.msg?.execute
      if (Array.isArray(batchExecuteMsg)) {
        const action = singleAction
        const contractAddress = action.out?.[0]?.address || ''
        const contractLabel =
          getRujiraContractLabel(contractAddress) ||
          this.formatAddress(contractAddress)
        const productLabel =
          getRujiraContractProduct(contractAddress) || 'Recurring Swaps'
        const userAddress = action.in?.[0]?.address || ''
        const instanceCount = batchExecuteMsg.length
        const hasError = (action.metadata?.contract?.code ?? 0) > 0
        const logs = action.metadata?.contract?.logs
        const status = hasError
          ? { label: 'Failed', tone: 'red' }
          : action.status === 'success'
            ? { label: 'Success', tone: 'green' }
            : { label: 'Pending', tone: 'blue' }
        const date = action.date
        const timestamp = date ? moment.unix(parseInt(date) / 1e9) : null
        const height = parseInt(action.height)

        return {
          title: `${instanceCount} ${instanceCount === 1 ? 'Strategy' : 'Strategies'} executed by ${contractLabel}`,
          metaLabel: `Execute Strategies · ${productLabel}`,
          status,
          affiliateAddress: '',
          actionTypeTitle: 'contract',
          hasContractAction: true,
          labels: [],
          input: {
            asset: null,
            name: 'Scheduler',
            badge: contractLabel,
            amount: `${instanceCount} instance${instanceCount !== 1 ? 's' : ''}`,
            usd: null,
          },
          output: {
            asset: null,
            name: productLabel,
            badge: userAddress ? this.formatAddress(userAddress) : '',
            amount: 'Dispatched',
            usd: null,
          },
          metricRows: [
            { label: 'Instances', value: String(instanceCount) },
            timestamp
              ? {
                  label: 'Time',
                  value: timestamp.format('YYYY-MM-DD HH:mm:ss'),
                }
              : null,
          ].filter(Boolean),
          detailRows: [
            {
              label: 'Product',
              value: productLabel,
              tone: this.getProductTone(productLabel),
              type: 'product',
            },
            {
              label: 'Action',
              value: 'Execute Strategies',
              tone: this.getContractTypeTone('CALC Strategy'),
              type: 'product',
            },
            { label: 'Contract', value: contractLabel },
            { label: 'Instances', value: String(instanceCount) },
            { label: 'Status', value: status.label, type: 'status' },
            timestamp
              ? { label: 'Time', value: timestamp.format('lll') }
              : null,
            height
              ? { label: 'Block', value: `#${this.normalFormat(height)}` }
              : null,
            userAddress
              ? { label: 'Executor', address: userAddress, type: 'address' }
              : null,
          ].filter(Boolean),
          lifecycleRows: [
            {
              icon: hasError ? 'WarningIcon' : 'SwapIcon',
              title: hasError ? 'Contract execution failed' : `${instanceCount} recurring swap ${instanceCount === 1 ? 'strategy' : 'strategies'} dispatched`,
              body: hasError
                ? logs || ''
                : `CALC Scheduler triggered ${instanceCount} ${instanceCount === 1 ? 'instance' : 'instances'} via ${contractLabel}`,
            },
          ],
          feeRows: [],
          technicalRows: [
            userAddress
              ? this.buildTechRow('Executor address', userAddress, 'address')
              : null,
            contractAddress
              ? this.buildTechRow('To address', contractAddress, 'address')
              : null,
          ].filter(Boolean),
        }
      }

      const contractTypes = this.rawActions.map(
        (a) => a.metadata?.contract?.contractType ?? ''
      )
      const isCalc = contractTypes.some((ct) => ct.includes('calc'))
      if (!isCalc) return null

      const tradeActions = this.rawActions.filter((a) =>
        (a.metadata?.contract?.contractType ?? '').includes('fin/trade')
      )
      const tradeCount = tradeActions.length

      // Determine overall status from all actions
      const hasError = this.rawActions.some(
        (a) => (a.metadata?.contract?.code ?? 0) > 0
      )
      const logs = this.rawActions.find((a) => (a.metadata?.contract?.code ?? 0) > 0)?.metadata?.contract?.logs
      const allSuccess = this.rawActions.every((a) => a.status === 'success')
      const status = hasError
        ? { label: 'Failed', tone: 'red' }
        : allSuccess
          ? { label: 'Success', tone: 'green' }
          : { label: 'Pending', tone: 'blue' }

      // Strategy address from calc-manager action
      const managerAction = this.rawActions.find((a) =>
        (a.metadata?.contract?.contractType ?? '').includes('calc-manager')
      )
      const strategyAddress =
        managerAction?.metadata?.contract?.attributes?.strategy_address ||
        managerAction?.in?.[0]?.address ||
        ''
      const executorAddress =
        managerAction?.metadata?.contract?.attributes?.executor || ''

      // Collect unique pair contract addresses from fin/trade actions
      const pairAddresses = [
        ...new Set(
          tradeActions.map((a) => a.out?.[0]?.address).filter(Boolean)
        ),
      ]
      const pairLabels = pairAddresses
        .map((addr) => getRujiraContractLabel(addr) || this.formatAddress(addr))
        .join(', ')

      // Aggregate rates from fin/trade
      const rates = tradeActions
        .map((a) => {
          const attrs = a.metadata?.contract?.attributes ?? {}
          return attrs.rate ? parseFloat(attrs.rate) : null
        })
        .filter((r) => r !== null && !isNaN(r))
      const avgRate = rates.length
        ? rates.reduce((s, r) => s + r, 0) / rates.length
        : null

      const date = this.rawActions[0]?.date
      const timestamp = date ? moment.unix(parseInt(date) / 1e9) : null

      return {
        title: `${tradeCount} Recurring Swap${tradeCount !== 1 ? 's' : ''} executed`,
        metaLabel: 'Recurring Swaps · CALC',
        status,
        affiliateAddress: '',
        actionTypeTitle: 'contract',
        labels: [],
        input: {
          asset: 'THOR.RUJI',
          name: 'Strategy',
          badge: strategyAddress ? this.formatAddress(strategyAddress) : 'CALC',
          amount: `${tradeCount} trade${tradeCount !== 1 ? 's' : ''}`,
          usd: null,
        },
        output: {
          asset: null,
          name: 'RUJI Trade',
          badge: pairLabels || 'Orderbook',
          amount: avgRate ? `Avg rate ${avgRate.toFixed(6)}` : 'Executed',
          usd: null,
        },
        metricRows: [
          { label: 'Trades Executed', value: `${tradeCount}` },
          pairLabels ? { label: 'Pairs', value: pairLabels } : null,
          avgRate
            ? { label: 'Avg Exchange Rate', value: avgRate.toFixed(6) }
            : null,
          timestamp
            ? { label: 'Time', value: timestamp.format('YYYY-MM-DD HH:mm:ss') }
            : null,
        ].filter(Boolean),
        detailRows: [
          {
            label: 'Product',
            value: 'Recurring Swaps',
            tone: this.getProductTone('Recurring Swaps'),
            type: 'product',
          },
          {
            label: 'Action',
            value: 'CALC Strategy',
            tone: this.getContractTypeTone('CALC Strategy'),
            type: 'product',
          },
          { label: 'Status', value: status.label, type: 'status' },
          timestamp ? { label: 'Time', value: timestamp.format('lll') } : null,
          executorAddress
            ? { label: 'Executor', value: this.formatAddress(executorAddress) }
            : null,
        ].filter(Boolean),
        lifecycleRows: hasError && logs ? [{ icon: 'WarningIcon', title: 'Contract execution failed', body: logs }] : [],
        feeRows: [],
        technicalRows: [
          strategyAddress
            ? this.buildTechRow('Strategy address', strategyAddress, 'address')
            : null,
          executorAddress
            ? this.buildTechRow('Executor address', executorAddress, 'address')
            : null,
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
    getBubbleTypeFromTitle(title) {
      if (!title || typeof title !== 'string') return 'default'
      const s = title.toLowerCase()
      if (s.includes('swap') && s.includes('refund')) return 'refund'
      if (s.includes('swap')) return 'swap'
      if (s.includes('send')) return 'send'
      if (s.includes('add') && s.includes('liquidity')) return 'addLiquidity'
      if (s.includes('withdraw')) return 'withdraw'
      if (s.includes('unbond')) return 'unbond'
      if (s.includes('bond')) return 'bond'
      if (s.includes('contract')) return 'switch'
      if (s.includes('failed')) return 'failed'
      return 'default'
    },
    bubbleTypeToColorClass(type) {
      switch (type) {
        case 'send':
          return 'bubble-pill--blue'
        case 'swap':
        case 'bond':
          return 'bubble-pill--green'
        case 'refund':
          return 'bubble-pill--yellow'
        case 'unbond':
        case 'withdraw':
        case 'failed':
          return 'bubble-pill--red'
        case 'switch':
        case 'addLiquidity':
          return 'bubble-pill--alert'
        default:
          return 'bubble-pill--grey'
      }
    },
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
      const numeric = Number(
        String(this.formatStackValue(stack?.value)).replace(/[^0-9.-]/g, '')
      )
      return Number.isFinite(numeric) && numeric > 0 ? numeric : null
    },
    formatStackValue(value) {
      if (Array.isArray(value)) {
        return value
          .map((item) => item?.text || '')
          .filter(Boolean)
          .join(' · ')
      }
      if (value == null || value === '') return ''
      return `${value}`
    },
    formatAssetAmount(amount, asset) {
      const formattedAmount = `${this.baseAmountFormatOrZero(amount)}`
      const numericAmount = Number(formattedAmount.replace(/,/g, ''))
      if (!Number.isFinite(numericAmount)) {
        return `${formattedAmount} ${this.getAssetSymbol(asset)}`
      }
      // Use enough decimals so small amounts (e.g. 0.00217 BTC) aren't rounded to 0
      const maxDecimals = numericAmount > 0 && numericAmount < 0.01 ? 8 : 2
      const displayAmount = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxDecimals,
      }).format(numericAmount)
      return `${displayAmount} ${this.getAssetSymbol(asset)}`
    },
    formatUsdValue(value) {
      const raw = `${value ?? ''}`.trim()
      const numeric = Number(raw)

      if (
        value == null ||
        raw === '' ||
        /nan|infinity/i.test(raw) ||
        !Number.isFinite(numeric)
      ) {
        return '$0'
      }

      return this.formatCurrency(numeric)
    },
    safeUsdDisplay(value) {
      const text = `${value ?? ''}`.trim()
      if (!text || /nan|infinity/i.test(text)) return '$0'
      return text
    },
    splitFeeValue(str) {
      if (!str) return { usd: '$0.00', subtle: null }
      // Try "amount ASSET ($X.XX)" format (e.g. "0.02 RUNE ($1.23)")
      const parenMatch = str.match(/^(.*?)\s*\((\$[^)]+)\)\s*$/)
      if (parenMatch) {
        return { usd: parenMatch[2], subtle: parenMatch[1].trim() || null }
      }
      // Try " · " separated (e.g. "0.02 RUNE · $1.23")
      const parts = str.split(' · ').map((p) => p.trim())
      if (parts.length > 1) {
        const usdPart = parts.find((p) => /^\$/.test(p))
        const rest = parts.filter((p) => !/^\$/.test(p))
        return {
          usd: usdPart || '$0.00',
          subtle: rest.length ? rest.join(' · ') : null,
        }
      }
      // Plain "$X.XX"
      if (/^\$/.test(str.trim())) return { usd: str.trim(), subtle: null }
      return { usd: '$0.00', subtle: str }
    },
    parseUsdAmount(usdStr) {
      return parseFloat((usdStr || '').replace(/[^0-9.-]/g, '')) || 0
    },
    formatFeeDisplay(value) {
      if (value === null || value === undefined || value === '') return ''

      const cleaned = String(value)
        .replace(/\(\$?NaN\)/gi, '')
        .replace(/\bTHOR\.([A-Z0-9-]+)\b/g, '$1')
        .replace(/\s+/g, ' ')
        .trim()

      const match = cleaned.match(
        /^([+-]?(?:\d+\.?\d*|\d*\.?\d+)(?:e[+-]?\d+)?)(.*)$/i
      )

      if (!match) return cleaned

      const numeric = Number(match[1])
      if (!Number.isFinite(numeric)) return cleaned

      const abs = Math.abs(numeric)
      const maximumFractionDigits =
        abs === 0 ? 2 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 8

      const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits,
      }).format(numeric)

      return `${formatted}${match[2]}`.trim()
    },
    getAssetSymbol(asset) {
      if (!asset) return '-'
      const parsed = assetFromString(asset)
      if (parsed.chain === 'THOR' && parsed.ticker) {
        return parsed.ticker
      }
      return this.showAsset(asset)
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
      if (
        parsed.ticker === parsed.chain ||
        (parsed.chain === 'THOR' && parsed.ticker === 'RUNE')
      ) {
        return chainNames[parsed.chain] || parsed.ticker
      }
      return parsed.ticker
    },
    getNetworkBadge(asset) {
      if (!asset) return '-'
      if (asset.trade) return 'Trade network'
      if (asset.secure) return 'Secure network'
      if (asset.synth) return 'Synth network'
      if (asset.chain === 'THOR') return 'THORChain network'
      return `${this.getAssetDisplayName(`${asset.chain}.${asset.chain}`)} network`
    },
    getSwapActionLabel(inputAsset, outputAsset) {
      if (
        inputAsset?.chain &&
        outputAsset?.chain &&
        inputAsset.chain !== outputAsset.chain
      ) {
        return 'Cross-chain Swap'
      }
      return 'Swap'
    },
    getContractActionType(contractAction) {
      if (!contractAction) return null
      const msg = contractAction.metadata?.contract?.msg || {}
      if (msg.order) return 'Limit Order'
      if (msg.swap) return 'Market Order'
      if (msg.cancel_instance) return 'Cancel Strategy'
      if (Array.isArray(msg.execute)) return 'Execute Strategies'
      if (msg.liquid && 'bond' in msg.liquid) return 'Liquid Bond'
      if (msg.liquid && 'unbond' in msg.liquid) return 'Liquid Unbond'
      if ('withdraw' in msg) return 'Ghost Vault Withdraw'
      if ('deposit' in msg) return 'Ghost Vault Deposit'
      if (msg.reset_instance) return 'Reset Instance'
      if (msg.account) return 'Credit Account'
      const events = contractAction.metadata?.contract?.contractEvents || []
      if (events.some((e) => e.type === 'wasm-calc-manager/strategy.execute'))
        return 'CALC Strategy'
      if (events.some((e) => e.type === 'wasm-rujira-fin/trade'))
        return 'Market Order'
      return null
    },
    getContractTypeTone(type) {
      if (type === 'Limit Order') return 'gold'
      if (type === 'Market Order') return 'blue'
      if (type === 'CALC Strategy') return 'purple'
      if (type === 'Cancel Strategy') return 'red'
      if (type === 'Liquid Bond') return 'green'
      if (type === 'Liquid Unbond') return 'red'
      if (type === 'Ghost Vault Deposit') return 'green'
      if (type === 'Ghost Vault Withdraw') return 'blue'
      if (type === 'Reset Instance') return 'blue'
      if (type === 'Credit Account') return 'purple'
      return 'green'
    },
    getSwapProductLabel(action) {
      const outAddress = action?.out?.find((e) => e.address)?.address || ''
      const inAddress = action?.in?.find((e) => e.address)?.address || ''
      const product =
        getRujiraContractProduct(outAddress) ||
        getRujiraContractProduct(inAddress) ||
        getRujiraContractProduct(
          action?.metadata?.contract?.attributes?.contract
        ) ||
        ''
      if (!product) return 'THORChain'
      const lower = product.toLowerCase()
      if (/ruji|rujira/.test(lower)) {
        if (/borrow|secure|collateral|loan/.test(lower)) return 'RUJI Borrow'
        if (/pool|liquidity/.test(lower)) return 'RUJI Pools'
        if (/merge/.test(lower)) return 'RUJI Merge'
        return 'RUJI Trade'
      }
      if (/tcy/.test(lower)) return 'TCY'
      return product
    },
    statusToneClass(tone) {
      const map = { red: 'danger', blue: 'info', yellow: 'yellow' }
      return map[tone] || null
    },
    getProductTone(label) {
      const l = (label || '').toLowerCase()
      if (/ruji|rujira/.test(l)) return 'blue'
      if (/tcy/.test(l)) return 'gold'
      if (/contract/.test(l)) return 'purple'
      return 'green'
    },
    buildTechRow(label, value, kind) {
      if (!value) return null
      if (kind === 'address') {
        return { label, address: value, type: 'address' }
      }
      return { label, value }
    },
    extractContractEventRows(contractAction) {
      const events = contractAction?.metadata?.contract?.contractEvents || []
      if (!events.length) return []

      const toAttrs = (e) =>
        Object.fromEntries(
          (e.attributes || []).map(({ key, value }) => [key, value])
        )

      const weightedAvgRate = (fills) => {
        let wSum = 0
        let wTotal = 0
        fills.forEach((a) => {
          const r = parseFloat(a.rate)
          const w = parseInt(a.bid || 0)
          if (!isNaN(r) && w > 0) {
            wSum += r * w
            wTotal += w
          }
        })
        if (wTotal > 0) return (wSum / wTotal).toFixed(6)
        const rs = fills.map((a) => parseFloat(a.rate)).filter((r) => !isNaN(r))
        return rs.length
          ? (rs.reduce((s, r) => s + r, 0) / rs.length).toFixed(6)
          : null
      }

      const rows = []

      // Strategy dispatch
      const strategyEvents = events.filter(
        (e) => e.type === 'wasm-calc-manager/strategy.execute'
      )
      if (strategyEvents.length) {
        const executorAddr = toAttrs(strategyEvents[0]).executor || ''
        const executorLabel =
          getRujiraContractLabel(executorAddr) ||
          this.formatAddress(executorAddr)
        const n = strategyEvents.length
        rows.push({
          icon: 'SwapIcon',
          iconRotate: 0,
          title: `${n} ${n === 1 ? 'strategy' : 'strategies'} dispatched`,
          body: `CALC Manager executed ${n} ${n === 1 ? 'strategy' : 'strategies'} via ${executorLabel}.`,
        })
      }

      // FIN trades — split by fill type per pair: CCL (local range liquidity),
      // Virtualisation (filled via a thor1… strategy address), other (resting limit orders)
      const finTradeEvents = events.filter(
        (e) => e.type === 'wasm-rujira-fin/trade'
      )
      if (finTradeEvents.length) {
        const byPair = {}
        finTradeEvents.forEach((e) => {
          const attrs = toAttrs(e)
          const addr = attrs._contract_address || ''
          if (!byPair[addr]) byPair[addr] = { ccl: [], virtual: [], other: [] }
          const price = String(attrs.price || '')
          if (price.startsWith('ccl:')) byPair[addr].ccl.push(attrs)
          else if (price.startsWith('thor1')) byPair[addr].virtual.push(attrs)
          else byPair[addr].other.push(attrs)
        })
        Object.entries(byPair).forEach(([addr, { ccl, virtual, other }]) => {
          const pairLabel =
            getRujiraContractLabel(addr) || this.formatAddress(addr)

          if (ccl.length) {
            const avgRate = weightedAvgRate(ccl)
            rows.push({
              icon: 'ExchangeIcon',
              iconRotate: 0,
              title: `CCL fills: ${pairLabel}`,
              body: [
                `${ccl.length} fill${ccl.length !== 1 ? 's' : ''} from local range liquidity`,
                avgRate ? `avg rate ${avgRate}` : null,
              ]
                .filter(Boolean)
                .join(' · '),
            })
          }

          if (virtual.length) {
            const stratAddr = String(virtual[0].price || '').split(':')[0]
            const stratLabel = this.formatAddress(stratAddr)
            const avgRate = weightedAvgRate(virtual)
            rows.push({
              icon: 'ExchangeIcon',
              iconRotate: 0,
              title: `Virtualisation fills: ${pairLabel}`,
              body: [
                `${virtual.length} fill${virtual.length !== 1 ? 's' : ''} via ${stratLabel}`,
                avgRate ? `avg rate ${avgRate}` : null,
              ]
                .filter(Boolean)
                .join(' · '),
            })
          }

          if (other.length) {
            const avgRate = weightedAvgRate(other)
            rows.push({
              icon: 'ExchangeIcon',
              iconRotate: 0,
              title: `Limit order fills: ${pairLabel}`,
              body: [
                `${other.length} fill${other.length !== 1 ? 's' : ''}`,
                avgRate ? `avg rate ${avgRate}` : null,
              ]
                .filter(Boolean)
                .join(' · '),
            })
          }
        })
      }

      // Helper: find a coin_spent event near a given event index that matches amount
      const findCoinDenom = (targetEvent, fallbackAmount) => {
        const idx = events.indexOf(targetEvent)
        // Look at coin_spent events within a small window around the target
        const window = events.slice(Math.max(0, idx - 6), idx + 6)
        const match = window.find((ev) => {
          if (ev.type !== 'coin_spent') return false
          const a = toAttrs(ev).amount || ''
          return fallbackAmount && a.startsWith(fallbackAmount)
        })
        return match ? toAttrs(match).amount : fallbackAmount
      }

      // Ghost Vault: repay outstanding debts before borrowing
      const repayEvents = events.filter(
        (e) => e.type === 'wasm-rujira-ghost-vault/repay'
      )
      repayEvents.forEach((e) => {
        const attrs = toAttrs(e)
        const vaultAddr = attrs._contract_address || ''
        const vaultLabel =
          getRujiraContractLabel(vaultAddr) || this.formatAddress(vaultAddr)
        const amountWithDenom = findCoinDenom(e, attrs.amount)
        rows.push({
          icon: 'RefreshIcon',
          iconRotate: 180,
          title: 'Ghost Vault: outstanding debt repaid',
          body: [
            amountWithDenom ? `Repaid ${amountWithDenom}` : null,
            vaultLabel ? `to ${vaultLabel}` : null,
          ]
            .filter(Boolean)
            .join(' '),
        })
      })

      // Ghost Vault: borrow funds to execute the virtualisation swap portion
      const borrowEvents = events.filter(
        (e) => e.type === 'wasm-rujira-ghost-vault/borrow'
      )
      borrowEvents.forEach((e) => {
        const attrs = toAttrs(e)
        const vaultAddr = attrs._contract_address || ''
        const vaultLabel =
          getRujiraContractLabel(vaultAddr) || this.formatAddress(vaultAddr)
        const amountWithDenom = findCoinDenom(e, attrs.amount)
        rows.push({
          icon: 'RefreshIcon',
          iconRotate: 0,
          title: 'Ghost Vault: funds borrowed for virtualisation',
          body: [
            amountWithDenom ? `Borrowed ${amountWithDenom}` : null,
            vaultLabel ? `from ${vaultLabel}` : null,
          ]
            .filter(Boolean)
            .join(' '),
        })
      })

      // Virtualisation: THORChain base layer swap settles the outstanding fills
      const virtualSwapEvents = events.filter(
        (e) => e.type === 'wasm-rujira-thorchain-swap/swap'
      )
      virtualSwapEvents.forEach((e) => {
        const attrs = toAttrs(e)
        const amountIn = attrs.amount || ''
        const returned = attrs.returned || attrs.quote_return || ''
        rows.push({
          icon: 'SwapIcon',
          iconRotate: 0,
          title: 'Virtualisation: THORChain base layer swap',
          body: [
            amountIn ? `in ${amountIn}` : null,
            returned ? `out ${returned}` : null,
          ]
            .filter(Boolean)
            .join(' → '),
        })
      })

      // Limit order settled (withdraw)
      const orderWithdrawEvents = events.filter(
        (e) => e.type === 'wasm-rujira-fin/order.withdraw'
      )
      orderWithdrawEvents.forEach((e) => {
        const attrs = toAttrs(e)
        const priceStr = attrs.price || ''
        const priceVal = priceStr.split(':')[1] || priceStr
        rows.push({
          icon: 'CheckIcon',
          iconRotate: 0,
          title: 'Limit order settled',
          body: [
            attrs.amount ? `${attrs.amount} filled` : null,
            priceVal ? `at price ${parseFloat(priceVal).toFixed(6)}` : null,
          ]
            .filter(Boolean)
            .join(' '),
        })
      })

      // CCL range creation
      const rangeCreateEvents = events.filter(
        (e) => e.type === 'wasm-rujira-fin/range.create'
      )
      if (rangeCreateEvents.length) {
        const attrs0 = toAttrs(rangeCreateEvents[0])
        const low = attrs0.low || ''
        const high = attrs0.high || ''
        const n = rangeCreateEvents.length
        rows.push({
          icon: 'ExchangeIcon',
          iconRotate: 0,
          title: `${n} CCL range${n !== 1 ? 's' : ''} created`,
          body: low && high ? `Price range ${low}–${high}` : '',
        })
      }

      return rows
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
      action,
    }) {
      const rows = []
      const timeText = this.getStackDisplayValue(actionStacks, 'Timestamp')
      rows.push({
        icon: 'ArrowIcon',
        iconRotate: 180,
        title: `${this.getAssetDisplayName(input.asset)} received by THORChain`,
        body: `${this.formatAssetAmount(input.amount, input.asset)} entered the swap flow from ${this.formatAddress(this.getStackDisplayValue(inboundStacks, 'From'))}.`,
        meta: [
          timeText,
          inboundHeight ? `Block #${this.normalFormat(inboundHeight)}` : '',
        ]
          .filter(Boolean)
          .join(' · '),
      })
      rows.push(...this.extractContractEventRows(action))
      rows.push({
        icon: 'ExchangeIcon',
        iconRotate: 0,
        title: 'Swap executed',
        body: `${this.getSwapProductLabel(action)} converted ${this.getAssetDisplayName(input.asset)} to ${this.getAssetDisplayName(output.asset)} at the current exchange rate.`,
        meta: this.getStackDisplayValue(actionStacks, 'Rate'),
      })
      rows.push({
        icon: 'ArrowIcon',
        iconRotate: 0,
        title: `${this.getAssetDisplayName(output.asset)} delivered`,
        body: `${this.formatAssetAmount(output.amount, output.asset)} was sent to ${this.formatAddress(this.getStackDisplayValue(outboundStacks, 'Destination'))}.`,
        meta: outboundHeight
          ? `Block #${this.normalFormat(outboundHeight)}`
          : '',
      })
      return rows
    },
    // TODO: check hash in saver with streaming
    async fetchTx(hash) {
      if (!this.pools) {
        const pools = (
          await this.$api.getPools().catch((e) => {
            console.error(e)
            this.error.message =
              "Can't load pool data. Please try again in a moment."
          })
        )?.data

        if (pools) {
          this.$store.commit('setPools', pools)
          await this.$nextTick()
        } else {
          return true
        }
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
      this.rawActions = midgardAction?.actions ?? null
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
        unbond: 'createUnbondState',
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
            : (thorStatus?.tx?.coins?.[0]?.amount ?? 0),
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
            : (thorStatus?.tx?.coins?.[0]?.amount ?? 0),
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

      let outs =
        action?.out.map((a) => ({
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

      const memoText = thorStatus?.tx?.memo || isRefund?.metadata?.refund?.memo

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
        outAsset = this.parseMemoAsset(outTxs[0]?.coins?.[0]?.asset, this.pools)
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

      // Add scheduled refund actions from thorTx.actions that aren't yet in out_txs
      // e.g. streaming swap where some iterations failed → partial XRP refund is queued
      const inboundAsset = thorStatus?.tx?.coins?.[0]?.asset
      const scheduledRefundActions = (thorTx?.actions ?? []).filter(
        (a) =>
          a.coin?.asset === inboundAsset &&
          a.memo?.toLowerCase().startsWith('refund:') &&
          !outTxs?.some(
            (o) =>
              o.to_address?.toLowerCase() === a.to_address?.toLowerCase() &&
              o.coins?.[0]?.asset === a.coin?.asset
          )
      )
      if (scheduledRefundActions.length > 0) {
        outTxs = [
          ...(outTxs ?? []),
          ...scheduledRefundActions.map((a) => ({
            id: null,
            to_address: a.to_address,
            coins: [{ asset: a.coin.asset, amount: a.coin.amount }],
            memo: a.memo,
            refund: true,
          })),
        ]
      }

      // Add scheduled outbound actions from thorTx.actions not yet in out_txs.
      // Skip THOR.RUNE actions going to a non-user address — those are affiliate payments.
      const scheduledOutActions = (thorTx?.actions ?? []).filter(
        (a) =>
          a.memo?.toLowerCase().startsWith('out:') &&
          !(
            a.coin?.asset === 'THOR.RUNE' &&
            !userAddresses.has(a.to_address?.toLowerCase())
          ) &&
          !outTxs?.some(
            (o) =>
              o.to_address?.toLowerCase() === a.to_address?.toLowerCase() &&
              o.coins?.[0]?.asset === a.coin?.asset &&
              String(o.coins?.[0]?.amount) === String(a.coin?.amount)
          )
      )
      if (scheduledOutActions.length > 0) {
        outTxs = [
          ...(outTxs ?? []),
          ...scheduledOutActions.map((a) => ({
            id: null,
            to_address: a.to_address,
            coins: [{ asset: a.coin.asset, amount: a.coin.amount }],
            memo: a.memo,
          })),
        ]
      }

      // order by target swapped asset if we have refund in swap
      outTxs = orderBy(
        outTxs,
        (o) => o.coins?.[0]?.asset === thorStatus?.tx?.coins?.[0]?.asset
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
                ?.out?.filter((a) => a.coins?.[0]?.asset === outAssetStr),
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

      const streamingMeta = swapAction?.metadata?.swap?.streamingSwapMeta
      const depositAmountZero = !parseInt(
        streamingMeta?.depositedCoin?.amount || 0
      )
      const rapidInterval = depositAmountZero
        ? memo?.interval
        : streamingMeta?.interval ?? memo?.interval
      const isRapidSwap =
        (rapidInterval === 0 || rapidInterval === '0') && +height > 25400000
      const swapTypeLabel = isRapidSwap ? 'rapid Swap' : 'swap'
      const refundedSwapTypeLabel = isRapidSwap
        ? 'refunded Rapid Swap'
        : 'refunded Swap'

      return {
        cards: {
          title: onlyRefund ? refundedSwapTypeLabel : swapTypeLabel,
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
                ? this.parseMemoAsset(
                    thorStatus?.tx?.gas?.[0]?.asset,
                    this.pools
                  )
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
            type:
              onlyRefund || isRefund ? refundedSwapTypeLabel : swapTypeLabel,
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
              count:
                thorStatus?.stages.swap_status?.streaming?.count ??
                streamingMeta?.count,
              interval:
                thorStatus?.stages.swap_status?.streaming?.interval ??
                streamingMeta?.interval ??
                memo?.interval,
              quantity:
                thorStatus?.stages.swap_status?.streaming?.quantity ??
                streamingMeta?.quantity ??
                memo?.quantity,
              lastHeight: streamingMeta?.lastHeight || null,
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
              to:
                (outTxs?.length > 0 && outTxs[0]?.to_address) || memo?.destAddr,
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
  align-items: center;
  color: var(--font-color);
  display: inline-flex;
  font-weight: 500;
  gap: $space-6;
  text-decoration: none;

  &:hover {
    color: color-mix(in srgb, var(--green) 82%, white);
  }
}

.tx-back-icon {
  fill: currentColor;
  flex: 0 0 auto;
  height: 14px;
  transform: rotate(-90deg);
  width: 14px;
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

  .bubble-stack {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;
    outline: none;
    min-height: 28px;
    cursor: pointer;
    overflow: hidden;

    .bubble-pill {
      flex-shrink: 0;
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: $space-5 $space-10;
      border-radius: $radius-sm;
      font-size: $font-size-sm;
      font-weight: 600;
      line-height: 1;
      border: 1px solid var(--border-color);
      background-color: var(--bgl-color);
      color: var(--sec-font-color);
      white-space: nowrap;
      transition:
        margin-left 0.25s ease,
        clip-path 0.25s ease,
        filter 0.25s ease;

      &:first-child {
        z-index: 3;
        clip-path: inset(0 0 0 0);
      }

      &:nth-child(2) {
        z-index: 2;
        clip-path: inset(0 0 0 50%);
        filter: brightness(0.6);
      }

      &:nth-child(3),
      &:nth-child(n + 3) {
        z-index: 1;
        clip-path: inset(0 0 0 50%);
        filter: brightness(0.6);
      }

      &:not(:first-child) {
        margin-left: -80px;
      }

      .bubble-pill__icon {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
        fill: currentColor;
      }

      .bubble-pill__label {
        color: inherit;
      }

      &.bubble-pill--blue {
        border-color: color-mix(
          in srgb,
          var(--highlight) 50%,
          var(--border-color)
        );
        background-color: color-mix(
          in srgb,
          var(--highlight) 10%,
          var(--card-bg-color)
        );
      }
      &.bubble-pill--green {
        border-color: color-mix(in srgb, var(--green) 50%, var(--border-color));
        background-color: color-mix(
          in srgb,
          var(--green) 10%,
          var(--card-bg-color)
        );
      }
      &.bubble-pill--yellow {
        border-color: color-mix(in srgb, #f39c12 50%, var(--border-color));
        background-color: color-mix(in srgb, #f39c12 10%, var(--card-bg-color));
      }
      &.bubble-pill--red {
        border-color: color-mix(in srgb, var(--red) 50%, var(--border-color));
        background-color: color-mix(
          in srgb,
          var(--red) 10%,
          var(--card-bg-color)
        );
      }
      &.bubble-pill--alert {
        border-color: color-mix(in srgb, #9b59b6 50%, var(--border-color));
        background-color: color-mix(in srgb, #9b59b6 10%, var(--card-bg-color));
      }
      &.bubble-pill--grey {
        border-color: color-mix(
          in srgb,
          var(--highlight) 50%,
          var(--border-color)
        );
        background-color: color-mix(
          in srgb,
          var(--highlight) 10%,
          var(--card-bg-color)
        );
      }
    }

    &.bubble-stack--expanded .bubble-pill {
      margin-left: 0;
      clip-path: inset(0 0 0 0);
      filter: none;

      &:not(:first-child) {
        margin-left: 6px;
      }
    }
  }
}

.tx-detail-title {
  color: var(--sec-font-color);
  font-size: clamp(1.4rem, 2.4vw, 2rem);
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
    top: 80px;
  }
}

.tx-swap-head {
  display: grid;
  gap: $space-14;

  @include md {
    align-items: stretch;
    grid-template-columns: minmax(0, 1fr) 60px minmax(0, 1fr);
  }
}

.tx-asset-panel {
  background: var(--card-bg);
  border: 2px solid var(--left-border, var(--border-color));
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: $space-10;
  min-height: 156px;
  padding: $space-18 $space-20;
}

.tx-asset-panel--accent {
  border-color: var(--right-border, var(--border-color));
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
    font-size: 1.1rem;
    font-weight: 600;
  }

  strong {
    font-size: 0.95rem;
  }
}

.tx-swap-arrow {
  align-items: center;
  background: var(--card-bg);
  border: 1px solid color-mix(in srgb, var(--green) 18%, var(--border-color));
  border-radius: 999px;
  display: flex;
  height: 60px;
  justify-content: center;
  margin: auto;
  width: 60px;
}

.tx-swap-arrow-icon {
  fill: var(--green);
  height: 20px;
  transform: rotate(90deg);
  width: 20px;

  &.order {
    transform: rotate(0deg);
  }
}

.tx-metric-strip {
  background: color-mix(in srgb, var(--bg-color) 60%, var(--card-bg-color));
  border: 1px solid var(--border-color);
  border-radius: $radius-s;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: $space-18;
  padding: $space-16 $space-20;

  @media (max-width: 767px) {
    grid-template-columns: 1fr;
  }
}

.tx-metric-item {
  padding: $space-16;

  &:nth-child(3n + 1) {
    padding-left: 0;
  }

  &:nth-child(3n),
  &:last-child {
    padding-right: 0;
  }

  &:not(:nth-child(3n)) {
    border-right: 1px solid var(--border-color);
  }

  &:nth-child(n + 4) {
    border-top: 1px solid var(--border-color);
  }

  @media (max-width: 767px) {
    padding: $space-16 0;

    &:not(:first-child) {
      border-right: none;
      border-top: 1px solid var(--border-color);
    }

    &:nth-child(3n + 1) {
      padding-left: 0;
    }

    &:nth-child(3n),
    &:last-child {
      padding-right: 0;
    }

    &:not(:nth-child(3n)):not(:last-child) {
      border-right: none;
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
  border-top: 3px solid color-mix(in srgb, var(--border-color) 92%, transparent);
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

  &:first-of-type {
    border-top: none;
  }
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

.tx-asset-divider {
  border-top: 1px dashed
    color-mix(in srgb, var(--border-color) 80%, transparent);
  margin: $space-10 0;
}

.tx-asset-label--returned {
  color: var(--font-color);
  opacity: 0.7;
  font-size: 0.75rem;
  margin-bottom: $space-5;
}

.tx-returned-panel {
  padding-top: $space-5;
}

.tx-returned-row {
  display: flex;
  align-items: center;
  gap: $space-8;
  font-size: 0.85rem;
  opacity: 0.8;
}

.tx-returned-name {
  color: var(--font-color);
}

.tx-returned-amount {
  margin-left: auto;
  color: var(--font-color);
  font-weight: 500;
}

.exchange-rate-value {
  display: inline-flex;
  align-items: center;
  gap: $space-6;
}

.exchange-rate-flip-icon {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  flex-shrink: 0;
  fill: var(--sec-font-color);

  &:hover {
    fill: var(--primary-color);
  }
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
    background: var(--border-color);
    bottom: $space-14;
    content: '';
    left: 23px;
    position: absolute;
    top: $space-14;
    width: 2px;
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
  background: color-mix(in srgb, var(--green) 12%, var(--card-bg-color));
  border: 1px solid color-mix(in srgb, var(--green) 35%, var(--card-bg-color));
  border-radius: 999px;
  color: var(--green);
  display: flex;
  height: 40px;
  justify-content: center;
  position: relative;
  width: 40px;
  z-index: 1;
}

.tx-lifecycle-icon {
  fill: var(--green);
  height: 16px;
  width: 16px;
}

.tx-lifecycle-title {
  color: var(--sec-font-color);
  font-weight: 600;
  margin-bottom: $space-4;
}

.tx-lifecycle-body,
.tx-lifecycle-meta,
.tx-hash-full {
  color: var(--font-color);
}

.tx-fee-subtle {
  color: var(--font-color);
  font-size: 0.75rem;
}

.tx-lifecycle-meta {
  margin-top: $space-4;
}

.tx-hash-box {
  background: var(--card-bg);
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
  background: var(--card-bg);
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
  text-decoration: none;

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
    fill: var(--primary-color);
    color: var(--primary-color);
  }

  .tx-hash-action-icon {
    fill: var(--sec-font-color);
    width: 16px;
    height: 16px;
  }

  &:hover .tx-hash-action-icon {
    fill: var(--primary-color);
  }
}

.tx-fee-value-wrap {
  text-align: right;
}

.tx-fee-label--total {
  color: var(--sec-font-color);
  font-weight: 600;
}

.tx-fee-value--total {
  color: var(--green);
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
