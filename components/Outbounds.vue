<template>
  <Card
    :is-loading="loading"
    :navs="[
      { title: 'Ongoing Outbounds', value: 'ongoing-outbounds' },
      { title: 'TOP Swaps (24hr)', value: 'top-swaps' },
    ]"
    :act-nav.sync="Mode"
  >
    <template #header>
      <dot-live />
    </template>

    <template v-if="Mode == 'ongoing-outbounds'">
      <template v-if="!noOutnound">
        <Card class="overview-card">
          <div class="overview-box">
            <div :class="'mini-bubble info'">
              <span>Scheduled</span>
            </div>
            <div class="stats-container">
              <div>
                <span class="item-value">Amount: </span>
                <span
                  class="outbound-overall mono"
                  style="padding-right: 0.8rem"
                >
                  ${{ totalScheduledValue | number('0a') }}
                </span>
              </div>
              <div>
                <span class="item-value">Count: </span>
                <span class="outbound-overall mono">{{ schData.length }}</span>
              </div>
            </div>
          </div>
        </Card>
        <ArrowToDown class="arrow-down-icon" />
        <Card class="overview-card">
          <div class="overview-box">
            <div :class="'mini-bubble'">
              <span>Ongoing</span>
            </div>
            <div class="stats-container">
              <div>
                <span class="item-value">Amount: </span>
                <span
                  class="outbound-overall mono"
                  style="padding-right: 0.8rem"
                >
                  ${{ totalOutboundValue | number('0a') }}</span
                >
              </div>
              <div>
                <span class="item-value">Count: </span>
                <span class="outbound-overall mono">
                  {{ outData.length }}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </template>
      <div v-if="noOutnound" class="no-outbound">
        <scheduleIcon class="schedule-icon large-icon" />
        <h3>There is no outbound schedule inside THORChain.</h3>
      </div>
      <template v-for="(o, i) in filteredOutbounds" v-else>
        <div :key="i" class="outbound-item">
          <div v-if="o.coin" class="asset-item">
            <asset-icon :asset="o.coin.asset" />
            <span class="asset-name">
              {{ $options.filters.number(o.coin.amount / 1e8, '0,0.0000') }}
              <small class="asset-text sec-color">{{ o.coin.asset }}</small>
            </span>
            <div v-if="o.label" class="mini-bubble info">
              {{ o.label | capitalize }}
            </div>
          </div>
          <div class="extra-right">
            <small v-if="o.to_address" class="mono"
              >To
              <NuxtLink
                class="clickable"
                :to="{ path: `/address/${o.to_address}` }"
              >
                {{ formatAddress(o.to_address) }}
              </NuxtLink>
            </small>
            <small v-if="o.in_hash && o.label !== 'migrate'" class="mono"
              >In TxID
              <NuxtLink class="clickable" :to="{ path: `/tx/${o.in_hash}` }">
                {{ formatAddress(o.in_hash) }}
              </NuxtLink>
            </small>
            <div v-if="o.height">
              <small class="mono">ETA </small>
              <span style="color: var(--sec-font-color)">
                {{ getOutboundEta(o.height) }}
              </span>
            </div>
          </div>
        </div>
        <hr :key="i + '-hr'" class="hr-space" />
      </template>
    </template>
    <template v-if="Mode == 'top-swaps'">
      <div v-if="!topSwaps" class="no-outbound">
        <h3>There is top 24hr swaps inside THORChain.</h3>
      </div>
      <template v-for="(swap, index) in topSwaps">
        <div :key="index" class="top-swap-item">
          <div class="asset-item-info">
            <div v-if="swap.inputAsset" class="asset-item">
              <asset-icon :asset="swap.inputAsset.asset" />
              <span class="asset-name-swaps">
                {{
                  $options.filters.number(
                    swap.inputAsset.amount / 1e8,
                    '0,0.0000'
                  )
                }}
                <small class="asset-text sec-color">{{
                  showAsset(swap.inputAsset.asset)
                }}</small>
              </span>
            </div>
            →
            <div v-if="swap.outputAsset.asset" class="asset-item">
              <asset-icon :asset="swap.outputAsset.asset" />
              <span class="asset-name-swaps">
                <template v-if="swap.outputAsset.amount">
                  {{
                    $options.filters.number(
                      swap.outputAsset.amount / 1e8,
                      '0,0.0000'
                    )
                  }}
                </template>
                <small class="asset-text sec-color">{{
                  showAsset(swap.outputAsset.asset)
                }}</small>
              </span>
            </div>
            <span v-else class="mini-bubble info">pending</span>
          </div>
          <div class="right-section">
            <small class="mono"
              >Address
              <NuxtLink
                class="clickable"
                :to="{ path: `/address/${swap.inputAsset.address}` }"
              >
                {{ formatAddress(swap.inputAsset.address) }}
              </NuxtLink>
            </small>
            <small class="mono"
              >In TxID
              <NuxtLink class="clickable" :to="{ path: `/tx/${swap.txID}` }">
                {{ formatAddress(swap.txID) }}
              </NuxtLink>
            </small>
            <small
              >Date
              <small class="date">{{ swap.date }}</small>
            </small>
          </div>
        </div>
        <hr :key="index + '-hr'" class="hr-space" />
      </template>
      <nuxt-link to="/swaps" class="swaps-nav">More</nuxt-link>
    </template>

    <template
      v-if="Mode == 'ongoing-outbounds' && outbounds.length > 10"
      #footer
    >
      <b-pagination
        v-model="currentPage"
        class="center"
        :total-rows="outbounds.length"
        :per-page="10"
      />
    </template>
  </Card>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import scheduleIcon from '@/assets/images/schedule.svg?inline'
