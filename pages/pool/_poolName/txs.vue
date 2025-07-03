<template>
  <div>
    <div>
      <div v-if="error" class="error-container">
        Can't Fetch the actions! Please Try again Later.
      </div>
      <transactions v-else :txs="txs" :loading="loading" />
    </div>
    <NewPagination
      v-if="txs && txs.actions && count > -1"
      :total-rows="count"
      :per-page="50"
      :current-page="currentPage"
      @change="onPageChange"
    />
    <pagination
      v-else-if="txs && txs.actions"
      :loading="loading"
      :meta="txs && txs.actions"
      @nextPage="goNext"
      @prevPage="goPrev"
    />
  </div>
</template>

<script>
import { assetToTrade } from '~/utils'

export default {
  asyncData({ params }) {
    return { poolName: params.poolName }
  },
  data() {
    return {
      txs: undefined,
      count: undefined,
      offset: 0,
      error: false,
      loading: true,
      currentPage: 1,
      nextPageToken: undefined,
      prevPageToken: undefined,
    }
  },
  mounted() {
    this.getActions(0)
  },
  methods: {
    goNext() {
      this.$api
        .getActions({
          limit: 50,
          asset: this.poolName,
          nextPageToken: this.nextPageToken,
          prevPageToken: undefined,
          type: 'swap',
        })
        .then((res) => {
          this.txs = res.data
          this.nextPageToken = res.data.meta.nextPageToken
          this.prevPageToken = res.data.meta.prevPageToken
          this.error = false
          this.loading = false
        })
        .catch((error) => {
          if (error.message === 'cancel') {
            this.loading = true
            return
          }
          this.error = true
          console.error(error)
        })
    },
    goPrev() {
      this.$api
        .getActions({
          limit: 50,
          asset: this.poolName,
          prevPageToken: this.prevPageToken,
          nextPageToken: undefined,
          type: 'swap',
        })
        .then((res) => {
          this.txs = res.data
          this.nextPageToken = res.data.meta.nextPageToken
          this.prevPageToken = res.data.meta.prevPageToken
          this.error = false
          this.loading = false
        })
        .catch((error) => {
          if (error.message === 'cancel') {
            this.loading = true
            return
          }
          this.error = true
          console.error(error)
        })
    },
    onPageChange(page) {
      this.currentPage = page
      this.getActions((page - 1) * 50)
    },
    getActions(offset = 0) {
      this.loading = true
      this.offset = offset

      const tradeAsset = assetToTrade(this.poolName)

      this.$api
        .getActions({
          limit: 50,
          offset,
          asset: [this.poolName, tradeAsset].join(','),
          type: 'swap',
        })
        .then((res) => {
          this.txs = res.data
          this.nextPageToken = res.data.meta.nextPageToken
          this.prevPageToken = res.data.meta.prevPageToken
          this.count = res.data.count
          this.error = false
          this.loading = false
        })
        .catch((error) => {
          if (error.message === 'cancel') {
            this.loading = true
            return
          }
          this.error = true
          console.error(error)
        })
    },
  },
}
</script>

<style lang="scss" scoped></style>
