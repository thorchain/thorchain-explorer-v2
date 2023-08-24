<template>
  <Card :is-loading="loading" title="Ongoing Outbounds">
    <template #header>
      <dot-live />
    </template>
    <div v-if="noOutnound" class="no-outbound">
      <scheduleIcon class="schedule-icon large-icon" />
      <h3>There is no outbound schedule inside THORChain.</h3>
    </div>
    <template v-for="(o, i) in outbounds" v-else>
      <div :key="i" class="outbound-item">
        <div v-if="o.coin" class="asset-item">
          <asset-icon :asset="o.coin.asset" />
          <span class="asset-name">
            {{ $options.filters.number(o.coin.amount / 1e8, '0,0.0000') }}
            <small class="asset-text sec-color">{{ o.coin.asset }}</small>
          </span>
        </div>
        <div class="extra-right">
          <small v-if="o.to_address" class="sec-color mono">To
            <span class="clickable" @click="gotoAddr(o.to_address)">{{ formatAddress(o.to_address) }}</span>
          </small>
          <small v-if="o.in_hash" class="sec-color mono">In TxID
            <span class="clickable" @click="gotoTx(o.in_hash)">{{ formatAddress(o.in_hash) }}</span>
          </small>
        </div>
      </div>
      <hr :key="i + '-hr'" class="hr-space">
    </template>
  </Card>
</template>

<script>
import scheduleIcon from '@/assets/images/schedule.svg?inline'

export default {
  components: { scheduleIcon },
  data () {
    return {
      noOutnound: false,
      loading: true,
      outbounds: []
    }
  },
  mounted () {
    this.updateOutbounds()

    // Update the component every 20 secs
    setInterval(() => {
      this.updateOutbounds()
    }, 20000)
  },
  methods: {
    async updateOutbounds () {
      this.noOutnound = false
      const resData = (await this.$api.getOutbound()).data
      if (!resData || resData?.length === 0) {
        this.outbounds = []
        this.noOutnound = true
        this.loading = false
        return
      }
      this.outbounds = resData
      this.loading = false
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

    span {
      font-size: .9rem;
    }
  }
}
</style>
