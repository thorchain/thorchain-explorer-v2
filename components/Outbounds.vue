<template>
  <Card :is-loading="loading" title="Ongoing Outbounds">
    <div v-if="noOutnound" class="no-outbound">
      <scheduleIcon class="schedule-icon large-icon" />
      <h3>There is no outbound schedule inside THORChain.</h3>
    </div>
    <template v-for="(o, i) in outbounds">
      <div :key="i" class="outbound-item">
        <div v-if="o.coin" class="asset-item">
          <asset-icon :asset="o.coin.asset" />
          <span>
            {{ $options.filters.number(o.coin.amount / 1e8, '0,0.0000') }}
            <small class="asset-text sec-color">{{ o.coin.asset }}</small>
          </span>
        </div>
        <div class="extra-right">
          <span class="mono" v-if="o.to_address">To
            <span class="clickable" @click="gotoAddr(o.to_address)">{{ formatAddress(o.to_address) }}</span>
          </span>
          <span class="mono" v-if="o.in_hash">In Hash
            <span class="clickable" @click="gotoTx(o.in_hash)">{{ formatAddress(o.in_hash) }}</span>
          </span>
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
  },
  methods: {
    async updateOutbounds () {
      const resData = (await this.$api.getOutbound()).data
      if (!resData || resData?.length === 0) {
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
