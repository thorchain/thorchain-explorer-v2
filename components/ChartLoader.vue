<template>
  <div class="chart-loader-container">
    <div class="chart-skeleton">
      <div class="chart-content-skeleton">
        <div class="chart-area-skeleton">
          <div class="chart-bars">
            <skeleton-loader
              v-for="i in responsiveBarCount"
              :key="`bar-${i}`"
              class="bar-skeleton"
              :style="{
                height: `${Math.random() * 60 + 30}%`,
                width: '12px',
                borderRadius: '999px 999px 0 0',
              }"
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
      default: 20,
    },
  },
  data() {
    return {
      isMobile: false,
    }
  },
  computed: {
    responsiveBarCount() {
      if (this.isMobile) {
        return Math.max(Math.floor(this.barCount / 2), 8)
      }
      if (window.innerWidth < 1200) {
        return Math.max(Math.floor(this.barCount * 0.7), 10)
      }
      return this.barCount
    },
  },
  mounted() {
    this.checkScreenSize()
    window.addEventListener('resize', this.checkScreenSize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.checkScreenSize)
  },
  methods: {
    checkScreenSize() {
      this.isMobile = window.innerWidth < 990
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
  gap: 4px;
  padding-left: 4px;
  padding-right: 4px;
  z-index: 2;
}
.bar-skeleton {
  min-height: 30px;
}
@media (max-width: 768px) {
  .chart-bars {
    gap: 2px;
    padding-left: 2px;
    padding-right: 2px;
  }
  .bar-skeleton {
    width: 7px !important;
  }
}
</style>
