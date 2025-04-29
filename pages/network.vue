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
      ],
    }
  },
}
</script>

<style lang="scss" scoped>
.nav-header {
  margin-bottom: 1rem;

  a {
    padding: 0.5rem 0.7rem;
    margin: 0 0.1rem;
    color: var(--font-color);
    text-decoration: none;
    border-radius: $radius-s;

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
