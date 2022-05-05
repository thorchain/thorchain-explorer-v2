<template>
  <div class="network-page-container">
    <div class="nav-header">
      <nuxt-link to="/network">Network</nuxt-link>
      <nuxt-link to="/network/settings">Network Settings</nuxt-link>
      <nuxt-link to="/network/votes">Mimir Votes</nuxt-link>
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
    color: var(--font-color);
    text-decoration: none;
    border-radius: .3rem;

    &:first-of-type {
      margin-left: 0;
    }

    &:hover {
      background-color: var(--active-bg-color);
    }

    &.nuxt-link-exact-active {
      background-color: var(--active-bg-color);
      color: var(--sec-font-color);
    }
  }
}
</style>