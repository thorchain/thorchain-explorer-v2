<template>
  <section class="tx-info-card">
    <div class="tx-outbound-header">
      <span class="tx-section-title">Outbounds ({{ legCount }})</span>
      <span v-if="destination" class="tx-detail-muted tx-outbound-destination">
        All to
        <Address :address="destination" />
      </span>
    </div>

    <div class="tx-outbound-rows">
      <div v-for="leg in legs" :key="leg.index" class="tx-outbound-row">
        <div class="tx-outbound-row-main">
          <StatusChip :status="leg.status" />
          <span class="tx-outbound-leg">Leg {{ leg.index + 1 }}</span>
          <ExternalHash v-if="leg.hash" :param="leg.hash" :asset="leg.asset" />
          <span v-else-if="isInternalAsset(leg.asset)" class="tx-detail-muted"
            >Internal</span
          >
          <span v-else class="tx-detail-muted">No hash yet</span>
          <span class="tx-outbound-amount mono">{{ leg.amountDisplay }}</span>
        </div>
        <div
          v-if="leg.status === 'overdue' && leg.pastDueDisplay"
          class="tx-outbound-overdue-note"
        >
          Scheduled passed — past due {{ leg.pastDueDisplay }}
          <template v-if="leg.pastDueBlocks">
            ({{ normalFormat(leg.pastDueBlocks) }} blocks)
          </template>
        </div>
      </div>

      <!-- A swap's own partial-refund leg — different asset than every
           other leg above, so it's kept out of the `legs` prop/totals
           entirely (see multiOutboundOverview) and rendered as its own
           trailing row instead, reusing the exact same row shape. -->
      <div v-if="refundLeg" class="tx-outbound-row">
        <div class="tx-outbound-row-main">
          <StatusChip status="refund" />
          <span class="tx-outbound-leg">Leg {{ refundLeg.index + 1 }}</span>
          <ExternalHash
            v-if="refundLeg.hash"
            :param="refundLeg.hash"
            :asset="refundLeg.asset"
          />
          <span
            v-else-if="isInternalAsset(refundLeg.asset)"
            class="tx-detail-muted"
            >Internal</span
          >
          <span v-else class="tx-detail-muted">No hash yet</span>
          <span class="tx-outbound-amount mono">
            {{ refundLeg.amountDisplay }}
          </span>
        </div>
        <div class="tx-outbound-refund-note">{{ refundLeg.note }}</div>
      </div>
    </div>

    <div v-if="total" class="tx-outbound-total">
      <span>Total outbound</span>
      <div class="tx-outbound-total-value">
        <span class="mono">{{ total.display }}</span>
        <span v-if="refundLeg" class="tx-outbound-refund-total mono">
          + {{ refundLeg.amountDisplay }} refunded
        </span>
        <span v-if="total.allDelivered" class="tx-detail-muted">
          {{ total.usdDisplay }}
        </span>
        <span v-else class="tx-detail-muted">
          {{ total.deliveredDisplay }} delivered ·
          {{ total.outstandingDisplay }} pending
        </span>
      </div>
    </div>
  </section>
</template>

<script>
import StatusChip from '~/components/transactions/StatusChip.vue'
import ExternalHash from '~/components/transactions/ExternalHash.vue'
import Address from '~/components/transactions/Address.vue'
import { assetFromString } from '~/utils'

// Per-leg outbound breakdown for a transaction whose output split across
// several outbound txs (e.g. a large trade/secure-asset withdrawal) — no
// swap-hero equivalent exists (it only ever renders one outbound), so this
// is a genuinely new row layout rather than a reuse of .tx-detail-row's
// fixed 2-column shape. `total`/`destination` are omitted when legs use
// different assets/addresses (see multiOutboundOverview's sameAsset/
// sameDestination guards).
export default {
  components: { StatusChip, ExternalHash, Address },
  props: {
    // [{ index, status: 'delivered'|'scheduled'|'overdue'|'refunded',
    //    hash: string|null, amountDisplay: string, pastDueDisplay?: string,
    //    pastDueBlocks?: number }]
    legs: {
      type: Array,
      required: true,
    },
    destination: {
      type: String,
      default: null,
    },
    // { display, usdDisplay, deliveredDisplay, outstandingDisplay,
    //   allDelivered } | null — once allDelivered, "0 pending" is a
    //   pointless caption, so the total's USD value shows instead.
    total: {
      type: Object,
      default: null,
    },
    // A swap's own unfilled-remainder refund leg (multiOutboundOverview's
    // overview.refundLeg) — { index, status: 'refund', hash, amountDisplay,
    // note } | null. Kept as its own prop rather than folded into `legs`
    // since it's a different asset and shouldn't count toward `total`.
    refundLeg: {
      type: Object,
      default: null,
    },
  },
  computed: {
    legCount() {
      return this.legs.length + (this.refundLeg ? 1 : 0)
    },
  },
  methods: {
    normalFormat(n) {
      return this.$options.filters.number(n, '0,0')
    },
    // A trade/secure/synth leg settles as an internal THORChain ledger
    // update, not an observed cross-chain tx — it will never get a hash,
    // unlike an L1 leg that's simply still pending one. "No hash yet"
    // would be misleading here (it's not "yet", it's never).
    isInternalAsset(asset) {
      const parsed = assetFromString(asset)
      return !!(parsed?.trade || parsed?.secure || parsed?.synth)
    },
  },
}
</script>
