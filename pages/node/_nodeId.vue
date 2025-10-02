<template>
  <Page>
    <div class="node-container">
      <div class="node-header">
        Node:<span class="node-id">{{ nodeId }}</span>
      </div>
      <div class="node-info">
        <div class="node-icon">
          <VFlag v-if="node && node.location && node.location.code" :flag="node.location.code"
            v-tooltip="node && node.location ? `${node.location.code}, ${node.location.city || 'Unknown City'}` : ''" />
        </div>
      </div>
      <div class="node-info">
        <div class="node-icon">
          <cloud-image v-if="node && node.isp" :name="[node.isp, node.org]" />
        </div>
      </div>
    </div>
    <div class="node-overview">
      <!-- Chain Information Section -->
      <div v-if="node && (chainLags.length > 0 || hasHealthData)" style="margin-top: 1rem">
        <card title="Chain Information" :is-loading="loading">
          <div class="chain-status-row">
            <!-- Chain Lags -->
            <div v-for="chain in chainLags" :key="chain.name" class="chain-status-item">
              <div class="chain-header">
                <img class="chain-icon" :src="assetImage(`${chain.name}.${chain.name}`)" />
                {{ chain.name }}
              </div>
              <div class="chain-status-value mono">
                <span v-if="parseInt(chain.lag) == 0" class="version chain-ok">OK</span>
                <span v-else-if="chain.lag === '' || chain.lag === null || chain.lag === undefined">-</span>
                <span v-else-if="0 < chain.lag && chain.lag < 10000" class="number chain-warning">
                  -{{ $options.filters.number(chain.lag, '0a') }}
                </span>
                <DangerIcon v-else-if="0 > chain.lag && chain.lag > -10000" v-tooltip="'Disabled'"
                  class="table-icon chain-error" style="color: #ef5350" />
                <DangerIcon v-else-if="chain.lag > 10000" v-tooltip="`${chain.lag}`" class="table-icon"
                  style="fill: #ffc107" />
                <DangerIcon v-else v-tooltip="`${chain.lag}`" class="table-icon chain-error" style="fill: #ef5350" />
              </div>
            </div>

            <!-- Missing Blocks -->
            <div v-if="node.missing_blocks !== null && node.missing_blocks !== undefined" class="chain-status-item">
              <div class="chain-header">
                <missingblock class="chain-icon" />
                Missing
              </div>
              <div class="chain-status-value mono">
                <span v-if="node.missing_blocks === 0" class="version health-ok">OK</span>
                <span v-else-if="node.missing_blocks !== null && node.missing_blocks !== undefined"
                  class="number health-error">
                  {{ $options.filters.number(-node.missing_blocks, '0,0') }}
                </span>
                <span v-else>-</span>
              </div>
            </div>

            <!-- RPC Health -->
            <div v-if="node.rpcHealth !== null && node.rpcHealth !== undefined" class="chain-status-item">
              <div class="chain-header">RPC</div>
              <div class="chain-status-value mono">
                <template v-if="getHealthText(node.rpcHealth) !== '-'">
                  <a v-tooltip="getHealthTooltip(node.rpcHealth)"
                    :class="['clickable', 'hoverable', { 'bad-link': getHealthText(node.rpcHealth) === 'BAD' }]"
                    :href="getRPCUrl()" target="_blank" style="text-decoration: none"
                    :style="getHealthStyle(node.rpcHealth)">
                    {{ getHealthText(node.rpcHealth) }}
                  </a>
                </template>
                <template v-else>-</template>
              </div>
            </div>

            <!-- BFR Health -->
            <div v-if="node.bifrostHealth !== null && node.bifrostHealth !== undefined" class="chain-status-item">
              <div class="chain-header">BFR</div>
              <div class="chain-status-value mono">
                <template v-if="getHealthText(node.bifrostHealth) !== '-'">
                  <a v-tooltip="getHealthTooltip(node.bifrostHealth)"
                    :class="['clickable', 'hoverable', { 'bad-link': getHealthText(node.bifrostHealth) === 'BAD' }]"
                    :href="getBFRUrl()" target="_blank" style="text-decoration: none"
                    :style="getHealthStyle(node.bifrostHealth)">
                    {{ getHealthText(node.bifrostHealth) }}
                  </a>
                </template>
                <template v-else>-</template>
              </div>
            </div>
          </div>
        </card>
      </div>

      <!-- Node Status and Key Metrics -->
      <info-card :options="nodeMetrics">
        <template #status="{ item }">
          <div v-if="item.value" v-tooltip="node && node.preflight_status && node.preflight_status.reason" :class="[
            'mini-bubble hoverable',
            {
              yellow: item.value == 'Standby',
              danger: item.value == 'Disabled',
              white: item.value == 'Whitelisted',
            },
          ]">
            <span>{{ item.value }}</span>
          </div>
        </template>
        <template #age="{ item }">
          <span v-if="item.value && node && node.age" v-tooltip="node.age.info" style="cursor: pointer">
            {{ $options.filters.number(item.value, '0,0.00') }}
          </span>
          <span v-else>-</span>
        </template>
        <template #vault="{ item }">
          <div v-if="item.value" style="display: flex; align-items: center; gap: 0.5rem">
            <Address :address="item.value"></Address>
          </div>
          <div v-else class="metric-value">-</div>
        </template>
        <template #vaultHash="{ item }">
          <div v-if="item.value" class="vault-wrapper">
            <color-hash v-tooltip="item.value" :name="item.value" />
          </div>
          <span v-else>-</span>
        </template>
      </info-card>

      <!-- Provider Information -->
      <info-card :options="providerInfo">
        <template #operator="{ item }">
          <div v-if="item.value" class="hoverable">
            <nuxt-link class="clickable mono" target="_blank" :to="`/address/${item.value}`">
              {{ item.value.slice(-4) }}
            </nuxt-link>
          </div>
          <span v-else>-</span>
        </template>
      </info-card>
    </div>
    <info-card :options="nodeSettings">
      <template #address="{ item }">
        <Address :address="item.value"></Address>
      </template>
      <template #hash="{ item }">
        <div style="display: flex; align-items: center; gap: 0.5rem">
          <span v-tooltip="item.value" class="mono">
            {{ addressFormatV2(item.value) }}
          </span>
          <Copy :str-copy="item.value"></Copy>
          <color-hash v-tooltip="'Vault colors are identical to the nodes vault membership'
            " :name="item.value"></color-hash>
        </div>
      </template>
    </info-card>

    <div v-if="filteredVotes.length > 0" style="margin-top: 1rem">
      <Header title="Last 30 Days vote"></Header>
      <div class="votes-container">
        <card v-for="(vote, index) in filteredVotes" :key="index" class="vote-card" :title="vote.value">
          <div class="vote-details">
            <div class="vote-row">
              <small class="vote-label">Key:</small>
              <span class="mono vote-value">{{ vote.key }}</span>
            </div>
            <div class="vote-row">
              <small class="vote-label">Date:</small>
              <span class="mono vote-value">{{
                formatVoteDate(vote.date)
              }}</span>
            </div>
          </div>
        </card>
      </div>
    </div>

    <div class="cards-node">
      <card title="Providers" style="margin-top: 1rem" :is-loading="loading">
        <pie-chart :pie-data="pieData" :formatter="formatter" />
        <cards-header :table-general-stats="generalStatsDetails" />

        <vue-good-table :columns="columns" :rows="providersTableData" style-class="vgt-table net-table">
          <template #table-row="{ column, row }">
            <span v-if="column.field === 'bond_address'">
              <Address :address="row.bond_address" />
            </span>
            <span v-else-if="column.field === 'bond'">
              {{ $options.filters.number(row.bond / 1e8, '0,0.00') }} RUNE
            </span>
            <span v-else-if="column.field === 'bondPercentage'">
              {{ row.bondPercentage | percent(2) }}
            </span>
            <span v-else>
              {{ row[column.field] }}
            </span>
          </template>
        </vue-good-table>
      </card>
      <card v-if="
        node && node.signer_membership && node.signer_membership.length > 0
      " title="Signer Membership" :is-loading="loading" style="margin-top: 1rem" :body-class="'fixed-height'">
        <div class="providers-container">
          <div v-for="p in node.signer_membership" :key="p.signer_membership" class="providers">
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
import moment from 'moment'
import Address from '~/components/transactions/Address.vue'
import { orderBy, sumBy } from 'lodash'
import { availableChains } from '~/utils'
import missingblock from '~/assets/images/missingblock.svg?inline'
import DangerIcon from '~/assets/images/danger.svg?inline'
import VFlag from '~/components/VFlag.vue'
import CloudImage from '~/components/CloudImage.vue'

