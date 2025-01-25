<template>
  <div class="churn-container">
    <div class="countdown-churn">
      <div class="next-churn">
        <counter
          v-if="nextChurnRemainingTime"
          :remaining-seconds="nextChurnRemainingTime.asSeconds()"
          :target-date="nextChurnTargetDate"
          title="Next Churn"
          :remaining-blocks="remainingBlocksChurn"
          :current-block="currentBlock"
          :visible-units="['Days', 'Hours', 'Minutes', 'Seconds']"
        />

        <card v-if="nextChurnRemainingTime" class="block-details">
          <div class="block-details-items">
            <div class="block-details-title">
              <strong>Block Details</strong>
            </div>
            <div class="block-info-items">
              <strong>Remaining Blocks</strong>
              <span>#{{ remainingBlocksChurn | number('0,0') }}</span>
              <strong>Current Block</strong>
              <span>#{{ currentBlock | number('0,0') }}</span>
            </div>
          </div>
        </card>
      </div>
      <div class="next-churn">
        <counter
          v-if="nextPoolRemainingTime"
          :remaining-seconds="nextPoolRemainingTime.asSeconds()"
          :target-date="nextPoolTargetDate"
          title="Next Pool"
          :remaining-blocks="remainingBlocksPool"
          :current-block="currentBlock"
          :visible-units="['Days', 'Hours', 'Minutes', 'Seconds']"
        />

        <card v-if="nextPoolRemainingTime" class="block-details">
          <div class="block-details-items">
            <div class="block-details-title">
              <strong>Block Details</strong>
            </div>
            <div class="block-info-items">
              <strong>Remaining Blocks</strong>
              <span>#{{ remainingBlocksPool | number('0,0') }}</span>
              <strong>Current Block</strong>
              <span>#{{ currentBlock | number('0,0') }}</span>
            </div>
          </div>
        </card>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import { mapGetters } from 'vuex'

export default {
  data() {
    return {
      network: null,
      mimirInfo: null,
      timer: null,
    }
  },
  computed: {
    ...mapGetters({
      chainsHeight: 'getChainsHeight',
    }),

    currentBlock() {
      return this.chainsHeight ? this.chainsHeight.THOR : undefined
    },

    nextChurnRemainingTime() {
      if (this.isChurnHalted()) {
        return null
      }

      if (!this.chainsHeight || this.network?.nextChurnHeight === undefined) {
        return null
      }

      const blockDifference =
        +this.network?.nextChurnHeight - +this.chainsHeight.THOR
      if (blockDifference <= 500) {
        return moment.duration(0)
      }

      const blockTimeSeconds = 6
      const remainingSeconds = blockDifference * blockTimeSeconds
      return moment.duration(remainingSeconds, 'seconds')
    },

    nextPoolRemainingTime() {
      if (!this.network?.poolActivationCountdown) {
        return null
      }

      const blockDifference = +this.network?.poolActivationCountdown
      const blockTimeSeconds = 6
      const remainingSeconds = blockDifference * blockTimeSeconds

      return moment.duration(remainingSeconds, 'seconds')
    },

    remainingBlocksChurn() {
      if (!this.network?.nextChurnHeight || !this.chainsHeight) return 0
      return Math.max(this.network?.nextChurnHeight - this.chainsHeight.THOR, 0)
    },

    remainingBlocksPool() {
      if (!this.network?.poolActivationCountdown) return 0
      return this.network?.poolActivationCountdown
    },

    nextChurnTargetDate() {
      if (!this.nextChurnRemainingTime) return ''
      return moment()
        .add(this.nextChurnRemainingTime, 'seconds')
        .format('YYYY MMM D, HH:mm')
    },

    nextPoolTargetDate() {
      if (!this.nextPoolRemainingTime) return ''
      return moment()
        .add(this.nextPoolRemainingTime, 'seconds')
        .format('YYYY MMM D, HH:mm')
    },
  },

  mounted() {
    this.startCountdown()
    this.$api
      .getDashboardData()
      .then(({ data }) => {
        if (!data) {
          throw new Error('Cannot read the data')
        }
        this.network = data?.networkData
        this.getNetworkStatus()
      })
      .catch((error) => {
        console.error(error)
      })
  },

  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  },

  methods: {
    isChurnHalted() {
      return (
        this.mimirInfo?.HALTCHURNING || this.network?.nextChurnHeight === -1
      )
    },

    async getNetworkStatus() {
      try {
        const mi = (await this.$api.getMimir()).data
        this.mimirInfo = mi
      } catch (error) {
        console.error('Error fetching network status:', error)
      }
    },

    startCountdown() {
      if (!this.nextChurnRemainingTime && !this.nextPoolRemainingTime) return

      this.timer = setInterval(() => {
        if (this.nextChurnRemainingTime?.asSeconds() > 0) {
          this.nextChurnRemainingTime = moment.duration(
            this.nextChurnRemainingTime.asSeconds() - 1,
            'seconds'
          )
        }

        if (this.nextPoolRemainingTime?.asSeconds() > 0) {
          this.nextPoolRemainingTime = moment.duration(
            this.nextPoolRemainingTime.asSeconds() - 1,
            'seconds'
          )
        }

        if (
          this.nextChurnRemainingTime?.asSeconds() <= 0 &&
          this.nextPoolRemainingTime?.asSeconds() <= 0
        ) {
          clearInterval(this.timer)
        }
      }, 1000)
    },
  },
}
</script>

<style lang="scss" scoped>
.countdown-churn {
  display: flex;
  flex-direction: row;
  gap: 2rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;

  > div {
    flex: 1;
    max-width: 35rem;
  }
}
.block-details-items {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 1rem;

  p {
    font-size: 18.75px;
    color: var(--sec-font-color);
    margin: 0;
  }
}
.block-details {
  display: flex;
  max-width: 24rem;
  max-height: 300px;
  padding: 3px;
  border-radius: 1rem;
  @include sm {
    max-width: 35rem;
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
.block-details-title {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  align-items: center;
}
.next-churn {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
