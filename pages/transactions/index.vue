<template>
  <div class="txs-wrapper">
    <div v-if="txs && txs.actions" class="transactions-container">
      <div class="header">Transactions</div>
      <!-- transactions component -->
      <transactions :txs="txs" :loading="loading"></transactions>
      <pagination :limit="10" :offset="offset" :count="count" @changePage="getActions"></pagination>
    </div>
    <div v-else class="loading">
      <BounceLoader color="#9F9F9F" size="3rem"/>
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
      loading: false
    }
  },
  methods: {
    getActions(offset=0) {
      this.loading = true;
      this.offset = offset;
      this.$api.getTxs(this.offset)
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
  color: #e6e6e6;
}
</style>