<template>
  <Card :class="['loading-container', extraClass]">
    <BounceLoader color="var(--font-color)" size="3rem"></BounceLoader>
  </Card>
</template>

<script>
import BounceLoader from 'vue-spinner/src/BounceLoader.vue';

export default {
  props: ['extraClass'],
  components: {
    BounceLoader
  }
}
</script>

<style lang="scss" scoped>
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}
</style>