<template>
  <div class="progress-wrapper" :style="vars">
    <template v-for="(bar, i) in bars">
      <div
        :key="i"
        v-tooltip="bar.name"
        class="bar"
        :style="{ width: `${bar.value}%`, backgroundColor: bar.color }"
      />
    </template>
  </div>
</template>

<script>
export default {
  props: {
    options: {
      type: Array,
      default: () => [],
    },
    height: String,
  },
  computed: {
    bars() {
      // colors
      let colors = ['#63FDD9', '#F3BA2F', '#00CCFF', '#FF4954']
      if (this.theme === 'light') {
        colors = ['#3ca38b', '#F3BA2F', '#00CCFF', '#FF4954']
      }

      if (!this.options && !this.options.length < 1) {
        return []
      }

      let total = 0
      for (let i = 0; i < this.options.length; i++) {
        if (this.options[i].value < 0) {
          continue
        }
        total += +this.options[i].value
      }

      return this.options.map((e, i) => ({
        value: e.value > 0 ? (e.value / total) * 100 : 0,
        color: e.color || colors[i],
        name: e.name || 'Empty',
      }))
    },
    vars() {
      return {
        '--bar-height': this.height ?? '10px',
      }
    },
  },
}
</script>

<style lang="scss">
.progress-wrapper {
  display: flex;
  height: var(--bar-height);
  border-radius: $radius-s;
  width: 100%;
  background-color: var(--border-color);

  .bar {
    height: var(--bar-height);
    width: 1%;
    background-color: var(--primary-color);
    transition: width 700ms;

    &:last-of-type {
      border-radius: 0 $radius-s $radius-s 0;
    }

    &:first-of-type {
      border-radius: $radius-s 0 0 $radius-s;
    }
  }
}
</style>
