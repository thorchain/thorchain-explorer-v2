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
export default {
  name: 'DefaultLayout',
  data() {
    return {
      mini: false
    }
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
  },
}
</script>

<style lang="scss">
#default-layout {
  display: flex;

  #side-bar {
    background-color: $bgSidebar;
    padding: 1rem;
    background-color: rgba(0,0,0, 0.2); /* Black w/opacity/see-through */

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
      background-color: $bgSidebar;
      padding: .5rem;
      background-color: rgba(17,19,20, 0.85); /* Black w/opacity/see-through */
      backdrop-filter: blur(10px);
      border-top: 1.5px solid #263238;

      @include lg {
        display: block;
        flex: 0 0 13.75rem;
      }
    }
  }
}
</style>
