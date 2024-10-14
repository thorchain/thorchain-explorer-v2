<template>
  <div class="color-hash" :style="{ background: vaultColor(name) }"></div>
</template>
<script>
export default {
  props: ['name'],
}
</script>
<style lang="scss" scoped>
.color-hash {
  height: 10px;
  width: 10px;
  border-radius: 50%;

  &:hover {
    filter: brightness(150%);
  }
}
</style>
