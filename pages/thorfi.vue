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
          link: '/thorfi/pol',
          text: 'Protocol Owned Liquidity'
        }
      ]
    }
  }
}
</script>
