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
              placeholder="Search Asset / Address / Product / Action..."
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

      <section v-else class="tx-list-card">
        <div class="list-header">
          <div>Product</div>
          <div>Action</div>
          <div>From</div>
          <div>To</div>
          <div>User</div>
          <div>Time</div>
          <div>Status</div>
          <div></div>
        </div>

        <div v-if="loading" class="list-body">
          <div
            v-for="n in 10"
            :key="`skeleton-${n}`"
            class="tx-row skeleton-row"
          >
            <div v-for="m in 8" :key="`skeleton-cell-${n}-${m}`" class="skel" />
          </div>
        </div>

        <div v-else-if="displayRows.length" class="list-body">
          <div
            v-for="row in displayRows"
            :key="`${row.hash}-${row.timeAgo}`"
            class="tx-row"
          >
            <div class="cell product-cell">
              <span :class="['product-dot', `tone-${row.product.tone}`]" />
              <span>{{ row.product.label }}</span>
            </div>

            <div class="cell action-cell">
              <div class="action-primary">{{ row.actionLabel }}</div>
              <div v-if="row.actionSecondary" class="action-secondary">
                {{ row.actionSecondary }}
              </div>
            </div>

            <div class="cell endpoint-cell">
              <div
                :class="[
                  'endpoint-stack',
                  { 'has-asset-icon': row.from.asset },
                ]"
              >
                <AssetIcon
                  v-if="row.from.asset"
                  :asset="row.from.asset"
                  class="endpoint-icon"
                />
                <div class="endpoint-copy">
                  <div class="endpoint-primary">
                    <template v-if="row.from.link">
                      <nuxt-link :to="row.from.link" class="text-link">
                        {{ row.from.primary }}
                      </nuxt-link>
                    </template>
                    <template v-else>
                      {{ row.from.primary }}
                    </template>

                    <span v-if="row.from.badge" class="endpoint-badge">
                      ({{ row.from.badge }})
                    </span>
                  </div>
                  <div v-if="row.from.secondary" class="endpoint-secondary">
                    {{ row.from.secondary }}
                  </div>
                </div>
              </div>
            </div>

            <div class="cell endpoint-cell">
              <div
                :class="['endpoint-stack', { 'has-asset-icon': row.to.asset }]"
              >
                <AssetIcon
                  v-if="row.to.asset"
                  :asset="row.to.asset"
                  class="endpoint-icon"
                />
                <div class="endpoint-copy">
                  <div class="endpoint-primary">
                    <template v-if="row.to.link">
                      <nuxt-link :to="row.to.link" class="text-link">
                        {{ row.to.primary }}
                      </nuxt-link>
                    </template>
                    <template v-else>
                      {{ row.to.primary }}
                    </template>

                    <span v-if="row.to.badge" class="endpoint-badge">
                      ({{ row.to.badge }})
                    </span>
                  </div>
                  <div v-if="row.to.secondary" class="endpoint-secondary">
                    {{ row.to.secondary }}
                  </div>
                </div>
              </div>
            </div>

            <div class="cell user-cell">
              <nuxt-link
                v-if="row.user.link"
                :to="row.user.link"
                class="text-link mono"
              >
                {{ row.user.label }}
              </nuxt-link>
              <span v-else class="mono">{{ row.user.label }}</span>
            </div>

            <div class="cell time-cell" :title="row.timeTitle">
              {{ row.timeAgo }}
            </div>

            <div class="cell status-cell">
              <span :class="['status-pill', `tone-${row.status.tone}`]">
                <span class="status-dot" />
                {{ row.status.label }}
              </span>
            </div>

            <div class="cell open-cell">
              <nuxt-link
                :to="row.link"
                class="open-btn"
                :title="`View ${row.hash}`"
              >
                <span>View</span>
                <ArrowSmallRight class="open-btn__icon" />
              </nuxt-link>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          No transactions found for this view.
        </div>
      </section>

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
import moment from 'moment'
import advancedFilter from './components/advancedFilter.vue'
import { assetFromString } from '~/utils'
import addressMap from '~/utils/address'
import {
  getRujiraContractEntry,
  getRujiraContractLabel,
  getRujiraContractLabelMap,
  getRujiraContractProduct,
} from '~/utils/rujiraContracts'
import NewPagination from '~/components/NewPagination.vue'
import Pagination from '~/components/Pagination.vue'
import AssetIcon from '~/components/AssetIcon.vue'
import selectFilter from '~/components/selectFilter.vue'
import SearchIcon from '~/assets/images/search.svg?inline'
import ArrowSmallRight from '~/assets/images/arrow-small-right.svg?inline'

