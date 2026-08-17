<template>
  <TxHeroShell eyebrow="Refund · THORChain" :chips="chips">
    <template #title>
      Swap refunded —
      <span class="mono">{{ overview.refundedAmountDisplay }}</span>
      sent back
    </template>

    <template #main>
      <section class="tx-swap-card">
        <div class="tx-swap-head">
          <div class="tx-asset-panel">
            <div class="tx-asset-label">Sent</div>
            <div class="tx-asset-primary">
              <AssetIcon :asset="overview.sentAsset" :height="'2.25rem'" />
              <span>{{ overview.sentAmountDisplay }}</span>
            </div>
            <div class="tx-asset-badge">THORChain network</div>
            <div class="tx-asset-values">
              <span>{{ overview.sentAmountDisplay }}</span>
              <strong>{{ overview.sentAmountUsdDisplay }}</strong>
            </div>
          </div>

          <div class="tx-swap-arrow tx-swap-arrow--warning">
            <RefundIcon
              class="tx-swap-arrow-icon tx-swap-arrow-icon--warning"
            />
          </div>

          <div class="tx-asset-panel tx-asset-panel--accent">
            <div class="tx-asset-label">Refunded</div>
            <div class="tx-asset-primary">
              <AssetIcon :asset="overview.refundedAsset" :height="'2.25rem'" />
              <span>{{ overview.refundedAmountDisplay }}</span>
            </div>
            <div class="tx-asset-badge">Back to sender</div>
            <div class="tx-asset-values">
              <span class="tx-value-warning">
                {{ overview.refundedAmountDisplay }}
              </span>
              <strong>{{ overview.refundedAmountUsdDisplay }}</strong>
            </div>
          </div>
        </div>

        <div class="tx-explainer tx-explainer--warning">
          <div class="tx-explainer-header">
            <RefundIcon class="tx-explainer-icon" />
            <span>{{ overview.reasonTitle || 'Why this was refunded' }}</span>
          </div>
          <div class="tx-explainer-body">{{ overview.reason }}</div>
          <div
            v-if="overview.reasonTitle && overview.reasonRaw"
            class="tx-explainer-code"
          >
            {{ overview.reasonRaw }}
          </div>
        </div>
      </section>

      <section class="tx-info-card">
        <div class="tx-section-title">Details</div>
        <div class="tx-detail-rows">
          <DetailRow label="Product">
            <ProductBadge label="THORChain" tone="green" />
          </DetailRow>
          <DetailRow label="Action" value="Refund" />
          <DetailRow label="Status">
            <span class="mini-bubble yellow">{{ overview.status.label }}</span>
          </DetailRow>
          <DetailRow label="Reason">
            <span class="tx-value-warning">
              {{ overview.reasonRaw || overview.reason }}
            </span>
          </DetailRow>
          <DetailRow label="Time">
            {{ overview.timeDisplay }}
            <span v-if="overview.timeAgoDisplay" class="tx-detail-muted">
              {{ overview.timeAgoDisplay }}
            </span>
          </DetailRow>
          <DetailRow label="Block" :value="overview.heightDisplay" />
          <DetailRow label="From" :value="overview.from" value-type="address" />
        </div>
      </section>

      <LifecycleTimeline :events="lifecycleEvents" />
    </template>

    <template #rail>
      <TxHashCard :hash="overview.hash" :actions="[]" />

      <section class="tx-info-card">
        <div class="tx-section-title">Refund summary</div>
        <div class="tx-detail-rows">
          <DetailRow label="Attempted with">
            {{ overview.sentAmountDisplay }}
          </DetailRow>
          <DetailRow label="Refunded as">
            <span class="tx-value-warning">
              {{ overview.refundedAmountDisplay }}
            </span>
          </DetailRow>
          <DetailRow v-if="overview.networkFee" label="Network fee">
            {{ overview.networkFee }}
          </DetailRow>
          <DetailRow
            v-if="overview.outboundHash"
            label="Refund tx"
            :value="overview.outboundHash"
            value-type="hash"
          />
        </div>
      </section>

      <TechnicalDetailsCard
        :memo="overview.memo"
        :raw-fields="technicalRawFields"
      />
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
import RefundIcon from '~/assets/images/refund.svg?inline'

// Renders the `refundOverview` computed from pages/tx/_txhash.vue (screen
// 1e). This is createSwapState's "onlyRefund" case — a swap THORChain
// accepted and then sent straight back (slip tolerance, invalid
// destination, etc.), which swapOverview already bails out of via
// middle.fail. Built from the shipped swapOverview hero's own
// classes/components so it's visually identical to the already-completed
// swap page — see the plan's §0 correction. Amber (--warning-color) rather
// than red/green throughout: a refund is neither a failure nor a
// completed swap.
export default {
  components: {
    TxHeroShell,
    TxHashCard,
    TechnicalDetailsCard,
    LifecycleTimeline,
    DetailRow,
    AssetIcon,
    ProductBadge,
    RefundIcon,
  },
  props: {
    overview: {
      type: Object,
      required: true,
    },
  },
  computed: {
    chips() {
      return [{ label: 'Refund', tone: 'yellow', dot: true }]
    },
    // Only surface a raw-text row when parsing actually changed something —
    // i.e. overview.reason is now the human-readable version, not the raw
    // string itself. When nothing was recognized, overview.reason already
    // IS the raw text (shown in the explainer/Details rows above), so
    // there'd be nothing new to add here.
    technicalRawFields() {
      if (this.overview.reasonTitle && this.overview.reasonRaw) {
        return [{ label: 'Raw reason', value: this.overview.reasonRaw }]
      }
      return []
    },
    lifecycleEvents() {
      return [
        {
          icon: 'ArrowIcon',
          iconRotate: 180,
          title: 'Inbound received',
          body: `${this.overview.sentAmountDisplay} arrived and the swap was attempted.`,
          meta: this.overview.timeDisplay,
        },
        {
          icon: RefundIcon,
          tone: 'warning',
          title: 'Refund triggered',
          body: this.overview.reason,
        },
        {
          icon: 'ArrowIcon',
          iconRotate: 0,
          tone: 'warning',
          title: 'Refund sent back',
          body: `${this.overview.refundedAmountDisplay} returned to ${this.addressFormatV2(this.overview.from)}.`,
        },
      ]
    },
  },
}
</script>
