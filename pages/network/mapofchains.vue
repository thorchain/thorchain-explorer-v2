<template>
  <Page>
    <Header title="Map of Chains" />
    <section class="mapofchains">
      <div class="map-shell">
        <div class="map-toolbar">
          <div>
            <div class="eyebrow">THORChain connected chains</div>
            <h1>Cross-chain activity map</h1>
          </div>
          <div class="toolbar-actions">
            <button v-tooltip="'Zoom out'" type="button" class="map-btn" @click="zoomOut">−</button>
            <button v-tooltip="'Reset view'" type="button" class="map-btn" @click="resetView">
              <RefreshIcon class="btn-icon" />
            </button>
            <button v-tooltip="'Zoom in'" type="button" class="map-btn" @click="zoomIn">+</button>
          </div>
        </div>

        <div
          ref="mapViewport"
          class="map-viewport"
          @mousedown="startPan"
          @mousemove="pan"
          @mouseup="endPan"
          @mouseleave="endPan"
          @wheel.prevent="handleWheel"
        >
          <svg
            class="chain-map"
            viewBox="-520 -360 1040 720"
            role="img"
            aria-label="Interactive map of THORChain connected chains"
          >
            <defs>
              <radialGradient id="thorGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#2cbe8c" stop-opacity="0.34" />
                <stop offset="100%" stop-color="#2cbe8c" stop-opacity="0" />
              </radialGradient>
              <filter
                id="softGlow"
                x="-60%"
                y="-60%"
                width="220%"
                height="220%"
              >
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g :transform="mapTransform">
              <circle r="182" class="orbit orbit-primary" />
              <circle r="292" class="orbit orbit-secondary" />

              <g class="links" :class="{ focused: selectedChain }">
                <path
                  v-for="chain in displayedChains"
                  :key="`${chain.chain}-link`"
                  :d="linkPath(chain)"
                  :style="linkStyle(chain)"
                />
              </g>

              <g class="mesh-links" :class="{ focused: selectedChain }">
                <path
                  v-for="link in meshLinks"
                  :key="`${link.source}-${link.target}-mesh`"
                  :d="swapPath(link)"
                  :class="{ connected: isSelectedLink(link) }"
                />
              </g>

              <g class="swap-links" :class="{ focused: selectedChain }">
                <path
                  v-for="link in visibleSwapLinks"
                  :key="`${link.source}-${link.target}`"
                  :d="swapPath(link)"
                  :style="swapLinkStyle(link)"
                  :class="{ connected: isSelectedLink(link) }"
                />
              </g>

              <g
                class="thor-node"
                :class="{ selectable: selectedChain }"
                :style="nodeTransform(thorPosition)"
                filter="url(#softGlow)"
                @click.stop="clearSelection"
              >
                <circle r="128" fill="url(#thorGlow)" />
                <circle r="52" class="thor-core" />
                <image
                  :href="assetImage('THOR.RUNE')"
                  x="-24"
                  y="-24"
                  width="48"
                  height="48"
                  @error="imgErr"
                />
                <text y="79" class="node-label center">THORChain</text>
              </g>

              <g
                v-for="chain in displayedChains"
                :key="chain.chain"
                class="chain-node"
                :class="{
                  selected: selectedChain === chain.chain,
                  connected: isSelectedCounterparty(chain.chain),
                  muted: selectedChain && !isSelectedCounterparty(chain.chain),
                }"
                :style="[nodeTransform(chain), { '--node-color': getChainColor(chain.chain) }]"
                @click.stop="selectChain(chain.chain)"
              >
                <circle :r="nodeRadius(chain)" class="node-halo" />
                <circle :r="nodeRadius(chain) - 9" class="node-core" />
                <image
                  :href="assetImage(baseChainAsset(chain.chain))"
                  :x="-iconSize(chain) / 2"
                  :y="-iconSize(chain) / 2"
                  :width="iconSize(chain)"
                  :height="iconSize(chain)"
                  @error="imgErr"
                />
                <text :y="nodeRadius(chain) + 20" class="node-label center">
                  {{ chain.chain }}
                </text>
                <text :y="nodeRadius(chain) + 37" class="node-metric center">
                  {{ compactCurrency(chain.volume) }}
                </text>
              </g>
            </g>
          </svg>
        </div>
      </div>

      <aside class="rank-panel">
        <div class="panel-header">
          <div>
            <div class="eyebrow">
              {{ selectedChainData ? 'Chain Details' : 'Rankings' }}
            </div>
            <h2>
              {{
                selectedChainData
                  ? chainName(selectedChainData.chain)
                  : selectedMetricLabel
              }}
            </h2>
          </div>
          <div class="period-dropdown">
            <button
              type="button"
              class="period-trigger"
              @click="periodDropdownOpen = !periodDropdownOpen"
            >
              {{ selectedPeriod }}
              <AngleIcon :class="['dropdown-arrow', { rotated: periodDropdownOpen }]" />
            </button>
            <div v-if="periodDropdownOpen" class="period-menu">
              <button
                v-for="period in periods"
                :key="period.mode"
                type="button"
                class="period-option"
                :class="{ active: selectedPeriod === period.mode }"
                @click="onPeriodChange(period.mode)"
              >
                {{ period.text }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="!selectedChainData" class="metric-tabs">
          <button
            v-for="metric in metrics"
            :key="metric.key"
            type="button"
            :class="{ active: selectedMetric === metric.key }"
            @click="selectedMetric = metric.key"
          >
            {{ metric.label }}
          </button>
        </div>

        <div v-if="loading" class="loading-list">
          <div v-for="n in 8" :key="n" class="loading-row" />
        </div>

        <div v-else-if="selectedChainData" class="chain-detail">
          <div class="detail-hero">
            <img
              :src="assetImage(baseChainAsset(selectedChainData.chain))"
              alt=""
              @error="imgErr"
            />
            <div>
              <strong>{{ selectedChainData.chain }}</strong>
              <small>{{ chainName(selectedChainData.chain) }}</small>
            </div>
          </div>

          <div class="detail-stats">
            <div>
              <span>Volume</span>
              <strong>{{ compactCurrency(selectedChainData.volume) }}</strong>
            </div>
            <div>
              <span>Txs</span>
              <strong>{{ selectedChainData.txs | number('0,0') }}</strong>
            </div>
            <div>
              <span>DAU</span>
              <strong>{{ selectedChainData.dau | number('0,0') }}</strong>
            </div>
          </div>

          <div class="counterparty-header">
            <span>Counterparties</span>
            <strong>{{ selectedCounterpartyRows.length }}</strong>
          </div>
          <div class="counterparty-list">
            <button
              v-for="row in selectedCounterpartyRows"
              :key="row.chain"
              type="button"
              class="chain-row compact"
              @click="selectChain(row.chain)"
            >
              <img
                class="row-icon"
                :src="assetImage(baseChainAsset(row.chain))"
                alt=""
                @error="imgErr"
              />
              <span class="chain-name">
                <strong>{{ chainName(row.chain) }}</strong>
                <small>{{ row.chain }}</small>
              </span>
              <span class="chain-value">
                <strong>{{ compactCurrency(row.volume) }}</strong>
                <small>{{ row.count | number('0,0') }} txs</small>
              </span>
            </button>
          </div>

          <button type="button" class="back-button" @click="clearSelection">
            Back
          </button>
        </div>

        <div v-else class="chain-list">
          <button
            v-for="(chain, index) in rankedChains"
            :key="`${chain.chain}-${selectedMetric}`"
            type="button"
            class="chain-row"
            :class="{ active: selectedChain === chain.chain }"
            @click="selectChain(chain.chain)"
          >
            <span class="rank">{{ index + 1 }}</span>
            <img
              class="row-icon"
              :src="assetImage(baseChainAsset(chain.chain))"
              alt=""
              @error="imgErr"
            />
            <span class="chain-name">
              <strong>{{ chainName(chain.chain) }}</strong>
              <small>{{ chain.chain }}</small>
            </span>
            <span class="chain-value">{{ metricValue(chain) }}</span>
          </button>
        </div>

        <div class="summary">
          <div>
            <span>Total</span>
            <strong>{{ selectedMetricTotal }}</strong>
          </div>
          <div>
            <span>Connected chains</span>
            <strong>{{ chains.length }}</strong>
          </div>
          <div>
            <span>Activity source</span>
            <strong>All cross-chain actions</strong>
          </div>
        </div>
      </aside>
    </section>
  </Page>
</template>

<script>
import RefreshIcon from '~/assets/images/refresh.svg?inline'
import AngleIcon from '~/assets/images/angle-down.svg?inline'

export default {
  components: { RefreshIcon, AngleIcon },
  data() {
    return {
      loading: true,
      selectedMetric: 'volume',
      selectedPeriod: '24h',
      selectedChain: null,
      periodDropdownOpen: false,
      chains: [],
      swapLinks: [],
      scale: 1,
      translate: {
        x: 0,
        y: 0,
      },
      panStart: null,
      metrics: [
        { key: 'volume', label: 'Volume' },
        { key: 'txs', label: 'Txs' },
        { key: 'dau', label: 'DAU', titleLabel: 'Daily Active Users' },
      ],
      periods: [
        { text: '24h', mode: '24h' },
        { text: '7d', mode: '7d' },
        { text: '30d', mode: '30d' },
      ],
      chainLabels: {
        AVAX: 'Avalanche',
        BASE: 'Base',
        BCH: 'Bitcoin Cash',
        BSC: 'BNB Chain',
        BTC: 'Bitcoin',
        DOGE: 'Dogecoin',
        ETH: 'Ethereum',
        GAIA: 'Cosmos Hub',
        LTC: 'Litecoin',
        SOL: 'Solana',
        TRON: 'Tron',
        XRP: 'XRP',
      },
    }
  },
  head: {
    title: 'THORChain Network Explorer | Map of Chains',
  },
  computed: {
    selectedMetricLabel() {
      const metric = this.metrics.find(
        (entry) => entry.key === this.selectedMetric
      )
      return metric?.titleLabel || metric?.label
    },
    rankedChains() {
      return [...this.chains].sort(
        (a, b) =>
          Number(b[this.selectedMetric]) - Number(a[this.selectedMetric])
      )
    },
    positionedChains() {
      const ranked = [...this.chains].sort((a, b) => b.volume - a.volume)
      const prominent = ['BTC', 'ETH', 'BASE']
      const ordered = [
        ...prominent
          .map((chain) => ranked.find((item) => item.chain === chain))
          .filter(Boolean),
        ...ranked.filter((item) => !prominent.includes(item.chain)),
      ]

      return ordered.map((chain, index) => {
        const angle = (index / Math.max(ordered.length, 1)) * Math.PI * 2 - 1.45
        const radius = index < 3 ? 220 : 300 + (index % 2) * 42

        return {
          ...chain,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        }
      })
    },
    displayedChains() {
      if (!this.selectedChain) return this.positionedChains

      const selected = this.positionedChains.find(
        (chain) => chain.chain === this.selectedChain
      )
      const counterparties = this.selectedCounterparties
      const related = this.positionedChains.filter((chain) =>
        counterparties.includes(chain.chain)
      )
      const unrelated = this.positionedChains.filter(
        (chain) =>
          chain.chain !== this.selectedChain &&
          !counterparties.includes(chain.chain)
      )
      const ordered = selected
        ? [selected, ...related, ...unrelated]
        : [...related, ...unrelated]

      return ordered.map((chain, index) => {
        if (chain.chain === this.selectedChain) {
          return {
            ...chain,
            x: 0,
            y: -40,
          }
        }

        const isRelated = counterparties.includes(chain.chain)
        const relatedIndex = Math.max(
          related.findIndex((item) => item.chain === chain.chain),
          0
        )
        const unrelatedIndex = Math.max(
          unrelated.findIndex((item) => item.chain === chain.chain),
          0
        )
        const angleSource = isRelated ? relatedIndex : unrelatedIndex
        const divisor = Math.max(
          isRelated ? related.length : unrelated.length,
          1
        )
        const angle = (angleSource / divisor) * Math.PI * 2 - 1.35
        const radius = isRelated ? 250 : 340

        return {
          ...chain,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius + 18,
        }
      })
    },
    thorPosition() {
      return this.selectedChain ? { x: 0, y: 112 } : { x: 0, y: 0 }
    },
    mapTransform() {
      return `translate(${this.translate.x} ${this.translate.y}) scale(${this.scale})`
    },
    totalVolume() {
      return this.chains.reduce((sum, chain) => sum + chain.volume, 0)
    },
    totalTxs() {
      return this.chains.reduce((sum, chain) => sum + chain.txs, 0)
    },
    totalDau() {
      return this.chains.reduce((sum, chain) => sum + chain.dau, 0)
    },
    selectedMetricTotal() {
      if (this.selectedMetric === 'volume') {
        return this.compactCurrency(this.totalVolume)
      }

      return this.$options.filters.number(
        this.selectedMetric === 'txs' ? this.totalTxs : this.totalDau,
        '0,0'
      )
    },
    positionByChain() {
      return this.displayedChains.reduce((acc, chain) => {
        acc[chain.chain] = chain
        return acc
      }, {})
    },
    visibleSwapLinks() {
      return [...this.swapLinks]
        .filter(
          (link) =>
            this.positionByChain[link.source] &&
            this.positionByChain[link.target] &&
            (!this.selectedChain || this.isSelectedLink(link))
        )
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 48)
    },
    meshLinks() {
      const chains = this.positionedChains.map((chain) => chain.chain)
      const links = []

      chains.forEach((source, sourceIndex) => {
        chains.slice(sourceIndex + 1).forEach((target) => {
          links.push({ source, target })
        })
      })

      return links
    },
    maxSwapLinkVolume() {
      return Math.max(...this.visibleSwapLinks.map((link) => link.volume), 1)
    },
    selectedChainData() {
      return this.chains.find((chain) => chain.chain === this.selectedChain)
    },
    selectedCounterpartyRows() {
      if (!this.selectedChain) return []
      const chainCodes = this.chains.map((chain) => chain.chain)
      const totals = {}

      this.swapLinks
        .filter((link) => this.isSelectedLink(link))
        .forEach((link) => {
          const chain =
            link.source === this.selectedChain ? link.target : link.source
          if (chainCodes.includes(chain)) {
            if (!totals[chain]) totals[chain] = { count: 0, volume: 0 }
            totals[chain].count += link.count
            totals[chain].volume += link.volume
          }
        })

      return Object.entries(totals)
        .map(([chain, { count, volume }]) => ({ chain, count, volume }))
        .sort((a, b) => b.volume - a.volume)
    },
    selectedCounterparties() {
      return this.selectedCounterpartyRows.map((row) => row.chain)
    },
  },
  mounted() {
    this.loadMap()
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleClickOutside)
  },
  methods: {
    async loadMap() {
      this.loading = true

      try {
        const endpoint = {
          '24h': this.$api.getChains,
          '7d': this.$api.getChainsWeekly,
          '30d': this.$api.getChainsMonthly,
        }[this.selectedPeriod]

        const res = await endpoint()
        const { chains, interactions } = res.data

        this.chains = (chains || [])
          .filter((c) => c.chain !== 'THOR')
          .map((c) => ({
            chain: c.chain,
            volume: c.volumeUSD / 1e8,
            txs: c.txCount,
            dau: c.uniqueAddresses,
          }))
          .sort((a, b) => b.volume - a.volume)

        const linkMap = {}
        ;(interactions || []).forEach((i) => {
          const key = [i.chainIn, i.chainOut].sort().join('-')
          if (!linkMap[key]) {
            const [source, target] = [i.chainIn, i.chainOut].sort()
            linkMap[key] = { source, target, count: 0, volume: 0 }
          }
          linkMap[key].count += i.txCount
          linkMap[key].volume += i.volumeUSD / 1e8
        })
        this.swapLinks = Object.values(linkMap)

        this.selectedChain = null
      } catch (error) {
        console.error('Failed to load map of chains:', error)
      } finally {
        this.loading = false
      }
    },
    linkPath(chain) {
      const controlX = (chain.x + this.thorPosition.x) * 0.24
      const controlY = (chain.y + this.thorPosition.y) * 0.24
      return `M ${this.thorPosition.x} ${this.thorPosition.y} Q ${controlX} ${controlY} ${chain.x} ${chain.y}`
    },
    linkStyle(chain) {
      const width =
        1.8 + Math.min(chain.volume / Math.max(this.totalVolume, 1), 0.3) * 20
      return {
        '--link-color': this.getChainColor(chain.chain),
        '--link-width': `${width}px`,
      }
    },
    swapPath(link) {
      const source = this.positionByChain[link.source]
      const target = this.positionByChain[link.target]
      if (!source || !target) return ''

      const controlX = this.selectedChain ? 0 : this.thorPosition.x
      const controlY = this.selectedChain ? -8 : this.thorPosition.y
      return `M ${source.x} ${source.y} Q ${controlX} ${controlY} ${target.x} ${target.y}`
    },
    swapLinkStyle(link) {
      const width = 1.4 + (link.volume / this.maxSwapLinkVolume) * 5
      return {
        stroke: this.getChainColor(link.target),
        strokeWidth: `${width}px`,
      }
    },
    nodeRadius(chain) {
      const max = Math.max(...this.chains.map((entry) => entry.volume), 1)
      return 34 + Math.sqrt(chain.volume / max) * 22
    },
    iconSize(chain) {
      return this.nodeRadius(chain) - 16
    },
    metricValue(chain) {
      if (this.selectedMetric === 'volume') {
        return this.compactCurrency(chain.volume)
      }
      return this.$options.filters.number(
        chain[this.selectedMetric] || 0,
        '0,0'
      )
    },
    compactCurrency(value) {
      return `$${this.$options.filters.number(value || 0, '0.00a')}`
    },
    chainName(chain) {
      return this.chainLabels[chain] || chain
    },
    nodeTransform(position) {
      return {
        transform: `translate(${position.x}px, ${position.y}px)`,
      }
    },
    handleClickOutside(event) {
      const dropdown = this.$el?.querySelector('.period-dropdown')
      if (dropdown && !dropdown.contains(event.target)) {
        this.periodDropdownOpen = false
      }
    },
    onPeriodChange(period) {
      this.selectedPeriod = period
      this.periodDropdownOpen = false
      this.loadMap()
    },
    selectChain(chain) {
      this.selectedChain = chain
    },
    clearSelection() {
      this.selectedChain = null
    },
    isSelectedLink(link) {
      if (!this.selectedChain) return false

      return (
        link.source === this.selectedChain || link.target === this.selectedChain
      )
    },
    isSelectedCounterparty(chain) {
      if (!this.selectedChain) return false

      return (
        chain === this.selectedChain ||
        this.selectedCounterparties.includes(chain)
      )
    },
    zoomIn() {
      this.scale = Math.min(this.scale + 0.12, 2.4)
    },
    zoomOut() {
      this.scale = Math.max(this.scale - 0.12, 0.55)
    },
    resetView() {
      this.scale = 1
      this.translate = { x: 0, y: 0 }
    },
    handleWheel(event) {
      const delta = event.deltaY > 0 ? -0.08 : 0.08
      this.scale = Math.min(Math.max(this.scale + delta, 0.55), 2.4)
    },
    startPan(event) {
      this.panStart = {
        x: event.clientX,
        y: event.clientY,
        translate: { ...this.translate },
      }
    },
    pan(event) {
      if (!this.panStart) return

      this.translate = {
        x: this.panStart.translate.x + (event.clientX - this.panStart.x),
        y: this.panStart.translate.y + (event.clientY - this.panStart.y),
      }
    },
    endPan() {
      this.panStart = null
    },
  },
}
</script>

