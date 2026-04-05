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
                  <RuneAsset :show-icon="false" />
                </span>
              </template>
            </template>
          </vue-good-table>
        </card>
        <info-card :options="blockInfo" />
      </div>
      <div v-if="hasBlockEvents" class="block-events-bar">
        <div v-if="blockEventItems.length > 0" class="events-group">
          <span class="events-group-label">Block Events</span>
          <div class="events-chips">
            <div
              v-for="item in blockEventItems"
              :key="item.type"
              :class="[
                'event-chip',
                `event-chip--${item.type.replace(/_/g, '-')}`,
              ]"
            >
              <span class="chip-count">{{ item.count }}</span>
              <span class="chip-label">{{ item.label }}</span>
            </div>
          </div>
        </div>
        <div v-if="txTypeItems.length > 0" class="events-group">
          <span class="events-group-label"
            >Transactions &middot;
            {{ txTypeItems.reduce((s, i) => s + i.count, 0) }} total</span
          >
          <div class="events-chips">
            <div
              v-for="item in txTypeItems"
              :key="item.label"
              class="event-chip event-chip--tx"
            >
              <span class="chip-count">{{ item.count }}</span>
              <span class="chip-label">{{ item.label }}</span>
            </div>
          </div>
        </div>
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
import RuneAsset from '~/components/RuneAsset.vue'

