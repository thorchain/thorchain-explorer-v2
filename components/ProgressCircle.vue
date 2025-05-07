<template>
  <div class="countdown-timer">
    <div
      v-if="Percentage > 0"
      :class="['mini-bubble', 'info']"
      :style="{ gap: '0.3rem', borderRadius: '8px' }"
    >
      <svg class="timer" :width="size" :height="size" viewBox="0 0 36 36">
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
    </div>
  </div>
</template>

<script>
export default {
  props: {
    Percentage: {
      type: Number,
      default: 0,
    },
    size: {
      type: Number,
      default: 20,
    },
  },
  data() {
    return {
      percentage: 0,
      circleStyle: {
        strokeDashoffset: 100,
      },
      animationFrame: null,
    }
  },
  watch: {
    Percentage(newVal) {
      this.animateTo(newVal)
    },
  },
  mounted() {
    if (this.Percentage > 0) {
      this.animateTo(this.Percentage)
    }
  },
  beforeDestroy() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame)
  },
  methods: {
    animateTo(target) {
      this.percentage = 0
      const step = () => {
        if (this.percentage < target) {
          this.percentage += 0.5
          if (this.percentage > target) this.percentage = target
          this.updateCircleFromPercentage(this.percentage)
          this.animationFrame = requestAnimationFrame(step)
        } else {
          cancelAnimationFrame(this.animationFrame)
        }
      }
      step()
    },
    updateCircleFromPercentage(percent) {
      const targetOffset = 100 - percent
      this.circleStyle = {
        strokeDashoffset: targetOffset,
        transition: 'stroke-dashoffset 0.1s linear',
      }
    },
  },
}
</script>

<style scoped lang="scss">
.countdown-timer {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  .mini-bubble {
    min-height: 26px;
    display: flex;
    align-items: center;
    padding: 0.3rem 0.8rem;
    gap: 0.3rem;
    border: 1px solid var(--border-color);
    background-color: var(--card-bg);
  }

  .timer {
    transform: rotate(-90deg);
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
  }
}
</style>