<style lang="scss" scoped>
.mapofchains {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: $space-16;
  min-height: calc(var(--vh, 1vh) * 100 - 210px);
}

.map-shell,
.rank-panel {
  border: 1px solid var(--border-color);
  border-radius: $radius-lg;
  background: var(--card-bg-color);
}

.map-shell {
  display: flex;
  flex-direction: column;
  min-height: 680px;
  overflow: hidden;
}

.map-toolbar,
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-12;
  padding: $space-20;
  border-bottom: 1px solid var(--border-color);
}

.eyebrow {
  color: var(--primary-color);
  font-size: $font-size-xs;
  font-weight: 700;
  text-transform: uppercase;
}

h1,
h2 {
  margin: $space-4 0 0;
  color: var(--sec-font-color);
  font-size: $font-size-xl;
  line-height: 1.2;
}

h2 {
  font-size: $font-size-lg;
}

.toolbar-actions,
.metric-tabs {
  display: flex;
  align-items: center;
  gap: $space-8;
}

button {
  color: var(--sec-font-color);
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-md;
  cursor: pointer;

  &:hover {
    background: var(--active-bg-color);
    color: var(--primary-color);
  }
}

.toolbar-actions {
  gap: $space-6;
}

.map-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  font-size: $font-size-md;
  font-weight: 600;

  .btn-icon {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }
}

