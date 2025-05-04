<template>
  <card v-if="streamingDetail.is" class="streaming-card">
    <div class="card-header streaming-header">
      <span>Streaming Swap <sup class="header-sup">Live</sup></span>
      <div
        :class="[
          'status-live',
          'mini-bubble',
          { yellow: streamingDetail.count < streamingDetail.quantity },
        ]"
      >
        {{ streamingDetail.status }}
      </div>
    </div>
    <div class="card-body">
      <div class="info-item timer">
        <span>Remaning Time</span>
        <strong class="mono">
          {{ streamingDetail.remIntervalSec }}
        </strong>
      </div>
      <div class="info-item strong">
        <progress-bar :width="streamingDetail.fill * 100" height="4px" />
        <span>Progress</span>
        <span class="mono">
          <span style="color: var(--font-color); font-size: 0.75rem">
            ({{ streamingDetail.count }}/{{ streamingDetail.quantity }})
          </span>
          {{ $options.filters.percent(streamingDetail.fill, 2) }}
        </span>
      </div>
      <span v-if="quoteQuality" class="info-item">
        <span>Execution Quality</span>
        <span>
          {{ quoteQuality | percent(2) }}
        </span>
      </span>
      <hr class="info-hr" />
      <div class="info-item">
        <span>Swapped / Deposited Input</span>
        <span>
          {{ streamingDetail.swappedIn }}
          <span style="color: var(--font-color); font-size: 0.75rem">
            {{ streamingDetail.depositedAsset }}
          </span>
          /
          <span>
            {{ streamingDetail.depositedAmt }}
            <span style="color: var(--font-color); font-size: 0.75rem">
              {{ streamingDetail.depositedAsset }}
            </span>
          </span>
        </span>
      </div>
      <div class="info-item">
        <span>Swapped Input / Output</span>
        <span>
          {{ streamingDetail.swappedIn }}
          <span style="color: var(--font-color); font-size: 0.75rem">
            {{ streamingDetail.depositedAsset }}
          </span>
          →
          <span>
            {{ streamingDetail.swappedOut }}
            <span style="color: var(--font-color); font-size: 0.75rem">
              {{ streamingDetail.targetAsset }}
            </span>
          </span>
        </span>
      </div>
      <span class="info-item">
        <span>Remained Block</span>
        <span>
          {{ streamingDetail.remInterval }}
          <span style="color: var(--font-color); font-size: 0.75rem">
            Blocks
          </span>
        </span>
      </span>
    </div>
  </card>
</template>

<script>
import moment from 'moment'
import { mapGetters } from 'vuex'
import { assetFromString } from '~/utils'

