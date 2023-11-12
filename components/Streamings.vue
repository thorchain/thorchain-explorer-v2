<template>
  <Card :is-loading="loading" title="Ongoing Streaming Swaps">
    <template #header>
      <dot-live />
    </template>
    <div v-if="noStreaming" class="no-streaming">
      <streamingIcon class="streaming-icon large-icon" />
      <h3>There is no streaming swaps ongoing at the moment.</h3>
    </div>
    <template v-for="(o, i) in filteredStreamingSwaps" v-else>
      <div :key="i" class="streaming-item">
        <div class="upper-body">
          <div class="asset-container">
            <div v-if="o.inputAsset" class="asset-item">
              <asset-icon :asset="o.inputAsset.asset" />
              <span class="asset-name">
                {{ $options.filters.number(o.inputAsset.amount / 1e8, '0,0.0000') }}
                <small class="asset-text sec-color">{{ o.inputAsset.asset }}</small>
              </span>
            </div>
            →
            <div v-if="o.outputAsset" class="asset-item">
              <asset-icon :asset="o.outputAsset.asset" />
              <span class="asset-name">
                <template v-if="o.outputAsset.amount">{{ $options.filters.number(o.outputAsset.amount / 1e8, '0,0.0000') }}</template>
                <small class="asset-text sec-color">{{ o.outputAsset.asset }}</small>
              </span>
            </div>
          </div>
          <small v-if="o.tx_id" class="sec-color mono" style="margin-left: auto;">
            <NuxtLink v-if="isValidTx(o.tx_id)" class="clickable" :to="{ path: `/tx/${o.tx_id}` }">
              {{ formatAddress(o.tx_id) }}
            </NuxtLink>
          </small>
        </div>
        <div class="extra-info">
          <progress-bar v-if="o.quantity > 0" :width="(o.count / o.quantity) * 100" height="4px" />
          <small style="white-space: nowrap;">
            {{ $options.filters.percent(o.count / o.quantity) }}
          </small>
        </div>
        <small style="margin-top: 5px">{{ o.interval }} Blocks / Swap 
          <span class="sec-color"><small style="color: var(--font-color);">(ETA </small> {{ o.remaningETA }}
          <small style="color: var(--font-color);">, Remainng swaps: {{ o.quantity - o.count }}</small>
          <small style="color: var(--font-color);">)</small>
          </span>
        </small>
      </div>
      <hr :key="i + '-hr'" class="hr-space">
    </template>
    <template v-if="streamingSwaps.length > perPage" #footer>
      <b-pagination
        v-model="currentPage"
        class="center"
        :total-rows="streamingSwaps.length"
        :per-page="perPage"
      />
    </template>
  </Card>
</template>

<script>
import moment from 'moment'
import streamingIcon from '@/assets/images/streaming.svg?inline'
import { shortAssetName } from '~/utils'

export default {
  components: { streamingIcon },
  data () {
    return {
      currentPage: 1,
      noStreaming: false,
      loading: true,
      streamingSwaps: [],
      intervalId: undefined,
      perPage: 7
    }
  },
  computed: {
    filteredStreamingSwaps () {
      return this.streamingSwaps.slice(
        (this.currentPage - 1) * this.perPage,
        this.currentPage * this.perPage
      )
    }
  },
  async mounted () {
    await this.updateStreamingSwap()

    // Update the component every 20 secs
    this.intervalId = setInterval(() => {
      this.updateStreamingSwap(this.inboundHash)
    }, 10000)
  },
  destroyed () {
    this.clearIntervalId(this.intervalId)
  },
  methods: {
    async updateStreamingSwap () {
      this.noStreaming = false
      const resData = (await this.$api.getStreamingSwaps()).data

      if (!resData || resData.length === 0) {
        this.noStreaming = true
        this.streamingSwaps = []
        this.loading = false
        return
      }

      try {
        const swaps = []
        for (let i = 0; i < resData.length; i++) {
          const swap = { ...resData[i] }
          const swapDetails = (await this.$api.getTxStatus(resData[i].tx_id)).data

          const txAsset = swapDetails?.tx
          if (txAsset) {
            swap.inputAsset = {
              asset: txAsset?.coins[0].asset,
              amount: txAsset?.coins[0].amount
            }
          }

          let nonRUNE = false
          if (!swap.outputAsset?.asset) {
            const memo = swapDetails.tx?.memo
            if (memo) {
              const m = swapDetails.tx?.memo.split(':', 3)[1]
              const outAsset = shortAssetName(m)
              if (outAsset !== 'THOR.RUNE') { nonRUNE = true }
              swap.outputAsset = {
                asset: outAsset
              }
            }
          }

          const outAsset = swapDetails?.out_txs
          if (outAsset && outAsset.length > 0) {
            const oa = outAsset.map(o => ({ asset: o.coins[0]?.asset, amount: o.coins[0].amount }))

            const tmpOut = {
              amount: 0,
              asset: '',
              new: false
            }
            if (oa.every(a => a.asset === 'THOR.RUNE') && !nonRUNE) {
              tmpOut.amount = oa.reduce((a, b) => Math.max(+a, +b), -Infinity)
              tmpOut.asset = oa[0].asset
              tmpOut.new = true
            } else {
              const nonRuneAsset = oa.find(a => a.asset !== 'THOR.RUNE')
              if (nonRuneAsset) {
                tmpOut.amount = nonRuneAsset.amount
                tmpOut.asset = nonRuneAsset.asset
                tmpOut.new = true
              }

              if (tmpOut.new) {
                swap.outputAsset = { asset: tmpOut.asset, amount: tmpOut.amount }
              }
            }
          }

          const plannedAsset = swapDetails?.planned_out_txs
          if (plannedAsset && plannedAsset.length > 0) {
            if (nonRUNE && plannedAsset[0].coin.asset !== 'THOR.RUNE') {
              swap.outputAsset = {
                asset: plannedAsset[0].coin?.asset,
                amount: plannedAsset[0].coin?.amount
              }
            }
          }

          swap.remaingIntervals = resData[i].interval * (resData[i].quantity - resData[i].count)
          swap.remaningETA = moment.duration(swap.remaingIntervals * 6, 'seconds').humanize()

          swaps.push(swap)
        }
        this.streamingSwaps = swaps
        this.loading = false
      } catch (error) {
        console.error(error)
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

  h3 {
    text-align: center;
  }
}

.streaming-item {
  display: flex;
  justify-content: space-between;
  flex-direction: column;

  .asset-container {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .asset-item {
    display: flex;
    align-items: center;
    gap: 5px;

    .asset-text {
      display: inline-block;
      max-width: 100px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .asset-name {
      display: flex;
      align-items: center;
      gap: 5px;
    }
  }

  .upper-body {
    height: 38px;
    overflow: auto;
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    -ms-overflow-style: none;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

  }

  .extra-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}
</style>
