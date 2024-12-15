<template>
  <page class="block-container">
    <div class="block-header">
      <BlockIcon class="block-icon" />
      <h2>
        Block
        <span style="color: var(--sec-font-color)">
          {{ $route.params.height }}
        </span>
      </h2>
    </div>
    <info-card v-if="blockRemainingTime" :options="timerInfo">
      <template #duration="{ item }">
        <div class="duration">
          <strong>{{ item.value.years().toString().padStart(2, '0') }}</strong>
          <small>Years</small>
        </div>
        <div class="duration">
          <strong>{{ item.value.months().toString().padStart(2, '0') }}</strong>
          <small>Months</small>
        </div>
        <div class="duration">
          <strong>{{ item.value.days().toString().padStart(2, '0') }}</strong>
          <small>Days</small>
        </div>
        <div class="duration">
          <strong>{{ item.value.hours().toString().padStart(2, '0') }}</strong>
          <small>Hours</small>
        </div>
        <div class="duration">
          <strong>
            {{ item.value.minutes().toString().padStart(2, '0') }}
          </strong>
          <small>Minutes</small>
        </div>
        <div class="duration">
          <strong>
            {{ item.value.seconds().toString().padStart(2, '0') }}
          </strong>
          <small>Seconds</small>
        </div>
      </template>
    </info-card>

    <template v-else>
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

export default {
  components: { Transactions, BlockIcon },
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
    timerInfo() {
      return [
        {
          title: '',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'From',
              valueSlot: 'duration',
              value: this.blockRemainingTime,
            },
            {
              name: 'When',
              value: this.mineTime,
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
    },
  },
  mounted() {
    this.createDuration()
    this.fetchBlockInfo(this.height)
    this.getActions(this.height)
  },
  methods: {
    createDuration() {
      const currentHeight = this.chainsHeight?.THOR
      const targetHeight = this.height

      if (targetHeight > currentHeight) {
        const blockDifference = +targetHeight - +currentHeight
        const blockTimeSeconds = 5.5
        const remainingSeconds = blockDifference * blockTimeSeconds
        this.blockRemainingTime = moment.duration(remainingSeconds, 'seconds')
        this.mineTime = moment()
          .add(remainingSeconds, 'seconds')
          .format('YYYY MMM D, HH:SS')
      } else {
        this.blockRemainingTime = undefined
      }
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
        this.assetRewards = {}

        if (Array.isArray(blockData.end_block_events)) {
          const rewardEvent = blockData.end_block_events.find(
            (event) => event.type === 'rewards'
          )
          if (rewardEvent) {
            this.bondReward = rewardEvent.bond_reward || ''
            this.devFundReward = rewardEvent.dev_fund_reward || ''
            this.incomeBurn = rewardEvent.income_burn || ''

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
.block-content {
  display: flex;
  gap: 0.5rem;
}
.block-icon {
  fill: currentColor;
  width: 2rem;
  height: 2rem;
}
.asset-row {
  display: flex;
  gap: 5px;
  align-items: center;
}
.block-header {
  display: flex;
  font-size: 20px !important;
  color: var(--font-color) !important;
  font-weight: bold;
  align-items: center;
  gap: 0.5rem;
  padding-left: 1rem;
  margin-bottom: 0.5rem;

  h2 {
    margin: 0;
  }
}
.block-name {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  font-weight: bold;
  font-size: 11px;
  color: var(--font-color);
  padding: 0 0.8rem;
  span {
    text-overflow: ellipsis;
    max-width: 70%;
    overflow: hidden;
  }
  &.loading {
    max-width: 300px;
    margin: 14px 0;
    max-height: 31.42px;
  }
}
.duration {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 5px;
  gap: 3px;
}
</style>
