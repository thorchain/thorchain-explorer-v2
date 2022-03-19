<template>
  <div class="nodes-wrapper">
    <div v-if="nodesQuery && nodesQuery.nodes" class="nodes-container">
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
import { nodesQuery } from "~/_gql_queries";
import BounceLoader from 'vue-spinner/src/BounceLoader.vue';

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
  },
  methods: {
    gotoNode(address) {
      this.$router.push({path: `/node/${address}`});
    }
  },
  computed: {
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
            this.$options.filters.number(Math.floor(Number.parseInt(el.bond)/10**8), '0,0'),
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
            this.$options.filters.number(Math.floor(Number.parseInt(el.bond)/10**8), '0,0'),
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
</style>