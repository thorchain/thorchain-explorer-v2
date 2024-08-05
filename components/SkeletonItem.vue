<template>
  <component
    :is="loading ? 'skeleton-loader' : 'div'"
    :class="loading ? customClass : false"
  >
    <slot></slot>
  </component>
</template>

<script>
export default {
  props: ['loading', 'customClass'],
}
</script>

<style lang="scss"></style>
