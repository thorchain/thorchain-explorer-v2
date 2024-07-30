<template>
  <div class="skeleton-container" :style="customStyle"></div>
</template>

<script>
export default {
  props: ['height', 'width'],
  computed: {
    customStyle() {
      return {
        height: this.height ?? '.5rem',
        width: this.height ?? 'auto',
      }
    },
  },
}
</script>

<style lang="scss">
.skeleton-container {
  animation: skeleton 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  background-color: var(--active-bg-color);
  height: 0.5rem;
  border-radius: 1rem;
  margin-top: 0.75rem;
}

@keyframes skeleton {
  50% {
    opacity: 0.5;
  }
}
</style>
