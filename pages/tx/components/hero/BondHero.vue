<template>
  <TxHeroShell
    eyebrow="Node Bond · THORChain"
    :chips="[{ label: overview.isWhitelist ? 'Bond Whitelist' : 'Bond' }]"
  >
    <template #title>
      Bonded <span class="mono">{{ overview.amountDisplay }}</span> to node
      <span class="mono">{{ addressFormatV2(overview.nodeAddress) }}</span>
    </template>

    <template #main>
      <section class="tx-swap-card">
        <div class="tx-swap-head" :style="panelVars">
          <div class="tx-asset-panel">
            <div class="tx-asset-label">Bond provider</div>
            <div class="tx-asset-primary tx-asset-primary--identity">
              <AssetIcon asset="THOR.RUNE" :height="'2.25rem'" />
              <span>{{ addressFormatV2(overview.providerAddress) }}</span>
            </div>
            <div class="tx-asset-badge">THORChain network</div>
            <div class="tx-asset-values">
              <span>{{ overview.amountDisplay }}</span>
              <strong>{{ overview.amountUsdDisplay }}</strong>
            </div>
          </div>

          <div class="tx-swap-arrow">
            <ArrowIcon class="tx-swap-arrow-icon" />
          </div>

          <div class="tx-asset-panel tx-asset-panel--accent">
            <div class="tx-asset-label">Node</div>
            <div class="tx-asset-primary tx-asset-primary--identity">
              <div class="tx-node-avatar">
                <NodeIcon />
              </div>
              <span>{{ addressFormatV2(overview.nodeAddress) }}</span>
            </div>
            <div class="tx-panel-chips">
              <span
                v-if="nodeStatus"
                :class="[
                  'tx-chip',
                  nodeStatus === 'Active'
                    ? 'tx-chip--active'
                    : 'tx-chip--neutral',
                ]"
              >
                {{ nodeStatus }}
              </span>
              <span
                v-if="providerCount != null"
                class="tx-chip tx-chip--neutral"
              >
                {{ providerCount }} providers
              </span>
            </div>
          </div>
        </div>

        <div class="tx-metric-strip">
          <div class="tx-metric-item">
            <div class="tx-asset-label">Bond before</div>
            <div class="tx-metric-value mono">{{ bondBeforeDisplay }}</div>
          </div>
          <div class="tx-metric-item">
            <div class="tx-asset-label">Bond after</div>
            <div class="tx-metric-value tx-value-positive mono">
              {{ bondAfterDisplay }}
            </div>
          </div>
          <div class="tx-metric-item">
            <div class="tx-asset-label">Provider share</div>
            <div class="tx-metric-value mono">{{ providerShareDisplay }}</div>
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
            label="Action"
            :value="overview.isWhitelist ? 'Bond Whitelist' : 'Bond'"
          />
          <DetailRow label="Status">
            <span class="mini-bubble">{{ overview.status.label }}</span>
          </DetailRow>
          <DetailRow label="Time">
            {{ overview.timeDisplay }}
            <span v-if="overview.timeAgoDisplay" class="tx-detail-muted">
              {{ overview.timeAgoDisplay }}
            </span>
          </DetailRow>
          <DetailRow label="Block" :value="overview.heightDisplay" />
          <DetailRow
            label="Node address"
            :value="overview.nodeAddress"
            value-type="address"
          />
          <DetailRow
            label="Bond provider"
            :value="overview.providerAddress"
            value-type="address"
          />
        </div>
      </section>

      <LifecycleTimeline :events="lifecycleEvents" />
    </template>

    <template #rail>
      <TxHashCard :hash="overview.hash" :actions="hashActions" />

      <section class="tx-info-card">
        <div class="tx-section-title">Node snapshot</div>
        <div class="tx-detail-rows">
          <DetailRow label="Status" :value="nodeStatus || '-'" />
          <DetailRow label="Total bond" :value="totalBondAbbreviated" />
          <DetailRow
            label="Providers"
            :value="providerCount != null ? String(providerCount) : '-'"
          />
          <DetailRow label="Next churn" :value="nextChurnDisplay" />
        </div>
      </section>

      <TechnicalDetailsCard :memo="overview.memo" :raw-fields="[]" />
    </template>
  </TxHeroShell>
</template>

