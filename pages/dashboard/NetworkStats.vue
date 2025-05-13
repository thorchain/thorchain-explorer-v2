<template>
  <div class="network-stats">
    <div class="stat-group">
      <nuxt-link to="/swaps" class="stat-item stat-item-link">
        <Chart class="stat-image" />
        <div class="item-detail">
          <div class="header">Volume (24hr)</div>
          <skeleton-item
            :loading="loading || totalSwap24USD === null"
            class="value"
          >
            ${{ (totalSwap24USD / 1e2) | number('0a') }}
          </skeleton-item>
        </div>
        <arrow-right-icon class="arrow-icon" />
      </nuxt-link>
      <hr />
      <nuxt-link to="/insights" class="stat-item stat-item-link">
        <Exchange class="stat-image" />
        <div class="item-detail">
          <div class="header">Swaps (24hr)</div>
          <skeleton-item :loading="loading" class="value">
            {{ stats.swapCount24h | number('0,0') }}
          </skeleton-item>
        </div>
        <arrow-right-icon class="arrow-icon" />
      </nuxt-link>
      <hr />
    </div>
    <div class="stat-group">
      <nuxt-link to="/pools/tvl" class="stat-item stat-item-link">
        <LockIcon class="stat-image" />
        <div class="item-detail">
          <div class="header">TVL (Pool + Bond)</div>
          <skeleton-item :loading="loading" class="value">
            ${{ tvl | number('0a') }}
          </skeleton-item>
        </div>
        <arrow-right-icon class="arrow-icon" />
      </nuxt-link>
      <hr />
      <nuxt-link to="/pools" class="stat-item stat-item-link">
        <Piggy class="stat-image" />
        <div class="item-detail">
          <div class="header">Bond | Pool APY</div>
          <skeleton-item :loading="loading" class="value">
            {{ network.bondingAPY | percent(2) }} |
            {{ network.liquidityAPY | percent(2) }}
          </skeleton-item>
        </div>
        <arrow-right-icon class="arrow-icon" />
      </nuxt-link>
      <hr />
    </div>
    <div class="stat-group">
      <div class="stat-item">
        <Burn class="stat-image" />
        <div class="item-detail">
          <div class="header">Total | Circulating | Burned</div>
          <skeleton-item :loading="loading" class="value">
            {{ runeSupply | number('0a') }} | {{ circulating | number('0a') }} |
            {{ totalBurnedRune | number('0a') }}
          </skeleton-item>
        </div>
      </div>
      <hr />
      <div class="stat-item">
        <StackDollar class="stat-image" />
        <div class="item-detail">
          <div class="header">Earnings (24hr)</div>
          <skeleton-item :loading="loading" class="value">
            ${{ totalEarning24 | number('0a') }}
          </skeleton-item>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from '~/assets/images/chart.svg?inline'
import Exchange from '~/assets/images/exchange.svg?inline'
import LockIcon from '~/assets/images/lock.svg?inline'
import Piggy from '~/assets/images/piggy.svg?inline'
import Burn from '~/assets/images/burn.svg?inline'
import StackDollar from '~/assets/images/sack-dollar.svg?inline'
import ArrowRightIcon from '~/assets/images/arrowup.svg?inline'

export default {
  components: {
    Chart,
    Exchange,
    LockIcon,
    Piggy,
    Burn,
    StackDollar,
    ArrowRightIcon,
  },
  data() {
    return {
      loading: true,
      totalSwap24USD: 0,
      stats: {
        swapCount24h: 0,
        swapVolume: 0,
        withdrawVolume: 0,
        addLiquidityVolume: 0,
        earnings24: 0,
        runePriceUSD: 0,
      },
      network: {
        bondMetrics: {
          totalActiveBond: 0,
          totalStandbyBond: 0,
        },
        totalPooledRune: 0,
        totalReserve: 0,
        bondingAPY: 0,
        liquidityAPY: 0,
      },
      totalBurnedRune: 0,
      runeSupply: 0,
    }
  },
  computed: {
    tvl() {
      if (!this.network?.bondMetrics || !this.network?.totalPooledRune) return 0
      return (
        ((+this.network.totalPooledRune * 2 +
          +this.network.bondMetrics.totalActiveBond) *
          this.stats.runePriceUSD) /
        1e8
      )
    },
    circulating() {
      return +this.runeSupply - (+this.network?.totalReserve || 0) / 1e8
    },
    runeVolume() {
      return (
        (+this.stats.swapVolume +
          +this.stats.withdrawVolume +
          +this.stats.addLiquidityVolume) /
        10 ** 8
      )
    },
    totalEarning24() {
      return (this.stats.earnings24 / 1e8) * this.stats.runePriceUSD
    },
  },
  async mounted() {
    await this.fetchData()
  },
  methods: {
    async fetchData() {
      try {
        this.loading = true
        const { data: dashboardData } = await this.$api.getDashboardData()
        if (dashboardData) {
          this.stats = dashboardData.stats || {}
          this.runeSupply = +dashboardData.runeSupply?.amount?.amount / 1e8 || 0
          this.network = dashboardData.networkData || {}
          this.totalSwap24USD = +dashboardData.stats?.volume24USD || 0
        }

        const { data: earningsData } = await this.$api.getEarnings()
        if (earningsData) {
          const burnedPool = earningsData.meta?.pools?.find(
            (p) => p.pool === 'income_burn'
          )
          this.totalBurnedRune = burnedPool ? burnedPool.earnings / 1e8 : 0
        }
      } catch (error) {
        console.error('Error fetching network stats:', error)
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.network-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: $space-0 $space-10;

  .stat-item {
    display: flex;
    align-items: center;

    .header {
      color: var(--font-color);
      font-size: $font-size-sm;
    }

    .value {
      .extra {
        color: var(--font-color);
        font-size: $font-size-xs;
      }
    }

    .stat-image {
      margin-right: $space-12;
      width: 2rem;
      height: 2rem;
      fill: var(--sec-font-color);
    }

    .item-detail {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      .value {
        font-size: $font-size-desktop;
        font-weight: bold;
        color: var(--sec-font-color);
        @include lg {
          font-size: $font-size-md;
        }
      }
    }

    &.stat-item-link {
      text-decoration: none;

      .arrow-icon {
        display: none;
        fill: var(--sec-font-color);
        height: 0.9rem;
        width: 1rem;
        margin-left: auto;
        transform: rotate(43deg);
        align-self: flex-start;
      }

      &:hover {
        .header {
          color: var(--sec-font-color);
        }
        .value {
          color: var(--primary-color);
        }
        .arrow-icon {
          display: block;
          fill: var(--primary-color);
        }
      }
    }
  }

  hr {
    margin: $space-12 $space-0;
    opacity: 0.65;
    overflow: visible;
    height: 0;
    border: 0;
    border-top: 1px solid var(--border-color);
  }

  .stat-group {
    border: 1px solid var(--border-color);
    min-width: 280px;
    background-color: var(--bg-color);
    border-radius: $radius-lg;
    padding: $space-14;
    flex: 1;
  }
}

.stat-group hr:last-child {
  display: none;
}

@include md {
  .network-stats {
    padding: $space-0;
    justify-content: space-between;

    .stat-group {
      position: relative;
      padding: $space-16;
      flex: 1;

      &:last-of-type::after {
        display: none;
      }
    }
  }
}
</style>
