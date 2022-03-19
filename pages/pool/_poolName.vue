<template>
  <div class="pool-page-container">
    <div class="nav-pool-header">
      <nuxt-link :to="`/pool/${poolName}`">Overview</nuxt-link>
      <nuxt-link :to="`/pool/${poolName}/tx`">Pool Txs</nuxt-link>
    </div>
    <nuxt-child keep-alive></nuxt-child>
  </div>
</template>

<script>
export default {
  async asyncData({ params }) {
    return { poolName: params.poolName };
  },
}
</script>

<style lang="scss">
.pool-page-container {
  .nav-pool-header {
    display: flex;
    margin-bottom: 1rem;
  
    a {
      padding: .5rem .7rem;
      margin: 0 .1rem;
      color: #9f9f9f;
      text-decoration: none;
      border-radius: .3rem;
  
      &:first-of-type {
        margin-left: 0;
      }
  
      &:hover {
        background-color: #3E464B;
      }
  
      &.nuxt-link-exact-active {
        background-color: #3E464B;
        color: #e6e6e6;
      }
    }
  }
}
</style>