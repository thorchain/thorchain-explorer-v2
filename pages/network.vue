<template>
  <div class="network-page-container">
    <div class="nav-header">
      <nuxt-link to="/network">Network</nuxt-link>
      <nuxt-link to="/network/constants">Constants</nuxt-link>
    </div>
    <nuxt-child></nuxt-child>
  </div>
</template>

<script>
export default {

}
</script>

<style lang="scss" scoped>
.nav-header {
  margin-bottom: 1rem;

  a {
    padding: .5rem .7rem;
    margin: 0 .1rem;
    color: #9f9f9f;
    text-decoration: none;
    border-radius: .3rem;

    &:first-of-type {
      margin-left: 0;
    }

    &:hover {
      background-color: #3E464B;
    }

    &.nuxt-link-exact-active {
      background-color: #3E464B;
      color: #e6e6e6;
    }
  }
}
</style>