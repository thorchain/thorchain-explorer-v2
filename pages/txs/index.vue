<template>
  <Page>
    <div class="transactions-container">
      <div class="top-bar">
        <button class="mobile-filter-btn" @click="showFilters = true">
          Quick Filters
        </button>
        <div class="action-types desktop-filters">
          <div
            v-for="(filter, index) in filtersList"
            :key="index"
            :class="['action-type', { active: isActive(filter) }]"
            @click="applyFilter(filter)"
          >
            {{ filter.label }}
          </div>
        </div>

        <advanced-filter ref="advancedFilter" />
      </div>
      <div v-if="showFilters" class="mobile-filter-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Quick Filters</h3>
            <CrossIcon class="close-btn" @click="toggleModal" />
          </div>
          <div class="action-types">
            <div
              v-for="(filter, index) in filtersList"
              :key="index"
              :class="['action-type', { active: isActive(filter) }]"
              @click="applyFilter(filter)"
            >
              {{ filter.label }}
            </div>
          </div>
        </div>
      </div>
      <div>
        <div v-if="error" class="error-container">
          Can't Fetch the actions! Please Try again Later.
        </div>
        <transactions v-else :txs="txs" :loading="loading" />
      </div>
      <NewPagination
        v-if="txs && txs.actions && count > -1"
        :total-rows="count"
        :per-page="30"
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
import Transactions from '~/components/Transactions.vue'
import CrossIcon from '~/assets/images/cross.svg?inline'

export default {
  name: 'TxsPage',
  components: { Transactions, advancedFilter, CrossIcon },
  data() {
    return {
      txs: undefined,
      loading: false,
      limit: 30,
      nextPageToken: undefined,
      prevPageToken: undefined,
      error: false,
      showFilters: false,
      currentPage: 1,
      count: undefined,
      filtersList: [
        { label: 'All', filter: {} },
        {
          label: 'L1 Swaps',
          filter: { type: ['swap'], asset: ['l1', 'notrade', 'nosynth'] },
        },
        { label: 'Secure', filter: { type: ['secure'] } },
        { label: 'Trade Swaps', filter: { type: ['swap'], asset: ['trade'] } },
        { label: 'Synth Swaps', filter: { type: ['swap'], asset: ['synth'] } },
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
      ],
    }
  },
  head: {
    title: 'THORChain Network Explorer | Transaction',
  },
  computed: {
    isLayerOne() {
      return (
        this.$route.query.asset === 'nosynth,notrade,norune' &&
        this.$route.query.type === 'swap'
      )
    },
    isTrade() {
      return (
        this.$route.query.asset === 'trade' && this.$route.query.type === 'swap'
      )
    },
    isSynth() {
      return (
        this.$route.query.asset === 'synth' && this.$route.query.type === 'swap'
      )
    },
    isLP() {
      return this.$route.query.type === 'addLiquidity,withdraw'
    },
    isSend() {
      return this.$route.query.type === 'send'
    },
    isRefund() {
      return this.$route.query.type === 'refund'
    },
    isAll() {
      return Object.keys(this.$route.query).length === 0
    },
    isRunePool() {
      return this.$route.query.type === 'runePoolDeposit,runePoolWithdraw'
    },
    isContract() {
      return this.$route.query.type === 'contract'
    },
  },
  watch: {
    '$route.query': {
      handler(query) {
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
          asset: 'l1,notrade,nosynth',
          type: 'swap',
        },
      })
    }
  },
  methods: {
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
    onPageChange(newPage) {
      this.currentPage = newPage
      this.$router.push({
        path: this.$route.path,
        query: { ...this.$route.query, page: newPage },
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
    fetchData(params) {
      this.loading = true

      const cleanParams = this.checkQuery(params)

      let offset
      if (this.$route.query.page) {
        this.currentPage = this.$route.query.page
        offset = (this.$route.query.page - 1) * this.limit
      }

      this.$api
        .getActions({ limit: this.limit, ...cleanParams, offset })
        .then((res) => {
          this.txs = res.data
          this.nextPageToken = res.data.meta.nextPageToken
          this.prevPageToken = res.data.meta.prevPageToken
          this.count = res.data.count
          this.error = false
          this.loading = false
        })
        .catch((error) => {
          if (error.message === 'cancel') {
            this.loading = true
            return
          }
          this.error = true
          console.error(error)
        })
    },
    toggleModal() {
      this.showFilters = !this.showFilters
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
      } else {
        const query = {}

        if (filter.filter.type) {
          query.type = filter.filter.type.join(',')
        }

        if (filter.filter.asset) {
          query.asset = filter.filter.asset.join(',')
        }

        this.$router.push({ query })
      }
      this.showFilters = false
    },
  },
}
</script>

<style lang="scss" scoped>
.mobile-filter-btn {
  display: flex;
  align-items: center;
  padding: $space-10 $space-8;
  font-size: $font-size-sm;
  background-color: var(--card-bg-color);
  color: var(--font-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-s;
  cursor: pointer;
  width: auto;
  margin: $space-8;
  white-space: nowrap;
  font-weight: 450;
  transition:
    background-color 0.3s ease,
    transform 0.3s ease;

  &:hover {
    background-color: var(--active-bg-color);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    transform: translateY(-2px);
    color: var(--sec-font-color);
  }
}
.desktop-filters {
  display: none;
  flex-wrap: wrap;
  margin: $space-8;
  gap: 5px;
}

@include md {
  .desktop-filters {
    display: flex;
  }
  .mobile-filter-btn {
    display: none;
  }
}

.mobile-filter-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;

  .action-types {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    gap: 8px;
  }

  .action-type {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: $space-10 $space-8;
    border-radius: $radius-sm;
    background-color: var(--card-bg-color);
    color: var(--font-color);
    border: 1px solid var(--border-color);
    font-size: $font-size-xs;
    font-weight: 500;
    transition:
      background-color 0.3s ease,
      transform 0.2s ease;

    &.active {
      color: var(--primary-color);
      border-color: var(--primary-color);
    }

    &:hover {
      background-color: var(--active-bg-color);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      color: var(--sec-font-color);
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
    }
  }
}
.modal-content {
  background: var(--card-bg-color);
  border-radius: $radius-lg;
  text-align: left;
  color: var(--sec-font-color);
  width: 500px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.6);

  > div {
    padding: $space-18;
  }
}

.close-btn {
  cursor: pointer;
  width: 1.5rem;
  height: 2rem;
  color: var(--sec-font-color);

  &:hover {
    color: var(--primary-color);
  }
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: $space-10;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: $font-size-md;
  margin: $space-0;
  color: var(--sec-font-color);
}
.top-bar {
  display: flex;
  justify-content: space-between;

  .action-types {
    flex-wrap: wrap;
    margin: $space-8;
    gap: 5px;
    display: none;
    @include md {
      display: flex;
    }
  }

  .action-type {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: $space-10 $space-8;
    border-radius: $radius-sm;
    background-color: var(--card-bg-color);
    color: var(--font-color);
    border: none;
    font-size: $font-size-xs;
    font-weight: 500;
    border: 1px solid var(--border-color);

    transition:
      background-color 0.3s ease,
      transform 0.2s ease;

    &.active {
      color: var(--primary-color);
    }

    svg {
      fill: var(--font-color);
      width: 0.75rem;
      height: 0.75rem;
      margin: $space-0 $space-3;
    }

    &:hover {
      background-color: var(--active-bg-color);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      color: var(--sec-font-color);
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
    }
  }
}
</style>
