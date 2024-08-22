<template>
  <Page>
    <div v-if="txs && txs.actions" class="transactions-container">
      <!-- transactions component -->
      <advanced-filter />
      <transactions :txs="txs" :loading="loading" />
      <pagination
        :limit="10"
        :offset="offset"
        :count="count"
        @changePage="getActions"
      />
    </div>
    <loading-card v-else />
  </Page>
</template>

<script>
import advancedFilter from './components/advancedFilter.vue';
import Transactions from '~/components/Transactions.vue'
import LoadingCard from '~/components/layouts/LoadingCard.vue'

export default {
  name: 'TxsPage',
  components: { Transactions, LoadingCard, advancedFilter },
  data() {
    return {
      txs: undefined,
      offset: undefined,
      count: undefined,
      loading: false,
      filter: 'all',
      navItems: [
        { title: 'All', value: 'all' },
        {
          title: 'Swap',
          subItems: [
            {
              name: 'All',
              value: 'allSwap',
            },
            {
              name: 'Layer Ones',
              value: 'layerOne',
            },
            {
              name: 'Non RUNE',
              value: 'norune',
            },
            {
              name: 'Non synth',
              value: 'nosynth',
            },
          ],
        },
        {
          title: 'Savers / LP',
          subItems: [
            {
              name: 'Add',
              value: 'addLiquidity',
            },
            {
              name: 'Withdraw',
              value: 'withdraw',
            },
          ],
        },
        { title: 'Donate', value: 'donate' },
        { title: 'Refund', value: 'refund' },
      ],
    }
  },
  head: {
    title: 'THORChain Network Explorer | Transaction',
  },
  mounted() {
    this.getActions(0)
  },
  methods: {
    getActions(offset = 0, filter = undefined) {
      this.loading = true
      this.offset = offset
      this.$api
        .getTxs(this.offset, 10, filter)
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
    changeFilter(type) {
      let txsType = { type: undefined }
      switch (type) {
        case 'all':
          txsType = {}
          break
        case 'allSwap':
          txsType = { type: 'swap' }
          break
        case 'layerOne':
          txsType = { type: 'swap', asset: 'nosynth,norune' }
          break
        case 'norune':
          txsType = { type: 'swap', asset: 'norune' }
          break
        case 'nosynth':
          txsType = { type: 'swap', asset: 'nosynth' }
          break
        case 'addLiquidity':
          txsType = { type: 'addLiquidity' }
          break
        case 'withdraw':
          txsType = { type: 'withdraw' }
          break
        case 'donate':
          txsType = { type: 'donate' }
          break
        case 'refund':
          txsType = { type: 'refund' }
          break

        default:
          break
      }
      this.filter = type
      this.getActions(0, txsType)
    },
  },
}
</script>

<style></style>
