<template>
  <Page>
    <div class="node-header">
      Node:<span class="node-id">{{ nodeId }}</span>
    </div>
    <info-card :options="nodeSettings">
      <template #address>
        <span class="clickable">
          {{ address }}
        </span>
      </template>
    </info-card>
    <div class="cards-node">
      <card title="Providers" style="margin-top: 1rem" :is-loading="loading">
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
      <card
        v-if="
          node && node.signer_membership && node.signer_membership.length > 0
        "
        title="Signer Membership"
        style="margin-top: 1rem"
        :is-loading="loading"
      >
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
      </card>
    </div>
  </Page>
</template>

<script>
export default {
  async asyncData({ params }) {
    return { nodeId: params.nodeId }
  },
  data() {
    return {
      node: undefined,
      loading: true,
    }
  },
  head: {
    title: 'THORChain Network Explorer | Node',
  },
  computed: {
    nodeSettings() {
      let jailInfo = []
      if (this.node?.jail?.release_height) {
        jailInfo = [
          {
            header: 'Jail',
          },
          {
            name: 'Release Height',
            value: this.node?.jail?.release_height,
            filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
          },
          {
            name: 'Reason',
            value: this.node?.jail?.reason ?? '-',
          },
        ]
      }

      return [
        {
          title: 'Overview',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'IP Address',
              value: this.node?.ip_address,
            },
            {
              name: 'Version',
              value: this.node?.version,
            },
            {
              name: 'Status',
              value: this.node?.status,
            },

            {
              name: 'Total Bond',
              value: this.node?.total_bond / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'Slash Points',
              value: this.node?.slash_points,
            },
            {
              name: 'Current Reward',
              value: this.node?.current_award / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
              usdValue: true,
            },

            {
              name: 'Active Since (Block Height)',
              value: this.node?.active_block_height,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: 'Status Since (Block Height)',
              value: this.node?.status_since,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },

            {
              name: 'Node operator address',
              value: this.node?.node_operator_address,
              filter: (v) => this.addressFormatV2(v),
            },
            {
              name: 'Public Keys: Secp256k1',
              value: this.node?.pub_key_set?.secp256k1,
              filter: (v) => this.addressFormatV2(v),
            },

            {
              name: 'Public Keys: Ed25519',
              value: this.node?.pub_key_set?.ed25519,
              filter: (v) => this.addressFormatV2(v),
            },
          ],
        },
        {
          title: 'Leave',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Requested To Leave',
              value: this.node?.requested_to_leave?.toString(),
            },
            {
              name: 'Forced To Leave',
              value: this.node?.forced_to_leave?.toString(),
            },
            {
              name: 'Leave Height',
              value: this.node?.leave_height?.toString(),
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            ...jailInfo,
            {
              header: 'Preflight',
            },
            {
              name: 'Status',
              value: this.node?.preflight_status?.status,
            },
            {
              name: 'Reason',
              value: this.node?.preflight_status?.reason,
            },
            {
              name: 'Code',
              value: `${this.node?.preflight_status?.code}`,
            },
          ],
        },
      ]
    },
  },
  mounted() {
    this.loading = true
    this.$api
      .getNode(this.nodeId)
      .then(({ data }) => {
        this.node = data
      })
      .catch((error) => {
        console.error('Error fetching node data:', error)
      })
      .finally(() => {
        this.loading = false
      })
  },
}
</script>

<style lang="scss" scoped>
.node-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: var(--card-bg-color);
  color: var(--sec-font-color);
  border-radius: $radius-lg;
  padding: $space-16;
  margin-bottom: $space-16;
}
.node-id {
  color: var(--primary-color);
  padding-left: $space-8;
  word-wrap: break-word;
  word-break: break-all;
  white-space: normal;
}

.cards-node {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: $space-10;
}
@include md {
  .cards-node {
    flex-direction: row;
  }
}

.providers-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 10px;
  align-items: center;

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
