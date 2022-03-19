<template>
  <div class="overview-container">
    <div class="chart-container">
      <client-only>
        <volume-chart :chartSettings="volumeHistoryQuery"></volume-chart>
      </client-only>
    </div>
    <div class="break"></div>
    <div class="stats-container">
      <stat-table header="Stats" :tableSettings="statsSettings"></stat-table>
    </div>
    <div class="network-container">
      <stat-table header="Network" :tableSettings="networkSettings"></stat-table>
    </div>
  </div>
</template>

<script>
import {networkQuery, volumeHistoryQuery} from '~/_gql_queries'

export default {
  components: { 
    volumeChart: () => {
      if(process.client) {
        return import('~/components/page_components/volumeChart.vue')
      }
    }
  },
  name: "OverviewPage",
  data() {
    return {
      network: [],
      rune: '',
      volumeHistoryQuery: undefined,
      stats: [],
    };
  },
  computed: {
    networkSettings: function () {
      return [
        [
          {
            name: 'Bonding APY',
            value: this.network.bondingAPY && this.stringToPercentage(this.network.bondingAPY),
            filter: true
          },
          {
            name: 'Liquidity APY',
            value: this.network.bondingAPY && this.stringToPercentage(this.network.liquidityAPY),
            filter: true
          }
        ],
        [
          {
            name: 'Total Standby Bonded',
            value: this.$options.filters.currency(((this.network.bondMetrics?.standby?.totalBond ?? '-') / 10**8) * 1/this.rune.runePrice) ?? 0,
            filter: true
          },
          {
            name: 'Total Active Bonded',
            value: this.$options.filters.currency(((this.network.bondMetrics?.active?.totalBond ?? '-') / 10**8) * 1/this.rune.runePrice) ?? 0,
            filter: true
          }
        ],
        [
          {
            name: 'Active Node Count',
            value: this.network.activeNodeCount
          },
          {
            name: 'Standby Node Count',
            value: this.network.standbyNodeCount
          }
        ],
        [
          {
            name: 'Next Churn Height',
            value: this.network.nextChurnHeight
          }
        ],
        [
          {
            name: 'Pool Activation Countdown',
            value: this.network.poolActivationCountdown
          }
        ],
        [
          {
            name: 'Pool Share Factor',
            value: this.network.bondingAPY && this.stringToPercentage(this.network.poolShareFactor),
            filter: true
          }
        ],
        [
          {
            name: 'Total Reserve',
            value: (this.network.totalReserve ?? 0) / 10**8
          }
        ],
        [
          {
            name: 'Total Pooled Rune',
            value: (this.network.totalPooledRune ?? 0) / 10**8
          }
        ],

      ]
    },
    statsSettings: function() {
      return [
        [
          {
            name: 'Daily Active Users',
            value: this.stats.dailyActiveUsers ?? 0
          },
          {
            name: 'Monthly Active Users',
            value: this.stats.monthlyActiveUsers ?? 0
          },
        ],
        [
          {
            name: 'RUNE Price USD',
            value: this.$options.filters.currency(this.stats.runePriceUSD),
            filter: true
          },
          {
            name: 'RUNE Depth',
            value: Math.ceil(this.stats.runeDepth/10**8) ?? 0,
            usdValue: true
          },
        ],
        [
          {
            name: '24h Swap Count',
            value: this.stats.swapCount24h ?? 0
          },
          {
            name: '30d Swap Count',
            value: this.stats.swapCount30d ?? 0
          },
          {
            name: 'Total Swap Count',
            value: this.stats.swapCount ?? 0
          },
        ],
        [
          {
            name: 'Unique Swapper Count',
            value: this.stats.uniqueSwapperCount ?? 0
          },
          {
            name: 'Swap To Asset Count',
            value: this.stats.toAssetCount ?? 0
          },
          {
            name: 'Swap To RUNE Count',
            value: this.stats.toRuneCount ?? 0
          },
        ],
        [
          {
            name: 'Swap Volume',
            value: (this.stats.swapVolume/10**8) ?? 0,
            usdValue: true

          },
          {
            name: 'Switched RUNE',
            value: (this.stats.switchedRune/10**8) ?? 0,
            usdValue: true
          }
        ],
        [
          {
            name: 'Add Liquidity Volume',
            value: (this.stats.addLiquidityVolume/10**8) ?? 0,
            usdValue: true
          },
          {
            name: 'Add Liquidity Count',
            value: this.stats.addLiquidityCount ?? 0
          }
        ],
        [
          {
            name: 'Withdraw Volume',
            value: (this.stats.withdrawVolume/10**8) ?? 0,
            usdValue: true
          },
          {
            name: 'Withdraw Count',
            value: this.stats.withdrawCount ?? 0
          }
        ],
        [
          {
            name: 'Impermanent Loss Protection Paid',
            value: (this.stats.impermanentLossProtectionPaid/10**8) ?? 0,
            usdValue: true
          }
        ]
      ]
    }
  },
  methods: {
    stringToPercentage(val) {
      return (Number.parseFloat(val ?? 0) * 100).toFixed(2).toString() + ' %'
    }
  },
  apollo: {
    $prefetch: false,
    network: networkQuery,
    volumeHistoryQuery: {
      query: volumeHistoryQuery,
      update: data => data.volumeHistory,
      variables() {
        let d = new Date()
        let until = Math.round(Date.now() / 1000);
        let from = Math.round(d.setDate(d.getDate() - 7) / 1000);

        return { from, until }
      }
    },
  },
  mounted() {
    this.$api.getStats()
    .then(res => this.stats = res.data)
    .catch(error => {
      console.error(error)
    })
  }
};
</script>

<style lang="scss">
.overview-container {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}

.stats-container,
.network-container {
  width: 100%;

  @include md {
    flex: 1 0 29rem;
  }

  @include lg {
    flex-grow: 0;
    flex-basis: initial;
    width: calc(50% - 1rem);
  }
}

.break {
  flex-basis: 100%;
  height: 0;
}

.chart-container {
  width: 100%;
}
</style>
