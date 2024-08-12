<template>
  <main
    id="default-layout"
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

export default {
  name: 'DefaultLayout',
  data() {
    return {
      darkMode: false,
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

    const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)')
    if (darkThemeMq.matches) {
      htmlElement.setAttribute('theme', 'dark')
      this.darkMode = true
    } else {
      htmlElement.setAttribute('theme', 'light')
      this.darkMode = false
    }

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

    setInterval(() => {
      this.getChainsHeight()
    }, 60000)

    const changeHeight = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    changeHeight()

    window.addEventListener('resize', changeHeight)
  },
  methods: {
    getChainsHeight() {
      this.$api
        .getChainsHeight()
        .then(({ data }) => {
          this.$store.commit('setChainsHeight', data)
        })
        .catch((e) => console.error(e))
    },
  },
}

Vue.mixin(global)
</script>

<style lang="scss">
#default-layout {
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
      padding: 0.5rem 4rem;
    }
  }

  #navbar {
    background: var(--color-light);
    border-bottom: 1px solid var(--border-color);
    padding: 0 1.5rem;

    @include lg {
      padding: 0.5rem 4rem;
    }
  }

  #main-content {
    padding-bottom: 10rem;
    padding-top: 32px;
    grid-area: main;

    @include lg {
      padding: 2rem 4rem;
    }
  }
}
</style>
