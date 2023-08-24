<template>
  <Card :is-loading="loading">
    <div v-if="noStreaming" class="no-streaming">
      <streamingIcon class="streaming-icon large-icon" />
      <h3>There is no streaming swaps ongoing at the moment.</h3>
    </div>
  </Card>
</template>

<script>
import streamingIcon from '@/assets/images/streaming.svg?inline'

export default {
  components: { streamingIcon },
  data () {
    return {
      noStreaming: false,
      loading: true,
      streamingSwaps: []
    }
  },
  async mounted () {
    await this.updateStreamingSwap()
  },
  methods: {
    async updateStreamingSwap () {
      const resData = (await this.$api.getStreamingSwaps()).data
      if (!resData || resData.length === 0) {
        this.noStreaming = true
        this.loading = false
        return
      }

      try {
        this.streamingSwaps = resData
        for (let i = 0; i < resData.length; i++) {
          const swapDetails = (await this.$api.getTxStatus(resData.tx_id))
          console.log(swapDetails)
        }
        this.loading = false
      } catch (error) {
        this.noStreaming = true
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss">
.no-streaming {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;

  .streaming-icon {
    fill: var(--font-color);
  }
}
</style>
