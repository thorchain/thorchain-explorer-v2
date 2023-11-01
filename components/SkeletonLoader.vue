<template>
  <div class="skeleton-container" :style="customStyle"></div>
</template>

<script>
export default {
  props: ['height', 'width'],
  computed: {
    customStyle() {
      return {
        'height': this.height ?? '.5rem',
        'width': this.height ?? 'auto'
      }
    }
  },
}
</script>

<style lang="scss">
.skeleton-container {
  animation: pulse 2s cubic-bezier(.4, 0, .6, 1) infinite;
  background-color: var(--active-bg-color);
  height: .5rem;
  border-radius: 1rem;
  margin-top: .75rem;
}

@keyframes pulse {
  50% {
    opacity: .5;
  }
}
</style>