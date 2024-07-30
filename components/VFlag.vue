<template>
  <img
    :src="require(`country-flag-icons/flags/3x2/${flag}.svg`)"
    :alt="`flag-${flag}`"
    class="asset-icon country-icon"
  />
</template>

<script>
export default {
  props: ['flag'],
}
</script>

<style lang="scss">
.country-icon {
  border-radius: 0.2rem;
  margin: 0;
}
</style>
