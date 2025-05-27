<template>
  <Page>
    <Header :title="routes.find((e) => e.link === $route.path).text" />
    <div>
      <nuxt-child keep-alive />
    </div>
  </Page>
</template>

<script>
export default {
  data() {
    return {
      routes: [
        {
          link: '/thorfi/tcy',
          text: 'TCY',
        },
        {
          link: '/thorfi/savers',
          text: 'Savers',
        },
        {
          link: '/thorfi/synths',
          text: 'Synths',
        },
        {
          name: 'Secured',
          link: '/thorfi/secured',
        },
        {
          link: '/thorfi/trades',
          text: 'Trade Assets',
        },
        {
          link: '/thorfi/runepool',
          text: 'Rune Pool',
        },
        {
          name: 'Denoms',
          link: '/thorfi/denom',
        },
      ],
    }
  },
}
</script>
