<template>
  <div class="search-bar-container">
    <div class="left-section">
      <div
        id="search-container"
        :class="[{ expanded: isSearch }]"
        @click="search()"
      >
        <input
          v-model="searchQuery"
          class="search-bar-input"
          type="text"
          placeholder="Search"
          @keyup.enter="find()"
          @blur="isSearch = false"
        />
        <SearchIcon class="search-icon" @click="find()" />
      </div>
    </div>
    <div class="right-section">
      <div id="network-wrapper">
        <div ref="network" class="network-container" @click="toggleDialog">
          <span>{{ networkEnv | capitalize }}</span>
        </div>
        <transition name="fade">
          <div v-show="showDialog" ref="netDialog" class="network-dialog">
            <a
              :class="{ active: networkEnv == 'mainnet' }"
              :disabled="networkEnv == 'mainnet'"
              :href="gotoInstance('mainnet', networkEnv == 'mainnet')"
            >
              Mainnet
            </a>
            <a
              :class="{ active: networkEnv == 'stagenet' }"
              :disabled="networkEnv == 'stagenet'"
              :href="gotoInstance('stagenet', networkEnv == 'stagenet')"
            >
              Stagenet
            </a>
          </div>
        </transition>
      </div>
      <div
        id="settings-container"
        ref="settingsContainer"
        class="settings-container"
      >
        <div class="settings-icon-container" @click="toggleSettings">
          <SettingsIcon />
        </div>
        <transition name="fade">
          <div v-show="showSettings" id="settingsMenu" ref="settingsMenu">
            <div class="settings-card simple-card normal">
              <div class="settings-item" @click="changeTheme">
                <span>{{
                  theme === 'light' ? 'Light Theme' : 'Dark Theme'
                }}</span>
                <SunIcon
                  v-if="theme === 'light'"
                  class="social-icon"
                  @click="changeTheme"
                />
                <MoonIcon
                  v-if="theme === 'dark'"
                  class="social-icon"
                  @click="changeTheme"
                />
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import SearchIcon from '~/assets/images/search.svg?inline'
import MoonIcon from '~/assets/images/moon-icon.svg?inline'
import SunIcon from '~/assets/images/sun-icon.svg?inline'
import SettingsIcon from '~/assets/images/settings.svg?inline'
import links from '~/const/links'

