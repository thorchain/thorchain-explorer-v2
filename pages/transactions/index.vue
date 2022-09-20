<template>
  <Page>
    <div v-if="txs && txs.actions" class="transactions-container">
      <!-- transactions component -->
      <Nav :active-mode="filter" :nav-items="navItems" @update:activeMode="(f) => changeFilter(f)" />
      <transactions :txs="txs" :loading="loading" />
      <pagination :limit="10" :offset="offset" :count="count" @changePage="getActions" />
    </div>
    <loading-card v-else />
  </Page>
</template>

<script>
import BounceLoader from 'vue-spinner/src/BounceLoader.vue'
import Transactions from '~/components/Transactions.vue'
import LoadingCard from '~/components/layouts/LoadingCard.vue'

export default {
  name: 'TxsPage',
  components: { Transactions, BounceLoader, LoadingCard },
  data () {
    return {
      txs: undefined,
      offset: undefined,
      count: undefined,
      loading: false,
      filter: 'all',
      navItems: [
        { text: 'All', mode: 'all' },
        { text: 'Swap', mode: 'swap' },
        { text: 'Add Liquidity', mode: 'addLiquidity' },
        { text: 'Withdraw Liquidity', mode: 'withdraw' },
        { text: 'Donate', mode: 'donate' },
        { text: 'Refund', mode: 'refund' },
        { text: 'Switch', mode: 'switch' }
      ]
    }
  },
  mounted () {
    this.getActions(0)
  },
  methods: {
    getActions (offset = 0, filter = undefined) {
      this.loading = true
      this.offset = offset
      filter = this.filter == 'all' ? undefined : this.filter
      this.$api.getTxs(this.offset, 10, filter)
        .then((res) => {
          this.txs = res.data
          this.count = res.data.count
        })
        .catch((error) => {
          console.error(error)
        })
        .finally(() => {
          this.loading = false
        })
    },
    changeFilter (type) {
      this.filter = type
      if (type === 'all') { type = undefined }
      this.getActions(0, type)
    }
  }
}
</script>

<style>
</style>
