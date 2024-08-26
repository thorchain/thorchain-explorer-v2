<template>
  <Page>
    <div class="transactions-container">
      <!-- transactions component -->
      <advanced-filter @applyFilters="applyFilters" />
      <transactions :txs="txs" :loading="loading" />
      <pagination @nextPage="goNext" @prevPage="goPrev" />
    </div>
  </Page>
</template>

<script>
import advancedFilter from './components/advancedFilter.vue'
import Transactions from '~/components/Transactions.vue'

export default {
  name: 'TxsPage',
  components: { Transactions, advancedFilter },
  data() {
    return {
      txs: undefined,
      loading: false,
      limit: 30,
      nextPageToken: undefined,
      prevPageToken: undefined,
      filters: {},
      hasFilters: false,
    }
  },
  head: {
    title: 'THORChain Network Explorer | Transaction',
  },
  computed: {},
  mounted() {
    this.getActions({ limit: this.limit })
  },
  methods: {
    goNext() {
      this.getActions({ limit: this.limit, nextPageToken: this.nextPageToken })
    },
    goPrev() {
      this.getActions({ limit: this.limit, prevPageToken: this.prevPageToken })
    },
    applyFilters(params) {
      this.filters = {
        ...(params.asset &&
          params.asset.length > 0 && { asset: params.asset.join(',') }),
        ...(params.affiliate &&
          params.affiliate.length > 0 && {
            affiliate: params.affiliate.join(','),
          }),
        ...(params.addresses &&
          params.addresses.length > 0 && {
            addresses: params.addresses.join(','),
          }),
        ...(params.txType &&
          params.txType !== 'All' && {
            txType: params.txType,
          }),
        ...(params.type &&
          params.type !== 'All' && {
            type: params.type,
          }),
      }
      this.hasFilters = true
      this.getActions({ limit: this.limit })
    },
    getActions(params) {
      this.loading = true
      if (this.hasFilters) {
        params = {
          ...params,
          ...this.filters,
        }
      }
      this.$api
        .getActions(params)
        .then((res) => {
          this.txs = res.data
          this.nextPageToken = res.data.meta.nextPageToken
          this.prevPageToken = res.data.meta.prevPageToken
        })
        .catch((error) => {
          console.error(error)
        })
        .finally(() => {
          this.loading = false
        })
    },
  },
}
</script>

<style></style>
