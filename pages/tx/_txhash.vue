<template>
  <Page>
    <template
      v-if="
        sendOverview ||
        bondOverview ||
        mimirOverview ||
        refundOverview ||
        multiOutboundOverview ||
        streamingOverview
      "
    >
      <SendHero v-if="sendOverview" :overview="sendOverview" />
      <BondHero
        v-else-if="bondOverview"
        :overview="bondOverview"
        :node-snapshot="nodeSnapshot"
        :network-info="networkInfo"
        :current-height="chainsHeight && chainsHeight.THOR"
      />
      <MimirVoteHero
        v-else-if="mimirOverview"
        :overview="mimirOverview"
        :node-snapshot="nodeSnapshot"
        :consensus="mimirConsensus"
      />
      <RefundHero v-else-if="refundOverview" :overview="refundOverview" />
      <MultiOutboundHero
        v-else-if="multiOutboundOverview"
        :overview="multiOutboundOverview"
      />
      <StreamingSwapHero
        v-else-if="streamingOverview"
        :overview="streamingOverview"
      />
    </template>
    <div v-else-if="swapOverview || contractOverview" class="tx-detail-page">
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
            <div
              v-if="
                activeOverview.pairDisplay ||
                activeOverview.input ||
                activeOverview.output
              "
              class="tx-swap-head"
              :style="panelVars"
            >
              <template v-if="activeOverview.pairDisplay">
                <div class="tx-pair-display">
                  <div class="tx-pair-icons">
                    <AssetIcon
                      v-if="activeOverview.pairDisplay.baseAsset"
                      :asset="activeOverview.pairDisplay.baseAsset"
                      :height="'2.25rem'"
                    />
                    <AssetIcon
                      v-if="activeOverview.pairDisplay.quoteAsset"
                      :asset="activeOverview.pairDisplay.quoteAsset"
                      :height="'2.25rem'"
                      class="tx-pair-icon-overlap"
                    />
                  </div>
                  <div class="tx-pair-label">
                    {{ activeOverview.pairDisplay.label }}
                  </div>
                  <div
                    v-if="activeOverview.pairDisplay.inputAmount"
                    class="tx-pair-input-amount"
                  >
                    {{ activeOverview.pairDisplay.inputAmount }}
                  </div>
                  <div class="tx-asset-badge tx-pair-sublabel">
                    {{ activeOverview.pairDisplay.sublabel }}
                  </div>
                </div>
              </template>
              <template v-else>
                <div v-if="activeOverview.input" class="tx-asset-panel">
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
                    <strong
                      v-if="activeOverview.input.usd"
                      v-tooltip="
                        activeOverview.input.usdAtExecution
                          ? 'Value based on price at the time the transaction was executed'
                          : 'Based on current price, not price at the time of the transaction'
                      "
                      style="cursor: help"
                      >{{ safeUsdDisplay(activeOverview.input.usd) }}</strong
                    >
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
                  v-if="activeOverview.output"
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
                    <strong
                      v-if="activeOverview.output.usd"
                      v-tooltip="
                        activeOverview.output.usdAtExecution
                          ? 'Value based on price at the time the transaction was executed'
                          : 'Based on current price, not price at the time of the transaction'
                      "
                      style="cursor: help"
                      >{{ safeUsdDisplay(activeOverview.output.usd) }}</strong
                    >
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
              </template>
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

          <section
            v-if="activeOverview.orderRows && activeOverview.orderRows.length"
            class="tx-info-card card-bg tx-order-book-card"
          >
            <div class="tx-order-book-header">
              <span class="tx-section-title">Orders</span>
              <span class="tx-order-book-count">{{
                activeOverview.orderRows.length
              }}</span>
            </div>
            <div class="tx-order-book">
              <div class="tx-order-book-cols">
                <span>Side</span>
                <span
                  >Price<template v-if="activeOverview.orderPairTickers">
                    ({{ activeOverview.orderPairTickers.quote }})</template
                  ></span
                >
                <span
                  >Amount<template v-if="activeOverview.orderPairTickers">
                    ({{
                      activeOverview.orderPairTickers.isBuy
                        ? activeOverview.orderPairTickers.quote
                        : activeOverview.orderPairTickers.base
                    }})</template
                  ></span
                >
                <span
                  >Return<template v-if="activeOverview.orderPairTickers">
                    ({{
                      activeOverview.orderPairTickers.isBuy
                        ? activeOverview.orderPairTickers.base
                        : activeOverview.orderPairTickers.quote
                    }})</template
                  ></span
                >
                <span>Op</span>
              </div>
              <div
                v-for="(r, i) in activeOverview.orderRows"
                :key="i"
                class="tx-order-book-row"
                :class="{
                  'ob-buy': r.side === 'Buy',
                  'ob-sell': r.side === 'Sell',
                  'ob-retract': r.op === 'Retract',
                  'ob-keep': r.op === 'Keep',
                }"
                :style="`--depth: ${r.depth}%`"
              >
                <span
                  class="ob-side"
                  :class="r.side === 'Buy' ? 'ob-price--buy' : 'ob-price--sell'"
                  >{{ r.side }}</span
                >
                <span class="ob-price">{{ r.price }}</span>
                <span class="ob-amount">{{ r.amount }}</span>
                <span class="ob-ret">{{ r.ret }}</span>
                <span class="ob-op">{{ r.op }}</span>
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
            <div class="tx-section-title-row">
              <span class="tx-section-title">Lifecycle Events</span>
              <button
                v-if="
                  activeOverview.rawEvents && activeOverview.rawEvents.length
                "
                class="tx-events-btn"
                @click="eventsModalOpen = true"
              >
                <ListIcon class="tx-events-btn-icon" />
                View Events
                <span class="tx-events-count">{{
                  activeOverview.rawEvents.length
                }}</span>
              </button>
            </div>
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
    <TxHeroSkeleton v-else-if="isLoading && !isError" />
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
    <template v-if="!isError && !isLoading && pools && !hasNewHeroUi">
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

    <!-- Contract Events Modal -->
    <transition name="fade">
      <div
        v-if="eventsModalOpen"
        class="events-modal-backdrop"
        @click.self="eventsModalOpen = false"
      >
        <div class="events-modal">
          <div class="events-modal-header">
            <span class="events-modal-title">Contract Events</span>
            <CrossIcon
              class="events-modal-close"
              @click="eventsModalOpen = false"
            />
          </div>
          <div class="events-modal-search">
            <input
              v-model="eventsSearchQuery"
              class="events-search-input"
              type="text"
              placeholder="Filter by type or attribute…"
              autofocus
            />
          </div>
          <div class="events-modal-body">
            <div
              v-if="activeOverview.rawMsg && !eventsSearchQuery"
              class="events-msg-block"
            >
              <div class="events-event-type">msg</div>
              <pre class="events-msg-json">{{
                JSON.stringify(activeOverview.rawMsg, null, 2)
              }}</pre>
            </div>

            <div
              v-for="(event, i) in filteredContractEvents"
              :key="i"
              class="events-event-block"
            >
              <div class="events-event-type">{{ event.type }}</div>
              <div
                v-for="attr in event.attributes"
                :key="attr.key"
                class="events-attr-row"
              >
                <span class="events-attr-key">{{ attr.key }}</span>
                <span class="events-attr-val">{{ attr.value }}</span>
              </div>
            </div>
            <div v-if="!filteredContractEvents.length" class="events-empty">
              No events match "{{ eventsSearchQuery }}"
            </div>
          </div>
        </div>
      </div>
    </transition>
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
import {
  resolveOutboundSignal,
  resolveOutboundLegState,
  resolveOutboundLegStatus,
  resolveTxOutboundTotals,
} from './state/outboundStatus.js'
import { parseActionReason } from './state/parseActionReason.js'
import { computeMimirConsensus } from './state/mimirConsensus.js'
import SendHero from './components/hero/SendHero.vue'
import BondHero from './components/hero/BondHero.vue'
import MimirVoteHero from './components/hero/MimirVoteHero.vue'
import RefundHero from './components/hero/RefundHero.vue'
import MultiOutboundHero from './components/hero/MultiOutboundHero.vue'
import StreamingSwapHero from './components/hero/StreamingSwapHero.vue'
import TxHeroSkeleton from './components/TxHeroSkeleton.vue'
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
  getRujiraContractEntry,
} from '~/utils/rujiraContracts'
import ExternalIcon from '~/assets/images/external.svg?inline'
import CrossIcon from '~/assets/images/cross.svg?inline'
import ListIcon from '~/assets/images/highlight-list.svg?inline'

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
    CrossIcon,
    ListIcon,
    streamingSwap,
    txCard,
    Accordion,
    SendHero,
    BondHero,
    MimirVoteHero,
    RefundHero,
    MultiOutboundHero,
    StreamingSwapHero,
    TxHeroSkeleton,
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
      eventsModalOpen: false,
      eventsSearchQuery: '',
      nodeSnapshot: null,
      nodeSnapshotAddress: null,
      networkInfo: null,
      mimirConsensus: null,
      mimirConsensusKey: null,
      streamingProgress: null,
      streamingProgressHash: null,
      streamingProgressFetchedAt: 0,
    }
  },
  head() {
    const hash = this.$route.params.txhash || ''
    const suffix = hash.slice(-4).toUpperCase()
    return {
      title: `THORChain Network Explorer | TX …${suffix}`,
    }
  },
  computed: {
    ...mapGetters({
      chainsHeight: 'getChainsHeight',
      pools: 'getPools',
      runePrice: 'getRunePrice',
    }),
    activeOverview() {
      const co = this.contractOverview
      if (co?.priority) return co
      return this.swapOverview || co || null
    },
    // The legacy tx-card/Accordion list (template line ~538) is a sibling
    // of the hero-selection v-if/else-if/else chain above it, not part of
    // it — so without this guard it renders unconditionally underneath
    // whichever hero matched. True whenever any hero owns the page.
    hasNewHeroUi() {
      return !!(
        this.sendOverview ||
        this.bondOverview ||
        this.mimirOverview ||
        this.refundOverview ||
        this.multiOutboundOverview ||
        this.streamingOverview ||
        this.swapOverview ||
        this.contractOverview
      )
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
    // Native RUNE sends never reach the swap/contract card pipeline — they
    // short-circuit through createNativeTx (see fetchTx) straight into
    // this.cards, tagged with title 'Send'. Independent of swapOverview so
    // it renders through its own hero regardless of swap/contract state.
    sendOverview() {
      if (!this.cards?.length) return null
      const index = this.cards.findIndex((c) => c?.details?.title === 'Send')
      if (index < 0) return null

      const card = this.cards[index]
      const overall = card?.details?.overall
      const input = overall?.in?.[0]
      if (!input?.asset) return null

      const actionAccordion = card?.accordions?.find(
        (entry) => entry.name === 'accordion-action'
      )
      const stacks = actionAccordion?.data?.stacks || []
      const gasDisplay = this.getStackDisplayValue(stacks, 'Gas')
      const time = this.splitTrailingParen(
        this.getStackDisplayValue(stacks, 'Timestamp')
      )
      const height = this.getNumericStackValue(stacks, 'Block Height')
      const heightDisplay = height ? `#${this.normalFormat(height)}` : '-'
      const failed = !!overall.middle?.fail
      const failureCode = failed
        ? this.getStackDisplayValue(stacks, 'Code')
        : null
      const failureReason = failed
        ? this.getStackDisplayValue(stacks, 'Reason')
        : null
      const parsedFailure = failed
        ? parseActionReason(failureReason, {
            formatAmount: (raw) => this.formatAssetAmount(raw, input.asset),
            heightDisplay,
          })
        : null

      return {
        kind: 'send',
        status: this.getOverviewStatus(overall.middle),
        failed,
        failure: failed
          ? {
              title: parsedFailure?.title || 'Transaction failed',
              body:
                parsedFailure?.body ||
                'The transaction was included in a block and rejected during execution — the transfer never happened, and the gas below was still charged.',
              code: failureCode,
              codeLine: parsedFailure
                ? `code ${failureCode}`
                : `code ${failureCode}${failureReason ? ` · ${failureReason}` : ''}`,
            }
          : null,
        failureReasonRaw: failureReason,
        hash:
          this.getStackDisplayValue(stacks, 'Hash') ||
          this.$route.params.txhash,
        from: this.getStackDisplayValue(stacks, 'From'),
        to: this.getStackDisplayValue(stacks, 'To'),
        asset: input.asset,
        assetRaw: input.asset,
        amountRaw: Number(input.amount) || 0,
        amountDisplay: this.formatAssetAmount(input.amount, input.asset),
        zeroAmountDisplay: this.formatAssetAmount(0, input.asset),
        amountUsdDisplay: this.formatUsdValue(input.amountUSD),
        amountUsdAtExecution: !!input.usdAtExecution,
        runePriceDisplay: this.formatUsdValue(this.runePrice),
        gasDisplay,
        gasRuneOnly: this.splitTrailingParen(gasDisplay).main || gasDisplay,
        gasUsd: this.splitFeeValue(gasDisplay).usd,
        confirmedIn: `${this.blockSeconds('THOR')} seconds`,
        timeDisplay: time.main,
        timeAgoDisplay: time.paren,
        height,
        heightDisplay,
        memo: stacks.find((s) => s.key === 'Memo' && s.is)?.value || '',
      }
    },
    // Bonds/whitelist-bonds always come through createBondState; the node's
    // current status/total-bond/provider-count/next-churn aren't in that
    // builder's output (the tx only carries the delta), so BondHero gets
    // them from a small live fetch — see the bondOverview watcher below.
    bondOverview() {
      if (!this.cards?.length) return null
      const index = this.cards.findIndex((c) =>
        /^Bond\b/.test(c?.details?.title || '')
      )
      if (index < 0) return null

      const card = this.cards[index]
      const overall = card?.details?.overall
      const input = overall?.in?.[0]
      if (!input?.asset) return null

      const actionAccordion = card?.accordions?.find(
        (entry) => entry.name === 'accordion-action'
      )
      const stacks = actionAccordion?.data?.stacks || []
      const inboundAccordion = card?.accordions?.find(
        (entry) => entry.name === 'accordion-in-0'
      )
      const inboundStacks = inboundAccordion?.data?.stacks || []

      const nodeAddress = this.getStackDisplayValue(stacks, 'Node Address')
      const providerAddress =
        this.getStackDisplayValue(stacks, 'Bond Provider') ||
        this.getStackDisplayValue(inboundStacks, 'From')
      const time = this.splitTrailingParen(
        this.getStackDisplayValue(stacks, 'Timestamp')
      )
      const height = this.getNumericStackValue(stacks, 'Block Height')

      return {
        kind: 'bond',
        status: this.getOverviewStatus(overall.middle),
        hash: this.$route.params.txhash,
        nodeAddress,
        providerAddress,
        isWhitelist: /whitelist/i.test(card.details.title || ''),
        asset: input.asset,
        amountDisplay: this.formatAssetAmount(input.amount, input.asset),
        amountUsdDisplay: this.formatUsdValue(input.amountUSD),
        amountUsdAtExecution: !!input.usdAtExecution,
        amountRaw: Number(input.amount) || 0,
        timeDisplay: time.main,
        timeAgoDisplay: time.paren,
        heightDisplay: height ? `#${this.normalFormat(height)}` : '-',
        memo: stacks.find((s) => s.key === 'Memo' && s.is)?.value || '',
      }
    },
    // Two distinct builders produce a "standalone refund" card, and this
    // covers both: (1) createSwapState's onlyRefund case — THORChain
    // accepted the swap attempt and the whole thing came back (slip
    // tolerance, invalid destination, no route) — title always prefixed
    // "refunded ", found via swapCardIndex; and (2) createAbstractState's
    // generic per-Midgard-action card for a Midgard `type: 'refund'` action
    // with no matching swap/failed builder (confirmed against a real
    // empty-memo deposit,
    // 734A958BAAF44300E246BAD9FA9AF0FD8FD122B938F4ADD8367211324FF37312 —
    // THORChain couldn't tell what the memo meant at all, so it refunded
    // the deposit) — title is exactly "Refund" (no "swap" in it, so
    // swapCardIndex never finds it), and its accordion-action stacks use
    // plain 'Reason' (cardAction.reason) rather than createSwapState's
    // 'Refund Reason' (action.refundReason) — two different field names
    // for the same concept. Not gated on the reason text itself being
    // present — THORNode sometimes returns an empty refund reason, and
    // that's still this screen, just with a "not provided" fallback below.
    refundOverview() {
      let card = null
      if (this.swapCardIndex >= 0) {
        const swapCard = this.cards[this.swapCardIndex]
        if (
          swapCard?.details?.overall?.middle?.fail &&
          /^refunded\b/i.test(swapCard?.details?.title || '')
        ) {
          card = swapCard
        }
      }
      if (!card) {
        card =
          this.cards?.find(
            (c) =>
              c?.details?.title === 'Refund' &&
              c?.details?.overall?.middle?.fail
          ) || null
      }
      if (!card) return null
      const overall = card.details.overall

      const actionAccordion = card?.accordions?.find(
        (entry) => entry.name === 'accordion-action'
      )
      const actionStacks = actionAccordion?.data?.stacks || []
      const reasonRaw =
        this.getStackDisplayValue(actionStacks, 'Refund Reason') ||
        this.getStackDisplayValue(actionStacks, 'Reason')
      const parsedReason = reasonRaw ? parseActionReason(reasonRaw) : null

      const input = overall?.in?.[0]
      const output = overall?.out?.[0]
      if (!input?.asset || !output?.asset) return null

      const inboundAccordion = card?.accordions?.find((entry) =>
        entry.name.startsWith('accordion-in-')
      )
      const outboundAccordion = card?.accordions?.find((entry) =>
        entry.name.startsWith('accordion-out-')
      )
      const inboundStacks = inboundAccordion?.data?.stacks || []
      const outboundStacks = outboundAccordion?.data?.stacks || []

      const time = this.splitTrailingParen(
        this.getStackDisplayValue(actionStacks, 'Timestamp')
      )
      const height = this.getNumericStackValue(actionStacks, 'Block Height')
      const networkFee = outboundStacks
        .filter((stack) => stack.key === 'Outbound Fee' && stack.is)
        .map((stack) =>
          this.formatFeeDisplay(this.formatStackValue(stack.value))
        )
        .filter(Boolean)[0]

      return {
        kind: 'refund',
        status: { label: 'Refunded', tone: 'yellow' },
        hash: this.$route.params.txhash,
        // Same field the shipped swapOverview hero reads for its own
        // Affiliate.vue badge — shown regardless of the refund (the
        // interface that originated the tx is unrelated to whether the
        // swap itself succeeded).
        affiliateAddress: card?.details?.interface || null,
        outboundHash: this.getStackDisplayValue(outboundStacks, 'Hash'),
        inboundHash: this.getStackDisplayValue(inboundStacks, 'Hash'),
        from: this.getStackDisplayValue(inboundStacks, 'From'),
        sentAsset: input.asset,
        sentAmountRaw: Number(input.amount) || 0,
        sentAmountDisplay: this.formatAssetAmount(input.amount, input.asset),
        sentAmountUsdDisplay: this.formatUsdValue(input.amountUSD),
        sentAmountUsdAtExecution: !!input.usdAtExecution,
        refundedAsset: output.asset,
        refundedAmountRaw: Number(output.amount) || 0,
        refundedAmountDisplay: this.formatAssetAmount(
          output.amount,
          output.asset
        ),
        refundedAmountUsdDisplay: this.formatUsdValue(output.amountUSD),
        refundedAmountUsdAtExecution: !!output.usdAtExecution,
        reasonTitle: parsedReason?.title || null,
        reason:
          parsedReason?.body || reasonRaw || 'No reason provided by THORChain.',
        reasonRaw,
        networkFee: networkFee || null,
        timeDisplay: time.main,
        timeAgoDisplay: time.paren,
        height,
        heightDisplay: height ? `#${this.normalFormat(height)}` : '-',
        memo: this.getStackDisplayValue(actionStacks, 'Memo'),
      }
    },
    // Multi-leg outbounds — either createTradeWithdrawState's output (title
    // "trade Withdraw"/"secure Withdraw") or the swap card itself (e.g. one
    // swap output split across several destination-chain txs by a per-tx
    // amount cap — confirmed against a real 4-leg BTC->TRON.USDT streaming
    // swap where TRON capped each outbound). Both builders now thread
    // per-leg done/txid/to/outboundETA onto each `out[]` entry (see
    // createTradeWithdrawState and createSwapState). Any OTHER multi-out
    // card (e.g. createRemoveLiquidityState's "Withdraw Liquidity", or a
    // swap with an affiliate-fee leg producing a MIXED-asset out[]) is
    // deliberately excluded — unverified shape, and this hero's copy has
    // no fitting narrative for either. `kind` ('withdraw'|'swap') drives
    // the wording split in MultiOutboundHero. No per-leg scheduled height
    // exists either way — every still-pending leg shares one tx-wide
    // overdue signal (see resolveOutboundLegStatus).
    multiOutboundOverview() {
      if (!this.cards?.length) return null
      const index = this.cards.findIndex((c, i) => {
        const isWithdraw = /^(trade|secure)\s*withdraw/i.test(
          c?.details?.title || ''
        )
        const outCount = c?.details?.overall?.out?.length ?? 0
        if (c?.details?.overall?.middle?.fail) return false
        // A trade/secure withdrawal's outbound can take real time to sign
        // and deliver even when it's just ONE leg — this hero's delivery
        // bar / "Outstanding" · "Past due" metrics / overdue explainer are
        // exactly the "this might take a while" messaging that case needs,
        // so (unlike a swap, whose single-outbound case is already served
        // by swapOverview) it's routed here starting at 1 leg, not only
        // when the output is split across several.
        if (isWithdraw) return outCount >= 1
        if (outCount <= 1) return false
        if (i !== this.swapCardIndex) return false
        // A swap card that's still actively streaming defers to
        // streamingOverview instead (which bails safely if it ever sees
        // multiple legs while still mid-stream, see its own comment) —
        // don't show a "final" multi-leg summary while the stream could
        // still be producing more of it. Same 'Stream' stack/regex
        // streamingOverview itself reads to detect this.
        const streamMatch = c?.accordions
          ?.find((entry) => entry.name === 'accordion-action')
          ?.data?.stacks?.find((s) => s.key === 'Stream' && s.is)
          ?.value?.match(/(\d+)\s*\/\s*(\d+)/)
        if (
          streamMatch &&
          Number(streamMatch[2]) > 1 &&
          Number(streamMatch[1]) < Number(streamMatch[2])
        ) {
          return false
        }
        return true
      })
      if (index < 0) return null

      const card = this.cards[index]
      const overall = card?.details?.overall
      const input = overall?.in?.[0]
      const outs = overall?.out || []
      const kind = /^(trade|secure)\s*withdraw/i.test(
        card?.details?.title || ''
      )
        ? 'withdraw'
        : 'swap'
      if (!input?.asset) return null
      if (kind === 'swap' && outs.length < 2) return null
      if (kind === 'withdraw' && outs.length < 1) return null
      // A swap's out[] can legitimately mix the main output with an
      // affiliate-fee leg in a DIFFERENT asset (excluded below, unverified
      // shape) — but it can also legitimately mix the main output with a
      // PARTIAL REFUND leg: a limit/streaming swap that couldn't fully fill
      // within its price limit sends back whatever's left, in the input
      // asset, alongside whatever did execute (confirmed against a real
      // BTC->ETH limit/streaming swap,
      // 536C7E37EC65410A52E70673703220C2D1F91315ABB9B592200F9FE3A0EC71E7 —
      // out[] there is [ETH delivery, BTC refund]). A refund leg is
      // reliably identified by its asset matching the swap's OWN input
      // asset — a legitimate swap output is never the same asset as what
      // went in. Only one refund leg is handled (no verified case has
      // more); anything else mixed in still bails as unverified.
      const inputAssetStr = assetToString(assetFromString(input.asset))
      const refundLegsRaw =
        kind === 'swap'
          ? outs.filter(
              (o) => assetToString(assetFromString(o.asset)) === inputAssetStr
            )
          : []
      const deliveredOuts =
        kind === 'swap'
          ? outs.filter(
              (o) => assetToString(assetFromString(o.asset)) !== inputAssetStr
            )
          : outs
      if (kind === 'swap') {
        if (refundLegsRaw.length > 1 || deliveredOuts.length < 1) return null
        const deliveredAssetsMatch = deliveredOuts.every(
          (o) =>
            assetToString(assetFromString(o.asset)) ===
            assetToString(assetFromString(deliveredOuts[0].asset))
        )
        if (!deliveredAssetsMatch) return null
      }

      const actionAccordion = card?.accordions?.find(
        (entry) => entry.name === 'accordion-action'
      )
      const actionStacks = actionAccordion?.data?.stacks || []
      const inboundAccordion = card?.accordions?.find((entry) =>
        entry.name.startsWith('accordion-in-')
      )
      const inboundStacks = inboundAccordion?.data?.stacks || []

      // Precise (full base-unit precision, no 2dp rounding) — this hero
      // reads as a ledger reconciliation, where formatAssetAmount's usual
      // rounding would hide exactly the cents-level detail the "amount
      // accounting" rail card exists to show.
      // Bare ticker, not chain.ticker — the network's already shown by the
      // panel's own badge chip below, so repeating it in the amount line
      // (e.g. "458,000 ETH.USDT" instead of "458,000 USDT") is redundant.
      const precise = (amount, asset) =>
        `${this.baseAmountFormatOrZero(amount)} ${this.showTicker(asset)}`
      // A THORChain-internal settlement (e.g. a trade/secure-asset leg that
      // never leaves THORChain) has no real cross-chain outbound, so
      // THORNode fills out_txs[].id with an all-zero placeholder rather
      // than leaving it empty — createSwapState already filters this same
      // placeholder out elsewhere. A leg with this "hash" has no tx to
      // link to.
      const ZERO_HASH =
        '0000000000000000000000000000000000000000000000000000000000000000'

      const legs = deliveredOuts.map((leg, i) => {
        const etaBlocks = leg.outboundETA
        const pastDueBlocks =
          etaBlocks != null && etaBlocks < 0 ? -etaBlocks : null
        return {
          index: i,
          status: resolveOutboundLegStatus({
            done: !!leg.done,
            outboundETA: etaBlocks,
          }),
          hash: leg.txid && leg.txid !== ZERO_HASH ? leg.txid : null,
          to: leg.to || null,
          asset: leg.asset,
          amountRaw: Number(leg.amount) || 0,
          // buildCardDetails already carried this through as
          // createSwapState's own leg.amountUSD (swapMetadata.outPriceUSD
          // times the leg's amount — the same historical execution-time
          // price the input side uses, not a fresh live pool lookup) or,
          // for a withdrawal leg with no such price, its own pool-price
          // fallback. Either way, sum this instead of re-deriving from the
          // pool — outTxs was already filtered to exclude affiliate
          // payouts before any of these legs existed, so there's no
          // affiliate amount to accidentally fold in here.
          amountUsdRaw: Number(leg.amountUSD) || 0,
          usdAtExecution: !!leg.usdAtExecution,
          amountDisplay: precise(leg.amount, leg.asset),
          pastDueBlocks,
          pastDueDisplay: pastDueBlocks
            ? `~${moment.duration(pastDueBlocks * this.blockSeconds('THOR'), 'seconds').humanize()}`
            : null,
        }
      })

      // The single partial-refund leg (see the guard above) — kept out of
      // `legs`/totals/DeliveryBar entirely (it's a different asset, so it
      // has no place in a same-asset delivery percentage), surfaced
      // separately instead. The tx-wide 'Refund Reason' stack is unhelpful
      // here ("swap has been completed" — confirmed against the real tx
      // this was built for; parseActionReason doesn't recognize it either),
      // so `reason` is synthesized from what's actually verifiable: the
      // refunded share of the input. A PARTIAL refund (delivered legs +
      // this one, as opposed to refundOverview's onlyRefund case) only
      // happens one way in THORChain — a limit/streaming swap couldn't
      // fill the remainder within its price limit — so that's stated
      // directly rather than hedged.
      const refundLegRaw = refundLegsRaw[0] || null
      // Same accordion-out-N shape/ordering as accordions.out[] (built from
      // the same reordered outTxs cards.out[] is), so index legs.length —
      // one past the last delivered leg — is the refund's own accordion,
      // which (unlike overall.out[]) also carries the block height.
      const refundAccordionStacks = refundLegRaw
        ? card?.accordions?.find(
            (entry) => entry.name === `accordion-out-${legs.length}`
          )?.data?.stacks || []
        : []
      const refundHeight = refundLegRaw
        ? this.getNumericStackValue(refundAccordionStacks, 'Executed at')
        : null
      const refundPercent =
        refundLegRaw && input.amount > 0
          ? (Number(refundLegRaw.amount) / Number(input.amount)) * 100
          : null
      const refundLeg = refundLegRaw
        ? {
            // OutboundsTable numbers legs 1-based off this index — the
            // refund sits one past the last delivered leg, matching the
            // mockup ("Leg 5" after 4 delivered legs).
            index: legs.length,
            asset: refundLegRaw.asset,
            hash:
              refundLegRaw.txid && refundLegRaw.txid !== ZERO_HASH
                ? refundLegRaw.txid
                : null,
            to: refundLegRaw.to || null,
            amountRaw: Number(refundLegRaw.amount) || 0,
            amountDisplay: precise(refundLegRaw.amount, refundLegRaw.asset),
            amountUsdRaw: Number(refundLegRaw.amountUSD) || 0,
            amountUsdDisplay: this.formatUsdValue(refundLegRaw.amountUSD),
            note: `Unfilled remainder returned to the sender in the input asset — ${this.addressFormatV2(refundLegRaw.to)}.${refundHeight ? ` Delivered at block #${this.normalFormat(refundHeight)}.` : ''}`,
            reason:
              refundPercent != null
                ? `${refundPercent.toFixed(2)}% of the input could not be filled inside the swap's price limit, so it was returned to the sender as a separate outbound — it is not part of the ${this.showTicker(legs[0].asset)} received above.`
                : 'This portion could not be filled within the swap’s price limit, so it was returned to the sender.',
          }
        : null

      // Totals only mean anything when every leg is the same asset (true for
      // every trade/secure withdrawal, since they always split one asset
      // across outbounds) — a mixed-asset multi-out (e.g. a swap's main
      // output + a RUNE affiliate fee) has no single "percent delivered".
      const sameAsset = legs.every(
        (l) =>
          assetToString(assetFromString(l.asset)) ===
          assetToString(assetFromString(legs[0].asset))
      )
      // inputAmount is only a valid percent denominator when the input and
      // outbound legs are the SAME asset (a trade/secure withdrawal: the
      // trade-form and native-form amounts are 1:1 comparable). For a swap,
      // input is a different asset entirely (e.g. BTC in, USDT out) — using
      // it here would compare USDT delivered against a BTC total, off by
      // whatever the exchange rate happens to be. resolveTxOutboundTotals
      // already falls back to the outbound total (same-asset, always
      // correct) as its denominator when inputAmount is omitted.
      const totals = sameAsset
        ? resolveTxOutboundTotals(
            legs.map((l) => ({ status: l.status, amount: l.amountRaw })),
            kind === 'withdraw' ? { inputAmount: input.amount } : {}
          )
        : null
      const totalsAsset = sameAsset ? legs[0].asset : null

      const sameDestination = legs.every((l) => l.to === legs[0].to)
      const destination = sameDestination ? legs[0].to : null

      const overdueLegs = legs.filter((l) => l.status === 'overdue')
      const deliveredCount = legs.filter((l) => l.status === 'delivered').length
      // Every still-pending leg shares one tx-wide overdue signal (see
      // resolveOutboundLegStatus's doc comment), so the "past due" duration
      // is the same for all of them — take the first.
      const pastDueDisplay = overdueLegs[0]?.pastDueDisplay ?? null

      let status
      if (totals?.allDelivered) {
        status = { label: 'Delivered', tone: 'green' }
      } else if (deliveredCount === 0 && overdueLegs.length > 0) {
        status = { label: 'Overdue', tone: 'orange' }
      } else if (deliveredCount === 0) {
        status = { label: 'Pending', tone: 'yellow' }
      } else {
        status = { label: 'Partially settled', tone: 'yellow' }
      }

      const inputAssetParsed = assetFromString(input.asset)
      const assetTypeBadge = this.getNetworkBadge(inputAssetParsed)
      const destinationBadge = destination
        ? this.getNetworkBadge(assetFromString(totalsAsset || legs[0].asset))
        : null

      const time = this.splitTrailingParen(
        this.getStackDisplayValue(actionStacks, 'Timestamp')
      )
      const height = this.getNumericStackValue(actionStacks, 'Block Height')

      // Swap-only metrics — cardBuilder.js's action-accordion already
      // builds an 'Interval' stack (streaming/rapid-swap wording included)
      // and a 'Swap Slip' stack; withdrawals never set action.streaming or
      // action.swapSlip, so both are simply empty there.
      const intervalDisplay =
        kind === 'swap'
          ? this.getStackDisplayValue(actionStacks, 'Interval')
          : null
      const swapSlipPercent =
        kind === 'swap'
          ? this.getNumericStackValue(actionStacks, 'Swap Slip')
          : null
      const priceImpactDisplay =
        swapSlipPercent != null ? `-${swapSlipPercent.toFixed(2)}%` : null

      // Fee breakdown — same derivation swapOverview uses (rows of
      // {label, usd, subtle}, Total Fees Paid last), just gathering
      // 'Outbound Fee' stacks across every leg's own accordion-out-N
      // instead of the single one a normal swap has.
      const feeRows = (() => {
        const toRow = (label, formatted) => {
          const { usd, subtle } = this.splitFeeValue(formatted)
          return { label, usd, subtle }
        }
        const rows = []
        // The gas the sender paid on the source chain to get this tx
        // observed by THORChain — same 'Gas' stack/derivation
        // streamingOverview's own Fee Breakdown reads (also absent from
        // the shipped swapOverview hero's own breakdown — additive here
        // too, not a value that becomes available later).
        const inboundFee = this.formatFeeDisplay(
          this.getStackDisplayValue(inboundStacks, 'Gas')
        )
        if (inboundFee) rows.push(toRow('Inbound Fee', inboundFee))
        const outboundFeeStacks = card?.accordions
          ?.filter((entry) => entry.name.startsWith('accordion-out-'))
          .flatMap((entry) => entry.data?.stacks || [])
          .filter((stack) => stack.key === 'Outbound Fee' && stack.is)
        // A trade/secure withdrawal's leg carries its network cost as a
        // 'Gas' stack instead (createTradeWithdrawState threads
        // out_txs[].gas straight through — confirmed against a real BTC
        // trade withdrawal, 2F2A6BA57358AA14FC1738E20961EA600D9AF522FB6440329AF0EDF05D2D99F7,
        // whose out_txs[0].gas is 1540 sats — never the richer
        // fees[]/feeAssets[] array only createSwapState populates, so
        // buildOutboundAccordions's cardBuilder.js never emits an
        // 'Outbound Fee' stack for it). cardBuilder.js only builds the
        // 'Gas' stack when fees[] is empty, so this never double-counts
        // alongside outboundFeeStacks above.
        const outboundGasStacks = card?.accordions
          ?.filter((entry) => entry.name.startsWith('accordion-out-'))
          .flatMap((entry) => entry.data?.stacks || [])
          .filter((stack) => stack.key === 'Gas' && stack.is)
        rows.push(
          ...[...(outboundFeeStacks || []), ...(outboundGasStacks || [])]
            .map((stack, i) =>
              toRow(
                i === 0 ? 'Network Fee' : `Network Fee ${i + 1}`,
                this.formatFeeDisplay(this.formatStackValue(stack.value))
              )
            )
            .filter((r) => r.usd !== '$0.00')
        )
        if (kind === 'swap') {
          const liquidityFee = this.formatFeeDisplay(
            this.getStackDisplayValueByPrefix(actionStacks, 'Liquidity Fee')
          )
          if (liquidityFee) rows.push(toRow('Liquidity Fee', liquidityFee))
          // Same realized-vs-estimated split streamingOverview's Fee
          // Breakdown uses: 'Interface Fee' only has a value once THORChain
          // has actually paid the affiliate out (action.affiliateOut — a
          // leg tracked independently of the main delivery, so it can
          // still be unsettled even once every delivered leg has landed).
          // Fall back to the memo's own declared bps against the input
          // value, same as streamingOverview.
          const interfaceFee = this.formatFeeDisplay(
            this.getStackDisplayValue(actionStacks, 'Interface Fee')
          )
          if (interfaceFee) {
            rows.push(toRow('Affiliate Fee', interfaceFee))
          } else {
            const affiliateBps = this.getNumericStackValue(
              actionStacks,
              'Affiliate Basis'
            )
            const inputUsdForAffiliate =
              input.amountUSD ??
              this.amountToUSD(input.asset, input.amount, this.pools) ??
              0
            if (affiliateBps > 0 && inputUsdForAffiliate > 0) {
              const estUsd = inputUsdForAffiliate * (affiliateBps / 10000)
              rows.push({
                label: 'Affiliate Fee (est.)',
                usd: `$${this.formatFeeDisplay(estUsd)}`,
                subtle: `${(affiliateBps / 100).toFixed(2)}% of input value`,
              })
            }
          }
        }
        if (!rows.length) return []

        const totalUsd = rows.reduce(
          (sum, r) => sum + this.parseUsdAmount(r.usd),
          0
        )
        const inputUsdNum =
          input.amountUSD ??
          this.amountToUSD(input.asset, input.amount, this.pools) ??
          0
        const totalPct =
          inputUsdNum > 0
            ? `${((totalUsd / inputUsdNum) * 100).toFixed(3)}% of ${kind === 'swap' ? 'swap' : 'withdrawal'} value`
            : null
        rows.push({
          label: 'Total Fees Paid',
          usd: `$${this.formatFeeDisplay(totalUsd)}`,
          subtle: totalPct,
          isTotal: true,
        })
        return rows
      })()

      return {
        kind: 'multiOutbound',
        multiOutboundKind: kind,
        status,
        // camelCase() only spaces camelCase words ("trade Withdraw"), it
        // doesn't capitalize — fine for the legacy card title it was built
        // for, not for this hero's eyebrow/H1, so capitalize here. A
        // partial-refund swap's own legacy title is prefixed "refunded "
        // (createSwapState sets it whenever isRefund is true, regardless of
        // whether only PART of the swap was refunded) — misleading here
        // since most of the value can have delivered fine, so strip it.
        title:
          this.capitalizeFirst(
            card?.details?.title?.replace(/^refunded\s*/i, '')
          ) || 'Transaction',
        hasRefund: !!refundLeg,
        refundLeg,
        hash: this.$route.params.txhash,
        // Same field the shipped swapOverview hero reads for its own
        // Affiliate.vue badge (card.details.interface, set by createCard
        // from accordions.action.affiliateName) — shown regardless of
        // whether an affiliate fee actually settled yet (see feeRows
        // above), matching the base hero's own unconditional display.
        affiliateAddress: card?.details?.interface || null,
        from: this.getStackDisplayValue(inboundStacks, 'From'),
        inboundHash: this.getStackDisplayValue(inboundStacks, 'Hash'),
        destination,
        asset: input.asset,
        // getAssetDisplayName is a page-local method (not a global mixin),
        // so the hero component can't call it itself — resolved here, same
        // as streamingOverview's own inputName/outputName.
        assetName: this.getAssetDisplayName(input.asset),
        assetTypeBadge,
        destinationBadge,
        amountRaw: Number(input.amount) || 0,
        amountDisplay: precise(input.amount, input.asset),
        amountUsdDisplay: this.formatUsdValue(
          input.amountUSD ??
            this.amountToUSD(input.asset, input.amount, this.pools)
        ),
        amountUsdAtExecution: !!input.usdAtExecution,
        legs,
        sameAsset,
        totals,
        totalsAsset,
        totalsAssetName: totalsAsset
          ? this.getAssetDisplayName(totalsAsset)
          : this.getAssetDisplayName(input.asset),
        totalOutboundRaw: sameAsset ? totals.total : null,
        totalOutboundDisplay: sameAsset
          ? precise(totals.total, totalsAsset)
          : null,
        totalOutboundUsdDisplay: sameAsset
          ? this.formatUsdValue(
              legs.reduce((sum, l) => sum + l.amountUsdRaw, 0)
            )
          : null,
        // True only when every delivered leg's own USD figure is itself
        // execution-time-priced — one live-fallback leg makes the summed
        // total a mix, which the tooltip can't honestly call "at execution".
        totalOutboundUsdAtExecution:
          sameAsset && legs.every((l) => l.usdAtExecution),
        // Delivered + refunded — for the OutboundsTable "Total outbound"
        // summary specifically, which (once everything's settled) covers
        // the whole original input, not just what was received. The
        // RECEIVED panel above keeps totalOutboundUsdDisplay as-is (the
        // refund isn't part of what was "received").
        totalOutboundWithRefundUsdDisplay: sameAsset
          ? this.formatUsdValue(
              legs.reduce((sum, l) => sum + l.amountUsdRaw, 0) +
                (refundLeg?.amountUsdRaw || 0)
            )
          : null,
        // Unit-less, 2dp-rounded — for the H1's trailing clause (e.g.
        // "224.48 still to be delivered"), where the precise figure with
        // its ticker is already stated earlier in the same sentence.
        outstandingShortDisplay: sameAsset
          ? this.formatAssetAmount(totals.outstanding, totalsAsset).replace(
              /\s*\S+$/,
              ''
            )
          : null,
        intervalDisplay,
        feeRows,
        priceImpactDisplay,
        deliveredDisplay: sameAsset
          ? precise(totals.delivered, totalsAsset)
          : null,
        outstandingDisplay: sameAsset
          ? precise(totals.outstanding, totalsAsset)
          : null,
        deliveredCount,
        overdueCount: overdueLegs.length,
        pastDueDisplay,
        timeDisplay: time.main,
        timeAgoDisplay: time.paren,
        height,
        heightDisplay: height ? `#${this.normalFormat(height)}` : '-',
        memo: this.getStackDisplayValue(actionStacks, 'Memo'),
      }
    },
    // A swap still actively streaming, or done streaming but not yet
    // delivered (screen 1d + the outbound-pending transition the legacy UI
    // already showed via its own Inbound/Rapid Swap/Outbound accordions).
    // swapOverview bails on middle.pending for both, so this needs its own
    // resolver. Confirmed against real txs in both phases. Distinguished
    // from a plain single-swap "pending" (awaiting confirmation) by
    // quantity > 1; the 'outbound' phase (count >= quantity, output not
    // done yet) reads the SAME accordion-out-N stacks the legacy UI's
    // Outbound accordion already renders (Outbound Est./Outbound Delay
    // Est./Outbound Stage/Outbound Fee — all populated by
    // resolveOutboundSignal inside createSwapState), no new derivation
    // needed. Once output.done too, it's a fully settled swap — already
    // served by swapOverview. Static fields (asset/amount/memo/etc.) come
    // from the same cards/stacks every other *Overview reads; live
    // streaming progress (count/quantity/interval/in/out/deposit) comes
    // from a dedicated fetch (fetchStreamingProgress, watched below, only
    // while phase is 'streaming' — that endpoint returns zeroed data once
    // a stream is no longer active) since the accordion snapshot only has
    // count/quantity/interval, not the partial in/out amounts.
    streamingOverview() {
      if (this.swapCardIndex < 0) return null
      const card = this.cards[this.swapCardIndex]
      const overall = card?.details?.overall
      if (!overall?.middle?.pending) return null
      const input = overall?.in?.[0]
      const output = overall?.out?.[0]
      if (!input?.asset || !output?.asset) return null

      const actionAccordion = card?.accordions?.find(
        (entry) => entry.name === 'accordion-action'
      )
      const actionStacks = actionAccordion?.data?.stacks || []
      const inboundAccordion = card?.accordions?.find((entry) =>
        entry.name.startsWith('accordion-in-')
      )
      const inboundStacks = inboundAccordion?.data?.stacks || []
      const outboundAccordion = card?.accordions?.find((entry) =>
        entry.name.startsWith('accordion-out-')
      )
      const outboundStacks = outboundAccordion?.data?.stacks || []

      // A 'Stream' stack only exists for a genuine multi-chunk stream
      // (quantity > 1) — a PLAIN swap never has one at all, so it can't be
      // used to detect "swap done, outbound pending" generally. That state
      // applies to any swap, streaming or not: the action accordion's own
      // `done` (inbound finalised + swap finalised/not pending) is true
      // once the swap itself has executed, independent of whether it
      // streamed. Confirmed against a real plain (non-streaming) swap
      // stuck exactly in this window, still on the legacy path before this
      // fix — quantity<=1 alone was wrongly excluding it.
      const streamMatch = this.getStackDisplayValue(
        actionStacks,
        'Stream'
      ).match(/(\d+)\s*\/\s*(\d+)/)
      const isStreaming = !!streamMatch && Number(streamMatch[2]) > 1
      const swapExecuted = !!actionAccordion?.data?.done
      if (!isStreaming && !swapExecuted) return null
      if (output.done) return null

      const snapshotCount = isStreaming ? Number(streamMatch[1]) : 1
      const snapshotQuantity = isStreaming ? Number(streamMatch[2]) : 1
      const streamingDone = isStreaming && snapshotCount >= snapshotQuantity
      const phase = !isStreaming || streamingDone ? 'outbound' : 'streaming'

      // output above only reads the first leg — fine once the stream is
      // done (multiOutboundOverview's swap-kind branch defers to this
      // computed while still actively streaming, then takes over once it
      // isn't, see its own 'Stream' stack check), but if the destination
      // chain's per-tx cap ever splits an outbound before the stream
      // itself finishes, a single-leg read here would silently understate
      // the real total. No verified real tx has shown that actually
      // happening mid-stream — THORChain's own out_txs only appeared once
      // settlement started in every case checked — so this is a safety
      // bail, not a confirmed gap: fall through to the legacy page rather
      // than risk misrepresenting it.
      if (phase === 'streaming' && (overall.out?.length ?? 0) > 1) return null

      // Bare ticker, not chain.ticker — the network's already shown by the
      // panel's own badge chip below, so repeating it in the amount line
      // (e.g. "458,000 ETH.USDT" instead of "458,000 USDT") is redundant.
      const precise = (amount, asset) =>
        `${this.baseAmountFormatOrZero(amount)} ${this.showTicker(asset)}`

      const time = this.splitTrailingParen(
        this.getStackDisplayValue(actionStacks, 'Timestamp')
      )
      const height = this.getNumericStackValue(actionStacks, 'Block Height')
      const swapSlipPercent = this.getNumericStackValue(
        actionStacks,
        'Swap Slip'
      )

      // Fee breakdown — same derivation as multiOutboundOverview's, minus
      // the per-leg outbound-fee gathering (nothing's been paid out yet).
      const feeRows = (() => {
        const toRow = (label, formatted) => {
          const { usd, subtle } = this.splitFeeValue(formatted)
          return { label, usd, subtle }
        }
        const rows = []
        // The gas the sender paid on the source chain to get this tx
        // observed by THORChain — buildInboundAccordions' own 'Gas' stack,
        // same "amount ASSET ($usd)" shape every other fee stack here uses.
        // Not shown by the shipped swapOverview hero's own Fee Breakdown
        // either — genuinely new, not a value that becomes available later.
        const inboundFee = this.formatFeeDisplay(
          this.getStackDisplayValue(inboundStacks, 'Gas')
        )
        if (inboundFee) rows.push(toRow('Inbound Fee', inboundFee))
        const liquidityFee = this.formatFeeDisplay(
          this.getStackDisplayValueByPrefix(actionStacks, 'Liquidity Fee')
        )
        if (liquidityFee) rows.push(toRow('Liquidity Fee (est.)', liquidityFee))
        // 'Interface Fee' (cardBuilder.js) only has a value once THORChain
        // has actually paid the affiliate out — gated on
        // action.affiliateOut.length > 0. For a streaming swap, that
        // payout is only realized once the stream settles (confirmed: the
        // stack is silently absent — not zero, absent — for the whole
        // active-streaming window), so this row would otherwise vanish
        // even though the fee is guaranteed to be charged. Fall back to
        // estimating it from the memo's own declared bps ('Affiliate
        // Basis', available immediately, independent of payout status)
        // against the input value, labeled "(est.)" since it hasn't
        // actually gone out yet — same reasoning as Liquidity Fee (est.)
        // above, and the same "(est)" convention cardBuilder.js already
        // uses for Liquidity Fee while a stream is still running.
        const interfaceFee = this.formatFeeDisplay(
          this.getStackDisplayValue(actionStacks, 'Interface Fee')
        )
        if (interfaceFee) {
          rows.push(toRow('Affiliate Fee', interfaceFee))
        } else {
          const affiliateBps = this.getNumericStackValue(
            actionStacks,
            'Affiliate Basis'
          )
          const inputUsdForAffiliate =
            input.amountUSD ??
            this.amountToUSD(input.asset, input.amount, this.pools) ??
            0
          if (affiliateBps > 0 && inputUsdForAffiliate > 0) {
            const estUsd = inputUsdForAffiliate * (affiliateBps / 10000)
            rows.push({
              label: 'Affiliate Fee (est.)',
              usd: `$${this.formatFeeDisplay(estUsd)}`,
              subtle: `${(affiliateBps / 100).toFixed(2)}% of input value`,
            })
          }
        }
        if (!rows.length) return []
        const totalUsd = rows.reduce(
          (sum, r) => sum + this.parseUsdAmount(r.usd),
          0
        )
        const inputUsdNum =
          input.amountUSD ??
          this.amountToUSD(input.asset, input.amount, this.pools) ??
          0
        const totalPct =
          inputUsdNum > 0
            ? `${((totalUsd / inputUsdNum) * 100).toFixed(3)}% of swap value (est.)`
            : null
        rows.push({
          label: 'Total Fees Paid (est.)',
          usd: `$${this.formatFeeDisplay(totalUsd)}`,
          subtle: totalPct,
          isTotal: true,
        })
        return rows
      })()

      return {
        kind: 'streaming',
        status: { label: 'In progress', tone: 'yellow' },
        hash: this.$route.params.txhash,
        // Same field the shipped swapOverview hero reads for its own
        // Affiliate.vue badge (card.details.interface, set by createCard
        // from accordions.action.affiliateName) — not derived here.
        affiliateAddress: card?.details?.interface || null,
        from: this.getStackDisplayValue(inboundStacks, 'From'),
        inboundHash: this.getStackDisplayValue(inboundStacks, 'Hash'),
        destination: output.to || null,
        asset: input.asset,
        // Full chain name for a chain's own gas asset (BTC.BTC ->
        // "Bitcoin", ETH.ETH -> "Ethereum"), bare ticker otherwise (ETH.USDC
        // -> "USDC") — matches the shipped swapOverview hero's own
        // .tx-asset-primary convention (getAssetDisplayName, page-local
        // only, not reachable from this child component).
        inputName: this.getAssetDisplayName(input.asset),
        assetBadge: this.getNetworkBadge(assetFromString(input.asset)),
        amountRaw: Number(input.amount) || 0,
        amountDisplay: precise(input.amount, input.asset),
        amountUsdDisplay: this.formatUsdValue(
          input.amountUSD ??
            this.amountToUSD(input.asset, input.amount, this.pools)
        ),
        amountUsdAtExecution: !!input.usdAtExecution,
        outputAsset: output.asset,
        outputName: this.getAssetDisplayName(output.asset),
        outputAssetBadge: this.getNetworkBadge(assetFromString(output.asset)),
        phase,
        isStreaming,
        // The swap's full projected FINAL total (swapMetadata's
        // streamingSwapMeta.outEstimation, computed once at swap creation)
        // — a distinct figure from "so far" below. createSwapState
        // re-derives this on every rebuild, so no separate fetch needed.
        // Once phase is 'outbound' this is no longer just a projection —
        // streaming's done, so it's the real determined output.
        outputProjectedRaw: Number(output.amount) || 0,
        outputProjectedDisplay: precise(output.amount, output.asset),
        outputProjectedUsdDisplay: this.formatUsdValue(output.amountUSD),
        // Shared by both the projected total and "so far" USD figures
        // below — outputSoFarUsdDisplay is scaled proportionally off this
        // same output.amountUSD (see buildStreamingProgress), so it carries
        // the same price basis.
        outputUsdAtExecution: !!output.usdAtExecution,
        // "So far" (outputSoFarDisplay/-UsdDisplay) comes from the live
        // fetch below and stays null until it resolves (or once phase is
        // 'outbound' — see buildStreamingProgress) — deliberately not
        // falling back to outputProjectedDisplay, which would overstate
        // progress mid-stream (it's the full swap's total, not what's
        // landed yet).
        ...this.buildStreamingProgress(
          { snapshotCount, snapshotQuantity, phase },
          input.asset,
          output
        ),
        // Outbound-phase fields — read straight from the accordion-out-N
        // stacks buildOutboundAccordions already builds from
        // resolveOutboundSignal's output (the same data the legacy
        // Outbound accordion renders), not re-derived here.
        outboundHash: this.getStackDisplayValue(outboundStacks, 'Hash'),
        outboundEstDisplay: this.getStackDisplayValue(
          outboundStacks,
          'Outbound Est.'
        ),
        outboundDelayEstDisplay: this.getStackDisplayValue(
          outboundStacks,
          'Outbound Delay Est.'
        ),
        // Raw seconds for the live countdown bar — read straight off the
        // accordion's own data.remainingTime/totalTime, the exact same pair
        // the legacy Accordion.vue already drives its circular countdown
        // timer from for this same outbound entry (buildOutboundAccordions
        // sets both equal at build time; Accordion.vue ticks a local timer
        // down from there client-side, see its startCountdown/updateCircle
        // — StreamingSwapHero's bar mirrors that exact pattern rather than
        // re-deriving from outboundDelayRemaining independently).
        outboundDelayRemainingSeconds:
          outboundAccordion?.data?.remainingTime || 0,
        outboundDelayTotalSeconds: outboundAccordion?.data?.totalTime || 0,
        outboundPastDueDisplay: this.getStackDisplayValue(
          outboundStacks,
          'Past Due'
        ),
        outboundStages:
          outboundStacks.find((s) => s.key === 'Outbound Stage' && s.is)
            ?.value || [],
        outboundFeeDisplay:
          outboundStacks
            .filter((s) => s.key === 'Outbound Fee' && s.is)
            .map((s) => this.formatStackValue(s.value))
            .join(', ') || null,
        intervalDisplay: this.getStackDisplayValue(actionStacks, 'Interval'),
        rateDisplay: this.getStackDisplayValue(actionStacks, 'Rate'),
        priceImpactDisplay:
          swapSlipPercent != null ? `-${swapSlipPercent.toFixed(2)}%` : null,
        feeRows,
        timeDisplay: time.main,
        timeAgoDisplay: time.paren,
        height,
        heightDisplay: height ? `#${this.normalFormat(height)}` : '-',
        memo: this.getStackDisplayValue(actionStacks, 'Memo'),
      }
    },
    // Mimir votes always come through createAbstractState's mimir branch
    // (no dedicated builder) — that branch only carries the tx's own vote
    // (node address, key, value); the network-wide tally/threshold/current
    // effective value come from a live fetch (fetchMimirConsensus, watched
    // below), the same "gap" pattern as bondOverview's node snapshot.
    mimirOverview() {
      if (!this.cards?.length) return null
      const index = this.cards.findIndex((c) => c?.details?.title === 'Mimir')
      if (index < 0) return null

      const card = this.cards[index]
      const overall = card?.details?.overall

      const actionAccordion = card?.accordions?.find(
        (entry) => entry.name === 'accordion-action'
      )
      const stacks = actionAccordion?.data?.stacks || []
      const inboundAccordion = card?.accordions?.find(
        (entry) => entry.name === 'accordion-in-0'
      )
      const inboundStacks = inboundAccordion?.data?.stacks || []

      const key = this.getStackDisplayValue(stacks, 'Mimir Key')
      if (!key) return null
      const value = this.getStackDisplayValue(stacks, 'Mimir Value')
      const nodeAddress =
        overall?.in?.[0]?.address ||
        this.getStackDisplayValue(inboundStacks, 'From')
      const time = this.splitTrailingParen(
        this.getStackDisplayValue(stacks, 'Timestamp')
      )
      const height = this.getNumericStackValue(stacks, 'Block Height')

      return {
        kind: 'mimir',
        status: this.getOverviewStatus(overall?.middle),
        hash: this.$route.params.txhash,
        nodeAddress,
        key,
        value,
        memo: `mimir:${key}:${value}`,
        timeDisplay: time.main,
        timeAgoDisplay: time.paren,
        height,
        heightDisplay: height ? `#${this.normalFormat(height)}` : '-',
      }
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

      const midgardSwap =
        (this.rawActions || []).find((a) => a.type === 'swap') ??
        (this.rawActions || []).find((a) => a.type === 'limit_swap')
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

      // Historical prices at the time the swap executed — more accurate than
      // current pool prices for displaying USD values.
      const swapMeta =
        midgardSwap?.metadata?.swap ?? midgardSwap?.metadata?.limit_swap
      // Whether the displayed USD value is derived from the historical
      // inPriceUSD/outPriceUSD (price at the moment the swap executed) rather
      // than a current-price fallback. Drives the USD tooltip wording.
      const inUsdAtExecution = !!swapMeta?.inPriceUSD
      const outUsdAtExecution = !!swapMeta?.outPriceUSD
      const nonContractInUsdRaw = swapMeta?.inPriceUSD
        ? (parseFloat(input.amount) / 1e8) * parseFloat(swapMeta.inPriceUSD)
        : parseFloat(input.amountUSD) || 0
      const nonContractOutUsdRaw = swapMeta?.outPriceUSD
        ? (parseFloat(output.amount) / 1e8) * parseFloat(swapMeta.outPriceUSD)
        : parseFloat(output.amountUSD) || 0

      // When the contract action is a Market Order (FIN DEX), extract the
      // true user-facing amounts from the contract events rather than using
      // the midgard amounts which only reflect the tiny THORChain-native leg.
      let contractDisplay = null
      if (contractAction && contractActionType) {
        const cEvents = contractAction.metadata?.contract?.contractEvents || []
        const cToAttrs = (e) =>
          Object.fromEntries(
            (e.attributes || []).map(({ key, value }) => [key, value])
          )
        // Prefer the swap action's sender; the contractAction.in address is often
        // the CosmWasm executor module account, not the actual user
        const cUserAddr =
          midgardSwap?.in?.[0]?.address || contractAction.in?.[0]?.address || ''

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
                a.spender === cUserAddr && a.amount && !/rune$/i.test(a.amount)
            )
          if (spentAttr) {
            cFundsAmount = parseInt(spentAttr.amount) || 0
            cFundsDenom = spentAttr.amount.replace(/^\d+/, '').trim()
          }
        }

        // Output: aggregate all coin_received events where the receiver is the
        // tx sender (contractAction.in[0]). This reflects what actually arrived
        // in the sender's wallet regardless of internal contract routing.
        const cReceivedByDenom = {}
        const cSenderAddr = contractAction.in?.[0]?.address || ''
        if (cSenderAddr) {
          cEvents
            .filter((e) => e.type === 'coin_received')
            .map(cToAttrs)
            .filter((a) => a.receiver === cSenderAddr && a.amount)
            .forEach((a) => {
              a.amount.split(',').forEach((part) => {
                const p = part.trim()
                const amt = parseInt(p) || 0
                const denom = p.replace(/^\d+/, '').trim()
                if (denom && amt > 0)
                  cReceivedByDenom[denom] = (cReceivedByDenom[denom] || 0) + amt
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
          const cInUsdRaw = this.amountToUSD(
            cInAssetStr,
            cFundsAmount,
            this.pools
          )
          const cOutUsdRaw = this.amountToUSD(
            cOutAssetStr,
            cReceivedAmt,
            this.pools
          )
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
              usdAtExecution: inUsdAtExecution,
              txId: inboundHash,
              secure: contractDisplay.inputSecure ?? false,
            }
          : {
              asset: input.asset,
              name: this.getAssetDisplayName(input.asset),
              badge: this.getNetworkBadge(inputAsset),
              amount: this.formatAssetAmount(input.amount, input.asset),
              usd: this.formatUsdValue(nonContractInUsdRaw),
              usdAtExecution: inUsdAtExecution,
              txId: inboundHash,
            },
        output: contractDisplay
          ? {
              asset: contractDisplay.outputAsset,
              name: contractDisplay.outputName,
              badge: contractDisplay.outputBadge,
              amount: contractDisplay.outputAmount,
              usd: contractDisplay.outputUsd,
              usdAtExecution: outUsdAtExecution,
              txId: outboundHash,
            }
          : {
              asset: output.asset,
              name: this.getAssetDisplayName(output.asset),
              badge: this.getNetworkBadge(outputAsset),
              amount: this.formatAssetAmount(output.amount, output.asset),
              usd: this.formatUsdValue(nonContractOutUsdRaw),
              usdAtExecution: outUsdAtExecution,
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
              : nonContractInUsdRaw
            const outUsd = contractDisplay
              ? contractDisplay.outputUsdRaw || 0
              : nonContractOutUsdRaw
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
            contractAction
              ? {
                  label: 'User',
                  address:
                    contractAction?.in?.[0]?.address ||
                    this.thorStatus?.tx?.from_address,
                  type: 'address',
                }
              : {
                  label: 'From',
                  address:
                    this.getStackDisplayValue(inboundStacks, 'From') ||
                    this.thorStatus?.tx?.from_address,
                  type: 'address',
                },
            !contractAction
              ? {
                  label: 'To',
                  address:
                    this.getStackDisplayValue(outboundStacks, 'Destination') ||
                    outTxs?.[0]?.to_address ||
                    memo?.destAddr,
                  type: 'address',
                }
              : null,
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
            const contractFailed =
              (contractAction?.metadata?.contract?.code ?? 0) > 0
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
            // Fallback: outbound accordion has no 'Outbound Fee' stacks for native
            // RUNE outputs (no on-chain tx), so read from midgard metadata instead
            ...(networkFees.length === 0 && swapMeta?.networkFees?.length
              ? swapMeta.networkFees.map((fee, i) => {
                  const ticker = assetFromString(fee.asset)?.ticker || fee.asset
                  const amount = parseInt(fee.amount) || 0
                  const usdRaw = this.amountToUSD(fee.asset, amount, this.pools)
                  return {
                    label: i === 0 ? 'Network Fee' : `Network Fee ${i + 1}`,
                    usd: `$${this.formatFeeDisplay(usdRaw)}`,
                    subtle: `${this.baseAmountFormatOrZero(amount)} ${ticker}`,
                  }
                })
              : []),
            liquidityFee
              ? toRow('Liquidity Fee', liquidityFee)
              : (() => {
                  const amount = parseInt(swapMeta?.liquidityFee || '') || 0
                  if (!amount) return null
                  const usdRaw = this.amountToUSD(
                    'THOR.RUNE',
                    amount,
                    this.pools
                  )
                  return {
                    label: 'Liquidity Fee',
                    usd: `$${this.formatFeeDisplay(usdRaw)}`,
                    subtle: `${this.baseAmountFormatOrZero(amount)} RUNE`,
                  }
                })(),
            toRow('Affiliate Fee', interfaceFee || null),
          ].filter(Boolean)

          const totalUsd = rows.reduce(
            (sum, r) => sum + this.parseUsdAmount(r.usd),
            0
          )
          const inputUsdNum = nonContractInUsdRaw
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
          contractAction
            ? this.buildTechRow(
                'From',
                contractAction?.in?.[0]?.address ||
                  this.getStackDisplayValue(inboundStacks, 'From'),
                'address'
              )
            : null,
          contractAction
            ? this.buildTechRow(
                'To',
                contractAction?.out?.[0]?.address ||
                  this.getStackDisplayValue(outboundStacks, 'Destination'),
                'address'
              )
            : null,
          this.buildTechRow(
            'Memo',
            contractAction?.metadata?.contract?.memo ||
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

      // DAO DAO proposal execution: check before the mixed-action guard because
      // the proposal can trigger other action types (e.g., a swap) as side effects
      const proposalAction = contractActions.find((a) => {
        const msg = a.metadata?.contract?.msg
        return (
          msg?.execute &&
          !Array.isArray(msg.execute) &&
          msg.execute.proposal_id !== undefined
        )
      })
      if (proposalAction) {
        const action = proposalAction
        const senderAddress = action.in?.[0]?.address || ''
        const events = action.metadata?.contract?.contractEvents || []
        const toAttrs = (e) =>
          Object.fromEntries(
            (e.attributes || []).map(({ key, value }) => [key, value])
          )
        const proposalId = action.metadata.contract.msg.execute.proposal_id
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

        const proposalWasmEvent = events.find(
          (e) =>
            e.type === 'wasm' &&
            (e.attributes || []).some((a) => a.key === 'proposal_id')
        )
        const wasmAttrs = proposalWasmEvent ? toAttrs(proposalWasmEvent) : {}
        const daoAddress = wasmAttrs.dao || ''
        const daoLabel =
          getRujiraContractLabel(daoAddress) ||
          (daoAddress ? this.formatAddress(daoAddress) : 'DAO')

        return {
          rawEvents: events,
          rawMsg: action?.metadata?.contract?.msg || null,
          title: `Execute Proposal #${proposalId}`,
          metaLabel: `Execute Proposal · ${daoLabel}`,
          status,
          affiliateAddress: '',
          actionTypeTitle: 'contract',
          hasContractAction: true,
          priority: true,
          labels: [],
          pairDisplay: null,
          input: {
            asset: null,
            name: 'Executor',
            badge: senderAddress ? this.formatAddress(senderAddress) : '',
            amount: `Proposal #${proposalId}`,
            usd: null,
          },
          output: {
            asset: null,
            name: 'DAO',
            badge: daoAddress ? this.formatAddress(daoAddress) : '',
            amount: status.label,
            usd: null,
          },
          metricRows: [
            { label: 'Proposal', value: `#${proposalId}` },
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
              value: daoLabel,
              tone: this.getProductTone(daoLabel),
              type: 'product',
            },
            {
              label: 'Action',
              value: 'Execute Proposal',
              tone: this.getContractTypeTone('Execute Proposal'),
              type: 'product',
            },
            { label: 'Proposal', value: `#${proposalId}` },
            daoAddress
              ? { label: 'DAO', address: daoAddress, type: 'address' }
              : null,
            { label: 'Status', value: status.label, type: 'status' },
            timestamp
              ? { label: 'Time', value: timestamp.format('lll') }
              : null,
            height
              ? { label: 'Block', value: `#${this.normalFormat(height)}` }
              : null,
            senderAddress
              ? { label: 'Executor', address: senderAddress, type: 'address' }
              : null,
          ].filter(Boolean),
          lifecycleRows: [
            {
              icon: 'CheckIcon',
              title: `Proposal #${proposalId} executed`,
              body: daoAddress ? `DAO: ${this.formatAddress(daoAddress)}` : '',
            },
            ...(hasError && logs
              ? [{ icon: 'WarningIcon', title: 'Execution failed', body: logs }]
              : []),
          ],
          feeRows: [],
          technicalRows: [
            senderAddress
              ? this.buildTechRow('Executor', senderAddress, 'address')
              : null,
            daoAddress
              ? this.buildTechRow('DAO address', daoAddress, 'address')
              : null,
          ].filter(Boolean),
        }
      }

      // FIN market swaps may co-occur with a THORChain swap action (e.g. USDC→RUNE
      // as a funding hop). Detect them before the mixed-action guard so they aren't
      // silently suppressed in favour of the companion swap overview.
      const hasFINMarketContract = contractActions.some((a) => {
        if (a.metadata?.contract?.msg?.swap) return true
        return (a.metadata?.contract?.contractEvents || []).some(
          (e) => e.type === 'wasm-rujira-fin/trade'
        )
      })

      if (
        !hasFINMarketContract &&
        this.rawActions.some(
          (a) => a.type !== 'contract' && a.type !== 'refund'
        )
      )
        return null

      // Order Book Clearing: any contract action has memo "OB Clearing"
      const obClearingAction = contractActions.find(
        (a) => a.metadata?.contract?.memo === 'OB Clearing'
      )
      if (obClearingAction) {
        const allEvents = contractActions.flatMap(
          (a) => a.metadata?.contract?.contractEvents || []
        )
        const toAttrs = (e) =>
          Object.fromEntries(
            (e.attributes || []).map(({ key, value }) => [key, value])
          )
        const hasError = contractActions.some(
          (a) => (a.metadata?.contract?.code ?? 0) > 0
        )
        const logs = obClearingAction.metadata?.contract?.logs
        const status = hasError
          ? { label: 'Failed', tone: 'red' }
          : { label: 'Success', tone: 'green' }
        const date = obClearingAction.date
        const timestamp = date ? moment.unix(parseInt(date) / 1e9) : null
        const height = parseInt(obClearingAction.height)

        // FIN pair from first trade event
        const firstTrade = allEvents.find(
          (e) => e.type === 'wasm-rujira-fin/trade'
        )
        const finPairAddr = firstTrade
          ? toAttrs(firstTrade)._contract_address || ''
          : ''
        const finPairLabel =
          getRujiraContractLabel(finPairAddr) || this.formatAddress(finPairAddr)

        // Count non-CCL fills and compute avg rate
        const nonCCLTrades = allEvents
          .filter((e) => e.type === 'wasm-rujira-fin/trade')
          .map(toAttrs)
          .filter((a) => !String(a.price || '').startsWith('ccl:'))
        const fillCount = nonCCLTrades.length
        const rates = nonCCLTrades
          .map((a) => parseFloat(a.rate))
          .filter((r) => !isNaN(r))
        const avgRate = rates.length
          ? rates.reduce((s, r) => s + r, 0) / rates.length
          : null

        // Input/output: what the sender address actually sends and receives
        const senderAddr = obClearingAction.in?.[0]?.address || ''
        const sumByDenom = (events, addrKey, addrVal) => {
          const byDenom = {}
          events
            .filter(
              (e) => e.type === 'coin_spent' || e.type === 'coin_received'
            )
            .map(toAttrs)
            .filter((a) => a[addrKey] === addrVal && a.amount)
            .forEach((a) => {
              a.amount.split(',').forEach((part) => {
                const p = part.trim()
                const amt = parseInt(p) || 0
                const denom = p.replace(/^\d+/, '').trim()
                if (denom && amt > 0)
                  byDenom[denom] = (byDenom[denom] || 0) + amt
              })
            })
          return byDenom
        }
        const spentByDenom = sumByDenom(allEvents, 'spender', senderAddr)
        const receivedByDenom = sumByDenom(allEvents, 'receiver', senderAddr)

        const denomToAssetStr = (denom) =>
          denom === 'rune' ? 'THOR.RUNE' : securedToAsset(denom).toUpperCase()

        const primaryInDenom = Object.keys(spentByDenom)[0] || ''
        const primaryInAmt = spentByDenom[primaryInDenom] || 0
        const primaryInAssetStr = primaryInDenom
          ? denomToAssetStr(primaryInDenom)
          : ''
        const primaryInAsset = primaryInAssetStr
          ? assetFromString(primaryInAssetStr)
          : null
        const primaryInTicker = primaryInAsset?.ticker || primaryInDenom

        const primaryOutDenom =
          Object.keys(receivedByDenom).find((d) => d !== primaryInDenom) ||
          Object.keys(receivedByDenom)[0] ||
          ''
        const primaryOutAmt = receivedByDenom[primaryOutDenom] || 0
        const primaryOutAssetStr = primaryOutDenom
          ? denomToAssetStr(primaryOutDenom)
          : ''
        const primaryOutAsset = primaryOutAssetStr
          ? assetFromString(primaryOutAssetStr)
          : null
        const primaryOutTicker = primaryOutAsset?.ticker || primaryOutDenom

        // Sender's own action: the resting limit order that triggered clearing.
        // (The arb / trade / range.fee events settle OTHER users' resting orders
        // and are intentionally not attributed to the sender.)
        const senderOrderCreate = allEvents
          .filter((e) => e.type === 'wasm-rujira-fin/order.create')
          .map(toAttrs)
          .find((a) => a.owner === senderAddr)
        const senderOrderPrice = senderOrderCreate
          ? String(senderOrderCreate.price || '').replace(/^fixed:/, '')
          : ''

        return {
          rawEvents: allEvents,
          rawMsg: obClearingAction.metadata?.contract?.msg || null,
          title: `Order Book Clearing · ${finPairLabel}`,
          metaLabel: `Order Book Clearing · ${finPairLabel}`,
          status,
          affiliateAddress: '',
          actionTypeTitle: 'contract',
          hasContractAction: true,
          priority: true,
          labels: [],
          pairDisplay: null,
          input: primaryInAmt
            ? {
                asset: primaryInAssetStr || null,
                name: primaryInTicker,
                badge: this.getNetworkBadge(primaryInAsset) || '',
                amount: `${this.baseAmountFormatOrZero(primaryInAmt)} ${primaryInTicker}`,
                usd: this.formatUsdValue(
                  this.amountToUSD(primaryInAssetStr, primaryInAmt, this.pools)
                ),
              }
            : null,
          output: primaryOutAmt
            ? {
                asset: primaryOutAssetStr || null,
                name: primaryOutTicker,
                badge: this.getNetworkBadge(primaryOutAsset) || '',
                amount: `${this.baseAmountFormatOrZero(primaryOutAmt)} ${primaryOutTicker}`,
                usd: this.formatUsdValue(
                  this.amountToUSD(
                    primaryOutAssetStr,
                    primaryOutAmt,
                    this.pools
                  )
                ),
              }
            : null,
          metricRows: [
            fillCount ? { label: 'Fills', value: String(fillCount) } : null,
            avgRate ? { label: 'Avg Rate', value: avgRate.toFixed(6) } : null,
          ].filter(Boolean),
          detailRows: [
            {
              label: 'Product',
              value: 'RUJI Trade',
              tone: this.getProductTone('RUJI Trade'),
              type: 'product',
            },
            {
              label: 'Action',
              value: 'Order Book Clearing',
              tone: this.getContractTypeTone('OB Clearing'),
              type: 'product',
            },
            { label: 'FIN Pair', value: finPairLabel },
            { label: 'Status', value: status.label, type: 'status' },
            timestamp
              ? { label: 'Time', value: timestamp.format('lll') }
              : null,
            height
              ? { label: 'Block', value: `#${this.normalFormat(height)}` }
              : null,
          ].filter(Boolean),
          lifecycleRows: hasError
            ? [
                {
                  icon: 'WarningIcon',
                  title: 'OB Clearing failed',
                  body: logs || '',
                },
              ]
            : [
                senderOrderCreate
                  ? {
                      icon: 'ArrowIcon',
                      iconRotate: 90,
                      title: 'Resting limit order placed',
                      body:
                        [
                          primaryInAmt
                            ? `${this.baseAmountFormatOrZero(primaryInAmt)} ${primaryInTicker} committed`
                            : null,
                          senderOrderPrice ? `at ${senderOrderPrice}` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || `on ${finPairLabel}`,
                    }
                  : null,
                {
                  icon: 'CheckIcon',
                  title: 'Order Book Clearing complete',
                  body: finPairLabel,
                },
              ].filter(Boolean),
          feeRows: [],
          technicalRows: [
            senderAddr
              ? this.buildTechRow('From address', senderAddr, 'address')
              : null,
            obClearingAction.metadata?.contract?.memo
              ? this.buildTechRow(
                  'Memo',
                  obClearingAction.metadata.contract.memo
                )
              : null,
          ].filter(Boolean),
        }
      }

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
        const allNullQty = orders.every(
          (o) => o[2] === null || o[2] === undefined
        )
        const orderVerb = allNullQty ? 'claimed' : 'placed'

        // Scale order: multiple limit orders placed in one execution
        const isScaleOrder = orders.length > 1
        const actionLabel = isScaleOrder ? 'Scale Order' : 'Limit Order'

        // Total funds committed (for scale order input card)
        const fundsStr = action.metadata?.contract?.funds || ''
        const fundsAmount = parseInt(fundsStr) || 0
        const fundsDenom = fundsStr.replace(/^\d+/, '').trim()
        const fundsAssetStr = fundsDenom
          ? securedToAsset(fundsDenom).toUpperCase()
          : ''
        const fundsAssetParsed = fundsAssetStr
          ? assetFromString(fundsAssetStr)
          : null
        const fundsTicker = fundsAssetParsed?.ticker || fundsDenom

        // Parse pair base/quote assets from registry contractLabel: "rujira-fin:{base}:{quote}"
        const pairEntry = getRujiraContractEntry(contractAddress)
        const pairLabelParts = (pairEntry?.contractLabel || '').split(':')
        const baseDenom = pairLabelParts[1] || ''
        const baseAssetStr = baseDenom
          ? securedToAsset(baseDenom).toUpperCase()
          : ''
        const baseAssetParsed = baseAssetStr
          ? assetFromString(baseAssetStr)
          : null
        const baseTicker = baseAssetParsed?.ticker || baseDenom
        const quoteDenom = pairLabelParts[2] || ''
        const quoteAssetStr =
          (quoteDenom ? securedToAsset(quoteDenom).toUpperCase() : '') ||
          fundsAssetStr
        const quoteAssetParsed = quoteAssetStr
          ? assetFromString(quoteAssetStr)
          : null
        const quoteTicker =
          quoteAssetParsed?.ticker || quoteDenom || fundsTicker

        // Per-order table rows + raw totals for scale order display
        // Order format: [side_string, { fixed: price }, amount_string_or_null]
        //   side: "quote" = Buy (spend quote to get base), "base" = Sell (spend base to get quote)
        //   amount: null = no-op (existing order kept), "0" = retract, positive = new order
        let totalReturnRaw = 0
        let orderSideIsBuy = true
        const orderRows = isScaleOrder
          ? orders.map((order) => {
              const sideStr = order[0] // "quote" or "base"
              const priceSpec = order[1] // { fixed: "2327.4" }
              const isKeep = order[2] === null || order[2] === undefined
              const amount = isKeep ? 0 : parseInt(order[2]) || 0
              const price = parseFloat(priceSpec?.fixed) || 0
              const isBuy = sideStr === 'quote'
              const isRetract = !isKeep && amount === 0

              // Return = what you receive when fully filled
              // Buy: spent quote, receive base → ret = amount / price (base units)
              // Sell: spent base, receive quote → ret = amount * price (quote units)
              let ret = 0
              if (!isRetract && !isKeep && price > 0) {
                ret = isBuy
                  ? Math.round(amount / price)
                  : Math.round(amount * price)
                totalReturnRaw += ret
                orderSideIsBuy = isBuy
              } else if (isBuy !== undefined) {
                orderSideIsBuy = isBuy
              }

              return {
                op: isRetract ? 'Retract' : isKeep ? 'Keep' : 'Create',
                side: isBuy ? 'Buy' : 'Sell',
                price: price > 0 ? price.toFixed(2) : '—',
                amount:
                  isRetract || isKeep
                    ? '—'
                    : this.baseAmountFormatOrZero(amount),
                ret: ret > 0 ? this.baseAmountFormatOrZero(ret) : '—',
                amountRaw: amount,
              }
            })
          : []

        // Compute depth % for order book bar (relative to largest order)
        if (orderRows.length) {
          const maxAmt = Math.max(...orderRows.map((r) => r.amountRaw || 0))
          orderRows.forEach((r) => {
            r.depth =
              maxAmt > 0 ? Math.round(((r.amountRaw || 0) / maxAmt) * 100) : 0
          })
        }

        // coin_received by sender for non-scale (immediate CCL fills)
        const limitReceivedByDenom = {}
        if (!isScaleOrder && userAddress) {
          events
            .filter((e) => e.type === 'coin_received')
            .map(toAttrs)
            .filter((a) => a.receiver === userAddress && a.amount)
            .forEach((a) => {
              a.amount.split(',').forEach((part) => {
                const p = part.trim()
                const amt = parseInt(p) || 0
                const denom = p.replace(/^\d+/, '').trim()
                if (denom && denom !== fundsDenom && amt > 0)
                  limitReceivedByDenom[denom] =
                    (limitReceivedByDenom[denom] || 0) + amt
              })
            })
        }
        const limitRecvDenom = Object.keys(limitReceivedByDenom)[0] || ''
        const limitRecvAmt = limitReceivedByDenom[limitRecvDenom] || 0
        const limitRecvAssetStr =
          limitRecvDenom === 'rune'
            ? 'THOR.RUNE'
            : limitRecvDenom
              ? securedToAsset(limitRecvDenom).toUpperCase()
              : ''
        const limitRecvAssetParsed = limitRecvAssetStr
          ? assetFromString(limitRecvAssetStr)
          : null
        const limitRecvTicker = limitRecvAssetParsed?.ticker || limitRecvDenom

        // Swap-style input/output for scale orders
        // Buy orders: user spends quote (USDC), receives base (ETH) on fill
        // Sell orders: user spends base (ETH), receives quote (USDC) on fill
        const scaleInAssetStr = orderSideIsBuy ? quoteAssetStr : baseAssetStr
        const scaleInAsset = orderSideIsBuy ? quoteAssetParsed : baseAssetParsed
        const scaleInTicker = orderSideIsBuy ? quoteTicker : baseTicker
        const scaleOutAssetStr = orderSideIsBuy ? baseAssetStr : quoteAssetStr
        const scaleOutAsset = orderSideIsBuy
          ? baseAssetParsed
          : quoteAssetParsed
        const scaleOutTicker = orderSideIsBuy ? baseTicker : quoteTicker

        return {
          rawEvents: events,
          rawMsg: action?.metadata?.contract?.msg || null,
          orderRows: isScaleOrder ? orderRows : [],
          orderPairTickers: isScaleOrder
            ? {
                base: baseTicker,
                quote: quoteTicker,
                isBuy: orderSideIsBuy,
              }
            : null,
          title: isScaleOrder
            ? `Scale Order: ${orderCount} orders on ${contractLabel}${titleSuffix}`
            : `${orderCount} Limit Order${orderCount !== 1 ? 's' : ''} ${orderVerb} on ${contractLabel}${titleSuffix}`,
          metaLabel: `${actionLabel} · ${contractLabel}`,
          status,
          affiliateAddress: '',
          actionTypeTitle: 'contract',
          hasContractAction: true,
          labels: [],
          pairDisplay:
            (isScaleOrder && !fundsAmount) ||
            (!isScaleOrder && baseAssetParsed && quoteAssetParsed)
              ? {
                  baseAsset: baseAssetParsed,
                  quoteAsset: quoteAssetParsed,
                  label: `${baseTicker} / ${quoteTicker}`,
                  sublabel: contractLabel,
                  inputAmount:
                    !isScaleOrder && fundsAmount
                      ? `${this.baseAmountFormatOrZero(fundsAmount)} ${fundsTicker}`
                      : null,
                }
              : null,
          input: isScaleOrder
            ? {
                asset: scaleInAssetStr || null,
                name: scaleInTicker || contractLabel,
                badge: this.getNetworkBadge(scaleInAsset) || '',
                amount: fundsAmount
                  ? `${this.baseAmountFormatOrZero(fundsAmount)} ${scaleInTicker}`
                  : '-',
                usd: this.formatUsdValue(
                  this.amountToUSD(scaleInAssetStr, fundsAmount, this.pools)
                ),
              }
            : fundsAmount
              ? {
                  asset: fundsAssetStr || null,
                  name: fundsTicker || 'User',
                  badge: this.getNetworkBadge(fundsAssetParsed) || '',
                  amount: `${this.baseAmountFormatOrZero(fundsAmount)} ${fundsTicker}`,
                  usd: this.formatUsdValue(
                    this.amountToUSD(fundsAssetStr, fundsAmount, this.pools)
                  ),
                }
              : {
                  asset: null,
                  name: 'User',
                  badge: userAddress ? this.formatAddress(userAddress) : '',
                  amount: `${orderCount} order${orderCount !== 1 ? 's' : ''}`,
                  usd: null,
                },
          output: isScaleOrder
            ? {
                asset: scaleOutAssetStr || null,
                name: scaleOutTicker || 'Asset',
                badge: this.getNetworkBadge(scaleOutAsset) || '',
                amount: totalReturnRaw
                  ? `${this.baseAmountFormatOrZero(totalReturnRaw)} ${scaleOutTicker}`
                  : '-',
                usd: this.formatUsdValue(
                  this.amountToUSD(scaleOutAssetStr, totalReturnRaw, this.pools)
                ),
              }
            : limitRecvAmt
              ? {
                  asset: limitRecvAssetStr || null,
                  name: limitRecvTicker,
                  badge: this.getNetworkBadge(limitRecvAssetParsed) || '',
                  amount: `${this.baseAmountFormatOrZero(limitRecvAmt)} ${limitRecvTicker}`,
                  usd: this.formatUsdValue(
                    this.amountToUSD(
                      limitRecvAssetStr,
                      limitRecvAmt,
                      this.pools
                    )
                  ),
                }
              : {
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
          metricRows: isScaleOrder
            ? [
                cclFillCount
                  ? { label: 'Immediate Fills', value: `${cclFillCount}` }
                  : null,
                avgFillRate
                  ? { label: 'Avg Fill Rate', value: avgFillRate.toFixed(6) }
                  : null,
              ].filter(Boolean)
            : [
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
              value: actionLabel,
              tone: this.getContractTypeTone(actionLabel),
              type: 'product',
            },
            { label: 'Contract', value: contractLabel },
            { label: 'Status', value: status.label, type: 'status' },
            !isScaleOrder && timestamp
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
              title: isScaleOrder
                ? `Scale Order: ${orderCount} orders submitted`
                : `${orderCount} limit order${orderCount !== 1 ? 's' : ''} submitted`,
              body: priceList ? `Fixed prices: ${priceList}` : '',
            },
            ...this.extractContractEventRows(action),
            ...(hasError && logs
              ? [
                  {
                    icon: 'WarningIcon',
                    title: 'Contract execution failed',
                    body: logs,
                  },
                ]
              : []),
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
          rawEvents: events,
          rawMsg: action?.metadata?.contract?.msg || null,
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
            ...(hasError && logs
              ? [
                  {
                    icon: 'WarningIcon',
                    title: 'Contract execution failed',
                    body: logs,
                  },
                ]
              : []),
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

      // FIN market swap: single contract action with msg.swap, or detected via
      // wasm-rujira-fin/trade events when msg is absent from the API response
      const swapMsg = singleAction?.metadata?.contract?.msg?.swap
      const isFinMarketByEvents =
        !singleAction?.metadata?.contract?.msg?.order &&
        !singleAction?.metadata?.contract?.msg?.account &&
        !singleAction?.metadata?.contract?.msg?.liquid &&
        !singleAction?.metadata?.contract?.msg?.liquidate &&
        (singleAction?.metadata?.contract?.contractEvents || []).some(
          (e) => e.type === 'wasm-rujira-fin/trade'
        )
      if (swapMsg || isFinMarketByEvents) {
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
        let fundsStr = action.metadata?.contract?.funds || ''
        if (!fundsStr && userAddress) {
          const spentEvent = events.find(
            (e) =>
              e.type === 'coin_spent' &&
              (e.attributes || []).some(
                (a) => a.key === 'spender' && a.value === userAddress
              )
          )
          const amountAttr = (spentEvent?.attributes || []).find(
            (a) => a.key === 'amount'
          )
          if (amountAttr?.value) fundsStr = amountAttr.value
        }
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

        // Collect all amounts received by the user address (non-input denom).
        // Filtering by receiver = userAddress avoids picking up intermediate
        // routing hops or fee events that use the same denom.
        let receivedAmount = 0
        let primaryDenom = ''
        let receivedAssetDenom = ''

        const userReceipts = {}
        events
          .filter((e) => e.type === 'coin_received')
          .forEach((e) => {
            const a = toAttrs(e)
            if (userAddress && a.receiver !== userAddress) return
            ;(a.amount || '').split(',').forEach((part) => {
              const p = part.trim()
              const amt = parseInt(p) || 0
              const denom = p.replace(/^\d+/, '').trim()
              if (denom && denom !== fundsAsset && amt > 0) {
                userReceipts[denom] = (userReceipts[denom] || 0) + amt
              }
            })
          })
        Object.entries(userReceipts).forEach(([denom, amt]) => {
          if (amt > receivedAmount) {
            receivedAmount = amt
            receivedAssetDenom = denom
            primaryDenom = denom
          }
        })

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

        // Detect partial fills: check if any input denom was returned to the user
        const returnedAmount = (() => {
          if (!fundsAsset || !userAddress) return 0
          let total = 0
          events
            .filter((e) => e.type === 'coin_received')
            .map(toAttrs)
            .filter((a) => a.receiver === userAddress && a.amount)
            .forEach((a) => {
              a.amount.split(',').forEach((part) => {
                const p = part.trim()
                if (p.endsWith(fundsAsset)) total += parseInt(p) || 0
              })
            })
          return total
        })()
        const filledAmount = fundsAmount - returnedAmount
        const isPartialFill = returnedAmount > 0 && filledAmount > 0

        const refundAction = this.rawActions.find((a) => a.type === 'refund')
        const refundReason = refundAction?.metadata?.refund?.reason || null

        return {
          rawEvents: events,
          rawMsg: action?.metadata?.contract?.msg || null,
          title: `Market Order: ${contractLabel}`,
          metaLabel: `Market Order · ${productLabel}`,
          status,
          affiliateAddress: '',
          actionTypeTitle: 'contract',
          hasContractAction: true,
          priority: true,
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
              title: hasError
                ? 'Contract execution failed'
                : isPartialFill
                  ? 'Market order partially filled'
                  : 'Market order filled',
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
            receivedAmount && receivedTicker
              ? {
                  icon: 'ArrowIcon',
                  iconRotate: 0,
                  title: `${this.baseAmountFormatOrZero(receivedAmount)} ${receivedTicker} received`,
                  body: userAddress
                    ? `Delivered to ${this.formatAddress(userAddress)}`
                    : '',
                }
              : null,
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
        const _rawProduct1 = getRujiraContractProduct(contractAddress)
        const productLabel =
          (_rawProduct1 === 'Utilities' ? 'Staking' : _rawProduct1) || 'Staking'
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
        const actionType = isBond ? 'Liquid Stake' : 'Liquid Unstake'

        // coin_received by user (liquid staking tokens on bond, underlying on unbond)
        const liquidReceivedByDenom = {}
        if (userAddress) {
          events
            .filter((e) => e.type === 'coin_received')
            .map(toAttrs)
            .filter((a) => a.receiver === userAddress && a.amount)
            .forEach((a) => {
              a.amount.split(',').forEach((part) => {
                const p = part.trim()
                const amt = parseInt(p) || 0
                const denom = p.replace(/^\d+/, '').trim()
                if (denom && amt > 0)
                  liquidReceivedByDenom[denom] =
                    (liquidReceivedByDenom[denom] || 0) + amt
              })
            })
        }
        const liqRecvDenom = Object.keys(liquidReceivedByDenom)[0] || ''
        const liqRecvAmt = liquidReceivedByDenom[liqRecvDenom] || 0
        const liqRecvAssetStr =
          liqRecvDenom === 'rune'
            ? 'THOR.RUNE'
            : liqRecvDenom
              ? securedToAsset(liqRecvDenom).toUpperCase()
              : ''
        const liqRecvAssetParsed = liqRecvAssetStr
          ? assetFromString(liqRecvAssetStr)
          : null
        const liqRecvTicker = liqRecvAssetParsed?.ticker || liqRecvDenom

        return {
          rawEvents: events,
          rawMsg: action?.metadata?.contract?.msg || null,
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
          output: liqRecvAmt
            ? {
                asset: liqRecvAssetStr || null,
                name: liqRecvTicker,
                badge: this.getNetworkBadge(liqRecvAssetParsed) || '',
                amount: `${this.baseAmountFormatOrZero(liqRecvAmt)} ${liqRecvTicker}`,
                usd: this.formatUsdValue(
                  this.amountToUSD(liqRecvAssetStr, liqRecvAmt, this.pools)
                ),
              }
            : {
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

      // Staking rewards claim: msg.account.claim
      const claimMsg = singleAction?.metadata?.contract?.msg?.account?.claim
      if (claimMsg !== undefined) {
        const action = singleAction
        const contractAddress = action.out?.[0]?.address || ''
        const contractLabel =
          getRujiraContractLabel(contractAddress) ||
          this.formatAddress(contractAddress)
        const _rawProductClaim = getRujiraContractProduct(contractAddress)
        const productLabel =
          (_rawProductClaim === 'Utilities' ? 'Staking' : _rawProductClaim) ||
          'Staking'
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

        // Read claimed amount from the staking claim event
        const claimEvent = events.find(
          (e) => e.type === 'wasm-rujira-staking/account.claim'
        )
        const claimAttrs = claimEvent ? toAttrs(claimEvent) : {}
        const claimedAmountFallback = parseInt(claimAttrs.amount) || 0

        // coin_received by user (more reliable than wasm event)
        const claimReceivedByDenom = {}
        if (userAddress) {
          events
            .filter((e) => e.type === 'coin_received')
            .map(toAttrs)
            .filter((a) => a.receiver === userAddress && a.amount)
            .forEach((a) => {
              a.amount.split(',').forEach((part) => {
                const p = part.trim()
                const amt = parseInt(p) || 0
                const denom = p.replace(/^\d+/, '').trim()
                if (denom && amt > 0)
                  claimReceivedByDenom[denom] =
                    (claimReceivedByDenom[denom] || 0) + amt
              })
            })
        }
        const claimRecvDenom = Object.keys(claimReceivedByDenom)[0] || 'rune'
        const claimRecvAmt =
          claimReceivedByDenom[claimRecvDenom] || claimedAmountFallback
        const claimAssetStr =
          claimRecvDenom === 'rune'
            ? 'THOR.RUNE'
            : securedToAsset(claimRecvDenom).toUpperCase()
        const claimAssetParsed = assetFromString(claimAssetStr)
        const claimTicker = claimAssetParsed?.ticker || 'RUNE'

        return {
          rawEvents: events,
          rawMsg: action?.metadata?.contract?.msg || null,
          title: `Claim Rewards · ${contractLabel}`,
          metaLabel: `Claim Rewards · ${productLabel}`,
          status,
          affiliateAddress: '',
          actionTypeTitle: 'contract',
          hasContractAction: true,
          labels: [],
          pairDisplay: null,
          input: {
            asset: null,
            name: 'User',
            badge: userAddress ? this.formatAddress(userAddress) : '',
            amount: 'Claim',
            usd: null,
          },
          output: {
            asset: claimAssetStr,
            name: claimTicker,
            badge: this.getNetworkBadge(claimAssetParsed) || '',
            amount: claimRecvAmt
              ? `${this.baseAmountFormatOrZero(claimRecvAmt)} ${claimTicker}`
              : '-',
            usd: claimRecvAmt
              ? this.formatUsdValue(
                  this.amountToUSD(claimAssetStr, claimRecvAmt, this.pools)
                )
              : null,
          },
          metricRows: [
            claimRecvAmt
              ? {
                  label: 'Claimed',
                  value: `${this.baseAmountFormatOrZero(claimRecvAmt)} ${claimTicker}`,
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
              value: 'Claim Rewards',
              tone: this.getContractTypeTone('Claim Rewards'),
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
              title: `Rewards claimed`,
              body: claimedAmount
                ? `${this.baseAmountFormatOrZero(claimedAmount)} RUNE`
                : '',
            },
            ...(hasError && logs
              ? [{ icon: 'WarningIcon', title: 'Claim failed', body: logs }]
              : []),
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

      // Yielding staking: msg.account.bond / msg.account.unbond
      const yieldingAccountMsg = singleAction?.metadata?.contract?.msg?.account
      if (
        yieldingAccountMsg &&
        ('bond' in yieldingAccountMsg || 'unbond' in yieldingAccountMsg)
      ) {
        const isStake = 'bond' in yieldingAccountMsg
        const action = singleAction
        const contractAddress = action.out?.[0]?.address || ''
        const contractLabel =
          getRujiraContractLabel(contractAddress) ||
          this.formatAddress(contractAddress)
        const _rawProduct2 = getRujiraContractProduct(contractAddress)
        const productLabel =
          (_rawProduct2 === 'Utilities' ? 'Staking' : _rawProduct2) || 'Staking'
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
        const actionType = isStake ? 'Yielding Stake' : 'Yielding Unstake'

        // Input: funds string, fall back to first coin_spent from user
        let fundsStr = action.metadata?.contract?.funds || ''
        if (!fundsStr && userAddress) {
          const spentEvent = events.find(
            (e) =>
              e.type === 'coin_spent' &&
              (e.attributes || []).some(
                (a) => a.key === 'spender' && a.value === userAddress
              )
          )
          const amountAttr = (spentEvent?.attributes || []).find(
            (a) => a.key === 'amount'
          )
          if (amountAttr?.value) fundsStr = amountAttr.value
        }
        const amountRaw = parseInt(fundsStr) || 0
        const fundsAsset = fundsStr.replace(/^[\d]+/, '').trim()
        const inputAssetStr = fundsAsset
          ? securedToAsset(fundsAsset).toUpperCase()
          : 'THOR.RUNE'
        const inputAssetParsed = assetFromString(inputAssetStr)
        const inputTicker = inputAssetParsed?.ticker || 'RUNE'

        // Output: excess RUNE returned to user
        const excessEvent = userAddress
          ? events.find(
              (e) =>
                e.type === 'coin_received' &&
                (e.attributes || []).some(
                  (a) => a.key === 'receiver' && a.value === userAddress
                ) &&
                (e.attributes || []).some(
                  (a) => a.key === 'amount' && a.value.endsWith('rune')
                )
            )
          : null
        const excessAmountStr = excessEvent
          ? ((e) =>
              (e.attributes || []).find((a) => a.key === 'amount')?.value ||
              '')(excessEvent)
          : ''
        const excessAmount = parseInt(excessAmountStr) || 0
        const excessAssetParsed = assetFromString('THOR.RUNE')
        const excessTicker = 'RUNE'

        return {
          rawEvents: events,
          rawMsg: action?.metadata?.contract?.msg || null,
          title: `${actionType}: ${contractLabel}`,
          metaLabel: `${actionType} · ${productLabel}`,
          status,
          affiliateAddress: '',
          actionTypeTitle: 'contract',
          hasContractAction: true,
          labels: [],
          input: {
            asset: inputAssetParsed ? inputAssetStr : null,
            name: inputTicker,
            badge: this.getNetworkBadge(inputAssetParsed) || '',
            amount: amountRaw
              ? `${this.baseAmountFormatOrZero(amountRaw)} ${inputTicker}`
              : '-',
            usd: amountRaw
              ? this.formatUsdValue(
                  this.amountToUSD(inputAssetStr, amountRaw, this.pools)
                )
              : null,
            secure: inputAssetParsed?.secure ?? false,
          },
          output: excessAmount
            ? {
                asset: 'THOR.RUNE',
                name: excessTicker,
                badge: 'Excess returned',
                amount: `${this.baseAmountFormatOrZero(excessAmount)} ${excessTicker}`,
                usd: this.formatUsdValue(
                  this.amountToUSD('THOR.RUNE', excessAmount, this.pools)
                ),
              }
            : null,
          metricRows: [
            amountRaw
              ? {
                  label: isStake ? 'Staked' : 'Unstaked',
                  value: `${this.baseAmountFormatOrZero(amountRaw)} ${inputTicker}`,
                }
              : null,
            excessAmount
              ? {
                  label: 'Excess returned',
                  value: `${this.baseAmountFormatOrZero(excessAmount)} ${excessTicker}`,
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
            ...this.extractContractEventRows(action),
            ...(hasError && logs
              ? [
                  {
                    icon: 'WarningIcon',
                    title: `${actionType} failed`,
                    body: logs,
                  },
                ]
              : []),
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
          priority: true,
        }
      }

      // Ghost Credit Account liquidation: msg.liquidate
      const liquidateMsg = singleAction?.metadata?.contract?.msg?.liquidate
      if (liquidateMsg) {
        const action = singleAction
        const contractAddress = action.out?.[0]?.address || ''
        const contractLabel =
          getRujiraContractLabel(contractAddress) ||
          this.formatAddress(contractAddress)
        const productLabel = 'RUJI Money Market'
        const userAddress = action.in?.[0]?.address || ''
        const liquidatedAccount = liquidateMsg.addr || ''
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

        // Collateral: coin_spent from the credit account being liquidated
        let collateralAmount = 0
        let collateralDenom = ''
        if (liquidatedAccount) {
          const spentEvent = events.find(
            (e) =>
              e.type === 'coin_spent' &&
              (e.attributes || []).some(
                (a) => a.key === 'spender' && a.value === liquidatedAccount
              )
          )
          const amountAttr = (spentEvent?.attributes || []).find(
            (a) => a.key === 'amount'
          )
          if (amountAttr?.value) {
            const part = amountAttr.value.split(',')[0]?.trim() || ''
            collateralAmount = parseInt(part) || 0
            collateralDenom = part.replace(/^\d+/, '').trim()
          }
        }
        const collateralAssetStr = collateralDenom
          ? securedToAsset(collateralDenom).toUpperCase()
          : ''
        const collateralAssetParsed = collateralDenom
          ? (assetFromString(collateralDenom.toUpperCase()) ??
            assetFromString(collateralAssetStr))
          : null
        const collateralTicker =
          collateralAssetParsed?.ticker || collateralDenom

        // Repay event carries fee_liquidator (bare number) and the USDT denom via 'amount'
        const repayEvent = events.find(
          (e) => e.type === 'wasm-rujira-ghost-credit/liquidate.msg/repay'
        )
        const repayAttrs = repayEvent ? toAttrs(repayEvent) : {}
        // 'amount' = total USDT received from FIN swap, denom applies to all fee fields
        const repayTotalStr = repayAttrs.amount || ''
        const repayDenom = repayTotalStr.replace(/^\d+/, '').trim()
        const repayAssetStr = repayDenom
          ? securedToAsset(repayDenom).toUpperCase()
          : ''
        const repayAssetParsed = repayDenom
          ? (assetFromString(repayDenom.toUpperCase()) ??
            assetFromString(repayAssetStr))
          : null
        const repayTicker = repayAssetParsed?.ticker || repayDenom
        // Debt repaid (net, after fees)
        const repayAmount = parseInt(repayAttrs.repay_amount || '') || 0
        // Liquidator fee: bare number in same denom as 'amount'
        const feeLiquidatorAmount =
          parseInt(repayAttrs.fee_liquidator || '') || 0
        const feeLiquidatorTicker = repayTicker

        const feeProtocolRaw = parseInt(repayAttrs.fee_liquidation || '') || 0

        return {
          rawEvents: events,
          rawMsg: action?.metadata?.contract?.msg || null,
          title: `Liquidation: ${contractLabel}`,
          metaLabel: `Liquidation · ${productLabel}`,
          status,
          affiliateAddress: '',
          actionTypeTitle: 'contract',
          hasContractAction: true,
          labels: [],
          input: {
            asset: collateralAssetParsed ? collateralAssetStr : null,
            name: collateralTicker || 'Collateral',
            badge: this.getNetworkBadge(collateralAssetParsed) || '',
            amount: collateralAmount
              ? `${this.baseAmountFormatOrZero(collateralAmount)} ${collateralTicker}`
              : '-',
            usd: collateralAmount
              ? this.formatUsdValue(
                  this.amountToUSD(
                    collateralAssetStr,
                    collateralAmount,
                    this.pools
                  )
                )
              : null,
            secure: collateralAssetParsed?.secure ?? false,
          },
          output: repayAmount
            ? {
                asset: repayAssetParsed ? repayAssetStr : null,
                name: repayTicker || 'USDT',
                badge: 'Debt repaid to Ghost Vault',
                amount: `${this.baseAmountFormatOrZero(repayAmount)} ${repayTicker}`,
                usd: this.formatUsdValue(
                  this.amountToUSD(repayAssetStr, repayAmount, this.pools)
                ),
              }
            : null,
          metricRows: [
            collateralAmount
              ? {
                  label: 'Collateral seized',
                  value: `${this.baseAmountFormatOrZero(collateralAmount)} ${collateralTicker}`,
                }
              : null,
            repayAmount
              ? {
                  label: 'Debt repaid',
                  value: `${this.baseAmountFormatOrZero(repayAmount)} ${repayTicker}`,
                }
              : null,
            feeProtocolRaw
              ? {
                  label: 'Protocol fee',
                  value: `${this.baseAmountFormatOrZero(feeProtocolRaw)} ${feeLiquidatorTicker}`,
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
              value: 'Liquidation',
              tone: this.getContractTypeTone('Liquidation'),
              type: 'product',
            },
            { label: 'Contract', value: contractLabel },
            liquidatedAccount
              ? {
                  label: 'Liquidated Account',
                  address: liquidatedAccount,
                  type: 'address',
                }
              : null,
            { label: 'Status', value: status.label, type: 'status' },
            timestamp
              ? { label: 'Time', value: timestamp.format('lll') }
              : null,
            height
              ? { label: 'Block', value: `#${this.normalFormat(height)}` }
              : null,
            userAddress
              ? { label: 'Liquidator', address: userAddress, type: 'address' }
              : null,
          ].filter(Boolean),
          lifecycleRows: (() => {
            if (hasError) {
              return [
                {
                  icon: 'WarningIcon',
                  title: 'Liquidation failed',
                  body: logs || '',
                },
              ]
            }
            const totalFeesRaw = feeLiquidatorAmount + feeProtocolRaw
            return [
              collateralAmount
                ? {
                    icon: 'ArrowIcon',
                    iconRotate: 90,
                    title: 'Collateral seized',
                    body: `${this.baseAmountFormatOrZero(collateralAmount)} ${collateralTicker}`,
                  }
                : null,
              totalFeesRaw
                ? {
                    icon: 'ArrowIcon',
                    iconRotate: 90,
                    title: 'Fees paid',
                    body: `${this.baseAmountFormatOrZero(totalFeesRaw)} ${repayTicker}`,
                  }
                : null,
              repayAmount
                ? {
                    icon: 'CheckIcon',
                    title: `${repayTicker} debt repaid`,
                    body: `${this.baseAmountFormatOrZero(repayAmount)} ${repayTicker} repaid to Ghost Vault`,
                  }
                : null,
            ].filter(Boolean)
          })(),
          feeRows: (() => {
            const feeProtocolRaw =
              parseInt(repayAttrs.fee_liquidation || '') || 0
            const toUsd = (amount) =>
              repayAssetStr
                ? this.amountToUSD(repayAssetStr, amount, this.pools)
                : 0
            const rows = []
            if (feeLiquidatorAmount) {
              rows.push({
                label: 'Liquidator Reward',
                usd: `$${this.formatFeeDisplay(toUsd(feeLiquidatorAmount))}`,
                subtle: `${this.baseAmountFormatOrZero(feeLiquidatorAmount)} ${feeLiquidatorTicker}`,
              })
            }
            if (feeProtocolRaw) {
              rows.push({
                label: 'Protocol Fee',
                usd: `$${this.formatFeeDisplay(toUsd(feeProtocolRaw))}`,
                subtle: `${this.baseAmountFormatOrZero(feeProtocolRaw)} ${repayTicker}`,
              })
            }
            if (rows.length > 1) {
              const totalUsd = rows.reduce(
                (s, r) => s + this.parseUsdAmount(r.usd),
                0
              )
              rows.push({
                label: 'Total Fees',
                usd: `$${this.formatFeeDisplay(totalUsd)}`,
                subtle: null,
                isTotal: true,
              })
            }
            return rows
          })(),
          technicalRows: [
            userAddress
              ? this.buildTechRow('Liquidator', userAddress, 'address')
              : null,
            contractAddress
              ? this.buildTechRow('Contract', contractAddress, 'address')
              : null,
            liquidatedAccount
              ? this.buildTechRow(
                  'Liquidated account',
                  liquidatedAccount,
                  'address'
                )
              : null,
          ].filter(Boolean),
          priority: true,
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
          rawEvents: events,
          rawMsg: action?.metadata?.contract?.msg || null,
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
            hasError && logs
              ? {
                  icon: 'WarningIcon',
                  title: 'Contract execution failed',
                  body: logs,
                }
              : null,
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
          rawEvents: events,
          rawMsg: action?.metadata?.contract?.msg || null,
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
              title: hasError
                ? 'Contract execution failed'
                : `Instance #${instanceId} reset`,
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

      // CCL range creation: msg.range.create
      const rangeCreateMsg =
        singleAction?.metadata?.contract?.msg?.range?.create
      if (rangeCreateMsg) {
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

        // Parse actual amounts used from range.create event
        const rangeCreateEvents = events.filter(
          (e) => e.type === 'wasm-rujira-fin/range.create'
        )
        const rangeAttrs = rangeCreateEvents.length
          ? toAttrs(rangeCreateEvents[0])
          : {}
        const rangeCount = rangeCreateEvents.length

        const low = rangeAttrs.low || rangeCreateMsg.config?.low || ''
        const high = rangeAttrs.high || rangeCreateMsg.config?.high || ''
        const fee = rangeAttrs.fee || rangeCreateMsg.config?.fee || ''
        const spread = rangeAttrs.spread || rangeCreateMsg.config?.spread || ''
        const rangeIdx = rangeAttrs.idx || ''

        // Actual amounts committed to the range (may differ from funds sent due to refund)
        const baseAmt = parseInt(rangeAttrs.base || 0)
        const quoteAmt = parseInt(rangeAttrs.quote || 0)

        // Parse denoms from multi-asset funds string ("969729479647doge-doge,222781833369rune")
        const fundsStr = action.metadata?.contract?.funds || ''
        const fundsParts = fundsStr.split(',').map((part) => {
          const amt = parseInt(part) || 0
          const denom = part.replace(/^\d+/, '').trim()
          return { amt, denom }
        })

        // Prefer registry pair info, fall back to funds order
        const pairEntry = getRujiraContractEntry(contractAddress)
        const pairLabelParts = (pairEntry?.contractLabel || '').split(':')
        const baseDenom = pairLabelParts[1] || fundsParts[0]?.denom || ''
        const quoteDenom = pairLabelParts[2] || fundsParts[1]?.denom || ''

        const denomToAssetStr = (denom) =>
          !denom
            ? ''
            : denom === 'rune'
              ? 'THOR.RUNE'
              : securedToAsset(denom).toUpperCase()

        const baseAssetStr = denomToAssetStr(baseDenom)
        const quoteAssetStr = denomToAssetStr(quoteDenom)
        const baseAssetParsed = baseAssetStr
          ? assetFromString(baseAssetStr)
          : null
        const quoteAssetParsed = quoteAssetStr
          ? assetFromString(quoteAssetStr)
          : null
        const baseTicker = baseAssetParsed?.ticker || baseDenom || 'Base'
        const quoteTicker = quoteAssetParsed?.ticker || quoteDenom || 'Quote'

        const pairLabel =
          baseTicker && quoteTicker
            ? `${baseTicker}/${quoteTicker}`
            : contractLabel

        const baseUsd = this.amountToUSD(baseAssetStr, baseAmt, this.pools)
        const quoteUsd = this.amountToUSD(quoteAssetStr, quoteAmt, this.pools)

        const fmtPct = (val) =>
          val ? `${(parseFloat(val) * 100).toFixed(3)}%` : ''
        const fmtPrice = (val) => (val ? parseFloat(val).toPrecision(6) : '')

        return {
          rawEvents: events,
          rawMsg: action?.metadata?.contract?.msg || null,
          title: `CCL Range Created on ${pairLabel}`,
          metaLabel: `CCL Range · ${pairLabel}`,
          status,
          affiliateAddress: '',
          actionTypeTitle: 'contract',
          hasContractAction: true,
          labels: [],
          pairDisplay: null,
          input: {
            asset: baseAssetStr || null,
            name: `${baseTicker} (Base)`,
            badge: this.getNetworkBadge(baseAssetParsed) || '',
            amount: baseAmt
              ? `${this.baseAmountFormatOrZero(baseAmt)} ${baseTicker}`
              : '—',
            usd: this.formatUsdValue(baseUsd),
          },
          output: {
            asset: quoteAssetStr || null,
            name: `${quoteTicker} (Quote)`,
            badge: this.getNetworkBadge(quoteAssetParsed) || '',
            amount: quoteAmt
              ? `${this.baseAmountFormatOrZero(quoteAmt)} ${quoteTicker}`
              : '—',
            usd: this.formatUsdValue(quoteUsd),
          },
          metricRows: [
            low && high
              ? {
                  label: 'Price Range',
                  value: `${fmtPrice(low)}–${fmtPrice(high)}`,
                }
              : null,
            fee ? { label: 'Fee', value: fmtPct(fee) } : null,
            spread ? { label: 'Spread', value: fmtPct(spread) } : null,
            timestamp
              ? { label: 'Time', value: timestamp.format('lll') }
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
              value: rangeCount > 1 ? `${rangeCount} CCL Ranges` : 'CCL Range',
              tone: this.getContractTypeTone('CCL Range'),
              type: 'product',
            },
            { label: 'Pair', value: pairLabel },
            low && high
              ? {
                  label: 'Price Range',
                  value: `${fmtPrice(low)}–${fmtPrice(high)}`,
                }
              : null,
            fee ? { label: 'Fee Rate', value: fmtPct(fee) } : null,
            spread ? { label: 'Spread', value: fmtPct(spread) } : null,
            rangeIdx ? { label: 'Range Index', value: rangeIdx } : null,
            { label: 'Status', value: status.label, type: 'status' },
            timestamp
              ? { label: 'Time', value: timestamp.format('lll') }
              : null,
            height
              ? { label: 'Block', value: `#${this.normalFormat(height)}` }
              : null,
            userAddress
              ? { label: 'Owner', address: userAddress, type: 'address' }
              : null,
          ].filter(Boolean),
          lifecycleRows: [
            {
              icon: hasError ? 'WarningIcon' : 'ExchangeIcon',
              title: hasError
                ? 'Contract execution failed'
                : `CCL range position created`,
              body: hasError
                ? logs || ''
                : [
                    baseAmt
                      ? `${this.baseAmountFormatOrZero(baseAmt)} ${baseTicker}`
                      : null,
                    quoteAmt
                      ? `${this.baseAmountFormatOrZero(quoteAmt)} ${quoteTicker}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' + ') +
                  (low && high
                    ? ` deposited into ${pairLabel} at price range ${fmtPrice(low)}–${fmtPrice(high)}`
                    : ` deposited into ${pairLabel}`),
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

      // CCL range yield claim: msg.range.claim
      const rangeClaimMsg = singleAction?.metadata?.contract?.msg?.range?.claim
      if (rangeClaimMsg) {
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

        const rangeIdx = rangeClaimMsg.idx || ''

        // Claimed amounts from the range.claim event
        const claimEvent = events.find(
          (e) => e.type === 'wasm-rujira-fin/range.claim'
        )
        const claimAttrs = claimEvent ? toAttrs(claimEvent) : {}
        const baseAmt = parseInt(claimAttrs.base || 0)
        const quoteAmt = parseInt(claimAttrs.quote || 0)

        // Derive pair denoms from registry contractLabel ("rujira-fin:base:quote")
        // Fall back to parsing the coin_received event
        const pairEntry = getRujiraContractEntry(contractAddress)
        const pairLabelParts = (pairEntry?.contractLabel || '').split(':')
        let baseDenom = pairLabelParts[1] || ''
        let quoteDenom = pairLabelParts[2] || ''

        if (!baseDenom || !quoteDenom) {
          const receivedEvent = events.find(
            (e) =>
              e.type === 'coin_received' &&
              (e.attributes || []).some(
                (a) => a.key === 'receiver' && a.value === userAddress
              )
          )
          const receivedAmtStr =
            (receivedEvent?.attributes || []).find((a) => a.key === 'amount')
              ?.value || ''
          receivedAmtStr.split(',').forEach((part, i) => {
            const denom = part.replace(/^\d+/, '').trim()
            if (i === 0 && !baseDenom) baseDenom = denom
            if (i === 1 && !quoteDenom) quoteDenom = denom
          })
        }

        const denomToAssetStr = (denom) =>
          !denom
            ? ''
            : denom === 'rune'
              ? 'THOR.RUNE'
              : securedToAsset(denom).toUpperCase()

        const baseAssetStr = denomToAssetStr(baseDenom)
        const quoteAssetStr = denomToAssetStr(quoteDenom)
        const baseAssetParsed = baseAssetStr
          ? assetFromString(baseAssetStr)
          : null
        const quoteAssetParsed = quoteAssetStr
          ? assetFromString(quoteAssetStr)
          : null
        const baseTicker = baseAssetParsed?.ticker || baseDenom || 'Base'
        const quoteTicker = quoteAssetParsed?.ticker || quoteDenom || 'Quote'

        const pairLabel =
          baseTicker && quoteTicker
            ? `${baseTicker}/${quoteTicker}`
            : contractLabel

        const baseUsd = this.amountToUSD(baseAssetStr, baseAmt, this.pools)
        const quoteUsd = this.amountToUSD(quoteAssetStr, quoteAmt, this.pools)

        return {
          rawEvents: events,
          rawMsg: action?.metadata?.contract?.msg || null,
          title: `Claim Yield: Range #${rangeIdx} on ${pairLabel}`,
          metaLabel: `Claim Yield · ${pairLabel}`,
          status,
          affiliateAddress: '',
          actionTypeTitle: 'contract',
          hasContractAction: true,
          labels: [],
          pairDisplay: null,
          input: {
            asset: baseAssetStr || null,
            name: `${baseTicker} (Base)`,
            badge: this.getNetworkBadge(baseAssetParsed) || '',
            amount: baseAmt
              ? `${this.baseAmountFormatOrZero(baseAmt)} ${baseTicker}`
              : '—',
            usd: this.formatUsdValue(baseUsd),
          },
          output: {
            asset: quoteAssetStr || null,
            name: `${quoteTicker} (Quote)`,
            badge: this.getNetworkBadge(quoteAssetParsed) || '',
            amount: quoteAmt
              ? `${this.baseAmountFormatOrZero(quoteAmt)} ${quoteTicker}`
              : '—',
            usd: this.formatUsdValue(quoteUsd),
          },
          metricRows: [
            rangeIdx ? { label: 'Range Index', value: `#${rangeIdx}` } : null,
            timestamp
              ? { label: 'Time', value: timestamp.format('lll') }
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
              value: 'Claim Yield',
              tone: this.getContractTypeTone('Claim Yield'),
              type: 'product',
            },
            { label: 'Pair', value: pairLabel },
            rangeIdx ? { label: 'Range Index', value: `#${rangeIdx}` } : null,
            { label: 'Status', value: status.label, type: 'status' },
            timestamp
              ? { label: 'Time', value: timestamp.format('lll') }
              : null,
            height
              ? { label: 'Block', value: `#${this.normalFormat(height)}` }
              : null,
            userAddress
              ? { label: 'Owner', address: userAddress, type: 'address' }
              : null,
          ].filter(Boolean),
          lifecycleRows: [
            {
              icon: hasError ? 'WarningIcon' : 'CheckIcon',
              title: hasError
                ? 'Claim failed'
                : `Yield claimed from range #${rangeIdx}`,
              body: hasError
                ? logs || ''
                : [
                    baseAmt
                      ? `${this.baseAmountFormatOrZero(baseAmt)} ${baseTicker}`
                      : null,
                    quoteAmt
                      ? `${this.baseAmountFormatOrZero(quoteAmt)} ${quoteTicker}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' + ') +
                  ` received from ${pairLabel} range #${rangeIdx}`,
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

        // For deposit: find vault shares received by user (denom includes 'ghost-vault')
        // For withdraw: userCoinReceived already found above (underlying token)
        let depositSharesAmt = 0
        let depositSharesDenom = ''
        if (isGhostDeposit && userAddress) {
          const depositCoinReceived = events.find(
            (e) =>
              e.type === 'coin_received' &&
              (e.attributes || []).some(
                (a) => a.key === 'receiver' && a.value === userAddress
              ) &&
              (e.attributes || []).some(
                (a) => a.key === 'amount' && a.value.includes('ghost-vault')
              )
          )
          const depositAmtStr = depositCoinReceived
            ? ((e) =>
                (e.attributes || []).find((a) => a.key === 'amount')?.value ||
                '')(depositCoinReceived)
            : ''
          depositSharesAmt = parseInt(depositAmtStr) || 0
          depositSharesDenom = depositAmtStr.replace(/^\d+/, '').trim()
        }

        const actionType = isGhostWithdraw
          ? 'Ghost Vault Withdraw'
          : 'Ghost Vault Deposit'
        const vaultName =
          contractLabel.replace('rujira-ghost-vault:', '') || contractLabel

        return {
          rawEvents: events,
          rawMsg: action?.metadata?.contract?.msg || null,
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
          output: isGhostWithdraw
            ? {
                asset: underlyingAssetParsed ? underlyingAssetStr : null,
                name: underlyingTicker,
                badge:
                  this.getNetworkBadge(underlyingAssetParsed) ||
                  (userAddress ? this.formatAddress(userAddress) : ''),
                amount: underlyingRaw
                  ? `${this.baseAmountFormatOrZero(underlyingRaw)} ${underlyingTicker}`
                  : 'Withdrawn',
                usd: underlyingRaw
                  ? this.formatUsdValue(
                      this.amountToUSD(
                        underlyingAssetStr,
                        underlyingRaw,
                        this.pools
                      )
                    )
                  : null,
              }
            : depositSharesAmt
              ? {
                  asset: null,
                  name: 'Vault shares',
                  badge: vaultName,
                  amount: `${this.baseAmountFormatOrZero(depositSharesAmt)} shares`,
                  usd: null,
                }
              : {
                  asset: null,
                  name: 'Shares minted',
                  badge: vaultName,
                  amount: sharesRaw
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
              icon: hasError
                ? 'WarningIcon'
                : isGhostWithdraw
                  ? 'SubtractIcon'
                  : 'AddIcon',
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
          rawEvents: events,
          rawMsg: action?.metadata?.contract?.msg || null,
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
              title: hasError
                ? 'Contract execution failed'
                : `${instanceCount} recurring swap ${instanceCount === 1 ? 'strategy' : 'strategies'} dispatched`,
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
      const logs = this.rawActions.find(
        (a) => (a.metadata?.contract?.code ?? 0) > 0
      )?.metadata?.contract?.logs
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
        lifecycleRows:
          hasError && logs
            ? [
                {
                  icon: 'WarningIcon',
                  title: 'Contract execution failed',
                  body: logs,
                },
              ]
            : [],
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
    filteredContractEvents() {
      const events = this.activeOverview?.rawEvents || []
      const q = (this.eventsSearchQuery || '').toLowerCase().trim()
      if (!q) return events
      return events.filter((e) => {
        if (e.type?.toLowerCase().includes(q)) return true
        return (e.attributes || []).some(
          (a) =>
            a.key?.toLowerCase().includes(q) ||
            a.value?.toLowerCase().includes(q)
        )
      })
    },
  },
  watch: {
    // BondHero's rail (node status/total-bond/provider-count/next-churn)
    // and MimirVoteHero's voter panel (active/bond chips) both need a live
    // node lookup neither builder fetches itself. Keyed on the resolved
    // node address so a re-render (e.g. the pending poll in mounted())
    // doesn't refetch once it's already loaded. A page only ever has one of
    // bondOverview/mimirOverview active at a time, so sharing one
    // nodeSnapshot field between the two watchers is safe.
    bondOverview: {
      immediate: true,
      handler(overview) {
        const nodeAddress = overview?.nodeAddress
        if (nodeAddress && nodeAddress !== this.nodeSnapshotAddress) {
          this.fetchNodeSnapshot(nodeAddress)
        }
      },
    },
    mimirOverview: {
      immediate: true,
      handler(overview) {
        const nodeAddress = overview?.nodeAddress
        if (nodeAddress && nodeAddress !== this.nodeSnapshotAddress) {
          this.fetchNodeSnapshot(nodeAddress)
        }
        if (overview?.key && overview.key !== this.mimirConsensusKey) {
          this.fetchMimirConsensus(overview.key, overview.value)
        }
      },
    },
    // streamingOverview itself reads this.streamingProgress (via
    // buildStreamingProgress), which fetchStreamingProgress below writes to
    // — so every fetch response makes streamingOverview recompute into a
    // new object, which re-fires this watcher, which fetches again
    // immediately. Without the timestamp guard below that's a runaway
    // self-triggering loop (back-to-back requests as fast as the network
    // round-trip allows), not the page's 5s poll cadence — confirmed via a
    // real tx firing requests milliseconds apart. The guard throttles to
    // one fetch per 3s per hash while still picking up a hash change
    // (navigating to a different streaming tx) immediately.
    streamingOverview: {
      immediate: true,
      handler(overview) {
        // Once phase is 'outbound' the streaming-status endpoint only
        // returns zeroed data (it tracks active streams only) — nothing
        // useful to fetch, and buildStreamingProgress ignores it in that
        // phase anyway.
        if (!overview?.hash || overview.phase !== 'streaming') return
        const now = Date.now()
        if (
          overview.hash !== this.streamingProgressHash ||
          now - this.streamingProgressFetchedAt >= 3000
        ) {
          this.streamingProgressHash = overview.hash
          this.streamingProgressFetchedAt = now
          this.fetchStreamingProgress(overview.hash)
        }
      },
    },
  },
  async mounted() {
    this._escHandler = (e) => {
      if (e.key === 'Escape') this.eventsModalOpen = false
    }
    window.addEventListener('keydown', this._escHandler)

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
    window.removeEventListener('keydown', this._escHandler)
  },
  methods: {
    async fetchNodeSnapshot(nodeAddress) {
      this.nodeSnapshotAddress = nodeAddress
      try {
        const { data } = await this.$api.getNodeInfo(nodeAddress)
        this.nodeSnapshot = data?.node || data
      } catch (error) {
        try {
          const { data } = await this.$api.getNode(nodeAddress)
          this.nodeSnapshot = data
        } catch (fallbackError) {
          console.error('Failed to fetch node snapshot:', fallbackError)
        }
      }
      if (!this.networkInfo) {
        try {
          const { data } = await this.$api.getNetwork()
          this.networkInfo = data
        } catch (error) {
          console.error('Failed to fetch network info:', error)
        }
      }
    },
    // StreamingSwapHero's live progress (count/quantity/interval/in/out/
    // deposit) — the same endpoint the old always-mounted streamingSwap.vue
    // already polls independently; this fetch is separate from (and
    // doesn't touch) that component. No dedicated setInterval here: the
    // page's own mounted() poll already refetches the whole tx every 5s
    // while pending, which recomputes streamingOverview and re-triggers
    // this watcher — piggybacking on that existing cadence.
    async fetchStreamingProgress(hash) {
      try {
        const { data } = await this.$api.getStreamingTxStatus(hash)
        this.streamingProgress = data
      } catch (error) {
        console.error('Failed to fetch streaming progress:', error)
      }
    },
    // Live count/quantity/fill/remaining-time/swapped-so-far for
    // streamingOverview — falls back to the accordion snapshot
    // (count/quantity only, no in/remaining) until fetchStreamingProgress
    // resolves. Remaining-blocks formula matches the one already proven in
    // pages/tx/components/streamingSwap.vue's updateStreamingDetail: for a
    // nonzero interval, the window is interval*quantity from the stream's
    // own start height (not "now"), so it doesn't drift as more chunks
    // land; a zero interval (rapid swap) just counts remaining chunks.
    buildStreamingProgress(
      { snapshotCount, snapshotQuantity, phase },
      inputAsset,
      output
    ) {
      const outputAsset = output.asset
      // Once streaming itself is done (phase 'outbound'), THORNode's
      // streaming-status endpoint returns zeroed data (it only tracks
      // ACTIVE streams) — using it here would show "0 swapped so far" for
      // a swap that's actually fully executed. The accordion snapshot
      // (refreshed every 5s by the page's own pending-poll regardless of
      // this hero) is always accurate for count/quantity, so just use that
      // directly and skip the live in/out/remaining-time fields entirely.
      if (phase === 'outbound') {
        return {
          count: snapshotCount,
          quantity: snapshotQuantity,
          fillPercent: 100,
          remainingDisplay: null,
          swappedSoFarDisplay: null,
          outputSoFarRaw: null,
          outputSoFarDisplay: null,
          outputSoFarUsdDisplay: null,
        }
      }

      const raw = this.streamingProgress
      const count = raw ? Number(raw.count) || 0 : snapshotCount
      const quantity = raw
        ? Number(raw.quantity) || snapshotQuantity
        : snapshotQuantity
      const fillPercent = quantity ? Math.min((count / quantity) * 100, 100) : 0

      let remainingDisplay = null
      let swappedSoFarDisplay = null
      // raw.out is the live PARTIAL output accumulated from completed
      // sub-swaps so far — distinct from (and much smaller than, mid-
      // stream) the accordion's output.amount, which is
      // swapMetadata.streamingSwapMeta.outEstimation: the swap's full
      // projected FINAL total, computed once at swap creation. Confirmed
      // against a real in-progress stream where outEstimation already
      // showed ~8,000 USDT (the full projected swap) while raw.out (what
      // had actually landed from the 13 completed sub-swaps) was ~1,220 —
      // using outEstimation here would have overstated progress ~6.5x.
      let outputSoFarRaw = null
      if (raw) {
        const interval = Number(raw.interval) || 0
        const initialHeight = Number(raw.initial_height) || 0
        const currentHeight = this.chainsHeight?.THOR
        const blockDuration =
          currentHeight && initialHeight ? currentHeight - initialHeight : null
        const remainingBlocks = Math.max(
          interval > 0 && Number.isFinite(blockDuration)
            ? interval * quantity - blockDuration
            : (interval || 1) * (quantity - count),
          0
        )
        if (remainingBlocks > 0) {
          remainingDisplay = moment
            .duration(remainingBlocks * this.blockSeconds('THOR'), 'seconds')
            .humanize()
        }
        if (raw.in) {
          swappedSoFarDisplay = `${this.baseAmountFormatOrZero(raw.in)} ${this.showTicker(inputAsset)} swapped so far`
        }
        // raw.out is a string — "0" (a genuine, valid zero, e.g. right
        // between sub-swap settlements) is truthy as a string, so this
        // check alone is enough; `Number(raw.out) || null` would have been
        // the actual bug (0 is falsy as a number, silently discarding a
        // real zero and leaving the panel blank instead of showing 0).
        if (raw.out != null && raw.out !== '') {
          outputSoFarRaw = Number(raw.out)
        }
      }

      return {
        count,
        quantity,
        fillPercent,
        remainingDisplay,
        swappedSoFarDisplay,
        outputSoFarRaw,
        outputSoFarDisplay:
          outputSoFarRaw != null
            ? `${this.baseAmountFormatOrZero(outputSoFarRaw)} ${this.showTicker(outputAsset)}`
            : null,
        // Scaled off output.amountUSD (the projected total's already-correct
        // Midgard-priced USD value, outPriceUSD-based) rather than re-pricing
        // via amountToUSD/pools: pool lookups match on the exact asset
        // string including any contract suffix (e.g. an ERC20/TRC20 token's
        // "-0x..." address), and outputAsset here often doesn't carry one —
        // that silently priced at $0 for a real in-progress TRON.USDT stream
        // even though outputProjectedUsdDisplay (Midgard-sourced) was fine.
        outputSoFarUsdDisplay:
          outputSoFarRaw != null && +output.amount > 0
            ? this.formatUsdValue(
                (outputSoFarRaw / +output.amount) * (+output.amountUSD || 0)
              )
            : null,
      }
    },
    async fetchMimirConsensus(key, value) {
      this.mimirConsensusKey = key
      try {
        const [votesRes, mimirRes, nodesRes] = await Promise.all([
          this.$api.getVotes(),
          this.$api.getMimir(),
          this.$api.getNodes(),
        ])
        this.mimirConsensus = computeMimirConsensus({
          votes: votesRes?.data,
          mimirData: mimirRes?.data,
          nodes: nodesRes?.data,
          key,
          value,
        })
      } catch (error) {
        console.error('Failed to fetch mimir consensus:', error)
      }
    },
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
      if (s.includes('limit') && s.includes('refund')) return 'refund'
      if (s.includes('limit')) return 'limit_swap'
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
        case 'limit_swap':
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
      // Bare ticker, not chain.ticker — the network's already shown by the
      // panel's own badge chip, so repeating it here (e.g. "458,000
      // ETH.USDT" instead of "458,000 USDT") is redundant.
      if (!Number.isFinite(numericAmount)) {
        return `${formattedAmount} ${this.showTicker(asset)}`
      }
      // Use enough decimals so small amounts (e.g. 0.00217 BTC) aren't rounded to 0
      const maxDecimals = numericAmount > 0 && numericAmount < 0.01 ? 8 : 2
      const displayAmount = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxDecimals,
      }).format(numericAmount)
      return `${displayAmount} ${this.showTicker(asset)}`
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
    // Splits "MAIN (TRAILING)" into its two parts, e.g. "08/15/2026 1:41 PM
    // (12 minutes ago)" -> { main: '08/15/2026 1:41 PM', paren: '(12 minutes
    // ago)' }, or "0.02 RUNE ($0.03)" -> { main: '0.02 RUNE', paren:
    // '($0.03)' }. Unlike splitFeeValue, the parenthetical isn't required to
    // start with '$' — used for both the muted relative-time suffix and for
    // stripping a USD amount back off a combined display string.
    splitTrailingParen(str) {
      if (!str) return { main: '', paren: '' }
      const match = str.match(/^(.*?)\s*(\([^)]*\))\s*$/)
      if (!match) return { main: str, paren: '' }
      return { main: match[1], paren: match[2] }
    },
    // camelCase() (the global mixin) only spaces camelCase words (e.g.
    // "tradeWithdraw" -> "trade Withdraw"), it doesn't capitalize — fine for
    // the legacy card title it was built for, not for a hero's eyebrow/H1.
    capitalizeFirst(str) {
      if (!str) return str
      return str.charAt(0).toUpperCase() + str.slice(1)
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
      if (contractAction.metadata?.contract?.memo === 'OB Clearing')
        return 'OB Clearing'
      const msg = contractAction.metadata?.contract?.msg || {}
      if (msg.order) return 'Limit Order'
      if (msg.swap) return 'Market Order'
      if (msg.cancel_instance) return 'Cancel Strategy'
      if (!Array.isArray(msg.execute) && msg.execute?.proposal_id !== undefined)
        return 'Execute Proposal'
      if (Array.isArray(msg.execute)) return 'Execute Strategies'
      if (msg.liquidate) return 'Liquidation'
      if (msg.liquid && 'bond' in msg.liquid) return 'Liquid Stake'
      if (msg.liquid && 'unbond' in msg.liquid) return 'Liquid Unstake'
      if ('withdraw' in msg) return 'Ghost Vault Withdraw'
      if ('deposit' in msg) return 'Ghost Vault Deposit'
      if (msg.reset_instance) return 'Reset Instance'
      if (msg.account?.claim !== undefined) return 'Claim Rewards'
      if (msg.account && 'bond' in msg.account) return 'Yielding Stake'
      if (msg.account && 'unbond' in msg.account) return 'Yielding Unstake'
      if (msg.account) return 'Credit Account'
      if (msg.range?.create) return 'CCL Range'
      if (msg.range?.claim) return 'Claim Yield'
      const events = contractAction.metadata?.contract?.contractEvents || []
      if (events.some((e) => e.type === 'wasm-calc-manager/strategy.execute'))
        return 'CALC Strategy'
      if (events.some((e) => e.type === 'wasm-rujira-fin/trade'))
        return 'Market Order'
      return null
    },
    getContractTypeTone(type) {
      if (type === 'OB Clearing') return 'blue'
      if (type === 'Scale Order') return 'gold'
      if (type === 'Limit Order') return 'gold'
      if (type === 'Execute Proposal') return 'blue'
      if (type === 'Market Order') return 'blue'
      if (type === 'CALC Strategy') return 'purple'
      if (type === 'Cancel Strategy') return 'red'
      if (type === 'Liquidation') return 'red'
      if (type === 'Liquid Stake') return 'green'
      if (type === 'Liquid Unstake') return 'red'
      if (type === 'Ghost Vault Deposit') return 'green'
      if (type === 'Ghost Vault Withdraw') return 'blue'
      if (type === 'Reset Instance') return 'blue'
      if (type === 'Claim Rewards') return 'green'
      if (type === 'Yielding Stake') return 'green'
      if (type === 'Yielding Unstake') return 'red'
      if (type === 'Credit Account') return 'purple'
      if (type === 'CCL Range') return 'green'
      if (type === 'Claim Yield') return 'green'
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
      // Fall back to the tx-status memo: for early inbound-stage txs the THORNode
      // detail endpoint (td) isn't populated yet, but getTxStatus (ts) is.
      const memo = this.parseMemo(td?.tx?.tx?.memo || ts?.tx?.memo)
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
        // destAddr can be a dual-destination memo (PRIMARY/REFUND) — split so
        // both addresses are recognized as belonging to the user.
        ...(memo.destAddr?.split('/').map((a) => a.toLowerCase()) ?? []),
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
    // Remaining THOR blocks until the scheduled outbound (negative = past due).
    // Returns undefined when the outbound is already signed, so the absolute
    // schedule height never renders as a bogus multi-year ETA.
    // Prefers blocks_since_scheduled from the status endpoint — it is computed
    // server-side and avoids a separate current-height lookup; without it we
    // fall back to scheduled_outbound_height minus the local chain height.
    getScheduledOutboundETA(thorStatus) {
      const outboundSigned = thorStatus?.stages?.outbound_signed
      if (
        !outboundSigned?.scheduled_outbound_height ||
        outboundSigned.completed
      ) {
        return undefined
      }
      // blocks_since_scheduled directly tells us how many blocks past the
      // scheduled height we are; negate it so negative = overdue (ETA <= 0).
      if (outboundSigned.blocks_since_scheduled != null) {
        return -outboundSigned.blocks_since_scheduled
      }
      const currentHeight = this.thorHeight || this.chainsHeight?.THOR
      if (!currentHeight) {
        return undefined
      }
      return outboundSigned.scheduled_outbound_height - currentHeight
    },
    getBuilderContext() {
      return {
        parseMemo: this.parseMemo.bind(this),
        parseMemoAsset: this.parseMemoAsset.bind(this),
        pools: this.pools,
      }
    },
    getOutboundStatusContext() {
      return {
        getScheduledOutboundETA: this.getScheduledOutboundETA.bind(this),
        blockSeconds: this.blockSeconds.bind(this),
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
      // Fall back to the tx-status memo: for early inbound-stage txs the THORNode
      // detail endpoint (thorTx) isn't populated yet, but thorStatus is.
      const memo = this.parseMemo(thorTx?.tx?.tx?.memo || thorStatus?.tx?.memo)

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
        // Affiliate params are only valid when affiliate and BPS counts match.
        // A mismatch (e.g. two affiliates but one BPS in the memo) causes the
        // quote endpoint to reject the request.
        const affiliateParts = memo.affiliate?.split('/') ?? []
        const feeParts = memo.fee ? String(memo.fee).split('/') : []
        const affiliateParamsValid =
          affiliateFee > 0 && affiliateParts.length === feeParts.length
        if (thorStatus?.stages.swap_status?.pending && !this.quote) {
          try {
            const { data: quoteData } = await this.$api.getQuote({
              amount: inAmount,
              from_asset: inAsset ? assetToString(inAsset) : '',
              to_asset: outAsset ? assetToString(outAsset) : '',
              destination: memo.destAddr?.split('/')[0],
              streaming_interval:
                thorStatus?.stages.swap_status?.streaming?.interval ||
                memo.interval,
              ...(affiliateParamsValid && { affiliate: memo.affiliate }),
              ...(affiliateParamsValid && { affiliate_bps: memo.fee }),
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

      if (outs?.length === 0 && thorStatus?.planned_out_txs?.length > 0) {
        thorStatus?.planned_out_txs.map((t) => ({
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
    createTradeDepositState(thorStatus, actions, thorTx) {
      const midgardAction = actions.actions[0]
      const action = midgardAction
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

      const outAsset = isSecure ? assetToSecure(ast) : assetToTrade(ast)
      let outs
      if (thorStatus?.out_txs?.length > 0) {
        outs = thorStatus?.out_txs.map((tx) => ({
          asset: outAsset,
          amount: tx.coins?.[0]?.amount,
          txid: tx.id,
          to: memo.address,
          done: true,
        }))
      } else if (midgardAction.out?.length > 0) {
        outs = midgardAction.out.map((o) => ({
          asset: outAsset,
          amount: o.coins?.[0]?.amount,
          txid: o.txID,
          to: memo.address,
          done: true,
        }))
      } else {
        outs = [
          {
            asset: outAsset,
            amount: thorStatus?.tx?.coins?.[0]?.amount ?? 0,
            txid: null,
            to: memo.address,
            done: true,
          },
        ]
      }

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
    createTradeWithdrawState(thorStatus, actions, thorTx) {
      const midgardAction = actions.actions[0]
      const action = midgardAction
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

      const outAsset = isSecure ? securedToAsset(ast) : tradeToAsset(ast)
      const outboundSignal = resolveOutboundSignal(
        thorStatus,
        this.getOutboundStatusContext()
      )
      const outboundSigned = outboundSignal.signed ?? false
      const outboundETA = outboundSignal.eta
      const outDone = outboundSignal.signed === true

      const plannedOuts = thorStatus?.planned_out_txs ?? []
      const completedOuts = thorStatus?.out_txs ?? []

      let outs
      if (plannedOuts.length > 0) {
        // Use planned_out_txs as authoritative list; match each to a completed
        // out_txs entry (by amount+asset) to get the hash and done status.
        outs = plannedOuts.map((planned) => {
          const completed = completedOuts.find(
            (tx) =>
              tx.coins?.[0]?.amount === planned.coin?.amount &&
              tx.coins?.[0]?.asset === planned.coin?.asset
          )
          const legState = resolveOutboundLegState(completed, {
            signed: outboundSigned,
            eta: outboundETA,
          })
          return {
            asset: outAsset,
            amount: planned.coin?.amount,
            txid: completed?.id ?? null,
            to: planned.to_address,
            gas: completed?.gas?.[0]?.amount ?? null,
            gasAsset: completed?.gas
              ? this.parseMemoAsset(completed.gas[0]?.asset, this.pools)
              : null,
            outboundSigned: legState.signed,
            outboundETA: legState.eta,
            done: !!completed,
          }
        })
      } else if (completedOuts.length > 0) {
        outs = completedOuts.map((tx) => ({
          asset: outAsset,
          amount: tx.coins?.[0]?.amount,
          txid: tx.id,
          to: memo.address,
          gas: tx.gas?.[0]?.amount ?? null,
          gasAsset: tx.gas
            ? this.parseMemoAsset(tx.gas[0]?.asset, this.pools)
            : null,
          outboundSigned,
          outboundETA,
          done: outDone,
        }))
      } else if (midgardAction.out?.length > 0) {
        outs = midgardAction.out.map((o) => ({
          asset: outAsset,
          amount: o.coins?.[0]?.amount,
          txid: o.txID,
          to: memo.address,
          outboundSigned,
          outboundETA,
          done: outDone,
        }))
      } else {
        outs = [
          {
            asset: outAsset,
            amount: thorStatus?.tx?.coins?.[0]?.amount ?? 0,
            txid: null,
            to: memo.address,
            outboundSigned,
            outboundETA,
            done: outDone,
          },
        ]
      }

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
        mimirKey: action?.metadata?.mimir?.key,
        mimirValue: action?.metadata?.mimir?.value,
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

      if (action.type === 'mimir') {
        const nodeAddress = action?.in?.[0]?.address
        ins = [
          {
            address: nodeAddress,
            from: nodeAddress,
            txid: action?.in?.[0]?.txID,
            done: true,
          },
        ]
        const mimirKey = action?.metadata?.mimir?.key
        const mimirValue = action?.metadata?.mimir?.value
        outs = [
          {
            voteKey: mimirKey,
            voteValue: mimirValue,
            icon: require('@/assets/images/vote.svg?inline'),
            class: 'pad-icon',
            done: true,
          },
        ]
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
      const isError = nativeTx?.metadata?.send?.code !== '0'

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
          fail: isError,
        },
        out: [
          {
            icon: require('@/assets/images/wallet.svg?inline'),
            address: nativeTx?.out[0]?.address,
          },
        ],
      }

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
          code: isError ? nativeTx?.metadata?.send?.code : undefined,
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

      const outboundSignal = resolveOutboundSignal(
        thorStatus,
        this.getOutboundStatusContext()
      )

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
            outboundDelayRemaining: outboundSignal.delayRemaining,
            outboundETA: outboundSignal.eta,
            outboundSigned: outboundSignal.signed ?? false,
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
      if (thorStatus?.planned_out_txs > 0) {
        hasOngoing = thorStatus?.planned_out_txs?.some(
          (tx) => !userTxs.has(tx.to_address.toUpperCase())
        )
        outTxs.push(
          thorStatus?.planned_out_txs?.filter(
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

      const outboundDone =
        thorStatus?.stages.outbound_signed?.completed ||
        outAsset?.chain === 'THOR'

      const outs = []
      if (outAsset) {
        outs.push({
          asset: outAsset,
          amount: outAmount,
          done: outboundDone,
        })
      }

      const moreOuts = outTxs?.slice(1)
      if (moreOuts && moreOuts.length > 0) {
        outs.push(
          ...moreOuts.map((o) => ({
            asset: this.parseMemoAsset(o.coins?.[0]?.asset, this.pools),
            amount: parseInt(o.coins?.[0]?.amount ?? 0),
            done: outboundDone,
          }))
        )
      }

      const outboundSignal = resolveOutboundSignal(
        thorStatus,
        this.getOutboundStatusContext()
      )

      const outActions = []
      if (isOut) {
        outActions.push({
          fees: outboundFees,
          feeAssets: outboundFeeAssets,
          outboundDelayRemaining: outboundSignal.delayRemaining,
          outboundETA: outboundSignal.eta,
          outboundSigned: outboundSignal.signed ?? false,
          done: outboundDone,
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
              outboundSigned: outboundSignal.signed ?? false,
              done: outboundDone,
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
        // destAddr can be a dual-destination memo (PRIMARY/REFUND) — split so
        // both addresses are recognized as belonging to the user.
        // TODO: sometimes the memo destAddr will be THORName
        ...(memo.destAddr?.split('/').map((a) => a.toLowerCase()) ?? []),
      ])
      // Non affiliate outs
      const memoAssetStr = (() => {
        const parsed = this.parseMemoAsset(memo?.asset)
        return parsed ? assetToString(parsed) : null
      })()
      // Midgard already tells us, per outbound, whether it's an affiliate
      // payout (`out[].affiliate`). THORNode's tx status/details have no such
      // flag, so outTxs below is otherwise built from an address/asset
      // heuristic that is wrong whenever an affiliate fee is paid in the
      // swap's destination asset, or whenever the THORNode endpoints
      // (tx/status, tx/details) fail or return incomplete data for this tx —
      // which happens often enough to matter (load-balanced/archival nodes).
      // Midgard's flag is unaffected by any of that, so it's used both to
      // exclude affiliate addresses from the THORNode-derived list AND as the
      // final fallback source of truth when THORNode gives us nothing usable.
      const midgardSwapActionForAffiliate =
        actions?.actions?.find((a) => a.type === 'swap') ??
        actions?.actions?.find((a) => a.type === 'limit_swap')
      const midgardOuts = midgardSwapActionForAffiliate?.out ?? []
      const affiliateAddresses = new Set(
        midgardOuts
          .filter((o) => o.affiliate)
          .map((o) => o.address?.toLowerCase())
          .filter(Boolean)
      )
      const nonAffiliateMidgardOuts = midgardOuts.filter((o) => !o.affiliate)
      let outTxs = thorStatus?.out_txs?.filter(
        (tx) =>
          !affiliateAddresses.has(tx.to_address?.toLowerCase()) &&
          (userAddresses.has(tx.to_address?.toLowerCase()) ||
            (tx.coins?.[0]?.asset === memoAssetStr &&
              tx.id !==
                '0000000000000000000000000000000000000000000000000000000000000000' &&
              tx.id !== ''))
      )
      // get affiliate out if available
      // Note: affiliate payouts (esp. RUNE ones) are often internal transfers
      // with a zero-hash id, so id is not a useful filter here — go by address.
      const affiliateOut = thorStatus?.out_txs?.filter(
        (tx) =>
          affiliateAddresses.has(tx.to_address?.toLowerCase()) ||
          !userAddresses.has(tx.to_address?.toLowerCase())
      )
      // TODO: fix this in track code
      if (
        !outTxs ||
        outTxs?.length === 0 ||
        outTxs.every((o) => o.to_address === thorStatus?.tx.from_address) // Add scheduled outbound while having a refund
      ) {
        outTxs = thorStatus?.planned_out_txs
          ?.filter(
            (tx) =>
              userAddresses.has(tx.to_address.toLowerCase()) &&
              !affiliateAddresses.has(tx.to_address.toLowerCase())
          )
          .map((tx) => ({
            ...tx,
            coins: [{ amount: tx.coin.amount, asset: tx.coin.asset }],
          }))
      }

      // THORNode gave us nothing usable (tx/status and tx/details can both
      // fail or come back incomplete, e.g. for older/archived transactions on
      // load-balanced nodes) — fall back to Midgard's own outs directly. It
      // already excludes affiliate payouts, so this can never surface one.
      if (!outTxs || outTxs.length === 0) {
        outTxs = nonAffiliateMidgardOuts.map((o) => ({
          id: o.txID || null,
          to_address: o.address,
          coins: o.coins,
          height: o.height,
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

      // Add a partial refund that only Midgard's own action feed knows
      // about — a trade/secure-asset streaming swap whose leftover
      // unswapped input (sub-swaps that missed their price limit) is
      // refunded as an internal THORChain ledger credit, never a
      // cross-chain outbound. THORNode has no record of it at all (no
      // out_txs entry, no queued 'refund:' action), so the block above
      // can't find it — it only shows up as a separate Midgard
      // `type: 'refund'` action alongside the tx's `type: 'swap'` action.
      // Confirmed against a real trade-asset streaming swap,
      // 4DEE248E75FD4CD2ABEB46CBBB1F25C41C0C8A3BEE332A5108CEC44302F61E90 —
      // 2 of 3 sub-swaps missed their price limit, and the unswapped 2/3 of
      // the input only appears here. Read the refund action's own `in`
      // coin (the actual refunded amount+asset) rather than its `out`,
      // which duplicates the swap's own out asset/amount and can't be
      // trusted.
      const midgardRefundAction = actions?.actions?.find(
        (a) => a.type === 'refund'
      )
      const midgardRefundCoin = midgardRefundAction?.in?.[0]?.coins?.[0]
      const hasMidgardSwapAction = actions?.actions?.some(
        (a) => a.type === 'swap' || a.type === 'limit_swap'
      )
      if (
        midgardRefundCoin &&
        hasMidgardSwapAction &&
        midgardRefundCoin.asset === inboundAsset &&
        !outTxs?.some(
          (o) =>
            o.coins?.[0]?.asset === midgardRefundCoin.asset &&
            String(o.coins?.[0]?.amount) === String(midgardRefundCoin.amount)
        )
      ) {
        outTxs = [
          ...(outTxs ?? []),
          {
            id: null,
            to_address:
              midgardRefundAction.in?.[0]?.address ||
              thorStatus?.tx?.from_address,
            coins: [midgardRefundCoin],
            refund: true,
          },
        ]
      }

      // Add scheduled outbound actions from thorTx.actions not yet in out_txs.
      // Skip anything Midgard flagged as an affiliate payout, and (as a
      // fallback for when Midgard's out[] isn't available either) skip
      // THOR.RUNE actions going to a non-user address — those are affiliate payments.
      const scheduledOutActions = (thorTx?.actions ?? []).filter(
        (a) =>
          a.memo?.toLowerCase().startsWith('out:') &&
          !affiliateAddresses.has(a.to_address?.toLowerCase()) &&
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

      let outAsset = this.parseMemoAsset(
        outTxs?.length > 0 ? outTxs[0]?.coins?.[0]?.asset : memo?.asset,
        this.pools
      )
      let outAmount =
        outTxs?.length > 0 ? parseInt(outTxs[0]?.coins?.[0]?.amount ?? 0) : 0
      if (!outAmount && actions?.actions?.length > 0) {
        const outAssetStr = outAsset ? assetToString(outAsset) : null
        const midgardSwapAction =
          actions?.actions?.find((a) => a.type === 'swap') ??
          actions?.actions?.find((a) => a.type === 'limit_swap')
        // For trade/secure assets, sum across unique txIDs (multiple sub-outs per swap).
        // For all other assets, use the first non-affiliate out matching the target asset.
        if (outAsset?.trade || outAsset?.secure) {
          outAmount = parseInt(
            Object.values(
              groupBy(
                midgardSwapAction?.out?.filter(
                  (a) => a.coins?.[0]?.asset === outAssetStr
                ),
                'txID'
              )
            ).map((group) =>
              sumBy(group, (item) => +(item.coins?.[0]?.amount ?? 0))
            )[0]
          )
        } else {
          const midgardOut = midgardSwapAction?.out?.find(
            (o) => !o.affiliate && o.coins?.[0]?.asset === outAssetStr
          )
          if (midgardOut) {
            outAmount = parseInt(midgardOut.coins?.[0]?.amount ?? 0)
          }
        }
      }

      // only refund happened
      const onlyRefund =
        actions?.actions.length > 0 &&
        actions?.actions.every((action) => action?.type === 'refund')
      const refundAction = actions?.actions?.find((a) => a.type === 'refund')

      // A trade/secure-asset refund settles as an internal THORChain ledger
      // update, not an observed cross-chain outbound — out_txs stays empty,
      // so outAsset/outAmount above fell back to the memo's intended
      // DESTINATION asset and 0. A refund always returns the same asset
      // (and, absent any withheld fee info, the same amount) that was sent
      // in.
      if (onlyRefund && !outTxs?.length) {
        outAsset = inAsset
        outAmount = inAmount
      }

      const outMemoAsset = this.parseMemoAsset(memo?.asset)

      // Midgard
      // There are multiple outbound fee
      // also there might be refund involved
      const swapAction =
        actions?.actions?.find((a) => a.type === 'swap') ??
        actions?.actions?.find((a) => a.type === 'limit_swap')
      const swapMetadata =
        swapAction?.metadata?.swap ?? swapAction?.metadata?.limit_swap
      const outboundFees =
        swapMetadata?.networkFees?.map((n) => n?.amount) ?? []
      const outboundFeeAssets =
        outboundFees?.length > 0
          ? this.parseMemoAsset(
              swapMetadata?.networkFees?.map((n) => n?.asset),
              this.pools
            )
          : null
      let timeStamp = swapAction?.date
      let height = swapAction?.height

      // Refunds
      const outboundHasRefund = outTxs?.some(
        (tx) => tx.refund || tx.memo?.toLowerCase().startsWith('refund')
      )
      // sometimes the outbound doesn't come out if the outbound is in native chain
      const outboundHasSuccess = outTxs?.some((tx) =>
        tx.memo?.toLowerCase().startsWith('out')
      )

      const streamingMeta = swapMetadata?.streamingSwapMeta

      // When the quote endpoint fails, estimate the final output by projecting
      // the accumulated streaming output to the full swap quantity.
      const streamingProgressEstimate = (() => {
        // Prefer the direct outEstimation field when available.
        const directEstimate = parseInt(streamingMeta?.outEstimation ?? 0)
        if (directEstimate) return directEstimate
        // Fall back to projecting partial progress to the full quantity.
        const partialOut = parseInt(streamingMeta?.outCoin?.amount ?? 0)
        const count = parseInt(streamingMeta?.count ?? 0)
        const quantity = parseInt(streamingMeta?.quantity ?? 0)
        if (!partialOut || !count || !quantity) return 0
        return Math.round((partialOut * quantity) / count)
      })()
      const estimatedOutAmount =
        outAmount ||
        +this.quote?.expected_amount_out ||
        streamingProgressEstimate

      // swapMetadata's historical inPriceUSD/outPriceUSD only exist on a
      // Midgard 'swap'/'limit_swap' action — a pure refund has neither (see
      // the height/timeStamp/memo fallbacks above), so it's always 0 here.
      // Fall back to the current pool price (amountToUSD already converts
      // trade assets to their native equivalent before the pool lookup —
      // rule of thumb: trade/secure assets always need that conversion
      // before pricing, never priced directly under their suffixed form).
      const inAmountUSD =
        (+(swapMetadata?.inPriceUSD ?? 0) * inAmount) / 1e8 ||
        this.amountToUSD(inAsset, inAmount, this.pools) ||
        0
      let outAmountUSD =
        (+(swapMetadata?.outPriceUSD ?? 0) * estimatedOutAmount) / 1e8 ||
        this.amountToUSD(outAsset, estimatedOutAmount, this.pools) ||
        0
      if (!outboundHasSuccess && outboundHasRefund) {
        outAmountUSD =
          (+(swapMetadata?.inPriceUSD ?? 0) * outAmount) / 1e8 ||
          this.amountToUSD(outAsset, outAmount, this.pools) ||
          0
      }

      const outboundRefundReason = actions?.actions.find(
        (action) => action.type === 'refund'
      )?.metadata?.refund?.reason

      if (onlyRefund) {
        // A pure refund has no Midgard 'swap' action at all (every action is
        // type 'refund'), so swapAction above is undefined and neither its
        // date nor its height are available — fall back to the refund
        // action's own, which every Midgard action carries.
        timeStamp = refundAction?.date
        height = refundAction?.height
      }
      this.height = height
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

      const outboundSignal = resolveOutboundSignal(
        thorStatus,
        this.getOutboundStatusContext()
      )

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

      const depositAmountZero = !parseInt(
        streamingMeta?.depositedCoin?.amount || 0
      )
      const rapidInterval = depositAmountZero
        ? memo?.interval
        : (streamingMeta?.interval ?? memo?.interval)
      const isRapidSwap =
        (rapidInterval === 0 || rapidInterval === '0') && +height > 25400000
      const isLimitOrder = !!memo?.isLimitOrder
      const swapTypeLabel = isLimitOrder
        ? 'limit order'
        : isRapidSwap
          ? 'rapid Swap'
          : 'swap'
      const refundedSwapTypeLabel = isLimitOrder
        ? 'refunded limit order'
        : isRapidSwap
          ? 'refunded Rapid Swap'
          : 'refunded Swap'

      const firstOutDone =
        (outTxs?.length > 0 && !!outTxs[0]?.id) ||
        (!thorStatus?.stages.swap_status?.pending &&
          (thorStatus?.stages.outbound_signed?.completed ||
            outAsset?.chain === 'THOR' ||
            outAsset?.synth ||
            outAsset?.trade ||
            outAsset?.secure) &&
          (thorStatus?.stages.outbound_delay?.completed ?? true))
      const moreOutDone = (o) =>
        !!o.id ||
        (!thorStatus?.stages.swap_status?.pending &&
          (thorStatus?.stages.outbound_signed?.completed ||
            outAsset?.chain === 'THOR' ||
            outAsset?.synth ||
            outAsset?.trade ||
            outAsset?.secure))

      return {
        cards: {
          title: onlyRefund ? refundedSwapTypeLabel : swapTypeLabel,
          labels: onlyRefund ? [] : isRefund ? ['Refund'] : [],
          in: [
            {
              asset: inAsset,
              amount: inAmount,
              amountUSD: inAmountUSD,
              usdAtExecution: !!swapMetadata?.inPriceUSD,
            },
          ],
          middle: {
            pending: this.isTxInPending(thorStatus, actions),
            fail: onlyRefund,
          },
          out: [
            {
              asset: outAsset,
              amount: estimatedOutAmount,
              amountUSD: outAmountUSD,
              // Matches outAmountUSD's own two-branch derivation above —
              // the refund reassignment prices off inPriceUSD, not
              // outPriceUSD.
              usdAtExecution:
                !outboundHasSuccess && outboundHasRefund
                  ? !!swapMetadata?.inPriceUSD
                  : !!swapMetadata?.outPriceUSD,
              filter: outAmount
                ? undefined
                : (v) => `~ ${this.baseAmountFormatOrZero(v)}`,
              done: firstOutDone,
              // Per-leg detail a multi-outbound swap (e.g. one output split
              // across several destination-chain txs by an amount cap) needs
              // for its own hero — same v1 fallback as
              // createTradeWithdrawState: no per-leg scheduled height exists,
              // so every still-pending leg shares the tx-wide signal.
              txid: outTxs?.[0]?.id ?? null,
              to:
                outTxs?.[0]?.to_address ??
                memo?.destAddr?.split('/')[0] ??
                null,
              outboundETA: firstOutDone ? null : outboundSignal.eta,
            },
            ...(outTxs ?? []).slice(1).map((o) => {
              const oAmount = parseInt(o.coins?.[0]?.amount ?? 0)
              const isRefundTx =
                o.refund || o.memo?.toLowerCase().startsWith('refund')
              const priceUSD = isRefundTx
                ? +(swapMetadata?.inPriceUSD ?? 0)
                : +(swapMetadata?.outPriceUSD ?? 0)
              return {
                asset: this.parseMemoAsset(o.coins?.[0]?.asset, this.pools),
                amount: oAmount,
                amountUSD: (priceUSD * oAmount) / 1e8,
                usdAtExecution: isRefundTx
                  ? !!swapMetadata?.inPriceUSD
                  : !!swapMetadata?.outPriceUSD,
                done: moreOutDone(o),
                txid: o.id ?? null,
                to: o.to_address ?? null,
                outboundETA: moreOutDone(o) ? null : outboundSignal.eta,
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
              finalisedHeight: thorTx?.finalised_height,
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
            ttl: memo?.ttl || null,
            isLimitOrder,
            // Live quote for the remaining amount — lets the UI show how far
            // the market currently is from clearing a resting limit order.
            currentQuoteOut:
              isLimitOrder && this.quote?.expected_amount_out
                ? parseInt(this.quote.expected_amount_out)
                : null,
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
            // A pure refund has no Midgard 'swap' action (swapAction is
            // undefined — see the height/timeStamp fallback above), so its
            // memo has to come from the refund action's own metadata
            // instead.
            memo:
              swapAction?.metadata.swap?.memo ??
              refundAction?.metadata?.refund?.memo,
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
              delayBlocksRemaining: outboundSignal.delayBlocksRemaining,
              outboundDelayRemaining: outboundSignal.delayRemaining,
              outboundETA: outboundSignal.eta,
              outboundSigned: outboundSignal.signed,
              done: firstOutDone,
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
              done: moreOutDone(o),
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
  // See the identical rule + comment in assets/styles/_tx-detail.scss —
  // width:100% keeps this a definite size so max-width actually caps it,
  // instead of the flex item falling back to fit-content sizing.
  margin: $space-8 auto $space-24;
  max-width: 1140px;
  padding: 0 $space-16;
  width: 100%;
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

  // .bubble-stack/.bubble-pill styling lives in assets/styles/_tx-detail.scss
  // (shared with the legacy txCard.vue, which had its own verbatim copy).
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

.tx-pair-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-10;
  padding: $space-20 0;
  grid-column: 1 / -1;
}

.tx-pair-icons {
  display: flex;
  align-items: center;

  .tx-pair-icon-overlap {
    margin-left: -0.65rem;
  }
}

.tx-pair-label {
  color: var(--sec-font-color);
  font-size: 1.5rem;
  font-weight: 700;
}

.tx-pair-input-amount {
  color: var(--font-color);
  font-size: $font-size-desktop;
  font-weight: 600;
  font-family: monospace;
}

.tx-pair-sublabel {
  text-align: center;
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
  transform: rotate(180deg);
  width: 20px;

  @include md {
    transform: rotate(90deg);
  }

  &.order {
    transform: rotate(0deg);
  }
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

.tx-lifecycle-item:last-child .tx-lifecycle-dot {
  align-self: center;
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

// ── Order book ───────────────────────────────────────────────────────────────

.tx-order-book-header {
  display: flex;
  align-items: center;
  gap: $space-8;
  margin-bottom: $space-14;

  .tx-order-book-count {
    background: var(--border-color);
    border-radius: $radius-full;
    color: var(--sec-font-color);
    font-size: 0.62rem;
    padding: 1px 6px;
  }
}

.tx-order-book {
  font-size: $font-size-xs;
  font-family: monospace;
}

.tx-order-book-cols {
  display: grid;
  grid-template-columns: auto 1fr 1fr 1fr auto;
  padding: 0 $space-12 $space-6;
  color: var(--sec-font-color);
  font-family: inherit;
  font-size: 0.65rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-bottom: 1px solid
    color-mix(in srgb, var(--border-color) 70%, transparent);

  span:not(:first-child) {
    text-align: right;
  }

  span:last-child {
    min-width: 60px;
  }
}

.tx-order-book-row {
  display: grid;
  grid-template-columns: auto 1fr 1fr 1fr auto;
  align-items: center;
  padding: $space-4 $space-12;
  position: relative;
  border-bottom: 1px solid
    color-mix(in srgb, var(--border-color) 30%, transparent);
  transition: background 0.1s;

  // Depth bar fills from left for buys, right for sells
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: $radius-xs;
  }

  &.ob-buy::before {
    background: linear-gradient(
      to right,
      rgba(53, 240, 154, 0.12) var(--depth),
      transparent var(--depth)
    );
  }

  &.ob-sell::before {
    background: linear-gradient(
      to left,
      rgba(255, 105, 94, 0.12) var(--depth),
      transparent var(--depth)
    );
  }

  &.ob-retract {
    opacity: 0.45;
  }

  &.ob-keep {
    opacity: 0.6;
  }

  &:last-child {
    border-bottom: none;
  }

  span {
    position: relative; // above the ::before bar
    color: var(--sec-font-color);

    &:not(:first-child) {
      text-align: right;
    }
  }

  .ob-price--buy {
    color: #35f09a;
  }
  .ob-price--sell {
    color: #ff695e;
  }

  .ob-side {
    font-weight: 600;
    min-width: 32px;
    text-align: left;
  }
}

.ob-op {
  font-size: 0.62rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--sec-font-color);
  opacity: 0.6;
  min-width: 60px;
  text-align: right;
}

// ── Contract Events button & modal ───────────────────────────────────────────

.tx-section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tx-events-btn {
  align-items: center;
  background: var(--card-bg);
  border: 1px solid color-mix(in srgb, var(--border-color) 92%, transparent);
  border-radius: 10px;
  color: var(--sec-font-color);
  cursor: pointer;
  display: flex;
  font-size: $font-size-xs;
  font-weight: 500;
  gap: $space-6;
  justify-content: center;
  padding: $space-6 $space-12;
  text-decoration: none;
  transition:
    border-color 0.15s,
    color 0.15s;

  &:hover {
    border-color: color-mix(in srgb, var(--green) 40%, var(--border-color));
    color: var(--green);
  }

  &:hover .tx-events-btn-icon {
    fill: var(--primary-color);
  }
}

.tx-events-btn-icon {
  fill: var(--sec-font-color);
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.tx-events-count {
  background: color-mix(in srgb, var(--border-color) 80%, transparent);
  border-radius: $radius-full;
  font-size: 0.62rem;
  padding: 1px 5px;
  color: var(--sec-font-color);
}

.events-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 998;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: $space-16;
  overflow-y: auto;

  @include md {
    padding: $space-24;
  }
}

.events-modal {
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-s;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 999;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 680px;
  height: calc(100vh - 80px - 2 * #{$space-16});
  overflow: hidden;

  @media (max-width: 575px) {
    height: calc(100vh - 80px - 2 * #{$space-16});
    border-radius: $radius-s;
  }
}

.events-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-16 $space-20;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.events-modal-title {
  font-size: $font-size-desktop;
  font-weight: 600;
  color: var(--font-color);
}

.events-modal-close {
  width: 18px;
  height: 18px;
  cursor: pointer;
  color: var(--sec-font-color);
  flex-shrink: 0;

  &:hover {
    color: var(--primary-color);
  }
}

.events-modal-search {
  padding: $space-12 $space-20;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.events-search-input {
  width: 100%;
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-s;
  color: var(--font-color);
  font-size: $font-size-sm;
  padding: $space-8 $space-12;
  outline: none;
  transition: border-color 0.15s;

  &::placeholder {
    color: var(--sec-font-color);
  }

  &:focus {
    border-color: var(--primary-color);
  }
}

.events-modal-body {
  overflow-y: auto;
  padding: $space-12 $space-20;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $space-12;

  // Event blocks must never shrink — only the body scrolls
  > * {
    flex-shrink: 0;
  }
}

.events-msg-block {
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-s;
  overflow: hidden;
  flex-shrink: 0;
}

.events-msg-json {
  margin: 0;
  padding: $space-10 $space-12;
  font-size: $font-size-xs;
  font-family: monospace;
  color: var(--sec-font-color);
  white-space: pre;
  overflow-x: auto;
  line-height: 1.5;
}

.events-event-block {
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-s;
  overflow: hidden;
}

.events-event-type {
  background: color-mix(in srgb, var(--border-color) 40%, transparent);
  color: var(--font-color);
  font-size: $font-size-xs;
  font-weight: 600;
  padding: $space-6 $space-12;
  font-family: monospace;
  word-break: break-all;
}

.events-attr-row {
  display: flex;
  padding: $space-4 $space-12;
  gap: $space-12;
  border-top: 1px solid color-mix(in srgb, var(--border-color) 50%, transparent);

  @media (max-width: 575px) {
    flex-direction: column;
    gap: $space-2;
  }
}

.events-attr-key {
  color: var(--primary-color);
  font-size: $font-size-xs;
  font-family: monospace;
  white-space: nowrap;
  min-width: 120px;
  flex-shrink: 0;

  @media (max-width: 575px) {
    min-width: unset;
  }
}

.events-attr-val {
  color: var(--sec-font-color);
  font-size: $font-size-xs;
  font-family: monospace;
  word-break: break-all;
}

.events-empty {
  color: var(--sec-font-color);
  font-size: $font-size-sm;
  text-align: center;
  padding: $space-24 0;
}
</style>
