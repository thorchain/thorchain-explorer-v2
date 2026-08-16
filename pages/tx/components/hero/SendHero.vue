<template>
  <TxHeroShell eyebrow="Transfer · THORChain" :chips="chips">
    <template #title>
      <template v-if="overview.failed">
        Send of <span class="mono">{{ overview.amountDisplay }}</span> failed —
        <span class="tx-value-negative">no funds moved</span>
      </template>
      <template v-else>
        Sent <span class="mono">{{ overview.amountDisplay }}</span> to
        <span class="mono">{{ addressFormatV2(overview.to) }}</span>
      </template>
    </template>

    <template #main>
      <section v-if="overview.failed" class="tx-explainer">
        <div class="tx-explainer-header">
          <WarningIcon class="tx-explainer-icon" />
          <span>{{ overview.failure.title }}</span>
        </div>
        <div class="tx-explainer-body">{{ overview.failure.body }}</div>
        <div class="tx-explainer-code">{{ overview.failure.codeLine }}</div>
      </section>

      <section class="tx-swap-card">
        <div class="tx-swap-head" :style="panelVars">
          <div class="tx-asset-panel">
            <div class="tx-asset-label">Sender</div>
            <div class="tx-asset-primary tx-asset-primary--identity">
              <AssetIcon asset="THOR.RUNE" :height="'2.25rem'" />
              <span>{{ addressFormatV2(overview.from) }}</span>
            </div>
            <div class="tx-asset-badge">THORChain network</div>
            <div class="tx-asset-values">
              <template v-if="overview.failed">
                <span>{{ overview.zeroAmountDisplay }}</span>
                <strong class="tx-detail-muted">not debited</strong>
              </template>
              <template v-else>
                <span class="tx-value-negative">
                  -{{ overview.amountDisplay }}
                </span>
                <strong>{{ overview.amountUsdDisplay }}</strong>
              </template>
            </div>
          </div>

          <div
            :class="[
              'tx-swap-arrow',
              overview.failed ? 'tx-swap-arrow--danger' : null,
            ]"
          >
            <CrossIcon
              v-if="overview.failed"
              class="tx-swap-arrow-icon tx-swap-arrow-icon--danger"
            />
            <ArrowIcon v-else class="tx-swap-arrow-icon" />
          </div>

          <div
            :class="[
              'tx-asset-panel',
              overview.failed
                ? 'tx-asset-panel--danger-dashed'
                : 'tx-asset-panel--accent',
            ]"
          >
            <div class="tx-asset-label">
              Recipient<template v-if="overview.failed">
                · Never credited
              </template>
            </div>
            <div class="tx-asset-primary tx-asset-primary--identity">
              <AssetIcon asset="THOR.RUNE" :height="'2.25rem'" />
              <span>{{ addressFormatV2(overview.to) }}</span>
            </div>
            <div class="tx-asset-badge">THORChain network</div>
            <div class="tx-asset-values">
              <template v-if="overview.failed">
                <span class="tx-value-strike">
                  {{ overview.amountDisplay }}
                </span>
                <strong class="tx-value-negative">attempted</strong>
              </template>
              <template v-else>
                <span class="tx-value-positive">
                  +{{ overview.amountDisplay }}
                </span>
              </template>
            </div>
          </div>
        </div>

        <div class="tx-metric-strip">
          <div class="tx-metric-item">
            <div class="tx-asset-label">Asset</div>
            <div class="tx-metric-value">{{ overview.assetRaw }}</div>
          </div>
          <div class="tx-metric-item">
            <div class="tx-asset-label">
              {{ overview.failed ? 'Gas charged' : 'Network fee' }}
            </div>
            <div class="tx-metric-value mono">
              {{ overview.gasRuneOnly || '-' }}
            </div>
          </div>
          <div class="tx-metric-item">
            <div class="tx-asset-label">
              {{ overview.failed ? 'Failed after' : 'Confirmed in' }}
            </div>
            <div class="tx-metric-value">{{ overview.confirmedIn }}</div>
          </div>
        </div>
      </section>

      <section class="tx-info-card">
        <div class="tx-section-title">Details</div>
        <div class="tx-detail-rows">
          <DetailRow label="Product">
            <ProductBadge label="THORChain" tone="green" />
          </DetailRow>
          <DetailRow label="Action" value="Send" />
          <DetailRow label="Status">
            <span :class="['mini-bubble', overview.failed ? 'danger' : null]">
              {{ overview.status.label }}
            </span>
          </DetailRow>
          <DetailRow v-if="overview.failed" label="Failure reason">
            <span class="tx-value-negative">
              {{ overview.failure.title }} (code {{ overview.failure.code }})
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
          <DetailRow label="To" :value="overview.to" value-type="address" />
          <DetailRow label="Gas" :value="overview.gasDisplay" />
        </div>
      </section>

      <LifecycleTimeline :events="lifecycleEvents" />
    </template>

    <template #rail>
      <TxHashCard :hash="overview.hash" :actions="[]" />

      <section class="tx-info-card">
        <div class="tx-section-title">Value at time of tx</div>
        <div class="tx-detail-rows">
          <template v-if="overview.failed">
            <DetailRow label="Attempted amount">
              <span class="tx-value-strike">
                {{ overview.amountUsdDisplay }}
              </span>
            </DetailRow>
            <DetailRow label="Transferred" value="$0.00" />
          </template>
          <template v-else>
            <DetailRow label="Amount" :value="overview.amountUsdDisplay" />
            <DetailRow label="RUNE price" :value="overview.runePriceDisplay" />
          </template>
          <DetailRow label="Fee" :value="overview.gasUsd" />
        </div>
      </section>

      <TechnicalDetailsCard
        :memo="overview.memo"
        :raw-fields="technicalRawFields"
        :preview="technicalPreview"
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
import ArrowIcon from '~/assets/images/arrow.svg?inline'
import CrossIcon from '~/assets/images/cross.svg?inline'
import WarningIcon from '~/assets/images/warning.svg?inline'

