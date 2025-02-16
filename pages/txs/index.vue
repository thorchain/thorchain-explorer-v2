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

        <advanced-filter
          ref="advancedFilter"
          @applyFilters="applyFilters"
          @clearfilter="clearFilters"
        />
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
      <pagination
        :loading="loading"
        :meta="txs && txs.actions"
        @nextPage="goNext"
        @prevPage="goPrev"
      />
    </div>
  </Page>
</template>

<script>
import { isEqual, pick } from 'lodash'
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
      filters: {},
      hasFilters: false,
      error: false,
      showFilters: false,
      filtersList: [
        { label: 'All', filter: {} },
        {
          label: 'L1 Swaps',
          filter: { type: ['swap'], asset: ['nosynth', 'notrade', 'norune'] },
        },
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
      ],
    }
  },
  head: {
    title: 'THORChain Network Explorer | Transaction',
  },
  computed: {
    isLayerOne() {
      if (this.filters && this.filters.asset) {
        return (
          isEqual(this.filters.asset, 'nosynth,notrade,norune') &&
          isEqual(this.filters.type, 'swap')
        )
      }

      return false
    },
    isTrade() {
      if (this.filters && this.filters.asset) {
        return (
          isEqual(this.filters.asset, 'trade') &&
          isEqual(this.filters.type, 'swap')
        )
      }

      return false
    },
    isSynth() {
      if (this.filters && this.filters.asset) {
        return (
          isEqual(this.filters.asset, 'synth') &&
          isEqual(this.filters.type, 'swap')
        )
      }

      return false
    },
    isLP() {
      if (this.filters && this.filters.type) {
        return isEqual(this.filters.type, 'addLiquidity,withdraw')
      }

      return false
    },
    isSend() {
      if (this.filters && this.filters.type) {
        return isEqual(this.filters.type, 'send')
      }

      return false
    },
    isRefund() {
      if (this.filters && this.filters.type) {
        return isEqual(this.filters.type, 'refund')
      }

      return false
    },
    isAll() {
      if (Object.keys(this.filters).length === 0) {
        return true
      }

      return false
    },
    isRunePool() {
      if (this.filters && this.filters.type) {
        return isEqual(this.filters.type, 'runePoolDeposit,runePoolWithdraw')
      }

      return false
    },
  },
  mounted() {
    let params = { ...this.$route.query }
    if (!params.nextPageToken && this.nextPageToken) {
      params.nextPageToken = this.nextPageToken
    }
    if (!params.prevPageToken && this.prevPageToken) {
      params.prevPageToken = this.prevPageToken
    }

    if (Object.keys(params).length > 0) {
      const query = this.checkQuery(params)
      this.filters = query
      this.$refs.advancedFilter.queryToFilter(query)
      this.hasFilters = true
    } else {
      this.applyFilters({
        asset: ['notrade'],
        type: ['swap', 'send'],
      })
    }

    this.getActions({ limit: this.limit, ...params })
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
      ])
    },
    goNext() {
      if (!this.nextPageToken) return
      this.$router.push({
        path: '/txs',
        query: {
          ...this.$route.query,
          nextPageToken: this.nextPageToken,
          prevPageToken: undefined,
        },
      })
      this.getActions({ limit: this.limit, nextPageToken: this.nextPageToken })
    },
    goPrev() {
      if (!this.prevPageToken) return
      this.$router.push({
        path: '/txs',
        query: {
          ...this.$route.query,
          prevPageToken: this.prevPageToken,
          nextPageToken: undefined,
        },
      })
      this.getActions({ limit: this.limit, prevPageToken: this.prevPageToken })
    },
    applyFilters(params) {
      const query = {
        ...(params.asset &&
          params.asset.length > 0 && { asset: params.asset.join(',') }),
        ...(params.toHeight && { height: params.toHeight }),
        ...(params.fromHeight && { fromHeight: params.fromHeight }),
        ...(params.affiliate &&
          params.affiliate.length > 0 && {
            affiliate: params.affiliate.join(','),
          }),
        ...(params.addresses &&
          params.addresses.length > 0 && {
            address: params.addresses.join(','),
          }),
        ...(params.txType &&
          params.txType.length > 0 && { txType: params.txType.join(',') }),
        ...(params.type &&
          params.type.length > 0 && { type: params.type.join(',') }),
        ...(params.dateValue &&
          params.dateValue[0] != null &&
          params.dateValue[0] !== '' && {
            fromTimestamp: params.dateValue[0] / 1e3,
          }),
        ...(params.dateValue &&
          params.dateValue[1] != null &&
          params.dateValue[1] !== '' && {
            timestamp: params.dateValue[1] / 1e3,
          }),
      }

      this.filters = query
      this.$router.replace({ path: '/txs', query })
      this.$refs.advancedFilter.resetFilter(params)
      this.hasFilters = true
      this.getActions({ limit: this.limit })
    },
    clearFilters() {
      this.filters = {}
      this.hasFilters = false
      this.$router.replace({ path: '/txs' })
      this.getActions({ limit: this.limit })
    },
    getActions(params) {
      this.loading = true
      if (this.hasFilters) {
        params = {
          ...params,
          ...this.filters,
        }
      }
      this.$api
        .getActions(params)
        .then((res) => {
          this.txs = res.data
          this.nextPageToken = res.data.meta.nextPageToken
          this.prevPageToken = res.data.meta.prevPageToken
          this.error = false
        })
        .catch((error) => {
          this.error = true
          console.error(error)
        })
        .finally(() => {
          this.loading = false
        })
    },
    resetFilters() {
      this.$refs.advancedFilter.resetFilter({})
      this.clearFilters()
    },
    toggleModal() {
      this.showFilters = !this.showFilters
    },
    isActive(filter) {
      if (filter.label === 'All') {
        return Object.keys(this.filters).length === 0
      }

      const filterType = filter.filter.type
        ? filter.filter.type.join(',')
        : null
      const filterAsset = filter.filter.asset
        ? filter.filter.asset.join(',')
        : null

      const currentType = this.filters.type || null
      const currentAsset = this.filters.asset || null

      return filterType === currentType && filterAsset === currentAsset
    },
    applyFilter(filter) {
      if (filter.label === 'All') {
        this.resetFilters()
      } else {
        this.applyFilters(filter.filter)
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
  padding: 10px 8px;
  font-size: 0.875rem;
  background-color: var(--card-bg-color);
  color: var(--font-color);
  border: 1px solid var(--border-color);
  border-radius: 0.3rem;
  cursor: pointer;
  width: auto;
  margin: 0.5rem;
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
  margin: 0.5rem;
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
    padding: 10px 8px;
    border-radius: 0.25rem;
    background-color: var(--card-bg-color);
    color: var(--font-color);
    border: 1px solid var(--border-color);
    font-size: 0.75rem;
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
  border-radius: 0.5rem;
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
    padding: 18px;
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
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: 18px;
  margin: 0;
  color: var(--sec-font-color);
}
.top-bar {
  display: flex;
  justify-content: space-between;

  .action-types {
    flex-wrap: wrap;
    margin: 0.5rem;
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
    padding: 10px 8px;
    border-radius: 0.25rem;
    background-color: var(--card-bg-color);
    color: var(--font-color);
    border: none;
    font-size: 0.75rem;
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
      margin: 0 0.2rem;
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
