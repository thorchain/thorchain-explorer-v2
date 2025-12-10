<template>
  <div class="chart-loader-container">
    <div class="chart-skeleton">
      <div ref="container" class="chart-content-skeleton">
        <div class="chart-area-skeleton">
          <div class="chart-bars" :style="{ gap: gapWidth }">
            <skeleton-loader
              :height="`${Math.random() * 60 + 30}%`"
              :width="barWidth"
              v-for="i in barCount"
              :key="`bar-${i}`"
              class="bar-skeleton"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChartLoader',
  props: {
    barCount: {
      type: Number,
      default: 30,
    },
  },
  data() {
    return {
      isMobile: false,
      containerWidth: 0,
    }
  },
  computed: {
    gapAndWidth() {
      if (!this.containerWidth || this.barCount === 0) {
        return { gap: '6px', width: '15px' }
      }

      const minWidth = 450
      const maxWidth = 720
      const minGap = 1
      const maxGap = 6
      const minBarWidth = 1
      const maxBarWidth = 15

      // Calculate ratio based on container width for scaling
      let ratio
      if (this.containerWidth <= minWidth) {
        ratio = 0
      } else if (this.containerWidth >= maxWidth) {
        ratio = 1
      } else {
        ratio = (this.containerWidth - minWidth) / (maxWidth - minWidth)
      }

      // Start with ideal gap and width based on container width scaling
      let targetGap = minGap + (maxGap - minGap) * ratio
      let targetWidth = minBarWidth + (maxBarWidth - minBarWidth) * ratio

      // Calculate what the total width would be with these values
      const totalNeeded = this.barCount * targetWidth + (this.barCount - 1) * targetGap

      // If it doesn't fit, we need to adjust
      if (totalNeeded > this.containerWidth) {
        // Scale down proportionally to fit
        const scale = this.containerWidth / totalNeeded
        targetGap *= scale
        targetWidth *= scale
      }

      // Ensure gap stays within bounds
      targetGap = Math.max(minGap, Math.min(maxGap, targetGap))

      // Calculate width based on remaining space
      const gapSpace = (this.barCount - 1) * targetGap
      const availableForBars = this.containerWidth - gapSpace
      let calculatedWidth = availableForBars / this.barCount

      // If calculated width is outside bounds, adjust gap to bring it in bounds
      if (calculatedWidth < minBarWidth) {
        // Width too small, reduce gap to minimum needed
        const maxGapAllowed = (this.containerWidth - this.barCount * minBarWidth) / (this.barCount - 1)
        targetGap = Math.max(minGap, Math.min(maxGap, maxGapAllowed))
        const newGapSpace = (this.barCount - 1) * targetGap
        calculatedWidth = (this.containerWidth - newGapSpace) / this.barCount
      } else if (calculatedWidth > maxBarWidth) {
        // Width too large, increase gap to maximum allowed
        const minGapNeeded = (this.containerWidth - this.barCount * maxBarWidth) / (this.barCount - 1)
        targetGap = Math.max(minGap, Math.min(maxGap, minGapNeeded))
        const newGapSpace = (this.barCount - 1) * targetGap
        calculatedWidth = (this.containerWidth - newGapSpace) / this.barCount
      }

      // Final clamp to ensure bounds
      const finalGap = Math.max(minGap, Math.min(maxGap, targetGap))
      const finalWidth = Math.max(minBarWidth, Math.min(maxBarWidth, calculatedWidth))

      return {
        gap: finalGap + 'px',
        width: finalWidth + 'px',
      }
    },
    gapWidth() {
      return this.gapAndWidth.gap
    },
    barWidth() {
      return this.gapAndWidth.width
    },
  },
  mounted() {
    this.checkScreenSize()
    this.updateContainerWidth()
    window.addEventListener('resize', this.checkScreenSize)
    window.addEventListener('resize', this.updateContainerWidth)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.checkScreenSize)
    window.removeEventListener('resize', this.updateContainerWidth)
  },
  methods: {
    checkScreenSize() {
      this.isMobile = window.innerWidth < 990
    },
    updateContainerWidth() {
      this.$nextTick(() => {
        if (this.$refs.container) {
          this.containerWidth = this.$refs.container.offsetWidth
        }
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.chart-loader-container {
  width: 100%;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow: hidden;
}

.chart-skeleton {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.chart-content-skeleton {
  flex: 1;
  display: flex;
  align-items: stretch;
  min-height: 350px;
}

.chart-area-skeleton {
  flex: 1;
  display: flex;
  align-items: flex-end;
  position: relative;
  min-height: 350px;
  padding-bottom: 0;
}

.chart-bars {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  z-index: 2;
}

.bar-skeleton {
  min-height: 30px;
  border-radius: 999px 999px 0 0;
  margin: 0 !important;
}
</style>
