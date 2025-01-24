<template>
  <div class="churn-container">
    <div class="countdown-churn">
      <div v-if="nextChurnRemainingTime">
        <div class="next-count">
          <card class="countdown-item">
            <div class="Countdown-title">
              <strong>Next Churn</strong>
            </div>
            <div class="timers">
              <div class="duration">
                <small>Days</small>
                <strong>{{
                  nextChurnRemainingTime.days().toString().padStart(2, '0')
                }}</strong>
              </div>
              <div class="mini-line"></div>
              <div class="duration">
                <small>Hours</small>
                <strong>{{
                  nextChurnRemainingTime.hours().toString().padStart(2, '0')
                }}</strong>
              </div>
              <div class="mini-line"></div>
              <div class="duration">
                <small>Minutes</small>
                <strong>{{
                  nextChurnRemainingTime.minutes().toString().padStart(2, '0')
                }}</strong>
              </div>
              <div class="mini-line"></div>
              <div class="duration">
                <small>Seconds</small>
                <strong>{{
                  nextChurnRemainingTime.seconds().toString().padStart(2, '0')
                }}</strong>
              </div>
            </div>

            <div class="line"></div>
            <div class="target-info">
              <div class="target-title">
                <CalendarIcon class="target-icon" />
                <strong>Target Date</strong>
              </div>
              <p>{{ nextChurnTargetDate }}</p>
            </div>
          </card>

          <card class="block-details">
            <div class="block-details-items">
              <div class="block-details-title">
                <strong>Block Details</strong>
              </div>
              <div class="block-info-items">
                <strong>Remaining Blocks</strong>
                <span>#{{ remainingBlocksChurn }}</span>
                <strong>Current Block</strong>
                <span>#{{ currentBlock }}</span>
              </div>
            </div>
          </card>
        </div>
      </div>

      <div v-if="nextPoolRemainingTime">
        <div class="next-count">
          <card class="countdown-item">
            <div class="Countdown-title">
              <strong>Next Pool</strong>
            </div>
            <div class="timers">
              <div class="duration">
                <small>Days</small>
                <strong>{{
                  nextPoolRemainingTime.days().toString().padStart(2, '0')
                }}</strong>
              </div>
              <div class="mini-line"></div>
              <div class="duration">
                <small>Hours</small>
                <strong>{{
                  nextPoolRemainingTime.hours().toString().padStart(2, '0')
                }}</strong>
              </div>
              <div class="mini-line"></div>
              <div class="duration">
                <small>Minutes</small>
                <strong>{{
                  nextPoolRemainingTime.minutes().toString().padStart(2, '0')
                }}</strong>
              </div>
              <div class="mini-line"></div>
              <div class="duration">
                <small>Seconds</small>
                <strong>{{
                  nextPoolRemainingTime.seconds().toString().padStart(2, '0')
                }}</strong>
              </div>
            </div>

            <div class="line"></div>
            <div class="target-info">
              <div class="target-title">
                <CalendarIcon class="target-icon" />
                <strong>Target Date</strong>
              </div>
              <p>{{ nextPoolTargetDate }}</p>
            </div>
          </card>

          <card class="block-details">
            <div class="block-details-items">
              <div class="block-details-title">
                <strong>Block Details</strong>
              </div>
              <div class="block-info-items">
                <strong>Remaining Blocks</strong>
                <span>#{{ remainingBlocksPool }}</span>
                <strong>Current Block</strong>
                <span>#{{ currentBlock }}</span>
              </div>
            </div>
          </card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import { blockTime } from '~/utils'
import { mapGetters } from 'vuex'
import CalendarIcon from '~/assets/images/calendar.svg?inline'

export default {
  components: { CalendarIcon },
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
        console.log('Network data:', this.network)
        console.log('Chains Height:', this.chainsHeight)
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
  gap: 4rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}
.header-nextchurn {
  margin: 0.5rem;
}
.block-remaining {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  margin: auto;
}

.counter-container {
  display: flex;
  flex-direction: column;
  max-width: 35rem;
  padding: 3px;
  border-radius: 1rem;
}

.timer-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}
.countdown-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.timer-icon {
  width: 1rem;
  height: 1rem;
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
.timers {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}
.Countdown-title {
  margin-bottom: 0.5rem;
  display: flex;
  gap: 2rem;
  width: 100%;
  align-items: center;
}
.duration {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.duration strong {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.duration small {
  font-size: 0.9rem;
  color: var(--sec-font-color);
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
.next-count {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.mini-line {
  height: 30px;
  width: 2px;
  background: var(--border-color);
}
.line {
  height: 0.5px;
  background-color: var(--border-color);
  width: 100%;
  gap: 0px;
  display: flex;
  margin-top: 1rem;
}
.target-info {
  margin-top: 1rem;
}

.target-title {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.target-icon {
  width: 1.2rem;
  height: 1.2rem;
}
</style>
