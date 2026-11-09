<template>
  <div class="vault-view">
    <!-- Header -->
    <div class="vv-header">
      <span class="vv-badge">AV</span>
      <div class="vv-identity">
        <div class="vv-title-row">
          <span class="vv-title">Asgard vault</span>
          <span :class="['vv-status', { 'vv-status--active': isActive }]">
            <span class="vv-status__dot" />
            {{ statusLabel }}
          </span>
        </div>
        <div class="vv-pubkey">
          <span v-tooltip="vault.pub_key" class="mono">
            {{ short(vault.pub_key, 14, 6) }}
          </span>
          <Copy :str-copy="vault.pub_key" size="small" />
        </div>
      </div>
      <span class="vv-spacer" />
      <div class="vv-header-actions">
        <span class="vv-btn-group">
          <button
            type="button"
            :class="['vv-btn', { 'vv-btn--on': panel === 'members' }]"
            @click="togglePanel('members')"
          >
            {{ (vault.membership || []).length }} node members
          </button>
          <nuxt-link
            v-tooltip="'Show members on the Nodes page'"
            :to="{ path: '/nodes', query: { search: thorAddress } }"
            class="vv-btn vv-btn--icon"
            aria-label="Show vault members on the Nodes page"
          >
            <svg
              aria-hidden="true"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
              />
              <path
                d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
              />
            </svg>
          </nuxt-link>
        </span>
        <button
          type="button"
          :class="['vv-btn', { 'vv-btn--on': panel === 'routers' }]"
          @click="togglePanel('routers')"
        >
          {{ (vault.routers || []).length }} routers
        </button>
      </div>
    </div>

    <div v-if="panel" class="vv-panel">
      <template v-if="panel === 'members'">
        <nuxt-link
          v-for="n in memberNodes"
          :key="n"
          :to="`/node/${n}`"
          class="vv-chip mono"
        >
          {{ short(n, 8, 6) }}
        </nuxt-link>
        <span v-if="!memberNodes.length" class="vv-muted">
          Loading node members…
        </span>
      </template>
      <template v-else>
        <nuxt-link
          v-for="r in vault.routers"
          :key="r.chain"
          :to="`/address/${r.router}`"
          class="vv-chip"
        >
          <img
            class="vv-icon-sm"
            :src="assetImage(baseChainAsset(r.chain))"
            @error="imgErr"
          />
          <span class="vv-chip__chain">{{ r.chain }}</span>
          <span class="mono">{{ short(r.router, 8, 6) }}</span>
        </nuxt-link>
      </template>
    </div>

    <!-- Stat strip -->
    <div class="vv-stats">
      <div class="vv-stat">
        <span class="vv-label">Vault value</span>
        <span class="vv-stat__big mono">{{ usd0(totalValue) }}</span>
      </div>
      <div class="vv-stat">
        <span class="vv-label">Holdings</span>
        <span class="vv-stat__val mono">
          {{ assetCount }}
          <small>assets on {{ groups.length }} chains</small>
        </span>
      </div>
      <div class="vv-stat">
        <span class="vv-label">Pending outbound</span>
        <span class="vv-stat__val vv-stat__val--warn mono">
          <template v-if="queueLoaded">
            {{ usd0(pendingValue) }}
            <small>· {{ outAll.length }} txs</small>
          </template>
          <template v-else>—</template>
        </span>
      </div>
      <div class="vv-stat">
        <span class="vv-label">Ins / Outs</span>
        <span class="vv-stat__val mono">
          {{ vault.inbound_tx_count | number('0,0') }}
          <span class="vv-faint">/</span>
          {{ vault.outbound_tx_count | number('0,0') }}
        </span>
      </div>
      <div class="vv-stat">
        <span class="vv-label">Created at block</span>
        <span class="vv-stat__val mono">
          {{ vault.block_height | number('0,0') }}
        </span>
      </div>
    </div>

    <div class="vv-body">
      <!-- Holdings by chain -->
      <div class="vv-col">
        <div class="vv-section-head">
          <div class="vv-section-title">
            <span>Holdings by chain</span>
            <small v-if="unpricedCount">{{ unpricedCount }} unpriced</small>
          </div>
          <div class="vv-section-actions">
            <button type="button" class="vv-btn-sm" @click="setAll(true)">
              Expand all
            </button>
            <button type="button" class="vv-btn-sm" @click="setAll(false)">
              Collapse all
            </button>
          </div>
        </div>

        <div v-if="totalValue > 0" class="vv-alloc">
          <div class="vv-alloc__bar">
            <span
              v-for="g in groups"
              :key="g.chain"
              v-tooltip="`${g.name} ${pct(g.share)}`"
              :style="{ background: g.color, width: g.share + '%' }"
            />
          </div>
          <div class="vv-alloc__legend">
            <span v-for="g in groups.slice(0, 6)" :key="g.chain">
              <i :style="{ background: g.color }" />
              {{ g.name }}
              <b class="mono">{{ pct(g.share) }}</b>
            </span>
          </div>
        </div>

        <div class="vv-table">
          <div class="vv-row vv-row--head">
            <span>Chain · Asset</span>
            <span class="r">Balance</span>
            <span class="r hide-sm">Price</span>
            <span class="r">Value</span>
            <span class="r hide-sm">Share</span>
          </div>

          <div v-for="g in groups" :key="g.chain" class="vv-group">
            <div class="vv-row vv-row--group">
              <div class="vv-group__main">
                <button
                  type="button"
                  class="vv-chevron"
                  :class="{ 'vv-chevron--closed': !isOpen(g.chain) }"
                  :aria-label="`Toggle ${g.name}`"
                  @click="toggle(g.chain)"
                >
                  ▾
                </button>
                <img
                  class="vv-icon"
                  :src="assetImage(baseChainAsset(g.chain))"
                  @error="imgErr"
                />
                <span class="vv-group__name">{{ g.name }}</span>
                <span v-if="g.address" class="vv-addr">
                  <span v-tooltip="g.address" class="mono">
                    {{ short(g.address, 10, 8) }}
                  </span>
                  <Copy :str-copy="g.address" size="small" />
                  <a
                    v-if="g.explorerUrl"
                    v-tooltip="'View on chain explorer'"
                    :href="g.explorerUrl"
                    target="_blank"
                    rel="noopener"
                    class="vv-ext"
                    :aria-label="`View ${g.name} address on explorer`"
                  >
                    <svg
                      aria-hidden="true"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M14 4h6v6" />
                      <path d="M20 4 10 14" />
                      <path
                        d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"
                      />
                    </svg>
                  </a>
                </span>
                <span class="vv-muted">
                  {{
                    g.assets.length === 1
                      ? '1 asset'
                      : `${g.assets.length} assets`
                  }}
                </span>
              </div>
              <span class="r mono vv-strong">{{ usd0(g.value) }}</span>
              <span class="r mono hide-sm">{{ pct(g.share) }}</span>
            </div>

            <template v-if="isOpen(g.chain)">
              <div
                v-for="a in g.assets"
                :key="a.asset"
                class="vv-row vv-row--asset"
              >
                <div class="vv-asset">
                  <img
                    class="vv-icon-sm"
                    :src="assetImage(a.asset)"
                    @error="imgErr"
                  />
                  <nuxt-link :to="`/pool/${a.asset}`" class="vv-asset__sym">
                    {{ a.ticker }}
                  </nuxt-link>
                  <span v-tooltip="a.contract" class="vv-asset__contract mono">
                    {{ a.contract ? short(a.contract, 6, 4) : 'Native' }}
                  </span>
                </div>
                <span class="r mono">{{ a.balance | number('0,0.0000') }}</span>
                <span class="r mono vv-dim hide-sm">
                  {{ a.price ? usdPrice(a.price) : '—' }}
                </span>
                <span :class="['r', 'mono', { 'vv-faint': !a.price }]">
                  {{ a.price ? usd2(a.value) : 'Unpriced' }}
                </span>
                <div class="r hide-sm">
                  <div class="vv-minibar">
                    <span
                      :style="{
                        background: g.color,
                        width: (g.value ? (a.value / g.value) * 100 : 0) + '%',
                      }"
                    />
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Ongoing outbounds -->
      <div class="vv-col">
        <div class="vv-section-head">
          <div class="vv-section-title">
            <span>Ongoing outbounds</span>
          </div>
          <small class="vv-muted">~6s blocks</small>
        </div>

        <div class="vv-tabs">
          <button
            v-for="f in filters"
            :key="f.key"
            type="button"
            :class="['vv-tab', { 'vv-tab--on': outFilter === f.key }]"
            @click="outFilter = f.key"
          >
            {{ f.key }}
            <span class="mono">{{ f.count }}</span>
          </button>
        </div>

        <div class="vv-outs">
          <div v-for="o in outbounds" :key="o.key" class="vv-out">
            <div class="vv-out__top">
              <img class="vv-icon" :src="assetImage(o.asset)" @error="imgErr" />
              <div class="vv-out__amt">
                <span>
                  <b class="mono">{{
                    o.amount | number(o.amount < 100 ? '0,0.0000' : '0,0')
                  }}</b>
                  <span class="vv-dim">{{ o.ticker }}</span>
                </span>
                <span v-if="o.usd" class="vv-muted mono">
                  ≈ {{ usd0(o.usd) }}
                </span>
              </div>
              <span class="vv-type">{{ o.type }}</span>
              <span :class="['vv-pill', `vv-pill--${o.status.toLowerCase()}`]">
                <span class="vv-status__dot" />
                {{ o.status }}
              </span>
            </div>
            <div class="vv-out__addr">
              <span class="vv-faint">To</span>
              <span v-tooltip="o.to" class="mono vv-ellipsis">
                {{ short(o.to, 10, 8) }}
              </span>
              <a
                v-if="o.toUrl"
                :href="o.toUrl"
                target="_blank"
                rel="noopener"
                class="vv-ext"
                aria-label="View recipient on chain explorer"
              >
                <svg
                  aria-hidden="true"
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M14 4h6v6" />
                  <path d="M20 4 10 14" />
                  <path
                    d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"
                  />
                </svg>
              </a>
              <span class="vv-spacer" />
              <span class="vv-faint">In</span>
              <nuxt-link :to="`/tx/${o.inHash}`" class="mono">
                {{ short(o.inHash, 4, 4) }}
              </nuxt-link>
            </div>
            <div v-if="o.status === 'Scheduled'" class="vv-out__sched">
              <span>
                Out at
                <b class="mono">{{ o.height | number('0,0') }}</b>
              </span>
              <span v-if="o.blocksLeft !== undefined">
                <b class="mono">{{ o.blocksLeft | number('0,0') }}</b>
                blocks · {{ eta(o.blocksLeft) }}
              </span>
            </div>
          </div>
          <div v-if="!queueLoaded" class="vv-empty">Loading outbounds…</div>
          <div v-else-if="!outbounds.length" class="vv-empty">
            No outbounds in this state
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { assetFromString, getExplorerAddressUrl } from '~/utils'