export default {
  components: {
    Address,
    missingblock,
    DangerIcon,
    VFlag,
    CloudImage,
  },
  async asyncData({ params }) {
    return { nodeId: params.nodeId }
  },
  data() {
    return {
      node: undefined,
      asgardVault: null,
      votes: [],
      loading: true,
      pieData: [],
      columns: [
        {
          label: 'Address',
          field: 'bond_address',
          sortable: true,
          formatFn: (v) => this.addressFormatV2(v),
          tdClass: 'mono',
        },
        {
          label: 'Bond (RUNE)',
          field: 'bond',
          sortable: true,
          type: 'number',
          formatFn: (value) =>
            this.$options.filters.number(value / 1e8, '0,0.00'),
          tdClass: 'mono',
        },
        {
          label: 'Percentage',
          field: 'bondPercentage',
          sortable: true,
          type: 'number',
          tdClass: 'mono',
        },
      ],
      generalStatsDetails: [
        {
          name: 'Total Bond',
        },
        {
          name: 'Providers Count',
        },
      ],
    }
  },
  head: {
    title: 'THORChain Network Explorer | Node',
  },
  computed: {
    nodeMetrics() {
      return [
        {
          title: 'Node Metrics',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Age',
              value: this.node && this.node.age ? this.node.age.number : null,
              valueSlot: 'age',
            },
            {
              name: 'Status',
              value: this.node ? this.node.status : null,
              valueSlot: 'status',
            },
            {
              name: 'Total Bond',
              value: this.node ? this.node.total_bond / 10 ** 8 : 0,
              filter: (v) => this.formatRune(v, '0,0a'),
              usdValue: true,
            },
            {
              name: 'Current Reward',
              value: this.node ? this.node.current_award / 10 ** 8 : 0,
              filter: (v) => this.formatRune(v, '0,0a'),
              usdValue: true,
            },
            {
              name: 'Slash Points',
              value: this.node ? this.node.slash_points : null,
            },
            {
              name: 'Vault',
              value: this.node ? this.node.vaultMembership : null,
              valueSlot: 'vaultHash',
            },
          ],
        },
      ]
    },
    providerInfo() {
      return [
        {
          title: 'Provider',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Fee',
              value: this.node && this.node.bond_providers ? this.node.bond_providers.node_operator_fee / 1e4 : null,
              type: 'percentage',
            },
            {
              name: 'Operator',
              value: this.node ? this.node.node_operator_address : null,
              valueSlot: 'operator',
            },
            {
              name: 'APY',
              value: this.node ? this.node.apy : null,
              filter: (v) => `${this.$options.filters.percent(v, 2)}`,
            },
          ],
        },
      ]
    },
    nodeSettings() {
      return [
        {
          title: 'Overview',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Version',
              value: this.node ? this.node.version : null,
            },

            {
              name: 'Active Since (Block Height)',
              value: this.node ? this.node.active_block_height : null,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: 'Status Since (Block Height)',
              value: this.node ? this.node.status_since : null,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },

            {
              name: 'Node operator address',
              value: this.node ? this.node.node_operator_address : null,
              filter: (v) => this.addressFormatV2(v),
            },
            {
              name: 'Public Keys: Secp256k1',
              value: this.node && this.node.pub_key_set ? this.node.pub_key_set.secp256k1 : null,
              filter: (v) => this.addressFormatV2(v),
            },

            {
              name: 'Public Keys: Ed25519',
              value: this.node && this.node.pub_key_set ? this.node.pub_key_set.ed25519 : null,
              filter: (v) => this.addressFormatV2(v),
            },
            {
              name: 'Vault Public Hash',
              value: this.asgardVault ? this.asgardVault.pub_key : null,
              valueSlot: 'hash',
            },
          ],
        },
      ]
    },
    filteredVotes() {
      if (!this.votes || !this.votes.length || !this.node || !this.node.node_address) return []

      const nodeAddress = this.node.node_address
      const matchedVotes = []

      for (const voteItem of this.votes) {
        const match = voteItem.votes.find((v) => v.address === nodeAddress)
        if (match) {
          matchedVotes.push({
            key: match.key,
            date: match.date / 1e6,
            value: voteItem.value,
          })
        }
      }

      return matchedVotes
    },
    providersTableData() {
      if (!this.node || !this.node.bond_providers || !this.node.bond_providers.providers || !this.node.bond_providers.providers.length) return []

      const totalBond =
        this.node.total_bond ??
        this.node.bond_providers.providers.reduce((sum, p) => sum + p.bond, 0)

      return this.node.bond_providers.providers.map((p) => ({
        ...p,
        bondPercentage: p.bond / totalBond,
      }))
    },
    providersStats() {
      const providers = this.providersTableData
      const count = providers.length
      const totalBond = providers.reduce((sum, p) => sum + p.bond, 0)
      return {
        count,
        totalBond,
      }
    },
    chainLags() {
      if (!this.node || (!this.node.scanner && !this.node.behind)) return []

      let chains = []
      if (this.node.scanner) {
        chains = Object.keys(this.node.scanner).filter(chain => chain !== 'THOR')
      } else if (this.node.behind) {
        chains = Object.keys(this.node.behind)
      }

      return chains.sort().map(chain => ({
        name: chain,
        lag: (this.node.behind && this.node.behind[chain] !== undefined) ? this.node.behind[chain] : (this.node.scanner && this.node.scanner[chain] && this.node.scanner[chain].height_lag !== undefined) ? this.node.scanner[chain].height_lag : null
      }))
    },
    hasHealthData() {
      return (
        (this.node && this.node.missing_blocks !== null && this.node.missing_blocks !== undefined) ||
        (this.node && this.node.rpcHealth !== null && this.node.rpcHealth !== undefined) ||
        (this.node && this.node.bifrostHealth !== null && this.node.bifrostHealth !== undefined)
      )
    },
  },
  mounted() {
    this.loading = true

    this.$api.getNodeInfo(this.nodeId)
      .then((response) => {
        console.log('New API Response:', response.data)
        const data = response.data

        if (data && typeof data === 'object') {
          if (data.node) {
            this.node = data.node
            this.votes = data.votes || []
            this.asgardVault = data.asgardVault || data.vault
          } else if (data.nodeAddress || data.node_address) {
            this.node = data
            this.votes = data.votes || []
            this.asgardVault = data.asgardVault || data.vault
          } else {
            console.warn('Unexpected API response structure, using fallback')
            throw new Error('Invalid response structure')
          }

          if (this.node && (this.node.countryCode || this.node.regionName || this.node.city)) {
            this.node.location = {
              code: this.node.countryCode,
              region: this.node.regionName,
              city: this.node.city
            }
          }

          this.createProvidersPieData()
          this.updateStatsDetails()
        } else {
          throw new Error('Empty or invalid response')
        }
      })
      .catch((error) => {
        console.error('New API failed, falling back to old APIs:', error)

        Promise.all([
          this.$api.getNode(this.nodeId),
          this.$api.getAsgard(),
          this.$api.getVotes(),
        ])
          .then(([nodeRes, asgardRes, votesRes]) => {
            this.node = nodeRes.data
            if (this.node && (this.node.countryCode || this.node.regionName || this.node.city)) {
              this.node.location = {
                code: this.node.countryCode,
                region: this.node.regionName,
                city: this.node.city
              }
            }
            this.votes = votesRes.data
            this.findAsgardVault(asgardRes.data)
            this.createProvidersPieData()
            this.updateStatsDetails()
          })
          .catch((fallbackError) => {
            console.error('Fallback APIs also failed:', fallbackError)
          })
      })
      .finally(() => {
        this.loading = false
      })
  },
  methods: {
    findAsgardVault(asgardList) {
      if (!this.node || !this.node.signer_membership) return

      for (const vault of asgardList) {
        const match =
          vault.pub_key && this.node.signer_membership.includes(vault.pub_key)
        if (match) {
          this.asgardVault = vault
          break
        }
      }
    },
    updateStatsDetails() {
      this.generalStatsDetails = [
        {
          name: 'Total Bond',
          value: `${this.$options.filters.number(this.node.total_bond / 1e8, '0.00a')} ${this.runeCur()}`,
        },
        {
          name: 'Providers Count',
          value: `${this.$options.filters.number(this.providersStats.count, '0.00a')}`,
        },
      ]
    },
    formatVoteDate(date) {
      return moment(date).format('MM/DD/YYYY HH:mm:ss')
    },
    createProvidersPieData() {
      if (!this.node || !this.node.bond_providers || !this.node.bond_providers.providers || !this.node.bond_providers.providers.length) return

      const sorted = [...this.node.bond_providers.providers].sort(
        (a, b) => b.bond - a.bond
      )

      const topProviders = sorted.slice(0, 10).map((p) => ({
        name: this.addressFormatV2(p.bond_address),
        value: p.bond / 1e8,
      }))

      const others = sorted.slice(10)
      const othersValue = others.reduce((sum, p) => sum + p.bond / 1e8, 0)

      this.pieData = [
        ...topProviders,
        ...(othersValue > 0
          ? [
            {
              name: 'Others',
              value: othersValue,
            },
          ]
          : []),
      ]
    },
    formatter(param) {
      const total = this.pieData.reduce((sum, item) => sum + item.value, 0)
      const percent = this.$options.filters.percent(param.value / total, 2)
      const formattedRune = this.$options.filters.number(param.value, '0,0.00')

      return `
    <div class="tooltip-header">
      <div class="data-color" style="background-color: ${param.color}"></div>
      ${param.name.length > 30 ? this.addressFormatV2(param.name) : param.name}
    </div>
    <div class="tooltip-body">
      <span>
        <span>Bond:</span>
        <b>${formattedRune} RUNE</b>
      </span>
      <span>
        <span>Percentage:</span>
        <b>${percent}</b>
      </span>
    </div>
  `
    },
    getHealthText(health) {
      if (health === true) return 'OK'
      if (health === false) return 'BAD'
      if (typeof health === 'string') return 'BAD'
      return '-'
    },
    getHealthTooltip(health) {
      const errorMessages = {
        ERR_BAD_RESPONSE: 'Unexpected response from the server',
        ECONNREFUSED: 'Connection Refused By Server',
        ECONNABORTED: 'Connection was interrupted',
      }

      if (typeof health === 'string') {
        return errorMessages[health] || health
      }
      return ''
    },
    getHealthStyle(health) {
      return {}
    },
    getRPCUrl() {
      if (!this.node || !this.node.ip_address) return null
      return `http://${this.node.ip_address}:27147/health?`
    },
    getBFRUrl() {
      if (!this.node || !this.node.ip_address) return null
      return `http://${this.node.ip_address}:6040/p2pid`
    },
  },
}
</script>

