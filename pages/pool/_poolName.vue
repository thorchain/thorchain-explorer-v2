<template>
  <Page>
    <div v-if="poolName" class="pool-header">
      <div>
        <asset-icon :asset="poolName" />
      </div>
      <div>
        {{ poolName }}
      </div>
    </div>
    <Nav
      :is-link="true"
      :nav-items="[
        { link: `/pool/${poolName}`, text: 'Overview' },
        { link: `/pool/${poolName}/lp`, text: 'LP Positions' },
        { link: `/pool/${poolName}/savers`, text: 'Savers' },
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
.pool-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: var(--card-bg-color);
  color: var(--sec-font-color);
  border-radius: $radius-lg;
  padding: $space-12;
  border: 1px solid var(--border-color);
  word-break: break-all;
  margin: $space-0 $space-10;

  @include lg {
    margin: $space-0;
  }
}
.nav-pool-header {
  display: flex;
  margin-bottom: $space-16;

  a {
    padding: $space-8 $space-12;
    margin: 0 0.1rem;
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