const QUEUE_POLL_MS = 30000

export default {
  props: {
    vault: { type: Object, required: true },
  },
  data() {
    return {
      open: {},
      panel: null,
      outFilter: 'All',
      scheduled: [],
      outQueue: [],
      queueLoaded: false,
      pollId: undefined,
    }
  },
  computed: {
    ...mapGetters({
      pools: 'getPools',
      chainsHeight: 'getChainsHeight',
      nodes: 'getNodesData',
    }),
    memberNodes() {
      const members = new Set(this.vault.membership || [])
      return (this.nodes || [])
        .filter((n) => members.has(n?.pub_key_set?.secp256k1))
        .map((n) => n.node_address)
    },
    thorAddress() {
      return (this.vault.addresses || []).find((a) => a.chain === 'THOR')
        ?.address
    },
    isActive() {
      return this.vault.status === 'ActiveVault'
    },
    statusLabel() {
      return (this.vault.status || '').replace(/Vault$/, '') || 'Unknown'
    },
    holdings() {
      // Same dust cut-off the old balance table used.
      return (this.vault.coins || [])
        .filter((c) => +c.amount >= 1e3)
        .map((c) => {
          const parsed = assetFromString(c.asset) || {}
          const price = this.amountToUSD(c.asset, 1e8, this.pools) || 0
          return {
            asset: c.asset,
            chain: parsed.chain || c.asset.split('.')[0],
            ticker: parsed.ticker || c.asset,
            contract: parsed.symbol?.includes('-')
              ? parsed.symbol.split('-').slice(1).join('-')
              : '',
            balance: +c.amount / 1e8,
            price,
            value: (+c.amount / 1e8) * price,
          }
        })
    },
    totalValue() {
      return this.holdings.reduce((s, a) => s + a.value, 0)
    },
    assetCount() {
      return this.holdings.length
    },
    unpricedCount() {
      return this.holdings.filter((a) => !a.price).length
    },
    groups() {
      const addrs = {}
      ;(this.vault.addresses || []).forEach((a) => {
        addrs[a.chain] = a.address
      })
      const byChain = {}
      this.holdings.forEach((a) => {
        ;(byChain[a.chain] = byChain[a.chain] || []).push(a)
      })
      const total = this.totalValue
      return Object.entries(byChain)
        .map(([chain, assets]) => {
          const value = assets.reduce((s, a) => s + a.value, 0)
          const address = addrs[chain]
          return {
            chain,
            name: this.chainName(chain),
            color: this.getChainColor(chain),
            address,
            explorerUrl: address
              ? getExplorerAddressUrl(chain, address)
              : undefined,
            assets: [...assets].sort(
              (a, b) => b.value - a.value || b.balance - a.balance
            ),
            value,
            share: total ? (value / total) * 100 : 0,
          }
        })
        .sort((a, b) => b.value - a.value)
    },
    outAll() {
      const mine = (q) =>
        q.filter((o) => o.vault_pub_key === this.vault.pub_key)
      const thorHeight = this.chainsHeight?.THOR
      const map = (o, status) => {
        const parsed = assetFromString(o.coin?.asset) || {}
        const amount = +(o.coin?.amount || 0) / 1e8
        return {
          key: `${status}-${o.in_hash}-${o.to_address}-${o.coin?.asset}-${o.height}`,
          status,
          asset: o.coin?.asset,
          ticker: parsed.ticker || o.coin?.asset,
          amount,
          usd: this.amountToUSD(o.coin?.asset, o.coin?.amount, this.pools),
          type: this.outType(o.memo),
          to: o.to_address,
          toUrl: o.to_address
            ? getExplorerAddressUrl(o.chain, o.to_address)
            : undefined,
          inHash: o.in_hash,
          height: o.height,
          blocksLeft:
            thorHeight && o.height
              ? Math.max(0, o.height - thorHeight)
              : undefined,
        }
      }
      const sched = mine(this.scheduled)
        .map((o) => map(o, 'Scheduled'))
        .sort((a, b) => a.height - b.height)
      const out = mine(this.outQueue).map((o) => map(o, 'Signing'))
      return [...out, ...sched]
    },
    pendingValue() {
      return this.outAll.reduce((s, o) => s + (o.usd || 0), 0)
    },
    filters() {
      return ['All', 'Scheduled', 'Signing'].map((key) => ({
        key,
        count:
          key === 'All'
            ? this.outAll.length
            : this.outAll.filter((o) => o.status === key).length,
      }))
    },
    outbounds() {
      if (this.outFilter === 'All') return this.outAll
      return this.outAll.filter((o) => o.status === this.outFilter)
    },
  },
  mounted() {
    this.fetchQueues()
    this.pollId = setInterval(this.fetchQueues, QUEUE_POLL_MS)
  },
  beforeDestroy() {
    clearInterval(this.pollId)
  },
  methods: {
    async fetchQueues() {
      const [sched, out] = await Promise.allSettled([
        this.$api.getScheduled(),
        this.$api.getOutbound(),
      ])
      if (sched.status === 'fulfilled') this.scheduled = sched.value.data || []
      if (out.status === 'fulfilled') this.outQueue = out.value.data || []
      this.queueLoaded = true
    },
    outType(memo = '') {
      const prefix = memo.split(':')[0].toUpperCase()
      return (
        {
          OUT: 'Out',
          REFUND: 'Refund',
          MIGRATE: 'Migrate',
          RAGNAROK: 'Ragnarok',
          CONSOLIDATE: 'Consolidate',
        }[prefix] ||
        prefix ||
        'Out'
      )
    },
    togglePanel(p) {
      this.panel = this.panel === p ? null : p
    },
    isOpen(chain) {
      return this.open[chain] !== false
    },
    toggle(chain) {
      this.$set(this.open, chain, !this.isOpen(chain))
    },
    setAll(v) {
      const o = {}
      this.groups.forEach((g) => {
        o[g.chain] = v
      })
      this.open = o
    },
    short(s, a, b) {
      if (!s) return ''
      return s.length > a + b + 1 ? `${s.slice(0, a)}…${s.slice(-b)}` : s
    },
    usd0(v) {
      return '$' + Math.round(v || 0).toLocaleString('en-US')
    },
    usd2(v) {
      return (
        '$' +
        (v || 0).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      )
    },
    usdPrice(p) {
      return p < 0.01 ? '$' + p.toFixed(5) : this.usd2(p)
    },
    pct(v) {
      if (!v) return '0%'
      if (v >= 10) return v.toFixed(1) + '%'
      if (v >= 0.1) return v.toFixed(2) + '%'
      return '<0.1%'
    },
    eta(blocks) {
      const secs = blocks * 6
      if (secs >= 3600) return `~${(secs / 3600).toFixed(1)}h`
      if (secs >= 60) return `~${Math.round(secs / 60)}m`
      return `~${secs}s`
    },
  },
}
</script>

