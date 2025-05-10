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
    <!-- Footer -->
    <footer id="footer">
      <Footer />
    </footer>
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
      blueElectraMode: false,
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
    blueElectraMode() {
      if (this.blueElectraMode) {
        this.$store.commit('setTheme', 'BlueElectra')
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
#default-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  #footer {
    position: relative;
    margin-top: auto;
  }

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
    padding-top: $space-32;
    grid-area: main;

    @include lg {
      padding: 2rem 3rem;
    }
  }
}
</style>
