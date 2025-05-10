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
    <footer id="footer">
      <Footer />
    </footer>
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
    const savedTheme = localStorage.getItem('theme')

    if (savedTheme === 'BlueElectra') {
      this.blueElectraMode = true
      htmlElement.setAttribute('theme', 'BlueElectra')
      this.$store.commit('setTheme', 'BlueElectra')
    } else if (savedTheme === 'light') {
      this.darkMode = false
      htmlElement.setAttribute('theme', 'light')
      this.$store.commit('setTheme', false)
    } else {
      this.darkMode = true
      htmlElement.setAttribute('theme', 'dark')
      this.$store.commit('setTheme', true)
    }

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

    this.getChainsHeight()

    this.getPools()

    this.updateInterval = setInterval(() => {
      this.getChainsHeight()
      this.getRunePrice()
      this.getPools()
    }, 20000)

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
      const search = this.searchQuery.toUpperCase()
      if (search.length <= 30) {
        this.$api.getThorname(this.searchQuery).then((res) => {
          if (
            res.status / 200 === 1 &&
            (res.data?.aliases?.length > 0 || res.data?.owner)
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
        search.length <= 43
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
    getPools() {
      this.$api
        .getPools()
        .then(({ data }) => {
          this.$store.commit('setPools', data)
        })
        .catch((e) => console.error(e))
    },
  },
}

Vue.mixin(global)
</script>

<style lang="scss">
.background-container {
  justify-content: flex-start;
  align-items: center;
  padding: $space-16;
  width: 100%;
  height: 16rem;

  background: url('@/assets/images/background.svg');
  background-color: var(--overview-bg);
  background-size: cover;
  background-blend-mode: overlay;
  padding: $space-10;
  margin-bottom: -4.5rem;

  @include md {
    padding: $space-0 3rem;
  }

  .title-search {
    font-family: 'Exo 2';
    font-weight: bold;
    font-size: $font-size-desktop;
    padding: $space-10;
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
      border-radius: $radius-xl;
      background-color: var(--card-bg-color);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      padding: $space-5;

      &:hover {
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
      }
      .search-input {
        font-size: $font-size-s;
        padding-right: 2.5rem;
        padding-left: $space-12;
        flex: 1;
        border: none;
        height: 40px;
        border-radius: $radius-xl;
        color: var(--sec-font-color);
        background-color: var(--input-bg-color);
        border: 1px solid var(--border-color);
        transition: all 0.3s ease;

        &:focus {
          outline: none;
          border-color: var(--primary-color);
        }
        @include lg {
          font-size: $font-size-sm;
        }
      }

      .search-icon {
        position: absolute;
        right: 0.6rem;
        top: 50%;
        transform: translateY(-50%);
        width: 35px;
        height: 35px;
        fill: #fff;
        cursor: pointer;
        transition: background-color 0.3s ease;
        background-color: var(--search-color);
        padding: $space-5;
        border-radius: $radius-sm;

        &:hover {
          background-color: var(--active-primary-color);
        }
      }

      @include lg {
        width: 90%;

        .search-input {
          font-size: $font-size-desktop;
          padding-right: 3rem;
          padding-left: $space-16;
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
    padding: $space-0 $space-10;

    @include lg {
      padding: $space-8 3rem;
    }
  }

  #navbar {
    background: var(--color-light);
    border-bottom: 1px solid var(--border-color);
    padding: $space-0 $space-10;

    @include lg {
      padding: $space-8 3rem;
    }
  }

  #main-content {
    padding-bottom: 10rem;
    grid-area: main;

    @include lg {
      padding: $space-0 3rem;
      padding-bottom: $space-32;
    }
  }
}
</style>