<style lang="scss" scoped>
.vault-view {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px;
  margin: 0 $space-10;
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-2xl;
  color: var(--font-color);

  @include lg {
    margin: 0;
    padding: 22px;
  }
}

.mono {
  font-family: 'Roboto Mono', ui-monospace, monospace;
}
.r {
  text-align: right;
  justify-content: flex-end;
}
.vv-spacer {
  flex: 1;
}
.vv-muted {
  font-size: 11.5px;
  color: var(--font-color);
  opacity: 0.8;
  white-space: nowrap;
}
.vv-faint {
  color: var(--font-color);
  opacity: 0.6;
}
.vv-dim {
  color: var(--font-color);
}
.vv-strong {
  color: var(--sec-font-color);
  font-weight: 600;
}
.vv-label {
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--font-color);
  opacity: 0.8;
}
.vv-icon {
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
}
.vv-icon-sm {
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

/* Header */
.vv-header {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.vv-badge {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--primary-color) 35%, transparent);
}
.vv-identity {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}
.vv-title-row {
  display: flex;
  align-items: center;
  gap: 9px;
}
.vv-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--sec-font-color);
}
.vv-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 99px;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--warning-color);
  background: color-mix(in srgb, var(--warning-color) 13%, transparent);

  &--active {
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 12%, transparent);
    .vv-status__dot {
      animation: vv-pulse 1.6s infinite;
    }
  }
}
.vv-status__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
@keyframes vv-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
.vv-pubkey {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  min-width: 0;
}
.vv-header-actions {
  display: flex;
  gap: 8px;
}
.vv-btn,
.vv-btn-sm {
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  color: var(--font-color);
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  padding: 7px 11px;
  font-size: 11.5px;

  &:hover,
  &--on {
    color: var(--sec-font-color);
    border-color: var(--primary-color);
  }
}
.vv-btn-sm {
  padding: 5px 9px;
  border-radius: 6px;
  font-size: 11px;
}
.vv-btn-group {
  display: inline-flex;

  > .vv-btn:first-child {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
}
.vv-btn--icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: -1px;
  padding: 7px 9px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  color: var(--primary-color);
}
.vv-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-color);
}
.vv-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border-radius: 7px;
  border: 1px solid var(--border-color);
  font-size: 11.5px;
  color: var(--font-color);

  &:hover {
    color: var(--primary-color);
  }
}
.vv-chip__chain {
  font-weight: 600;
  color: var(--sec-font-color);
}

