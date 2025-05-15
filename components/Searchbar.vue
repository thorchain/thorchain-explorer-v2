<template>
  <div
    class="search-bar-container"
    :class="{ expanded: innerWidth < 992 && isSearch }"
  >
    <div class="left-section">
      <div class="header-info">
        <div class="price-container">
          <div ref="header-info-1">
            <small style="color: var(--sec-font-color)">RUNE Price:</small>
            <small
              v-if="runePrice"
              :key="runePrice"
              style="color: var(--primary-color)"
              class="mono value"
            >
              {{ runePrice | currency }}
            </small>
            <small v-else>-</small>
          </div>
          <nuxt-link ref="header-info-3" :to="'/thorfi/tcy'">
            <small style="color: var(--sec-font-color)">TCY Price:</small>
            <small
              v-if="tcyPrice"
              :key="tcyPrice"
              style="color: var(--primary-color)"
              class="mono value"
            >
              {{ tcyPrice | currency }}
            </small>
            <small v-else>-</small>
          </nuxt-link>
        </div>
        <nuxt-link ref="header-info-2" :to="'/nodes'">
          <small style="color: var(--sec-font-color)">Node Count:</small>
          <small
            v-if="network && network.activeNodeCount"
            style="color: var(--primary-color)"
            class="mono value"
          >
            {{ network.activeNodeCount | number('0,0') }}
          </small>
          <small v-else>-</small>
        </nuxt-link>
      </div>
    </div>
    <div class="right-section">
      <div
        v-show="isOverviewPage ? isScrolled : true"
        id="search-container"
        @click="search"
      >
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
      <div v-show="innerWidth >= 990" id="theme-wrapper">
        <div
          ref="themeContainer"
          class="theme-container"
          @click="toggleSettings"
        >
          <MoonIcon v-if="theme === 'dark'" class="menu-icon" />
          <SunIcon v-else-if="theme === 'light'" class="menu-icon" />
          <BlueElectra v-else-if="theme === 'BlueElectra'" class="menu-icon" />
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
            <a
              :class="{ active: theme === 'BlueElectra' }"
              @click="setTheme('BlueElectra')"
            >
              <BlueElectra class="theme-icon" /> BlueElectra
            </a>
          </div>
        </transition>
      </div>
      <div v-show="innerWidth >= 990" id="network-wrapper">
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
            <a
              :class="{ active: networkEnv === 'devnet' }"
              :disabled="networkEnv === 'devnet'"
              :href="gotoInstance('devnet', networkEnv === 'devnet')"
            >
              Devnet
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
import BlueElectra from '~/assets/images/blueelectra.svg?inline'

