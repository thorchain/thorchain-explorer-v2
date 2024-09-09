<template>
  <Page>
    <h2>Top Swaps (24H)</h2>
    <transactions :txs="swaps" :loading="!swaps" />
  </Page>
</template>

<script>
export default {
  data() {
    return {
      swaps: undefined,
    }
  },
  async mounted() {
    try {
      this.swaps = (await this.$api.getTopSwaps()).data
    } catch (err) {
      console.error(err)
    }
  },
}
</script>

<style lang="scss"></style>
