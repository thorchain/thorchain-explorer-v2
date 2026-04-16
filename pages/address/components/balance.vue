<template>
  <div>
    <card
      v-if="state && explorers.length == 0"
      :navs="[
        { title: 'Holdings', value: 'holdings' },
        { title: 'Portfolio', value: 'portfolio' },
      ]"
      :act-nav.sync="activeTab"
    >
      <!-- Holdings tab -->
      <div v-if="activeTab === 'holdings'">
        <div class="tab-toolbar">
          <button
            v-if="sortedTokens.length > 5"
            class="view-all-button"
            @click="expanded = !expanded"
          >
            {{ expanded ? 'Show less' : 'View all' }}
          </button>
        </div>

        <div class="holdings-table">
          <div class="holdings-head">
            <span>Asset</span>
            <span>Amount</span>
            <span>Value</span>
            <span>Allocation</span>
          </div>

          <div
            v-for="token in visibleHoldings"
            :key="assetKey(token.asset)"
            class="holding-row"
          >
            <div class="holding-asset">
              <asset-icon
                :asset="holdingIconAsset(token.asset)"
                :chain="false"
              />
              <div class="holding-asset-copy">
                <span class="holding-name">{{
                  getAssetDisplayName(token.asset)
                }}</span>
                <span class="holding-network">{{
                  getAssetSubtitle(token.asset)
                }}</span>
              </div>
            </div>

            <div class="holding-amount mono">
              {{ formatQuantity(token.quantity) }}
              {{ showAsset(token.asset, true) }}
            </div>

            <div class="holding-value mono">
              {{ formatUsd(token.value) }}
            </div>

            <div class="holding-allocation">
              <div class="allocation-track">
                <span
                  class="allocation-fill"
                  :style="{
                    width: `${token.allocationPercent}%`,
                    backgroundColor: getAllocationColor(token.asset),
                  }"
                ></span>
              </div>
              <span class="allocation-percent mono">
                {{ formatPercent(token.allocationPercent) }}
              </span>
            </div>
          </div>

          <div v-if="visibleHoldings.length === 0" class="empty-state">
            No asset balances available for this address.
          </div>
        </div>
      </div>

      <!-- Portfolio tab -->
      <div v-if="activeTab === 'portfolio'" class="allocation-chart-shell">
        <div class="allocation-chart-wrap">
          <pie-chart
            v-if="allocationPieData.length > 0"
            :pie-data="allocationPieData"
            :extra-series="chartExtraSeries"
            :extra="chartExtra"
            :height="'320px'"
          />
          <div class="allocation-center">
            <span class="allocation-center__count">{{ tokenCount }}</span>
            <span class="allocation-center__label">Assets</span>
          </div>
        </div>

        <div class="allocation-legend">
          <div
            v-for="item in allocationLegendItems"
            :key="item.name"
            class="legend-item"
          >
            <span
              class="legend-dot"
              :style="{ backgroundColor: item.color }"
            ></span>
            <span class="legend-label">{{ item.label }}</span>
            <span class="legend-value mono">{{ item.percent }}</span>
          </div>
        </div>
      </div>
    </card>

    <card v-else title="Chain Explorers" class="explorers-card">
      <div class="explorers">
        <div v-for="explorer in explorers" :key="explorer.chain">
          <a
            class="explorer-link mini-bubble info hoverable"
            :href="explorer.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            <asset-icon
              :height="'1.2rem'"
              :asset="baseChainAsset(explorer.chain)"
            ></asset-icon>
            {{ explorer.chain }}
            <external-icon class="ext-icon" />
          </a>
        </div>
      </div>
    </card>
  </div>
</template>

<script>
import { bnOrZero } from '@xchainjs/xchain-util'
import { mapGetters } from 'vuex'
import { orderBy } from 'lodash'
import { validate } from '@swyftx/api-crypto-address-validator'
import { assetFromString, getExplorerAddressUrl } from '~/utils'
import ExternalIcon from '@/assets/images/external.svg?inline'
import PieChart from '~/components/PieChart.vue'

const ALLOCATION_COLORS = {
  BTC: '#F8A329',
  ETH: '#D5D8DF',
  RUNE: '#63F0D0',
  USDC: '#4D9DFF',
  USDT: '#2FBF9B',
  SOL: '#8B5CF6',
  RUJI: '#b878ff',
  sRUJI: '#b878ff',
  DEFAULT: '#566274',
}