export default {
  name: 'SearchBar',
  components: {
    SunIcon,
    MoonIcon,
    SearchIcon,
    SettingsIcon,
    BlueElectra,
  },
  data() {
    return {
      searchQuery: '',
      isSearch: false,
      showDialog: false,
      showSettings: false,
      innerWidth: window.innerWidth,
      isScrolled: false,
    }
  },
  computed: {
    ...mapGetters({
      theme: 'getTheme',
      fullscreen: 'getFullScreen',
      sidebar: 'getSidebar',
      runePrice: 'getRunePrice',
      extraHeaderInfo: 'getExtraHeaderInfo',
      network: 'getNetworkData',
      pools: 'getPools',
    }),
    isOverviewPage() {
      return this.$route.path === '/dashboard'
    },
    networkEnv() {
      return process.env.NETWORK
    },
    tcyPrice() {
      if (this.pools && this.pools.length > 0) {
        const tcyPool = this.pools.find((pool) => pool.asset === 'THOR.TCY')
        return tcyPool ? tcyPool.assetPriceUSD : null
      }
      return null
    },
  },
  watch: {
    $route(to, from) {
      this.searchQuery = ''
    },
    runePrice(n, o) {
      this.animate('header-info-1', 'animate')
    },
    network(n, o) {
      this.animate('header-info-2', 'animate')
    },
    pools(n, o) {
      this.animate('header-info-3', 'animate')
    },
    innerWidth(newWidth) {
      if (newWidth < 900) {
        this.showDialog = false
        this.showSettings = false
      }
    },
  },
  mounted() {
    if (this.isOverviewPage) {
      window.addEventListener('scroll', this.handleScroll)
    }
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
    if (this.isOverviewPage) {
      window.removeEventListener('scroll', this.handleScroll)
    }
  },
  methods: {
    onResize() {
      this.innerWidth = window.innerWidth
    },
    handleScroll() {
      const scrollPosition = window.scrollY || window.pageYOffset

      if (this.isOverviewPage) {
        this.isScrolled = scrollPosition > 100
      }
    },
    find() {
      if (!this.isSearch) {
        this.$refs.searchInput.focus()
        return
      }
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
    setTheme(theme) {
      if (theme === 'BlueElectra') {
        this.$store.commit('setTheme', 'BlueElectra')
      } else {
        this.$store.commit('setTheme', theme === 'dark')
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
  padding: $space-4 $space-0;

  &.expanded {
    gap: 0;
    .left-section {
      display: none;
      gap: 0;
    }

    .right-section {
      #search-container {
        flex: 1;
        display: flex;
      }
    }
  }

  .header-info {
    display: flex;
    align-items: baseline;
    justify-content: center;
    flex-direction: row;
    font-size: 0.8rem;
    gap: 0.3rem;

    @include md {
      font-size: $font-size-sm;
      flex-direction: row;
    }

    .price-container {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.3rem;
    }

    .price-item {
      display: flex;
      gap: 0.2rem;
    }

    @include md {
      font-size: $font-size-sm;
      flex-direction: row;
    }

    .break {
      flex-basis: 100%;
      width: 0;
    }

    > div {
      -webkit-transition: all ease 0.4;
      transition: all ease 0.4;

      .value {
        -webkit-transition: all ease 0.4s;
        transition: all ease 0.4s;
        display: inline-block;
      }

      small {
        -webkit-transition: all ease 0.4s;
        transition: all ease 0.4s;
      }

      .animate,
      &.animate {
        .value {
          -webkit-animation: jello-vertical 1s both;
          animation: jello-vertical 1s both;
        }
      }
    }

    a {
      &:hover small {
        color: var(--primary-color) !important;
      }

      text-decoration: none;
    }
  }

  .left-section {
    display: flex;
    align-items: center;
    gap: 0 8px;
    height: 35px;
  }

  .right-section {
    display: flex;
    align-items: center;
    justify-content: end;
    gap: 0 8px;
    flex: 1;

    #network-wrapper,
    #theme-wrapper {
      position: relative;

      .network-container,
      .theme-container {
        width: 38px;
        height: 38px;

        border-radius: $radius-lg;
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
    border-radius: $radius-lg;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    width: 46px;

    .search-bar-input {
      flex: 1;
      font-size: $font-size-desktop;
      border: none;
      height: 38px;
      color: var(--sec-font-color);
      background-color: var(--card-bg-color);
      padding: $space-0 $space-16;
      border-radius: $radius-lg;
      transition: width 0.3s ease;
      padding-right: 2.5rem;
      padding-left: $space-16;

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
      padding-left: $space-5;

      &:hover {
        fill: var(--primary-color);
      }
    }

    span {
      display: none;
      pointer-events: none;
      font-size: $font-size-sm;
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
  border-radius: $radius-lg;
  width: 155px;
  background: var(--card-bg-color);

  a {
    cursor: pointer;
    background: var(--card-bg-color);
    color: var(--font-color);
    border: none;
    padding: $space-8 $space-16;
    text-decoration: none;
    text-align: center;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: background-color 0.3s ease;

    &:first-of-type {
      border-radius: $radius-lg $radius-lg 0 0;
    }

    &:last-of-type {
      border-radius: 0 0 $radius-lg $radius-lg;
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
