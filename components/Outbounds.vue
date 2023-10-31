<template>
  <Card :is-loading="loading" title="Ongoing Outbounds">
    <template #header>
      <dot-live />
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
          <div v-if="o.label != false" class="mini-bubble info">
            {{ o.label | capitalize }}
          </div>
        </div>
        <div class="extra-right">
          <small v-if="o.to_address" class="mono">To
            <span class="clickable" @click="gotoAddr(o.to_address)">{{ formatAddress(o.to_address) }}</span>
          </small>
          <small v-if="o.in_hash && o.label !== 'migrate'" class="mono">In TxID
            <span class="clickable" @click="gotoTx(o.in_hash)">{{ formatAddress(o.in_hash) }}</span>
          </small>
          <div v-if="o.height">
            <small class="mono">ETA </small>
            <span style="color: var(--sec-font-color)">
              {{ getOutboundEta(o.height) }}
            </span>
          </div>
        </div>
      </div>
      <hr :key="i + '-hr'" class="hr-space">
    </template>
    <template v-if="outbounds.length > 10" #footer>
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

export default {
  components: { scheduleIcon },
  data () {
    return {
      currentPage: 1,
      noOutnound: false,
      loading: true,
      outbounds: [],
      intervalId: undefined
    }
  },
  computed: {
    filteredOutbounds () {
      return this.outbounds.slice(
        (this.currentPage - 1) * 10,
        this.currentPage * 10
      )
    },
    ...mapGetters({
      chainsHeight: 'getChainsHeight'
    })
  },
  mounted () {
    this.updateOutbounds()

    // Update the component every 20 secs
    this.intervalId = setInterval(() => {
      this.updateOutbounds()
    }, 20000)
  },
  destroyed () {
    this.clearIntervalId(this.intervalId)
  },
  methods: {
    async updateOutbounds () {
      this.noOutnound = false
      const resData = []
      const outData = (await this.$api.getOutbound()).data
      const schData = (await this.$api.getScheduled()).data
      resData.push(
        ...outData.map(s => ({ ...s, label: s.memo.toUpperCase().includes('MIGRATE') ? 'migrate' : undefined })),
        ...(schData.map(s => ({ ...s, label: 'Scheduled' })))
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
    getOutboundEta (height) {
      if (this.chainsHeight) {
        const remHeight = (height - this.chainsHeight.THOR)
        return moment.duration(remHeight * 6, 'seconds').humanize()
      }
    }
  }
}
</script>

<style lang="scss">
.no-outbound {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;

  .schedule-icon {
    color: var(--font-color);
  }

  h3 {
    text-align: center;
  }
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

    small {
      text-wrap: nowrap;
      text-overflow: ellipsis;
    }

    span {
      font-size: .9rem;
    }
  }
}
</style>
