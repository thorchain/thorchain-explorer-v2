<template>
  <div class="search-bar-container">
    <div id="search-container" :class="[{'expanded': isSearch}]" @click="search()">
      <input class="search-bar-input"
        type="text" v-model="searchQuery"
        @keyup.enter="find()"
        @blur="isSearch = false"
      >
      <span v-if="!isSearch">Search</span>
      <SearchIcon class="search-icon" @click="find()"/>
    </div>
    <SunIcon @click="changeTheme" v-if="theme === 'light'" class="social-icon"/>
    <MoonIcon @click="changeTheme" v-if="theme === 'dark'" class="social-icon"/>
  </div>
</template>

<script>
import SunIcon from '~/assets/images/eclipse-sun.svg?inline';
import MoonIcon from '~/assets/images/eclipse-moon.svg?inline';
import SearchIcon from '~/assets/images/search.svg?inline';
import { mapGetters } from 'vuex';

export default {
  name: 'SearchBar',
  components: {
    SunIcon,
    MoonIcon,
    SearchIcon
  },
  data() {
    return {
      searchQuery: '',
      isSearch: false,
    }
  },
  methods: {
    find() {
      if (!this.isSearch) {
        document.getElementsByClassName('search-bar-input')[0].focus()
        return
      }
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
    },
    search() {
      this.isSearch = true;
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
  mounted() {
    window.addEventListener('click', (e) => {
      if (!document.getElementById('search-container').contains(e.target)){
        this.isSearch = false;
      }
    });
  }
}
</script>

<style lang="scss">
.search-bar-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  max-width: 90rem;
  margin: auto;
  gap: 10px;

  .social-icon {
    margin-left: .5rem;
    fill: var(--font-color);
    width: 1rem;
    height: 1rem;
  }

  #search-container {
    display: flex;
    position: relative;
    max-width: 600px;
    transition: all .5s ease;

    &.expanded {
      flex: 1;

      .search-icon {
        right: .5rem;
      }
    }

    .search-bar-input {
      flex: 1;
      font-size: .875rem;
      border-radius: 5px;
      height: 40px;
      color: var(--font-color);
      background-color: var(--darker-bg);
      width: 2.5rem;

      &:focus, &:active {
        outline: none;
      }
    }

    .search-icon {
      position: absolute;
      width: 1rem;
      height: 1rem;
      fill: var(--font-color);
      right: calc(1rem - 4px);
      top: calc( 50% - .5rem );
      cursor: pointer;
    }

    span {
      display: none;
      pointer-events: none;
      font-size: .875rem;
      position: absolute;
      left: .7rem;
      top: .8rem;
    }


    @include lg {
      .search-bar-input {
        width: 100px;
      }

      span {
        display: block;
      }
    }
  }

}
</style>
