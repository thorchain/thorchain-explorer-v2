<template>
  <Page>
    <div class="pools-page-container">
      <pooled-view></pooled-view>
      <Nav is-link="true" :nav-items="navItems" />
      <nuxt-child />
    </div>
  </Page>
</template>

<script>
import PooledView from './pools/components/pooledView.vue'

export default {
  components: { PooledView },
  data () {
    return {
      navItems: [
        {
          text: 'Pools',
          link: '/pools'
        },
        {
          text: 'TVL by Chain',
          link: '/pools/tvl'
        },
        {
          text: 'Historical Pools',
          link: '/pools/historical'
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
