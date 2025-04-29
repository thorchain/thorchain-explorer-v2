<template>
  <div class="progress-wrapper" :style="vars">
    <div
      class="progress-bar"
      :style="{
        width: (width > 100 ? 100 : width) + '%',
        background: color,
      }"
    />
    <span v-if="extraText" class="progress-text">{{ extraText }}</span>
  </div>
</template>

<script>
export default {
  props: ['width', 'height', 'extraText', 'color'],
  computed: {
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
  height: var(--bar-height);
  border-radius: $radius-s;
  width: 100%;
  background-color: var(--border-color);

  .progress-bar {
    height: var(--bar-height);
    border-radius: $radius-s;
    width: 1%;
    background-color: var(--primary-color);

    transition: width 700ms;
  }

  .progress-text {
    display: flex;
    justify-content: center;
    color: var(--sec-font-color);
    margin-top: var(--bar-height);
    font-size: $font-size-sm;
  }
}
</style>