.map-viewport {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  cursor: grab;
  background:
    linear-gradient(rgba(135, 233, 181, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(135, 233, 181, 0.05) 1px, transparent 1px),
    radial-gradient(
      circle at center,
      rgba(44, 190, 140, 0.15),
      transparent 42%
    ),
    var(--bg-color);
  background-size:
    44px 44px,
    44px 44px,
    100% 100%,
    100% 100%;
}

.map-viewport:active {
  cursor: grabbing;
}

.chain-map {
  width: 100%;
  height: 100%;
  min-height: 600px;
  display: block;
}

.orbit {
  fill: none;
  stroke: var(--border-color);
  stroke-dasharray: 8 14;
}

.orbit-secondary {
  opacity: 0.6;
}

.links path {
  fill: none;
  stroke: var(--link-color);
  stroke-width: var(--link-width);
  stroke-linecap: round;
  opacity: 0.44;
  transition: opacity 0.25s ease;
}

.links.focused path {
  opacity: 0.22;
}

.mesh-links path {
  fill: none;
  stroke: rgba(224, 233, 239, 0.22);
  stroke-width: 1;
  stroke-linecap: round;
  opacity: 0.28;
  transition:
    opacity 0.25s ease,
    stroke 0.25s ease;
}

.mesh-links.focused path {
  opacity: 0.06;
}

.mesh-links.focused path.connected {
  stroke: rgba(224, 233, 239, 0.5);
  opacity: 0.34;
}

.swap-links path {
  fill: none;
  stroke-linecap: round;
  stroke-dasharray: 7 9;
  opacity: 0.68;
  transition:
    opacity 0.25s ease,
    stroke-width 0.25s ease;
}

.swap-links.focused path {
  opacity: 0.88;
}

.thor-core {
  fill: var(--card-bg-color);
  stroke: var(--primary-color);
  stroke-width: 2;
}

.node-core {
  fill: var(--card-bg-color);
  stroke: var(--node-color, var(--primary-color));
  stroke-width: 2;
}

.node-halo {
  fill: var(--card-bg-color);
  stroke: var(--border-color);
  stroke-width: 1.5;
  opacity: 0.94;
}

.thor-node,
.chain-node {
  cursor: pointer;
  transform-box: fill-box;
  transform-origin: center;
  transition:
    opacity 0.25s ease,
    transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);

  image {
    clip-path: circle(50%);
  }

  &.selected .node-halo {
    stroke: var(--node-color, var(--primary-color));
    stroke-width: 3;
  }

  &.muted {
    opacity: 0.34;
  }
}

