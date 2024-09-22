<template>
  <main
    id="dashboard-layout"
    :class="{
      'long-sidebar': menu,
      fullscreen: fullscreen,
      'show-sidebar': sidebar,
    }"
  >
    <header id="header">
      <searchbar />
    </header>
    <!-- Navbar -->
    <nav id="navbar">
      <navbar />
    </nav>
    <div class="background-container">
      <div class="search-bar">
        <div class="title-search">THORChain Blockchain Explorer</div>
        <div class="search-container">
          <div id="search-bar-container">
            <input
              ref="searchInput"
              v-model="searchQuery"
              class="search-input"
              type="text"
              placeholder="Search by Address / Txn Hash / THORName"
              @keyup.enter="find"
              @focus="isSearch = true"
              @blur="isSearch = false"
            />
            <SearchIcon class="search-icon" @click="find" />
          </div>
        </div>
      </div>
    </div>
    <!-- Main content -->
    <main id="main-content">
      <Nuxt />
    </main>
  </main>
</template>

<script>
import Vue from 'vue'
import { mapGetters } from 'vuex'
import global from '~/mixins.js/global'
import SearchIcon from '~/assets/images/search.svg?inline'

export default {
  name: 'DefaultLayout',
  components: {
    SearchIcon,
  },
  data() {
    return {
      searchQuery: '',
      isSearch: false,
      darkMode: false,
      updateInterval: undefined,
    }
  },
  computed: {
    ...mapGetters({
      theme: 'getTheme',
      menu: 'getIsMenuOn',
      fullscreen: 'getFullScreen',
      sidebar: 'getSidebar',
    }),
  },
  watch: {
    darkMode() {
      if (this.darkMode) {
        this.$store.commit('setTheme', true)
      } else {
        this.$store.commit('setTheme', false)
      }
    },
  },
  mounted() {
    const htmlElement = document.documentElement

    const savedTheme =
      localStorage.getItem('theme') === 'light'
        ? false
        : true || !!window.matchMedia('(prefers-color-scheme: dark)').matches

    htmlElement.setAttribute('theme', savedTheme === false ? 'light' : 'dark')
    this.darkMode = savedTheme

    this.getRunePrice()

    this.$api
      .getNodes()
      .then(({ data }) => {
        this.$store.commit('setNodesData', data)
      })
      .catch((e) => console.error(e))

    this.$api
      .getNetwork()
      .then(({ data }) => {
        this.$store.commit('setNetworkData', data)
      })
      .catch((e) => console.error(e))

    this.$api
      .getPools()
      .then(({ data }) => {
        this.$store.commit('setPools', data)
      })
      .catch((e) => console.error(e))

    this.getChainsHeight()

    this.updateInterval = setInterval(() => {
      this.getChainsHeight()
      this.getRunePrice()
    }, 10000)

    const changeHeight = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    changeHeight()

    window.addEventListener('resize', changeHeight)
  },
  destroyed() {
    clearInterval(this.updateInterval)
  },
  methods: {
    find() {
      if (!this.isSearch) {
        this.$refs.searchInput.focus()
        return
      }
      const search = this.searchQuery.toUpperCase()
      if (search.length <= 30) {
        this.$api.getThorname(this.searchQuery).then((res) => {
          if (
            res.status / 200 === 1 &&
            (res.data?.aliases.length > 0 || res.data.owner)
          ) {
            let thorchainAddr = res.data?.aliases?.find(
              (el) => el.chain === 'THOR'
            )?.address
            if (!thorchainAddr) {
              thorchainAddr = res.data.owner
            }
            this.$router.push({ path: `/address/${thorchainAddr}` })
          }
        })
      } else if (
        // THORCHAIN
        search.startsWith('THOR') ||
        search.startsWith('TTHOR') ||
        search.startsWith('STHOR') ||
        // BNB
        search.startsWith('BNB') ||
        search.startsWith('TBNB') ||
        // BITCOIN
        search.startsWith('BC1') ||
        search.startsWith('TB1') ||
        // LTC
        search.startsWith('LTC') ||
        search.startsWith('TLTC') ||
        // COSMOS
        search.startsWith('COSMOS') ||
        (search.startsWith('0x') && search.length <= 43)
      ) {
        this.$router.push({ path: `/address/${this.searchQuery}` })
      } else {
        this.$router.push({ path: `/tx/${this.searchQuery}` })
      }
    },
    search() {
      this.isSearch = true
    },
    getChainsHeight() {
      this.$api
        .getChainsHeight()
        .then(async ({ data }) => {
          const chainsHeight = data
          const thorHeight = (await this.$api.getTHORLastBlock()).data
          this.$store.commit('setChainsHeight', {
            ...chainsHeight,
            THOR: thorHeight,
          })
        })
        .catch((e) => console.error(e))
    },
    getRunePrice() {
      this.$api
        .getStats()
        .then((res) => {
          this.$store.commit(
            'setRunePrice',
            Number.parseFloat(res.data.runePriceUSD)
          )
        })
        .catch((error) => {
          console.error(error)
        })
    },
  },
}

Vue.mixin(global)
</script>

<style lang="scss">
.background-container {
  justify-content: flex-start;
  align-items: center;
  padding: 1rem;
  width: 100%;
  height: 16rem;

  background: url('@/assets/images/background.svg');
  background-color: var(--background);
  background-size: cover;
  background-blend-mode: overlay;
  padding: 20px;
  margin-bottom: -4.5rem;

  .title-search {
    font-family: 'Exo 2';
    font-weight: bold;
    font-size: 16px;
    padding: 9px;
    color: white;
  }

  .search-container {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    max-width: 100%;

    #search-bar-container {
      display: flex;
      position: relative;
      width: 100%;
      max-width: 30rem;
      border: 2px solid var(--border-color);
      border-radius: 0.75rem;
      background-color: var(--card-bg-color);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      padding: 0.3rem;

      &:hover {
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
      }
      .search-input {
        font-size: 14px;
        padding-right: 2.5rem;
        padding-left: 0.75rem;
        flex: 1;
        border: none;
        height: 40px;
        border-radius: 0.75rem;
        color: var(--sec-font-color);
        background-color: var(--input-bg-color);
        border: 1px solid var(--border-color);
        transition: all 0.3s ease;

        &:focus {
          outline: none;
          border-color: var(--primary-color);
        }
      }

      .search-icon {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        width: 24px;
        height: 24px;
        fill: var(--font-color);
        cursor: pointer;
        transition: fill 0.3s ease;

        &:hover {
          fill: var(--primary-color);
        }
      }

      @include lg {
        width: 90%;

        .search-input {
          font-size: 1.1rem;
          padding-right: 3rem;
          padding-left: 1rem;
        }
      }
    }
  }
  .search-bar {
    padding-top: 2rem;
    margin: auto;
    max-width: 90rem;
  }
}

#dashboard-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  #header {
    top: 0;
    position: sticky;
    z-index: 1000;
    display: flex;
    align-items: center;
    background: var(--color-light);
    grid-area: header;
    border-bottom: 1px solid var(--border-color);
    padding: 0 1.5rem;

    @include lg {
      padding: 0.5rem 3rem;
    }
  }

  #navbar {
    background: var(--color-light);
    border-bottom: 1px solid var(--border-color);
    padding: 0 1.5rem;

    @include lg {
      padding: 0.5rem 3rem;
    }
  }

  #main-content {
    padding-bottom: 10rem;
    grid-area: main;

    @include lg {
      padding: 0 3rem;
      padding-bottom: 2rem;
    }
  }
}
</style>
