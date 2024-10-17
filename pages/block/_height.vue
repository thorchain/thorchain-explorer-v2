<template>
  <page class="block-container">
    <div class="block-header">
      <BlockIcon class="block-icon" />
      {{ $route.params.height }}
    </div>
    <info-card v-if="blockRemainingTime" :options="timerInfo">
      <template #duration="{ item }">
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
      <info-card :options="blockInfo" />
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
      loading: false,
      blockNumber: null,
      blockHash: '',
      blockTime: '',
      blockAge: '',
      txs: undefined,
      blockRemainingTime: undefined,
      actions: undefined,
      mineTime: undefined,
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
          title: 'Nodes',
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
          grid: true,
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
      } catch (error) {
        console.error('Error fetching block info:', error)
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.block-icon {
  width: 1.2rem;
  height: 1.2rem;
}
.block-header {
  display: flex;
  font-size: 20px !important;
  color: var(--font-color) !important;
  font-weight: bold;
  align-items: center;
  gap: 0.5rem;
  padding-left: 1rem;
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
