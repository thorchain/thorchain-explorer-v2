<template>
  <Page>
    <Header title="Top Swaps" />
    <Nav :active-mode.sync="period" :nav-items="periods" pre-text="Period :" />
    <transactions :txs="swaps" :loading="!swaps" :props="formatProp">
      <template #volume="{ props }">
        <span class="mono">
          {{ smallBaseAmountFormatWithCur(getVolume(props.row)) }}
        </span>
      </template>
    </transactions>
  </Page>
</template>

<script>
export default {
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
      period: 'day',
      periods: [
        { text: '1 Day', mode: 'day' },
        { text: '1 Week', mode: 'week' },
        { text: '1 Month', mode: 'month' },
      ],
    }
  },
  watch: {
    async period(n, o) {
      try {
        this.swaps = (await this.getTopSwaps()).data
      } catch (err) {
        console.error(err)
      }
    },
  },
  async mounted() {
    try {
      this.swaps = (await this.getTopSwaps()).data
    } catch (err) {
      console.error(err)
    }
  },
  methods: {
    getTopSwaps() {
      switch (this.period) {
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

<style lang="scss"></style>
