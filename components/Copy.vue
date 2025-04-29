<template>
  <div class="copy-icon-container">
    <copy-icon
      ref="copy"
      :class="['table-icon', 'copy-icon']"
      :style="{
        width: size === 'small' ? '0.92rem' : '1rem',
        height: size === 'small' ? '0.92rem' : '1rem',
      }"
      @click="onlyCopy(strCopy)"
    />

    <transition name="toast">
      <div v-if="showToast" class="toast">
        <div class="toast-header">
          <div class="checkmark">
            <Checkmark class="Checkmark" />
          </div>
        </div>
        <div class="toast-body mono">
          copied to clipboard! <br />
          <span class="copy-text">
            {{ strCopy }}
          </span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import CopyIcon from '~/assets/images/clone.svg?inline'
import Checkmark from '~/assets/images/square-checkmark.svg?inline'

export default {
  components: {
    CopyIcon,
    Checkmark,
  },
  props: ['strCopy', 'size', 'hideToast'],
  data() {
    return {
      showToast: false,
    }
  },
  methods: {
    onlyCopy(strCopy) {
      navigator.clipboard.writeText(strCopy).then(
        () => {
          this.animate('copy', 'animate', 1000)
          if (this.hideToast) {
            return
          }
          this.showToastNotification()
        },
        (err) => {
          console.error('Could not copy text: ', err)
        }
      )
    },
    showToastNotification() {
      this.showToast = true
      setTimeout(() => {
        this.closeToast()
      }, 3000)
    },
    closeToast() {
      this.showToast = false
    },
  },
}
</script>

<style lang="scss" scoped>
.copy-icon-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  height: 1rem;
}

.toast {
  display: flex;
  position: fixed;
  top: 80px;
  right: 5%;
  padding: $space-8;
  width: 90%;
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-lg;
  z-index: 9999;

  @include lg {
    top: 80px;
    right: 20px;
    width: auto;
    padding: $space-16;
  }
}

@keyframes jello-in {
  0% {
    transform: scale3d(0.8, 0.8, 1);
    opacity: 0;
  }
  50% {
    transform: scale3d(1.1, 1.1, 1);
    opacity: 1;
  }
  100% {
    transform: scale3d(1, 1, 1);
  }
}

@keyframes jello-out {
  0% {
    transform: scale3d(1, 1, 1);
    opacity: 1;
  }
  50% {
    transform: scale3d(1.1, 1.1, 1);
    opacity: 1;
  }
  100% {
    transform: scale3d(0.8, 0.8, 1);
    opacity: 0;
  }
}

.toast-enter,
.toast-leave-to {
  opacity: 0;
}

.toast-enter-active {
  animation: jello-in 0.5s forwards;
}

.toast-leave-active {
  animation: jello-out 0.5s forwards;
}

.toast-body {
  overflow: hidden;
  font-size: $font-size-s;
  line-height: 1.5;
  color: var(--primary-color);
  text-align: left;
  font-weight: 200;
  padding: $space-8 $space-0;

  .copy-text {
    color: var(--sec-font-color);
    display: block;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
}

.Checkmark {
  display: flex;
  width: 40px;
  height: 40px;
  justify-items: center;
  padding-right: $space-16;
}

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
