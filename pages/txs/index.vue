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
            <div class="stat-value">
              {{ $options.filters.number(latestThorBlock, '0,0') }}
            </div>
          </div>

          <div v-if="count > -1" class="count-inline">
            {{ $options.filters.number(count, '0,0') }} transactions
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
            <label class="select-chip select-chip--fixed">
              <span>Assets</span>
              <select v-model="assetSelect" @change="applyToolbarFilters">
                <option
                  v-for="option in assetOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label class="select-chip select-chip--fixed">
              <span>Action</span>
              <select v-model="actionSelect" @change="applyToolbarFilters">
                <option
                  v-for="option in actionOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>

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
              <div class="endpoint-primary">
                <template v-if="row.from.asset">
                  <AssetIcon :asset="row.from.asset" class="endpoint-icon" />
                </template>
                <template v-else-if="row.from.link">
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

            <div class="cell endpoint-cell">
              <div class="endpoint-primary">
                <template v-if="row.to.asset">
                  <AssetIcon :asset="row.to.asset" class="endpoint-icon" />
                </template>
                <template v-else-if="row.to.link">
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
                :title="`Open ${row.hash}`"
              >
                <span>Open</span>
                <ExternalIcon class="open-btn__icon" />
              </nuxt-link>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">No transactions found for this view.</div>
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
import { assetFromString } from '~/utils'
import addressMap from '~/utils/address'
import advancedFilter from './components/advancedFilter.vue'
import NewPagination from '~/components/NewPagination.vue'
import Pagination from '~/components/Pagination.vue'
import AssetIcon from '~/components/AssetIcon.vue'
import SearchIcon from '~/assets/images/search.svg?inline'
import ExternalIcon from '~/assets/images/external.svg?inline'