.thor-node {
  cursor: default;

  &.selectable {
    cursor: pointer;
  }
}

.node-label {
  fill: var(--sec-font-color);
  font-size: 14px;
  font-weight: 700;
}

.node-metric {
  fill: var(--font-color);
  font-size: 12px;
}

.center {
  text-anchor: middle;
}

.rank-panel {
  display: flex;
  flex-direction: column;
  min-height: 680px;
  overflow: hidden;
}

.period-dropdown {
  position: relative;
}

.period-trigger {
  display: flex;
  align-items: center;
  gap: $space-8;
  padding: $space-8 $space-12;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-md;
  color: var(--sec-font-color);
  font-size: $font-size-sm;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: var(--active-bg-color);
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  .dropdown-arrow {
    width: 14px;
    height: 14px;
    fill: currentColor;
    transition: transform 0.2s ease;

    &.rotated {
      transform: rotate(180deg);
    }
  }
}

.period-menu {
  position: absolute;
  top: calc(100% + $space-5);
  right: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-5;
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-md;
  z-index: 100;
  min-width: 100%;
}

.period-option {
  padding: $space-8 $space-12;
  text-align: center;
  background: transparent;
  border-color: transparent;
  border-radius: $radius-s;
  color: var(--font-color);
  font-size: $font-size-sm;
  cursor: pointer;

  &:hover,
  &.active {
    background: var(--active-bg-color);
    border-color: var(--border-color);
    color: var(--primary-color);
  }
}

