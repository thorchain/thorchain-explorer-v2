<template>
  <div>
    <swap />
    <div class="header-top-swap">
      <Header title="Top Swaps" />
      <Nav
        :active-mode.sync="tablePeriod"
        :nav-items="tablePeriods"
        pre-text="Period :"
      />
      <transactions :txs="swaps" :loading="!swaps" :props="formatProp">
        <template #volume="{ props }">
          <span class="mono">
            {{ smallBaseAmountFormatWithCur(getVolume(props.row)) }}
          </span>
        </template>
      </transactions>
    </div>
  </div>
</template>

<script>
import swap from '../charts/swap.vue'
export default {
  components: {
    swap,
  },
  data() {
    return {
      swaps: undefined,
      formatProp: [
        {
          label: 'Volume',
          field: 'volume',
          sortFn: this.volumeSort,
        },
      ],
      tablePeriod: 'day',
      tablePeriods: [
        { text: '1 Day', mode: 'day' },
        { text: '1 Week', mode: 'week' },
        { text: '1 Month', mode: 'month' },
      ],
    }
  },
  watch: {
    tablePeriod(newPeriod) {
      this.$router.push({
        query: {
          ...this.$route.query,
          tablePeriod: newPeriod,
        },
      })
      this.fetchTableData(newPeriod)
    },
  },
  async mounted() {
    const queryTablePeriod = this.$route.query.tablePeriod

    let shouldUpdateQuery = false

    if (queryTablePeriod) {
      this.tablePeriod = queryTablePeriod
    } else {
      shouldUpdateQuery = true
    }

    if (shouldUpdateQuery) {
      this.$router.push({
        query: {
          ...this.$route.query,
          tablePeriod: this.tablePeriod,
        },
      })
    }

    this.fetchTableData(this.tablePeriod)
  },
  methods: {
    async fetchTableData(period) {
      try {
        this.swaps = (await this.getTopSwaps(period)).data
      } catch (err) {
        console.error(err)
      }
    },
    getTopSwaps(period) {
      switch (period) {
        case 'day':
          return this.$api.getTopSwaps()
        case 'month':
          return this.$api.getTopSwapsMonthly()
        case 'week':
          return this.$api.getTopSwapsWeekly()
      }
    },
    getVolume(props) {
      const inPrice = +props?.metadata?.swap?.inPriceUSD ?? 0
      const inAmount = +props?.in[0]?.coins[0].amount ?? 0
      return inPrice * inAmount
    },
    volumeSort(x, y, col, rowX, rowY) {
      return this.getVolume(rowX) < this.getVolume(rowY)
        ? -1
        : this.getVolume(rowX) > this.getVolume(rowY)
          ? 1
          : 0
    },
  },
}
</script>

<style lang="scss">
.header-top-swap {
  margin-top: 0.5rem;
}
</style>