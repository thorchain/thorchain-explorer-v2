<template>
  <div class="network-index-container">
    <div style="width: 100%">
      <stat-table :tableSettings="networkSettings" header="Network Overview"></stat-table>
    </div>
    <div class="grid-network">
      <div>
        <stat-table :tableSettings="topActiveBonds" header="Top Active Bonds"></stat-table>
      </div>
      <div>
        <stat-table :tableSettings="topStandbyBonds" header="Top Standby Bonds"></stat-table>
      </div>
    </div>
  </div>
</template>

<script>
import {bondMetrics, networkQuery} from '~/_gql_queries'
import StatTable from "~/components/StatTable.vue";

export default {
  components: { StatTable },
  data() {
    return {
      network: [],
      rune: [],
    };
  },
  apollo: {
    $prefetch: false,
    network: networkQuery,
    bondMetrics: bondMetrics,
  },
  computed: {
    topActiveBonds: function() {
      return [
        [
          {
            name: 'Total Bond',
            value: ((this.bondMetrics?.bondMetrics?.active?.totalBond ?? 0)/10**8)
          },
          {
            name: 'Average Bond',
            value: ((this.bondMetrics?.bondMetrics?.active?.averageBond ?? 0)/10**8)
          },
          {
            name: 'Total Node Cound',
            value: this.bondMetrics?.activeNodeCount
          }
        ],
        [
          {
            name: 'Maximum Bond',
            value: Math.floor(Math.floor((Number.parseInt(this.bondMetrics?.bondMetrics?.active?.maximumBond) ?? 0)/10**8))
          },
          {
            name: 'Median Bond',
            value: Math.floor((Number.parseInt(this.bondMetrics?.bondMetrics?.active?.medianBond) ?? 0)/10**8)
          },
          {
            name: 'Minimum Bond',
            value: Math.floor((Number.parseInt(this.bondMetrics?.bondMetrics?.active?.minimumBond) ?? 0)/10**8)
          }
        ]
      ]
    },
    topStandbyBonds: function() {
      return [
        [
          {
            name: 'Total Bond',
            value: ((this.bondMetrics?.bondMetrics?.standby?.totalBond ?? 0)/10**8)
          },
          {
            name: 'Average Bond',
            value: ((this.bondMetrics?.bondMetrics?.standby?.averageBond ?? 0)/10**8)
          },
          {
            name: 'Total Node Cound',
            value: this.bondMetrics?.standbyNodeCount
          }
        ],
        [
          {
            name: 'Maximum Bond',
            value: Math.floor((Number.parseInt(this.bondMetrics?.bondMetrics?.standby?.maximumBond) ?? 0)/10**8)
          },
          {
            name: 'Median Bond',
            value: Math.floor((Number.parseInt(this.bondMetrics?.bondMetrics?.standby?.medianBond) ?? 0)/10**8)
          },
          {
            name: 'Minimum Bond',
            value: Math.floor((this.bondMetrics?.bondMetrics?.standby?.minimumBond)/10**8).toString()
          }
        ]
      ]
    },
    networkSettings: function () {
      return [
        [
          {
            name: "Bonding APY",
            value: this.$options.filters.percent(this.network.bondingAPY, 2),
            filter: true,
          },
          {
            name: "Liquidity APY",
            value: this.$options.filters.percent(this.network.liquidityAPY, 2),
            filter: true,
          },
        ],
        [
          {
            name: "Next Churn Height",
            value: this.network.nextChurnHeight,
          },
          {
            name: "Pool Activation Countdown",
            value: this.network.poolActivationCountdown,
          },
          {
            name: "Pool Share Factor",
            value: this.$options.filters.percent(this.network.poolShareFactor),
            filter: true,
          },
        ],
        [
          {
            name: "Total Reserve",
            value: (this.network.totalReserve ?? 0) / 10 ** 8,
            usdValue: true
          },
          {
            name: "Total Pooled Rune",
            value: (this.network.totalPooledRune ?? 0) / 10 ** 8,
            usdValue: true
          },
        ],
        [
          {
            name: 'Block Reward / Day',
            value: ((this.network.blockRewards?.blockReward/10**8) ?? 0) * (5256000 / 365),
            usdValue: true
          },
          {
            name: 'Block Bond Reward / Day',
            value: ((this.network.blockRewards?.bondReward/10**8) ?? 0) * (5256000 / 365),
            usdValue: true
          },
          {
            name: 'Block Pool Reward / Day',
            value: ((this.network.blockRewards?.poolReward/10**8) ?? 0) * (5256000 / 365),
            usdValue: true
          },
          {
            name: 'Block Reward / Node / Month',
            value: ((this.network.blockRewards?.bondReward/10**8)/(this.network.activeNodeCount) ?? 0) * (5256000 / 12),
            usdValue: true
          }
        ]
      ];
    },
  },
};
</script>

<style lang="scss">
.network-index-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.grid-network {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-gap: .5rem;
  gap: .5rem;
}
</style>