// Renders the `sendOverview` computed from pages/tx/_txhash.vue (screen 1b —
// fully served by createNativeTx's existing output, no live data gap). Both
// the success and failed-send cases live in this one component (branched on
// overview.failed) rather than a second hero, since a failed native send is
// still fundamentally the same screen with a different outcome, not a
// different tx type. Built from the shipped swapOverview hero's own
// classes/components (.tx-swap-card/.tx-asset-panel/.tx-metric-strip/
// .tx-detail-rows, AssetIcon, ProductBadge, .mini-bubble) so it's visually
// identical to the already-completed swap page — see the plan's §0
// correction. The failure-specific pieces (.tx-explainer, danger connector/
// panel/lifecycle-dot) are additive since the swap hero has no failed-leg
// case of its own to reuse.
export default {
  components: {
    TxHeroShell,
    TxHashCard,
    TechnicalDetailsCard,
    LifecycleTimeline,
    DetailRow,
    AssetIcon,
    ProductBadge,
    ArrowIcon,
    CrossIcon,
    WarningIcon,
  },
  props: {
    overview: {
      type: Object,
      required: true,
    },
  },
  computed: {
    chips() {
      const chips = [{ label: '↗ Send' }]
      if (this.overview.failed) {
        chips.push({ label: 'Failed', tone: 'red', dot: true })
      }
      return chips
    },
    // Swap hero picks --left-border/--right-border per-asset (panelVars);
    // a send is always the same asset on both sides, so the accent is fixed
    // to green for the recipient (or dashed red when failed, handled via
    // the tx-asset-panel--danger-dashed class instead of this var).
    panelVars() {
      return this.overview.failed ? {} : { '--right-border': 'var(--green)' }
    },
    technicalPreview() {
      if (!this.overview.failed) return ''
      return `Raw log · ${this.overview.failure.codeLine}`
    },
    technicalRawFields() {
      if (!this.overview.failed || !this.overview.failureReasonRaw) return []
      return [{ label: 'Reason', value: this.overview.failureReasonRaw }]
    },
    lifecycleEvents() {
      if (this.overview.failed) {
        return [
          {
            icon: 'ArrowIcon',
            iconRotate: 180,
            title: 'Transfer broadcast',
            body: `Signed by ${this.addressFormatV2(this.overview.from)} and accepted into the mempool.`,
            meta: this.overview.timeDisplay,
          },
          {
            icon: 'BlockIcon',
            title: `Included in block ${this.overview.heightDisplay}`,
            body: 'Inclusion is not success — the transfer still had to execute.',
          },
          {
            icon: 'CrossIcon',
            tone: 'danger',
            title: 'Rejected during execution',
            body: `Balances unchanged apart from ${this.overview.gasRuneOnly} of gas. Nothing to retry automatically — the sender must resend with a lower amount.`,
            meta: this.overview.timeDisplay,
          },
        ]
      }
      return [
        {
          icon: 'ArrowIcon',
          iconRotate: 180,
          title: 'Transfer broadcast',
          body: `${this.overview.amountDisplay} left ${this.addressFormatV2(this.overview.from)}.`,
          meta: this.overview.timeDisplay,
        },
        {
          icon: 'ArrowIcon',
          iconRotate: 0,
          title: 'Credited to recipient',
          body: `Balance of ${this.addressFormatV2(this.overview.to)} increased by ${this.overview.amountDisplay}.`,
        },
      ]
    },
  },
}
</script>
