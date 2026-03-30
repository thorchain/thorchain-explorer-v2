<template>
  <div>
    <img
      v-if="imgPath"
      :src="imgPath"
      :alt="`flag-${flag}`"
      class="asset-icon country-icon"
    />
    <span v-else>-</span>
  </div>
</template>

<script>
export default {
  props: ['flag'],
  computed: {
    imgPath() {
      if (!this.flag) {
        return undefined
      }

      return require(`country-flag-icons/3x2/${String(this.flag).toUpperCase()}.svg`)
    },
  },
}
</script>

<style lang="scss">
.country-icon {
  border-radius: $radius-sm;
  margin: $space-0;
}
</style>
