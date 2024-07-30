<template>
  <Page>
    <Nav
      :is-link="true"
      :nav-items="[
        { link: `/insights`, text: 'Overview' },
        { link: `/insights/network`, text: 'Network' },
        { link: `/insights/apr`, text: 'APR' },
      ]"
    />
    <nuxt-child />
  </Page>
</template>

<script>
export default {}
</script>

<style lang="scss" scoped></style>
