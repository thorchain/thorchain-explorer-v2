<template>
  <page class="block-container">
    <div class="block-header">
      <BlockIcon class="block-icon" />
      <h2>
        Block
        <span style="color: var(--sec-font-color)">
          {{ $route.params.height | number('0,0') }}
        </span>
      </h2>
    </div>
    <template v-if="blockRemainingTime">
      <div class="block-remaining">
        <card class="counter-container">
          <div class="counter-items">
            <div class="timer-items">
              <div class="Countdown-title">
                <ClockkIcon class="timer-icon" />
                <strong>Countdown</strong>
              </div>
              <div class="timers">
                <div class="duration">
                  <small>Years</small>
                  <strong>{{
                    blockRemainingTime.years().toString().padStart(2, '0')
                  }}</strong>
                </div>
                <div class="mini-line"></div>
                <div class="duration">
                  <small>Months</small>
                  <strong>{{
                    blockRemainingTime.months().toString().padStart(2, '0')
                  }}</strong>
                </div>
                <div class="mini-line"></div>
                <div class="duration">
                  <small>Days</small>
                  <strong>{{
                    blockRemainingTime.days().toString().padStart(2, '0')
                  }}</strong>
                </div>
                <div class="mini-line"></div>
                <div class="duration">
                  <small>Hours</small>
                  <strong>{{
                    blockRemainingTime.hours().toString().padStart(2, '0')
                  }}</strong>
                </div>
                <div class="mini-line"></div>
                <div class="duration">
                  <small>Minutes</small>
                  <strong>{{
                    blockRemainingTime.minutes().toString().padStart(2, '0')
                  }}</strong>
                </div>
                <div class="mini-line"></div>
                <div class="duration">
                  <small>Seconds</small>
                  <strong>{{
                    blockRemainingTime.seconds().toString().padStart(2, '0')
                  }}</strong>
                </div>
              </div>
            </div>
            <div class="line"></div>

            <div class="target-info">
              <div class="target-title">
                <CalendarIcon class="target-icon" />
                <strong>Target Date</strong>
              </div>
              <p>{{ mineTime }}</p>
            </div>
          </div>
        </card>
        <card class="block-details">
          <div class="block-details-items">
            <div class="block-details-title">
              <strong>Block Details</strong>
            </div>
            <div class="block-info-items">
              <strong>Remaining Blocks:</strong>
              <span>#{{ remainingBlocks }}</span>
              <strong>Current Block:</strong>
              <span>#{{ currentHeight }}</span>
            </div>
          </div>
        </card>
      </div>
    </template>
    <template v-if="!blockRemainingTime">
      <skeleton-item
        :loading="!blockHash"
        :class="['block-name', { loading: !blockHash }]"
      >
        <span style="color: var(--primary-color)">{{ blockHash }}</span>
        <UtilityBox :value="blockHash" />
      </skeleton-item>
      <div class="block-content">
        <card :is-loading="loading">
          <vue-good-table
            :columns="assetColumns"
            :rows="assetRows"
            style-class="vgt-table net-table"
          >
            <template slot="table-row" slot-scope="props">
              <div v-if="props.column.field === 'assetName'" class="asset-row">
                <asset-icon :asset="props.row.assetName" />
                <span>{{ showAsset(props.row.assetName) }}</span>
              </div>
              <template v-else-if="props.column.field === 'assetReward'">
                <span>
                  {{ (props.row.assetReward / 1e8) | number('0,0.0000') }}
                  <small>RUNE</small>
                </span>
              </template>
            </template>
          </vue-good-table>
        </card>
        <info-card :options="blockInfo" />
      </div>
      <Transactions :txs="txs" :loading="loading" />
    </template>
  </page>
</template>

<script>
import moment from 'moment'
import { mapGetters } from 'vuex'
import Transactions from '~/components/Transactions.vue'
import BlockIcon from '~/assets/images/block.svg?inline'
import ClockkIcon from '~/assets/images/clock.svg?inline'
import CalendarIcon from '~/assets/images/calendar.svg?inline'

