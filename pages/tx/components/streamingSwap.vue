<template>
  <div v-if="streamingDetail.is" class="card streaming-card">
    <div class="card-header streaming-header">
      <span>Streaming Swap <sup class="header-sup">Live</sup></span>
      <dot-live />
    </div>
    <div class="card-body">
      <div class="info-item">
        <span>Status</span>
        <div :class="['mini-bubble', {'yellow': streamingDetail.count < streamingDetail.quantity}]">
          {{ streamingDetail.status }}
        </div>
      </div>
      <div class="info-item">
        <span>Fill</span>
        <span>
          <span style="color: var(--font-color); font-size: .75rem;">
            ({{ streamingDetail.count }}/{{ streamingDetail.quantity }})
          </span>
          {{ $options.filters.percent(streamingDetail.fill, 2) }}
        </span>
        <progress-bar :width="streamingDetail.fill * 100" height="4px" />
      </div>
      <div class="info-item">
        <span>Remaining Intervals</span>
        <span>
          {{ streamingDetail.remIntervalSec }}
          <span>
            ( {{ streamingDetail.remInterval }} blocks)
          </span>
        </span>
      </div>
      <div class="info-item">
        <span>Trade Target</span>
        <span>
          {{ streamingDetail.tradeTarget }}
          <span style="color: var(--font-color); font-size: .75rem;">
            {{ streamingDetail.targetAsset }}
          </span>
        </span>
      </div>
      <div class="info-item">
        <span>Deposited / Swapped Input</span>
        <span>
          {{ streamingDetail.depositedAmt }}
          <span style="color: var(--font-color); font-size: .75rem;">
            {{ streamingDetail.depositedAsset }}
          </span>
          /
          <span>
            {{ streamingDetail.swappedIn }}
            <span style="color: var(--font-color); font-size: .75rem;">
              {{ streamingDetail.depositedAsset }}
            </span>
          </span>
        </span>
      </div>
      <div class="info-item">
        <span>Swapped Output</span>
        <span>
          {{ streamingDetail.swappedIn }}
          <span style="color: var(--font-color); font-size: .75rem;">
            {{ streamingDetail.depositedAsset }}
          </span>
          →
          <span>
            {{ streamingDetail.swappedOut }}
            <span style="color: var(--font-color); font-size: .75rem;">
              {{ streamingDetail.targetAsset }}
            </span>
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'

export default {
  props: ['inboundHash'],
  data () {
    return {
      streamingDetail: {
        is: false,
        fill: 0,
        count: 0,
        quantity: 1,
        interval: 1,
        remInterval: 1,
        remIntervalSec: 1,
        tradeTarget: 0,
        targetAsset: '',
        depositedAmt: 0,
        depositedAsset: '',
        swappedIn: 0,
        swappedOut: 0
      },
      intervalId: undefined
    }
  },
  mounted () {
    this.updateStreamingDetail(this.inboundHash)

    this.intervalId = setInterval(() => {
      this.updateStreamingDetail(this.inboundHash)
    }, 10000)
  },
  destroyed () {
    this.clearIntervalId(this.intervalId)
  },
  methods: {
    async updateStreamingDetail (txid) {
      const thorStatus = (await this.$api.getTxStatus(this.inboundHash))?.data
      const isSwap = thorStatus.stages.swap_status?.streaming

      console.log(isSwap)
      if (isSwap) {
        const { count, interval, quantity } = thorStatus.stages.swap_status?.streaming
        this.streamingDetail.fill = count / quantity
        this.streamingDetail.count = count
        this.streamingDetail.quantity = quantity
        this.streamingDetail.interval = interval
        this.streamingDetail.remInterval = interval * (quantity - count)
        this.streamingDetail.remIntervalSec = moment.duration(this.streamingDetail.remInterval * 6, 'seconds').humanize()
        if (count < quantity) {
          this.streamingDetail.status = 'On Going'
        } else {
          this.streamingDetail.status = 'Done'
        }

        const { data } = await this.$api.getStreamingSwap(txid)
        if (data.trade_target) {
          this.streamingDetail.tradeTarget = this.$options.filters.number(+data.trade_target / 1e8, '0,0.00')
        } else {
          this.streamingDetail.tradeTarget = 0
        }

        const memo = this.parseMemo(thorStatus.tx?.memo)

        // swap user addresses
        const userAddresses = new Set([
          thorStatus.tx.from_address.toLowerCase(),
          memo.destAddr?.toLowerCase()
        ])
        // Non affiliate outs
        let outTxs = thorStatus.out_txs?.filter(tx =>
          userAddresses.has(tx.to_address.toLowerCase())
        )
        if (!outTxs) {
          outTxs = thorStatus.planned_out_txs
            ?.filter(tx => userAddresses.has(tx.to_address.toLowerCase()))
            .map(tx => ({
              ...tx,
              coins: [{ amount: tx.coin.amount, asset: tx.coin.asset }]
            }))
        }

        // Add native in/out search
        const inAsset = this.parseMemoAsset(thorStatus.tx.coins[0].asset, this.pools)

        const outAsset = this.parseMemoAsset(
          outTxs?.length > 0 ? outTxs[0].coins[0].asset : memo.asset,
          this.pools
        )

        const outMemoAsset = this.parseMemoAsset(memo.asset)

        if (this.tx?.inAsset && this.tx?.outAsset) {
          this.streamingDetail.depositedAsset = inAsset?.ticker ?? ''
          this.streamingDetail.targetAsset = (outAsset?.ticker || outMemoAsset?.ticker) ?? ''
        } else {
          this.streamingDetail.depositedAsset = ''
          this.streamingDetail.targetAsset = ''
        }

        if (data.deposit) {
          this.streamingDetail.depositedAmt = this.$options.filters.number(+data.deposit / 1e8, '0,0.00')
        } else {
          this.streamingDetail.depositedAmt = 0
        }

        if (data.in) {
          this.streamingDetail.swappedIn = this.$options.filters.number(+data.in / 1e8, '0,0.00')
        } else {
          this.streamingDetail.swappedIn = 0
        }

        if (data.out) {
          this.streamingDetail.swappedOut = this.$options.filters.number(+data.out / 1e8, '0,0.00')
        } else {
          this.streamingDetail.swappedOut = 0
        }

        this.streamingDetail.is = true
        console.log(this.streamingDetail)
      }
    }
  }
}
</script>

<style lang="scss">
.streaming-card {
  max-width: 640px;
  width: 100%;
  margin: auto;
}
.streaming-header {
  display: flex;
  justify-content: space-between;

  span {
    color: var(--sec-font-color) !important;
  }
}

.info-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: .5rem;
  margin: 10px 0;

  span {
    font-size: .9rem;
    color: var(--sec-font-color);
  }
}

.header-sup {
  font-size: .6rem;
  color: #F04832;
}
</style>
