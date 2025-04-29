<template>
  <Page>
    <Header :title="routes.find((e) => e.link === $route.path).text" />
    <div class="pools-page-container">
      <pooled-view v-if="isMainnet()"></pooled-view>
      <nuxt-child />
    </div>
  </Page>
</template>

<script>
import PooledView from './pools/components/pooledView.vue'

export default {
  components: { PooledView },
  data() {
    return {
      routes: [
        {
          text: 'Pools',
          link: '/pools/main',
        },
        {
          text: 'Pool Earnings',
          link: '/pools/earnings',
        },
        {
          text: 'TVL by Chain',
          link: '/pools/tvl',
        },
      ],
    }
  },
}
</script>

<style lang="scss" scoped>
.nav-header {
  margin-bottom: $space-16;

  a {
    padding: $space-8 $space-12;
    margin: $space-0 0.1rem;
    color: var(--font-color);
    text-decoration: none;
    border-radius: $radius-s;

    &:first-of-type {
      margin-left: $space-0;
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
