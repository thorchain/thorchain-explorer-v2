<template>
  <div v-if="streamingDetail.is" class="card streaming-card">
    <div class="card-header streaming-header">
      <span>Streaming Swap <sup class="header-sup">Live</sup></span>
      <div :class="['status-live', 'mini-bubble', {'yellow': streamingDetail.count < streamingDetail.quantity}]">
        {{ streamingDetail.status }}
      </div>
    </div>
    <div class="card-body">
      <div class="info-item center timer">
        <strong class="mono">
          {{ streamingDetail.remIntervalSec }}
        </strong>
      </div>
      <div class="info-item strong">
        <progress-bar :width="streamingDetail.fill * 100" height="4px" />
        <span>Progress</span>
        <span class="mono">
          <span style="color: var(--font-color); font-size: .75rem;">
            ({{ streamingDetail.count }}/{{ streamingDetail.quantity }})
          </span>
          {{ $options.filters.percent(streamingDetail.fill, 2) }}
        </span>
      </div>
      <hr class="info-hr">
      <div class="info-item">
        <span>Swapped / Deposited Input</span>
        <span>
          {{ streamingDetail.swappedIn }}
          <span style="color: var(--font-color); font-size: .75rem;">
            {{ streamingDetail.depositedAsset }}
          </span>
          /
          <span>
            {{ streamingDetail.depositedAmt }}
            <span style="color: var(--font-color); font-size: .75rem;">
              {{ streamingDetail.depositedAsset }}
            </span>
          </span>
        </span>
      </div>
      <div class="info-item">
        <span>Swapped Input / Output</span>
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
      <span class="info-item">
        <span>Remained Block</span>
        <span>
          {{ streamingDetail.remInterval }}
          <span style="color: var(--font-color); font-size: .75rem;">
            Blocks
          </span>
        </span>
      </span>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import { assetFromString } from '~/utils'

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
      intervalId: undefined,
      countdownInterval: undefined,
      durationSeconds: null
    }
  },
  mounted () {
    this.updateStreamingDetail(this.inboundHash)

    this.intervalId = setInterval(() => {
      this.updateStreamingDetail(this.inboundHash)
    }, 10000)
  },
  beforeDestroy() {
    clearInterval(this.countdownInterval) 
  },
  destroyed () {
    this.clearIntervalId(this.intervalId)
  },
  methods: {
    updateCountdown() {
      this.durationSeconds.subtract(1, 'seconds')
      this.streamingDetail.remIntervalSec = this.createDurationText(this.durationSeconds)
    },
    createDurationText(duration) {
      const hours = String(duration.hours()).padStart(2, '0');
      const minutes = String(duration.minutes()).padStart(2, '0');
      const seconds = String(duration.seconds()).padStart(2, '0'); 

      return `${hours} : ${minutes} : ${seconds}`
    },
    async updateStreamingDetail (txid) {
      const thorStatus = (await this.$api.getTxStatus(this.inboundHash))?.data
      const isSwap = thorStatus.stages.swap_status?.streaming && thorStatus.stages.swap_status?.pending

      if (isSwap) {
        const { count, interval, quantity } = thorStatus.stages.swap_status?.streaming
        this.streamingDetail.fill = count / quantity
        if (!this.streamingDetail.count || count > this.streamingDetail.count) {
          this.durationSeconds = moment.duration(interval * (quantity - count) * 6, 'seconds')
          this.streamingDetail.remIntervalSec = this.createDurationText(this.durationSeconds)
        }
        this.streamingDetail.count = count
        this.streamingDetail.quantity = quantity
        this.streamingDetail.interval = interval
        this.streamingDetail.remInterval = interval * (quantity - count)

        if (!this.countdownInterval) {
          this.countdownInterval = setInterval(this.updateCountdown, 1000);
        }

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
        let inAsset = this.parseMemoAsset(thorStatus.tx.coins[0].asset, this.pools)

        let outAsset = this.parseMemoAsset(
          outTxs?.length > 0 ? outTxs[0].coins[0].asset : memo.asset,
          this.pools
        )

        if (typeof inAsset === 'string') {
          inAsset = assetFromString(inAsset)
        }

        if (typeof outAsset === 'string') {
          outAsset = assetFromString(outAsset)
        }

        const outMemoAsset = this.parseMemoAsset(memo.asset)

        if (inAsset && outAsset) {
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

        this.streamingDetail.is = !thorStatus.stages.swap_finalised?.completed ||
        thorStatus.stages.swap_status?.pending
      } else {
        this.streamingDetail.is = false
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

  &.center {
    justify-content: center;

    strong {
      font-size: 1.5rem;
    }
  }

  &.timer {
    strong {
      display: block;
      padding: .3rem .4rem;
      border-radius: .4rem;
      color: var(--primary-color);
      background-color: #63fdd927;
    }
  }

  &.strong span {
    font-size: 0.9rem;
  }
}

.header-sup {
  font-size: .6rem;
  color: #F04832;
}

.info-hr {
  border: none;
  border-bottom: 1px solid var(--border-color);
}

.status-live {
  position: relative;
  animation: bubblePulse 1300ms cubic-bezier(0.9, 0.7, 0.5, 0.9) infinite;

  @keyframes bubblePulse {
    0% {
      color: #FFC700;
      border-color: rgba(255, 156, 8, 0.25);
    }
    50% {
      color: #ffe897;
      border-color: rgba(255, 206, 132, 0.25);
    }
  }
}
</style>
