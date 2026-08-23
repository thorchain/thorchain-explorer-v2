<template>
  <TxHeroShell :eyebrow="eyebrow" :chips="chips">
    <template #title>
      <template v-if="overview.attemptedLabel">
        {{ overview.attemptedLabel }} attempt failed —
        <span class="tx-value-negative">no outbound was created</span>
      </template>
      <template v-else>
        Transaction failed —
        <span class="tx-value-negative">no outbound was created</span>
      </template>
    </template>

    <template #main>
      <section class="tx-explainer">
        <div class="tx-explainer-header">
          <WarningIcon class="tx-explainer-icon" />
          <span>{{ overview.reasonTitle || 'Why this failed' }}</span>
        </div>
        <div class="tx-explainer-body">{{ overview.reason }}</div>
        <div
          v-if="overview.reasonTitle && overview.reasonRaw"
          class="tx-explainer-code"
        >
          {{ overview.reasonRaw }}
        </div>
      </section>

      <section class="tx-swap-card">
        <div class="tx-swap-head">
          <div class="tx-asset-panel">
            <div class="tx-asset-label">Sent</div>
            <div class="tx-asset-primary">
              <AssetIcon :asset="overview.asset" :height="'2.25rem'" />
              <span>{{ overview.amountDisplay || '-' }}</span>
            </div>
            <div class="tx-asset-badge">THORChain network</div>
            <div v-if="overview.asset" class="tx-asset-values">
              <AssetAmountValue
                :amount="overview.amountRaw"
                :asset="assetString"
              />
              <strong>{{ overview.amountUsdDisplay }}</strong>
            </div>
          </div>

          <div class="tx-swap-arrow tx-swap-arrow--danger">
            <CrossIcon class="tx-swap-arrow-icon tx-swap-arrow-icon--danger" />
          </div>

          <div class="tx-asset-panel tx-asset-panel--danger-dashed">
            <div class="tx-asset-label">Outcome</div>
            <div class="tx-asset-primary">
              <span class="tx-value-negative">Not applied</span>
            </div>
            <div class="tx-asset-badge">No outbound was created</div>
          </div>
        </div>
      </section>

      <section class="tx-info-card">
        <div class="tx-section-title">Details</div>
        <div class="tx-detail-rows">
          <DetailRow label="Product">
            <ProductBadge label="THORChain" tone="green" />
          </DetailRow>
          <DetailRow
            label="Attempted"
            :value="overview.attemptedLabel || 'Unknown'"
          />
          <DetailRow label="Status">
            <span class="mini-bubble danger">{{ overview.status.label }}</span>
          </DetailRow>
          <DetailRow label="Reason">
            <span class="tx-value-negative">
              {{ overview.reasonRaw || overview.reason }}
            </span>
          </DetailRow>
          <DetailRow v-if="overview.code" label="Code" :value="overview.code" />
          <DetailRow
            v-if="overview.nodeAddress"
            label="Node Address"
            :value="overview.nodeAddress"
            value-type="address"
          />
          <DetailRow
            v-if="overview.providerAddress"
            label="Bond Provider"
            :value="overview.providerAddress"
            value-type="address"
          />
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
      <TxHashCard :hash="overview.hash" :actions="hashActions" />

      <section class="tx-info-card">
        <div class="tx-section-title">Attempt summary</div>
        <div class="tx-detail-rows">
          <DetailRow label="Sent">
            {{ overview.amountDisplay || '-' }}
          </DetailRow>
          <DetailRow label="Applied">
            <span class="tx-value-negative">No</span>
          </DetailRow>
          <DetailRow label="Outbound created">
            <span class="tx-value-negative">No</span>
          </DetailRow>
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
import AssetAmountValue from '~/components/transactions/AssetAmountValue.vue'
import AssetIcon from '~/components/AssetIcon.vue'
import ProductBadge from '~/components/ProductBadge.vue'
import WarningIcon from '~/assets/images/warning.svg?inline'
import CrossIcon from '~/assets/images/cross.svg?inline'
import { getLegExplorerUrl, assetToString } from '~/utils'

// Renders the `failedOverview` computed from pages/tx/_txhash.vue — any
// message THORChain accepted on-chain but rejected during execution
// (Midgard `type: 'failed'`, `metadata.failed`), most commonly a bond
// attempt with insufficient funds. Deliberately a separate hero from
// RefundHero rather than a shared/branched one: a refund always has an
// outbound leg (the returned funds) with its own status/hash to show, while
// a failed message has none at all — out is always empty, nothing was
// scheduled, and implying an outbound section (even an empty one) would
// misrepresent what happened. The "attempted" type/label comes from
// re-parsing metadata.failed.memo, which is the only place that survives
// once the action itself is neither a recognizable send/swap/bond etc. to
// Midgard's own classifier.
export default {
  components: {
    TxHeroShell,
    TxHashCard,
    TechnicalDetailsCard,
    LifecycleTimeline,
    DetailRow,
    AssetAmountValue,
    AssetIcon,
    ProductBadge,
    WarningIcon,
    CrossIcon,
  },
  props: {
    overview: {
      type: Object,
      required: true,
    },
  },
  computed: {
    // AssetAmountValue declares `asset` as a String prop (unlike AssetIcon,
    // which accepts either) — overview.asset is the parsed object form used
    // everywhere else in this component, so it needs converting once here.
    assetString() {
      return this.overview.asset ? assetToString(this.overview.asset) : null
    },
    eyebrow() {
      return this.overview.attemptedLabel
        ? `${this.overview.attemptedLabel} Attempt · THORChain`
        : 'Failed Attempt · THORChain'
    },
    chips() {
      return [{ label: 'Failed', tone: 'red', dot: true }]
    },
    hashActions() {
      if (!this.overview.asset || !this.overview.inboundHash) return []
      const url = getLegExplorerUrl(
        this.overview.asset,
        this.overview.inboundHash
      )
      return url ? [{ label: 'Input Tx', to: url, external: true }] : []
    },
    technicalRawFields() {
      const fields = []
      if (this.overview.reasonTitle && this.overview.reasonRaw) {
        fields.push({ label: 'Raw reason', value: this.overview.reasonRaw })
      }
      if (this.overview.code) {
        fields.push({ label: 'Code', value: this.overview.code })
      }
      return fields
    },
    lifecycleEvents() {
      const attempted = this.overview.attemptedLabel
        ? this.overview.attemptedLabel.toLowerCase()
        : 'transaction'
      return [
        {
          icon: 'ArrowIcon',
          iconRotate: 180,
          title: 'Inbound received',
          body: `${this.overview.amountDisplay || 'The deposit'} arrived and a ${attempted} was attempted.`,
          meta: this.overview.timeDisplay,
        },
        {
          icon: 'BlockIcon',
          title: `Included in block ${this.overview.heightDisplay}`,
          body: 'Inclusion is not success — the message still had to execute.',
        },
        {
          icon: 'CrossIcon',
          tone: 'danger',
          title: 'Rejected during execution',
          body: this.overview.reason,
          meta: this.overview.timeDisplay,
        },
      ]
    },
  },
}
</script>
