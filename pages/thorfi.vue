<template>
  <Page>
    <Nav
      :is-link="true"
      :nav-items="routes"
    />
    <div>
      <nuxt-child keep-alive />
    </div>
  </Page>
</template>

<script>
export default {
  data () {
    return {
      routes: [
        {
          link: '/thorfi/savers',
          text: 'Savers'
        },
        {
          link: '/thorfi/synths',
          text: 'Synths'
        },
        {
          link: '/thorfi/trades',
          text: 'Trade Assets'
        },
        {
          link: '/thorfi/runepool',
          text: 'Rune Pool'
        },
        {
          link: '/thorfi/lending',
          text: 'Lending'
        }
      ]
    }
  }
}
</script>
