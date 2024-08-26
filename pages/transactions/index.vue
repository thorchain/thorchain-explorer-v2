<template>
  <Page>
    <div class="transactions-container">
      <!-- transactions component -->
      <advanced-filter />
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
    getActions(params) {
      this.loading = true
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
