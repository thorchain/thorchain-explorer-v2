<template>
  <TxHeroShell :eyebrow="`${overview.title} · THORChain`" :chips="chips">
    <template #title>
      <template v-if="isSwap">
        Swapped <span class="mono">{{ overview.amountDisplay }}</span>
        <template v-if="overview.totals && overview.totals.allDelivered">
          for <span class="mono">{{ overview.totalOutboundDisplay }}</span>
        </template>
        <template v-else>
          —
          <span class="tx-value-warning">
            {{ overview.outstandingShortDisplay }} still to be delivered
          </span>
        </template>
      </template>
      <template v-else>
        Withdrew <span class="mono">{{ overview.amountDisplay }}</span>
        <template v-if="!overview.totals || !overview.totals.allDelivered">
          —
          <span class="tx-value-warning">
            {{ overview.outstandingShortDisplay }} still to be delivered
          </span>
        </template>
        <template v-else>
          — <span class="tx-value-positive">fully delivered</span>
        </template>
      </template>
    </template>

    <template #main>
      <section class="tx-swap-card">
        <div class="tx-swap-head">
          <div class="tx-asset-panel">
            <div class="tx-asset-label">{{ withdrawnLabel }}</div>
            <div class="tx-asset-primary">
              <AssetIcon :asset="overview.asset" :height="'2.25rem'" />
              <span>{{ overview.assetTicker }}</span>
            </div>
            <div class="tx-asset-badge">{{ overview.assetTypeBadge }}</div>
            <div class="tx-asset-values">
              <span>{{ overview.amountDisplay }}</span>
              <strong>{{ overview.amountUsdDisplay }}</strong>
            </div>
          </div>

          <div class="tx-swap-arrow">
            <ArrowIcon class="tx-swap-arrow-icon" />
          </div>

          <div class="tx-asset-panel tx-asset-panel--accent">
            <div class="tx-asset-panel-head">
              <div class="tx-asset-label">{{ receivedLabel }}</div>
              <span v-if="outboundsChipLabel" class="tx-chip tx-chip--neutral">
                {{ outboundsChipLabel }}
              </span>
            </div>
            <div class="tx-asset-primary">
              <AssetIcon
                :asset="overview.totalsAsset || overview.asset"
                :height="'2.25rem'"
              />
              <span>{{ destinationAssetTicker }}</span>
            </div>
            <div class="tx-asset-badge">{{ overview.destinationBadge }}</div>
            <div class="tx-asset-values">
              <span>{{ overview.totalOutboundDisplay }}</span>
              <strong>{{ overview.totalOutboundUsdDisplay }}</strong>
            </div>
          </div>
        </div>

        <DeliveryBar
          v-if="overview.totals"
          :percent="overview.totals.percent"
          :delivered-display="overview.deliveredDisplay"
          :total-display="
            isSwap ? overview.totalOutboundDisplay : overview.amountDisplay
          "
          :overdue="hasOverdueLeg"
        />

        <div class="tx-metric-strip">
          <div class="tx-metric-item">
            <div class="tx-asset-label">Outbounds</div>
            <div class="tx-metric-value">{{ outboundsSummary }}</div>
          </div>
          <template v-if="isSwap">
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
          </template>
          <template v-else>
            <div class="tx-metric-item">
              <div class="tx-asset-label">Outstanding</div>
              <div class="tx-metric-value tx-value-warning mono">
                {{ overview.outstandingDisplay || '-' }}
              </div>
            </div>
            <div class="tx-metric-item">
              <div class="tx-asset-label">Past due</div>
              <div
                :class="[
                  'tx-metric-value',
                  'mono',
                  overview.pastDueDisplay ? 'tx-value-negative' : null,
                ]"
              >
                {{ overview.pastDueDisplay || '-' }}
              </div>
            </div>
          </template>
        </div>
      </section>

      <OutboundsTable
        :legs="overview.legs"
        :destination="overview.destination"
        :total="
          overview.totals
            ? {
                display: overview.totalOutboundDisplay,
                deliveredDisplay: overview.deliveredDisplay,
                outstandingDisplay: overview.outstandingDisplay,
              }
            : null
        "
      />

      <section class="tx-info-card">
        <div class="tx-section-title">Details</div>
        <div class="tx-detail-rows">
          <DetailRow label="Product">
            <ProductBadge label="THORChain" tone="green" />
          </DetailRow>
          <DetailRow label="Action" :value="overview.title" />
          <DetailRow label="Status">
            <span :class="['mini-bubble', statusToneClass]">
              {{ overview.status.label }}
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
        <div class="tx-section-title">Fee Breakdown</div>
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

      <section v-if="hasOverdueLeg" class="tx-explainer tx-explainer--warning">
        <div class="tx-explainer-header">
          <WarningIcon class="tx-explainer-icon" />
          <span>Why {{ overdueLegLabel }} waiting?</span>
        </div>
        <div class="tx-explainer-body">
          The outbound was scheduled but never signed by the vault. It stays
          queued and retries each churn — no further action is needed from the
          sender.
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
import OutboundsTable from '~/pages/tx/components/OutboundsTable.vue'
import DeliveryBar from '~/pages/tx/components/DeliveryBar.vue'
import DetailRow from '~/components/transactions/DetailRow.vue'
import AssetIcon from '~/components/AssetIcon.vue'
import ProductBadge from '~/components/ProductBadge.vue'
import ArrowIcon from '~/assets/images/arrow.svg?inline'
import WarningIcon from '~/assets/images/warning.svg?inline'

