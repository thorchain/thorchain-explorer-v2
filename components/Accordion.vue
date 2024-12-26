<template>
  <div class="accordion">
    <div
      :class="['accordion-info', { 'not-collapsed': show }]"
      @click="toggleAccordion"
    >
      <strong class="accordion-info-left">
        <asset-icon
          v-if="asset"
          :asset="asset"
          :height="'1.2rem'"
          :chain-height="'0.5rem'"
        />
        {{ title | capitalize }}
        <angle-icon v-if="showAccordion" class="trigger" />
      </strong>
      <div class="accordion-info-right">
        <slot name="header-extra" />
        <div class="countdown-timer">
          <div
            v-if="remainingTime > 0"
            :class="'mini-bubble info'"
            style="gap: 0.3rem; border-radius: 8px"
          >
            <svg class="timer" viewBox="0 0 36 36">
              <path
                class="circle-background"
                d="M18 2.0845a15.9155 15.9155 0 1 0 0 31.831 15.9155 15.9155 0 1 0 0-31.831"
              />
              <path
                class="circle-foreground"
                :style="circleStyle"
                d="M18 2.0845a15.9155 15.9155 0 1 0 0 31.831 15.9155 15.9155 0 1 0 0-31.831"
              />
            </svg>

            <div class="mono">
              {{ formatCountdown(timer) }}
            </div>
          </div>

          <div
            v-if="!error && (done || (remainingTime <= 0 && !pending))"
            :class="'mini-bubble'"
            style="border-radius: 8px"
          >
            <div class="success-status">
              <circleSuccess class="checkmark" />
              <span class="time-text">Success</span>
            </div>
          </div>

          <div
            v-if="error"
            :class="'mini-bubble danger'"
            style="border-radius: 8px"
          >
            <div class="error-status">
              <warning-icon class="icon tx-icon-warn warn" />
              <span class="error-text">Error</span>
            </div>
          </div>

          <div v-if="pending && !remainingTime" class="loading">
            <SandTimer class="loading-icon" />
            <span class="loading-text">Pending</span>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showAccordion"
      ref="aci"
      :class="['accordion-inner', { show: show }]"
    >
      <div
        v-for="(s, i) in stacks.filter((s) => s.is)"
        :key="i"
        class="stack-item"
      >
        <template v-if="!s.slotName">
          <div class="key">
            {{ s.key | capitalize }}
          </div>
          <div v-if="s.type === 'bubble'" class="value mono bubble-wrapper">
            <div
              v-for="(b, j) in s.value"
              :key="j"
              :class="['mini-bubble', ...b.class]"
            >
              {{ b.text | capitalize }}
            </div>
          </div>
          <div v-else :class="['value', { link: isLink(s.type) }]">
            <component
              :is="checkType(s.type)"
              :class="['value mono']"
              :to="toLink(s.type, s.value)"
            >
              {{ s.formatter ? s.formatter(s.value) : s.value }}
              <arrow-icon
                v-if="checkType(s.type) === 'nuxt-link'"
                class="icon arrow-link"
              />
            </component>
            <template v-if="isLink(s.type) && notTHOR(s.asset)">
              <span> | </span>
              <a
                class="value"
                target="_blank"
                :href="getUrl(s.asset, s.value)"
                rel="noopener noreferrer"
              >
                <external class="icon external-link" />
              </a>
            </template>
          </div>
        </template>
        <slot v-else :name="s.slotName" />
      </div>
    </div>
  </div>
</template>

<script>
import AngleIcon from '~/assets/images/angle-down.svg?inline'
import ArrowIcon from '@/assets/images/arrow.svg?inline'
import External from '@/assets/images/external.svg?inline'
import { assetFromString, getExplorerAddressUrl } from '~/utils'
import SandTimer from '@/assets/images/sandtimer.svg?inline'
import Clock from '~/assets/images/alarmclock.svg?inline'
import circleSuccess from '~/assets/images/circle.svg?inline'
import WarningIcon from '~/assets/images/warning.svg?inline'

