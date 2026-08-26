<template>
  <Card
    body-class="streaming-flex"
    :navs="[
      { title: 'Streaming Swaps', value: 'streaming-swaps' },
      { title: 'Limit Orders', value: 'limit-orders' },
      { title: 'Swap queue', value: 'swap-queue' },
    ]"
    :act-nav.sync="mode"
  >
    <template #header>
      <dot-live />
    </template>
    <template v-if="mode !== 'swap-queue'">
      <div v-if="activeSwaps.length > 0 || loading" class="custom-card">
        <div class="overview-box">
          <div class="stats-container">
            <div>
              <span class="item-value"> Amount: </span>
              <span
                v-if="totalSumAmount && !loading"
                class="total-swaps mono"
                style="padding-right: 1rem"
              >
                ${{ totalSumAmount | number('0a') }}
              </span>
              <div v-else-if="loading" class="mini-skeleton"></div>
              <span v-else>-</span>
            </div>
            <div>
              <span class="item-value"> Count: </span>
              <span v-if="!loading" class="total-swaps mono">{{
                activeSwaps.length
              }}</span>
              <div v-else class="mini-skeleton"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="dashboard-card">
        <div v-if="isEmpty" class="no-streaming">
          <streamingIcon class="streaming-icon large-icon" />
          <h3 v-if="mode === 'limit-orders'">
            There is no limit orders resting at the moment.
          </h3>
          <h3 v-else>There is no streaming swaps ongoing at the moment.</h3>
        </div>
        <template v-else-if="loading">
          <div v-for="index in 5" :key="index" class="streaming-item">
            <div class="upper-body">
              <div class="asset-container">
                <div class="asset-item">
                  <skeleton-loader width="24px" height="24px" />
                  <skeleton-loader width="80px" />
                </div>

                <right-arrow
                  style="fill: var(--active-bg-color)"
                  class="action-type"
                />
                <div class="asset-item">
                  <skeleton-loader width="24px" height="24px" />
                  <skeleton-loader width="80px" height="10px" />
                </div>
              </div>
              <skeleton-loader width="120px" />
            </div>
            <skeleton-loader width="200px" />
            <hr :key="i + '-hr'" class="skeleton-hr" />
          </div>
        </template>
        <template v-else>
          <template v-for="(o, i) in pagedSwaps">
            <div :key="i" class="streaming-item">
              <div class="upper-body">
                <div class="asset-container">
                  <div v-if="o.source_asset" class="asset-item">
                    <asset-icon :asset="o.source_asset" />
                    <span class="asset-name">
                      {{
                        $options.filters.number(
                          (o.deposit || 0) / 1e8,
                          '0,0.0000'
                        )
                      }}
                      <small class="asset-text sec-color">{{
                        showAsset(o.source_asset)
                      }}</small>
                    </span>
                  </div>
                  <stream-icon v-if="isTradeTargetZero(o)" class="action-type">
                    ~
                  </stream-icon>
                  <right-arrow v-else class="action-type" />
                  <div v-if="o.target_asset" class="asset-item">
                    <asset-icon :asset="o.target_asset" />
                    <span class="asset-name">
                      {{getOutputAmount(o)}}
                      <small class="asset-text sec-color">
                        {{ showAsset(o.target_asset) }}
                      </small>
                    </span>
                  </div>
                </div>
                <small v-if="o.tx_id" class="sec-color mono">
                  <NuxtLink
                    v-if="isValidTx(o.tx_id)"
                    class="clickable"
                    :to="{ path: `/tx/${o.tx_id}` }"
                  >
                    {{ formatAddress(o.tx_id) }}
                  </NuxtLink>
                </small>
              </div>

              <div v-if="o.quantity && o.count !== undefined" class="extra-info">
                <progress-bar
                  v-if="o.quantity > 0"
                  :width="(successfulCount(o) / o.quantity) * 100"
                  height="4px"
                />
                <small style="white-space: nowrap">
                  {{ $options.filters.percent(successfulCount(o) / o.quantity) }}
                </small>
              </div>

              <small
                v-if="o.interval && o.quantity && o.count !== undefined"
                style="margin-top: 5px"
              >
                <template v-if="isLimitOrder(o)">
                  <small style="color: var(--font-color)">Expires in </small>
                  <span class="sec-color">{{ calculateETA(o) }}</span>
                  <small style="color: var(--font-color)">
                    , filled: {{ successfulCount(o) }}/{{ o.quantity }}</small
                  >
                </template>
                <template v-else
                  >{{ o.interval }} Blocks / Swap
                  <span class="sec-color"
                    ><small style="color: var(--font-color)">(ETA </small>
                    {{ calculateETA(o) }}
                    <small style="color: var(--font-color)"
                      >, Remaining swaps: {{ o.quantity - successfulCount(o) }}</small
                    >
                    <small style="color: var(--font-color)">)</small>
                  </span>
                </template>
              </small>
            </div>
            <hr :key="i + '-hr'" class="hr-space" />
          </template>
        </template>
      </div>
      <nuxt-link to="/swaps" class="swaps-nav">TOP Swaps (24hr)</nuxt-link>
    </template>
    <template v-else-if="mode === 'swap-queue'">
      <div class="dashboard-card">
        <div
          v-if="swapQueue.length === 0 && !queueLoading"
          class="no-streaming"
        >
          <streamingIcon class="streaming-icon large-icon" />
          <h3>There is no swaps queue at the moment.</h3>
        </div>
        <template v-else-if="queueLoading">
          <div v-for="index in 5" :key="index" class="streaming-item">
            <div class="upper-body">
              <div class="asset-container">
                <div class="asset-item">
                  <skeleton-loader width="24px" height="24px" />
                  <skeleton-loader width="80px" />
                </div>

                <right-arrow
                  style="fill: var(--active-bg-color)"
                  class="action-type"
                />
                <div class="asset-item">
                  <skeleton-loader width="24px" height="24px" />
                  <skeleton-loader width="80px" height="10px" />
                </div>
              </div>
            </div>
            <hr :key="i + '-hr'" class="skeleton-hr" />
          </div>
        </template>
        <template v-else>
          <template v-for="(o, i) in filteredSwapQueue">
            <div :key="i" class="streaming-item">
              <div class="upper-body" style="margin-bottom: 0">
                <div class="asset-container">
                  <div
                    v-if="o.tx && o.tx.coins && o.tx.coins.length > 0"
                    class="asset-item"
                  >
                    <asset-icon :asset="o.tx.coins[0].asset" />
                    <span class="asset-name">
                      {{
                        $options.filters.number(
                          o.tx.coins[0].amount / 1e8,
                          '0,0.0000'
                        )
                      }}
                      <small class="asset-text sec-color">
                        {{ showAsset(o.target_asset) }}
                      </small>
                    </span>
                  </div>
                  <right-arrow class="action-type" />
                  <div v-if="o.target_asset" class="asset-item">
                    <asset-icon :asset="o.target_asset" />
                    <span class="asset-name">
                      <template v-if="o.target_asset">{{
                        $options.filters.number(
                          o.trade_target / 1e8,
                          '0,0.0000'
                        )
                      }}</template>
                      <small class="asset-text sec-color">
                        {{ showAsset(o.target_asset) }}
                      </small>
                    </span>
                  </div>
                </div>
                <small v-if="o.tx" class="sec-color mono">
                  <span v-if="o.swap_type === 'limit'" class="mini-bubble info">
                    Limit
                  </span>
                  <NuxtLink
                    v-if="isValidTx(o.tx.id)"
                    class="clickable"
                    :to="{ path: `/tx/${o.tx.id}` }"
                  >
                    {{ formatAddress(o.tx.id) }}
                  </NuxtLink>
                </small>
              </div>

              <small style="margin-top: 5px">
                Quantity: {{ o.stream_quantity || 1 }} / Interval:
                {{ o.stream_interval || 0 }}
              </small>
            </div>
            <hr :key="i + '-hr'" class="hr-space" />
          </template>
        </template>
      </div>
    </template>

    <template #footer>
      <b-pagination
        v-if="paginationTotal > perPage"
        v-model="currentPage"
        class="center"
        :total-rows="paginationTotal"
        :per-page="perPage"
      />
    </template>
  </Card>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import streamingIcon from '@/assets/images/streaming.svg?inline'