// Renders the `multiOutboundOverview` computed from pages/tx/_txhash.vue
// (screens 2a/2b) — a transaction whose output split across several
// outbound txs (confirmed against a real trade-asset withdrawal where one
// of three legs hadn't landed yet, ~20 days past its scheduled height).
// THORNode carries no per-leg scheduled height (see
// resolveOutboundLegStatus's doc comment), so "Overdue"/"past due" here is
// a single tx-wide signal applied to every still-pending leg, not a
// genuinely per-leg one — the plan's documented v1 fallback. Built from the
// shipped swapOverview hero's own classes/components (two-panel
// .tx-swap-head + arrow, .tx-metric-strip, .tx-asset-values) so it's
// visually identical to the already-completed swap page; DeliveryBar/
// OutboundsTable/the "why is it waiting" explainer are additive since a
// single-outbound swap has no equivalent concept for any of them.
export default {
  components: {
    TxHeroShell,
    TxHashCard,
    TechnicalDetailsCard,
    LifecycleTimeline,
    OutboundsTable,
    DeliveryBar,
    DetailRow,
    AssetIcon,
    ProductBadge,
    ArrowIcon,
    WarningIcon,
  },
  props: {
    overview: {
      type: Object,
      required: true,
    },
  },
  computed: {
    isSwap() {
      return this.overview.multiOutboundKind === 'swap'
    },
    withdrawnLabel() {
      if (this.isSwap) return 'You sent'
      return this.overview.assetTypeBadge === 'Secure network'
        ? 'Withdrawn from secure account'
        : 'Withdrawn from trade account'
    },
    receivedLabel() {
      return this.isSwap ? 'You received' : 'Sent to wallet'
    },
    assetTicker() {
      return this.showTicker(this.overview.asset)
    },
    destinationAssetTicker() {
      return this.showTicker(this.overview.totalsAsset || this.overview.asset)
    },
    chips() {
      const chips = []
      if (this.overview.assetTypeBadge === 'Trade network') {
        chips.push({ label: 'Trade account' })
      } else if (this.overview.assetTypeBadge === 'Secure network') {
        chips.push({ label: 'Secure account' })
      }
      if (this.overview.overdueCount > 0) {
        chips.push({
          label: `${this.overview.overdueCount} outbound${this.overview.overdueCount > 1 ? 's' : ''} overdue`,
          tone: 'yellow',
          dot: true,
        })
      }
      return chips
    },
    outboundsChipLabel() {
      if (!this.overview.legs.length) return null
      const suffix =
        this.overview.overdueCount > 0
          ? ` · ${this.overview.overdueCount} overdue`
          : ''
      return `${this.overview.legs.length} outbounds${suffix}`
    },
    outboundsSummary() {
      const { deliveredCount, overdueCount, legs } = this.overview
      const parts = [`${deliveredCount} delivered`]
      if (overdueCount > 0) parts.push(`${overdueCount} overdue`)
      const scheduledCount = legs.length - deliveredCount - overdueCount
      if (scheduledCount > 0) parts.push(`${scheduledCount} scheduled`)
      return parts.join(' · ')
    },
    hasOverdueLeg() {
      return this.overview.overdueCount > 0
    },
    overdueLegLabel() {
      const first = this.overview.legs.find((l) => l.status === 'overdue')
      return first ? `is leg ${first.index + 1}` : 'are the remaining outbounds'
    },
    statusToneClass() {
      const tone = this.overview.status?.tone
      if (tone === 'yellow') return 'yellow'
      if (tone === 'orange') return 'orange'
      if (tone === 'red') return 'danger'
      return null
    },
    lifecycleEvents() {
      const { overview } = this
      const events = this.isSwap
        ? [
            {
              icon: 'ArrowIcon',
              iconRotate: 180,
              title: 'Swap observed by THORChain',
              body: `${overview.amountDisplay} arrived from ${this.addressFormatV2(overview.from)} and was swapped.`,
              meta: overview.timeDisplay,
            },
            {
              icon: 'ExchangeIcon',
              title: 'Output split across outbounds',
              body: `The swap output was split into ${overview.legs.length} outbounds${overview.destination ? `, all to ${this.addressFormatV2(overview.destination)}` : ''}.`,
            },
          ]
        : [
            {
              icon: 'ArrowIcon',
              iconRotate: 180,
              title: 'Withdraw request observed',
              body: `Sent from ${this.addressFormatV2(overview.from)} with a ${overview.title} memo.`,
              meta: overview.timeDisplay,
            },
            {
              icon: 'ExchangeIcon',
              title: `${overview.title === 'Secure Withdraw' ? 'Secure' : 'Trade'} balance debited`,
              body: `${overview.amountDisplay} left the account and was split into ${overview.legs.length} outbounds.`,
            },
          ]
      if (overview.deliveredCount > 0) {
        events.push({
          icon: 'ArrowIcon',
          iconRotate: 0,
          title:
            overview.deliveredCount === overview.legs.length
              ? 'All outbounds delivered'
              : `${overview.deliveredCount} of ${overview.legs.length} outbounds delivered`,
          body: overview.destination
            ? `${overview.deliveredDisplay} reached ${this.addressFormatV2(overview.destination)}.`
            : `${overview.deliveredDisplay} has landed so far.`,
        })
      }
      if (this.hasOverdueLeg) {
        events.push({
          icon: 'WarningIcon',
          tone: 'warning',
          title: `${overview.overdueCount > 1 ? 'Outbounds' : 'Outbound'} overdue`,
          body: `Not yet signed by the vault — ${overview.pastDueDisplay || 'past its scheduled window'}.`,
        })
      }
      return events
    },
  },
}
</script>
