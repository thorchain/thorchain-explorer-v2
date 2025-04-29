<template>
  <div class="dot" :style="vars"></div>
</template>

<script>
export default {
  components: {},
  props: ['color'],
  computed: {
    vars() {
      return {
        '--dot-color': this.color ?? 'var(--primary-color)',
      }
    },
  },
}
</script>

<style lang="scss">
.dot {
  width: 0.7rem;
  height: 0.7rem;
  background: var(--dot-color);
  border-radius: $radius-full;
  position: relative;
}

.dot::after {
  animation: pulse 1000ms cubic-bezier(0.9, 0.7, 0.5, 0.9) infinite;
}

@keyframes pulse {
  0% {
    opacity: 0;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.3;
  }
}

.dot::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: var(--dot-color);
  border-radius: $radius-full;
}
</style>