.metric-tabs {
  padding: $space-12 $space-20;
  border-bottom: 1px solid var(--border-color);

  button {
    flex: 1;
    height: 34px;
    font-size: $font-size-s;

    &.active {
      color: var(--bubble-font-color);
      background: var(--primary-color);
      border-color: var(--primary-color);
    }
  }
}

.chain-list {
  overflow: auto;
  padding: $space-8;
}

.chain-row {
  display: grid;
  grid-template-columns: 28px 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: $space-10;
  width: 100%;
  min-height: 58px;
  padding: $space-8;
  text-align: left;
  background: transparent;
  border-color: transparent;

  &:hover,
  &.active {
    background: var(--active-bg-color);
    border-color: var(--border-color);
  }
}

.rank {
  color: var(--font-color);
  font-size: $font-size-s;
  text-align: center;
}

.row-icon {
  width: 30px;
  height: 30px;
  border-radius: $radius-full;
}

.chain-name {
  min-width: 0;

  strong,
  small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: var(--sec-font-color);
    font-size: $font-size-sm;
  }

  small {
    margin-top: $space-2;
    color: var(--font-color);
    font-size: $font-size-xs;
  }
}

.chain-value {
  color: var(--sec-font-color);
  font-family: monospace;
  font-size: $font-size-sm;
  text-align: right;

  strong,
  small {
    display: block;
  }

  small {
    color: var(--font-color);
    font-size: $font-size-xs;
  }
}

