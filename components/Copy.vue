<template>
  <copy-icon
    ref="copy"
    :class="['table-icon', 'copy-icon']"
    @click="onlyCopy(strCopy)"
  />
</template>

<script>
import CopyIcon from '~/assets/images/clone.svg?inline'

export default {
  components: {
    CopyIcon,
  },
  props: ['strCopy'],
  data() {
    return {
      activeComponent: 'CopyIcon',
    }
  },
  methods: {
    onlyCopy(address) {
      navigator.clipboard.writeText(address).then(
        () => {
          this.animate('copy', 'animate', 1000)
        },
        (err) => {
          console.error('Could not copy text: ', err)
        }
      )
    },
  },
}
</script>

<style lang="scss" scoped>
.animate {
  fill: var(--primary-color);
  -webkit-animation: jello-vertical 1s both;
  animation: jello-vertical 1s both;
}

@keyframes jello-vertical {
  0% {
    -webkit-transform: scale3d(1, 1, 1);
    transform: scale3d(1, 1, 1);
  }
  30% {
    -webkit-transform: scale3d(0.75, 1.25, 1);
    transform: scale3d(0.75, 1.25, 1);
  }
  40% {
    -webkit-transform: scale3d(1.25, 0.75, 1);
    transform: scale3d(1.25, 0.75, 1);
  }
  50% {
    -webkit-transform: scale3d(0.85, 1.15, 1);
    transform: scale3d(0.85, 1.15, 1);
  }
  65% {
    -webkit-transform: scale3d(1.05, 0.95, 1);
    transform: scale3d(1.05, 0.95, 1);
  }
  75% {
    -webkit-transform: scale3d(0.95, 1.05, 1);
    transform: scale3d(0.95, 1.05, 1);
  }
  100% {
    -webkit-transform: scale3d(1, 1, 1);
    transform: scale3d(1, 1, 1);
  }
}
</style>
