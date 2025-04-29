<template>
  <div class="timer-component">
    <card class="counter-container">
      <div class="counter-items">
        <div class="timer-items">
          <div class="Countdown-title">
            <ClockIcon class="timer-icon" />
            <strong>{{ title }}</strong>
          </div>

          <div class="timers" role="timer" aria-live="polite">
            <template v-if="!halted">
              <div
                v-for="([unit, value], index) in getVisibleUnits(timeUnits)"
                :key="unit"
                class="duration-wrapper"
              >
                <div class="duration" :aria-label="`${value} ${unit}`">
                  <small>{{ unit }}</small>
                  <strong>{{ value }}</strong>
                </div>
                <div
                  v-if="index < visibleUnits.length - 1"
                  class="separator"
                  aria-hidden="true"
                ></div>
              </div>
            </template>
            <strong v-else class="halted"> Halted </strong>
          </div>
        </div>
        <div class="line"></div>
        <div class="target-info">
          <div class="target-title">
            <CalendarIcon class="target-icon" />
            <strong>Target Date</strong>
          </div>
          <p>{{ targetDate }}</p>
        </div>
      </div>
    </card>
  </div>
</template>

<script>
import moment from 'moment'
import ClockIcon from '~/assets/images/clock.svg?inline'
import CalendarIcon from '~/assets/images/calendar.svg?inline'

export default {
  name: 'Counter',
  components: { ClockIcon, CalendarIcon },
  props: {
    counter: {
      type: Number,
      required: true,
      default: 0,
    },
    visibleUnits: {
      type: Array,
      required: false,
      default: () => ['Days', 'Hours', 'Minutes', 'Seconds'],
    },
    title: {
      type: String,
      required: false,
      default: 'Countdown',
    },
    halted: {
      type: Boolean,
      required: false,
    },
  },
  data() {
    return {
      blockRemainingTime: moment.duration(0, 'seconds'),
      timer: null,
      duration: 0,
    }
  },
  computed: {
    timeUnits() {
      return {
        Years: this.blockRemainingTime?.years().toString().padStart(2, '0'),
        Months: this.blockRemainingTime?.months().toString().padStart(2, '0'),
        Days: this.blockRemainingTime?.days().toString().padStart(2, '0'),
        Hours: this.blockRemainingTime?.hours().toString().padStart(2, '0'),
        Minutes: this.blockRemainingTime?.minutes().toString().padStart(2, '0'),
        Seconds: this.blockRemainingTime?.seconds().toString().padStart(2, '0'),
      }
    },
    targetDate() {
      return moment().add(this.duration, 'seconds').format('YYYY MMM D, HH:mm')
    },
  },
  watch: {
    counter: {
      immediate: true,
      handler(newVal, oldVal) {
        if (newVal === oldVal) return
        if (newVal > 0) {
          this.duration = newVal * 6
          if (!this.timer) {
            this.startCountdown()
          }
        }
      },
    },
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  },
  methods: {
    startCountdown() {
      if (this.counter > 0) {
        this.timer = setInterval(() => {
          this.duration = this.duration - 1
          this.blockRemainingTime = moment.duration(this.duration, 'seconds')
        }, 1000)
      }
    },
    getVisibleUnits(units) {
      return Object.entries(units).filter(([unit, value], index) => {
        if (this.visibleUnits.includes(unit)) return true
        return false
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.timer-component {
  display: flex;
  flex-direction: column;
}

.counter-container {
  display: flex;
  flex-direction: column;
  border-radius: $radius-2xl;
  flex: 1;
  max-width: 35rem;
}

.counter-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.timer-items {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 1rem;
}

.Countdown-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.timer-icon {
  width: 1rem;
  height: 1rem;
}

.timers {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;

  .halted {
    font-size: $font-size-xl;
    color: var(--red);
  }
}

.duration-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.duration {
  display: flex;
  flex-direction: column;
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

.separator {
  width: 1px;
  height: 2rem;
  background-color: var(--border-color);
}

.line {
  height: 1px;
  background-color: var(--border-color);
  width: 100%;
}

.target-info {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 1rem;

  p {
    font-size: $font-size-md;
    color: var(--sec-font-color);
    margin: $space-0;
  }
}

.target-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.target-icon {
  width: 1rem;
  height: 1rem;
}
</style>
