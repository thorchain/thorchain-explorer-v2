<template>
  <Page>
    <div class="transactions-container">
      <!-- transactions component -->
      <div class="top-bar">
        <div class="action-types">
          <div
            :class="['action-type', { active: isAll }]"
            @click="resetFilters"
          >
            All
          </div>
          <div
            :class="['action-type', { active: isLayerOne }]"
            @click="
              applyFilters({
                type: ['swap'],
                asset: ['nosynth', 'notrade', 'norune'],
              })
            "
          >
            L1 Swaps
          </div>
          <div
            :class="['action-type', { active: isTrade }]"
            @click="applyFilters({ type: ['swap'], asset: ['trade'] })"
          >
            Trade Swaps
          </div>
          <div
            :class="['action-type', { active: isSynth }]"
            @click="applyFilters({ type: ['swap'], asset: ['synth'] })"
          >
            Synth Swaps
          </div>
          <div
            :class="['action-type', { active: isLP }]"
            @click="applyFilters({ type: ['addLiquidity', 'withdraw'] })"
          >
            LP / Savers
          </div>
          <div
            :class="['action-type', { active: isRunePool }]"
            @click="
              applyFilters({ type: ['runePoolDeposit', 'runePoolWithdraw'] })
            "
          >
            RUNEPool
          </div>
          <div
            :class="['action-type', { active: isSend }]"
            @click="applyFilters({ type: ['send'] })"
          >
            Send
          </div>
          <div
            :class="['action-type', { active: isRefund }]"
            @click="applyFilters({ type: ['refund'] })"
          >
            Refund
          </div>
        </div>

        <advanced-filter
          ref="advancedFilter"
          @applyFilters="applyFilters"
          @clearfilter="clearFilters"
        />
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

export default {
  name: 'TxsPage',
  components: { Transactions, advancedFilter },
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
    let params = {}

    if (this.$route.query && Object.keys(this.$route.query).length > 0) {
      const query = this.checkQuery(this.$route.query)
      this.$router.replace({ path: '/txs', query })
      this.filters = query
      params = query
      this.$refs.advancedFilter.queryToFilter(query)
      this.hasFilters = true
    } else {
      this.applyFilters({
        asset: ['notrade'],
        type: ['swap','send']
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
      this.getActions({ limit: this.limit, nextPageToken: this.nextPageToken })
    },
    goPrev() {
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
  },
}
</script>

<style lang="scss" scoped>
.top-bar {
  display: flex;
  justify-content: space-between;

  .action-types {
    display: flex;
    flex-wrap: wrap;
    margin: 0.5rem;
    gap: 5px;
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