export default {
  props: ['inboundHash', 'quote', 'height'],
  data() {
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
        swappedOut: 0,
        streamingData: undefined,
      },
      intervalId: undefined,
      countdownInterval: undefined,
      durationSeconds: null,
    }
  },
  computed: {
    quoteQuality() {
      if (!this.quote || !this.streamingData) {
        return
      }

      const quoteQuality =
        this.quote.expected_amount_out / this.streamingData.deposit
      const quality = this.streamingData.out / this.streamingData.in

      return 1 - (quoteQuality - quality) / quoteQuality
    },
    ...mapGetters({
      chainsHeight: 'getChainsHeight',
    }),
  },
  mounted() {
    this.updateStreamingDetail(this.inboundHash)

    this.intervalId = setInterval(() => {
      this.updateStreamingDetail(this.inboundHash)
    }, 10000)
  },
  beforeDestroy() {
    clearInterval(this.countdownInterval)
  },
  destroyed() {
    this.clearIntervalId(this.intervalId)
  },
  methods: {
    updateCountdown() {
      if (this.durationSeconds.asSeconds() <= 0) {
        clearInterval(this.countdownInterval)
        this.streamingDetail.remIntervalSec = 'Almost Done'
      }
      this.durationSeconds.subtract(1, 'seconds')
      this.streamingDetail.remIntervalSec = this.createDurationText(
        this.durationSeconds
      )
    },
    async updateStreamingDetail(txid) {
      const thorStatus = (await this.$api.getTxStatus(this.inboundHash))?.data
      const isSwap =
        thorStatus?.stages.swap_status?.streaming &&
        thorStatus?.stages.swap_status?.pending

      let blockDuration
      if (this.height && this.chainsHeight) {
        blockDuration = this.chainsHeight?.THOR - this.height
      }

      // change the remaining seconds to the first height
      if (isSwap) {
        const { count, interval, quantity } =
          thorStatus?.stages?.swap_status?.streaming ?? false
        this.streamingDetail.fill = blockDuration
          ? blockDuration / interval / quantity
          : count / quantity
        if (!this.streamingDetail.count || count > this.streamingDetail.count) {
          this.durationSeconds = moment.duration(
            (interval * quantity - blockDuration) * 6,
            'seconds'
          )
          this.streamingDetail.remIntervalSec = this.createDurationText(
            this.durationSeconds
          )
        }
        this.streamingDetail.count = count
        this.streamingDetail.quantity = quantity
        this.streamingDetail.interval = interval
        this.streamingDetail.remInterval =
          interval * quantity - blockDuration ?? interval * (quantity - count)

        if (!this.countdownInterval) {
          this.countdownInterval = setInterval(this.updateCountdown, 1000)
        }

        if (count < quantity) {
          this.streamingDetail.status = 'On Going'
        } else {
          this.streamingDetail.status = 'Done'
        }

        const { data } = await this.$api.getStreamingSwap(txid)
        this.streamingData = data

        if (data.trade_target) {
          this.streamingDetail.tradeTarget = this.$options.filters.number(
            +data.trade_target / 1e8,
            '0,0.00'
          )
        } else {
          this.streamingDetail.tradeTarget = 0
        }

        const memo = this.parseMemo(thorStatus.tx?.memo)

        // swap user addresses
        const userAddresses = new Set([
          thorStatus.tx.from_address.toLowerCase(),
          memo.destAddr?.toLowerCase(),
        ])
        // Non affiliate outs
        let outTxs = thorStatus.out_txs?.filter((tx) =>
          userAddresses.has(tx.to_address.toLowerCase())
        )
        if (!outTxs) {
          outTxs = thorStatus.planned_out_txs
            ?.filter((tx) => userAddresses.has(tx.to_address.toLowerCase()))
            .map((tx) => ({
              ...tx,
              coins: [{ amount: tx.coin.amount, asset: tx.coin.asset }],
            }))
        }

        // Add native in/out search
        let inAsset = this.parseMemoAsset(
          thorStatus.tx.coins[0].asset,
          this.pools
        )

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
          this.streamingDetail.targetAsset =
            (outAsset?.ticker || outMemoAsset?.ticker) ?? ''
        } else {
          this.streamingDetail.depositedAsset = ''
          this.streamingDetail.targetAsset = ''
        }

        if (data.deposit) {
          this.streamingDetail.depositedAmt = this.$options.filters.number(
            +data.deposit / 1e8,
            '0,0.00'
          )
        } else {
          this.streamingDetail.depositedAmt = 0
        }

        if (data.in) {
          this.streamingDetail.swappedIn = this.$options.filters.number(
            +data.in / 1e8,
            '0,0.00'
          )
        } else {
          this.streamingDetail.swappedIn = 0
        }

        if (data.out) {
          this.streamingDetail.swappedOut = this.$options.filters.number(
            +data.out / 1e8,
            '0,0.00'
          )
        } else {
          this.streamingDetail.swappedOut = 0
        }

        this.streamingDetail.is =
          !thorStatus?.stages.swap_finalised?.completed ||
          thorStatus?.stages.swap_status?.pending
      } else {
        this.streamingDetail.is = false
      }
    },
  },
}
</script>

<style lang="scss">
.streaming-card {
  max-width: 680px !important;
  margin: 0 10px;
  @include lg{
    margin: auto !important;
    width: 100% !important;
  }
}
.streaming-header {
  display: flex;
  justify-content: space-between;
  padding: $space-5 $space-0 $space-14 $space-0 !important;

  span {
    color: var(--sec-font-color) !important;
  }
}

.info-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $space-8;
  margin: $space-10 $space-0;

  span {
    font-size: $font-size-mobile;
    color: var(--sec-font-color);
  }

  &.timer {
    strong {
      display: block;
      font-size: $font-size-mobile;
      padding: $space-3 $space-5;
      border-radius: $radius-s;
      color: var(--primary-color);
      background-color: #63fdd927;
    }
  }

  &.strong span {
    font-size: $font-size-mobile;
  }
}

.header-sup {
  font-size: $font-size-xxs;
  color: #f04832;
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
      color: #ffc700;
      border-color: rgba(255, 156, 8, 0.25);
    }
    50% {
      color: #ffe897;
      border-color: rgba(255, 206, 132, 0.25);
    }
  }
}
</style>