<script>
import moment from 'moment'
import TxHeroShell from '~/pages/tx/components/TxHeroShell.vue'
import TxHashCard from '~/pages/tx/components/TxHashCard.vue'
import TechnicalDetailsCard from '~/pages/tx/components/TechnicalDetailsCard.vue'
import LifecycleTimeline from '~/pages/tx/components/LifecycleTimeline.vue'
import DetailRow from '~/components/transactions/DetailRow.vue'
import AssetIcon from '~/components/AssetIcon.vue'
import ProductBadge from '~/components/ProductBadge.vue'
import ArrowIcon from '~/assets/images/arrow.svg?inline'
import NodeIcon from '~/assets/images/node.svg?inline'

// Renders the `bondOverview` computed from pages/tx/_txhash.vue (screen 1c).
// createBondState only carries the tx's own delta (amount/provider/node) —
// the node's current status/total-bond/provider-count/next-churn come from
// a live fetch the page kicks off (see the bondOverview watcher +
// fetchBondNodeSnapshot), passed in here as nodeSnapshot/networkInfo/
// currentHeight. Bond before/after and provider share are derived from that
// live total, never stored, per the redesign's state-management rule. Built
// from the shipped swapOverview hero's own classes/components so it's
// visually identical to the already-completed swap page — see §0.
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
    NodeIcon,
  },
  props: {
    overview: {
      type: Object,
      required: true,
    },
    nodeSnapshot: {
      type: Object,
      default: null,
    },
    networkInfo: {
      type: Object,
      default: null,
    },
    currentHeight: {
      type: Number,
      default: null,
    },
  },
  computed: {
    // Swap hero picks --left-border/--right-border per-asset (panelVars);
    // a bond has a fixed roles instead of assets — provider is amber
    // (pending/at-risk capital), node is green (where it lands).
    panelVars() {
      return {
        '--left-border': 'var(--warning-color)',
        '--right-border': 'var(--green)',
      }
    },
    hashActions() {
      return [{ label: 'Node page', to: `/node/${this.overview.nodeAddress}` }]
    },
    nodeStatus() {
      return this.nodeSnapshot?.status || null
    },
    providerCount() {
      const providers = this.nodeSnapshot?.bond_providers?.providers
      return Array.isArray(providers) ? providers.length : null
    },
    totalBondRaw() {
      const total = this.nodeSnapshot?.total_bond
      return total != null ? Number(total) : null
    },
    bondAfterDisplay() {
      return this.totalBondRaw != null
        ? this.formatRune(this.totalBondRaw)
        : '-'
    },
    bondBeforeDisplay() {
      if (this.totalBondRaw == null) return '-'
      const before = Math.max(this.totalBondRaw - this.overview.amountRaw, 0)
      return this.formatRune(before)
    },
    totalBondAbbreviated() {
      if (this.totalBondRaw == null) return '-'
      return `${this.$options.filters.number(this.totalBondRaw / 1e8, '0.00a')} RUNE`
    },
    providerShareDisplay() {
      if (this.totalBondRaw == null || this.totalBondRaw === 0) return '-'
      const providers = this.nodeSnapshot?.bond_providers?.providers || []
      const match = providers.find(
        (p) => p.bond_address === this.overview.providerAddress
      )
      const providerBond = match ? Number(match.bond) : this.overview.amountRaw
      return `${((providerBond / this.totalBondRaw) * 100).toFixed(1)}%`
    },
    nextChurnDisplay() {
      const nextHeight = this.networkInfo?.nextChurnHeight
      if (!nextHeight || !this.currentHeight) return '-'
      const blocksRemaining = Number(nextHeight) - this.currentHeight
      if (blocksRemaining <= 0) return 'Any block now'
      return `~${moment.duration(blocksRemaining * this.blockSeconds('THOR'), 'seconds').humanize()}`
    },
    lifecycleEvents() {
      return [
        {
          icon: 'ArrowIcon',
          iconRotate: 180,
          title: 'RUNE received by THORChain',
          body: `${this.overview.amountDisplay} arrived with a BOND memo.`,
          meta: this.overview.timeDisplay,
        },
        {
          icon: 'ExchangeIcon',
          title: 'Bond credited to provider',
          body: `Provider ${this.addressFormatV2(this.overview.providerAddress)} now holds ${this.providerShareDisplay} of node bond.`,
        },
        {
          icon: 'ArrowIcon',
          iconRotate: 0,
          title: 'Node bond updated',
          body: `Total bond ${this.bondAfterDisplay} — eligible for the next churn.`,
        },
      ]
    },
  },
  methods: {
    formatRune(amountBaseUnits) {
      return `${new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amountBaseUnits / 1e8)} RUNE`
    },
  },
}
</script>