export default {
  components: { Transactions, BlockIcon, ClockkIcon, CalendarIcon, RuneAsset },
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
      bondReward: '',
      swapActions: [],
      endBlockEventCounts: {},
      txTypeCounts: {},
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
              filter: (v) => this.formatRune(v / 1e8, '0,0.000000'),
            },
            {
              name: 'TCY Stake Reward',
              value: this.stakeReward,
              filter: (v) => this.formatRune(v / 1e8, '0,0.000000'),
            },
            {
              name: 'Burn',
              value: this.incomeBurn,
              filter: (v) => this.formatRune(v / 1e8, '0,0.000000'),
            },
            {
              name: 'Bond',
              value: this.bondReward,
              filter: (v) => this.formatRune(v / 1e8, '0,0.000000'),
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

    blockEventItems() {
      const labelMap = {
        swap: 'Swaps',
        streaming_swap: 'Streaming Swaps',
        refund: 'Refunds',
        outbound: 'Outbounds',
        scheduled_outbound: 'Scheduled Outbounds',
        trade_account_withdraw: 'Trade Withdrawals',
        trade_account_deposit: 'Trade Deposits',
        secured_asset_withdraw: 'Secured Withdrawals',
        affiliate_fee: 'Affiliate Fees',
        fee: 'Fees',
        gas: 'Gas',
        execute: 'Wasm Executes',
        schedule_add: 'Scheduled Ops',
        mint_burn: 'Mint/Burns',
        burn: 'Burns',
        rewards: 'Rewards',
      }
      return Object.entries(this.endBlockEventCounts)
        .filter(([k]) => labelMap[k])
        .map(([k, v]) => ({ label: labelMap[k], count: v, type: k }))
    },

    txTypeItems() {
      const labelMap = {
        MsgDeposit: 'Deposits',
        MsgExecuteContract: 'Contract Calls',
        MsgPriceFeedQuorumBatch: 'Price Feeds',
        MsgSend: 'Sends',
        MsgObservedTxIn: 'Observed Txs In',
        MsgObservedTxOut: 'Observed Txs Out',
      }
      return Object.entries(this.txTypeCounts).map(([k, v]) => ({
        label: labelMap[k] || k,
        count: v,
      }))
    },

    hasBlockEvents() {
      return (
        Object.keys(this.endBlockEventCounts).length > 0 ||
        Object.keys(this.txTypeCounts).length > 0
      )
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
  async mounted() {
    this.createDuration()
    await this.fetchBlockInfo(this.height)
    await this.getActions(this.height)
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
        const apiActions = res.data?.actions || []
        res.data = res.data || {}
        res.data.actions = [...apiActions, ...this.swapActions]
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
        this.swapActions = []
        this.endBlockEventCounts = {}
        this.txTypeCounts = {}

        const countableTypes = [
          'swap',
          'streaming_swap',
          'refund',
          'outbound',
          'scheduled_outbound',
          'trade_account_withdraw',
          'trade_account_deposit',
          'secured_asset_withdraw',
          'affiliate_fee',
          'fee',
          'gas',
          'execute',
          'schedule_add',
          'mint_burn',
          'burn',
          'rewards',
        ]
        const evCounts = {}
        if (Array.isArray(blockData.end_block_events)) {
          blockData.end_block_events.forEach((e) => {
            if (countableTypes.includes(e.type)) {
              evCounts[e.type] = (evCounts[e.type] || 0) + 1
            }
          })
        }
        this.endBlockEventCounts = evCounts

        const txCounts = {}
        if (Array.isArray(blockData.txs)) {
          blockData.txs.forEach((tx) => {
            const msgType = tx.tx?.body?.messages?.[0]?.['@type'] || ''
            const short = msgType.split('.').pop() || 'Unknown'
            txCounts[short] = (txCounts[short] || 0) + 1
          })
        }
        this.txTypeCounts = txCounts

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

          // Extract streaming swaps from end_block_events
          const swapEvents = blockData.end_block_events.filter(
            (event) =>
              event.type === 'swap' && parseInt(event.streaming_swap_count) > 1
          )
          this.swapActions = swapEvents.map((event) =>
            this.transformSwapEventToAction(
              event,
              this.blockNumber,
              blockData.header.time
            )
          )
        }
      } catch (error) {
        console.error('Error fetching block info:', error)
      } finally {
        this.loading = false
      }
    },

    parseAssetString(assetString) {
      /**
       * Parse asset string format: "67231043 ETH.ETH" or "364401015132 THOR.RUNE"
       * Returns: { amount: string, asset: string }
       */
      if (!assetString) return { amount: '0', asset: '' }
      const parts = assetString.trim().split(' ')
      if (parts.length !== 2) return { amount: '0', asset: '' }
      return {
        amount: parts[0],
        asset: parts[1],
      }
    },

    parseMemoForSwapDetails(memo) {
      /**
       * Parse swap memo format: "=:c:qpwf58jk3...0/100/0"
       * Breakdown: TYPE:MODE:DESTINATION:FEE/INTERVAL/QUANTITY
       * Returns: { fee, interval, quantity, destAddr }
       */
      if (!memo) return { fee: 0, interval: 1, quantity: 1, destAddr: '' }
      try {
        const parts = memo.split(':')
        if (parts.length < 4)
          return { fee: 0, interval: 1, quantity: 1, destAddr: '' }
        const destAddr = parts[2]
        const swapParams = parts[3].split('/')
        return {
          fee: parseInt(swapParams[0]) || 0,
          interval: parseInt(swapParams[1]) || 1,
          quantity: parseInt(swapParams[2]) || 1,
          destAddr,
        }
      } catch (e) {
        console.error('Error parsing memo:', memo, e)
        return { fee: 0, interval: 1, quantity: 1, destAddr: '' }
      }
    },

    transformSwapEventToAction(event, blockHeight, blockTime) {
      /**
       * Transform end_block_events swap event to action object for Transactions component
       */
      const inAsset = this.parseAssetString(event.coin)
      const outAsset = this.parseAssetString(event.emit_asset)
      const memo = this.parseMemoForSwapDetails(event.memo)

      const isCompleted =
        parseInt(event.streaming_swap_count) >=
        parseInt(event.streaming_swap_quantity)

      return {
        hash: event.id,
        date: moment(blockTime).valueOf() * 1000000,
        from: event.from,
        to: event.to,
        height: blockHeight,
        type: 'swap event',
        in: [
          {
            address: event.from,
            txID: event.id,
            coins: [
              {
                asset: inAsset.asset,
                amount: parseInt(inAsset.amount),
              },
            ],
          },
        ],
        out: [
          {
            address: event.to,
            txID: event.id,
            coins: [
              {
                asset: outAsset.asset,
                amount: parseInt(outAsset.amount),
              },
            ],
          },
        ],
        status: isCompleted ? 'completed' : 'ongoing',
        metadata: {
          swap: {
            memo: event.memo,
            streamingSwapMeta: {
              count: parseInt(event.streaming_swap_count),
              quantity: parseInt(event.streaming_swap_quantity),
              interval: memo.interval,
              liquidity_fee: event.liquidity_fee,
              liquidity_fee_in_rune: event.liquidity_fee_in_rune,
              swap_slip: event.swap_slip,
              pool_slip: event.pool_slip,
            },
          },
        },
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
.block-events-bar {
  display: flex;
  flex-wrap: wrap;
  gap: $space-16;
  padding: $space-12 $space-16;
  margin-bottom: $space-8;
  border: 1px solid var(--border-color);
  border-radius: $radius-lg;
  background: var(--card-bg-color);

  .events-group {
    display: flex;
    flex-direction: column;
    gap: $space-8;
  }

  .events-group-label {
    font-size: $font-size-mobile;
    color: var(--sec-font-color);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  .events-chips {
    display: flex;
    flex-wrap: wrap;
    gap: $space-5;
  }

  .event-chip {
    display: flex;
    align-items: center;
    gap: $space-3;
    padding: $space-3 $space-8;
    border-radius: $radius-xl;
    font-size: $font-size-mobile;
    border: 1px solid transparent;

    .chip-count {
      font-weight: bold;
    }

    .chip-label {
      color: var(--sec-font-color);
    }

    &--swap {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.3);
      .chip-count {
        color: #3b82f6;
      }
    }

    &--refund {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.3);
      .chip-count {
        color: #ef4444;
      }
    }

    &--outbound {
      background: rgba(34, 197, 94, 0.1);
      border-color: rgba(34, 197, 94, 0.3);
      .chip-count {
        color: #22c55e;
      }
    }

    &--trade-account-withdraw,
    &--trade-account-deposit {
      background: rgba(168, 85, 247, 0.1);
      border-color: rgba(168, 85, 247, 0.3);
      .chip-count {
        color: #a855f7;
      }
    }

    &--execute {
      background: rgba(245, 158, 11, 0.1);
      border-color: rgba(245, 158, 11, 0.3);
      .chip-count {
        color: #f59e0b;
      }
    }

    &--schedule-add {
      background: rgba(20, 184, 166, 0.1);
      border-color: rgba(20, 184, 166, 0.3);
      .chip-count {
        color: #14b8a6;
      }
    }

    &--rewards {
      background: rgba(234, 179, 8, 0.1);
      border-color: rgba(234, 179, 8, 0.3);
      .chip-count {
        color: #eab308;
      }
    }

    &--streaming-swap {
      background: rgba(59, 130, 246, 0.06);
      border-color: rgba(59, 130, 246, 0.2);
      .chip-count {
        color: #60a5fa;
      }
    }

    &--scheduled-outbound {
      background: rgba(34, 197, 94, 0.06);
      border-color: rgba(34, 197, 94, 0.2);
      .chip-count {
        color: #4ade80;
      }
    }

    &--secured-asset-withdraw {
      background: rgba(168, 85, 247, 0.06);
      border-color: rgba(168, 85, 247, 0.2);
      .chip-count {
        color: #c084fc;
      }
    }

    &--affiliate-fee,
    &--fee {
      background: rgba(251, 146, 60, 0.1);
      border-color: rgba(251, 146, 60, 0.3);
      .chip-count {
        color: #fb923c;
      }
    }

    &--gas {
      background: rgba(148, 163, 184, 0.1);
      border-color: rgba(148, 163, 184, 0.3);
      .chip-count {
        color: #94a3b8;
      }
    }

    &--mint-burn,
    &--burn {
      background: rgba(107, 114, 128, 0.1);
      border-color: rgba(107, 114, 128, 0.3);
      .chip-count {
        color: var(--sec-font-color);
      }
    }

    &--tx {
      background: var(--active-bg-color);
      border-color: var(--border-color);
      .chip-count {
        color: var(--primary-color);
      }
    }
  }
}
</style>
