<template>
  <div class="search-bar-container">
    <div class="left-section">
      <div
        id="search-container"
        :class="{ expanded: isSearch }"
        @click="search"
      >
        <input
          v-model="searchQuery"
          class="search-bar-input"
          type="text"
          placeholder="Search"
          @keyup.enter="find"
          @focus="isSearch = true"
          @blur="isSearch = false"
        />
        <SearchIcon class="search-icon" @click="find" />
      </div>
    </div>
    <div class="right-section">
      <div
        id="theme-container"
        ref="themeContainer"
        class="theme-container"
        @click="toggleSettings"
      >
        <span v-if="theme === 'dark'">
          <MoonIcon />
        </span>
        <span v-else>
          <SunIcon />
        </span>

        <transition name="fade">
          <div v-show="showSettings" ref="themeDialog" class="theme-dialog">
            <a :class="{ active: theme === 'dark' }" @click="setTheme('dark')">
              <MoonIcon class="theme-icon" /> Dark
            </a>
            <a
              :class="{ active: theme === 'light' }"
              @click="setTheme('light')"
            >
              <SunIcon class="theme-icon" /> Light
            </a>
          </div>
        </transition>
      </div>
      <div id="network-wrapper">
        <div ref="network" class="network-container" @click="toggleDialog">
          <SettingsIcon />
        </div>
        <transition name="fade">
          <div v-show="showDialog" ref="netDialog" class="network-dialog">
            <a
              :class="{ active: networkEnv === 'mainnet' }"
              :disabled="networkEnv === 'mainnet'"
              :href="gotoInstance('mainnet', networkEnv === 'mainnet')"
            >
              Mainnet
            </a>
            <a
              :class="{ active: networkEnv === 'stagenet' }"
              :disabled="networkEnv === 'stagenet'"
              :href="gotoInstance('stagenet', networkEnv === 'stagenet')"
            >
              Stagenet
            </a>
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
    window.addEventListener('click', this.handleClickOutside)
    this.createListener('network', 'netDialog', { topM: 45, leftM: -20 })
    this.createListener('themeContainer', 'themeDialog', { topM: 45, leftM: -15 })
  },
  beforeDestroy() {
    window.removeEventListener('click', this.handleClickOutside)
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
          if (res.status / 200 === 1 && res.data?.aliases.length > 0) {
            const thorchainAddr = res.data?.aliases?.find(
              (el) => el.chain === 'THOR'
            ).address
            this.$router.push({ path: `/address/${thorchainAddr}` })
          }
        })
      } else {
        this.$router.push({ path: `/address/${this.searchQuery}` })
      }
    },
    setTheme(theme) {
      this.$store.commit('setTheme', theme === 'dark')
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
      if (disabled) return
      return links[instance]
    },
    followContainer(parentContainer, childContainer, { leftM, topM }) {
      if (this.$refs[parentContainer]) {
        const rect = this.$refs[parentContainer].getBoundingClientRect()
        this.$refs[childContainer].style.left = `${rect.left + leftM}px`
        this.$refs[childContainer].style.top = `${rect.top + topM}px`
      }
    },
    createListener(parentContainer, childContainer, styles) {
      window.addEventListener('resize', () => {
        this.followContainer(parentContainer, childContainer, styles)
      })
      this.followContainer(parentContainer, childContainer, styles)
    },
    handleClickOutside(e) {
      if (!this.$refs.searchContainer.contains(e.target)) {
        this.isSearch = false
      }
      if (!this.$refs.networkWrapper.contains(e.target)) {
        this.showDialog = false
      }
      if (!this.$refs.themeContainer.contains(e.target) && !this.$refs.themeDialog.contains(e.target)) {
        this.showSettings = false
      }
      if (!document.querySelector('.collapse-icon')?.contains(e.target) &&
        !document.querySelector('.side-bar-container')?.contains(e.target)) {
        this.$store.commit('setSidebar', false)
      }
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
  margin: auto;
  gap: 15px;
  max-width: 90rem;
  padding: 0.5rem 0;

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
        padding: 0.75rem 1.3125rem;
        border-radius: 0.5rem;
        background-color: var(--card-bg-color);
        border: 1px solid var(--border-color);
        display: flex;
        justify-content: center;
        cursor: pointer;
        transition: background-color 0.3s ease;

        span {
          text-align: center;
          color: var(--primary-color);
        }

        &:hover {
          background-color: var(--darker-bg);
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
        background: var(--card-bg-color);

        a {
          cursor: pointer;
          background: var(--card-bg-color);
          color: var(--font-color);
          border: none;
          padding: 0.5rem 1rem;
          text-decoration: none;
          text-align: center;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: background-color 0.3s ease;

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

          .theme-icon {
            width: 1.3rem;
            height: 1.3rem;
          }
        }
      }
    }

    #theme-container {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.5rem;
      cursor: pointer;
      fill: var(--font-color);
      border: 1px solid var(--border-color);
      padding: 5px 18px;
      background-color: var(--card-bg-color);
      transition: background-color 0.3s ease;

      &:hover {
        background-color: var(--darker-bg);
      }
    }
  }

  #search-container {
    display: flex;
    position: relative;
    max-width: 600px;
    transition: all 0.5s ease;
    border: 1px solid var(--line);
    border-radius: 25px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;

    &.expanded {
      flex: 1;
    }

    .search-bar-input {
      flex: 1;
      font-size: 1rem;
      border: none;
      height: 40px;
      color: var(--font-color);
      background-color: var(--card-bg-color);
      padding: 0 1rem;
      border-radius: 25px;
      transition: width 0.3s ease;

      &:focus {
        outline: none;
        background-color: var(--darker-bg);
      }
    }

    .search-icon {
      position: absolute;
      padding: 0.2rem;
      width: 1.4rem;
      height: 1.4rem;
      fill: var(--font-color);
      right: 0.5rem;
      top: calc(50% - 0.7rem);
      cursor: pointer;
      transition: fill 0.3s ease;

      &:hover {
        fill: var(--primary-color);
      }
    }

    span {
      display: none;
      pointer-events: none;
      font-size: 0.875rem;
      position: absolute;
      left: 0.7rem;
      top: calc(50% - 0.4rem);
    }

    @include lg {
      .search-bar-input {
        width: 100%;
      }

      span {
        display: block;
      }
    }
  }

  .theme-dialog {
    position: absolute;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    width: 100px;
    background: var(--card-bg-color);
    transition: opacity 0.3s ease;

    a {
      cursor: pointer;
      background: var(--card-bg-color);
      color: var(--font-color);
      border: none;
      padding: 0.5rem 1rem;
      text-decoration: none;
      text-align: center;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: background-color 0.3s ease;

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

      .theme-icon {
        width: 1.3rem;
        height: 1.3rem;
      }
    }
  }
}
</style>
