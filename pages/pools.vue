<template>
  <Page>
    <div class="pools-page-container">
      <Nav is-link="true" :nav-items="navItems" />
      <nuxt-child />
    </div>
  </Page>
</template>

<script>
export default {
  data () {
    return {
      navItems: [
        {
          text: 'Pools',
          link: '/pools'
        },
        {
          text: 'Savers',
          link: '/pools/savers'
        }
      ]
    }
  }
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
