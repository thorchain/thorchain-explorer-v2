<template>
  <Page>
    <Nav
      :active-mode.sync="activeView"
      :nav-items="navItems"
      pre-text="View:"
    />
    <info-card v-if="activeView === 'info'" :options="networkSettings">
      <template #usd="{ item }">
        {{ item.filter(item.value) }}
        <small>(${{ ((item.value / 1e8) * runePrice) | number('0a') }})</small>
      </template>
    </info-card>

    <div v-else class="constants-table">
      <div id="vote-search-container">
        <input
          v-model="searchKey"
          type="text"
          placeholder="Search by key..."
          class="search-input"
        />
        <search-icon class="search-icon" />
      </div>
      <card>
        <vue-good-table
          :columns="combinedSettingsCols"
          :rows="filteredCombinedSettings"
          style-class="vgt-table net-table"
          :sort-options="{
            enabled: true,
            initialSortBy: { field: 'status', type: 'desc' },
          }"
        >
          <template slot="table-row" slot-scope="props">
            <div
              v-if="props.column.field === 'status'"
              class="status-container"
            >
              <span
                :class="[
                  'mini-bubble',
                  { info: props.row.status === 'Constant' },
                ]"
              >
                {{ props.row.status }}
              </span>
              <info-icon
                v-if="props.row.extraInfo"
                v-tooltip="props.row.extraInfo"
                class="table-icon"
              />
            </div>
            <span v-else>
              {{ props.formattedRow[props.column.field] }}
            </span>
          </template>
        </vue-good-table>
      </card>
    </div>
  </Page>
</template>

<script>
import { mapGetters } from 'vuex'
import { blockTime } from '~/utils'
import InfoIcon from '~/assets/images/info.svg?inline'
import SearchIcon from '~/assets/images/search.svg?inline'

