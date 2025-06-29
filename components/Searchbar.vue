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
          @input="onSearchInput"
          @focus="isSearch = true"
        />
        <div v-if="isLoading" class="loading-spinner">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
        <SearchIcon v-else class="search-icon" @click="find" />

        <div v-if="showSuggestions && !isLoading" class="search-suggestions">
          <div v-if="suggestions.length > 0">
            <div
              v-for="(group, groupIndex) in groupedSuggestions"
              :key="groupIndex"
              class="suggestion-group"
            >
              <div class="group-items">
                <div
                  v-for="(suggestion, index) in group.items"
                  :key="index"
                  class="suggestion-item"
                  @click="selectSuggestion(suggestion)"
                >
                  <div class="suggestion-content">
                    <div class="group-icon">
                      <avatar
                        v-if="
                          group.type === 'address' || group.type === 'thorname'
                        "
                        :name="group.type"
                        :small="true"
                      />
                      <span v-else-if="group.type === 'tx'" class="icon tx">
                        <transaction />
                      </span>
                    </div>
                    <div class="suggestion-id">
                      <Address
                        v-if="
                          suggestion.searchType === 'address' ||
                          suggestion.searchType === 'thorname'
                        "
                        :address="suggestion.id"
                        :disable="true"
                      />
                      <Hash
                        v-else-if="suggestion.searchType === 'tx'"
                        :param="suggestion.id"
                        :show-copy="false"
                      />
                    </div>
                    <div class="group-title">
                      ({{ getGroupTitle(group.type) }})
                    </div>
                  </div>
                  <div class="suggestion-arrow">→</div>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="searchQuery.trim().length >= 2" class="no-results">
            <div class="no-results-icon">
              <SearchIcon />
            </div>
            <h4>No results found</h4>
          </div>
        </div>
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
import SearchIcon from '~/assets/images/search.svg?inline'
import transaction from '~/assets/images/transaction.svg?inline'
import MoonIcon from '~/assets/images/moon-icon.svg?inline'
import SunIcon from '~/assets/images/sun-icon.svg?inline'
import SettingsIcon from '~/assets/images/settings.svg?inline'
import links from '~/const/links'
import BlueElectra from '~/assets/images/blueelectra.svg?inline'
import { search } from '~/api/middleware.api.js'
import Address from '~/components/transactions/Address.vue'
import Avatar from '~/components/Avatar.vue'
import Hash from '~/components/transactions/Hash.vue'
import Thorname from '~/pages/address/components/thorname.vue'