const ASSET_NAMES = {
  BTC: 'Bitcoin',
  BCH: 'Bitcoin Cash',
  DOGE: 'Dogecoin',
  ETH: 'Ethereum',
  LTC: 'Litecoin',
  RUNE: 'RUNE',
  SOL: 'Solana',
  USDC: 'USDC',
  USDT: 'USDT',
  RUJI: 'RUJI',
}

const CHAIN_NAMES = {
  AVAX: 'Avalanche',
  BASE: 'Base',
  BCH: 'Bitcoin Cash',
  BNB: 'BNB Chain',
  BSC: 'Binance Smart Chain',
  BTC: 'Bitcoin',
  DOGE: 'Dogecoin',
  ETH: 'Ethereum',
  GAIA: 'Cosmos',
  LTC: 'Litecoin',
  SOL: 'Solana',
  THOR: 'THORChain',
  TRON: 'TRON',
  XRP: 'XRP Ledger',
}

export default {
  components: {
    ExternalIcon,
    PieChart,
  },
  props: ['state', 'loading', 'address'],
  data() {
    return {
      expanded: false,
      activeTab: 'holdings',
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
      pools: 'getPools',
      nodes: 'getNodesData',
    }),
    bondedRuneQuantity() {
      if (!this.nodes || !this.address) return 0
      return this.nodes.reduce((sum, node) => {
        const bond = node.bond_providers?.providers?.find(
          (p) => p.bond_address === this.address
        )
        return bond ? sum + +bond.bond / 1e8 : sum
      }, 0)
    },
    tokenRows() {
      if (!this.state) {
        return []
      }

      const rows = []
      for (let i = 0; i < this.state.length; i++) {
        const entry = this.state[i]
        if (!entry?.asset) {
          continue
        }

        let poolAsset
        this.pools?.forEach((pool) => {
          const poolAssetData = assetFromString(pool.asset)
          if (
            poolAssetData.chain === entry.asset?.chain &&
            poolAssetData.ticker === entry.asset?.ticker
          ) {
            poolAsset = pool
          }
        })

        if (entry.asset?.ticker === 'RUNE' && entry.asset?.chain === 'THOR') {
          poolAsset = { assetPriceUSD: this.runePrice }
        }

        // sRUJI is staked RUJI — use the same price as RUJI
        if (entry.asset?.ticker === 'sRUJI' && entry.asset?.chain === 'THOR') {
          const rujiPool = this.pools?.find((pool) => {
            const p = assetFromString(pool.asset)
            return p.chain === 'THOR' && p.ticker === 'RUJI'
          })
          if (rujiPool) poolAsset = rujiPool
        }

        const quantity = Number(entry.quantity) || 0
        const price = Number(bnOrZero(poolAsset?.assetPriceUSD).toFixed(4)) || 0
        const value = Number((price * quantity).toFixed(2)) || 0

        rows.push({
          asset: entry.asset,
          quantity,
          price,
          value,
        })
      }

      if (this.bondedRuneQuantity > 0) {
        const price = Number(this.runePrice) || 0
        rows.push({
          asset: { ticker: 'RUNE', chain: 'THOR', bond: true },
          quantity: this.bondedRuneQuantity,
          price,
          value: Number((price * this.bondedRuneQuantity).toFixed(2)),
        })
      }

      return rows
    },
    totalPortfolioValue() {
      return this.tokenRows.reduce((sum, token) => sum + token.value, 0)
    },
    sortedTokens() {
      return orderBy(
        this.tokenRows.filter((token) => token.asset),
        [(token) => token.value, (token) => token.quantity],
        ['desc', 'desc']
      ).map((token) => ({
        ...token,
        allocationPercent:
          this.totalPortfolioValue > 0
            ? (token.value / this.totalPortfolioValue) * 100
            : 0,
      }))
    },
    visibleHoldings() {
      if (this.expanded) {
        return this.sortedTokens
      }
      return this.sortedTokens.slice(0, 5)
    },
    tokenCount() {
      return this.sortedTokens.length
    },
    allocationSlices() {
      const topTokens = this.sortedTokens.filter((token) => token.value > 0)
      if (topTokens.length === 0) {
        return []
      }

      const slices = topTokens.slice(0, 5).map((token) => ({
        name: this.getAssetDisplayName(token.asset),
        value: token.value,
        color: this.getAllocationColor(token.asset),
      }))

      if (topTokens.length > 5) {
        const otherValue = topTokens
          .slice(5)
          .reduce((sum, token) => sum + token.value, 0)
        if (otherValue > 0) {
          slices.push({
            name: 'Other',
            value: otherValue,
            color: ALLOCATION_COLORS.DEFAULT,
          })
        }
      }

      return slices
    },
    allocationPieData() {
      return this.allocationSlices.map((slice) => ({
        name: slice.name,
        value: slice.value,
        itemStyle: {
          color: slice.color,
        },
      }))
    },
    allocationLegendItems() {
      const total = this.allocationSlices.reduce(
        (sum, slice) => sum + slice.value,
        0
      )
      return this.allocationSlices.map((slice) => ({
        ...slice,
        label: slice.name,
        percent:
          total > 0 ? `${((slice.value / total) * 100).toFixed(0)}%` : '0%',
      }))
    },
    chartExtraSeries() {
      return {
        center: ['50%', '50%'],
        radius: ['58%', '78%'],
        label: {
          show: false,
        },
        emphasis: {
          scale: false,
        },
      }
    },
    chartExtra() {
      return {
        legend: {
          show: false,
        },
        tooltip: {
          confine: true,
          trigger: 'item',
          formatter: (params) => {
            return `${params.name}: <span class="mono">${this.formatUsd(params.value)}</span> (${params.percent}%)`
          },
        },
      }
    },
    explorers() {
      const blockChains = [
        'btc',
        'eth',
        'doge',
        'bch',
        'ltc',
        'atom',
        'xrp',
        'trx',
      ]
      const explorers = []

      for (let i = 0; i < blockChains.length; i++) {
        let chain = blockChains[i]
        const valid = validate(this.address, chain)

        if (valid && chain === 'eth') {
          const evms = ['ETH', 'BSC', 'AVAX', 'BASE']
          evms.forEach((evm) => {
            explorers.push({
              chain: evm,
              url: getExplorerAddressUrl(evm, this.address),
            })
          })
        } else if (valid) {
          if (chain === 'atom') {
            chain = 'gaia'
          }
          if (chain === 'trx') {
            chain = 'tron'
          }
          explorers.push({
            chain: chain.toUpperCase(),
            url: getExplorerAddressUrl(chain.toUpperCase(), this.address),
          })
        }
      }

      return explorers
    },
  },
  watch: {
    totalPortfolioValue: {
      handler(value) {
        this.$emit('portfolio-total', value)
      },
      immediate: true,
    },
  },
  methods: {
    assetKey(asset) {
      return asset?.toString
        ? asset.toString()
        : `${asset?.chain}.${asset?.ticker}`
    },
    getAllocationColor(asset) {
      const ticker = this.showAsset(asset, true)
      return ALLOCATION_COLORS[ticker] || ALLOCATION_COLORS.DEFAULT
    },
    getAssetDisplayName(asset) {
      if (asset?.bond) return 'Bonded RUNE'
      const ticker = this.showAsset(asset, true)
      return ASSET_NAMES[ticker] || ticker
    },
    holdingIconAsset(asset) {
      const ticker = this.showAsset(asset, true)
      if (ticker === 'RUNE') {
        return 'THOR.RUNE'
      }
      if (ticker === 'sRUJI') {
        return 'THOR.RUJI'
      }
      if (asset?.chain === 'THOR' && ticker === 'ETH') {
        return 'ETH.ETH'
      }
      return asset
    },
    getChainName(chain) {
      return CHAIN_NAMES[chain] || chain
    },
    getAssetSubtitle(asset) {
      if (asset?.bond) return 'THORChain · Bonded'
      const chainName = this.getChainName(asset?.chain)

      if (asset?.secure) {
        return `${chainName} · Secured`
      }
      if (asset?.trade) {
        return `${chainName} · Trade`
      }
      if (asset?.synth) {
        return `${chainName} · Synth`
      }
      if (asset?.chain === 'THOR') {
        return 'THORChain'
      }
      return `${chainName} · Native`
    },
    formatQuantity(quantity) {
      if (!Number.isFinite(quantity)) {
        return '0'
      }

      if (quantity >= 1000) {
        return this.$options.filters.number(quantity, '0,0.00')
      }
      if (quantity >= 1) {
        return this.$options.filters.number(quantity, '0,0.0000')
      }
      if (quantity < 1e-6) {
        // numeral.js returns 'NaN' for sub-microsecond values with fixed decimal formats
        return quantity.toFixed(8)
      }
      return this.$options.filters.number(quantity, '0,0.000000')
    },
    formatUsd(value) {
      const amount = Number(value)
      if (!Number.isFinite(amount) || amount <= 0) {
        return '$0'
      }
      return this.formatCurrency(amount)
    },
    formatPercent(percent) {
      const amount = Number(percent)
      if (!Number.isFinite(amount) || amount <= 0) {
        return '0%'
      }
      if (amount >= 10) {
        return `${amount.toFixed(0)}%`
      }
      return `${amount.toFixed(1)}%`
    },
  },
}
</script>

