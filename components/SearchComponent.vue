<template>
  <div
    id="search-container"
    @click="search"
    :class="{
      'default-styles': useDefaultStyles,
      'mobile-search': isMobile,
      expanded: isExpanded,
    }"
  >
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
      @focus="isSearch = true"
    />

    <div v-if="isLoading" class="loading-spinner">
      <div class="loading-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>
    <SearchIcon v-else-if="showSearchIcon" class="search-icon" @click="find" />

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
              @click.stop="setActiveFilter(filter.type)"
              type="button"
            >
              {{ filter.label }}
              <span class="filter-count">{{ filter.count }}</span>
            </button>
          </div>
        </div>

        <div v-if="suggestions.length > 0" class="search-results">
          <div
            v-for="(suggestion, index) in filteredSuggestions"
            :key="`suggestion-${index}`"
            :class="['suggestion-item', 'result-item']"
            @click.stop="selectSuggestion(suggestion)"
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
          </div>
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
      </div>
    </div>
  </div>
</template>

<script>
import SearchIcon from '~/assets/images/search.svg?inline'
import transaction from '~/assets/images/transaction.svg?inline'
import { search } from '~/api/middleware.api.js'
import Avatar from '~/components/Avatar.vue'
import AssetIcon from '~/components/AssetIcon.vue'