export default {
  components: { Transactions, BlockIcon, ClockkIcon, CalendarIcon },
  asyncData({ params, redirect }) {
    if (!params.height) {
      return redirect('/')
    }
  },
  data() {
    return {
      height: this.$route.params.height,
      assetRewards: {},
      loading: false,
      blockNumber: null,
      blockHash: '',
      blockTime: '',
      blockAge: '',
      txs: undefined,
      blockRemainingTime: undefined,
      actions: undefined,
      mineTime: undefined,
      remainingBlocks: undefined,
      currentHeight: undefined,
      incomeBurn: '',
      stakeReward: '',
      devFundReward: '',
      assetColumns: [
        { label: 'Asset', field: 'assetName' },
        { label: 'Reward', field: 'assetReward' },
      ],
    }
  },

  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
      chainsHeight: 'getChainsHeight',
    }),
    blockInfo() {
      return [
        {
          title: 'Block Info',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Block Time',
              value: this.blockTime,
            },
            {
              name: 'Block Age',
              value: this.blockAge,
            },
            {
              name: 'Dev Fund',
              value: this.devFundReward,
              filter: (v) =>
                `${this.$options.filters.number(v / 1e8, '0,0.00')} RUNE`,
            },
            {
              name: 'TCY Stake Reward',
              value: this.stakeReward,
              filter: (v) =>
                `${this.$options.filters.number(v / 1e8, '0,0.00')} RUNE`,
            },
            {
              name: 'Burn',
              value: this.incomeBurn,
              filter: (v) =>
                `${this.$options.filters.number(v / 1e8, '0,0.00')} RUNE`,
            },
            {
              name: 'Bond',
              value: this.bondReward,
              filter: (v) =>
                `${this.$options.filters.number(v / 1e8, '0,0.00')} RUNE`,
            },
          ],
        },
      ]
    },

    assetRows() {
      return Object.keys(this.assetRewards).map((asset) => ({
        assetName: asset,
        assetReward: this.assetRewards[asset],
      }))
    },
  },
  watch: {
    chainsHeight() {
      this.createDuration()
      if (!this.timer) {
        this.startCountdown()
      }
    },
  },
  mounted() {
    this.createDuration()
    this.fetchBlockInfo(this.height)
    this.getActions(this.height)
    this.startCountdown()
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  },
  methods: {
    createDuration() {
      const currentHeight = this.chainsHeight?.THOR
      const targetHeight = this.height

      if (targetHeight > currentHeight) {
        const blockDifference = +targetHeight - +currentHeight
        const blockTimeSeconds = 6
        const remainingSeconds = blockDifference * blockTimeSeconds
        this.blockRemainingTime = moment.duration(remainingSeconds, 'seconds')
        this.mineTime = moment()
          .add(remainingSeconds, 'seconds')
          .format('YYYY MMM D, HH:mm')
        this.remainingBlocks = blockDifference
      } else {
        this.blockRemainingTime = undefined
        this.remainingBlocks = 0
      }
      this.currentHeight = currentHeight
    },

    startCountdown() {
      if (!this.blockRemainingTime) return

      this.timer = setInterval(() => {
        if (this.blockRemainingTime.asSeconds() > 0) {
          this.blockRemainingTime = moment.duration(
            this.blockRemainingTime.asSeconds() - 1,
            'seconds'
          )
        } else {
          clearInterval(this.timer)
          this.blockRemainingTime = undefined
        }
      }, 1000)
    },

    async getActions(height) {
      try {
        const res = await this.$api.getActions({
          height: +height + 1,
          fromHeight: height,
        })
        this.txs = res.data
      } catch (error) {
        console.error('API Error:', error)
      }
    },
    async fetchBlockInfo(height) {
      try {
        this.loading = true

        const { data: blockData } = await this.$api.getBlockHeight(height)

        this.blockNumber = blockData.header.height
        this.blockHash = blockData.id.hash
        this.blockTime = moment(blockData.header.time).format(
          'MMM DD YYYY hh:mm:ss A'
        )

        const blockTimestamp = moment(blockData.header.time)
        this.blockAge = moment
          .duration(moment().diff(blockTimestamp))
          .humanize()

        this.bondReward = ''
        this.devFundReward = ''
        this.incomeBurn = ''
        this.stakeReward = ''
        this.assetRewards = {}

        if (Array.isArray(blockData.end_block_events)) {
          const rewardEvent = blockData.end_block_events.find(
            (event) => event.type === 'rewards'
          )
          if (rewardEvent) {
            this.bondReward = rewardEvent.bond_reward || ''
            this.devFundReward = rewardEvent.dev_fund_reward || ''
            this.incomeBurn = rewardEvent.income_burn || ''
            this.stakeReward = rewardEvent.tcy_stake_reward || ''

            Object.keys(rewardEvent).forEach((key) => {
              if (key.includes('.')) {
                this.assetRewards[key] = rewardEvent[key]
              }
            })
          }
        }
      } catch (error) {
        console.error('Error fetching block info:', error)
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.block-remaining {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
  margin: auto;

  .counter-container,
  .block-details {
    display: flex;
    max-width: 24rem;
    max-height: 300px;
    padding: $space-3;
    border-radius: $radius-2xl;
    @include sm {
      max-width: 35rem;
    }
    .timers {
      display: flex;
      gap: 0.3rem;
      width: 100%;
      @include sm {
        gap: 1rem;
      }
    }

    strong {
      display: flex;
      justify-content: flex-start;
      text-align: left;
      width: 100%;
    }

    .Countdown-title,
    .target-title,
    .block-details-title {
      display: flex;
      gap: 0.5rem;
      width: 100%;
      align-items: center;

      .timer-icon,
      .target-icon {
        width: 1rem;
        height: 1rem;
      }
    }
    .counter-items {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .duration {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }
    .duration strong {
      font-size: $font-size-xl;
      color: var(--primary-color);
    }

    .duration small {
      font-size: $font-size-mobile;
      color: var(--sec-font-color);
    }
  }

  .line {
    height: 0.5px;
    background-color: var(--border-color);
    width: 100%;
    gap: 0px;
    display: flex;
  }
  .mini-line {
    height: 43.5px;
    background-color: var(--border-color);
    width: 1px;
    gap: 0px;
    display: flex;
  }

  .target-info,
  .timer-items,
  .block-details-items {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: $space-16;

    p {
      font-size: $font-size-md;
      color: var(--sec-font-color);
      margin: $space-0;
    }
  }
}
.block-info-items {
  display: flex;
  gap: 0.5rem;
  flex-direction: column;
  span {
    color: var(--sec-font-color);
    font-weight: bold;
  }
}
.block-content {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.block-icon {
  fill: currentColor;
  width: 2rem;
  height: 2rem;
}
.asset-row {
  display: flex;
  gap: $space-5;
  align-items: center;
}
.block-header {
  display: flex;
  font-size: $font-size-lg !important;
  color: var(--font-color) !important;
  font-weight: bold;
  align-items: center;
  gap: $space-8;
  padding-left: $space-16;
  margin-bottom: $space-8;

  h2 {
    margin: $space-0;
  }
}
.block-name {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  font-weight: bold;
  font-size: $font-size-xs;
  color: var(--font-color);
  padding: $space-0 $space-12;
  gap: $space-8;

  span {
    font-size: $font-size-sm;
    text-overflow: ellipsis;
    overflow: hidden;

    @include md {
      font-size: $font-size-desktop;
    }
  }
  &.loading {
    max-width: 300px;
    margin: $space-14 $space-0;
    max-height: 31.42px;
  }
}
</style>