/* Stat strip */
.vv-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-color);
  overflow: hidden;

  @include md {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  @include lg {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
.vv-stat {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-right: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  margin: 0 -1px -1px 0;
  min-width: 0;

  small {
    font-family: inherit;
    font-size: 11.5px;
    font-weight: 500;
    color: var(--font-color);
    opacity: 0.85;
  }
}
.vv-stat__big {
  font-size: 19px;
  font-weight: 600;
  color: var(--sec-font-color);
}
.vv-stat__val {
  font-size: 15px;
  font-weight: 600;
  color: var(--sec-font-color);

  &--warn {
    color: var(--warning-color);
  }
}

/* Body layout */
.vv-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
  align-items: start;

  @include xl {
    grid-template-columns: minmax(0, 1fr) 400px;
  }
}
.vv-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.vv-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.vv-section-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 14px;
  font-weight: 700;
  color: var(--sec-font-color);

  small {
    font-size: 11.5px;
    font-weight: 500;
    color: var(--font-color);
  }
}
.vv-section-actions {
  display: flex;
  gap: 6px;
}

/* Allocation */
.vv-alloc {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.vv-alloc__bar {
  display: flex;
  height: 8px;
  gap: 2px;
  border-radius: 99px;
  overflow: hidden;
  background: var(--bg-color);

  span {
    display: block;
    height: 100%;
  }
}
.vv-alloc__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;

  span {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
  }
  i {
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }
  b {
    font-weight: 500;
    color: var(--sec-font-color);
  }
}

