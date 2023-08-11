<template>
  <div class="dot"></div>
</template>

<script>
export default {
  components: {
  },
  props: [],
  data () {
    return {
    }
  }
}
</script>

<style>
.dot {
  width: .7rem;
  height: .7rem;
  background: var(--primary-color);
  border-radius: 50%;
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
  background: var(--primary-color);
  border-radius: 50%;
}
</style>
