<template>
  <TxHeroShell eyebrow="Streaming Swap · THORChain" :chips="chips">
    <template #title>
      <template v-if="isOutbound">
        Swapped <span class="mono">{{ overview.amountDisplay }}</span> for
        <span class="mono">{{ outputAssetNotation }}</span>
        — <span class="tx-value-warning">outbound pending</span>
      </template>
      <template v-else>
        Swapping <span class="mono">{{ overview.amountDisplay }}</span> for
        <span class="mono">{{ outputAssetNotation }}</span>
      </template>
    </template>

    <template #main>
      <section class="tx-swap-card">
        <div class="tx-swap-head">
          <div class="tx-asset-panel">
            <div class="tx-asset-label">Input</div>
            <div class="tx-asset-primary">
              <AssetIcon :asset="overview.asset" :height="'2.25rem'" />
              <span>{{ inputTicker }}</span>
            </div>
            <div class="tx-asset-badge">{{ overview.assetBadge }}</div>
            <div class="tx-asset-values">
              <span>{{ overview.amountDisplay }}</span>
              <strong>{{ overview.amountUsdDisplay }}</strong>
            </div>
            <div v-if="overview.swappedSoFarDisplay" class="tx-mimir-gloss">
              {{ overview.swappedSoFarDisplay }}
            </div>
          </div>

          <div class="tx-swap-arrow">
            <ArrowIcon class="tx-swap-arrow-icon" />
          </div>

          <div class="tx-asset-panel tx-asset-panel--accent">
            <div class="tx-asset-label">{{ isOutbound ? 'Output' : 'Output so far' }}</div>
            <div class="tx-asset-primary">
              <AssetIcon :asset="overview.outputAsset" :height="'2.25rem'" />
              <span>{{ outputTicker }}</span>
            </div>
            <div class="tx-asset-badge">{{ overview.outputAssetBadge }}</div>
            <div v-if="isOutbound" class="tx-asset-values">
              <span>{{ overview.outputProjectedDisplay }}</span>
              <strong>{{ overview.outputProjectedUsdDisplay }}</strong>
            </div>
            <template v-else>
              <div class="tx-asset-values">
                <span>{{ overview.outputSoFarDisplay || '-' }}</span>
                <strong>{{ overview.outputSoFarUsdDisplay || '' }}</strong>
              </div>
              <div class="tx-mimir-gloss">
                ~{{ overview.outputProjectedDisplay }} ({{
                  overview.outputProjectedUsdDisplay
                }}) projected total
              </div>
            </template>
          </div>
        </div>

        <div class="tx-delivery">
          <div class="tx-delivery-caption">
            <span class="tx-asset-label">Stream Progress</span>
            <span class="mono">
              {{ overview.count }} / {{ overview.quantity }} sub-swaps
              <template v-if="isOutbound">· Complete</template>
              <template v-else-if="overview.remainingDisplay">
                · ~{{ overview.remainingDisplay }} left
              </template>
            </span>
          </div>
          <progress-bar
            :width="overview.fillPercent"
            height="8px"
            color="linear-gradient(90deg, var(--green), var(--active-primary-color))"
          />
        </div>

        <div class="tx-metric-strip">
          <div class="tx-metric-item">
            <div class="tx-asset-label">Interval</div>
            <div class="tx-metric-value mono">
              {{ overview.intervalDisplay || '-' }}
            </div>
          </div>
          <div class="tx-metric-item">
            <div class="tx-asset-label">Avg. price impact</div>
            <div class="tx-metric-value tx-value-negative mono">
              {{ overview.priceImpactDisplay || '-' }}
            </div>
          </div>
        </div>
      </section>

      <section class="tx-info-card">
        <div class="tx-section-title">Details</div>
        <div class="tx-detail-rows">
          <DetailRow label="Product">
            <ProductBadge label="THORChain" tone="green" />
          </DetailRow>
          <DetailRow label="Action" value="Streaming Swap" />
          <DetailRow label="Status">
            <span class="mini-bubble yellow">{{ overview.status.label }}</span>
          </DetailRow>
          <DetailRow label="Quantity" :value="`${overview.quantity} Swaps`" />
          <DetailRow
            label="Stream"
            :value="`${overview.count} / ${overview.quantity}`"
          />
          <DetailRow
            v-if="overview.rateDisplay"
            label="Exchange rate"
            :value="overview.rateDisplay"
          />
          <DetailRow label="Time">
            {{ overview.timeDisplay }}
            <span v-if="overview.timeAgoDisplay" class="tx-detail-muted">
              {{ overview.timeAgoDisplay }}
            </span>
          </DetailRow>
          <DetailRow label="Block" :value="overview.heightDisplay" />
          <DetailRow label="From" :value="overview.from" value-type="address" />
          <DetailRow
            v-if="overview.destination"
            label="Destination"
            :value="overview.destination"
            value-type="address"
          />
        </div>
      </section>

      <LifecycleTimeline :events="lifecycleEvents" />
    </template>

    <template #rail>
      <TxHashCard :hash="overview.hash" :actions="[]" />

      <section v-if="overview.feeRows.length" class="tx-info-card">
        <div class="tx-section-title">Fee Breakdown (est.)</div>
        <div class="tx-fee-list">
          <div
            v-for="fee in overview.feeRows"
            :key="fee.label"
            class="tx-fee-row"
          >
            <div
              :class="['tx-fee-label', { 'tx-fee-label--total': fee.isTotal }]"
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

      <TechnicalDetailsCard :memo="overview.memo" :raw-fields="[]" />
    </template>
  </TxHeroShell>
