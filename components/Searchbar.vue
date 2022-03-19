<template>
  <div class="search-bar-container">
    <input class="search-bar-input" type="text" placeholder="Enter Transaction ID or Address then press ENTER" v-model="searchQuery" @keyup.enter="find()">
  </div>
</template>

<script>
export default {
  name: 'SearchBar',
  data() {
    return {
      searchQuery: ''
    }
  },
  methods: {
    find() {
      let search = this.searchQuery.toUpperCase();
      if (
        //THORCHAIN
        search.startsWith('THOR') ||
        search.startsWith('TTHOR') ||
        search.startsWith('STHOR') ||
        //BNB
        search.startsWith('BNB') ||
        search.startsWith('TBNB') ||
        //BITCOIN
        search.startsWith('BC1') ||
        search.startsWith('TB1') ||
        //LTC
        search.startsWith('LTC') ||
        search.startsWith('TLTC') ||
        //ETH
        search.startsWith('0X')
      ) {
        this.$router.push({ path: `/address/${this.searchQuery}` });
      }
      else {
        // this.$api.getTx(this.searchQuery).then()
        this.$router.push({ path: `/tx/${this.searchQuery}` })
      }
    }
  },
  watch:{
    $route (to, from){
      this.searchQuery = '';
    }
} 
}
</script>

<style lang="scss">
.search-bar-container {
  .search-bar-input {
    width: 100%;
    border-radius: 5px;
    height: 3rem;
    background-color: #191C1E;
  }
}
</style>