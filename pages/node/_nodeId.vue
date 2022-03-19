<template>
  <div class="node-wrapper">
    <div v-if="nodeSettings && nodeSettings.length > 0" class="node-container">
      <stat-table
        :header="$options.filters.capitalize(nodeId)"
        :tableSettings="nodeSettings"
      ></stat-table>
    </div>
    <div v-else class="loading">
      <BounceLoader color="#9F9F9F" size="3rem" />
    </div>
  </div>
</template>

<script>
import StatTable from "~/components/StatTable.vue";
import { nodeQuery } from "~/_gql_queries";
import BounceLoader from "vue-spinner/src/BounceLoader.vue";

export default {
  components: { StatTable, BounceLoader },
  async asyncData({ params }) {
    return { nodeId: params.nodeId };
  },
  apollo: {
    $prefetch: false,
    node: {
      query: nodeQuery,
      variables() {
        return { address: this.nodeId };
      },
    },
  },
  computed: {
    nodeSettings: function () {
      return [
        [
          {
            name: "IP Address",
            value: this.node?.ipAddress,
            filter: true,
          },
          {
            name: "Version",
            value: this.node?.version,
            filter: true,
          },
          {
            name: "Status",
            value: this.node?.status,
            filter: true,
          },
        ],
        [
          {
            name: "Bond",
            value: Number.parseInt(this.node?.bond) / 10 ** 8,
          },
          {
            name: "Slash Points",
            value: Number.parseInt(this.node?.slashPoints),
          },
          {
            name: "Current Reward",
            value: Number.parseInt(this.node?.currentAward) / 10 ** 8,
          },
        ],
        [
          {
            name: "Public Keys: Secp256k1",
            value: this.node?.publicKeys.secp256k1,
            filter: true,
          },
        ],
        [
          {
            name: "Public Keys: Ed25519",
            value: this.node?.publicKeys.ed25519,
            filter: true,
          },
        ],
        [
          {
            name: "Requested To Leave",
            value: this.node?.requestedToLeave.toString(),
            filter: true,
          },
          {
            name: "Forced To Leave",
            value: this.node?.forcedToLeave.toString(),
            filter: true,
          },
          {
            name: "Leave Height",
            value: this.node?.leaveHeight?.toString(),
            filter: true,
          },
        ],
        [
          {
            name: "Jail Node Address",
            value: this.node?.jail.nodeAddr,
            filter: true,
          },
          {
            name: "Jail Release Height",
            value: this.node?.jail.releaseHeight,
            filter: true,
          },
          {
            name: "Jail Reason",
            value: this.node?.jail.reason,
            filter: true,
          },
        ],
      ];
    },
  },
};
</script>

<style>
</style>