<style lang="scss" scoped>
.node-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: $space-8;


  .node-info {
    display: flex;
    flex-direction: row;
    align-items: center;
    background-color: var(--card-bg-color);
    color: var(--sec-font-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: $space-10;
    margin-bottom: 16px;
    max-width: 46px;
    justify-content: center;

    .node-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 1rem;
    }
  }
}

.node-overview {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
}


.status-bubble {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: $radius-lg;
  font-weight: 600;
  font-size: 0.875rem;
  background-color: var(--primary-color);
  color: white;

  &.yellow {
    background-color: #ffc107;
    color: #000;
  }

  &.danger {
    background-color: #dc3545;
    color: white;
  }

  &.white {
    background-color: #f8f9fa;
    color: #000;
    border: 1px solid var(--border-color);
  }
}


.vault-address-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.vault-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.bond-info {
  margin-bottom: 1rem;
  font-size: 14px;
  color: var(--sec-font-color);
  display: flex;
  justify-content: space-between;

  b {
    color: var(--font-color);
    margin-right: 4px;
  }
}

.votes-container {
  display: flex;
  flex-direction: row;
  overflow: auto;
  padding-bottom: 8px;
  margin-bottom: 8px;
  gap: 8px;
  margin: 0 10px;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) var(--bg-color);
  min-width: 1rem;

  .vote-card {
    flex: 0 0 auto;
    max-width: 18rem;
    word-break: break-all;
  }

  .vote-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    .vote-row {
      display: flex;
      align-items: flex-start;
      align-items: center;
    }

    .vote-label {
      color: var(--sec-font-color);
      margin-right: 0.5rem;
    }

    .vote-value {
      font-weight: bold;
      color: var(--sec-font-color);
    }
  }
}

