<template>
  <Page>
    <div v-if="nodeSettings && nodeSettings.length > 0" class="node-container">
      <stat-table :header="`Node: ${nodeId}`" :table-settings="nodeSettings">
        <template #address>
          <span class="clickable">
            {{ address }}
          </span>
        </template>
      </stat-table>
      <card title="Providers" style="margin-top: 1rem" :loading="!node">
        <div v-if="node">
          <div class="providers-container">
            <div
              v-for="p in node.bond_providers.providers"
              :key="p.bond_address"
              class="providers"
            >
              <div>
                <b>Address: </b>
                <nuxt-link
                  class="clickable"
                  :to="{ path: `/address/${p.bond_address}` }"
                >
                  {{ formatAddress(p.bond_address) }}
                </nuxt-link>
              </div>
              <div>
                <b>Bond: </b>
                <span class="mono">
                  {{ $options.filters.number(p.bond / 1e8, '0,0.00') }}
                  {{ runeCur() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </card>
      <card title="Signer Membership" style="margin-top: 1rem" :loading="!node">
        <div v-if="node">
          <div class="providers-container">
            <div
              v-for="p in node.signer_membership"
              :key="p.signer_membership"
              class="providers"
            >
              <div>
                <span class="mono">
                  {{ formatAddress(p) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </card>
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
  async asyncData({ params }) {
    return { nodeId: params.nodeId }
  },
  data() {
    return {
      node: undefined,
    }
  },
  computed: {
    nodeSettings() {
      return [
        [
          {
            name: 'IP Address',
            value: this.node?.ip_address,
            filter: true,
          },
          {
            name: 'Version',
            value: this.node?.version,
            filter: true,
          },
          {
            name: 'Status',
            value: this.node?.status,
            filter: true,
          },
        ],
        [
          {
            name: 'Total Bond',
            value: Number.parseInt(this.node?.total_bond) / 10 ** 8,
            filter: true,
            runeValue: true,
            usdValue: true,
          },
          {
            name: 'Slash Points',
            value: Number.parseInt(this.node?.slash_points),
          },
          {
            name: 'Current Reward',
            value: Number.parseInt(this.node?.current_award) / 10 ** 8,
            filter: true,
            runeValue: true,
            usdValue: true,
          },
        ],
        [
          {
            name: 'Active Since (Block Height)',
            value: Number.parseInt(this.node?.active_block_height),
          },
          {
            name: 'Status Since (Block Height)',
            value: Number.parseInt(this.node?.status_since),
          },
        ],
        [
          {
            name: 'Node operator address',
            value: this.node?.node_operator_address,
            filter: true,
          },
        ],
        [
          {
            name: 'Public Keys: Secp256k1',
            value: this.node?.pub_key_set?.secp256k1,
            filter: true,
          },
        ],
        [
          {
            name: 'Public Keys: Ed25519',
            value: this.node?.pub_key_set?.ed25519,
            filter: true,
          },
        ],
        [
          {
            name: 'Requested To Leave',
            value: this.node?.requested_to_leave?.toString(),
            filter: true,
          },
          {
            name: 'Forced To Leave',
            value: this.node?.forced_to_leave?.toString(),
            filter: true,
          },
          {
            name: 'Leave Height',
            value: this.node?.leave_height?.toString(),
            filter: true,
          },
        ],
        [
          {
            name: 'Jail Node Address',
            value: this.node?.jail?.node_address,
            filter: true,
          },
          {
            name: 'Jail Release Height',
            value: this.node?.jail?.release_height,
            filter: true,
          },
          {
            name: 'Jail Reason',
            value: this.node?.jail?.reason,
            filter: true,
          },
        ],
        [
          {
            name: 'Preflight Status',
            value: this.node?.preflight_status?.status,
            filter: true,
          },
          {
            name: 'Preflight Reason',
            value: this.node?.preflight_status?.reason,
            filter: true,
          },
          {
            name: 'Preflight Code',
            value: this.node?.preflight_status?.code,
            filter: true,
          },
        ],
      ]
    },
  },
  mounted() {
    this.$api.getNode(this.nodeId).then(({ data }) => {
      this.node = data
    })
  },
}
</script>

<style lang="scss" scoped>
.providers-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 10px;
  align-items: center;
  justify-items: center;

  .providers {
    display: flex;
    flex-direction: column;
    gap: 6px;

    b {
      color: var(--sec-font-color);
    }
  }
}
</style>
