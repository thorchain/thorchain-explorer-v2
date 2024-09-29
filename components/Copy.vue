<template>
  <div>
    <copy-icon
      ref="copy"
      :class="['table-icon', 'copy-icon']"
      @click="handleCopy"
    />

    <div
      class="toast"
      :class="{ show: showToast }"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      v-if="showToast"
    >
      <div class="toast-header">
        <div class="ml-2 mb-1 checkmark" @click="closeToast" aria-label="Close">
          <Checkmark class="Checkmark" />
        </div>
      </div>
      <div class="toast-body">
        Node Address copied to clipboard! <br />
        <span style="display: block; margin-top: 10px; font-weight: bold">
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
    handleCopy() {
      this.onlyCopy(this.strCopy)
    },
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

<style scoped>
.toast {
  display: flex;
  position: fixed;
  top: 80px;
  right: 20px;
  min-width: 200px;
  background-color: var(--bg-color);
  padding: 1.5rem;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-20px);
  transition:
    opacity 0.5s ease-in-out,
    transform 0.5s ease-in-out,
    visibility 0.5s;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
}

.toast.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
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
