<template lang="">
  <div class="utility-wrapper" style="margin-left: 0.7rem">
    <copy :str-copy="value" />
    <div class="divider" />
    <qr-btn :qrcode="value" />
  </div>
</template>
<script>
export default {
  props: ['value'],
}
</script>
<style lang="scss">
.utility-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem;
  border-radius: 0.3rem;
  background-color: var(--bg-color);

  .divider {
    margin: 0 8px;

    &::after {
      display: block;
      content: ' ';
      border-right: 1px solid var(--border-color);
      height: 16px;
    }
  }
}
</style>
