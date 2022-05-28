<template>
  <div class="search-bar-container">
    <input class="search-bar-input" type="text" placeholder="Enter Transaction ID or Address then press ENTER" v-model="searchQuery" @keyup.enter="find()">
    <SunIcon @click="changeTheme" v-if="theme === 'light'" class="social-icon"/>
    <MoonIcon @click="changeTheme" v-if="theme === 'dark'" class="social-icon"/>
  </div>
</template>

<script>
import SunIcon from '~/assets/images/eclipse-sun.svg?inline';
import MoonIcon from '~/assets/images/eclipse-moon.svg?inline';
import { mapGetters } from 'vuex';

export default {
  name: 'SearchBar',
  components: {
    SunIcon,
    MoonIcon
  },
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
        //TERRA
        search.startsWith('terra') ||
        //ETH
        search.startsWith('0X')
      ) {
        this.$router.push({ path: `/address/${this.searchQuery}` });
      }
      else {
        // this.$api.getTx(this.searchQuery).then()
        this.$router.push({ path: `/tx/${this.searchQuery}` })
      }
    },
    changeTheme() {
      if (this.theme == 'dark') {
        this.$store.commit('setTheme', false)

      }
      else {
        this.$store.commit('setTheme', true)

      }
    }
  },
  watch:{
    $route (to, from){
      this.searchQuery = '';
    }
  },
  computed: {
    ...mapGetters({
      theme: 'getTheme'
    })
  },
}
</script>

<style lang="scss">
.search-bar-container {
  display: flex;
  align-items: center;

  .social-icon {
    margin-left: .5rem;
    fill: var(--font-color);
    width: 1.5rem;
    height: 1.5rem;
  }

  .search-bar-input {
    width: 100%;
    border-radius: 5px;
    height: 3rem;
    background-color: var(--bg-color);
    color: var(--font-color);
  }
}
</style>