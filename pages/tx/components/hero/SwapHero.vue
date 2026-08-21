<template>
  <div>
    <TxHeroShell :title="overview.title">
      <template #meta>
        <span>{{ overview.metaLabel }}</span>
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
          v-if="overview.affiliateAddress"
          :affiliate-address="overview.affiliateAddress"
        />
      </template>

      <template #main>
        <section class="tx-swap-card card-bg">
          <div
            v-if="overview.pairDisplay || overview.input || overview.output"
            class="tx-swap-head"
            :style="panelVars"
          >
            <template v-if="overview.pairDisplay">
              <div class="tx-pair-display">
                <div class="tx-pair-icons">
                  <AssetIcon
                    v-if="overview.pairDisplay.baseAsset"
                    :asset="overview.pairDisplay.baseAsset"
                    :height="'2.25rem'"
                  />
                  <AssetIcon
                    v-if="overview.pairDisplay.quoteAsset"
                    :asset="overview.pairDisplay.quoteAsset"
                    :height="'2.25rem'"
                    class="tx-pair-icon-overlap"
                  />
                </div>
                <div class="tx-pair-label">
                  {{ overview.pairDisplay.label }}
                </div>
                <div
                  v-if="overview.pairDisplay.inputAmount"
                  class="tx-pair-input-amount"
                >
                  {{ overview.pairDisplay.inputAmount }}
                </div>
                <div class="tx-asset-badge tx-pair-sublabel">
                  {{ overview.pairDisplay.sublabel }}
                </div>
              </div>
            </template>
            <template v-else>
              <div v-if="overview.input" class="tx-asset-panel">
                <div class="tx-asset-label">Input</div>
                <div class="tx-asset-primary">
                  <AssetIcon
                    v-if="overview.input.asset"
                    :asset="overview.input.asset"
                    :height="'2.25rem'"
                  />
                  <span>{{ overview.input.name }}</span>
                </div>
                <div class="tx-asset-badge">
                  {{ overview.input.badge }}
                </div>
                <div class="tx-asset-values">
                  <span>{{ overview.input.amount }}</span>
                  <strong
                    v-if="overview.input.usd"
                    v-tooltip="
                      overview.input.usdAtExecution
                        ? 'Value based on price at the time the transaction was executed'
                        : 'Based on current price, not price at the time of the transaction'
                    "
                    style="cursor: help"
                    >{{ safeUsdDisplay(overview.input.usd) }}</strong
                  >
                </div>
              </div>

              <div class="tx-swap-arrow">
                <OrderIcon
                  v-if="overview.hasContractAction"
                  class="tx-swap-arrow-icon order"
                />
                <ArrowIcon v-else class="tx-swap-arrow-icon" />
              </div>

              <div
                v-if="overview.output"
                :class="[
                  'tx-asset-panel',
                  overview.returnedOutput
                    ? 'tx-asset-panel--accent tx-asset-panel--split'
                    : 'tx-asset-panel--accent',
                ]"
              >
                <div class="tx-asset-label">Output</div>
                <div class="tx-asset-primary">
                  <AssetIcon
                    v-if="overview.output.asset"
                    :asset="overview.output.asset"
                    :height="'2.25rem'"
                  />
                  <span>{{ overview.output.name }}</span>
                </div>
                <div class="tx-asset-badge">
                  {{ overview.output.badge }}
                </div>
                <div class="tx-asset-values">
                  <span>{{ overview.output.amount }}</span>
                  <strong
                    v-if="overview.output.usd"
                    v-tooltip="
                      overview.output.usdAtExecution
                        ? 'Value based on price at the time the transaction was executed'
                        : 'Based on current price, not price at the time of the transaction'
                    "
                    style="cursor: help"
                    >{{ safeUsdDisplay(overview.output.usd) }}</strong
                  >
                </div>
                <template v-if="overview.returnedOutput">
                  <div class="tx-asset-divider" />
                  <div class="tx-returned-panel">
                    <div class="tx-asset-label tx-asset-label--returned">
                      Returned
                    </div>
                    <div class="tx-returned-row">
                      <AssetIcon
                        v-if="overview.returnedOutput.asset"
                        :asset="overview.returnedOutput.asset"
                        :height="'1.1rem'"
                        :chain-height="'0.7rem'"
                      />
                      <span class="tx-returned-name">{{
                        overview.returnedOutput.name
                      }}</span>
                      <span class="tx-returned-amount">{{
                        overview.returnedOutput.amount
                      }}</span>
                    </div>
                  </div>
                </template>
              </div>
            </template>
          </div>

          <div v-if="overview.metricRows.length" class="tx-metric-strip">
            <div
              v-for="metric in overview.metricRows"
              :key="metric.label"
              class="tx-metric-item"
            >
              <div class="tx-asset-label">{{ metric.label }}</div>
              <div class="tx-metric-value">{{ metric.value }}</div>
            </div>
          </div>
        </section>

        <section
          v-if="overview.orderRows && overview.orderRows.length"
          class="tx-info-card card-bg tx-order-book-card"
        >
          <div class="tx-order-book-header">
            <span class="tx-section-title">Orders</span>
            <span class="tx-order-book-count">{{
              overview.orderRows.length
            }}</span>
          </div>
          <div class="tx-order-book">
            <div class="tx-order-book-cols">
              <span>Side</span>
              <span
                >Price<template v-if="overview.orderPairTickers">
                  ({{ overview.orderPairTickers.quote }})</template
                ></span
              >
              <span
                >Amount<template v-if="overview.orderPairTickers">
                  ({{
                    overview.orderPairTickers.isBuy
                      ? overview.orderPairTickers.quote
                      : overview.orderPairTickers.base
                  }})</template
                ></span
              >
              <span
                >Return<template v-if="overview.orderPairTickers">
                  ({{
                    overview.orderPairTickers.isBuy
                      ? overview.orderPairTickers.base
                      : overview.orderPairTickers.quote
                  }})</template
                ></span
              >
              <span>Op</span>
            </div>
            <div
              v-for="(r, i) in overview.orderRows"
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
              v-for="row in overview.detailRows"
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
                      statusToneClass(overview.status.tone),
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
          v-if="overview.lifecycleRows.length"
          class="tx-info-card card-bg"
        >
          <div class="tx-section-title-row">
            <span class="tx-section-title">Lifecycle Events</span>
            <button
              v-if="overview.rawEvents && overview.rawEvents.length"
              class="tx-events-btn"
              @click="eventsModalOpen = true"
            >
              <ListIcon class="tx-events-btn-icon" />
              View Events
              <span class="tx-events-count">{{
                overview.rawEvents.length
              }}</span>
            </button>
          </div>
          <div class="tx-lifecycle-list">
            <div
              v-for="event in overview.lifecycleRows"
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
      </template>

      <template #rail>
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

        <section v-if="overview.feeRows.length" class="tx-info-card card-bg">
          <div class="tx-section-title">Fee Breakdown</div>
          <div class="tx-fee-list">
            <div
              v-for="fee in overview.feeRows"
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
              v-for="row in overview.technicalRows"
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
      </template>
    </TxHeroShell>

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
              v-if="overview.rawMsg && !eventsSearchQuery"
              class="events-msg-block"
            >
              <div class="events-event-type">msg</div>
              <pre class="events-msg-json">{{
                JSON.stringify(overview.rawMsg, null, 2)
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
  </div>
</template>

<script>
import TxHeroShell from '~/pages/tx/components/TxHeroShell.vue'
import AssetIcon from '~/components/AssetIcon.vue'
import AddressComponent from '~/components/transactions/Address.vue'
import ProductBadge from '~/components/ProductBadge.vue'
import Affiliate from '~/components/Affiliate.vue'
import ArrowIcon from '~/assets/images/arrow.svg?inline'
import OrderIcon from '~/assets/images/order.svg?inline'
import RateChangeIcon from '~/assets/images/rate-change.svg?inline'
import CheckIcon from '~/assets/images/square-checkmark.svg?inline'
import ClockIcon from '~/assets/images/clock.svg?inline'
import WarningIcon from '~/assets/images/warning.svg?inline'
import SwapIcon from '~/assets/images/swap.svg?inline'
import SendTypeIcon from '~/assets/images/send-outline.svg?inline'
import RefreshIcon from '~/assets/images/refresh.svg?inline'
import ExchangeIcon from '~/assets/images/exchange.svg?inline'
import AddIcon from '~/assets/images/add.svg?inline'
import ExternalIcon from '~/assets/images/external.svg?inline'
import CrossIcon from '~/assets/images/cross.svg?inline'
import ListIcon from '~/assets/images/highlight-list.svg?inline'
import { assetFromString, getExplorerAddressUrl } from '~/utils'

// Renders the merged `swapOverview`/`contractOverview` computed from
// pages/tx/_txhash.vue (screen 1, the original swap page this whole hero
// redesign started from) — extracted last, after the other six hero screens,
// so the working swap page was never at risk while the pattern was still
// being proven out (see TxHeroShell.vue's own history). swapOverview and
// contractOverview render through this exact same markup and are merged by
// the parent's activeOverview computed (contractOverview wins only when it
// sets `priority: true`, else swapOverview wins) before this component ever
// sees them — so, unlike the other six heroes, this one takes the
// pre-resolved `overview` rather than two separate props. Kept as a
// mechanical, byte-for-byte extraction rather than a redesign: it
// intentionally does not switch to DetailRow/TechnicalDetailsCard/
// LifecycleTimeline like the other heroes, because those shared components
// don't yet support what this screen needs (TechnicalDetailsCard has no
// `address`-type field; LifecycleTimeline doesn't register the icons this
// screen's lifecycle rows use).
export default {
  components: {
    TxHeroShell,
    AssetIcon,
    AddressComponent,
    ProductBadge,
    Affiliate,
    ArrowIcon,
    OrderIcon,
    RateChangeIcon,
    CheckIcon,
    ClockIcon,
    WarningIcon,
    SwapIcon,
    SendTypeIcon,
    RefreshIcon,
    ExchangeIcon,
    AddIcon,
    ExternalIcon,
    CrossIcon,
    ListIcon,
  },
  props: {
    overview: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      technicalExpanded: false,
      overviewBubbleExpanded: false,
      rateFlipped: false,
      eventsModalOpen: false,
      eventsSearchQuery: '',
    }
  },
  computed: {
    inputExplorerUrl() {
      const asset = this.overview?.input?.asset
      if (!asset) return null
      if (this.overview?.input?.secure) return null
      const parsed = assetFromString(asset)
      const chain = parsed?.chain
      if (!chain || chain === 'THOR') return null
      const inTxId = this.overview?.input?.txId
      if (!inTxId) return null
      return getExplorerAddressUrl(chain, inTxId, 'hash')
    },
    outputExplorerUrl() {
      const asset = this.overview?.output?.asset
      if (!asset) return null
      const parsed = assetFromString(asset)
      const chain = parsed?.chain
      if (!chain || chain === 'THOR') return null
      const outTxId = this.overview?.output?.txId
      if (!outTxId) return null
      return getExplorerAddressUrl(chain, outTxId, 'hash')
    },
    panelVars() {
      const overview = this.overview
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
      const overview = this.overview
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
    filteredContractEvents() {
      const events = this.overview?.rawEvents || []
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
  mounted() {
    this._escHandler = (e) => {
      if (e.key === 'Escape') this.eventsModalOpen = false
    }
    window.addEventListener('keydown', this._escHandler)
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this._escHandler)
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
    safeUsdDisplay(value) {
      const text = `${value ?? ''}`.trim()
      if (!text || /nan|infinity/i.test(text)) return '$0'
      return text
    },
    statusToneClass(tone) {
      const map = { red: 'danger', blue: 'info', yellow: 'yellow' }
      return map[tone] || null
    },
  },
}
</script>
