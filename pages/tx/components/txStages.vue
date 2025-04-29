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
          <span v-if="outbound.remBlocks">
            (Blocks: {{ outbound.remBlocks }})
          </span>
          <div
            :class="[
              'mini-bubble',
              { yellow: outbound.signedStatus === 'Not Signed' },
            ]"
          >
            {{ outbound.signedStatus }}
          </div>
          <div
            v-if="outbound.status !== ''"
            :class="[
              'mini-bubble',
              {
                yellow: outbound.status === 'On Going',
                info: outbound.status === 'No Delay',
              },
            ]"
          >
            {{ outbound.status }}
          </div>
        </span>
      </div>
      <div class="info-item">
        <span>Inbound</span>
        <span>
          <div v-if="inbound.observed" :class="['mini-bubble']">Observed</div>
          <div v-if="inbound.confConfirmed" :class="['mini-bubble']">
            Conf Confirmed
          </div>
          <div v-if="inbound.finalised" :class="['mini-bubble']">Finalised</div>
        </span>
      </div>
      <div v-if="inbound.remSeconds" class="info-item">
        <span>Inbound Confirmation remaining</span>
        <span>
          <div>
            {{ inbound.remSecondsFiltered }}
          </div>
        </span>
      </div>
      <div v-if="inbound.remainingExtConf" class="info-item">
        <span>Confirmation External Height Delay</span>
        <span>
          {{ $options.filters.number(inbound.remBlocks, '0,0') }} /
          {{ $options.filters.number(inbound.remainingExtConf, '0,0') }} Blocks
          <small
            v-if="inbound.obsExtHeight && inbound.obsExtDelay"
            style="color: var(--font-color)"
            >({{ $options.filters.number(inbound.obsExtHeight, '0,0') }} →
            {{ $options.filters.number(inbound.obsExtDelay, '0,0') }})</small
          >
        </span>
      </div>
      <div v-if="outbound.outboundHeight" class="info-item">
        <span>Outbound Scheduled Height</span>
        <span>
          <div>
            {{ $options.filters.number(outbound.outboundHeight, '0,0') }}
            <small v-if="outbound.remOutboundHeight > 0">
              ({{ outbound.remOutboundHeight }} Block Remained)</small
            >
            <small
              v-if="outbound.remOutboundHeight > 0"
              style="color: var(--font-color)"
            >
              {{ outbound.remOutSeconds }}</small
            >
          </div>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import { mapGetters } from 'vuex'

export default {
  props: ['inboundHash'],
  data() {
    return {
      outbound: {
        is: false,
        remSeconds: 0,
        status: '',
        signedStatus: false,
        outboundHeight: undefined,
        remOutboundHeight: 0,
        remOutSeconds: 0,
      },
      inbound: {
        observed: false,
        confConfirmed: false,
        finalised: false,
        remSeconds: 0,
        remSecondsFiltered: undefined,
      },
      intervalId: undefined,
    }
  },
  computed: {
    ...mapGetters({
      chainsHeight: 'getChainsHeight',
    }),
  },
  mounted() {
    this.updateTxStages(this.inboundHash)

    this.intervalId = setInterval(() => {
      this.updateTxStages(this.inboundHash)
    }, 10000)
  },
  destroyed() {
    this.clearIntervalId(this.intervalId)
  },
  methods: {
    async updateTxStages(inTx) {
      const { data } = await this.$api.getTxStages(inTx)

      // get inbound data
      this.inbound = {
        observed: data?.inbound_observed?.completed,
        confConfirmed: data?.inbound_confirmation_counted?.completed,
        finalised: data?.inbound_finalised?.completed,
        remSeconds:
          data?.inbound_confirmation_counted?.remaining_confirmation_seconds,
      }

      if (
        data.inbound_confirmation_counted?.external_observed_height &&
        data.inbound_confirmation_counted?.external_confirmation_delay_height
      ) {
        this.inbound.remainingExtConf =
          data.inbound_confirmation_counted
            ?.external_confirmation_delay_height -
          data.inbound_confirmation_counted?.external_observed_height
        this.inbound.obsExtHeight =
          data.inbound_confirmation_counted?.external_observed_height
        this.inbound.obsExtDelay =
          data.inbound_confirmation_counted?.external_confirmation_delay_height
        this.inbound.remBlocks =
          this.chainsHeight[data.inbound_confirmation_counted.chain] -
          data.inbound_confirmation_counted?.external_observed_height
      }

      if (this.inbound.remSeconds) {
        this.inbound.remSecondsFiltered = moment
          .duration(this.inbound.remSeconds, 'seconds')
          .humanize()
      }

      this.outbound = {
        is: data?.outbound_signed,
        remSeconds:
          data?.outbound_delay?.remaining_delay_seconds &&
          moment
            .duration(data?.outbound_delay?.remaining_delay_seconds, 'seconds')
            .humanize(),
        remBlocks: data?.outbound_delay?.remaining_delay_blocks,
        outboundHeight: data?.outbound_signed?.scheduled_outbound_height,
        remOutboundHeight:
          data?.outbound_signed?.scheduled_outbound_height -
          this.chainsHeight?.THOR,
        signedStatus: data?.outbound_signed?.completed
          ? 'Signed'
          : 'Not Signed',
      }

      if (
        data?.outbound_signed?.completed &&
        (data?.outbound_delay?.completed === true ||
          (data?.outbound_delay === undefined &&
            data?.swap_finalised?.completed === true))
      ) {
        this.outbound.status = 'Done'
      } else if (
        data?.outbound_delay?.completed === false ||
        data?.swap_finalised?.completed === false
      ) {
        this.outbound.status = 'On Going'
      } else if (
        data?.outbound_signed?.completed === false &&
        data?.outbound_delay?.completed === true
      ) {
        this.outbound.status = 'No Delay'
      } else {
        this.outbound.status = ''
      }

      this.outbound.remOutSeconds = moment
        .duration(this.outbound.remOutboundHeight * 5.5, 'seconds')
        .humanize()
    },
  },
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
  margin: $space-0;
}
</style>
