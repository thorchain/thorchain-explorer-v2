<template>
  <div class="txs-wrapper">
    <div v-if="txs && txs.actions" class="transactions-container">
      <div class="header">Transactions</div>
      <!-- transactions component -->
      <Nav :activeMode="filter" @update:activeMode="(f) => changeFilter(f)" :navItems="navItems" />
      <transactions :txs="txs" :loading="loading"></transactions>
      <pagination :limit="10" :offset="offset" :count="count" @changePage="getActions"></pagination>
    </div>
    <div v-else class="loading">
      <BounceLoader color="var(--font-color)" size="3rem"/>
    </div>
  </div>
</template>

<script>
import Transactions from '~/components/Transactions.vue';
import BounceLoader from 'vue-spinner/src/BounceLoader.vue';

export default {
  components: { Transactions, BounceLoader },
  name: 'txsPage',
  data() {
    return {
      txs: undefined,
      offset: undefined,
      count: undefined,
      loading: false,
      filter: 'all',
      navItems: [
        {text: 'All', mode: 'all'},
        {text: 'Swap', mode: 'swap'},
        {text: 'Add Liquidity', mode: 'addLiquidity'},
        {text: 'Withdraw Liquidity', mode: 'withdraw'},
        {text: 'Donate', mode: 'donate'},
        {text: 'Refund', mode: 'refund'},
        {text: 'Switch', mode: 'switch'},
      ]
    }
  },
  methods: {
    getActions(offset=0,filter=undefined) {
      this.loading = true;
      this.offset = offset;
      this.$api.getTxs(this.offset, 10, filter=filter)
      .then(res => {
        this.txs = res.data;
        this.count = res.data.count;
      })
      .catch(error => {
        console.error(error)
      })
      .finally(() => {
        this.loading = false;
      })
    },
    changeFilter(type) {
      this.filter = type;
      if (type === 'all')
        type = undefined
      this.getActions(0, type)
    }
  },
  mounted() {
    this.getActions(0);
  }
}
</script>

<style lang="scss" scoped>
.loading {
  display: flex;
  justify-content: center;
}

.transactions-container .header {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--sec-font-color);
}
</style>