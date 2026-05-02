<template>
  <Page>
    <div class="txs-explorer">
      <section class="hero-row">
        <div class="hero-copy">
          <h1>Transactions</h1>
          <p>
            Every action across THORChain and Rujira - swaps, trades, loans,
            liquidity and more.
          </p>
        </div>

        <div class="hero-side">
          <div v-if="latestThorBlock" class="latest-block-card">
            <div class="stat-label">Latest Block</div>
            <div class="stat-live">
              <span class="stat-live-dot" />
              <div class="stat-value">
                {{ $options.filters.number(latestThorBlock, '0,0') }}
              </div>
            </div>
          </div>

          <div v-if="count > -1" class="count-inline">
            <strong style="color: var(--sec-font-color)">{{
              $options.filters.number(count, '0,0')
            }}</strong>
            transactions
          </div>
        </div>
      </section>

      <section class="toolbar-card">
        <div class="toolbar-row">
          <form class="search-shell" @submit.prevent="applySearch">
            <SearchIcon class="toolbar-icon" />
            <input
              v-model.trim="searchValue"
              type="text"
              placeholder="Search Affiliate"
            />
          </form>

          <div class="toolbar-controls">
            <select-filter
              chip
              single
              :options="assetOptions.map((o) => o.label)"
              :default="assetSelect"
              label="Assets"
              @update:selectedOptions="
                assetSelect = $event
                applyToolbarFilters()
              "
            />

            <select-filter
              chip
              single
              :options="actionOptions.map((o) => o.label)"
              :default="actionSelect"
              label="Action"
              @update:selectedOptions="
                actionSelect = $event
                applyToolbarFilters()
              "
            />

            <advanced-filter ref="advancedFilter" />
          </div>
        </div>

        <div class="preset-rail">
          <button
            v-for="filter in filtersList"
            :key="filter.label"
            :class="['preset-pill', { active: isActive(filter) }]"
            type="button"
            @click="applyFilter(filter)"
          >
            {{ filter.label }}
          </button>
        </div>
      </section>

      <div v-if="error" class="error-container">
        Can't Fetch the actions! Please Try again Later.
      </div>

      <Transactions v-else :txs="txs" :loading="loading" />
      <!-- <TxList v-else :actions="txs && txs.actions" :loading="loading" /> -->

      <NewPagination
        v-if="txs && txs.actions && count > -1"
        :total-rows="count"
        :per-page="limit"
        :current-page="currentPage"
        @change="onPageChange"
      />
      <pagination
        v-else-if="txs && txs.actions"
        :loading="loading"
        :meta="txs && txs.actions"
        @nextPage="goNext"
        @prevPage="goPrev"
      />
    </div>
  </Page>
</template>

<script>
import { pick } from 'lodash'
import advancedFilter from './components/advancedFilter.vue'
import NewPagination from '~/components/NewPagination.vue'
import Pagination from '~/components/Pagination.vue'
import TxList from '~/components/TxList.vue'
import selectFilter from '~/components/selectFilter.vue'
import SearchIcon from '~/assets/images/search.svg?inline'