export default {
  components: {
    AngleIcon,
    ArrowIcon,
    External,
    SandTimer,
    Clock,
    circleSuccess,
    WarningIcon,
  },
  props: [
    'title',
    'stacks',
    'pending',
    'showAtFirst',
    'remainingTime',
    'totalTime',
    'done',
    'error',
    'asset',
  ],
  data() {
    return {
      labels: this.data?.labels ?? [],
      show: false,
      timer: 0,
      countdownInterval: null,
      timerTotalTime: 0,
      circleStyle: {
        'stroke-dashoffset': 100,
      },
    }
  },
  computed: {
    showAccordion() {
      if (this.stacks.length > 0) {
        return true
      }
      return false
    },
  },
  watch: {
    remainingTime(newCountdown) {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval)
      }
      this.startCountdown(newCountdown)
    },
  },
  mounted() {
    if (this.pending) {
      this.toggleAccordion()
    }
    if (this.remainingTime > 0) {
      this.startCountdown(this.remainingTime)
    }
  },
  beforeDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval)
    }
  },
  methods: {
    toggleAccordion() {
      this.show = !this.show
      if (this.show) {
        this.$refs.aci.style.maxHeight = `${this.$refs.aci.scrollHeight}px`
      } else {
        this.$refs.aci.style.maxHeight = null
      }
    },
    checkType(type) {
      if (type === 'address' || type === 'hash') {
        return 'nuxt-link'
      }
      return 'div'
    },
    isLink(type) {
      return type === 'address' || type === 'hash'
    },
    notTHOR(asset) {
      if (!asset) {
        return false
      }

      asset = assetFromString(asset)
      return asset.chain !== 'THOR' && !asset.synth && !asset.trade
    },
    toLink(type, value) {
      if (type === 'address') {
        return `/address/${value}`
      } else if (type === 'hash') {
        return `/tx/${value}`
      }
    },
    getUrl(assetString, value) {
      if (!assetString) {
        return
      }

      try {
        const { chain, trade, synth } = assetFromString(assetString)
        if (synth || trade) {
          return
        }
        return getExplorerAddressUrl(chain, value)
      } catch (error) {
        console.error("could't read the asset")
      }
    },
    startCountdown(seconds) {
      this.timer = seconds
      this.updateCircle()

      this.countdownInterval = setInterval(() => {
        if (this.remainingTime > 0) {
          this.timer--
          this.updateCircle()
        } else {
          this.timer = 0
          clearInterval(this.countdownInterval)
        }
      }, 1000)
    },

    updateCircle() {
      if (this.totalTime > this.timerTotalTime) {
        this.timerTotalTime = this.totalTime
      }
      const dashOffset = (this.timer / this.timerTotalTime) * 100
      this.circleStyle = {
        'stroke-dashoffset': dashOffset,
      }
    },

    formatCountdown(seconds) {
      if (seconds <= 0) {
        return 'Almost There!'
      }
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const remainingSeconds = seconds % 60
      return `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`
    },
  },
}
</script>

