<template>
  <div
    id="search-container"
    :class="{
      'default-styles': useDefaultStyles,
      'mobile-search': isMobile,
      expanded: isExpanded,
    }"
    @click="search"
  >
    <SearchIcon v-if="showSearchIcon" class="search-icon-left" @click="find" />

    <input
      ref="searchInput"
      v-model="searchQuery"
      :class="['search-bar-input', { hidden: isMobile && !isExpanded }]"
      type="text"
      :placeholder="
        isMobile && !isExpanded
          ? false
          : 'Search by Address / Txn Hash / THORName'
      "
      @keyup.enter="find"
      @keydown="handleKeydown"
      @input="onSearchInput"
      @focus="atFocus()"
      @blur="onBlur()"
    />

    <div v-if="isLoading" class="loading-spinner">
      <div class="loading-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>
    <div v-else-if="searchQuery.trim().length > 0" class="action-buttons">
      <CrossIcon class="clear-button" @click="clearSearch" />
      <EnterIcon
        v-if="suggestions.length > 0"
        class="enter-button"
        @click="goToFirstResult"
      />
    </div>
    <!-- "/" key indicator on the right -->
    <div v-else-if="showSearchIcon" class="slash-key" @click="find">
      <span>/</span>
    </div>

    <div
      v-if="showSuggestions && !isLoading"
      ref="suggestionsContainer"
      :class="['search-suggestions', { 'dashboard-layout': isDashboardLayout }]"
    >
      <div class="suggestion-section">
        <div v-if="suggestions.length > 0" class="results-header">
          <div class="filter-tabs">
            <button
              v-for="filter in availableFilters"
              :key="filter.type"
              :class="['filter-tab', { active: activeFilter === filter.type }]"
              type="button"
              @click.stop="setActiveFilter(filter.type)"
            >
              {{ filter.label }}
              <span class="filter-count">{{ filter.count }}</span>
            </button>
          </div>
        </div>

        <div v-if="suggestions.length > 0" class="search-results">
          <nuxt-link
            v-for="(suggestion, index) in filteredSuggestions"
            :key="`suggestion-${index}`"
            :to="getSuggestionRoute(suggestion)"
            :class="['suggestion-item', 'result-item']"
            @click.native="selectSuggestion(suggestion)"
            @mouseenter="selectedIndex = index"
          >
            <div class="suggestion-icon">
              <avatar
                v-if="
                  suggestion.searchType === 'address' ||
                  suggestion.searchType === 'thorname'
                "
                :name="suggestion.searchType"
                :small="true"
              />
              <span v-else-if="suggestion.searchType === 'tx'">
                <transaction />
              </span>
              <span v-else-if="suggestion.searchType === 'pool'">
                <AssetIcon :asset="suggestion.id" />
              </span>
            </div>
            <div class="suggestion-details">
              <div class="suggestion-id">
                {{ suggestion.id }}
              </div>
            </div>
            <div class="suggestion-badge">
              <span :class="['badge', `badge-${suggestion.searchType}`]">
                {{ getBadgeText(suggestion.searchType) }}
              </span>
            </div>
            <div class="suggestion-actions">
              <div class="suggestion-arrow">→</div>
            </div>
          </nuxt-link>
        </div>

        <div v-else-if="showNoResults" class="no-results">
          <div class="no-results-content">
            <div class="no-results-icon-container">
              <div class="no-results-icon">
                <SearchIcon />
              </div>
            </div>
            <div class="no-results-text">
              <h4>No results found</h4>
              <p>Try different keywords or check spelling</p>
            </div>
          </div>
        </div>

        <div v-if="suggestions.length > 0" class="help-indicator">
          <div class="help-content">
            <div class="key-indicator">ESC</div>
            <span class="help-text">close</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SearchIcon from '~/assets/images/search.svg?inline'
import EnterIcon from '~/assets/images/arrow-turn-down-right.svg?inline'
import CrossIcon from '~/assets/images/cross.svg?inline'
import transaction from '~/assets/images/transaction.svg?inline'
import Avatar from '~/components/Avatar.vue'
import AssetIcon from '~/components/AssetIcon.vue'

