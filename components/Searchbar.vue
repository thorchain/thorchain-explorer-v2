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
      <div v-show="isOverviewPage ? isScrolled : true" id="search-container">
        <SearchComponent
          ref="searchComponent"
          :use-default-styles="true"
          :show-search-icon="true"
          :is-mobile="innerWidth < 992"
          :is-expanded="isSearch"
          @search="handleSearch"
        />
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
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import MoonIcon from '~/assets/images/moon-icon.svg?inline'
import SunIcon from '~/assets/images/sun-icon.svg?inline'
import SettingsIcon from '~/assets/images/settings.svg?inline'
import links from '~/const/links'
import BlueElectra from '~/assets/images/blueelectra.svg?inline'
import SearchComponent from '~/components/SearchComponent.vue'

export default {
  name: 'SearchBar',
  components: {
    SunIcon,
    MoonIcon,
    SettingsIcon,
    BlueElectra,
    SearchComponent,
  },
  data() {
    return {
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
    this.createListener('network', 'netDialog', { topM: 35 })
    this.createListener('themeContainer', 'themeDialog', {
      topM: 35,
    })
    this.$nextTick(() => {
      window.addEventListener('resize', this.onResize)
    })
  },
  beforeDestroy() {
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
    handleSearch(query) {
      this.isSearch = true
    },
    setTheme(theme) {
      if (theme === 'BlueElectra') {
        this.$store.commit('setTheme', 'BlueElectra')
      } else {
        this.$store.commit('setTheme', theme === 'dark')
      }
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
        overflow: hidden;
      }
    }
  }
  .search-status {
    padding: 1rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;

    &.error {
      color: var(--error-color);
    }

    .loading-spinner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;

      .dot {
        width: 4px;
        height: 4px;
        background-color: var(--font-color);
        border-radius: 50%;
        animation: blink 1.2s infinite;
      }

      .dot:nth-child(2) {
        animation-delay: 0.2s;
      }

      .dot:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes blink {
        0% {
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
        100% {
          opacity: 0;
        }
      }
    }

    p {
      margin: 0;
      font-size: 0.8rem;
      color: var(--sec-font-color);
      line-height: 1.4;
    }
  }

  .no-results {
    padding: $space-16 $space-16;
    text-align: center;

    .no-results-icon {
      margin-bottom: 0.5rem;

      svg {
        width: 40px;
        height: 40px;
        opacity: 0.6;
        fill: var(--sec-font-color);
      }
    }

    h4 {
      margin: 0.5rem 0 0.2rem;
      font-size: 1rem;
      color: var(--font-color);
      font-weight: 500;
    }

    p {
      margin: 0;
      font-size: 0.8rem;
      color: var(--sec-font-color);
      line-height: 1.4;
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
    overflow: visible;
    width: 46px;

    @media (max-width: 991px) {
      overflow: hidden;
    }

    @include lg {
      width: 30rem;
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
