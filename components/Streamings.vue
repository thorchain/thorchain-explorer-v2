<template>
  <Card
    :is-loading="loading"
    title="Ongoing Streaming Swaps"
    body-class="streaming-flex"
  >
    <template #header>
      <dot-live />
    </template>
    <div v-if="streamingSwaps.length > 0" class="custom-card">
      <div class="overview-box">
        <div class="stats-container">
          <div>
            <span class="item-value"> Amount: </span>
            <span
              v-if="totalSumAmount"
              class="total-swaps mono"
              style="padding-right: 1rem"
            >
              ${{ totalSumAmount | number('0a') }}
            </span>
            <span v-else>-</span>
          </div>
          <div>
            <span class="item-value"> Count: </span>
            <span class="total-swaps mono">{{ streamingSwaps.length }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="dashboard-card">
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
                  {{
                    $options.filters.number(
                      o.inputAsset.amount / 1e8,
                      '0,0.0000'
                    )
                  }}
                  <small class="asset-text sec-color">{{
                    o.inputAsset.asset
                  }}</small>
                </span>
              </div>
              <right-arrow class="action-type" />
              <div v-if="o.outputAsset" class="asset-item">
                <asset-icon :asset="o.outputAsset.asset" />
                <span class="asset-name">
                  <template v-if="o.outputAsset.amount">{{
                    $options.filters.number(
                      o.outputAsset.amount / 1e8,
                      '0,0.0000'
                    )
                  }}</template>
                  <small class="asset-text sec-color">
                    {{ showAsset(o.outputAsset.asset) }}
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

          <div class="extra-info">
            <progress-bar
              v-if="o.quantity > 0"
              :width="(o.count / o.quantity) * 100"
              height="4px"
            />
            <small style="white-space: nowrap">
              {{ $options.filters.percent(o.count / o.quantity) }}
            </small>
          </div>

          <small style="margin-top: 5px"
            >{{ o.interval }} Blocks / Swap
            <span class="sec-color"
              ><small style="color: var(--font-color)">(ETA </small>
              {{ o.remaningETA }}
              <small style="color: var(--font-color)"
                >, Remaining swaps: {{ o.quantity - o.count }}</small
              >
              <small style="color: var(--font-color)">)</small>
            </span>
          </small>
        </div>
        <hr :key="i + '-hr'" class="hr-space" />
      </template>
    </div>
    <nuxt-link to="/swaps" class="swaps-nav">TOP Swaps (24hr)</nuxt-link>

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
import { shortAssetName } from '~/utils'
import streamingIcon from '@/assets/images/streaming.svg?inline'
import RightArrow from '~/assets/images/arrow-right.svg?inline'

export default {
  components: { streamingIcon, RightArrow },
  data() {
    return {
      currentPage: 1,
      noStreaming: false,
      loading: true,
      streamingSwaps: [],
      intervalId: undefined,
      perPage: 7,
      totalSumAmount: 0,
    }
  },
  computed: {
    filteredStreamingSwaps() {
      return this.streamingSwaps.slice(
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
  },
  mounted() {
    this.intervalId = setInterval(() => {
      this.updateStreamingSwap()
    }, 10000)
  },
  destroyed() {
    clearInterval(this.intervalId)
  },
  methods: {
    async updateStreamingSwap() {
      this.noStreaming = false
      const resData = (await this.$api.getStreamingSwaps()).data
      this.totalSumAmount = resData?.reduce((a, c) => {
        const inputUsdValue = this.amountToUSD(
          c.source_asset,
          c.deposit,
          this.pools
        )
        return a + inputUsdValue
      }, 0)

      if (!resData || resData.length === 0) {
        this.noStreaming = true
        this.streamingSwaps = []
        this.loading = false
        return
      }
      try {
        const swaps = []

        for (let i = 0; i < resData.length; i++) {
          const swap = { ...resData[i] } // Clone swap data
          const swapDetails = (await this.$api.getTxStatus(resData[i].tx_id))
            .data // Fetch swap details

          const txAsset = swapDetails?.tx
          if (txAsset && txAsset.coins.length > 0) {
            swap.inputAsset = {
              asset: txAsset.coins[0].asset,
              amount: txAsset.coins[0].amount,
            }
          }

          let nonRUNE = false
          if (!swap.outputAsset?.asset) {
            const memo = swapDetails.tx?.memo
            if (memo) {
              const m = swapDetails.tx?.memo.split(':', 3)[1]
              const outAsset = shortAssetName(m)
              if (outAsset !== 'THOR.RUNE') {
                nonRUNE = true
              }
              swap.outputAsset = {
                asset: outAsset,
              }
            }
          }

          const outAsset = swapDetails?.out_txs
          if (outAsset && outAsset.length > 0) {
            const oa = outAsset.map((o) => ({
              asset: o.coins[0]?.asset,
              amount: o.coins[0].amount,
            }))
            const tmpOut = {
              amount: 0,
              asset: '',
              new: false,
            }
            if (oa.every((a) => a.asset === 'THOR.RUNE') && !nonRUNE) {
              tmpOut.amount = oa?.reduce((a, b) => Math.max(+a, +b), -Infinity)
              tmpOut.asset = oa[0].asset
              tmpOut.new = true
            } else {
              const nonRuneAsset = oa.find((a) => a.asset !== 'THOR.RUNE')
              if (nonRuneAsset) {
                tmpOut.amount = nonRuneAsset.amount
                tmpOut.asset = nonRuneAsset.asset
                tmpOut.new = true
              }
              if (tmpOut.new) {
                swap.outputAsset = {
                  asset: tmpOut.asset,
                  amount: tmpOut.amount,
                }
              }
            }
          }

          const plannedAsset = swapDetails?.planned_out_txs
          if (plannedAsset && plannedAsset.length > 0) {
            if (nonRUNE && plannedAsset[0].coin.asset !== 'THOR.RUNE') {
              swap.outputAsset = {
                asset: plannedAsset[0].coin?.asset,
                amount: plannedAsset[0].coin?.amount,
              }
            }
          }

          swap.remaingIntervals =
            resData[i].interval * (resData[i].quantity - resData[i].count)
          swap.remaningETA = moment
            .duration(swap.remaingIntervals * 6, 'seconds')
            .humanize()

          if (swap.outputAsset?.asset && this.pools) {
            swap.outputAsset.asset = this.findAssetInPool(
              swap.outputAsset?.asset,
              this.pools
            )
          }
          swaps.push(swap)
        }
        this.streamingSwaps = swaps
        this.loading = false
      } catch (error) {
        console.error(error)
        this.noStreaming = true
        this.loading = false
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
  border-bottom: 1px solid var(--border-color);
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
</style>