export default {
  name: 'SearchComponent',
  components: {
    SearchIcon,
    EnterIcon,
    CrossIcon,
    Avatar,
    transaction,
    AssetIcon,
  },
  props: {
    useDefaultStyles: {
      type: Boolean,
      default: true,
    },
    showSearchIcon: {
      type: Boolean,
      default: true,
    },
    isMobile: {
      type: Boolean,
      default: false,
    },
    isExpanded: {
      type: Boolean,
      default: false,
    },
    isDashboardLayout: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      searchQuery: '',
      isSearch: false,
      showSuggestions: false,
      suggestions: [],
      searchTimeout: null,
      isLoading: false,
      activeFilter: 'all',
      selectedIndex: -1,
      showNoResults: false,
      noResultsTimeout: null,
    }
  },
  computed: {
    filteredSuggestions() {
      if (this.activeFilter === 'all') return this.suggestions
      return this.suggestions.filter(
        (suggestion) => suggestion.searchType === this.activeFilter
      )
    },
    availableFilters() {
      const counts = {
        all: this.suggestions.length,
        address: this.suggestions.filter((s) => s.searchType === 'address')
          .length,
        tx: this.suggestions.filter((s) => s.searchType === 'tx').length,
        thorname: this.suggestions.filter((s) => s.searchType === 'thorname')
          .length,
        pool: this.suggestions.filter((s) => s.searchType === 'pool').length,
      }

      return [
        { type: 'all', label: 'All', count: counts.all },
        { type: 'address', label: 'Addresses', count: counts.address },
        { type: 'tx', label: 'Transactions', count: counts.tx },
        { type: 'thorname', label: 'THORNames', count: counts.thorname },
        { type: 'pool', label: 'Pools', count: counts.pool },
      ].filter((filter) => filter.count > 0 || filter.type === 'all')
    },
  },
  watch: {
    $route() {
      this.resetSearch()
    },
    searchQuery(newValue) {
      if (!newValue || newValue.trim().length === 0) {
        this.hideSuggestions()
      }
    },
  },
  mounted() {
    window.addEventListener('click', this.handleClickOutside)
    window.addEventListener('touchstart', this.handleClickOutside, {
      passive: true,
    })
    window.addEventListener('keydown', this.handleGlobalKeydown)
  },
  beforeDestroy() {
    window.removeEventListener('click', this.handleClickOutside)
    window.removeEventListener('touchstart', this.handleClickOutside)
    window.removeEventListener('keydown', this.handleGlobalKeydown)
    this.clearTimeouts()
  },
  methods: {
    find() {
      if (this.isMobile && !this.isExpanded) {
        this.$emit('expand-search')
        return
      }

      if (!this.isSearch) {
        this.$refs.searchInput.focus()
        return
      }

      if (this.suggestions.length > 0) {
        this.goToFirstResult()
        return
      }

      this.$emit('search', this.searchQuery)
      this.navigateToSearchResult(this.searchQuery)
    },

    goToFirstResult() {
      if (this.suggestions.length > 0) {
        const firstSuggestion = this.suggestions[0]
        this.selectSuggestion(firstSuggestion)
      }
    },

    search() {
      this.isSearch = true
    },

    atFocus() {
      this.isSearch = true
      if (this.suggestions.length > 0) {
        this.showSuggestions = true
      }
      this.$refs.searchInput.classList.remove('slash-focus')
      const container = this.$refs.searchInput.closest('#search-container')
      if (container) {
        container.classList.remove('slash-focus-active')
      }
      this.$emit('slash-blur')
    },

    onBlur() {
      this.$refs.searchInput.classList.remove('slash-focus')
      const container = this.$refs.searchInput.closest('#search-container')
      if (container) {
        container.classList.remove('slash-focus-active')
      }
      this.$emit('slash-blur')
    },

    async performSearch() {
      const query = this.searchQuery.trim()

      if (query.length < 2) {
        this.resetSearch()
        return
      }

      const timeoutRace = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 2000)
      )

      try {
        const result = await Promise.race([
          this.$api.search(query),
          timeoutRace,
        ])

        let suggestions = []

        if (result?.data) {
          const processItems = (items) => {
            return items
              .filter((item) => item.id && item.type)
              .map((item) => ({
                id: item.id,
                type: item.type,
                searchType: this.determineSearchType(item),
              }))
          }

          if (Array.isArray(result.data)) {
            suggestions = processItems(result.data)
          } else if (
            result.data.results &&
            Array.isArray(result.data.results)
          ) {
            suggestions = processItems(result.data.results)
          } else if (result.data.id && result.data.type) {
            suggestions = [
              {
                id: result.data.id,
                type: result.data.type,
                searchType: this.determineSearchType(result.data),
              },
            ]
          }
        }

        suggestions.sort((a, b) => {
          const aExact = a.id.toLowerCase() === query.toLowerCase()
          const bExact = b.id.toLowerCase() === query.toLowerCase()
          if (aExact && !bExact) return -1
          if (!aExact && bExact) return 1

          const typePriority = { address: 4, pool: 3, thorname: 2, tx: 1 }
          return (
            (typePriority[b.searchType] || 0) -
            (typePriority[a.searchType] || 0)
          )
        })
        this.suggestions = suggestions
        this.activeFilter = 'all'
        this.selectedIndex = -1
        this.showNoResults = suggestions.length === 0
      } catch (error) {
        console.error('Search error:', error)
        this.suggestions = []
        this.showNoResults = true
      } finally {
        this.isLoading = false
      }
    },

    navigateToSearchResult(search) {
      const searchUpper = search.toUpperCase()

      if (searchUpper.length <= 30) {
        this.handleThornameSearch(search)
      } else if (searchUpper.length <= 43) {
        this.$router.push({ path: `/address/${search}` })
      } else {
        this.$router.push({ path: `/tx/${search}` })
      }
    },

    async handleThornameSearch(query) {
      try {
        const res = await this.$api.getThorname(query)
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
      } catch (error) {
        console.error('THORName search error:', error)
      }
    },

    selectSuggestion(suggestion) {
      event?.stopPropagation()

      this.searchQuery = suggestion.id
      this.showSuggestions = false
      this.isLoading = false
      this.selectedIndex = -1
      this.showNoResults = false

      this.searchQuery = ''
      this.$emit('search', suggestion.id)

      const route = this.getSuggestionRoute(suggestion)
      this.$router.push(route)
    },

    onSearchInput() {
      this.clearTimeouts()

      const query = this.searchQuery.trim()

      if (query.length < 2) {
        this.suggestions = []
        this.showSuggestions = false
        this.isLoading = false
        this.showNoResults = false
        this.selectedIndex = -1
        return
      }

      this.isLoading = true
      this.showSuggestions = true
      this.suggestions = []
      this.showNoResults = false

      this.noResultsTimeout = setTimeout(() => {
        if (this.suggestions.length === 0 && !this.isLoading) {
          this.showNoResults = true
        }
      }, 500)

      this.searchTimeout = setTimeout(() => {
        this.performSearch()
      }, 500)
    },

    handleKeydown(e) {
      if (!this.showSuggestions) return

      const keyHandlers = {
        ArrowDown: () => this.navigateSuggestion(1),
        ArrowUp: () => this.navigateSuggestion(-1),
        Enter: () => this.selectCurrentSuggestion(e),
        Escape: () => this.hideSuggestions(),
      }

      const handler = keyHandlers[e.key]
      if (handler) {
        e.preventDefault()
        handler()
      }
    },

    handleGlobalKeydown(e) {
      if (e.key === '/' && !this.isInputFocused()) {
        e.preventDefault()
        this.$nextTick(() => {
          this.$refs.searchInput.focus()
          this.$refs.searchInput.classList.add('slash-focus')
          const container = this.$refs.searchInput.closest('#search-container')
          if (container) {
            container.classList.add('slash-focus-active')
          }
          this.$emit('slash-focus')
        })
        return
      }

      if (e.key === 'Escape' && this.showSuggestions) {
        this.hideSuggestions()
      }
    },

    isInputFocused() {
      return document.activeElement === this.$refs.searchInput
    },

    navigateSuggestion(direction) {
      if (this.filteredSuggestions.length === 0) return

      const newIndex =
        direction === 1
          ? this.selectedIndex < this.filteredSuggestions.length - 1
            ? this.selectedIndex + 1
            : 0
          : this.selectedIndex > 0
            ? this.selectedIndex - 1
            : this.filteredSuggestions.length - 1

      this.selectedIndex = newIndex
    },

    selectCurrentSuggestion(e) {
      if (
        this.selectedIndex >= 0 &&
        this.filteredSuggestions[this.selectedIndex]
      ) {
        this.selectSuggestion(this.filteredSuggestions[this.selectedIndex])
      } else if (this.suggestions.length > 0) {
        this.goToFirstResult()
      }
    },

    handleClickOutside(e) {
      const searchContainer =
        this.$refs.searchInput?.closest('#search-container')
      const suggestionsContainer = this.$refs.suggestionsContainer

      const isOutsideSearch =
        searchContainer && !searchContainer.contains(e.target)

      const isOutsideSuggestions =
        this.showSuggestions &&
        suggestionsContainer &&
        !suggestionsContainer.contains(e.target)

      if (isOutsideSearch && (isOutsideSuggestions || !this.showSuggestions)) {
        this.hideSuggestions()

        if (this.isMobile && this.isExpanded) {
          this.$emit('close-expanded')
        }
      }
    },

    resetSearch() {
      this.suggestions = []
      this.showSuggestions = false
      this.isLoading = false
      this.showNoResults = false
    },

    hideSuggestions() {
      this.showSuggestions = false
      this.selectedIndex = -1
      this.showNoResults = false
    },

    clearTimeouts() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }
      if (this.noResultsTimeout) {
        clearTimeout(this.noResultsTimeout)
      }
    },

    setActiveFilter(type) {
      this.activeFilter = type
      this.selectedIndex = -1
    },

    determineSearchType(item) {
      const typeMap = {
        address: 'address',
        transaction: 'tx',
        tx: 'tx',
        thorname: 'thorname',
        pool: 'pool',
      }
      return typeMap[item.type] || 'address'
    },

    getBadgeText(type) {
      const badgeMap = {
        address: 'Address',
        tx: 'Transaction',
        thorname: 'THORName',
        pool: 'Pool',
      }
      return badgeMap[type] || type
    },

    getSuggestionRoute(suggestion) {
      const routes = {
        address: `/address/${suggestion.id}`,
        tx: `/tx/${suggestion.id}`,
        thorname: `/address/${suggestion.id}`,
        pool: `/pool/${suggestion.id}`,
      }
      return routes[suggestion.searchType] || `/address/${suggestion.id}`
    },

    clearSearch() {
      this.searchQuery = ''
      this.hideSuggestions()
      this.resetSearch()
      this.$refs.searchInput.focus()
    },
  },
}
</script>