export default {
  name: 'TxsPage',
  components: {
    TxList,
    advancedFilter,
    NewPagination,
    Pagination,
    SearchIcon,
    selectFilter,
  },
  data() {
    return {
      txs: undefined,
      loading: false,
      limit: 10,
      nextPageToken: undefined,
      prevPageToken: undefined,
      error: false,
      currentPage: 1,
      count: undefined,
      fetchRequestId: 0,
      latestThorBlock: undefined,
      searchValue: '',
      assetSelect: [],
      actionSelect: [],
      filtersList: [
        { label: 'All', filter: {} },
        {
          label: 'L1 Swaps',
          filter: { type: ['swap'], asset: ['native'] },
        },
        { label: 'Secure', filter: { type: ['secure'] } },
        { label: 'Trade Swaps', filter: { type: ['swap'], asset: ['trade'] } },
        {
          label: 'LP / Savers',
          filter: { type: ['addLiquidity', 'withdraw'] },
        },
        {
          label: 'RUNEPool',
          filter: { type: ['runePoolDeposit', 'runePoolWithdraw'] },
        },
        { label: 'Send', filter: { type: ['send'] } },
        { label: 'Refund', filter: { type: ['refund'] } },
        { label: 'Switch', filter: { type: ['switch'] } },
        { label: 'Contract', filter: { type: ['contract'] } },
        {
          label: 'TCY',
          filter: { type: ['tcy_claim', 'tcy_stake', 'tcy_unstake'] },
        },
        {
          label: 'Limit Swap',
          filter: { type: ['limit_swap'] },
        },
      ],
      assetOptions: [
        { label: 'All Assets', value: 'all' },
        { label: 'Native', value: 'native' },
        { label: 'Trade', value: 'trade' },
        { label: 'Synth', value: 'synth' },
      ],
      actionOptions: [
        { label: 'All Actions', value: 'all' },
        { label: 'Swap', value: 'swap' },
        { label: 'Secure', value: 'secure' },
        { label: 'LP / Savers', value: 'addLiquidity,withdraw' },
        { label: 'RUNEPool', value: 'runePoolDeposit,runePoolWithdraw' },
        { label: 'Send', value: 'send' },
        { label: 'Refund', value: 'refund' },
        { label: 'Switch', value: 'switch' },
        { label: 'Contract', value: 'contract' },
        { label: 'TCY', value: 'tcy_claim,tcy_stake,tcy_unstake' },
        { label: 'Limit Swap', value: 'limit_swap' },
      ],
    }
  },
  head: {
    title: 'THORChain Network Explorer | Transactions',
  },
  watch: {
    '$route.query': {
      handler(query) {
        this.syncToolbar(query)
        if (Object.keys(query || {}).length === 0) {
          this.loading = false
          return
        }
        this.fetchData(query)
      },
      immediate: true,
      deep: true,
    },
  },
  mounted() {
    if (Object.keys(this.$route.query).length === 0) {
      this.$router.replace({
        query: {
          asset: 'native',
          type: 'swap',
        },
      })
    }
    this.fetchLatestBlock()
  },
  methods: {
    async fetchContractLabels() {
      const cached = this.$store.getters.getContractLabels
      if (cached) {
        this.contractLabels = cached
        return
      }
      try {
        const { data } = await this.$api.getContractsLabel()
        const labels = Array.isArray(data) ? data : []
        const remoteLabels = labels.reduce((acc, entry) => {
          const address = entry?.address?.toLowerCase?.()
          const label = entry?.label
          if (address && label) {
            acc[address] = label
          }
          return acc
        }, {})
        this.contractLabels = {
          ...getRujiraContractLabelMap(),
          ...remoteLabels,
        }
      } catch (error) {
        this.contractLabels = getRujiraContractLabelMap()
      }
      this.$store.commit('setContractLabels', this.contractLabels)
    },
    syncToolbar(query) {
      const matchedAsset = this.assetOptions.find(
        (o) => o.value === query.asset && o.value !== 'all'
      )
      this.assetSelect = matchedAsset ? [matchedAsset.label] : []

      const matchedAction = this.actionOptions.find(
        (o) => o.value === query.type && o.value !== 'all'
      )
      this.actionSelect = matchedAction ? [matchedAction.label] : []

      const addressSearch = query.address || query.affiliate || ''
      const freeAssetSearch =
        query.asset &&
        !this.assetOptions.some((option) => option.value === query.asset)
          ? query.asset
          : ''

      this.searchValue = addressSearch || freeAssetSearch
    },
    fetchLatestBlock() {
      this.$api
        .getLastBlockHeight()
        .then((res) => {
          const rows = Array.isArray(res.data) ? res.data : []
          this.latestThorBlock =
            rows.find((entry) => entry?.thorchain)?.thorchain ||
            rows[0]?.thorchain ||
            undefined
        })
        .catch((error) => {
          console.error(error)
        })
    },
    checkQuery(queries) {
      return pick(queries, [
        'address',
        'asset',
        'height',
        'fromHeight',
        'affiliate',
        'txType',
        'type',
        'fromTimestamp',
        'timestamp',
        'nextPageToken',
        'prevPageToken',
      ])
    },
    goNext() {
      if (!this.nextPageToken) return
      this.$router.push({
        query: {
          ...this.$route.query,
          nextPageToken: this.nextPageToken,
          prevPageToken: undefined,
        },
      })
    },
    goPrev() {
      if (!this.prevPageToken) return
      this.$router.push({
        query: {
          ...this.$route.query,
          prevPageToken: this.prevPageToken,
          nextPageToken: undefined,
        },
      })
    },
    onPageChange(newPage) {
      this.currentPage = newPage
      this.$router.push({
        path: this.$route.path,
        query: { ...this.$route.query, page: newPage },
      })
    },
    fetchData(params) {
      const requestId = ++this.fetchRequestId
      this.loading = true

      const cleanParams = this.checkQuery(params)

      let offset
      if (this.$route.query.page) {
        this.currentPage = +this.$route.query.page
        offset = (+this.$route.query.page - 1) * this.limit
      }

      this.$api
        .getActionsNoCancel({ limit: this.limit, ...cleanParams, offset })
        .then((res) => {
          if (requestId !== this.fetchRequestId) {
            return
          }
          this.txs = res.data
          this.nextPageToken = res.data.meta.nextPageToken
          this.prevPageToken = res.data.meta.prevPageToken
          this.count = res.data.count
          this.error = false
          this.loading = false
        })
        .catch((error) => {
          if (requestId !== this.fetchRequestId) {
            return
          }

          this.error = true
          this.loading = false
          console.error(error)
        })
    },
    applySearch() {
      const value = this.searchValue.trim()
      const query = {
        ...this.$route.query,
        nextPageToken: undefined,
        prevPageToken: undefined,
        page: 1,
      }

      delete query.address
      delete query.affiliate

      const assetValue = this.assetSelect
        .map((label) => this.assetOptions.find((o) => o.label === label)?.value)
        .filter((v) => v && v !== 'all')[0]
      if (assetValue) {
        query.asset = assetValue
      } else {
        delete query.asset
      }

      if (!value) {
        this.$router.push({ query })
        return
      }

      if (
        value.startsWith('thor') ||
        value.startsWith('0x') ||
        value.startsWith('bc1') ||
        value.startsWith('ltc1')
      ) {
        query.address = value
      } else if (
        value.includes('.') ||
        value.includes('-') ||
        value.includes('/')
      ) {
        query.asset = value
      } else {
        query.affiliate = value
      }

      this.$router.push({ query })
    },
    applyToolbarFilters() {
      const query = {
        ...this.$route.query,
        nextPageToken: undefined,
        prevPageToken: undefined,
        page: 1,
      }

      const assetVal = this.assetSelect
        .map((label) => this.assetOptions.find((o) => o.label === label)?.value)
        .filter((v) => v && v !== 'all')[0]
      if (assetVal) {
        query.asset = assetVal
      } else {
        delete query.asset
      }

      const actionVal = this.actionSelect
        .map(
          (label) => this.actionOptions.find((o) => o.label === label)?.value
        )
        .filter((v) => v && v !== 'all')[0]
      if (actionVal) {
        query.type = actionVal
      } else {
        delete query.type
      }

      this.$router.push({ query })
    },
    isActive(filter) {
      if (filter.label === 'All') {
        return Object.keys(this.$route.query).length === 0
      }

      const filterType = filter.filter.type
        ? filter.filter.type.join(',')
        : null
      const filterAsset = filter.filter.asset
        ? filter.filter.asset.join(',')
        : null

      const currentType = this.$route.query.type || null
      const currentAsset = this.$route.query.asset || null

      return filterType === currentType && filterAsset === currentAsset
    },
    applyFilter(filter) {
      if (filter.label === 'All') {
        this.$router.push({ query: {} })
        return
      }

      const query = {}

      if (filter.filter.type) {
        query.type = filter.filter.type.join(',')
      }

      if (filter.filter.asset) {
        query.asset = filter.filter.asset.join(',')
      }

      this.$router.push({ query })
    },
  },
}
</script>

