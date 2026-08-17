<template>
  <section class="tx-info-card">
    <div class="tx-outbound-header">
      <span class="tx-section-title">Outbounds ({{ legs.length }})</span>
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
          <Hash v-if="leg.hash" :param="leg.hash" />
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
    </div>

    <div v-if="total" class="tx-outbound-total">
      <span>Total outbound</span>
      <div class="tx-outbound-total-value">
        <span class="mono">{{ total.display }}</span>
        <span class="tx-detail-muted">
          {{ total.deliveredDisplay }} delivered ·
          {{ total.outstandingDisplay }} pending
        </span>
      </div>
    </div>
  </section>
</template>

<script>
import StatusChip from '~/components/transactions/StatusChip.vue'
import Hash from '~/components/transactions/Hash.vue'
import Address from '~/components/transactions/Address.vue'

// Per-leg outbound breakdown for a transaction whose output split across
// several outbound txs (e.g. a large trade/secure-asset withdrawal) — no
// swap-hero equivalent exists (it only ever renders one outbound), so this
// is a genuinely new row layout rather than a reuse of .tx-detail-row's
// fixed 2-column shape. `total`/`destination` are omitted when legs use
// different assets/addresses (see multiOutboundOverview's sameAsset/
// sameDestination guards).
export default {
  components: { StatusChip, Hash, Address },
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
    // { display, deliveredDisplay, outstandingDisplay } | null
    total: {
      type: Object,
      default: null,
    },
  },
  methods: {
    normalFormat(n) {
      return this.$options.filters.number(n, '0,0')
    },
  },
}
</script>
