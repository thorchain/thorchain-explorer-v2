<template>
  <div class="qr-wrapper" @click="showQR = true">
    <qr-icon class="icon small" />
    <transition name="fade">
      <div v-show="showQR" class="modal-background" @click.stop>
        <div class="qr-show">
          <div class="qr-body">
            QR Code!
            <CrossIcon class="close-btn" @click.stop="showQR = false" />
          </div>
          <div class="line"></div>
          <qrcode-vue
            :value="qrcode"
            render-as="svg"
            :size="size"
            class="qr-code"
          />

          <div class="click-overlay" @click="onlyCopy(qrcode)"></div>

          <div class="qr-text mono">
            {{ qrcode }}
          </div>
        </div>
      </div>
    </transition>

    <transition name="toast-fade">
      <div v-if="showToast" class="toast-notification">
        copied to clipboard!
      </div>
    </transition>
  </div>
</template>
<script>
import QrcodeVue from 'qrcode.vue'
import QrIcon from '~/assets/images/expand.svg?inline'
import CrossIcon from '~/assets/images/cross.svg?inline'

export default {
  components: {
    QrcodeVue,
    QrIcon,
    CrossIcon,
  },
  props: ['qrcode'],
  data() {
    return {
      showQR: false,
      size: 200,
      showToast: false,
    }
  },
  methods: {
    onlyCopy(qrcode) {
      navigator.clipboard.writeText(qrcode).then(
        () => {
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
        this.showToast = false
      }, 2000)
    },
  },
}
</script>
<style lang="scss" scoped>
.qr-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    .icon {
      fill: var(--primary-color);
    }
  }

  .icon {
    width: 0.9rem;
    height: 0.9rem;
    margin-right: $space-0;
  }

  .modal-background {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 998;
  }

  .qr-show {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    border-radius: $radius-s;
    background-color: var(--bg-color);
    padding: $space-16;
    z-index: 999;
    border: 1px solid var(--border-color);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    color: var(--sec-font-color);
    text-align: center;
    width: 21rem;
    height: 22rem;

    .qr-body {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: $font-size-desktop;
      font-weight: bold;

      .close-btn {
        width: 20px;
        height: 20px;
        cursor: pointer;
        &:hover {
          color: var(--primary-color);
        }
      }
    }

    .qr-code {
      padding: $space-8;
    }

    .click-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 200px;
      height: 200px;
      cursor: pointer;
      background: transparent;
      cursor: pointer;
    }

    .line {
      border: 0.5px solid var(--border-color);
      width: 100%;
    }
  }
}
.qr-text {
  color: var(--sec-font-color);
  display: block;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  word-wrap: break-word;
  word-break: break-all;
  font-size: $font-size-sm;
}

.toast-notification {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--bg-color);
  color: var(--sec-font-color);
  padding: $space-10 $space-20;
  border-radius: $radius-s;
  font-size: $font-size-sm;
  opacity: 0.9;
  z-index: 1000;
  transition: opacity 0.3s;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.5s;
}

.toast-fade-enter,
.toast-fade-leave-to {
  opacity: 0;
}
</style>
