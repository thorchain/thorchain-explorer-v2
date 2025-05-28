<template>
  <Page>
    <Header :title="routes.find((e) => e.link === $route.path).text" />
    <div>
      <nuxt-child />
    </div>
  </Page>
</template>

<script>
export default {
  data() {
    return {
      routes: [
        {
          text: 'Network',
          link: '/network',
        },
        {
          text: 'Network Settings',
          link: '/network/settings',
        },
        {
          text: 'Votes',
          link: '/network/votes',
        },
        {
          text: 'Churn & Pool countdown',
          link: '/network/churn',
        },
        {
          text: 'Pendulum',
          link: '/network/pendulum',
        },
        {
          name: 'Outbound Fees',
          link: '/network/outbounds',
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