</template>

<script>
import TxHeroShell from '~/pages/tx/components/TxHeroShell.vue'
import TxHashCard from '~/pages/tx/components/TxHashCard.vue'
import TechnicalDetailsCard from '~/pages/tx/components/TechnicalDetailsCard.vue'
import LifecycleTimeline from '~/pages/tx/components/LifecycleTimeline.vue'
import DetailRow from '~/components/transactions/DetailRow.vue'
import AssetIcon from '~/components/AssetIcon.vue'
import ProductBadge from '~/components/ProductBadge.vue'
import ProgressBar from '~/components/ProgressBar.vue'
import ArrowIcon from '~/assets/images/arrow.svg?inline'

// Renders the `streamingOverview` computed from pages/tx/_txhash.vue
// (screen 1d) — a swap still actively streaming, confirmed against a real
// in-progress tx (ETH.ETH -> TRON.USDT, 13/85 sub-swaps done, no outbound
// emitted yet). Once a stream finishes it's just a normal swap, already
// served by the shipped swapOverview hero — this only ever renders the
// in-progress window. Static fields come from the same cards/stacks every
// other *Overview reads; count/quantity/fill/remaining/swapped-so-far come
// from a dedicated live fetch (fetchStreamingProgress, watched in
// _txhash.vue) folded into the overview itself, reusing the remaining-
// blocks formula already proven in the always-mounted streamingSwap.vue.
// Built from the shipped swapOverview hero's own classes/components
// (two-panel .tx-swap-head + arrow, .tx-metric-strip, Fee Breakdown) so
// it's visually identical to the already-completed swap page; the stream
// progress bar reuses the existing ProgressBar.vue (its color prop already
// accepts a raw gradient string) rather than a new component.
export default {
  components: {
    TxHeroShell,
    TxHashCard,
    TechnicalDetailsCard,
    LifecycleTimeline,
    DetailRow,
    AssetIcon,
    ProductBadge,
    ProgressBar,
    ArrowIcon,
  },
  props: {
    overview: {
      type: Object,
      required: true,
    },
  },
  computed: {
    chips() {
      return [
        { label: '⇄ Swap' },
        {
          label: `Streaming ${this.overview.count}/${this.overview.quantity}`,
          tone: 'yellow',
          dot: true,
        },
      ]
    },
    inputTicker() {
      return this.showTicker(this.overview.asset)
    },
    outputTicker() {
      return this.showTicker(this.overview.outputAsset)
    },
    // Full chain.ticker notation (e.g. "ETH.USDC") for the H1, matching
    // overview.amountDisplay's own notation on the input side — outputTicker
    // (bare "USDC") is for the panel's primary line only, a different,
    // deliberately terser context.
    outputAssetNotation() {
      return this.showAsset(this.overview.outputAsset)
    },
    lifecycleEvents() {
      const { overview } = this
      const events = [
        {
          icon: 'ArrowIcon',
          iconRotate: 180,
          title: `${this.inputTicker} received by THORChain`,
          body: `${overview.amountDisplay} entered the swap flow from ${this.addressFormatV2(overview.from)}.`,
          meta: overview.timeDisplay,
        },
        {
          icon: 'ExchangeIcon',
          title: 'Streaming in progress',
          body: `${overview.count} of ${overview.quantity} sub-swaps executed${overview.intervalDisplay ? `, one every ${overview.intervalDisplay}` : ''}.`,
        },
      ]
      if (overview.outputSoFarDisplay) {
        events.push({
          icon: 'ArrowIcon',
          iconRotate: 0,
          title: 'Output accumulating',
          body: `${overview.outputSoFarDisplay} received so far${overview.destination ? ` at ${this.addressFormatV2(overview.destination)}` : ''}.`,
        })
      }
      return events
    },
  },
}
</script>
