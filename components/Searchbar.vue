<template>
  <div
    class="search-bar-container"
    :class="{ expanded: innerWidth < 992 && isSearch }"
  >
    <div class="left-section">
      <div id="search-container" @click="search">
        <input
          ref="searchInput"
          v-model="searchQuery"
          :class="[
            'search-bar-input',
            { hidden: !(isSearch || innerWidth > 992) },
          ]"
          type="text"
          :placeholder="
            isSearch || innerWidth > 992
              ? 'Search by Address / Txn Hash / THORName'
              : false
          "
          @keyup.enter="find"
          @focus="isSearch = true"
          @blur="isSearch = false"
        />
        <SearchIcon class="search-icon" @click="find" />
      </div>
    </div>
    <div class="right-section">
      <div class="header-info">
        <div v-if="shouldShowChurnValues" ref="churn-info">
          <small style="color: var(--sec-font-color)">Churn:</small>
          <small
            v-for="value in churnValues"
            :key="value"
            style="color: var(--primary-color)"
            class="mono"
          >
            {{ value }}
          </small>
        </div>
        <div ref="header-info-1">
          <small style="color: var(--sec-font-color)">RUNE Price:</small>
          <small
            v-if="runePrice"
            :key="runePrice"
            style="color: var(--primary-color)"
            class="mono"
          >
            {{ runePrice | currency }}
          </small>
          <small v-else>-</small>
        </div>
        <div ref="header-info-2">
          <small style="color: var(--sec-font-color)">Block height:</small>
          <small
            v-if="chainsHeight && chainsHeight['THOR']"
            style="color: var(--primary-color)"
            class="mono"
          >
            {{ chainsHeight['THOR'] | number('0,0') }}
          </small>
          <small v-else>-</small>
        </div>
      </div>
      <div id="theme-wrapper">
        <div
          ref="themeContainer"
          class="theme-container"
          @click="toggleSettings"
        >
          <MoonIcon v-if="theme === 'dark'" class="menu-icon" />
          <SunIcon v-else class="menu-icon" />
        </div>
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
          <SettingsIcon class="menu-icon" />
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
      innerWidth: window.innerWidth,
    }
  },
  computed: {
    ...mapGetters({
      theme: 'getTheme',
      fullscreen: 'getFullScreen',
      sidebar: 'getSidebar',
      runePrice: 'getRunePrice',
      chainsHeight: 'getChainsHeight',
      churnValues: 'getChurnValues',
    }),
    networkEnv() {
      return process.env.NETWORK
    },
    shouldShowChurnValues() {
      return this.$route.path === '/nodes'
    },
  },
  watch: {
    $route(to, from) {
      this.searchQuery = ''
    },
    chainsHeight(n, o) {
      this.animate('header-info-1', 'animate')
      this.animate('header-info-2', 'animate')
    },
    churnValues(n, o) {
      this.animate('churn-info', 'animate')
    },
  },
  mounted() {
    window.addEventListener('click', this.handleClickOutside)
    window.addEventListener('touchstart', this.handleClickOutside)
    this.createListener('network', 'netDialog', { topM: 35 })
    this.createListener('themeContainer', 'themeDialog', {
      topM: 35,
    })
    this.$nextTick(() => {
      window.addEventListener('resize', this.onResize)
    })
  },
  beforeDestroy() {
    window.removeEventListener('click', this.handleClickOutside)
    window.removeEventListener('resize', this.onResize)
  },
  methods: {
    onResize() {
      this.innerWidth = window.innerWidth
    },
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
        this.$refs[childContainer].style.right = `0px`
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
      if (!this.$refs.network.contains(e.target)) {
        this.showDialog = false
      }
      if (!this.$refs.themeContainer.contains(e.target)) {
        this.showSettings = false
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
  margin: auto;
  gap: 15px;
  max-width: 90rem;
  padding: 0.25rem 0;

  &.expanded {
    gap: 0;
    .left-section {
      #search-container {
        flex: 1;
      }
    }

    .right-section {
      display: none;
      gap: 0;
    }
  }

  .header-info {
    display: flex;
    align-items: end;
    justify-content: center;
    flex-direction: column;
    font-size: 0.8rem;

    .break {
      flex-basis: 100%;
      width: 0;
    }

    > div {
      -webkit-transition: all ease 0.4;
      transition: all ease 0.4;

      .mono {
        -webkit-transition: all ease 0.4s;
        transition: all ease 0.4s;
        display: inline-block;
      }

      small {
        -webkit-transition: all ease 0.4s;
        transition: all ease 0.4s;
      }

      &.animate {
        .mono {
          -webkit-animation: jello-vertical 1s both;
          animation: jello-vertical 1s both;
        }
      }
    }
  }

  .left-section {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
  }

  .right-section {
    display: flex;
    align-items: center;
    gap: 10px;

    #network-wrapper,
    #theme-wrapper {
      position: relative;

      .network-container,
      .theme-container {
        height: 2.375rem;
        padding: 0.375rem 0.75rem;
        border-radius: 0.5rem;
        background-color: var(--card-bg-color);
        border: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background-color 0.3s ease;

        .menu-icon {
          width: 20px;
        }

        span {
          text-align: center;
          color: var(--primary-color);
        }

        &:hover {
          background-color: var(--darker-bg);
        }
      }
    }
  }
  #search-container {
    display: flex;
    position: relative;
    transition: all 0.5s ease;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    width: 46px;

    .search-bar-input {
      flex: 1;
      font-size: 1rem;
      border: none;
      height: 38px;
      color: var(--sec-font-color);
      background-color: var(--card-bg-color);
      padding: 0 1rem;
      border-radius: 0.5rem;
      transition: width 0.3s ease;
      padding-right: 2.5rem;
      padding-left: 1rem;

      &:focus {
        outline: none;
        background-color: var(--card-bg-color);
      }

      &.hidden {
        color: var(--card-bg-color);
      }
    }

    .search-icon {
      position: absolute;
      width: 20px;
      height: 24px;
      fill: var(--font-color);
      right: 0.8rem;
      top: calc(50% - 0.8rem);
      cursor: pointer;
      transition: fill 0.3s ease;
      box-sizing: content-box;
      background: var(--card-bg-color);
      padding-left: 0.3rem;

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
      width: 30rem;

      .search-bar-input {
        width: 100%;
      }

      span {
        display: block;
      }
    }
  }
}

.network-dialog,
.theme-dialog {
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
  }
}

@keyframes jello-vertical {
  0% {
    -webkit-transform: scale3d(1, 1, 1);
    transform: scale3d(1, 1, 1);
  }
  30% {
    -webkit-transform: scale3d(0.75, 1.25, 1);
    transform: scale3d(0.75, 1.25, 1);
  }
  40% {
    -webkit-transform: scale3d(1.25, 0.75, 1);
    transform: scale3d(1.25, 0.75, 1);
  }
  50% {
    -webkit-transform: scale3d(0.85, 1.15, 1);
    transform: scale3d(0.85, 1.15, 1);
  }
  65% {
    -webkit-transform: scale3d(1.05, 0.95, 1);
    transform: scale3d(1.05, 0.95, 1);
  }
  75% {
    -webkit-transform: scale3d(0.95, 1.05, 1);
    transform: scale3d(0.95, 1.05, 1);
  }
  100% {
    -webkit-transform: scale3d(1, 1, 1);
    transform: scale3d(1, 1, 1);
  }
}
</style>