import ArrowToDown from '~/assets/images/arrow-down.svg?inline'

export default {
  components: { scheduleIcon, ArrowToDown },
  data() {
    return {
      currentPage: 1,
      noOutnound: false,
      loading: true,
      outbounds: [],
      intervalId: undefined,
      outData: [],
      schData: [],
      Mode: 'ongoing-outbounds',
      topSwaps: [],
    }
  },
  computed: {
    filteredOutbounds() {
      return this.outbounds.slice(
        (this.currentPage - 1) * 10,
        this.currentPage * 10
      )
    },
    totalOutboundValue() {
      return this.outData.reduce((total, o) => {
        return (
          total +
          (this.amountToUSD(o.coin.asset, o.coin.amount, this.pools) || 0)
        )
      }, 0)
    },
    totalScheduledValue() {
      return this.schData.reduce((total, o) => {
        return total + this.amountToUSD(o.coin.asset, o.coin.amount, this.pools)
      }, 0)
    },
    ...mapGetters({
      chainsHeight: 'getChainsHeight',
      pools: 'getPools',
    }),
  },
  mounted() {
    this.updateOutbounds()
    this.updateTopSwaps()
    // Update the component every 20 secs
    this.intervalId = setInterval(() => {
      this.updateOutbounds()
      this.updateTopSwaps()
    }, 20000)
  },
  destroyed() {
    this.clearIntervalId(this.intervalId)
  },
  methods: {
    async updateTopSwaps() {
      try {
        const response = await this.$api.getTopSwaps()
        const resData = response.data
        if (
          resData &&
          typeof resData === 'object' &&
          Array.isArray(resData.actions)
        ) {
          this.topSwaps = resData.actions.slice(0, 10).map((swap) => {
            let outputAsset = swap.out[0]
            if (swap.in.length > 0) {
              outputAsset = swap.out.find((s) => s.affiliate !== true)
            }

            return {
              date: moment(swap.date / 1e6).format('MMM D, HH:MM'),
              txID: swap.in[0]?.txID,
              inputAsset: {
                address: swap.in[0]?.address,
                asset: swap.in[0]?.coins[0]?.asset,
                amount: swap.in[0]?.coins[0]?.amount,
              },
              outputAsset: {
                address: outputAsset?.address,
                asset: outputAsset?.coins[0]?.asset,
                amount: outputAsset?.coins[0]?.amount,
              },
            }
          })
        } else {
          console.error(
            'API response does not contain an actions array:',
            this.swaps.outputAsset
          )
          this.topSwaps = []
        }
      } catch (error) {
        console.error('Error fetching top swaps:', error)
      } finally {
        this.loading = false
      }
    },
    async updateOutbounds() {
      this.noOutnound = false
      const resData = []
      this.outData = (await this.$api.getOutbound()).data
      this.schData = (await this.$api.getScheduled()).data
      resData.push(
        ...this.outData.map((s) => ({
          ...s,
          ...(s.memo.toUpperCase().includes('MIGRATE') && { label: 'migrate' }),
        })),
        ...this.schData.map((s) => ({ ...s, label: 'Scheduled' }))
      )
      if (!resData || resData?.length === 0) {
        this.outbounds = []
        this.noOutnound = true
        this.loading = false
        return
      }
      this.outbounds = resData
      this.loading = false
    },
    getOutboundEta(height) {
      if (this.chainsHeight) {
        const remHeight = height - this.chainsHeight.THOR
        return moment.duration(remHeight * 6, 'seconds').humanize()
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.item-value {
  font-size: 14px;
}
.top-swap-item {
  display: flex;
  flex-direction: row;
  padding: 0.5rem;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: space-between;
  flex-direction: row;
  @include olg {
    flex-direction: column;
  }
}

.right-section {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;

  @include sm {
    justify-content: flex-end;
  }
}

.date {
  color: var(--sec-font-color);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  padding-left: 0.5rem;
}
.asset-item-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
  margin-bottom: 0.5rem;

  span {
    font-size: 0.9rem;
  }
}

.asset-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.asset-name-swaps {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  @include sm {
    flex-direction: row;
  }
}

.arrow-down-icon {
  width: 35px;
  margin-left: auto;
  display: flex;
  justify-content: center;
  position: relative;
  right: calc(50% - 17.5px);
}
.overview-card {
  background-color: var(--bg-color);
  border-radius: 0.5rem;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  color: var(--font-color);
  border: 1px solid var(--border-color) !important;

  &:first-of-type {
    margin-bottom: 3px;
  }

  &:nth-of-type(2) {
    margin-top: 3px;
    margin-bottom: 1rem;
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }
}

.overview-box {
  display: flex;
  justify-content: space-between;
  text-align: center;
  align-items: center;

  .mini-bubble {
    max-height: 20px;
  }
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
    gap: 1rem;

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
    padding: 0.4rem;
    margin: 0;
    animation: slideIn 0.5s ease;

    @include md {
      padding: 0;
    }

    &:first-child {
      border-bottom: 1px solid var(--primary-color);
    }
  }
}

.outbound-overall {
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

.no-outbound {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;

  .schedule-icon {
    stroke: var(--font-color);
    height: 100px;
  }

  h3 {
    text-align: center;
  }
}
.swaps-nav {
  margin-top: 0.5rem;
}
.outbound-item {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  overflow: hidden;

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
  .extra-right {
    display: flex;
    flex-direction: column;
    margin-left: auto;

    justify-content: center;
    min-width: 177px;
    min-height: 48px;

    small {
      text-wrap: nowrap;
      text-overflow: ellipsis;
    }

    span {
      font-size: 0.9rem;
    }
  }
}
</style>
