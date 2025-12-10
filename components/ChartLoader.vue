<template>
  <div ref="container" class="chart-loader-container">
    <div class="chart-skeleton">
      <div class="chart-content-skeleton">
        <div class="chart-area-skeleton">
          <div class="chart-bars">
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
    barWidth() {
      // Linear interpolation from 11px to 15px based on container width
      // Assuming min width ~450px -> 11px, max width ~720px -> 15px
      const minWidth = 450
      const maxWidth = 720
      const minBarWidth = 11
      const maxBarWidth = 15

      if (this.containerWidth <= minWidth) {
        return minBarWidth + 'px'
      }
      if (this.containerWidth >= maxWidth) {
        return maxBarWidth + 'px'
      }

      const ratio = (this.containerWidth - minWidth) / (maxWidth - minWidth)
      return minBarWidth + (maxBarWidth - minBarWidth) * ratio + 'px'
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
  gap: 1px;
  z-index: 2;
}

.bar-skeleton {
  min-height: 30px;
  border-radius: 999px 999px 0 0;
  margin: 0;
}

@media (max-width: 768px) {
  .chart-bars {
    gap: 1px;
  }
}
</style>
