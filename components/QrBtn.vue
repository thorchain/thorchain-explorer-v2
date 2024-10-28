<template>
  <div class="qr-wrapper" @click="showQR = true">
    <qr-icon class="icon small" />
    <transition name="fade">
      <div v-show="showQR" class="modal-background" @click.stop>
        <div class="qr-show">
          <div class="qr-body">
            Address QR Code!
            <CrossIcon class="close-btn" @click.stop="showQR = false" />
          </div>
          <div class="line"></div>
          <qrcode-vue
            :value="qrcode"
            render-as="svg"
            :size="size"
            class="qr-code"
          />
          <div class="qr-text mono">
            {{ qrcode }}
          </div>
        </div>
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
    }
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
    margin-right: 0;
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
    border-radius: 0.3rem;
    background-color: var(--bg-color);
    padding: 1rem;
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
      font-size: 1rem;
      font-weight: bold;

      .close-btn {
        width: 20px;
        height: 20px;
        cursor: pointer;
      }
    }

    .qr-code {
      padding: 0.5rem;
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
  font-size: 0.9rem;
}
</style>