.node-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: var(--card-bg-color);
  color: var(--sec-font-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-lg;
  padding: $space-10;
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

.chain-status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: flex-start;
  padding: 0.5rem 0;
  max-width: 50rem;

  .chain-status-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    min-width: 60px;
    gap: 0.25rem;

    .chain-header {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--sec-font-color);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1;
      display: flex;
      align-items: center;
      gap: 0.25rem;

      .chain-icon {
        width: 16px;
        height: 16px;
        border-radius: 50%;
      }
    }

    .chain-status-value {
      font-size: 0.875rem;
      font-weight: 600;
      line-height: 1.2;
      padding: 0.125rem 0.25rem;
      border-radius: 3px;
      min-height: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;

      .version {
        color: #4caf50;
        font-weight: 600;
      }

      .number {
        color: #ff9800;
        font-weight: 600;
      }

      .table-icon {
        width: 16px;
        height: 16px;
      }

      .clickable {
        cursor: pointer;
      }

      .hoverable:hover {
        text-decoration: underline !important;
      }

      .bad-link {
        color: #f44336 !important;
      }

      &.chain-ok,
      &.health-ok {
        color: #4caf50;
      }

      &.chain-warning,
      &.health-warning {
        color: #ff9800;
      }

      &.chain-error,
      &.health-error {
        color: #f44336;
      }

      .status-link {
        color: inherit;
        text-decoration: none;
        font-weight: inherit;

        &:hover {
          text-decoration: underline;
        }

        &.health-ok {
          color: #4caf50;
        }

        &.health-warning {
          color: #ff9800;
        }

        &.health-error {
          color: #f44336;
        }
      }
    }
  }

  @media (max-width: 768px) {
    justify-content: center;

    .chain-status-item {
      min-width: 50px;
    }
  }
}
</style>
