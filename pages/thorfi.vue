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
          link: '/thorfi/synths',
          text: 'Synths'
        },
        {
          link: '/thorfi/savers',
          text: 'Savers'
        }
      ]
    }
  }
}
</script>
