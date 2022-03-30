<template>
  <div class="nodes-wrapper">
      <div v-if="nodesQuery && nodesQuery.nodes" class="nodes-container">
        <div class="grid-network">
        <div>
          <stat-table :tableSettings="topActiveBonds" header="Top Active Bonds"></stat-table>
        </div>
        <div>
          <stat-table :tableSettings="topStandbyBonds" header="Top Standby Bonds"></stat-table>
        </div>
      </div>
      <content-table
        :table="activeNodes"
        header="Active Nodes"
        :stats="activeStats"
        @gotoNode="gotoNode"
      ></content-table>
      <div style="height: 2rem;"></div>
      <content-table
        :table="standbyNodes"
        header="Standby Nodes"
        :stats="standbyStats"
        @gotoNode="gotoNode"
      ></content-table>
    </div>
    <div v-else class="loading">
      <BounceLoader color="#9F9F9F" size="3rem"></BounceLoader>
    </div>
  </div>
</template>

<script>
import {bondMetrics, nodesQuery} from "~/_gql_queries";
import BounceLoader from 'vue-spinner/src/BounceLoader.vue';
import { mapGetters } from 'vuex';

export default {
  name: "nodesPage",
  components: {
    BounceLoader
  },
  apollo: {
    nodesQuery: {
      query: nodesQuery,
      update(data) {
        return data;
      },
    },
    bondMetrics: bondMetrics,
  },
  methods: {
    gotoNode(address) {
      this.$router.push({path: `/node/${address}`});
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice'
    }),
    topActiveBonds: function() {
      return [
        [
          {
            name: 'Total Bond',
            value: ((this.bondMetrics?.bondMetrics?.active?.totalBond ?? 0)/10**8),
            usdValue: true
          },
          {
            name: 'Average Bond',
            value: ((this.bondMetrics?.bondMetrics?.active?.averageBond ?? 0)/10**8),
            usdValue: true
          },
          {
            name: 'Total Node Cound',
            value: this.bondMetrics?.activeNodeCount
          }
        ],
        [
          {
            name: 'Maximum Bond',
            value: Math.floor(Math.floor((Number.parseInt(this.bondMetrics?.bondMetrics?.active?.maximumBond) ?? 0)/10**8)),
            usdValue: true
          },
          {
            name: 'Median Bond',
            value: Math.floor((Number.parseInt(this.bondMetrics?.bondMetrics?.active?.medianBond) ?? 0)/10**8),
            usdValue: true
          },
          {
            name: 'Minimum Bond',
            value: Math.floor((Number.parseInt(this.bondMetrics?.bondMetrics?.active?.minimumBond) ?? 0)/10**8),
            usdValue: true
          }
        ]
      ]
    },
    topStandbyBonds: function() {
      return [
        [
          {
            name: 'Total Bond',
            value: ((this.bondMetrics?.bondMetrics?.standby?.totalBond ?? 0)/10**8),
            usdValue: true
          },
          {
            name: 'Average Bond',
            value: ((this.bondMetrics?.bondMetrics?.standby?.averageBond ?? 0)/10**8),
            usdValue: true
          },
          {
            name: 'Total Node Cound',
            value: this.bondMetrics?.standbyNodeCount
          }
        ],
        [
          {
            name: 'Maximum Bond',
            value: Math.floor((Number.parseInt(this.bondMetrics?.bondMetrics?.standby?.maximumBond) ?? 0)/10**8),
            usdValue: true
          },
          {
            name: 'Median Bond',
            value: Math.floor((Number.parseInt(this.bondMetrics?.bondMetrics?.standby?.medianBond) ?? 0)/10**8),
            usdValue: true
          },
          {
            name: 'Minimum Bond',
            value: Math.floor((this.bondMetrics?.bondMetrics?.standby?.minimumBond)/10**8).toString(),
            usdValue: true
          }
        ]
      ]
    },
    activeNodes: function () {
      if (this.nodesQuery) {
        const actNodes = this.nodesQuery.nodes?.filter(
          (e) => e.status === "Active"
        );
        let addresses = [];
        let filteredNodes = [];
        actNodes.forEach((el) => {
          filteredNodes.push([
            el.address.slice(0, 8) + "..." + el.address.slice(-8),
            el.ipAddress,
            el.version,
            el.slashPoints,
            this.$options.filters.number(Number.parseInt(el.currentAward)/10**8, '0,0'),
            this.$options.filters.number(Math.floor(Number.parseInt(el.bond)/10**8), '0,0')
            + ` (${this.$options.filters.currency(Math.floor(Number.parseInt(el.bond)/10**8) * this.runePrice)})`,
          ]);
          addresses.push(el.address);
        });
        let res = {
          content: filteredNodes,
          header: [
            "Address",
            "IP",
            "Version",
            "Slash Point",
            "Current Award",
            "Bond",
          ],
          addresses
        };
        return res;
      } else {
        return [];
      }
    },
    standbyNodes: function () {
      if (this.nodesQuery) {
        const actNodes = this.nodesQuery.nodes?.filter(
          (e) => e.status === "Standby"
        );
        let addresses = [];
        let filteredNodes = [];
        actNodes.forEach((el) => {
          filteredNodes.push([
            el.address.slice(0, 8) + "..." + el.address.slice(-8),
            el.ipAddress,
            el.version,
            el.slashPoints,
            this.$options.filters.number(Math.ceil(Number.parseInt(el.currentAward)/10**8), '0,0'),
            this.$options.filters.number(Math.floor(Number.parseInt(el.bond)/10**8), '0,0') 
            + ` (${this.$options.filters.currency(Math.floor(Number.parseInt(el.bond)/10**8) * this.runePrice)})`,
          ]);
          addresses.push(el.address);
        });
        let res = {
          content: filteredNodes,
          header: [
            "Address",
            "IP",
            "Version",
            "Slash Point",
            "Current Award",
            "Bond",
          ],
          addresses
        };
        return res;
      } else {
        return [];
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.nodes-wrapper {
  display: flex;
  justify-content: center;

  .nodes-container {
    flex: 1 0;
  }
}

.grid-network {
  margin-bottom: 1rem;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-gap: .5rem;
  gap: .5rem;
}
</style>