import RightArrow from '~/assets/images/arrow-right.svg?inline'
import StreamIcon from '~/assets/images/stream.svg?inline'
import SkeletonLoader from '~/components/SkeletonLoader.vue'

export default {
  components: { streamingIcon, RightArrow, StreamIcon, SkeletonLoader },
  data() {
    return {
      currentPage: 1,
      loading: true,
      streamingSwaps: [],
      intervalId: undefined,
      perPage: 7,
      mode: 'streaming-swaps',
      swapQueue: [],
      queueLoading: true,
    }
  },
  computed: {
    // Resting limit orders are served by the same `swaps/streaming` endpoint
    // as genuine streaming swaps, so split them into their own tab: their
    // interval/quantity semantics and progress mean different things.
    realStreamingSwaps() {
      return this.streamingSwaps.filter((s) => !this.isLimitOrder(s))
    },
    limitOrderSwaps() {
      return this.streamingSwaps.filter((s) => this.isLimitOrder(s))
    },
    activeSwaps() {
      return this.mode === 'limit-orders'
        ? this.limitOrderSwaps
        : this.realStreamingSwaps
    },
    isEmpty() {
      return !this.loading && this.activeSwaps.length === 0
    },
    totalSumAmount() {
      return this.activeSwaps.reduce(
        (a, c) => a + this.amountToUSD(c.source_asset, c.deposit, this.pools),
        0
      )
    },
    paginationTotal() {
      return this.mode === 'swap-queue'
        ? this.swapQueue.length
        : this.activeSwaps.length
    },
    pagedSwaps() {
      return this.activeSwaps.slice(
        (this.currentPage - 1) * this.perPage,
        this.currentPage * this.perPage
      )
    },
    filteredSwapQueue() {
      return this.swapQueue.slice(
        (this.currentPage - 1) * this.perPage,
        this.currentPage * this.perPage
      )
    },
    ...mapGetters({
      pools: 'getPools',
      chainsHeight: 'getChainsHeight',
    }),
    // Resting limit orders still show up in the swap queue (with `swap_type`
    // and the raw memo) while they're active, so cross-reference by tx id to
    // tell them apart from ordinary streaming swaps.
    limitOrderTxIds() {
      return new Set(
        (this.swapQueue || [])
          .filter((q) => q.swap_type === 'limit' && q.tx?.id)
          .map((q) => q.tx.id)
      )
    },
  },
  watch: {
    pools(n, o) {
      this.updateStreamingSwap()
    },
    mode(n, o) {
      this.currentPage = 1
    },
  },
  mounted() {
    this.updateSwapQueue()
    this.intervalId = setInterval(() => {
      this.updateStreamingSwap()
      this.updateSwapQueue()
    }, 10000)
  },
  destroyed() {
    clearInterval(this.intervalId)
  },
  methods: {
    async updateStreamingSwap() {
      try {
        const resData = (await this.$api.getStreamingSwaps()).data

        // Only show streamings that have started (have non-zero input swapped).
        this.streamingSwaps = (resData || []).filter(
          (s) => Number(s?.in || 0) > 0
        )
        this.loading = false
      } catch (error) {
        console.error(error)
        this.loading = false
        this.streamingSwaps = []
      }
    },
    // thornode's `count` is a cumulative retry-attempt counter — it
    // increments on every price-check tick, including failed ones, so it can
    // exceed `quantity` for resting/limit orders that retry many times
    // before filling. The actual number of executed chunks is the attempt
    // count minus the failed attempts.
    successfulCount(o) {
      return Math.max((o.count || 0) - (o.failed_swaps?.length || 0), 0)
    },
    isLimitOrder(o) {
      return this.limitOrderTxIds.has(o.tx_id)
    },
    calculateETA(o) {
      const { interval, quantity } = o
      if (!interval || !quantity || o.count === undefined) return '-'

      if (this.isLimitOrder(o)) {
        // For a resting limit order `interval` IS the full TTL window in
        // blocks from order creation to expiry, not a per-chunk gap —
        // thornode's own limit-order queue confirms blocks_since_created +
        // time_to_expiry_blocks === interval. There's no way to predict
        // when (or if) price will clear, so the only meaningful "ETA" here
        // is the time left before the order expires.
        const blockDuration =
          o.initial_height && this.chainsHeight
            ? this.chainsHeight.THOR - o.initial_height
            : 0
        const remainingBlocks = Math.max(interval - blockDuration, 0)
        return moment.duration(remainingBlocks * 6, 'seconds').humanize()
      }

      const count = this.successfulCount(o)
      const remainingIntervals = interval * Math.max(quantity - count, 0)
      return moment.duration(remainingIntervals * 6, 'seconds').humanize()
    },
    getOutputAmount(swap) {
      if (!swap) return 0
      if (swap.trade_target === '0' || swap.trade_target === 0 || !swap.trade_target) {
        return '> ' + this.$options.filters.number((swap.out || 0) / 1e8, '0,0.0000')
      }
      return this.$options.filters.number( swap.trade_target / 1e8, '0,0.0000')
    },
    isTradeTargetZero(swap) {
      if (!swap) return false
      return swap.trade_target === '0' || swap.trade_target === 0 || !swap.trade_target
    },
    async updateSwapQueue() {
      try {
        const queue = (await this.$api.getSwapQueue()).data
        this.swapQueue = queue || []
      } catch (error) {
        console.error(error)
        this.swapQueue = []
      } finally {
        this.queueLoading = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.dashboard-card {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.swaps-nav {
  margin-top: $space-16 !important;
}

.overview-box {
  width: 100%;
  text-align: center;
}

.title {
  font-weight: 600;
  color: var(--font-color);
  animation: fadeIn 0.5s ease;
}

.stats-container {
  display: flex;
  flex-direction: column;
  align-items: center;

  @include md {
    flex-direction: row;
    justify-content: space-between;

    div {
      display: flex;
      justify-content: center;
      gap: 1rem;

      &:first-child {
        flex: 2;
        border-bottom: none !important;
        border-right: 1px solid var(--primary-color);
      }
    }
  }

  div {
    flex: 1;
    padding: $space-5;
    margin: $space-0;
    animation: slideIn 0.5s ease;

    @include md {
      padding: $space-0;
    }

    &:first-child {
      border-bottom: 1px solid var(--primary-color);
    }
  }
}

.total-swaps {
  color: var(--sec-font-color);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.no-streaming {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: $space-16;

  .streaming-icon {
    fill: var(--font-color);
  }

  h3 {
    text-align: center;
  }
}
.action-type {
  box-sizing: content-box;
  height: 1rem;
  width: 1rem;
  fill: var(--sec-font-color);
  padding: $space-4;
}
.streaming-item {
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  padding-bottom: $space-10;

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
      gap: $space-5;
    }
  }

  .upper-body {
    height: 42px;
    overflow: auto;
    display: flex;
    align-items: center;
    margin-bottom: $space-10;
    -ms-overflow-style: none;
    scrollbar-width: none;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: $space-5;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .extra-info {
    display: flex;
    align-items: center;
    gap: $space-10;
  }
}

.custom-card {
  display: flex;
  border: 1px solid var(--border-color);
  border-radius: $radius-lg;
  padding: $space-12;
  margin-bottom: $space-8;
}

.mini-skeleton {
  background-color: var(--active-bg-color);
  border-radius: $radius-2xl;
  box-sizing: border-box !important;
  overflow: hidden !important;
  margin-top: 5px !important;
  width: 50px !important;
  height: 7px !important;
  max-width: 60px !important;
}

.skeleton-hr {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: $space-4 0;
}
</style>
