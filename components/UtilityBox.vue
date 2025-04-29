<template lang="">
  <div class="utility-wrapper">
    <copy :str-copy="value" style="height: 16px" />
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
  padding: $space-5;
  border-radius: $radius-s;
  background-color: var(--bg-color);
  height: 1.6rem;

  .divider {
    margin: $space-0 $space-8;

    &::after {
      display: block;
      content: ' ';
      border-right: 1px solid var(--border-color);
      height: 16px;
    }
  }
}
</style>