<style lang="scss" scoped>
.tab-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.5rem;
  min-height: 1.5rem;
}

.view-all-button {
  background: transparent;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 600;
  padding: 0;

  &:hover {
    opacity: 0.85;
  }
}

.holdings-table {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.holdings-head,
.holding-row {
  column-gap: 1rem;
  display: grid;
  grid-template-columns:
    minmax(220px, 1.6fr) minmax(120px, 0.8fr) minmax(100px, 0.7fr)
    minmax(140px, 0.8fr);
}

.holdings-head {
  color: var(--sec-font-color);
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  padding: 0 0.25rem 0.7rem;
  text-transform: uppercase;
}

.holding-row {
  align-items: center;
  border-top: 1px solid rgba(111, 130, 153, 0.16);
  min-height: 78px;
  padding: 0.75rem 0.25rem;
}

.holding-asset {
  align-items: center;
  display: flex;
  gap: 0.85rem;
  min-width: 0;
}

.holding-asset-copy {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  min-width: 0;
}

.holding-name {
  color: var(--font-color);
  font-size: 1.02rem;
  font-weight: 600;
}

.holding-network {
  color: var(--sec-font-color);
  font-size: 0.85rem;
}

.holding-amount,
.holding-value,
.allocation-percent {
  color: var(--font-color);
  font-size: 0.92rem;
}

.holding-allocation {
  align-items: center;
  display: flex;
  gap: 0.7rem;
}

.allocation-track {
  background: rgba(113, 131, 154, 0.24);
  border-radius: 999px;
  flex: 1;
  height: 8px;
  overflow: hidden;
  position: relative;
}

.allocation-fill {
  border-radius: 999px;
  display: block;
  height: 100%;
  min-width: 8px;
}

.allocation-chart-shell {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  min-height: 100%;
}

.allocation-chart-wrap {
  margin: 0 auto;
  max-width: 320px;
  position: relative;
  width: 100%;
}

.allocation-center {
  align-items: center;
  display: flex;
  flex-direction: column;
  inset: 0;
  justify-content: center;
  pointer-events: none;
  position: absolute;
}

.allocation-center__count {
  color: var(--font-color);
  font-size: 1.45rem;
  font-weight: 700;
}

.allocation-center__label {
  color: var(--sec-font-color);
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.allocation-legend {
  display: grid;
  gap: 0.7rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 0.25rem;
}

.legend-item {
  align-items: center;
  display: grid;
  gap: 0.55rem;
  grid-template-columns: auto 1fr auto;
}

.legend-dot {
  border-radius: 999px;
  display: inline-flex;
  height: 10px;
  width: 10px;
}

.legend-label {
  color: var(--sec-font-color);
  font-size: 0.88rem;
}

.legend-value {
  color: var(--font-color);
  font-size: 0.82rem;
}

.empty-state {
  color: var(--sec-font-color);
  padding: 2rem 0;
  text-align: center;
}

.explorers-card {
  max-width: 500px;
  min-height: 100%;
}

.explorers {
  display: flex;
  flex-wrap: wrap;
  gap: $space-8;

  .explorer-link {
    align-items: center;
    display: flex;
    height: 2rem;

    .ext-icon {
      fill: currentColor;
      height: 0.8rem;
    }
  }
}

@media (max-width: 1180px) {
  .holdings-head,
  .holding-row {
    grid-template-columns: minmax(220px, 1.4fr) minmax(120px, 0.8fr) minmax(
        96px,
        0.7fr
      );
  }

  .holdings-head span:last-child,
  .holding-row .holding-allocation {
    display: none;
  }
}

@media (max-width: 860px) {
  .holdings-head,
  .holding-row {
    grid-template-columns: minmax(0, 1.5fr) minmax(100px, 0.8fr);
  }

  .holdings-head span:nth-child(3),
  .holding-row .holding-value {
    display: none;
  }

  .allocation-legend {
    grid-template-columns: 1fr;
  }
}
</style>
