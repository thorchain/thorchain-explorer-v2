<template>
  <TxHeroShell eyebrow="Mimir Vote · THORChain" :chips="chips">
    <template #title>
      Node voted <span class="mono">{{ overview.key }}</span> =
      <span class="mono tx-value-positive">{{ overview.value }}</span>
    </template>

    <template #main>
      <section class="tx-swap-card">
        <div class="tx-swap-head" :style="panelVars">
          <div class="tx-asset-panel">
            <div class="tx-asset-label">Voter</div>
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
                {{ nodeStatus }} node
              </span>
              <span v-if="bondDisplay" class="tx-chip tx-chip--neutral">
                Bond {{ bondDisplay }}
              </span>
            </div>
          </div>

          <div class="tx-connector-pill">Votes</div>

          <div class="tx-asset-panel tx-asset-panel--accent">
            <div class="tx-asset-label">Mimir key</div>
            <div class="tx-asset-primary tx-asset-primary--compact">
              <span>{{ overview.key }} =</span>
              <span class="tx-value-positive">{{ overview.value }}</span>
            </div>
            <div class="tx-mimir-gloss">{{ keyDescription }}</div>
          </div>
        </div>

        <div class="tx-metric-strip">
          <div class="tx-metric-item">
            <div class="tx-asset-label">Consensus</div>
            <div :class="['tx-metric-value', consensusToneClass]">
              {{
                consensus
                  ? consensus.reached
                    ? 'Reached'
                    : 'Not reached'
                  : '-'
              }}
            </div>
          </div>
          <div class="tx-metric-item">
            <div class="tx-asset-label">Votes for {{ overview.value }}</div>
            <div class="tx-metric-value mono">{{ voteFractionDisplay }}</div>
          </div>
          <div class="tx-metric-item">
            <div class="tx-asset-label">In effect since</div>
            <div class="tx-metric-value mono">{{ inEffectSinceDisplay }}</div>
          </div>
        </div>

        <template v-if="consensus">
          <div class="tx-tally-bar">
            <div
              class="tx-tally-bar__fill"
              :style="{ width: `${consensus.percentFor * 100}%` }"
            />
            <div
              class="tx-tally-bar__other"
              :style="{ width: `${consensus.percentOthers * 100}%` }"
            />
          </div>
          <div class="tx-tally-caption">
            <span>
              {{ (consensus.percentFor * 100).toFixed(1) }}% voting
              {{ overview.value }}
              <template v-if="consensus.percentOthers > 0">
                · {{ (consensus.percentOthers * 100).toFixed(1) }}% voting other
                values
              </template>
            </span>
            <span>
              Threshold {{ (consensus.thresholdPercent * 100).toFixed(0) }}%
            </span>
          </div>
        </template>
      </section>

      <section class="tx-info-card">
        <div class="tx-section-title">Details</div>
        <div class="tx-detail-rows">
          <DetailRow label="Product">
            <ProductBadge label="THORChain" tone="green" />
          </DetailRow>
          <DetailRow label="Action" value="Mimir Vote" />
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
            label="From"
            :value="overview.nodeAddress"
            value-type="address"
          />
        </div>
      </section>

      <LifecycleTimeline :events="lifecycleEvents" />
    </template>

    <template #rail>
      <TxHashCard :hash="overview.hash" :actions="[]" />

      <section class="tx-info-card">
        <div class="tx-section-title">This vote</div>
        <div class="tx-detail-rows">
          <DetailRow label="Value voted">
            <span class="tx-value-positive">{{ overview.value }}</span>
          </DetailRow>
          <DetailRow
            label="Voting nodes"
            :value="consensus ? String(consensus.totalVotesCast) : '-'"
          />
          <DetailRow label="Mimir keys">
            <nuxt-link to="/network/votes" class="tx-link">
              See all Mimir keys →
            </nuxt-link>
          </DetailRow>
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
import ProductBadge from '~/components/ProductBadge.vue'
import NodeIcon from '~/assets/images/node.svg?inline'

// Renders the `mimirOverview` computed from pages/tx/_txhash.vue (screen
// 1a). createAbstractState's mimir branch only carries the tx's own vote
// (node address/key/value) — the network-wide tally/threshold/voter status
// come from a live fetch (fetchMimirConsensus + fetchNodeSnapshot, watched
// in _txhash.vue), passed in here as `consensus`/`nodeSnapshot`. Built from
// the shipped swapOverview hero's own classes/components so it's visually
// identical to the already-completed swap page — see the plan's §0
// correction. The connector and tally bar are additive (a vote moves no
// funds and has no swap-hero equivalent to reuse).
export default {
  components: {
    TxHeroShell,
    TxHashCard,
    TechnicalDetailsCard,
    LifecycleTimeline,
    DetailRow,
    ProductBadge,
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
    consensus: {
      type: Object,
      default: null,
    },
  },
  computed: {
    chips() {
      // TxHeroShell's <component :is="chip.icon"> resolves against its own
      // registry, so a plain 'NodeIcon' string wouldn't find anything
      // there — pass the imported component object directly instead.
      return [{ label: 'Network config', icon: NodeIcon }]
    },
    consensusToneClass() {
      if (!this.consensus) return null
      return this.consensus.reached ? 'tx-value-positive' : 'tx-value-warning'
    },
    // Swap hero picks --left-border/--right-border per-asset (panelVars);
    // a vote has a fixed role instead of assets — the Mimir key panel is
    // always the accented side, matching the mockup.
    panelVars() {
      return { '--right-border': 'var(--green)' }
    },
    // Generic, always-accurate restatement of the vote rather than a
    // per-key explanation of what the key actually does — there's no
    // source of truth in this codebase for that, and guessing would put
    // false governance info in front of users. This phrasing works for any
    // key/value pair.
    keyDescription() {
      return `Vote ${this.overview.key} rule set to ${this.overview.value}`
    },
    nodeStatus() {
      return this.nodeSnapshot?.status || null
    },
    bondDisplay() {
      const bond = this.nodeSnapshot?.total_bond
      if (bond == null) return null
      return `${this.$options.filters.number(Number(bond) / 1e8, '0.00a')} RUNE`
    },
    voteFractionDisplay() {
      if (!this.consensus) return '-'
      return `${this.consensus.votesFor} / ${this.consensus.activeNodeCount}`
    },
    inEffectSinceDisplay() {
      // Best-effort: no per-vote block height is available, only the tx's
      // own — so this is only shown once consensus has actually been
      // reached for this value, otherwise there's nothing to date yet.
      if (!this.consensus?.reached) return '-'
      return this.overview.heightDisplay
    },
    lifecycleEvents() {
      const events = [
        {
          icon: 'ArrowIcon',
          iconRotate: 180,
          title: 'Vote observed by THORChain',
          body: `Node ${this.addressFormatV2(this.overview.nodeAddress)} submitted mimir:${this.overview.key}:${this.overview.value}.`,
          meta: this.overview.timeDisplay,
        },
      ]
      if (this.consensus) {
        events.push({
          icon: 'ExchangeIcon',
          title: 'Vote recorded',
          body: `Tally moved to ${this.consensus.votesFor} of ${this.consensus.activeNodeCount} active nodes in favor of ${this.overview.value}.`,
        })
      }
      if (this.consensus?.reached) {
        events.push({
          icon: 'ArrowIcon',
          iconRotate: 0,
          title: 'Consensus reached — value applied',
          body: `Network-wide ${this.overview.key} now resolves to ${this.overview.value} for every node.`,
        })
      }
      return events
    },
  },
}
</script>
