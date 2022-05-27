<template>
  <main id="default-layout" :class="{'mini': mini}">
    <!-- Sidebar -->
    <div id="side-bar">
      <sidebar :mini="mini" />
    </div>
    <div id="right-content">
      <!-- Searchbar -->
      <div id="search-bar">
        <searchbar />
      </div>
      <div class="vd-2"></div>
      <!-- Main content -->
      <div id="main-content">
        <Nuxt />
      </div>
    </div>
  </main>
</template>

<script>
import Vue from 'vue';
import global from "~/mixins.js/global";
import { mapGetters } from 'vuex';

export default {
  name: 'DefaultLayout',
  data() {
    return {
      mini: false,
      darkMode: false,
    }
  },
  computed: {
    ...mapGetters({
      theme: 'getTheme'
    })
  },
  methods: {
    resizedWindow() {
      // get smaller than lg
      if (document.body.offsetWidth < 992) {
        this.mini = true;
      }
      else {
        this.mini = false;
      }
    }
  },
  mounted() {
    this.resizedWindow();
    window.addEventListener('resize', () => {
      this.resizedWindow();
    });

    this.$api.getStats()
    .then(res => {
      this.$store.commit('setRunePrice', Number.parseFloat(res.data.runePriceUSD))
    })
    .catch(error => {
      console.error(error)
    })

    let htmlElement = document.documentElement;

    const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    if (darkThemeMq.matches) {
      htmlElement.setAttribute('theme', 'dark')
      this.darkMode = true
    } else {
      htmlElement.setAttribute('theme', 'light');
      this.darkMode = false
    }
  },
  watch: {
    darkMode: function () {
        if (this.darkMode) {
          this.$store.commit('setTheme', true)
        } else {
          this.$store.commit('setTheme', false)
        }
    }
  }
}

Vue.mixin(global)
</script>

<style lang="scss">
#default-layout {
  display: flex;

  #side-bar {
    background-color: var(--sidebar);
    padding: 1rem;
    opacity: .95; /* Black w/opacity/see-through */
    min-height: 800px;

    @include lg {
      display: block;
      flex: 0 0 13.75rem;
    }
  }

  #main-content {
    flex: 1 1;
  }

  &.mini {
    display: flex;
    flex-direction: column-reverse;
    margin-bottom: 4rem;

    #right-content {
      padding: .7rem;
    }

    #side-bar {
      z-index: 1000;
      position: fixed;
      bottom: 0;
      width: 100%;
      background-color: var(--sidebar);
      padding: .5rem;
      opacity: .95; /* Black w/opacity/see-through */
      backdrop-filter: blur(10px);
      border-top: 1.5px solid var(--border-color);
      min-height: initial;

      @include lg {
        display: block;
        flex: 0 0 13.75rem;
      }
    }
  }
}
</style>
