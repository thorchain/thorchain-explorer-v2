<template>
  <main
    id="default-layout"
    :class="{
      'long-sidebar': menu,
      fullscreen: fullscreen,
      'show-sidebar': sidebar,
    }"
  >
    <!-- Sidebar -->
    <div id="side-bar">
      <sidebar />
    </div>
    <!-- Searchbar -->
    <header id="header">
      <searchbar />
    </header>
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
  data () {
    return {
      darkMode: false
    }
  },
  computed: {
    ...mapGetters({
      theme: 'getTheme',
      menu: 'getIsMenuOn',
      fullscreen: 'getFullScreen',
      sidebar: 'getSidebar'
    })
  },
  watch: {
    darkMode () {
      if (this.darkMode) {
        this.$store.commit('setTheme', true)
      } else {
        this.$store.commit('setTheme', false)
      }
    }
  },
  mounted () {
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
      .catch(e => console.error(e))

    this.$api
      .getNetwork()
      .then(({ data }) => {
        this.$store.commit('setNetworkData', data)
      })
      .catch(e => console.error(e))

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
    getChainsHeight () {
      this.$api
        .getChainsHeight()
        .then(({ data }) => {
          this.$store.commit('setChainsHeight', data)
        })
        .catch(e => console.error(e))
    }
  }
}

Vue.mixin(global)
</script>

<style lang="scss">
#default-layout {
  display: grid;
  height: 100vh;
  height: calc(var(--vh, 1vh) * 100);
  overflow: hidden;

  grid-template-columns: 1fr;
  grid-template-rows: 64px 64px 1fr;
  grid-template-areas: "sidebar" "header" "main";

  &.long-sidebar {
    grid-template-rows: 1fr;
    grid-template-areas: "sidebar";

    #header,
    #main-content {
      display: none;
    }
  }

  // Only on medium screens
  @include olg {
    grid-template-columns: 4rem 1fr;
    grid-template-rows: 65px 1fr;
    grid-template-areas:
      "sidebar header"
      "sidebar main";

    .page-container, .search-bar-container {
      min-width: 100%;
    }
  }

  @include xl {
    grid-template-columns: 220px 1fr;
    grid-template-rows: 64px 1fr;
    grid-template-areas: "sidebar header" "sidebar main";
  }

  #side-bar {
    display: grid;
    grid-area: sidebar;
    background-color: var(--sidebar);
    opacity: 0.95; /* Black w/opacity/see-through */
    overflow: hidden;
    border-top: 1px solid var(--border-color);

    @include xl {
      border: none;
      border-right: 1px solid var(--border-color);
      display: grid;
      flex: 0 0 13.75rem;
      height: 100%;
    }
  }

  #header {
    display: flex;
    align-items: center;
    background: var(--sidebar);
    grid-area: header;
    border-bottom: 1px solid var(--border-color);
    overflow: hidden;
    padding: 0 20px;

    @include lg {
      padding: 0 64px;
    }
  }

  #main-content {
    overflow: auto;
    grid-area: main;
    padding: 32px 0;

    @include lg {
      padding: 32px 64px;
    }
  }
}
</style>
