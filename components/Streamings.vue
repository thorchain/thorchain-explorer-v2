<template>
  <Card :is-loading="loading" title="Ongoing Streaming Swaps">
    <template #header>
      <dot-live />
    </template>
    <div v-if="noStreaming" class="no-streaming">
      <streamingIcon class="streaming-icon large-icon" />
      <h3>There is no streaming swaps ongoing at the moment.</h3>
    </div>
    <template v-for="(o, i) in streamingSwaps" v-else>
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
            <span class="clickable" @click="gotoTx(o.tx_id)">{{ formatAddress(o.tx_id) }}</span>
          </small>
        </div>
        <div class="extra-info">
          <progress-bar v-if="o.quantity > 0" :width="(o.count / o.quantity) * 100" height="4px" />
          <small style="white-space: nowrap;">
            {{ $options.filters.percent(o.count / o.quantity) }}
          </small>
        </div>
        <small style="margin-top: 5px">{{ o.interval }} Blocks / Swap <span class="sec-color">({{ o.remaningETA }})</span></small>
      </div>
      <hr :key="i + '-hr'" class="hr-space">
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
      noStreaming: false,
      loading: true,
      streamingSwaps: []
    }
  },
  async mounted () {
    await this.updateStreamingSwap()

    // Update the component every 20 secs
    setInterval(() => {
      this.updateStreamingSwap(this.inboundHash)
    }, 20000)
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

            let oamount = 0
            let oasset = ''
            if (oa.every(a => a.asset === 'THOR.RUNE') && !nonRUNE) {
              oamount = oa.reduce((a, b) => Math.max(+a, +b), -Infinity)
              oasset = oa[0].asset
            } else {
              const nonRuneAsset = oa.find(a => a.asset !== 'THOR.RUNE')
              if (nonRuneAsset) {
                oamount = nonRuneAsset.amount
                oamount = nonRuneAsset.asset
              }
            }

            swap.outputAsset = {
              ...(oasset !== '' ? { asset: oasset } : {}),
              amount: oamount
            }
          }

          const plannedAsset = swapDetails?.planned_out_txs
          if (plannedAsset && plannedAsset.length > 0) {
            if (nonRUNE && plannedAsset[0].coin !== 'THOR.RUNE') {
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
    padding-top: 8px;
    gap: 10px;
  }
}
</style>