.chain-detail {
  display: flex;
  flex-direction: column;
  gap: $space-16;
  overflow: auto;
  padding: $space-20;
}

.detail-hero {
  display: flex;
  align-items: center;
  gap: $space-12;

  img {
    width: 54px;
    height: 54px;
    border-radius: $radius-full;
  }

  strong,
  small {
    display: block;
  }

  strong {
    color: var(--sec-font-color);
    font-size: $font-size-xl;
  }

  small {
    color: var(--font-color);
    font-size: $font-size-sm;
  }
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $space-8;

  div {
    padding: $space-12;
    border: 1px solid var(--border-color);
    border-radius: $radius-md;
    background: var(--active-bg-color);
  }

  span,
  strong {
    display: block;
  }

  span {
    color: var(--font-color);
    font-size: $font-size-xs;
  }

  strong {
    margin-top: $space-4;
    color: var(--sec-font-color);
    font-size: $font-size-sm;
  }
}

.counterparty-header {
  display: flex;
  justify-content: space-between;
  color: var(--font-color);
  font-size: $font-size-s;

  strong {
    color: var(--sec-font-color);
  }
}

.counterparty-list {
  display: grid;
  gap: $space-6;
}

.chain-row.compact {
  grid-template-columns: 34px minmax(0, 1fr) auto;
  min-height: 52px;
}

.back-button {
  height: 38px;
  color: var(--bubble-font-color);
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.summary {
  display: grid;
  gap: $space-8;
  margin-top: auto;
  padding: $space-16 $space-20 $space-20;
  border-top: 1px solid var(--border-color);

  div {
    display: flex;
    justify-content: space-between;
    gap: $space-12;
    color: var(--font-color);
    font-size: $font-size-s;
  }

  strong {
    color: var(--sec-font-color);
  }
}

.loading-list {
  display: grid;
  gap: $space-8;
  padding: $space-16;
}

.loading-row {
  height: 50px;
  border-radius: $radius-md;
  background: var(--active-bg-color);
  opacity: 0.8;
}

@media (max-width: 1100px) {
  .mapofchains {
    grid-template-columns: 1fr;
  }

  .map-shell,
  .rank-panel {
    min-height: auto;
  }

  .rank-panel {
    max-height: none;
  }
}

@media (max-width: 640px) {
  .map-toolbar,
  .panel-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .toolbar-actions,
  .metric-tabs {
    width: 100%;
  }

  .toolbar-actions button {
    flex: 1;
  }

  .chain-map {
    min-height: 500px;
  }
}
</style>
