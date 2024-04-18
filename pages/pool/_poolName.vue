<template>
  <Page>
    <Nav
      :is-link="true"
      :nav-items="[
        {link: `/pool/${poolName}`, text: 'Overview'},
        {link: `/pool/${poolName}/lp`, text: 'LP Positions'},
      ]"
    />
    <nuxt-child keep-alive />
  </Page>
</template>

<script>
export default {
  async asyncData ({ params }) {
    return { poolName: params.poolName }
  }
}
</script>

<style lang="scss">
.nav-pool-header {
  display: flex;
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
