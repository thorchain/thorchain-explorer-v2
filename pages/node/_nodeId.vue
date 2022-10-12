<template>
  <Page>
    <div v-if="nodeSettings && nodeSettings.length > 0" class="node-container">
      <stat-table
        :header="`Node: ${nodeId}`"
        :table-settings="nodeSettings"
      />
    </div>
    <div v-else class="loading">
      <BounceLoader color="var(--font-color)" size="3rem" />
    </div>
  </Page>
</template>

<script>
import BounceLoader from 'vue-spinner/src/BounceLoader.vue'
import StatTable from '~/components/StatTable.vue'

export default {
  components: { StatTable, BounceLoader },
  async asyncData ({ params }) {
    return { nodeId: params.nodeId }
  },
  data () {
    return {
      node: undefined
    }
  },
  computed: {
    nodeSettings () {
      return [
        [
          {
            name: 'IP Address',
            value: this.node?.ip_address,
            filter: true
          },
          {
            name: 'Version',
            value: this.node?.version,
            filter: true
          },
          {
            name: 'Status',
            value: this.node?.status,
            filter: true
          }
        ],
        [
          {
            name: 'Bond',
            value: Number.parseInt(this.node?.bond) / 10 ** 8
          },
          {
            name: 'Slash Points',
            value: Number.parseInt(this.node?.slash_points)
          },
          {
            name: 'Current Reward',
            value: Number.parseInt(this.node?.current_award) / 10 ** 8
          }
        ],
        [
          {
            name: 'Public Keys: Secp256k1',
            value: this.node?.pub_key_set?.secp256k1,
            filter: true
          }
        ],
        [
          {
            name: 'Public Keys: Ed25519',
            value: this.node?.pub_key_set?.ed25519,
            filter: true
          }
        ],
        [
          {
            name: 'Requested To Leave',
            value: this.node?.requested_to_leave?.toString(),
            filter: true
          },
          {
            name: 'Forced To Leave',
            value: this.node?.forced_to_leave?.toString(),
            filter: true
          },
          {
            name: 'Leave Height',
            value: this.node?.leave_height?.toString(),
            filter: true
          }
        ],
        [
          {
            name: 'Jail Node Address',
            value: this.node?.jail?.node_address,
            filter: true
          },
          {
            name: 'Jail Release Height',
            value: this.node?.jail?.release_height,
            filter: true
          },
          {
            name: 'Jail Reason',
            value: this.node?.jail?.reason,
            filter: true
          }
        ]
      ]
    }
  },
  mounted () {
    this.$api.getNode(this.nodeId)
      .then(({ data }) => {
        this.node = data
      })
  }
}
</script>

<style>
</style>