/* Holdings table */
.vv-table {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-color);
}
.vv-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px 110px;
  align-items: center;
  font-size: 12px;

  > span,
  > div {
    padding: 9px 12px;
    min-width: 0;
  }

  @include md {
    grid-template-columns: minmax(0, 1fr) 170px 100px 124px 84px;
  }
}
.hide-sm {
  display: none;

  @include md {
    display: flex;
  }
}
.vv-row--head {
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--font-color);
  border-bottom: 1px solid var(--border-color);
  background: var(--card-bg-color);

  > span {
    padding: 10px 12px;
  }
  > span:first-child {
    padding-left: 16px;
  }
}
.vv-group {
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: 0;
  }
}
.vv-row--group {
  background: color-mix(in srgb, var(--card-bg-color) 60%, transparent);

  .vv-group__main {
    grid-column: 1 / span 2;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;

    @include md {
      grid-column: 1 / span 3;
      flex-wrap: nowrap;
    }
  }
}
.vv-group__name {
  font-weight: 700;
  font-size: 13px;
  color: var(--sec-font-color);
  white-space: nowrap;
}
.vv-chevron {
  flex: none;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--font-color);
  cursor: pointer;
  transition: transform 0.15s;

  &--closed {
    transform: rotate(-90deg);
  }
  &:hover {
    color: var(--sec-font-color);
  }
}
.vv-addr {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px 3px 9px;
  border-radius: 7px;
  border: 1px solid var(--border-color);
  background: var(--card-bg-color);
  min-width: 0;
  font-size: 11.5px;

  > span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
.vv-ext {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 5px;
  color: var(--primary-color);

  &:hover {
    background: var(--card-bg-color);
  }
}
.vv-row--asset {
  border-top: 1px solid var(--border-color);
  color: var(--sec-font-color);

  &:hover {
    background: var(--card-bg-color);
  }
}
.vv-asset {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 16px !important;

  @include md {
    padding-left: 66px !important;
  }
}
.vv-asset__sym {
  font-weight: 600;
  font-size: 12.5px;
  color: var(--sec-font-color);
  white-space: nowrap;

  &:hover {
    color: var(--primary-color);
  }
}
.vv-asset__contract {
  font-size: 10.5px;
  color: var(--font-color);
  opacity: 0.75;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.vv-minibar {
  width: 52px;
  height: 4px;
  border-radius: 99px;
  background: var(--border-color);
  overflow: hidden;

  span {
    display: block;
    height: 100%;
  }
}

/* Outbounds */
.vv-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--surface-3-color);
}
.vv-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 8px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--text-dim-color);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;

  span {
    font-size: 10.5px;
    color: var(--text-dim-color);
  }
  &:hover {
    color: var(--sec-font-color);
  }
  &--on {
    background: var(--active-bg-color);
    color: var(--sec-font-color);
    font-weight: 600;

    span {
      color: var(--font-color);
    }
  }
}
.vv-outs {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-color);
  max-height: 720px;
  overflow-y: auto;
}
.vv-out {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 13px 14px;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: 0;
  }
  &:hover {
    background: var(--card-bg-color);
  }
}
.vv-out__top {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}
.vv-out__amt {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  font-size: 11px;

  b {
    font-size: 13px;
    font-weight: 600;
    color: var(--sec-font-color);
  }
}
.vv-type {
  flex: none;
  padding: 3px 7px;
  border-radius: 5px;
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.vv-pill {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 99px;
  font-size: 10.5px;
  font-weight: 600;

  .vv-status__dot {
    width: 5px;
    height: 5px;
  }
  &--scheduled {
    color: var(--warning-color);
    background: color-mix(in srgb, var(--warning-color) 13%, transparent);
  }
  &--signing {
    color: #5b9be0;
    background: rgba(91, 155, 224, 0.13);
  }
}
.vv-out__addr {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 11.5px;

  .vv-faint {
    font-size: 10.5px;
  }
}
.vv-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.vv-out__sched {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 10.5px;

  b {
    font-weight: 500;
    color: var(--sec-font-color);
  }
}
.vv-empty {
  padding: 28px 14px;
  text-align: center;
  font-size: 12px;
  color: var(--font-color);
}
</style>