export default {
  components: {
    InfoIcon,
    SearchIcon,
  },
  data() {
    return {
      networkConst: [],
      mimir: undefined,
      combinedSettings: [],
      combinedSettingsCols: [
        { label: 'Key', field: 'name' },
        {
          label: 'Value',
          field: 'value',
          tdClass: 'mono',
          formatFn: (v) => (v ? this.normalFormat(v) : '0'),
        },
        { label: 'Status', field: 'status' },
      ],
      searchKey: '',
      activeView: 'info',
      navItems: [
        { text: 'Settings Overview', mode: 'info' },
        { text: 'Detailed Constants/Mimir', mode: 'table' },
      ],
    }
  },
  head: {
    title: 'THORChain Network Explorer | Network Settings',
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
    networkSettings() {
      return [
        {
          title: 'Outbound Transactions',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              ...this.parseConstant('OutboundTransactionFee'),
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
              valueSlot: 'usd',
            },
            {
              ...this.parseConstant('MaxTxOutOffset', {
                extraText: blockTime(
                  this.networkConst?.int_64_values?.MaxTxOutOffset
                ),
              }),
              filter: (v) => `${this.normalFormat(v, '0,0')}`,
            },
            {
              ...this.parseConstant('MinTxOutVolumeThreshold'),
              filter: (v) => `${this.normalFormat(v / 1e8)}`,
            },
            {
              ...this.parseConstant('TxOutDelayMax', {
                extraText: blockTime(
                  this.networkConst?.int_64_values?.TxOutDelayMax
                ),
              }),
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              ...this.parseConstant('TxOutDelayRate'),
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },

            {
              header: 'Trading',
            },
            {
              name: 'All Trading are Halted',
              value: this.mimir?.HALTTRADING
                ? this.mimir?.HALTTRADING > 1
                  ? this.mimir?.HALTTRADING
                  : 'Yes'
                : 'No',
              ...(this.mimir?.HALTTRADING > 1 && {
                extraInfo: 'The block height Trading will be halted',
              }),
            },

            {
              header: 'Synths',
            },
            {
              ...this.parseConstant('MaxSwapsPerBlock'),
            },
            {
              ...this.parseConstant('MinSwapsPerBlock'),
            },

            // Synths

            {
              ...this.parseConstant('MaxSynthPerPoolDepth', {
                filter: (v) => this.$options.filters.percent(v / 1e4, 2),
              }),
            },
            {
              name: 'Synth Burning',
              value: this.mimir?.BURNSYNTHS ? 'Disabled' : 'Enabled',
            },
            {
              name: 'Synth Minting',
              value: this.mimir?.MINTSYNTHS ? 'Disabled' : 'Enabled',
            },
            {
              name: 'Virtual Mult Synths',
              value: this.networkConst?.int_64_values?.VirtualMultSynths,
            },
            {
              header: 'Chain Management',
            },
            {
              name: 'Observations on all chains are paused',
              value: this.mimir?.HALTCHAINGLOBAL
                ? this.mimir?.HALTCHAINGLOBAL > 1
                  ? this.mimir?.HALTCHAINGLOBAL
                  : 'Yes'
                : 'No',
            },

            {
              ...this.parseConstant('NodePauseChainBlocks', {
                extraText: blockTime(
                  this.networkConst?.int_64_values?.NodePauseChainBlocks
                ),
              }),
            },
            {
              ...this.parseConstant('BlocksPerYear'),
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              ...this.parseConstant('MAXUTXOSTOSPEND'),
              name: 'Max UTXO to be spend on one block',
            },
            {
              ...this.parseConstant('MinimumNodesForBFT'),
              name: 'Minimum Nodes For BFT',
            },
            {
              ...this.parseConstant('NativeTransactionFee'),
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
              valueSlot: 'usd',
            },

            {
              header: 'THORName',
            },
            {
              ...this.parseConstant('TNSFeeOnSale'),
              name: 'Fee On Sale',
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
            },
            {
              ...this.parseConstant('TNSFeePerBlock'),
              name: 'Fee Per Block',
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
            },
            {
              ...this.parseConstant('TNSRegisterFee'),
              name: 'Register Fee',
              filter: (v) =>
                `${this.$options.filters.number(v / 1e8, '0,0a')} RUNE`,
              valueSlot: 'usd',
            },
          ],
        },
        {
          title: 'Economics ',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              ...this.parseConstant('EmissionCurve'),
            },
            {
              ...this.parseConstant('MaxAvailablePools'),
            },
            {
              ...this.parseConstant('MinRunePoolDepth'),
              filter: (v) => `${this.$options.filters.number(v / 1e8, '0,0')}`,
            },
            {
              ...this.parseConstant('PoolCycle', {
                extraText: blockTime(this.mimir?.POOLCYCLE),
              }),
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              ...this.parseConstant('StagedPoolCost'),
              filter: (v) => `${this.$options.filters.number(v / 1e8, '0,0')}`,
            },
            {
              ...this.parseConstant('LiquidityLockUpBlocks'),
            },
            {
              name: 'Add/Remove liquidity is paused',
              value: this.mimir?.PAUSELP ? 'Yes' : 'No',
            },
            {
              header: 'Solvency',
            },
            {
              name: 'Solvency Check',
              value: this.mimir?.STOPSOLVENCYCHECK ? 'Disabled' : 'Enabled',
            },
            {
              name: 'BNB Solvency Check',
              value: this.mimir?.STOPSOLVENCYCHECKBNB ? 'Disabled' : 'Enabled',
            },
            {
              name: 'ETH Solvency Check',
              value: this.mimir?.STOPSOLVENCYCHECKETH ? 'Disabled' : 'Enabled',
            },
            {
              // Is this In RUNE
              ...this.parseConstant('PermittedSolvencyGap'),
            },

            {
              header: 'Node Management',
            },
            {
              ...this.parseConstant('MinimumBondInRune'),
              filter: (v) =>
                `${this.$options.filters.number(v / 1e8, '0,0a')} RUNE`,

              valueSlot: 'usd',
            },
            {
              ...this.parseConstant('AsgardSize'),
            },
            {
              ...this.parseConstant('ValidatorMaxRewardRatio'),
            },
            {
              ...this.parseConstant('SigningTransactionPeriod', {
                extraText: blockTime(
                  this.networkConst?.int_64_values?.SigningTransactionPeriod
                ),
              }),
            },
            {
              ...this.parseConstant('FailKeysignSlashPoints'),
              value: this.networkConst?.int_64_values?.FailKeysignSlashPoints,
              filter: (v) => `${v} slashes`,
            },
            {
              ...this.parseConstant('FailKeygenSlashPoints'),
              filter: (v) => `${v} slashes`,
            },
            {
              ...this.parseConstant('ObserveSlashPoints'),
              filter: (v) => `${v} slashes`,
            },
            {
              ...this.parseConstant('LackOfObservationPenalty'),
              filter: (v) => `${v} slashes`,
            },
            {
              ...this.parseConstant('MinSlashPointsForBadValidator'),
              filter: (v) => `${v} slashes`,
            },
            {
              ...this.parseConstant('DoubleSignMaxAge', {
                extraText: blockTime(
                  this.networkConst?.int_64_values?.DoubleSignMaxAge
                ),
              }),
              filter: (v) => `${v} blocks`,
            },
            {
              ...this.parseConstant('ObservationDelayFlexibility', {
                extraText: blockTime(
                  this.networkConst?.int_64_values?.ObservationDelayFlexibility
                ),
              }),
              filter: (v) => `${v} blocks`,
            },
            {
              ...this.parseConstant('JailTimeKeygen', {
                extraText: blockTime(
                  this.networkConst?.int_64_values?.JailTimeKeygen
                ),
              }),
              filter: (v) => `${this.$options.filters.number(v, '0,0')} blocks`,
            },
            {
              ...this.parseConstant('JailTimeKeysign', {
                extraText: blockTime(
                  this.networkConst?.int_64_values?.JailTimeKeysign
                ),
              }),
              filter: (v) => `${this.$options.filters.number(v, '0,0')} blocks`,
            },

            {
              header: 'Churning',
            },
            {
              ...this.parseConstant('ChurnInterval'),
              filter: (v) => `${blockTime(this.mimir?.CHURNINTERVAL)}`,
            },
            {
              ...this.parseConstant('HaltChurning'),
              name: 'Churning is halted',
              filter: (v) => (v ? 'Yes' : 'No'),
            },
            {
              ...this.parseConstant('MaxNodeToChurnOutForLowVersion'),
            },

            {
              ...this.parseConstant('DesiredValidatorSet'),
              extraInfo: 'Max number of validators, Overwritten by Mimir',
            },
            {
              ...this.parseConstant('FundMigrationInterval'),
              extraInfo: 'Overwritten by Mimir',
            },
            {
              ...this.parseConstant('NumberOfNewNodesPerChurn'),
            },
            {
              ...this.parseConstant('BadValidatorRedline'),
              extraInfo: 'Overwritten by Mimir',
            },
          ],
        },
      ]
    },
    filteredCombinedSettings() {
      if (!this.searchKey) return this.combinedSettings
      return this.combinedSettings.filter((row) =>
        row.key.toLowerCase().includes(this.searchKey.toLowerCase())
      )
    },
  },
  mounted() {
    this.getNetworkData().then((data) => {
      this.combinedSettings = data
    })
  },
  methods: {
    async getNetworkData() {
      try {
        const [constRes, mimirRes] = await Promise.all([
          this.$api.getConstants(),
          this.$api.getMimir(),
        ])

        this.networkConst = constRes.data
        this.mimir = mimirRes.data

        // Create combined array of settings
        const combinedSettings = []

        // Add constants
        if (this.networkConst?.int_64_values) {
          for (const [key, value] of Object.entries(
            this.networkConst.int_64_values
          )) {
            const parsedConstant = this.parseConstant(key)
            console.log(parsedConstant)
            combinedSettings.push({
              ...parsedConstant,
              status: parsedConstant.extraInfo ? 'Mimir' : 'Constant',
              key: key.toUpperCase(),
            })
          }
        }

        // Add mimirs
        if (this.mimir) {
          for (const [key, value] of Object.entries(this.mimir)) {
            if (!combinedSettings.find((s) => s.key === key)) {
              combinedSettings.push({
                name: key,
                value,
                status: 'Mimir',
                key,
              })
            }
          }
        }

        return combinedSettings
      } catch (e) {
        console.error(e)
        return []
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.status-container {
  display: flex;
  align-items: center;
  gap: $space-8;
}

#vote-search-container {
  display: flex;
  position: relative;
  margin: 0 $space-10;
  margin-bottom: $space-12;

  @include md {
    margin: 0;
    margin-bottom: $space-12;
  }
}

.search-input {
  flex: 1;
  color: var(--sec-font-color);
  background-color: var(--bg-color);
  border: 1px solid var(--border-color) !important;
  border-radius: $radius-sm;
  outline: none;
  padding: $space-12;
  font-size: 1rem;
  font-weight: 450;
}

.search-input:focus {
  border-color: transparent;
  box-shadow: 0 0 0 0.15rem rgba(255, 255, 255, 0.1);
  color: var(--primary-color);
}

.search-icon {
  position: absolute;
  width: 20px;
  height: 24px;
  fill: var(--font-color);
  right: 0.8rem;
  top: calc(50% - 0.8rem);
  cursor: pointer;
  transition: fill 0.3s ease;
  box-sizing: content-box;
  background: var(--card-bg-color);
  padding-left: 5px;
}
</style>
