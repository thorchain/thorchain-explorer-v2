<template>
  <Card
    body-class="streaming-flex"
    :navs="[
      { title: 'Streaming Swaps', value: 'streaming-swaps' },
      { title: 'Swap queue', value: 'swap-queue' },
    ]"
    :act-nav.sync="mode"
  >
    <template #header>
      <dot-live />
    </template>
    <template v-if="mode == 'streaming-swaps'">
      <div v-if="streamingSwaps.length > 0 || loading" class="custom-card">
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
                streamingSwaps.length
              }}</span>
              <div v-else class="mini-skeleton"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="dashboard-card">
        <div v-if="noStreaming" class="no-streaming">
          <streamingIcon class="streaming-icon large-icon" />
          <h3>There is no streaming swaps ongoing at the moment.</h3>
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
          <template v-for="(o, i) in filteredStreamingSwaps">
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
                  :width="(o.count / o.quantity) * 100"
                  height="4px"
                />
                <small style="white-space: nowrap">
                  {{ $options.filters.percent(o.count / o.quantity) }}
                </small>
              </div>

              <small v-if="o.interval && o.quantity && o.count !== undefined" style="margin-top: 5px"
                >{{ o.interval }} Blocks / Swap
                <span class="sec-color"
                  ><small style="color: var(--font-color)">(ETA </small>
                  {{ calculateETA(o.interval, o.quantity, o.count) }}
                  <small style="color: var(--font-color)"
                    >, Remaining swaps: {{ o.quantity - o.count }}</small
                  >
                  <small style="color: var(--font-color)">)</small>
                </span>
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
        v-if="streamingSwaps.length > perPage"
        v-model="currentPage"
        class="center"
        :total-rows="streamingSwaps.length"
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
      noStreaming: false,
      loading: true,
      streamingSwaps: [],
      intervalId: undefined,
      perPage: 7,
      totalSumAmount: 0,
      mode: 'streaming-swaps',
      swapQueue: [],
      queueLoading: true,
    }
  },
  computed: {
    filteredStreamingSwaps() {
      return this.streamingSwaps.slice(
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
    }),
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
        this.noStreaming = false
        const resData = (await this.$api.getStreamingSwaps()).data

        if (!resData || resData.length === 0) {
          this.noStreaming = true
          this.streamingSwaps = []
          this.loading = false
          this.totalSumAmount = 0
          return
        }

        this.totalSumAmount = resData.reduce((a, c) => {
          const inputUsdValue = this.amountToUSD(
            c.source_asset,
            c.deposit,
            this.pools
          )
          return a + inputUsdValue
        }, 0)

        this.streamingSwaps = resData
        this.loading = false
      } catch (error) {
        console.error(error)
        this.noStreaming = true
        this.loading = false
        this.streamingSwaps = []
      }
    },
    calculateETA(interval, quantity, count) {
      if (!interval || !quantity || count === undefined) return '-'
      const remainingIntervals = interval * (quantity - count)
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
      // Swap queue
      this.queueLoading = true
      const queue = (await this.$api.getSwapQueue()).data
      this.swapQueue = queue || []
      this.queueLoading = false
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