<style lang="scss" scoped>
.accordion {
  margin: 0 0.75rem;
  background-color: var(--card-bg);
  padding: 8px;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
  .error-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    padding: 1.2px;
    background-color: rgb(239 83 80 / 11%);
    border-radius: 7px;
    padding: 3.5px 8px;

    .error-text {
      display: flex;
      font-size: 10px;
      font-weight: bold;
      display: flex;
      align-content: center;
      justify-content: center;
      align-items: center;
      justify-content: center;
      color: rgb(239, 83, 80);
    }
    .tx-icon-warn {
      margin: 0;
      width: 1rem;
      height: 1rem;
      &.warn {
        padding: 0;
        fill: rgb(239, 83, 80);
      }
    }
  }
  .mini-bubble.danger {
    border: none !important;
    background-color: transparent;
  }

  .accordion-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    border-radius: 0.5rem;
    cursor: pointer;

    &:hover {
      color: var(--sec-font-color);

      .trigger {
        fill: var(--sec-font-color);
      }
    }

    .trigger {
      width: 1rem;
      height: 1rem;
      fill: var(--font-color);
    }

    &.not-collapsed {
      .trigger {
        transform: rotate(180deg);
      }
    }

    .accordion-info-left,
    .accordion-info-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  }

  .accordion-inner {
    font-size: 0.875rem;
    overflow: hidden;
    transition: all 0.3s ease-in-out;

    max-height: 0;
    opacity: 0;
    margin-top: 0;

    display: flex;
    flex-direction: column;

    &.show {
      margin-top: 0.5rem;
      border-top: 1px solid var(--border-color);
      opacity: 1;
    }

    .stack-item {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      padding: 0.3rem 0;
      gap: 5px;

      .value {
        display: flex;
        flex-wrap: wrap;
        word-break: break-all;
        color: var(--sec-font-color);
        gap: 7px;

        &.bubble-wrapper {
          display: flex;
          gap: 0.5rem;
        }

        &.link {
          display: flex;

          a {
            color: var(--primary-color);
            align-items: center;
            text-decoration: none;
            gap: 0.1rem;

            .icon {
              cursor: pointer;
              fill: var(--primary-color);
              margin: 0;
              height: 1rem;
              width: 1rem;
            }

            &:hover {
              color: var(--sec-font-color);

              .icon {
                fill: var(--sec-font-color);
              }
            }
          }
        }
      }

      &:last-of-type {
        padding-bottom: 0.5rem;
      }

      &:first-of-type {
        padding-top: 0.5rem;
      }
    }
  }

  .countdown-timer,
  .success-status {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 1.1rem;
    border-radius: 8px;
    padding: 5px;

    .checkmark {
      position: absolute;
      width: 1rem;
      height: 1rem;
      left: -16px;
      top: 1.8px;
      animation: checkmarkSuccess-data-v-7dd2b67d 0.8s ease-out;
      transform-origin: center;
      align-items: center;
      display: flex;
      @keyframes checkmarkSuccess {
        0% {
          transform: scale(0) rotate(0deg);
          opacity: 0;
        }
        50% {
          transform: scale(1.3) rotate(15deg);
          opacity: 1;
        }
        70% {
          transform: scale(0.9) rotate(-5deg);
        }
        100% {
          transform: scale(1) rotate(0deg);
        }
      }
    }
    .timer {
      width: 20px;
      height: 20px;
      transform: rotate(-90deg);
    }
    .time-text {
      font-size: 10px;
      font-weight: bold;
      display: flex;
      align-content: center;
      justify-content: center;
      align-items: center;
      animation: successAnimation 0.5s ease-out;

      @keyframes successAnimation {
        0% {
          transform: scale(0.8);
          opacity: 0;
        }
        50% {
          transform: scale(1.1);
          opacity: 1;
        }
        100% {
          transform: scale(1);
        }
      }
    }

    .circle-background,
    .circle-foreground {
      fill: none;
      stroke-width: 4;
      stroke-linecap: round;
    }

    .circle-background {
      stroke: var(--border-color);
    }

    .circle-foreground {
      stroke: rgb(47, 138, 245);
      stroke-dasharray: 100;
      stroke-dashoffset: 100;
      transition: stroke-dashoffset 1s linear;
    }

    @keyframes textFade {
      0%,
      100% {
        opacity: 0.5;
      }
      50% {
        opacity: 1;
      }
    }
    @keyframes sandTimerRotate {
      0% {
        transform: rotate(0deg);
      }
      50% {
        transform: rotate(180deg);
      }
      40% {
        transform: rotate(180deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  }

  .loading {
    position: relative;
    padding: 5px 8px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 1px solid #d86e58;
      border-radius: 8px;
      transition: all 0.5s;
      animation: clippath 3s infinite linear;
    }
  }

  @keyframes clippath {
    0%,
    100% {
      clip-path: inset(0 0 80% 0);
    }

    25% {
      clip-path: inset(0 80% 0 0);
    }
    50% {
      clip-path: inset(80% 0 0 0);
    }
    75% {
      clip-path: inset(0 0 0 80%);
    }
  }

  .loading-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    animation: sandTimerRotate 4s infinite ease-in-out;
  }
}

.loading-text {
  color: #d86e58;
  font-size: 10px;
  animation: textFade 1.5s infinite ease-in-out;
}
</style>
