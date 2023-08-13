<template>
  <div v-if="inbound.observed" class="card txStages-container">
    <div class="card-header">
      <span>Transaction Stages</span>
      <dot-live />
    </div>
    <div class="card-body">
      <div v-if="outbound.is" class="info-item">
        <span>Outbound</span>
        <span>
          {{ outbound.remSeconds }}
          <div :class="['mini-bubble', {'yellow': outbound.signedStatus === 'Not Signed'}]">
            {{ outbound.signedStatus }}
          </div>
          <div :class="['mini-bubble', {'yellow': outbound.status === 'On Going'}]">
            {{ outbound.status }}
          </div>
        </span>
      </div>
      <div class="info-item">
        <span>Inbound</span>
        <span>
          <div v-if="inbound.observed" :class="['mini-bubble']">
            Observed
          </div>
          <div v-if="inbound.confConfirmed" :class="['mini-bubble']">
            Conf Confirmed
          </div>
          <div v-if="inbound.finalised" :class="['mini-bubble']">
            Finalised
          </div>
        </span>
      </div>
      <div v-if="inbound.remSeconds" class="info-item">
        <span>Inbound Confirmation remaining</span>
        <span>
          <div>
            {{ moment.duration(inbound.remSeconds, 'seconds').humanize() }}
          </div>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'

export default {
  props: ['inboundHash'],
  data () {
    return {
      outbound: {
        is: false,
        remSeconds: 0,
        status: '',
        signedStatus: false
      },
      inbound: {
        observed: false,
        confConfirmed: false,
        finalised: false,
        remSeconds: 0
      }
    }
  },
  mounted () {
    this.updateTxStages(this.inboundHash)
  },
  methods: {
    async updateTxStages (inTx) {
      const { data } = await this.$api.getTxStages(inTx)

      this.inbound = {
        observed: data?.inbound_observed?.completed,
        confConfirmed: data?.inbound_confirmation_counted?.completed,
        finalised: data?.inbound_finalised?.completed,
        remSeconds: data?.inbound_confirmation_counted?.remaining_confirmation_seconds
      }

      this.outbound = {
        is: data?.outbound_signed,
        remSeconds: moment.duration(data?.outbound_delay?.remaining_delay_seconds ?? 0, 'seconds').humanize(),
        status: data?.outbound_delay?.completed || data?.swap_finalised?.completed ? 'Done' : 'On Going',
        signedStatus: data?.outbound_signed?.completed ? 'Signed' : 'Not Signed'
      }
    }
  }
}
</script>

<style lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;

  span {
    color: var(--sec-font-color) !important;
  }
}

.txStages-container {
  margin: 0;
}
</style>
