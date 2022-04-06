<template>
  <div class="overview-container">
    <div class="chart-container">
      <client-only>
        <div class="chart-inner-container">
          <u-chart name="swapchange" :chartSettings="swapHistory"></u-chart>
          <div class="divider"></div>
          <u-chart name="lpchange" :chartSettings="volumeHistory"></u-chart>
        </div>
        <div style="height: 1rem;"></div>
        <div class="chart-inner-container">
          <u-chart name="earningchange" :chartSettings="earningsHistory"></u-chart>
          <div class="divider"></div>
          <u-chart name="tvlchange" :chartSettings="tvlHistory"></u-chart>
        </div>
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
import {networkQuery} from '~/_gql_queries';
import { blockTime} from '~/utils';

export default {
  components: { 
    uChart: () => {
      if(process.client) {
        return import('~/components/page_components/uChart.vue')
      }
    }
  },
  name: "OverviewPage",
  data() {
    return {
      network: [],
      rune: '',
      lastblock: undefined,
      stats: [],
      volumeHistory: undefined,
      swapHistory: undefined,
      tvlHistory: undefined,
      earningsHistory: undefined
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
            value: this.network.nextChurnHeight,
            extraText: this.nextChurnTime()
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
            value: (this.network.totalReserve ?? 0) / 10**8,
            usdValue: true
          }
        ],
        [
          {
            name: 'Total Pooled Rune',
            value: (this.network.totalPooledRune ?? 0) / 10**8,
            usdValue: true
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
    },
    nextChurnTime() {
      if (this.lastblock && this.network) {
        return blockTime(this.network.nextChurnHeight - this.lastblock[0]['thorchain'])
      }
    },
    formatLPChange(d) {
      /*
        header: 'string',
        datum: [
          {
            name: 'time',
            data: number[]
          },
          {
            name: 'string',
            color: 'string,
            label: 'string',
            data: number[]
          },
          ...
        ]
      */
      let data = {
        header: 'Liquidity Change',
        datum: [
          {
            name: 'time',
            data: []
          },
          {
            name: 'add',
            color: `rgb(54, 176, 121)`,
            fill: `rgb(54, 176, 121)`,
            label: "Add Liquidity Volume",
            data: []
          },
          {
            name: 'widthdraw',
            color: `rgb(234, 95, 148)`,
            fill: `rgb(234, 95, 148)`,
            label: 'Withdraw Liquidity Volume',
            data: []
          },
          {
            name: 'total',
            color: `rgb(255, 177, 78)`,
            fill: `rgb(255, 177, 78)`,
            label: "Total Change",
            data: []
          }
        ]
      }
      d?.intervals.forEach(interval => {
        data.datum[0].data.push(Math.floor((~~interval.endTime + ~~interval.startTime)/2));
        data.datum[1].data.push(+interval.addLiquidityVolume * +interval.runePriceUSD / 10**8);
        data.datum[2].data.push(-1*((+interval.withdrawVolume) * +interval.runePriceUSD / 10**8));
        data.datum[3].data.push((+interval.addLiquidityVolume - +interval.withdrawVolume)  * +interval.runePriceUSD / 10**8);
      })

      return data;
    },
    formatSwap: function(d) {
      let data = {
        header: 'Swap Volume',
        datum: [
          {
            name: 'time',
            data: []
          },
          {
            name: 'Total Volume',
            color: `rgb(255, 177, 78)`,
            fill: `rgb(255, 177, 78)`,
            label: "Total Volume",
            data: []
          },
          {
            name: 'to Asset Volume',
            color: `rgb(234, 95, 148)`,
            fill: `rgb(234, 95, 148)`,
            label: 'to Asset Volume',
            data: []
          },
          {
            name: 'to Rune Volume',
            color: `rgb(54, 176, 121)`,
            fill: `rgb(54, 176, 121)`,
            label: 'to Rune Volume',
            data: []
          }
        ]
      }
      d?.intervals.forEach(interval => {
        data.datum[0].data.push(Math.floor((~~interval.endTime + ~~interval.startTime)/2));
        data.datum[1].data.push((+interval.totalVolume / 10**8) * Number.parseFloat(interval.runePriceUSD));
        data.datum[2].data.push((+interval.toAssetVolume * +interval.runePriceUSD) / 10**8);
        data.datum[3].data.push((+interval.toRuneVolume * +interval.runePriceUSD) / 10**8);
      })

      return data;
    },
    formatTvl: function(d) {
      let data = {
        header: 'TVL Volume',
        datum: [
          {
            name: 'time',
            data: []
          },
          {
            name: 'Total Value Pooled',
            color: `rgb(255, 177, 78)`,
            fill: `rgb(255, 177, 78, 0.1)`,
            label: "Total Value Locked",
            mode: 'spline',
            data: []
          }
        ]
      }
      d?.intervals.pop();
      d?.intervals.forEach(interval => {
        data.datum[0].data.push(Math.floor((~~interval.endTime + ~~interval.startTime)/2));
        data.datum[1].data.push((+interval.totalValuePooled / 10**8) * Number.parseFloat(interval.runePriceUSD));
      })

      return data;
    },
    formatEarnings: function(d) {
      let data = {
        header: 'Earnings Volume',
        datum: [
          {
            name: 'time',
            data: []
          },
          {
            name: 'Liquidity Earning',
            color: `rgb(255, 177, 78)`,
            fill: `rgb(255, 177, 78, 0.1)`,
            label: "Liquidity Earning",
            mode: 'spline',
            data: []
          },
          {
            name: 'Bond Earning',
            color: `rgb(234, 95, 148)`,
            fill: `rgb(234, 95, 1488, 0.1)`,
            label: "Bond Earning",
            mode: 'spline',
            data: []
          }
        ]
      }
      d?.intervals.pop();
      d?.intervals.forEach(interval => {
        data.datum[0].data.push(Math.floor((~~interval.endTime + ~~interval.startTime)/2));
        data.datum[1].data.push((+interval.liquidityEarnings / 10**8) * Number.parseFloat(interval.runePriceUSD));
        data.datum[2].data.push((+interval.bondingEarnings / 10**8) * Number.parseFloat(interval.runePriceUSD));
      })

      return data;
    }
  },
  apollo: {
    $prefetch: false,
    network: networkQuery,
  },
  mounted() {
    this.$api.getStats()
    .then(res => this.stats = res.data)
    .catch(error => {
      console.error(error)
    })

    this.$api.getLastBlockHeight()
    .then(res => this.lastblock = res.data)
    .catch(error => {
      console.error(error)
    })

    this.$api.volumeHistory()
    .then(res => this.volumeHistory = this.formatLPChange(res.data))
    .catch(error => {
      console.error(error)
    })

    this.$api.swapHistory()
    .then(res => this.swapHistory = this.formatSwap(res.data))
    .catch(error => {
      console.error(error)
    })

    this.$api.tvlHistory()
    .then(res => this.tvlHistory = this.formatTvl(res.data))
    .catch(error => {
      console.error(error)
    })

    this.$api.earningsHistory()
    .then(res => this.earningsHistory = this.formatEarnings(res.data))
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

  .chart-inner-container {
    flex-direction: column;
    display: flex;

    .divider {
      width: 1rem;
      height: 1rem;
    }
  }

  @include lg {
    .chart-inner-container {
      flex-direction: row;
    }
  }
}
</style>
