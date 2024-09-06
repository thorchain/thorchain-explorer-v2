<template>
  <Page>
    <info-card :options="networkSettings" />
  </Page>
</template>

<script>
import StatTable from '~/components/StatTable.vue'
import { blockTime, runeCur } from '~/utils'

const camelCase = (e) => e && e.replace(/([A-Z])/g, ' $1')

export default {
  components: { StatTable },
  data() {
    return {
      networkConst: [],
      mimir: undefined,
    }
  },
  head: {
    title: 'THORChain Network Explorer | Network Settings',
  },
  computed: {
    networkSettings() {
      return [
        {
          title: 'Outbound Transactions',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              ...this.parseConstant('OutboundTransactionFee'),
              filter: (v) => `${runeCur()} ${this.decimalFormat(v)}`,
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
              filter: (v) => `${runeCur()} ${this.decimalFormat(v)}`,
            },

            {
              header: 'THORName',
            },
            {
              ...this.parseConstant('TNSFeeOnSale'),
              name: 'Fee On Sale',
              filter: (v) => `${runeCur()} ${this.decimalFormat(v)}`,
            },
            {
              ...this.parseConstant('TNSFeePerBlock'),
              name: 'Fee Per Block',
              filter: (v) => `${runeCur()} ${this.decimalFormat(v)}`,
            },
            {
              ...this.parseConstant('TNSRegisterFee'),
              name: 'Register Fee',
              filter: (v) => `${runeCur()} ${this.unitFormat(v)}`,
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
                `${runeCur()} ${this.$options.filters.number(v / 1e8, '0,0')}`,
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
  },
  mounted() {
    this.$api
      .getConstants()
      .then((res) => {
        this.networkConst = res.data
      })
      .catch((e) => {
        console.error(e)
      })

    this.$api
      .getMimir()
      .then((res) => {
        this.mimir = res.data
      })
      .catch((e) => {
        console.error(e)
      })
  },
}
</script>

<style></style>
