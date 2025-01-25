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
            <div
              v-for="(value, unit, index) in timeUnits"
              v-if="visibleUnits.includes(unit)"
              :key="unit"
              class="duration-wrapper"
            >
              <div class="duration" :aria-label="`${value} ${unit}`">
                <small>{{ unit }}</small>
                <strong>{{ value }}</strong>
              </div>
              <div
                v-if="index !== visibleUnits.length - 1"
                class="separator"
                aria-hidden="true"
              ></div>
            </div>
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
  components: { ClockIcon, CalendarIcon },
  name: 'TimerComponent',
  props: {
    remainingSeconds: {
      type: Number,
      required: true,
    },
    targetDate: {
      type: String,
      required: true,
      validator(value) {
        return moment(value, 'YYYY-MM-DD', true).isValid()
      },
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
  },
  data() {
    return {
      blockRemainingTime: moment.duration(this.remainingSeconds, 'seconds'),
      timer: null,
    }
  },
  computed: {
    timeUnits() {
      return {
        Years: this.blockRemainingTime.years().toString().padStart(2, '0'),
        Months: this.blockRemainingTime.months().toString().padStart(2, '0'),
        Days: this.blockRemainingTime.days().toString().padStart(2, '0'),
        Hours: this.blockRemainingTime.hours().toString().padStart(2, '0'),
        Minutes: this.blockRemainingTime.minutes().toString().padStart(2, '0'),
        Seconds: this.blockRemainingTime.seconds().toString().padStart(2, '0'),
      }
    },
  },
  watch: {
    remainingSeconds: {
      immediate: true,
      handler(newVal) {
        if (this.timer) clearInterval(this.timer)
        this.blockRemainingTime = moment.duration(newVal, 'seconds')
        this.startCountdown()
      },
    },
  },
  mounted() {
    this.startCountdown()
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  },
  methods: {
    startCountdown() {
      const endTime = moment().add(this.blockRemainingTime)
      this.timer = setInterval(() => {
        const now = moment()
        const diff = endTime.diff(now)
        if (diff > 0) {
          this.blockRemainingTime = moment.duration(diff)
        } else {
          clearInterval(this.timer)
          this.$emit('countdown-finished')
        }
      }, 1000)
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
  border-radius: 1rem;
  background-color: var(--card-bg);
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
  font-size: 1.5rem;
  color: var(--primary-color);
}

.duration small {
  font-size: 0.9rem;
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
    font-size: 18.75px;
    color: var(--sec-font-color);
    margin: 0;
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
