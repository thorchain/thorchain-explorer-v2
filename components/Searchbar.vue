<template>
  <div class="search-bar-container">
    <div class="left-section">
      <MenuIcon v-if="fullscreen" class="social-icon collapse-icon" @click="toggleSidebar" />
      <div id="search-container" :class="[{'expanded': isSearch}]" @click="search()">
        <input
          v-model="searchQuery"
          class="search-bar-input"
          type="text"
          placeholder="Search"
          @keyup.enter="find()"
          @blur="isSearch = false"
        >
        <SearchIcon class="search-icon" @click="find()" />
      </div>
    </div>
    <div class="right-section">
      <div id="network-wrapper">
        <div ref="network" class="network-container" @click="toggleDialog">
          <span>{{ networkEnv | capitalize }}</span>
        </div>
        <div
          v-show="showDialog"
          ref="netDialog"
          class="network-dialog"
        >
          <a :class="{'active': networkEnv == 'mainnet'}" :disabled="networkEnv == 'mainnet'" :href="gotoInstance('mainnet', networkEnv == 'mainnet')">
            Mainnet
          </a>
          <a :class="{'active': networkEnv == 'stagenet'}" :disabled="networkEnv == 'stagenet'" :href="gotoInstance('stagenet', networkEnv == 'stagenet')">
            Stagenet
          </a>
          <a :class="{'active': networkEnv == 'testnet'}" :disabled="networkEnv == 'testnet'" :href="gotoInstance('testnet', networkEnv == 'testnet')">
            Testnet
          </a>
        </div>
      </div>
      <SunIcon v-if="theme === 'light'" class="social-icon" @click="changeTheme" />
      <MoonIcon v-if="theme === 'dark'" class="social-icon" @click="changeTheme" />
      <div @click="toggleFullscreen">
        <ExpandIcon v-if="!fullscreen" class="social-icon expand-icon" />
        <ExpandBoldIcon v-else class="social-icon expand-icon" />
      </div>
    </div>
  </div>
</template>

<script>
import ExpandIcon from 'assets/images/expand.svg?inline'
import ExpandBoldIcon from 'assets/images/expand_bold.svg?inline'
import MenuIcon from 'assets/images/menu-burger.svg?inline'
import { mapGetters } from 'vuex'
import SearchIcon from '~/assets/images/search.svg?inline'
import MoonIcon from '~/assets/images/eclipse-moon.svg?inline'
import SunIcon from '~/assets/images/eclipse-sun.svg?inline'
import links from '~/const/links'

export default {
  name: 'SearchBar',
  components: {
    SunIcon,
    MoonIcon,
    SearchIcon,
    ExpandIcon,
    ExpandBoldIcon,
    MenuIcon
  },
  data () {
    return {
      searchQuery: '',
      isSearch: false,
      showDialog: false
    }
  },
  watch: {
    $route (to, from) {
      this.searchQuery = ''
    }
  },
  methods: {
    find () {
      if (!this.isSearch) {
        document.getElementsByClassName('search-bar-input')[0].focus()
        return
      }
      const search = this.searchQuery.toUpperCase()
      if (search.length <= 30) {
        this.$api.getThorname(this.searchQuery).then((res) => {
          if (res.status / 200 === 1) {
            const thorchainAddr = res.data?.entries?.find(el => el.chain === 'THOR').address
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
        // ETH & AVAX
        search.startsWith('0X')
      ) {
        this.$router.push({ path: `/address/${this.searchQuery}` })
      } else {
        this.$router.push({ path: `/tx/${this.searchQuery}` })
      }
    },
    changeTheme () {
      if (this.theme === 'dark') {
        this.$store.commit('setTheme', false)
      } else {
        this.$store.commit('setTheme', true)
      }
    },
    search () {
      this.isSearch = true
    },
    toggleDialog () {
      this.showDialog = !this.showDialog
    },
    gotoInstance (instance, disabled) {
      if (disabled) { return }
      return links[instance]
    },
    dialogPos () {
      if (this.$refs.network) {
        const left = this.$refs.network.getBoundingClientRect().left
        const top = this.$refs.network.getBoundingClientRect().top
        this.$refs.netDialog.style.left = `${left}px`
        this.$refs.netDialog.style.top = `${top + 45}px`
      }
    },
    toggleSidebar () {
      this.$store.commit('setSidebar', true)
    },
    toggleFullscreen () {
      this.$store.commit('toggleFullscreen')
    }
  },
  computed: {
    ...mapGetters({
      theme: 'getTheme',
      fullscreen: 'getFullScreen',
      sidebar: 'getSidebar'
    }),
    networkEnv () {
      return process.env.NETWORK
    }
  },
  mounted () {
    window.addEventListener('click', (e) => {
      if (!document.getElementById('search-container')?.contains(e.target)) {
        this.isSearch = false
      }
    })

    window.addEventListener('click', (e) => {
      if (!document.getElementById('network-wrapper')?.contains(e.target)) {
        this.showDialog = false
      }
    })

    window.addEventListener('click', (e) => {
      if (!document.querySelector('.collapse-icon')?.contains(e.target) && !document.querySelector('.side-bar-container')?.contains(e.target)) {
        this.$store.commit('setSidebar', false)
      }
    })

    window.addEventListener('resize', this.dialogPos)

    this.dialogPos()
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
  gap: 15px;

  .social-icon {
    fill: var(--font-color);
    width: 1rem;
    height: 1rem;
    cursor: pointer;

    &:hover {
      fill: var(--active-bg-color);
    }

    &.expand-icon, &.collapse-icon {
      display: none;

      @include lg {
        display: block;
      }
    }
  }

  .left-section {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .right-section {
    display: flex;
    align-items: center;
    gap: 10px;

    #network-wrapper {
      .network-container {
        padding: .5rem 1rem;
        border-radius: .5rem;
        background-color: var(--card-bg-color);
        border: 1px solid var(--border-color);
        width: 100px;
        display: flex;
        justify-content: center;
        cursor: pointer;

        span {
          text-align: center;
          color: var(--primary-color);
        }

      }

      .network-dialog {
        position: absolute;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        border: 1px solid var(--border-color);
        border-radius: .5rem;
        width: 100px;

        a {
          cursor: pointer;
          background: var(--card-bg-color);
          color: var(--font-color);
          border: none;
          padding: .5rem 1rem;
          text-decoration: none;
          text-align: center;

          &:first-of-type {
            border-radius: .5rem .5rem 0 0;
          }

          &:last-of-type {
            border-radius: 0 0 .5rem .5rem;
          }

          &:hover {
            background: var(--darker-bg);
            color: var(--primary-color);
          }

          &.active {
            color: var(--primary-color);

            &:hover {
              background-color: var(--card-bg-color);
            }
          }
        }
      }
    }
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
      padding: .2rem;
      width: 1.4rem;
      height: 1.4rem;
      fill: var(--font-color);
      right: calc(1rem - .4rem);
      top: calc( 50% - .8rem );
      cursor: pointer;
      background-color: var(--darker-bg);
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