export default {
  name: 'SearchBar',
  components: {
    SunIcon,
    MoonIcon,
    SearchIcon,
    SettingsIcon,
    Address,
    BlueElectra,
    Avatar,
    Hash,
    Thorname,
    transaction,
  },
  data() {
    return {
      searchQuery: '',
      isSearch: false,
      showDialog: false,
      showSettings: false,
      innerWidth: window.innerWidth,
      isScrolled: false,
      showSuggestions: false,
      suggestions: [],
      searchTimeout: null,
      isLoading: false,
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
    groupedSuggestions() {
      const groups = {
        address: [],
        tx: [],
        thorname: [],
      }

      this.suggestions.forEach((suggestion) => {
        if (groups[suggestion.searchType]) {
          groups[suggestion.searchType].push(suggestion)
        }
      })

      return Object.entries(groups)
        .filter(([type, items]) => items.length > 0)
        .map(([type, items]) => ({
          type,
          items: items.slice(0, 5),
        }))
    },
  },
  watch: {
    $route(to, from) {
      this.searchQuery = ''
      this.suggestions = []
      this.showSuggestions = false
      this.isLoading = false
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
    suggestions: {
      handler(newVal, oldVal) {},
      deep: true,
    },
    showSuggestions: {
      handler(newVal, oldVal) {},
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
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout)
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
      if (!this.$refs.searchInput?.contains(e.target)) {
        this.showSuggestions = false
        this.isLoading = false
      }
    },
    onSearchInput() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }

      const query = this.searchQuery.trim()

      if (query.length < 2) {
        this.suggestions = []
        this.showSuggestions = false
        this.isLoading = false
        return
      }

      this.isLoading = true
      this.showSuggestions = false

      this.searchTimeout = setTimeout(() => {
        this.performSearch()
      }, 500)
    },

    async performSearch() {
      const query = this.searchQuery.trim()

      if (query.length < 2) {
        this.suggestions = []
        this.showSuggestions = false
        this.isLoading = false
        return
      }

      try {
        const result = await search(query)
        const suggestions = []

        if (result?.data) {
          const data = result.data

          if (Array.isArray(data)) {
            data.forEach((item) => {
              if (item.id && item.type) {
                suggestions.push({
                  id: item.id,
                  type: item.type,
                  searchType: this.determineSearchType(item),
                })
              }
            })
          } else if (data.id && data.type) {
            suggestions.push({
              id: data.id,
              type: data.type,
              searchType: this.determineSearchType(data),
            })
          } else if (data.results && Array.isArray(data.results)) {
            data.results.forEach((item) => {
              if (item.id && item.type) {
                suggestions.push({
                  id: item.id,
                  type: item.type,
                  searchType: this.determineSearchType(item),
                })
              }
            })
          } else if (data.suggestions && Array.isArray(data.suggestions)) {
            data.suggestions.forEach((item) => {
              if (item.id && item.type) {
                suggestions.push({
                  id: item.id,
                  type: item.type,
                  searchType: this.determineSearchType(item),
                })
              }
            })
          }
        }

        this.suggestions = suggestions.slice(0, 10)

        this.showSuggestions = true
      } catch (error) {
        console.error('Search error:', error)
        this.suggestions = []
        this.showSuggestions = true
      } finally {
        this.isLoading = false
      }
    },
    determineSearchType(item) {
      if (item.type === 'Address') return 'address'
      if (item.type === 'Transaction') return 'tx'
      if (item.type === 'THORName') return 'thorname'
      return 'address'
    },
    selectSuggestion(suggestion) {
      this.searchQuery = suggestion.id
      this.showSuggestions = false
      this.isLoading = false

      if (suggestion.searchType === 'address') {
        this.$router.push({ path: `/address/${suggestion.id}` })
      } else if (suggestion.searchType === 'tx') {
        this.$router.push({ path: `/tx/${suggestion.id}` })
      } else if (suggestion.searchType === 'thorname') {
        this.$router.push({ path: `/address/${suggestion.id}` })
      }
    },
    getGroupTitle(type) {
      switch (type) {
        case 'address':
          return 'Addresses'
        case 'tx':
          return 'Transactions'
        case 'thorname':
          return 'THORNames'
        default:
          return 'Suggestions'
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
    padding: 1.5rem 1rem;
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
    border: 1px solid var(--border-color);
    border-radius: $radius-lg;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    overflow: visible;
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

    .loading-spinner {
      position: absolute;
      right: 0.8rem;
      top: calc(50% - 0.8rem);
      cursor: pointer;
      transition: fill 0.3s ease;
      box-sizing: content-box;
      background: var(--card-bg-color);
      padding-left: $space-5;

      .dot {
        width: 4px;
        height: 4px;
        background-color: var(--font-color);
        border-radius: 50%;
        margin: 2px;
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

    .search-suggestions {
      position: absolute;
      top: 43.6px;
      left: 0;
      right: 0;
      background-color: var(--card-bg-color);
      border: 1px solid var(--border-color);
      border-radius: $radius-lg;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      max-height: 400px;
      overflow-y: auto;
      animation: slideDown 0.2s ease-out forwards;

      @keyframes slideDown {
        0% {
          opacity: 0;
          transform: translateY(-8px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .no-results-text {
        font-size: $font-size-sm;
        color: var(--font-color);
        font-weight: 500;
        margin-bottom: $space-2;
      }

      .suggestion-group {
        border-bottom: 1px solid var(--border-color);

        &:last-child {
          border-bottom: none;
        }

        .group-header {
          display: flex;
          align-items: center;
          padding: $space-12 $space-16 $space-8 $space-16;
          background-color: var(--darker-bg);
          border-bottom: 1px solid var(--border-color);

          .group-icon {
            flex-shrink: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: $space-8;

            .icon {
              width: 16px;
              height: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              opacity: 0.8;
              transition: opacity 0.15s ease;

              &.address {
                color: #667eea;
              }

              &.tx {
                color: #f093fb;
              }

              &.thorname {
                color: #4facfe;
              }
            }
          }
        }

        .group-title {
          font-size: $font-size-xs;
          color: var(--sec-font-color);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.8;
        }

        .group-items {
          .suggestion-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: $space-10 $space-16;
            cursor: pointer;
            transition: background-color 0.15s ease;
            border-bottom: 1px solid var(--border-color);

            &:last-child {
              border-bottom: none;
            }

            &:hover {
              background-color: var(--darker-bg);
            }

            .suggestion-content {
              display: flex;
              flex-direction: row;
              align-items: center;
              gap: $space-8;
              width: 100%;

              .suggestion-id {
                font-family: 'Roboto Mono', monospace;
                font-size: $font-size-sm;
                color: var(--font-color);
                font-weight: 500;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                line-height: 1.4;
              }

              .suggestion-type {
                font-size: $font-size-xs;
                color: var(--sec-font-color);
                opacity: 0.8;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 500;
              }
            }

            .suggestion-arrow {
              flex-shrink: 0;
              width: 20px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--sec-font-color);
              opacity: 0.5;
              font-size: 14px;
              transition: all 0.15s ease;
            }

            &:hover {
              .suggestion-content .suggestion-id {
                color: var(--primary-color);
              }

              .suggestion-arrow {
                opacity: 1;
                transform: translateX(2px);
              }
            }
          }
        }
      }

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-track {
        background-color: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background-color: var(--border-color);
        border-radius: 2px;

        &:hover {
          background-color: var(--primary-color);
        }
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
