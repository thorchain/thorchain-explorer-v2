<template>
  <TxHeroShell eyebrow="Mimir Vote · THORChain" :chips="chips">
    <template #title>
      <template v-if="isWithdrawal">
        Node withdrew its vote on
        <span class="mono">{{ overview.key }}</span>
      </template>
      <template v-else>
        Node voted <span class="mono">{{ overview.key }}</span> =
        <span class="mono tx-value-positive">{{ overview.value }}</span>
      </template>
    </template>

    <template #main>
      <section class="tx-swap-card">
        <div class="tx-swap-head tx-swap-head--vote" :style="panelVars">
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

          <div class="tx-connector-pill">
            {{ isWithdrawal ? 'Cancels' : 'Votes' }}
          </div>

          <div class="tx-asset-panel tx-asset-panel--accent">
            <div class="tx-asset-label">Mimir key</div>
            <div class="tx-asset-primary tx-asset-primary--compact">
              <template v-if="isWithdrawal">
                <span>{{ overview.key }}</span>
                <span class="tx-value-warning">vote removed</span>
              </template>
              <template v-else>
                <span>{{ overview.key }} =</span>
                <span class="tx-value-positive">{{ overview.value }}</span>
              </template>
            </div>
            <div class="tx-mimir-gloss">{{ keyDescription }}</div>
          </div>
        </div>

        <div class="tx-metric-strip">
          <div v-for="(m, i) in metrics" :key="i" class="tx-metric-item">
            <div class="tx-asset-label">{{ m.label }}</div>
            <div :class="['tx-metric-value', m.toneClass, { mono: m.mono }]">
              {{ m.value }}
            </div>
          </div>
        </div>

        <template v-if="showTally">
          <div class="tx-tally-bar">
            <div
              class="tx-tally-bar__fill"
              :style="{ width: `${consensus.progressPercent * 100}%` }"
            />
          </div>
          <div class="tx-tally-caption">
            <span>
              {{ consensus.votesFor }} of {{ consensus.votesRequired }} votes
              needed for {{ consensus.trackedValue }}
              <template v-if="consensus.votesOther > 0">
                · {{ consensus.votesOther }} backing other values
              </template>
            </span>
            <span>
              Threshold {{ consensus.votesRequired }} of
              {{ consensus.activeNodeCount }} nodes
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
          <DetailRow
            label="Action"
            :value="isWithdrawal ? 'Mimir Vote Withdrawal' : 'Mimir Vote'"
          />
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
          <DetailRow :label="isWithdrawal ? 'Vote' : 'Value voted'">
            <span v-if="isWithdrawal" class="tx-value-warning">
              Withdrawn ({{ overview.value }})
            </span>
            <span v-else class="tx-value-positive">{{ overview.value }}</span>
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
//
// A negative value (overview.isWithdrawal) is not a vote for that number:
// it cancels the node's standing vote on the key. Every place that would
// otherwise read "voted KEY = -1" switches to withdrawal wording, and the
// tally alongside it tracks the key's current effective value instead —
// see computeMimirConsensus's `trackedValue`.
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
      const chips = [{ label: 'Network config', icon: NodeIcon }]
      // Same Operational/Economic split votes.vue labels its keys with —
      // it's what explains a threshold of 3 nodes instead of a 2/3
      // supermajority, so the number in the tally isn't left unexplained.
      if (this.consensus) {
        chips.push({
          label: this.consensus.operational ? 'Operational' : 'Economic',
          tone: this.consensus.operational ? 'blue' : 'yellow',
        })
      }
      return chips
    },
    isWithdrawal() {
      return !!this.overview.isWithdrawal
    },
    consensusToneClass() {
      if (!this.consensus) return null
      return this.consensus.reached ? 'tx-value-positive' : 'tx-value-warning'
    },
    // mimirOverview.status.tone comes from the shared getOverviewStatus
    // helper (page-local, same as the base swapOverview hero's own Status
    // row reads via its statusToneClass method) — a vote tx can in
    // principle fail/be pending like any other, not just succeed.
    statusToneClass() {
      const map = { red: 'danger', blue: 'info', yellow: 'yellow' }
      return map[this.overview.status?.tone] || null
    },
    // Swap hero picks --left-border/--right-border per-asset (panelVars);
    // a vote has a fixed role instead of assets — the Mimir key panel is
    // always the accented side, matching the mockup. A withdrawal takes
    // something away rather than setting a value, so it drops the green.
    panelVars() {
      return {
        '--right-border': this.isWithdrawal
          ? 'var(--warning-color)'
          : 'var(--green)',
      }
    },
    // Generic, always-accurate restatement of the vote rather than a
    // per-key explanation of what the key actually does — there's no
    // source of truth in this codebase for that, and guessing would put
    // false governance info in front of users. This phrasing works for any
    // key/value pair.
    keyDescription() {
      if (this.isWithdrawal) {
        return `Removes this node's vote on ${this.overview.key} — it no longer counts toward any value`
      }
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
    currentValueDisplay() {
      const current = this.consensus?.currentEffectiveValue
      return current == null ? '-' : String(current)
    },
    // Votes cast vs. votes needed, matching how votes.vue renders every
    // tally — against the active set it would read "3 / 87" for a key that
    // only needs 3 votes to take effect.
    voteFractionDisplay() {
      if (!this.consensus || this.consensus.trackedValue == null) return '-'
      return `${this.consensus.votesFor} / ${this.consensus.votesRequired}`
    },
    inEffectSinceDisplay() {
      // Best-effort: no per-vote block height is available, only the tx's
      // own — so this is only shown once consensus has actually been
      // reached for this value, otherwise there's nothing to date yet.
      if (!this.consensus?.reached) return '-'
      return this.overview.heightDisplay
    },
    // A withdrawal has no value of its own to measure, so its strip answers
    // "where does the key stand now" instead of "did this value pass".
    metrics() {
      if (this.isWithdrawal) {
        return [
          {
            label: 'Key now',
            value: this.currentValueDisplay,
            mono: true,
          },
          {
            label:
              this.consensus?.trackedValue != null
                ? `Votes for ${this.consensus.trackedValue}`
                : 'Standing votes',
            value: this.voteFractionDisplay,
            mono: true,
          },
          {
            label: 'Votes withdrawn',
            value: this.consensus ? String(this.consensus.withdrawnCount) : '-',
            mono: true,
          },
        ]
      }
      return [
        {
          label: 'Consensus',
          value: this.consensus
            ? this.consensus.reached
              ? 'Reached'
              : 'Not reached'
            : '-',
          toneClass: this.consensusToneClass,
        },
        {
          label: `Votes for ${this.overview.value}`,
          value: this.voteFractionDisplay,
          mono: true,
        },
        {
          label: 'In effect since',
          value: this.inEffectSinceDisplay,
          mono: true,
        },
      ]
    },
    // Nothing to plot for a withdrawal on a key with no value set at all —
    // trackedValue is null there, so every segment would read 0%.
    showTally() {
      return !!this.consensus && this.consensus.trackedValue != null
    },
    lifecycleEvents() {
      const voter = this.addressFormatV2(this.overview.nodeAddress)
      const memo = `mimir:${this.overview.key}:${this.overview.value}`
      if (this.isWithdrawal) {
        const events = [
          {
            icon: 'ArrowIcon',
            iconRotate: 180,
            title: 'Vote withdrawal observed by THORChain',
            body: `Node ${voter} submitted ${memo}, cancelling its vote on ${this.overview.key}.`,
            meta: this.overview.timeDisplay,
          },
        ]
        if (this.consensus) {
          events.push({
            icon: 'ExchangeIcon',
            title: 'Vote removed',
            body:
              this.consensus.trackedValue != null
                ? `The node no longer backs any value for ${this.overview.key}; ${this.consensus.votesFor} of the ${this.consensus.votesRequired} votes needed still back the current value ${this.consensus.trackedValue}.`
                : `The node no longer backs any value for ${this.overview.key}, which has no network-wide value set.`,
          })
        }
        return events
      }
      const events = [
        {
          icon: 'ArrowIcon',
          iconRotate: 180,
          title: 'Vote observed by THORChain',
          body: `Node ${voter} submitted ${memo}.`,
          meta: this.overview.timeDisplay,
        },
      ]
      if (this.consensus) {
        events.push({
          icon: 'ExchangeIcon',
          title: 'Vote recorded',
          body: `Tally moved to ${this.consensus.votesFor} of the ${this.consensus.votesRequired} votes needed in favor of ${this.overview.value}.`,
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
