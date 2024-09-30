<template>
  <div>
    <copy-icon
      ref="copy"
      :class="['table-icon', 'copy-icon']"
      @click="onlyCopy(strCopy)"
    />

    <div v-if="showToast" class="toast" :class="{ show: showToast }">
      <div class="toast-header">
        <div class="checkmark">
          <Checkmark class="Checkmark" />
        </div>
      </div>
      <div class="toast-body">
        copied to clipboard! <br />
        <span class="copy-text">
          {{ strCopy }}
        </span>
      </div>
    </div>
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
  props: ['strCopy'],
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
.toast {
  display: flex;
  position: fixed;
  top: 80px;
  right: 5%;
  padding: 0.5rem;
  width: 90%;
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  z-index: 9999;

  @include lg {
    top: 80px;
    right: 20px;
    width: auto;
    padding: 1rem;
  }
  .copy-text {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
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

.toast.show {
  opacity: 1;
  visibility: visible;
  animation: jello-in 0.5s forwards;
}

.toast:not(.show) {
  animation: jello-out 0.5s forwards;
}

.toast-body {
  overflow: hidden;
}

.Checkmark {
  display: flex;
  width: 40px;
  height: 40px;
  justify-items: center;
  padding-right: 1rem;
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