export default {
  name: 'SearchComponent',
  components: {
    SearchIcon,
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
  },
  mounted() {
    window.addEventListener('click', this.handleClickOutside)
    window.addEventListener('touchstart', this.handleClickOutside, {
      passive: true,
    })
  },
  beforeDestroy() {
    window.removeEventListener('click', this.handleClickOutside)
    window.removeEventListener('touchstart', this.handleClickOutside)
    this.clearTimeouts()
  },
  methods: {
    find() {
      if (!this.isSearch) {
        this.$refs.searchInput.focus()
        return
      }

      this.$emit('search', this.searchQuery)
      this.navigateToSearchResult(this.searchQuery)
    },

    search() {
      this.isSearch = true
    },

    async performSearch() {
      const query = this.searchQuery.trim()

      if (query.length < 2) {
        this.resetSearch()
        return
      }

      try {
        const result = await Promise.race([
          search(query),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 2000)
          ),
        ])

        let suggestions = []

        if (result?.data) {
          if (Array.isArray(result.data)) {
            suggestions = result.data
              .filter((item) => item.id && item.type)
              .map((item) => ({
                id: item.id,
                type: item.type,
                searchType: this.determineSearchType(item),
                metadata: this.generateMetadata(item),
              }))
          } else if (
            result.data.results &&
            Array.isArray(result.data.results)
          ) {
            suggestions = result.data.results
              .filter((item) => item.id && item.type)
              .map((item) => ({
                id: item.id,
                type: item.type,
                searchType: this.determineSearchType(item),
                metadata: this.generateMetadata(item),
              }))
          } else if (result.data.id && result.data.type) {
            suggestions = [
              {
                id: result.data.id,
                type: result.data.type,
                searchType: this.determineSearchType(result.data),
                metadata: this.generateMetadata(result.data),
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
        this.suggestions = suggestions.slice(0, 15)
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

    processSearchResults(result) {
      let suggestions = []

      if (result?.data) {
        if (Array.isArray(result.data)) {
          suggestions = this.mapSearchItems(result.data)
        } else if (result.data.results && Array.isArray(result.data.results)) {
          suggestions = this.mapSearchItems(result.data.results)
        } else if (result.data.id && result.data.type) {
          suggestions = [this.mapSearchItem(result.data)]
        }
      }

      return this.sortSuggestions(suggestions, this.searchQuery.trim())
    },

    mapSearchItems(items) {
      return items
        .filter((item) => item.id && item.type)
        .map((item) => this.mapSearchItem(item))
    },

    mapSearchItem(item) {
      return {
        id: item.id,
        type: item.type,
        searchType: this.determineSearchType(item),
        metadata: this.generateMetadata(item),
      }
    },

    sortSuggestions(suggestions, query) {
      return suggestions.sort((a, b) => {
        const aExact = a.id.toLowerCase() === query.toLowerCase()
        const bExact = b.id.toLowerCase() === query.toLowerCase()
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1

        const typePriority = { address: 4, pool: 3, thorname: 2, tx: 1 }
        return (
          (typePriority[b.searchType] || 0) - (typePriority[a.searchType] || 0)
        )
      })
    },

    navigateToSearchResult(search) {
      const searchUpper = search.toUpperCase()

      if (searchUpper.length <= 30) {
        this.handleThornameSearch(search)
      } else if (this.isAddress(searchUpper)) {
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

    isAddress(search) {
      const addressPrefixes = [
        'THOR',
        'TTHOR',
        'STHOR',
        'BNB',
        'TBNB',
        'BC1',
        'TB1',
        'LTC',
        'TLTC',
        'COSMOS',
      ]
      return (
        addressPrefixes.some((prefix) => search.startsWith(prefix)) ||
        search.length <= 43
      )
    },

    selectSuggestion(suggestion) {
      event?.stopPropagation()

      this.searchQuery = suggestion.id
      this.showSuggestions = false
      this.isLoading = false
      this.selectedIndex = -1
      this.showNoResults = false

      this.$emit('search', suggestion.id)
      this.navigateToSuggestion(suggestion)
    },

    navigateToSuggestion(suggestion) {
      const routes = {
        address: `/address/${suggestion.id}`,
        tx: `/tx/${suggestion.id}`,
        thorname: `/address/${suggestion.id}`,
        pool: `/pool/${suggestion.id}`,
      }

      const route = routes[suggestion.searchType]
      if (route) {
        this.$nextTick(() => {
          this.$router.push({ path: route })
        })
      }
    },

    onSearchInput() {
      this.clearTimeouts()

      const query = this.searchQuery.trim()

      if (query.length < 2) {
        this.suggestions = []
        this.showSuggestions = false
        this.isLoading = false
        this.showNoResults = false
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
      }
    },

    handleClickOutside(e) {
      const searchContainer =
        this.$refs.searchInput?.closest('#search-container')
      const suggestionsContainer = this.$refs.suggestionsContainer

      if (
        searchContainer &&
        !searchContainer.contains(e.target) &&
        suggestionsContainer &&
        !suggestionsContainer.contains(e.target)
      ) {
        this.hideSuggestions()
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
        Address: 'address',
        address: 'address',
        Transaction: 'tx',
        transaction: 'tx',
        tx: 'tx',
        THORName: 'thorname',
        thorname: 'thorname',
        Pool: 'pool',
        pool: 'pool',
      }
      return typeMap[item.type] || 'address'
    },

    generateMetadata(item) {
      const searchType = this.determineSearchType(item)
      const metadataMap = {
        tx: item.blockHeight ? `Block ${item.blockHeight}` : 'Transaction',
        address: item.balance ? `${item.balance} RUNE` : 'Address',
        thorname: item.owner
          ? `Owner: ${item.owner.slice(0, 8)}...`
          : 'THORName',
        pool: item.asset ? `${item.asset}` : 'Pool',
      }
      return metadataMap[searchType] || null
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
  }

  .search-bar-input {
    font-size: $font-size-s;
    padding-right: 2.5rem;
    padding-left: $space-12;
    flex: 1;
    border: none;
    height: 40px;
    border-radius: $radius-xl;
    color: var(--sec-font-color);
    background-color: var(--input-bg-color);
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;

    &:focus {
      outline: none;
      border-color: var(--primary-color);
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

    @include sm {
      right: 0.8rem;
      width: 20px;
      height: 24px;
      left: auto;
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
    transition: width 0.3s ease;

    &.expanded {
      width: 100%;
      overflow: visible;
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
      max-height: 350px;
      min-height: 80px;
      border-radius: $radius-lg $radius-lg 0 0;
      border-bottom: none;
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
              background-color: rgba(255, 255, 255, 0.2);
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
          border-bottom: 1px solid var(--border-color);
          position: relative;
          gap: $space-12;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;

          &:last-child {
            border-bottom: none;
          }

          &:hover {
            background-color: var(--darker-bg);
            transform: translateX(2px);

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
    }
  }
}
</style>
