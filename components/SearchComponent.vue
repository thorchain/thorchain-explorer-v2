<template>
  <div
    id="search-container"
    @click="search"
    :class="{ 'default-styles': useDefaultStyles }"
  >
    <input
      ref="searchInput"
      v-model="searchQuery"
      class="search-bar-input"
      type="text"
      placeholder="Search by Address / Txn Hash / THORName"
      @keyup.enter="find"
      @input="onSearchInput"
      @focus="isSearch = true"
    />
    <div v-if="isLoading" class="loading-spinner">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>
    <SearchIcon v-else-if="showSearchIcon" class="search-icon" @click="find" />

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
                    v-if="group.type === 'address' || group.type === 'thorname'"
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
                <div class="group-title">({{ getGroupTitle(group.type) }})</div>
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
</template>

<script>
import SearchIcon from '~/assets/images/search.svg?inline'
import transaction from '~/assets/images/transaction.svg?inline'
import { search } from '~/api/middleware.api.js'
import Address from '~/components/transactions/Address.vue'
import Avatar from '~/components/Avatar.vue'
import Hash from '~/components/transactions/Hash.vue'

export default {
  name: 'SearchComponent',
  components: {
    SearchIcon,
    Address,
    Avatar,
    Hash,
    transaction,
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
  },
  data() {
    return {
      searchQuery: '',
      isSearch: false,
      showSuggestions: false,
      suggestions: [],
      searchTimeout: null,
      isLoading: false,
    }
  },
  computed: {
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
  },
  mounted() {
    window.addEventListener('click', this.handleClickOutside)
    window.addEventListener('touchstart', this.handleClickOutside)
  },
  beforeDestroy() {
    window.removeEventListener('click', this.handleClickOutside)
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout)
    }
  },
  methods: {
    find() {
      if (!this.isSearch) {
        this.$refs.searchInput.focus()
        return
      }

      this.$emit('search', this.searchQuery)

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
    search() {
      this.isSearch = true
    },
    handleClickOutside(e) {
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

      this.$emit('search', suggestion.id)

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

<style lang="scss" scoped>
#search-container {
  display: flex;
  transition: all 0.5s ease;
  overflow: visible;
  width: 100%;
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

    @include sm {
      right: 0.8rem;
      width: 20px;
      height: 24px;
      left: 437px;
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
    top: 53.8px;
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
</style>
