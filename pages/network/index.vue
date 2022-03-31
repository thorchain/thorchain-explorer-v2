<template>
  <div class="network-index-container">
    <div style="width: 100%">
      <stat-table :tableSettings="networkSettings" header="Network Overview"></stat-table>
    </div>
    <div v-if="inAddresses.length > 0" style="width: 100%">
      <stat-table :tableSettings="gasSettings" header="Gas Rates"></stat-table>
    </div>
  </div>
</template>

<script>
import {bondMetrics, networkQuery} from '~/_gql_queries';
import StatTable from "~/components/StatTable.vue";
import {blockTime} from '~/utils';

export default {
  components: { StatTable },
  data() {
    return {
      network: [],
      rune: [],
      lastblock: undefined,
      thorNetwork: undefined,
      inAddresses: []
    };
  },
  apollo: {
    $prefetch: false,
    network: networkQuery,
    bondMetrics: bondMetrics,
  },
  mounted() {
    this.$api.getLastBlockHeight()
    .then(res => this.lastblock = res.data)
    .catch(error => {
      console.error(error)
    })

    this.$api.getThorNetwork()
    .then(res => this.thorNetwork = res.data)
    .catch(error => {
      console.error(error)
    })

    this.$api.getInboundAddresses()
    .then(res => this.inAddresses = res.data)
    .catch(error => {
      console.error(error)
    })
  },
  methods: {
    nextChurnTime() {
      if (this.lastblock && this.network) {
        console.log(this.network)
        return blockTime(this.network.nextChurnHeight - this.lastblock[0]['thorchain'])
      }
    }
  },
  computed: {
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
            extraText: this.nextChurnTime()
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
        ],
        [
          {
            name: 'Total Bond Units',
            value: this.thorNetwork?.total_bond_units
          },
          {
            name: 'Total Bond Reward',
            value: this.thorNetwork?.bond_reward_rune / 10**8,
            usdValue: true
          }
        ],
        [
          {
            name: 'Total Burned BEP2 RUNE',
            value: this.thorNetwork?.burned_bep_2_rune / 10**8,
            usdValue: true
          },
          {
            name: 'Total Burned ERC20 RUNE',
            value: this.thorNetwork?.burned_erc_20_rune / 10**8,
            usdValue: true
          }
        ]
      ];
    },
    gasSettings: function() {
      const getChain = c => this.inAddresses?.find(e => e.chain === c)?.gas_rate;
      return [
        this.inAddresses.map(e => {
          return {
            name: `${e.chain} gas rate`,
            value: getChain(e.chain)
          }
        })
      ]
    }
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