export default {
  name: 'TxsPage',
  components: {
    AssetIcon,
    advancedFilter,
    NewPagination,
    Pagination,
    SearchIcon,
    ExternalIcon,
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
      latestThorBlock: undefined,
      searchValue: '',
      assetSelect: 'native',
      actionSelect: 'swap',
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
    this.fetchLatestBlock()
  },
  methods: {
    syncToolbar(query) {
      this.assetSelect = this.assetOptions.some(
        (option) => option.value === query.asset
      )
        ? query.asset
        : 'all'

      this.actionSelect = this.actionOptions.some(
        (option) => option.value === query.type
      )
        ? query.type
        : 'all'

      const addressSearch = query.address || query.affiliate || ''
      const freeAssetSearch =
        query.asset && !this.assetOptions.some((option) => option.value === query.asset)
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
      this.loading = true

      const cleanParams = this.checkQuery(params)

      let offset
      if (this.$route.query.page) {
        this.currentPage = +this.$route.query.page
        offset = (+this.$route.query.page - 1) * this.limit
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

      if (this.assetSelect === 'all') {
        delete query.asset
      } else {
        query.asset = this.assetSelect
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
      } else if (value.includes('.') || value.includes('-') || value.includes('/')) {
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

      if (this.assetSelect === 'all') {
        delete query.asset
      } else {
        query.asset = this.assetSelect
      }

      if (this.actionSelect === 'all') {
        delete query.type
      } else {
        query.type = this.actionSelect
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
      const fromAddress = this.getFirstAddress(action.in)
      const toAddress =
        action.out?.find((entry) => !entry.affiliate && entry.address)?.address ||
        ''
      const inputEntry = action.in?.find((entry) => entry.coins?.length) || null
      const inputCoin = inputEntry?.coins?.[0] || null
      const outputCoin = this.getPrimaryOutCoin(action)

      return {
        hash,
        link: `/tx/${hash}`,
        product: this.getProductMeta(action, toAddress),
        actionLabel: this.typeName(this.normalizeType(action), action),
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
    normalizeType(action) {
      if (action.type === 'swap') {
        const txType = action.metadata?.swap?.txType
        if (txType === 'add') return 'addLiquidity'
        if (txType === 'withdraw') return 'withdraw'
      }

      return action.type
    },
    typeName(type, row) {
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
    getActionSecondary(action) {
      if (action.type === 'contract') {
        const contractAction = action.metadata?.contract?.attributes?.action
        if (contractAction) {
          return this.$options.filters.capitalize(contractAction.replace(/[_\.]/g, ' '))
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
        const contractLabel = addressMap[toAddress] || addressMap[this.getFirstAddress(action.in)] || ''
        if (/ruji|rujira/i.test(contractLabel)) {
          return { label: 'RUJI Trade', tone: 'blue' }
        }
        return { label: 'Contract', tone: 'purple' }
      }

      if (type === 'secure') {
        return { label: 'THORFi', tone: 'violet' }
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
          secondary: this.getCoinSummary(outputCoin || action.out?.[0]?.coins?.[0]),
          link: toAddress ? `/address/${toAddress}` : undefined,
        }
      }

      if (type === 'refund') {
        return {
          primary: this.getAddressLabel(toAddress || this.getFirstAddress(action.in)),
          secondary: 'Returned to sender',
          link:
            toAddress || this.getFirstAddress(action.in)
              ? `/address/${toAddress || this.getFirstAddress(action.in)}`
              : undefined,
        }
      }

      if (type === 'contract') {
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
          primary: this.getAddressLabel(toAddress || this.getFirstAddress(action.out)),
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
        addressMap[toAddress] ||
        action.metadata?.contract?.attributes?.contract ||
        this.getAddressLabel(toAddress)
      )
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

      return addressMap[address] || this.addressFormatV2(address)
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

      if (asset.ticker === asset.chain || (asset.chain === 'THOR' && asset.ticker === 'RUNE')) {
        return chainNames[asset.chain] || asset.ticker
      }

      return asset.ticker
    },
    getPrimaryOutCoin(action) {
      const nonAffiliateOuts = (action.out || []).filter((entry) => !entry.affiliate)
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
        (action.metadata.swap.inPriceUSD * this.getEffectiveInAmount(action, entry)) /
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
    align-items: flex-end;
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

.stat-value {
  color: var(--sec-font-color);
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.1;
  margin-top: $space-6;
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
  color: var(--font-color);
  height: 1rem;
  width: 1rem;
}

.select-chip {
  align-items: center;
  background: var(--bgl-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-lg;
  box-sizing: border-box;
  color: var(--sec-font-color);
  display: inline-flex;
  gap: $space-8;
  justify-content: space-between;
  min-height: 4rem;
  min-width: 10rem;
  padding: 0 $space-12;

  span {
    color: var(--font-color);
    font-size: $font-size-sm;
  }

  select {
    appearance: none;
    background: transparent;
    border: none;
    box-sizing: border-box;
    color: var(--sec-font-color);
    cursor: pointer;
    flex: 1 1 auto;
    min-width: 0;
    outline: none;
    padding-right: $space-8;
    text-overflow: ellipsis;
    width: 100%;
  }
}

.select-chip--fixed {
  @include lg {
    flex: 0 0 13rem;
    max-width: 13rem;
    min-width: 13rem;
    width: 13rem;

    select {
      max-width: 100%;
      min-width: 100%;
      width: 100%;
    }
  }
}

.preset-rail {
  display: flex;
  gap: $space-10;
  margin-top: $space-16;
  overflow-x: auto;
  padding-bottom: $space-4;
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
  border-bottom: 1px solid color-mix(in srgb, var(--border-color) 80%, transparent);
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
  border-radius: 999px;
  display: inline-block;
  height: 0.6rem;
  width: 0.6rem;
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

.action-secondary,
.endpoint-secondary {
  color: var(--font-color);
  font-size: $font-size-sm;
  margin-top: $space-4;
}

.endpoint-icon {
  flex: 0 0 auto;
  height: 1.1rem;
  width: 1.1rem;
}

.endpoint-badge {
  color: var(--font-color);
  font-size: $font-size-sm;
  font-weight: 400;
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
  background: color-mix(in srgb, var(--bgl-color) 84%, white 8%);
  border: 1px solid var(--border-color);
  border-radius: 999px;
  color: var(--font-color);
  display: inline-flex;
  gap: $space-8;
  height: 2.25rem;
  justify-content: center;
  padding: 0 $space-12;
  text-decoration: none;
  transition: 0.2s ease;
  white-space: nowrap;

  &:hover {
    border-color: var(--green);
    color: var(--green);
    background: color-mix(in srgb, var(--green) 10%, var(--bgl-color));
    transform: translateY(-1px);
  }

  span {
    font-size: $font-size-sm;
    font-weight: 600;
  }

  :deep(svg) {
    height: 0.85rem;
    width: 0.85rem;
    color: currentColor;
    fill: currentColor !important;
    stroke: currentColor !important;
  }

  :deep(path) {
    fill: currentColor !important;
    stroke: currentColor !important;
  }

  :deep(rect),
  :deep(line),
  :deep(polyline) {
    fill: currentColor !important;
    stroke: currentColor !important;
  }

  :deep(svg *) {
    fill: currentColor !important;
    stroke: currentColor !important;
  }
}

.open-btn__icon {
  flex: 0 0 auto;
}

.text-link {
  color: var(--green);
  text-decoration: none;

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