export default {
  name: 'TxsPage',
  components: {
    AssetIcon,
    advancedFilter,
    NewPagination,
    Pagination,
    SearchIcon,
    ArrowSmallRight,
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
      contractLabels: {},
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
  computed: {
    displayRows() {
      return this.buildRows(this.txs?.actions || [])
    },
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
    this.fetchContractLabels()
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
    buildRows(actions) {
      return actions.map((action) => this.buildRow(action))
    },
    buildRow(action) {
      const hash = this.getHash(action)
      const type = this.normalizeType(action)
      const fromAddress = this.getFirstAddress(action.in)
      const primaryOutEntry = this.getPrimaryOutEntry(action)
      const toAddress = primaryOutEntry?.address || ''
      const inputEntry = action.in?.find((entry) => entry.coins?.length) || null
      const inputCoin =
        inputEntry?.coins?.[0] ||
        (type === 'contract'
          ? this.getPrimaryContractEventCoin(
              action,
              'input',
              fromAddress,
              toAddress
            )
          : null)
      const outputCoin =
        this.getPrimaryOutCoin(action) ||
        (type === 'contract'
          ? this.getPrimaryContractEventCoin(
              action,
              'output',
              fromAddress,
              toAddress
            )
          : null)

      return {
        hash,
        link: `/tx/${hash}`,
        product: this.getProductMeta(action, toAddress),
        actionLabel: this.typeName(type, action),
        actionSecondary: this.getActionSecondary(action),
        from: this.getFromDisplay(action, fromAddress, inputEntry, inputCoin),
        to: this.getToDisplay(action, toAddress, outputCoin),
        user: {
          label: this.getAddressLabel(fromAddress),
          link: fromAddress ? `/address/${fromAddress}` : undefined,
        },
        timeAgo: this.since(action.date),
        timeTitle: this.fullTime(action.date),
        status: this.getStatusMeta(action),
      }
    },
    getHash(action) {
      return (
        action.in?.find((entry) => entry.txID)?.txID ||
        action.out?.find((entry) => entry.txID)?.txID ||
        ''
      )
    },
    getFirstAddress(list = []) {
      return list.find((entry) => entry.address)?.address || ''
    },
    getPrimaryOutEntry(action) {
      const nonAffiliateOuts = (action.out || []).filter(
        (entry) => !entry.affiliate
      )
      return (
        nonAffiliateOuts.find(
          (entry) => entry.coins?.length && entry.address
        ) ||
        nonAffiliateOuts.find((entry) => entry.address) ||
        null
      )
    },
    normalizeType(action) {
      if (action.type === 'swap') {
        const txType = action.metadata?.swap?.txType
        if (txType === 'add') return 'addLiquidity'
        if (txType === 'withdraw') return 'withdraw'
      }

      return action.type
    },
    typeName(type, row) {
      if (type === 'contract') {
        return this.getContractActionLabel(row)
      }
      switch (type) {
        case 'addLiquidity':
          return row.pools?.some((pool) => pool?.includes('/'))
            ? 'Savers Deposit'
            : 'Add Liquidity'
        case 'withdraw':
          return row.pools?.some((pool) => pool?.includes('/'))
            ? 'Savers Withdraw'
            : 'Withdraw Liquidity'
        case 'runePoolDeposit':
          return 'RUNEPool Deposit'
        case 'runePoolWithdraw':
          return 'RUNEPool Withdraw'
        case 'tcy_claim':
          return 'TCY Claim'
        case 'tcy_stake':
          return 'TCY Stake'
        case 'tcy_unstake':
          return 'TCY Unstake'
        case 'limit_swap':
          return 'Limit Swap'
        default:
          return this.$options.filters.capitalize(type)
      }
    },
    getContractActionLabel(action) {
      const rawAction =
        action?.metadata?.contract?.attributes?.action ||
        action?.metadata?.contract?.attributes?.msg ||
        ''

      const product = this.getResolvedContractProduct(
        this.getFirstAddress(action.out),
        this.getFirstAddress(action.in),
        action
      )

      const normalized = `${rawAction}`.trim().toLowerCase()
      if (!normalized) {
        if (/ruji trade/i.test(product)) return 'Trade'
        if (/ruji pools/i.test(product)) return 'Pool Action'
        if (/ruji borrow|ruji lending/i.test(product)) return 'Borrow Action'
        if (/ruji perps/i.test(product)) return 'Perps Action'
        if (/ruji index/i.test(product)) return 'Index Action'
        return 'Contract'
      }

      if (/strategy[._-]?execute/.test(normalized)) return 'Strategy Execute'
      if (/limit/.test(normalized) && /open|create|place/.test(normalized)) {
        return 'Open Limit Order'
      }
      if (/limit/.test(normalized) && /cancel|close/.test(normalized)) {
        return 'Cancel Limit Order'
      }
      if (
        /add.*liquidity|deposit.*liquidity|provide.*liquidity/.test(normalized)
      ) {
        return 'Add Liquidity'
      }
      if (/remove.*liquidity|withdraw.*liquidity/.test(normalized)) {
        return 'Withdraw Liquidity'
      }
      if (/collateral.*deposit|deposit.*collateral/.test(normalized)) {
        return 'Collateral Deposit'
      }
      if (/collateral.*withdraw|withdraw.*collateral/.test(normalized)) {
        return 'Collateral Withdraw'
      }
      if (/borrow/.test(normalized)) return 'Borrow'
      if (/repay/.test(normalized)) return 'Repay'
      if (/stake/.test(normalized) && /un/.test(normalized)) return 'Unstake'
      if (/stake/.test(normalized)) return 'Stake'
      if (/claim/.test(normalized)) return 'Claim'
      if (
        /swap|trade|execute/.test(normalized) &&
        /ruji trade/i.test(product)
      ) {
        return 'Swap'
      }

      return this.$options.filters.capitalize(
        normalized
          .replace(/[:/]/g, ' ')
          .replace(/[_\.]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      )
    },
    getActionSecondary(action) {
      if (action.type === 'contract') {
        const contractAction = action.metadata?.contract?.attributes?.action
        if (contractAction) {
          return this.$options.filters.capitalize(
            contractAction.replace(/[_\.]/g, ' ')
          )
        }
      }

      if (action.type === 'refund') {
        return 'Returned to sender'
      }

      if (action.type === 'send') {
        return 'Asset transfer'
      }

      if (action.status === 'pending') {
        return 'Awaiting completion'
      }

      return ''
    },
    getProductMeta(action, toAddress) {
      const type = this.normalizeType(action)

      if (type === 'limit_swap') {
        return { label: 'RUJI Trade', tone: 'blue' }
      }

      if (type.startsWith('tcy_')) {
        return { label: 'TCY', tone: 'gold' }
      }

      if (type === 'contract') {
        const localProduct =
          this.getResolvedContractProduct(
            toAddress,
            this.getFirstAddress(action.in),
            action
          ) || ''
        if (localProduct) {
          return {
            label: localProduct,
            tone: /ruji|rujira/i.test(localProduct)
              ? 'blue'
              : /tcy/i.test(localProduct)
                ? 'gold'
                : 'purple',
          }
        }

        // Detect RUJI Money Market by ghost-vault denom in contract events
        const eventCoins = this.getContractEventCoins(action)
        if (
          eventCoins.some(
            (c) =>
              c?.asset?.toLowerCase?.().includes('ghost-vault') ||
              c?.asset?.toLowerCase?.().includes('ghost_vault')
          )
        ) {
          return { label: 'RUJI Money Market', tone: 'blue' }
        }

        const contractLabel = this.getResolvedContractLabel(
          toAddress,
          this.getFirstAddress(action.in),
          action
        )
        const productLabel =
          this.getProductLabelFromContractLabel(contractLabel)
        if (productLabel) {
          return {
            label: productLabel,
            tone: /ruji|rujira/i.test(productLabel) ? 'blue' : 'purple',
          }
        }
        return { label: 'Contract', tone: 'purple' }
      }

      if (type === 'secure') {
        return { label: 'THORChain', tone: 'green' }
      }

      return { label: 'THORChain', tone: 'green' }
    },
    getStatusMeta(action) {
      if (action.type === 'refund') {
        return { label: 'Refunded', tone: 'red' }
      }

      if (action.status === 'pending') {
        return { label: 'Pending', tone: 'blue' }
      }

      if (action.status === 'failed') {
        return { label: 'Failed', tone: 'red' }
      }

      return {
        label: this.$options.filters.capitalize(action.status || 'success'),
        tone: 'green',
      }
    },
    getFromDisplay(action, fromAddress, inputEntry, inputCoin) {
      const type = this.normalizeType(action)

      if (type === 'swap' || type === 'switch' || type === 'limit_swap') {
        return this.getAssetDisplay(
          inputCoin,
          this.getInUsd(action, inputEntry),
          fromAddress ? `/address/${fromAddress}` : undefined
        )
      }

      if (type === 'send' || type === 'refund' || type === 'contract') {
        if (type === 'contract' && inputCoin) {
          return this.getAssetDisplay(
            inputCoin,
            this.getInUsd(action, inputEntry),
            fromAddress ? `/address/${fromAddress}` : undefined
          )
        }
        return {
          primary: this.getAddressLabel(fromAddress),
          secondary:
            type === 'contract'
              ? this.getContractSecondary(action, inputCoin)
              : this.getCoinSummary(inputCoin),
          link: fromAddress ? `/address/${fromAddress}` : undefined,
        }
      }

      if (
        type === 'addLiquidity' ||
        type === 'runePoolDeposit' ||
        type === 'withdraw' ||
        type === 'runePoolWithdraw'
      ) {
        return {
          primary: this.getAddressLabel(fromAddress),
          secondary: this.getJoinedCoinSummary(action.in),
          link: fromAddress ? `/address/${fromAddress}` : undefined,
        }
      }

      return {
        primary: this.getAddressLabel(fromAddress),
        secondary: this.getCoinSummary(inputCoin),
        link: fromAddress ? `/address/${fromAddress}` : undefined,
      }
    },
    getToDisplay(action, toAddress, outputCoin) {
      const type = this.normalizeType(action)

      if (type === 'swap' || type === 'switch' || type === 'limit_swap') {
        if (!outputCoin) {
          return {
            primary: 'Pending outbound',
            secondary: 'Awaiting final settlement',
          }
        }

        return this.getAssetDisplay(
          outputCoin,
          this.getOutUsd(action, outputCoin),
          toAddress ? `/address/${toAddress}` : undefined
        )
      }

      if (type === 'send') {
        return {
          primary: this.getAddressLabel(toAddress),
          secondary: this.getCoinSummary(
            outputCoin || action.out?.[0]?.coins?.[0]
          ),
          link: toAddress ? `/address/${toAddress}` : undefined,
        }
      }

      if (type === 'refund') {
        return {
          primary: this.getAddressLabel(
            toAddress || this.getFirstAddress(action.in)
          ),
          secondary: 'Returned to sender',
          link:
            toAddress || this.getFirstAddress(action.in)
              ? `/address/${toAddress || this.getFirstAddress(action.in)}`
              : undefined,
        }
      }

      if (type === 'contract') {
        if (outputCoin) {
          // Ghost-vault share tokens: show product name + deposited/withdrawn amount
          if (
            outputCoin.asset?.toLowerCase?.().includes('ghost-vault') ||
            outputCoin.asset?.toLowerCase?.().includes('ghost_vault')
          ) {
            const eventCoins = this.getContractEventCoins(action)
            const meaningfulCoin = eventCoins.find(
              (c) =>
                !c?.asset?.toLowerCase?.().includes('ghost-vault') &&
                !c?.asset?.toLowerCase?.().includes('ghost_vault')
            )
            return {
              primary: 'RUJI Money Market',
              secondary: meaningfulCoin
                ? this.getCoinSummary(meaningfulCoin)
                : 'Vault position',
              link: toAddress ? `/address/${toAddress}` : undefined,
            }
          }
          return this.getAssetDisplay(
            outputCoin,
            this.getOutUsd(action, outputCoin),
            toAddress ? `/address/${toAddress}` : undefined
          )
        }
        return {
          primary: this.getContractTargetLabel(action, toAddress),
          secondary: outputCoin
            ? this.getCoinSummary(outputCoin)
            : this.getActionSecondary(action) || 'Contract call',
          link: toAddress ? `/address/${toAddress}` : undefined,
        }
      }

      if (type === 'addLiquidity' || type === 'runePoolDeposit') {
        return {
          primary: this.getPoolLabel(action),
          secondary: 'LP position added',
        }
      }

      if (type === 'withdraw' || type === 'runePoolWithdraw') {
        return {
          primary: this.getAddressLabel(
            toAddress || this.getFirstAddress(action.out)
          ),
          secondary: this.getJoinedCoinSummary(action.out),
          link:
            toAddress || this.getFirstAddress(action.out)
              ? `/address/${toAddress || this.getFirstAddress(action.out)}`
              : undefined,
        }
      }

      return {
        primary: this.getAddressLabel(toAddress),
        secondary: outputCoin ? this.getCoinSummary(outputCoin) : '',
        link: toAddress ? `/address/${toAddress}` : undefined,
      }
    },
    getContractTargetLabel(action, toAddress) {
      return (
        this.getResolvedContractLabel(toAddress, undefined, action) ||
        this.getAddressLabel(toAddress)
      )
    },
    getResolvedContractLabel(primaryAddress, fallbackAddress, action) {
      const primary = primaryAddress?.toLowerCase?.()
      const fallback = fallbackAddress?.toLowerCase?.()
      return (
        this.contractLabels[primary] ||
        this.contractLabels[fallback] ||
        getRujiraContractLabel(primaryAddress) ||
        getRujiraContractLabel(fallbackAddress) ||
        addressMap[primaryAddress] ||
        addressMap[fallbackAddress] ||
        action?.metadata?.contract?.attributes?.contract ||
        ''
      )
    },
    getResolvedContractProduct(primaryAddress, fallbackAddress, action) {
      return (
        getRujiraContractProduct(primaryAddress) ||
        getRujiraContractProduct(fallbackAddress) ||
        getRujiraContractProduct(
          action?.metadata?.contract?.attributes?.contract
        ) ||
        getRujiraContractEntry(primaryAddress)?.product ||
        getRujiraContractEntry(fallbackAddress)?.product ||
        ''
      )
    },
    getProductLabelFromContractLabel(label = '') {
      const normalized = label.trim()
      const lower = normalized.toLowerCase()

      if (!normalized) return ''

      if (/ruji|rujira/.test(lower)) {
        if (/borrow|secure|collateral|loan/.test(lower)) return 'RUJI Borrow'
        if (/pool|liquidity/.test(lower)) return 'RUJI Pools'
        if (/merge/.test(lower)) return 'RUJI Merge'
        if (
          /ruji\b(?!ra)/.test(lower) &&
          !/trade|pool|borrow|merge/.test(lower)
        )
          return 'RUJI'
        return 'RUJI Trade'
      }

      if (/tcy/.test(lower)) return 'TCY'

      return normalized
    },
    getContractSecondary(action, inputCoin) {
      if (inputCoin) {
        return this.getCoinSummary(inputCoin)
      }

      return this.getActionSecondary(action) || 'Contract invocation'
    },
    getPoolLabel(action) {
      return action.pools?.[0] ? this.showAsset(action.pools[0]) : 'Pool'
    },
    getAddressLabel(address) {
      if (!address) {
        return '-'
      }

      return (
        getRujiraContractLabel(address) ||
        this.contractLabels[address.toLowerCase?.()] ||
        addressMap[address] ||
        this.addressFormatV2(address)
      )
    },
    getAssetDisplay(coin, usdValue, link) {
      if (!coin?.asset) {
        return {
          primary: '-',
          secondary: '',
          link,
        }
      }

      const parsed = assetFromString(coin.asset)
      const kind = parsed.trade
        ? 'Rujira'
        : parsed.synth
          ? 'Synth'
          : parsed.secure
            ? 'Secure'
            : parsed.chain === 'THOR'
              ? 'THORChain'
              : 'Native'

      return {
        asset: coin.asset,
        primary: this.getFriendlyAssetName(parsed),
        badge: kind,
        secondary: [
          `${this.decimalFormat((+coin.amount || 0) / 1e8)} ${this.showAsset(coin.asset, true)}`,
          usdValue,
        ]
          .filter(Boolean)
          .join(' · '),
        link,
      }
    },
    getFriendlyAssetName(asset) {
      const chainNames = {
        BTC: 'Bitcoin',
        BCH: 'Bitcoin Cash',
        ETH: 'Ethereum',
        LTC: 'Litecoin',
        BNB: 'Binance Coin',
        BSC: 'Binance Smart Chain',
        DOGE: 'Dogecoin',
        SOL: 'Solana',
        AVAX: 'Avalanche',
        GAIA: 'Cosmos',
        THOR: asset.ticker === 'RUNE' ? 'RUNE' : asset.ticker,
      }

      if (
        asset.ticker === asset.chain ||
        (asset.chain === 'THOR' && asset.ticker === 'RUNE')
      ) {
        return chainNames[asset.chain] || asset.ticker
      }

      return asset.ticker
    },
    getPrimaryOutCoin(action) {
      const nonAffiliateOuts = (action.out || []).filter(
        (entry) => !entry.affiliate
      )
      const grouped = {}

      nonAffiliateOuts.forEach((entry) => {
        const coin = entry.coins?.[0]
        if (!coin) return

        const asset = coin.asset
        const parsed = assetFromString(asset)

        if (grouped[asset]) {
          if (parsed.trade || parsed.secure) return
          grouped[asset].amount += +coin.amount
          return
        }

        grouped[asset] = {
          asset,
          amount: +coin.amount,
        }
      })

      return Object.values(grouped)[0] || null
    },
    getContractEventCoins(action) {
      const events = action?.metadata?.contract?.contractEvents || []

      return events.flatMap((event) => {
        const attrs = Object.fromEntries(
          (event.attributes || []).map(({ key, value }) => [key, value])
        )

        if (!attrs.amount) return []

        return `${attrs.amount}`
          .split(',')
          .map((value) => this.parseContractEventCoin(value, event.type, attrs))
          .filter(Boolean)
      })
    },
    parseContractEventCoin(value, eventType, attrs = {}) {
      const match = `${value}`.trim().match(/^([0-9]+)(.+)$/)
      if (!match) return null

      const amount = +match[1]
      const asset = this.normalizeContractEventAsset(match[2])
      if (!asset || Number.isNaN(amount)) return null

      return {
        amount,
        asset,
        eventType,
        sender: attrs.sender || '',
        recipient: attrs.recipient || '',
        spender: attrs.spender || '',
        receiver: attrs.receiver || '',
      }
    },
    normalizeContractEventAsset(denom = '') {
      const raw = `${denom}`.trim()
      const lower = raw.toLowerCase()

      const thorMap = {
        rune: 'THOR.RUNE',
        ruji: 'THOR.RUJI',
        sruji: 'THOR.sRUJI',
        tcy: 'THOR.TCY',
        nami: 'THOR.NAMI',
        auto: 'THOR.AUTO',
        lqdy: 'THOR.LQDY',
      }

      if (thorMap[lower]) return thorMap[lower]
      if (lower.startsWith('x/')) return lower
      if (raw.includes('.')) return raw

      if (raw.includes('-')) {
        const parts = raw.split('-')
        if (parts[0]) parts[0] = parts[0].toUpperCase()
        if (parts[1] && /^[a-z0-9]{2,20}$/i.test(parts[1])) {
          parts[1] = parts[1].toUpperCase()
        }
        return parts.join('-')
      }

      return raw.toUpperCase()
    },
    getPrimaryContractEventCoin(action, direction, fromAddress, toAddress) {
      const coins = this.getContractEventCoins(action)
      if (!coins.length) return null

      const fromLower = fromAddress?.toLowerCase?.() || ''
      const toLower = toAddress?.toLowerCase?.() || ''

      const matchesAddress = (value, target) =>
        value && target && value.toLowerCase() === target

      if (direction === 'input') {
        return (
          coins.find(
            (coin) =>
              coin.eventType === 'coin_spent' &&
              matchesAddress(coin.spender, fromLower)
          ) ||
          coins.find(
            (coin) =>
              coin.eventType === 'transfer' &&
              matchesAddress(coin.sender, fromLower)
          ) ||
          coins[0]
        )
      }

      return (
        coins.find(
          (coin) =>
            coin.eventType === 'coin_received' &&
            matchesAddress(coin.receiver, toLower)
        ) ||
        coins.find(
          (coin) =>
            coin.eventType === 'transfer' &&
            matchesAddress(coin.recipient, toLower)
        ) ||
        coins[coins.length - 1]
      )
    },
    getJoinedCoinSummary(list = []) {
      return list
        .map((entry) => this.getCoinSummary(entry.coins?.[0]))
        .filter(Boolean)
        .join(' + ')
    },
    getCoinSummary(coin) {
      if (!coin?.asset) {
        return ''
      }

      return `${this.decimalFormat((+coin.amount || 0) / 1e8)} ${this.showAsset(coin.asset, true)}`
    },
    getEffectiveInAmount(action, entry) {
      const amount = +entry?.coins?.[0]?.amount || 0
      const streamingInCoin =
        +action?.metadata?.swap?.streamingSwapMeta?.depositedCoin?.amount || 0

      return streamingInCoin > amount ? streamingInCoin : amount
    },
    getInUsd(action, entry) {
      if (!action?.metadata?.swap?.inPriceUSD || !entry?.coins?.[0]) {
        return null
      }

      const inUsd =
        (action.metadata.swap.inPriceUSD *
          this.getEffectiveInAmount(action, entry)) /
        1e8

      return this.$options.filters.currency(inUsd)
    },
    getOutUsd(action, coin) {
      if (!coin?.asset) {
        return null
      }

      const inAsset = action?.in?.[0]?.coins?.[0]?.asset
      const isRefund = inAsset && coin.asset === inAsset

      if (isRefund) {
        const inPriceUSD = action?.metadata?.swap?.inPriceUSD
        if (!inPriceUSD) return null
        return this.$options.filters.currency((inPriceUSD * coin.amount) / 1e8)
      }

      const outPriceUSD = action?.metadata?.swap?.outPriceUSD
      if (!outPriceUSD) return null

      return this.$options.filters.currency((outPriceUSD * coin.amount) / 1e8)
    },
    since(date) {
      return moment(date / 1e6).fromNow()
    },
    fullTime(date) {
      return moment(date / 1e6).format('MMMM DD YYYY, hh:mm:ss A')
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

.toolbar-card,
.tx-list-card {
  background: color-mix(in srgb, var(--card-bg-color) 94%, transparent);
  border: 1px solid var(--border-color);
  border-radius: $radius-xl;
}

.toolbar-card {
  padding: $space-18 $space-20;
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

.tx-list-card {
  overflow: hidden;
}

.list-header,
.tx-row {
  column-gap: $space-14;
  display: grid;
  grid-template-columns:
    minmax(110px, 1fr)
    minmax(150px, 1fr)
    minmax(180px, 1.5fr)
    minmax(180px, 1.5fr)
    minmax(110px, 0.9fr)
    minmax(80px, 0.7fr)
    minmax(110px, 0.8fr)
    3rem;

  @media (max-width: 1023px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.list-header {
  border-bottom: 1px solid var(--border-color);
  color: var(--font-color);
  font-size: $font-size-xxs;
  letter-spacing: 0.06em;
  padding: $space-14 $space-18;
  text-transform: uppercase;

  @media (max-width: 1023px) {
    display: none;
  }
}

.list-body {
  display: flex;
  flex-direction: column;
}

.tx-row {
  align-items: center;
  border-bottom: 1px solid
    color-mix(in srgb, var(--border-color) 80%, transparent);
  padding: $space-16 $space-18;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 1023px) {
    gap: $space-8;
    padding: $space-14;
  }
}

.cell {
  min-width: 0;
}

.product-cell,
.endpoint-primary,
.user-cell {
  align-items: center;
  display: flex;
  gap: $space-8;
}

.product-cell {
  color: var(--sec-font-color);
  font-weight: 600;
}

.product-dot {
  border-radius: 4px;
  display: inline-block;
  flex-shrink: 0;
  height: 10px;
  width: 10px;
}

.tone-green {
  background: #35f09a;
}

.tone-blue {
  background: #45abff;
}

.tone-gold {
  background: #ffbf3f;
}

.tone-purple,
.tone-violet {
  background: #b878ff;
}

.tone-red {
  background: #ff695e;
}

.action-primary,
.endpoint-primary {
  color: var(--sec-font-color);
  font-weight: 600;
}

.endpoint-primary {
  align-items: center;
  column-gap: $space-8;
  display: flex;
  flex-wrap: wrap;
  row-gap: $space-4;
}

.action-secondary,
.endpoint-secondary {
  color: var(--font-color);
  font-size: $font-size-sm;
  margin-top: $space-4;
  min-width: 0;
  overflow-wrap: anywhere;
}

.endpoint-stack {
  align-items: flex-start;
  display: block;
  min-width: 0;
  overflow: hidden;
}

.endpoint-stack.has-asset-icon {
  column-gap: $space-10;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
}

.endpoint-copy {
  min-width: 0;
  overflow: hidden;
}

.endpoint-icon {
  flex: 0 0 auto;
  height: 1.1rem;
  margin-top: 0.1rem;
  width: 1.1rem;
}

.endpoint-badge {
  color: var(--font-color);
  font-size: $font-size-sm;
  font-weight: 400;
  margin-left: $space-4;
}

.endpoint-primary > *:not(.endpoint-badge) {
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  overflow-wrap: anywhere;
  text-overflow: ellipsis;
  word-break: break-word;
}

.time-cell {
  color: var(--font-color);
  font-size: $font-size-sm;
}

.status-pill {
  align-items: center;
  border-radius: 999px;
  display: inline-flex;
  font-size: $font-size-sm;
  font-weight: 600;
  gap: $space-6;
  padding: $space-8 $space-10;
}

.status-pill .status-dot {
  border-radius: 999px;
  height: 0.45rem;
  width: 0.45rem;
}

.status-pill.tone-green {
  background: color-mix(in srgb, var(--green) 10%, transparent);
  color: #35f09a;

  .status-dot {
    background: #35f09a;
  }
}

.status-pill.tone-blue {
  background: color-mix(in srgb, #45abff 12%, transparent);
  color: #45abff;

  .status-dot {
    background: #45abff;
  }
}

.status-pill.tone-red {
  background: color-mix(in srgb, var(--red) 12%, transparent);
  color: #ff695e;

  .status-dot {
    background: #ff695e;
  }
}

.open-cell {
  display: flex;
  justify-content: flex-end;
}

.open-btn {
  align-items: center;
  background: transparent;
  border: none;
  color: var(--sec-font-color);
  display: inline-flex;
  gap: $space-4;
  height: auto;
  justify-content: center;
  padding: $space-4 0;
  text-decoration: none;
  transition: color 0.15s ease;
  white-space: nowrap;

  &:hover {
    color: var(--green);
  }

  span {
    font-size: $font-size-xs;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
}

.open-btn__icon {
  fill: var(--font-color);
  flex: 0 0 auto;
  height: 15px;
  width: 15px;
  transition: transform 0.15s ease;
}

.open-btn:hover .open-btn__icon {
  fill: var(--primary-color);
  transform: translateX(3px);
}

.text-link {
  color: var(--green);
  text-decoration: none;
  overflow-wrap: anywhere;
  word-break: break-word;

  &:hover {
    color: color-mix(in srgb, var(--green) 82%, white);
  }
}

.empty-state {
  color: var(--font-color);
  padding: $space-24;
  text-align: center;
}

.error-container {
  background: color-mix(in srgb, var(--red) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--red) 45%, transparent);
  border-radius: $radius-lg;
  color: #ff8d8d;
  padding: $space-16;
}

.skeleton-row {
  pointer-events: none;
}

.skel {
  animation: pulse 1.4s ease-in-out infinite;
  background: color-mix(in srgb, var(--border-color) 80%, transparent);
  border-radius: $radius-md;
  height: 2.8rem;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}
</style>
