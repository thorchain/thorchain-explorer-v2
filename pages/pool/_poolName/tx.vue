<template>
  <div>
    <div v-if="poolTxs">
      <transactions
        v-if="poolTxs && poolTxs.actions"
        :txs="poolTxs"
        :loading="loading"
      />
      <pagination
        v-if="poolTxs && poolTxs.actions && count"
        :limit="10"
        :offset="offset"
        :count="count"
        @changePage="getActions"
      />
    </div>
    <loadingCard v-else />
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
      loading: false,
    }
  },
  mounted() {
    this.getActions(0)
  },
  methods: {
    getActions(offset = 0) {
      this.loading = true
      this.offset = offset
      this.$api
        .getPoolTxs(this.poolName, offset)
        .then((res) => {
          this.count = Number.parseInt(res.data.count)
          this.poolTxs = res?.data
        })
        .catch((e) => {
          console.error(e)
        })
        .finally(() => {
          this.loading = false
        })
    },
  },
}
</script>

<style lang="scss" scoped></style>
