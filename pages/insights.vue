<template>
  <div>
    <Nav
      :isLink="true"
      :navItems="[
        {link: `/insights`, text: 'Overview'},
        {link: `/insights/network`, text: 'Network'},
        {link: `/insights/price`, text: 'Rune Price'},
      ]"
    ></Nav>
    <nuxt-child></nuxt-child>
  </div>
</template>

<script>
export default {

}
</script>

<style lang="scss">
.footer {
  display: block;
  margin: 1rem 0 .3rem .5rem;
}


</style>