<style lang="scss" scoped>
#search-container {
  display: flex;
  transition: all 0.5s ease;
  overflow: visible;
  width: 100%;
  position: relative;

  &.default-styles {
    border: 1px solid var(--border-color);
    border-radius: $radius-lg;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

    &:focus-within,
    &.slash-focus-active {
      border-color: #626262;
      outline: 2px #626262 solid;
      box-shadow:
        0 0 0 2px rgba(106, 106, 106, 0.15),
        0 8px 20px rgba(0, 0, 0, 0.2);
    }
  }

  .search-bar-input {
    font-size: $font-size-s;
    padding-right: 6rem;
    padding-left: 2.5rem;
    flex: 1;
    border: none;
    height: 40px;
    border-radius: $radius-xl;
    color: var(--sec-font-color);
    background-color: var(--input-bg-color);
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
    text-align: left;

    &:focus {
      outline: none;
    }

    &.slash-focused {
      border-color: #626262;
      border-width: 2px;
      box-shadow:
        0 0 0 2px rgba(106, 106, 106, 0.15),
        0 8px 20px rgba(0, 0, 0, 0.2);
    }

    @include lg {
      font-size: $font-size-sm;
    }
  }

  .loading-spinner {
    position: absolute;
    right: 0.8rem;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    transition: fill 0.3s ease;
    box-sizing: content-box;
    background: var(--card-bg-color);
    padding-left: $space-5;

    .loading-dots {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
    }

    .dot {
      width: 4px;
      height: 4px;
      background-color: var(--font-color);
      border-radius: 50%;
      margin: 2px;
      animation: blink 1.2s infinite;

      &:nth-child(2) {
        animation-delay: 0.2s;
      }

      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }

    @keyframes blink {
      0%,
      100% {
        opacity: 0;
      }
      50% {
        opacity: 1;
      }
    }
  }

  .search-icon-left {
    position: absolute;
    width: 20px;
    height: 24px;
    fill: var(--font-color);
    left: 0.8rem;
    top: calc(50% - 0.8rem);
    cursor: pointer;
    transition: fill 0.3s ease;
    box-sizing: content-box;
    background: var(--card-bg-color);
    padding-right: $space-5;
    z-index: 2;

    &:hover {
      fill: var(--primary-color);
    }

    @include sm {
      left: 0.8rem;
      width: 20px;
      height: 24px;
      right: auto;
    }
  }

  .slash-key {
    position: absolute;
    right: 0.8rem;
    top: 50%;
    transform: translateY(-50%);

    span {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      font-size: 14px;
      font-weight: 600;
      color: var(--sec-font-color);
      transition: all 0.2s ease;
      opacity: 0.7;
    }

    @include sm {
      right: 0.8rem;
      left: auto;
    }
  }

  .action-buttons {
    position: absolute;
    right: 0rem;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    background: var(--card-bg-color);
    padding-left: $space-3;

    @include sm {
      right: 0rem;
      left: auto;
    }
  }

  .clear-button {
    cursor: pointer;
    transition: all 0.3s ease;
    box-sizing: content-box;
    width: 16px;
    height: 16px;
    fill: var(--sec-font-color);
    transition: fill 0.2s;
    padding: $space-3;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
    border-radius: 50%;
    margin-right: 0.3rem;

    &:hover {
      fill: var(--primary-color);
      transform: scale(1.1);
      opacity: 1;
    }
  }

  .enter-button {
    cursor: pointer;
    transition: all 0.3s ease;
    box-sizing: content-box;
    width: 13px;
    height: 13px;
    color: var(--sec-font-color);
    transition: color 0.2s;
    border: 1px solid var(--border-color);
    border-radius: $radius-sm;
    padding: $space-3 $space-6;
    background-color: var(--bg-color);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
    transform: scaleX(-1);

    &:hover {
      color: var(--primary-color);
      transform: scaleX(-1) scale(1.05);
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

  &.mobile-search {
    width: 46px;
    overflow: hidden;
    transition: width 1s ease;

    &.expanded {
      width: 100%;
      overflow: visible;
    }

    &:not(.expanded) {
      transition: width 4s ease;
      opacity: 0.9;
    }

    .search-bar-input {
      &.hidden {
        color: transparent;
        background-color: transparent;
      }
    }
  }

  .search-suggestions {
    position: absolute;
    top: 53.8px;
    left: 0;
    right: 0;
    background-color: var(--card-bg-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-lg;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    z-index: 9999;
    overflow-x: hidden;
    overflow-y: auto;
    animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    max-height: 400px;
    min-height: 100px;
    width: 100%;

    @media (max-width: 991px) {
      position: fixed;
      top: 49px;
      left: 0;
      right: 0;
      width: calc(100% - #{$space-16} * 2);
      min-height: 80px;
      border-radius: $radius-lg;
      border: 1px solid var(--border-color);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      z-index: 10001;
      transform: translateY(0);
      animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      margin: 0 $space-16;

      .search-results {
        max-height: 250px;
      }
    }

    &.dashboard-layout {
      @media (max-width: 991px) {
        position: absolute;
        top: 53.8px;
        left: 0;
        right: 0;
        width: 100%;
        max-height: 350px;
        min-height: 80px;
        border-radius: $radius-lg;
        border: 1px solid var(--border-color);
        z-index: 9999;
        transform: translateY(0);
        animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        margin: 0;

        .search-results {
          max-height: 250px;
        }
      }
    }

    @keyframes slideDown {
      0% {
        opacity: 0;
        transform: translateY(-12px) scale(0.98);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes slideUp {
      0% {
        opacity: 0;
        transform: translateY(100%);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .suggestion-section {
      .results-header {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        padding: $space-10 $space-16;
        border-bottom: 1px solid var(--border-color);

        @media (max-width: 991px) {
          padding: $space-8 $space-12;
        }

        .filter-tabs {
          display: flex;
          gap: $space-4;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          width: 100%;

          &::-webkit-scrollbar {
            display: none;
          }

          @media (max-width: 991px) {
            gap: $space-2;
            padding-bottom: $space-2;
          }

          .filter-tab {
            background: none;
            border: 1px solid var(--border-color);
            color: var(--sec-font-color);
            font-size: $font-size-xs;
            cursor: pointer;
            padding: $space-4 $space-8;
            border-radius: $radius-sm;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: $space-4;
            user-select: none;
            white-space: nowrap;
            flex-shrink: 0;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;

            &:hover {
              color: var(--font-color);
              border-color: var(--primary-color);
            }

            &.active {
              background-color: var(--primary-color);
              color: var(--sec-font-color);
              border-color: var(--primary-color);
            }

            .filter-count {
              background-color: rgba(102, 126, 234, 0.2);
              padding: $space-2 $space-4;
              border-radius: $radius-sm;
              font-size: 10px;
              min-width: 16px;
              text-align: center;
            }

            @media (max-width: 991px) {
              padding: $space-4 $space-6;
              font-size: 11px;
              min-height: 32px;
              gap: $space-2;

              .filter-count {
                padding: $space-2 $space-3;
                font-size: 9px;
                min-width: 14px;
                display: inline-block;
                visibility: visible;
                opacity: 1;
                line-height: 1;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
              }
            }
          }
        }
      }

      .search-results {
        max-height: 300px;
        overflow-x: hidden;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--border-color) transparent;

        &::-webkit-scrollbar {
          width: 6px;
        }

        &::-webkit-scrollbar-track {
          background: transparent;
        }

        &::-webkit-scrollbar-thumb {
          background-color: var(--border-color);
          border-radius: 3px;

          &:hover {
            background-color: var(--sec-font-color);
          }
        }

        .suggestion-item {
          display: grid;
          grid-template-columns: 40px 1fr 100px 40px;
          align-items: center;
          padding: $space-10 $space-16;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid rgb(124 124 124 / 20%);
          position: relative;
          gap: $space-12;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          text-decoration: none;
          color: inherit;

          &:last-child {
            border-bottom: none;
          }

          &:hover {
            background-color: var(--darker-bg);
            transform: translateX(2px);
            margin-left: -3px;

            .suggestion-arrow {
              opacity: 1;
              transform: translateX(4px);
            }

            .suggestion-id {
              color: var(--primary-color);
            }
          }

          .suggestion-icon {
            grid-column: 1;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;

            svg {
              fill: var(--font-color);
              opacity: 0.8;
              transition: all 0.2s ease;
            }

            span {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 24px;
              height: 24px;
            }
          }

          .suggestion-details {
            grid-column: 2;
            min-width: 0;

            .suggestion-id {
              font-size: $font-size-sm;
              color: var(--sec-font-color);
              font-weight: 500;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              line-height: 1.4;
              transition: color 0.2s ease;
            }
          }

          .suggestion-badge {
            grid-column: 3;
            display: flex;
            justify-content: center;

            .badge {
              font-size: 10px;
              font-weight: 600;
              padding: $space-2 $space-6;
              border-radius: $radius-sm;
              text-transform: uppercase;
              letter-spacing: 0.5px;

              &.badge-address {
                background-color: rgba(102, 126, 234, 0.1);
                color: #667eea;
              }

              &.badge-tx {
                background-color: rgba(240, 147, 251, 0.1);
                color: #f093fb;
              }

              &.badge-thorname {
                background-color: rgba(79, 172, 254, 0.1);
                color: #4facfe;
              }

              &.badge-pool {
                background-color: rgba(34, 197, 94, 0.1);
                color: #22c55e;
              }
            }
          }

          .suggestion-actions {
            grid-column: 4;
            display: flex;
            align-items: center;
            justify-content: center;

            .suggestion-arrow {
              width: 20px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--sec-font-color);
              opacity: 0.5;
              font-size: 14px;
              transition: all 0.2s ease;
            }
          }
        }
      }

      .no-results {
        padding: $space-32 $space-20;
        text-align: center;
        background: linear-gradient(
          135deg,
          var(--card-bg-color) 0%,
          rgba(255, 255, 255, 0.02) 100%
        );
        border-radius: $radius-lg;
        margin: $space-8;

        .no-results-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: $space-16;

          .no-results-icon-container {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 64px;
            height: 64px;
            background: linear-gradient(
              135deg,
              rgba(102, 126, 234, 0.1) 0%,
              rgba(240, 147, 251, 0.1) 100%
            );
            border-radius: 50%;
            margin-bottom: $space-8;

            .no-results-icon {
              svg {
                width: 28px;
                height: 28px;
                opacity: 0.6;
                fill: var(--primary-color);
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
              }
            }
          }

          .no-results-text {
            h4 {
              margin: 0 0 $space-8 0;
              font-size: $font-size-xl;
              color: var(--font-color);
              font-weight: 700;
              letter-spacing: -0.02em;
              background: linear-gradient(
                135deg,
                var(--font-color) 0%,
                var(--sec-font-color) 100%
              );
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }

            p {
              margin: 0;
              font-size: $font-size-sm;
              color: var(--sec-font-color);
              line-height: 1.6;
              max-width: 280px;
              opacity: 0.8;
            }
          }
        }

        @media (max-width: 991px) {
          padding: $space-24 $space-16;
          margin: $space-4;

          .no-results-content {
            gap: $space-12;

            .no-results-icon-container {
              width: 56px;
              height: 56px;

              .no-results-icon svg {
                width: 24px;
                height: 24px;
              }
            }

            .no-results-text {
              h4 {
                font-size: $font-size-lg;
              }

              p {
                max-width: 240px;
              }
            }
          }
        }
      }

      .help-indicator {
        padding: $space-4 $space-12;
        background-color: rgba(0, 0, 0, 0.02);
        border-radius: 0 0 $radius-lg $radius-lg;
        border-top: 1px solid rgb(124 124 124 / 20%);

        .help-content {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-start;
          gap: $space-5;
          font-size: 11px;
          color: var(--sec-font-color);
          opacity: 0.6;
          padding-right: 0.2rem;
          padding-top: 0.2rem;
          padding-bottom: 0.2rem;

          .help-text {
            font-weight: 400;
            text-transform: lowercase;
            font-size: $font-size-s;
          }

          .key-indicator {
            padding: 2px 6px;
            border-radius: 3px;
            font-size: $font-size-xxs;
            letter-spacing: 0.3px;
            border: 1px solid var(--border-color);
            min-width: 20px;
            text-align: center;
            display: inline-block;
            line-height: 1.2;
          }
        }

        @media (max-width: 991px) {
          padding: $space-3 $space-8;

          .separator-line {
            margin-bottom: $space-3;
          }

          .help-content {
            font-size: $font-size-s;
            gap: $space-2;

            .help-text {
              display: inline-block;
              visibility: visible;
              opacity: 1;
            }

            .key-indicator {
              padding: 1px 4px;
              font-size: $font-size-s;
              min-width: 18px;
            }
          }
        }
      }
    }
  }
}
</style>
