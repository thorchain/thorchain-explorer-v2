<template>
  <ip-icon
    ref="copy"
    :class="['table-icon', 'copy-icon', { disabled: !strCopy }]"
    @click="onlyCopy(strCopy)"
  />
</template>

<script>
import IpIcon from '~/assets/images/ip.svg?inline'

export default {
  components: {
    IpIcon,
  },
  props: ['strCopy'],
  data() {
    return {
      activeComponent: 'CopyIcon',
    }
  },
  methods: {
    onlyCopy(strCopy) {
      if (!strCopy) {
        return
      }

      navigator.clipboard.writeText(strCopy).then(
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

.disabled {
  fill: var(--red);
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
