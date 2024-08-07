<template>
  <Page>
    <Nav
      :is-link="true"
      :nav-items="[
        { link: `/pool/${poolName}`, text: 'Overview' },
        { link: `/pool/${poolName}/lp`, text: 'LP Positions' },
      ]"
    />
    <nuxt-child keep-alive />
  </Page>
</template>

<script>
export default {
  asyncData({ params }) {
    return { poolName: params.poolName }
  },
  head: {
    title: 'THORChain Network Explorer | Pool stats',
  },
}
</script>

<style lang="scss">
.nav-pool-header {
  display: flex;
  margin-bottom: 1rem;

  a {
    padding: 0.5rem 0.7rem;
    margin: 0 0.1rem;
    color: var(--font-color);
    text-decoration: none;
    border-radius: 0.3rem;

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
