<template lang="">
  <div
    class="qr-wrapper"
    @mouseover="showQR = true"
    @mouseleave="showQR = false"
  >
    <qr-icon class="icon small" />
    <transition name="fade">
      <div v-show="showQR" class="qr-show">
        <qrcode-vue :value="qrcode" render-as="svg" />
      </div>
    </transition>
  </div>
</template>
<script>
import QrcodeVue from 'qrcode.vue'
import QrIcon from '~/assets/images/expand.svg?inline'
export default {
  components: {
    QrcodeVue,
    QrIcon,
  },
  props: ['qrcode'],
  data() {
    return {
      showQR: false,
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
    span {
      color: var(--primary-color);
    }

    .icon {
      fill: var(--primary-color);
    }
  }

  .icon {
    width: 0.9rem;
    height: 0.9rem;
    margin-right: 0;
  }

  .qr-show {
    border-radius: 0.3rem;
    background-color: #fff;
    padding: 0.625rem;
    top: calc(100% + 0.625rem);
    position: absolute;
    z-index: 999;
    border: 1px solid var(--border-color);
  }
}
</style>