<style lang="scss" scoped>
.txs-explorer {
  display: flex;
  flex-direction: column;
  gap: $space-18;
}

.hero-row {
  display: flex;
  flex-direction: column;
  gap: $space-18;
  margin: 0 $space-10;

  @include md {
    margin: 0;
  }

  @include lg {
    align-items: flex-start;
    flex-direction: row;
    justify-content: space-between;
  }
}

.hero-copy {
  h1 {
    color: var(--sec-font-color);
    font-size: 2.4rem;
    font-weight: 700;
    margin: 0 0 $space-6;
  }

  p {
    color: var(--font-color);
    font-size: 1.05rem;
    margin: 0;
    max-width: 46rem;
  }
}

.hero-side {
  display: flex;
  flex-direction: column;
  gap: $space-10;
  width: 100%;

  @include lg {
    align-items: flex-end;
    width: auto;
  }
}

.latest-block-card {
  background: color-mix(in srgb, var(--card-bg-color) 92%, transparent);
  border: 1px solid var(--border-color);
  border-radius: $radius-lg;
  min-width: 14rem;
  padding: $space-18 $space-20;
  text-align: right;
}

.stat-label {
  color: var(--font-color);
  font-size: $font-size-xxs;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stat-live {
  align-items: center;
  display: inline-flex;
  gap: $space-10;
  justify-content: flex-end;
  margin-top: $space-6;
}

.stat-live-dot {
  background: #35f09a;
  border-radius: 999px;
  box-shadow: 0 0 0 4px color-mix(in srgb, #35f09a 14%, transparent);
  display: inline-block;
  flex: 0 0 auto;
  height: 0.5rem;
  width: 0.5rem;
}

.stat-value {
  color: var(--sec-font-color);
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.1;
}

.count-inline {
  color: var(--font-color);
  font-size: $font-size-sm;
}

.toolbar-card {
  background: color-mix(in srgb, var(--card-bg-color) 94%, transparent);
  border: 1px solid var(--border-color);
  border-radius: $radius-xl;
  margin: 0 $space-10;
  padding: $space-18 $space-20;

  @include md {
    margin: 0;
  }
}

.toolbar-row {
  display: flex;
  flex-direction: column;
  gap: $space-10;

  @include lg {
    align-items: stretch;
    flex-direction: row;
    justify-content: space-between;
  }
}

.search-shell {
  align-items: center;
  background: var(--bgl-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-lg;
  display: flex;
  flex: 1 1 auto;
  gap: $space-8;
  min-height: 4rem;
  padding: 0 $space-12;
  width: 100%;

  input {
    background: transparent;
    border: none;
    color: var(--sec-font-color);
    flex: 1 1 auto;
    outline: none;
    width: 100%;

    &::placeholder {
      color: var(--font-color);
    }
  }
}

.toolbar-controls {
  display: flex;
  flex-wrap: wrap;
  gap: $space-8;

  @include lg {
    align-items: stretch;
    flex: 0 0 auto;
    flex-wrap: nowrap;
  }
}

.toolbar-controls > * {
  flex: 0 0 auto;
}

.toolbar-icon {
  fill: var(--font-color);
  color: var(--font-color);
  height: 20px;
  width: 20px;
}

.preset-rail {
  display: flex;
  gap: $space-10;
  margin-top: $space-16;
  overflow-x: auto;
}

.preset-pill {
  background: transparent;
  border: 1px solid transparent;
  border-radius: $radius-md;
  color: var(--font-color);
  cursor: pointer;
  flex: 0 0 auto;
  font-size: $font-size-sm;
  padding: $space-12 $space-14;
  transition: 0.2s ease;

  &:hover {
    background: color-mix(in srgb, var(--highlight) 8%, transparent);
    color: var(--green);
  }

  &.active {
    background: color-mix(in srgb, var(--green) 12%, transparent);
    border-color: color-mix(in srgb, var(--green) 60%, transparent);
    color: var(--green);
  }
}

.error-container {
  background: color-mix(in srgb, var(--red) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--red) 45%, transparent);
  border-radius: $radius-lg;
  color: #ff8d8d;
  padding: $space-16;
}
</style>
