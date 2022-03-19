<template>
  <div class="pool-txs-container">
    <transactions v-if="poolTxs && poolTxs.actions" :txs="poolTxs" :loading="loading"></transactions>
    <pagination v-if="poolTxs && poolTxs.actions && count" :limit="10" :offset="offset" :count="count" @changePage="getActions"></pagination>
  </div>
</template>

<script>
export default {
  async asyncData({ params }) {
    return { poolName: params.poolName }
  },
  data() {
    return {
      poolTxs: undefined,
      count: undefined,
      offset: 0,
      loading: false
    }
  },
  methods: {
    getActions(offset=0) {
      this.loading = true;
      this.offset = offset;
      this.$api.getPoolTxs(this.poolName, offset).then(res => {
        this.count = Number.parseInt(res.data.count);
        this.poolTxs = res?.data;
      }).catch(e => {
        console.error(e);
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

</style>