export default {
  name: 'SearchBar',
  components: {
    SunIcon,
    MoonIcon,
    SearchIcon,
    SettingsIcon,
  },
  data() {
    return {
      searchQuery: '',
      isSearch: false,
      showDialog: false,
      showSettings: false,
    }
  },
  computed: {
    ...mapGetters({
      theme: 'getTheme',
      fullscreen: 'getFullScreen',
      sidebar: 'getSidebar',
    }),
    networkEnv() {
      return process.env.NETWORK
    },
  },
  watch: {
    $route(to, from) {
      this.searchQuery = ''
    },
  },
  mounted() {
    window.addEventListener('click', (e) => {
      if (!document.getElementById('search-container')?.contains(e.target)) {
        this.isSearch = false
      }

      if (!document.getElementById('network-wrapper')?.contains(e.target)) {
        this.showDialog = false
      }

      if (
        !document.querySelector('.collapse-icon')?.contains(e.target) &&
        !document.querySelector('.side-bar-container')?.contains(e.target)
      ) {
        this.$store.commit('setSidebar', false)
      }

      if (
        !document.getElementById('settings-container')?.contains(e.target) &&
        !document.getElementById('settingsMenu')?.contains(e.target)
      ) {
        this.showSettings = false
      }
    })

    this.createListener('network', 'netDialog', { topM: 45, leftM: 0 })
    this.createListener('settingsContainer', 'settingsMenu', {
      topM: 45,
      leftM: -280,
    })
  },
  methods: {
    find() {
      if (!this.isSearch) {
        document.getElementsByClassName('search-bar-input')[0].focus()
        return
      }
      const search = this.searchQuery.toUpperCase()
      if (search.length <= 30) {
        this.$api.getThorname(this.searchQuery).then((res) => {
          if (res.status / 200 === 1 && res.data?.aliases.length > 0) {
            const thorchainAddr = res.data?.aliases?.find(
              (el) => el.chain === 'THOR'
            ).address
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
    changeTheme() {
      if (this.theme === 'dark') {
        this.$store.commit('setTheme', false)
      } else {
        this.$store.commit('setTheme', true)
      }
    },
    search() {
      this.isSearch = true
    },
    toggleDialog() {
      this.showDialog = !this.showDialog
    },
    toggleSettings() {
      this.showSettings = !this.showSettings
    },
    gotoInstance(instance, disabled) {
      if (disabled) {
        return
      }
      return links[instance]
    },
    followContainer(parentContainer, childContainer, { leftM, topM }) {
      if (this.$refs[parentContainer]) {
        const left = this.$refs[parentContainer].getBoundingClientRect().left
        const top = this.$refs[parentContainer].getBoundingClientRect().top
        this.$refs[childContainer].style.left = `${left + leftM}px`
        this.$refs[childContainer].style.top = `${top + topM}px`
      }
    },
    createListener(parentContainer, childContainer, styles) {
      window.addEventListener('resize', () => {
        this.followContainer(parentContainer, childContainer, styles)
      })

      this.followContainer(parentContainer, childContainer, styles)
    },
    toggleSidebar() {
      this.$store.commit('setSidebar', true)
    },
    toggleFullscreen() {
      this.$store.commit('toggleFullscreen')
    },
  },
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

  .settings-icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border-radius: 50%;
    cursor: pointer;

    &:hover {
      background-color: var(--darker-bg);
    }
  }

  .social-icon {
    fill: var(--font-color);
    width: 1rem;
    height: 1rem;
    cursor: pointer;

    &:hover {
      fill: var(--active-bg-color);
    }

    &.expand-icon,
    &.collapse-icon {
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
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
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
        border-radius: 0.5rem;
        width: 100px;

        a {
          cursor: pointer;
          background: var(--card-bg-color);
          color: var(--font-color);
          border: none;
          padding: 0.5rem 1rem;
          text-decoration: none;
          text-align: center;

          &:first-of-type {
            border-radius: 0.5rem 0.5rem 0 0;
          }

          &:last-of-type {
            border-radius: 0 0 0.5rem 0.5rem;
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
    transition: all 0.5s ease;

    &.expanded {
      flex: 1;

      .search-icon {
        right: 0.5rem;
      }
    }

    .search-bar-input {
      flex: 1;
      font-size: 0.875rem;
      border-radius: 5px;
      height: 40px;
      color: var(--font-color);
      background-color: var(--darker-bg);
      width: 2.5rem;

      &:focus,
      &:active {
        outline: none;
      }
    }

    .search-icon {
      position: absolute;
      padding: 0.2rem;
      width: 1.4rem;
      height: 1.4rem;
      fill: var(--font-color);
      right: calc(1rem - 0.4rem);
      top: calc(50% - 0.8rem);
      cursor: pointer;
      background-color: var(--darker-bg);
    }

    span {
      display: none;
      pointer-events: none;
      font-size: 0.875rem;
      position: absolute;
      left: 0.7rem;
      top: 0.8rem;
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

#settingsMenu {
  display: flex;
  position: absolute;
  z-index: 1000;

  .settings-card {
    min-width: 320px;
    padding: 0.5rem 0;

    .settings-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 1rem;
      margin: 0 0.5rem;
      border-radius: 4px;
      cursor: pointer;

      span {
        line-height: 24px;
      }

      &:hover {
        background-color: var(--darker-bg);
      }
    }

    .full-screen {
      display: none;

      @include lg {
        display: flex;
      }
    }
  }
}
</style>
