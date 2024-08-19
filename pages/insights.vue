<template>
  <Page>
    <Nav
      :is-link="true"
      :nav-items="[
        { link: `/insights`, text: 'Overview' },
        { link: `/insights/apr`, text: 'APR' },
      ]"
    />
    <nuxt-child />
  </Page>
</template>

<script>
export default {
  head: {
    title: 'THORChain Network Explorer | Insights',
  },
}
</script>

<style lang="scss" scoped></style>
