<template>
  <Page>
    <Header title="Top Swaps (24hr)" />
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
