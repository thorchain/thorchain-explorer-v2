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
              name: camelCase('OutboundTransactionFee'),
              value:
                this.networkConst?.int_64_values?.OutboundTransactionFee /
                10 ** 8,
              usdValue: true,
            },
            {
              name: camelCase('MaxTxOutOffset'),
              value: this.networkConst?.int_64_values?.MaxTxOutOffset,
              extraInfo: blockTime(
                this.networkConst?.int_64_values?.MaxTxOutOffset
              ),
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: camelCase('MinTxOutVolumeThreshold'),
              value:
                this.networkConst?.int_64_values?.MinTxOutVolumeThreshold /
                10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: camelCase('TxOutDelayMax'),
              value: this.networkConst?.int_64_values?.TxOutDelayMax,
              extraInfo: blockTime(
                this.networkConst?.int_64_values?.TxOutDelayMax
              ),
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: camelCase('TxOutDelayRate'),
              value: this.networkConst?.int_64_values?.TxOutDelayRate,
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
              extraInfo: 'The block height Trading will be halted',
            },

            {
              header: 'Synths',
            },
            {
              name: camelCase('MaxSwapsPerBlock'),
              value: this.networkConst?.int_64_values?.MaxSwapsPerBlock,
            },
            {
              name: camelCase('MinSwapsPerBlock'),
              value: this.networkConst?.int_64_values?.MinSwapsPerBlock,
            },

            // Synths

            {
              ...this.parseConstant('MaxSynthPerPoolDepth', {
                filter: (v) => this.$options.filters.percent(v / 1e4, 2),
              }),
              extraInfo: 'Overwritten by Mimir',
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
              name: camelCase('NodePauseChainBlocks'),
              value: this.networkConst?.int_64_values?.NodePauseChainBlocks,
              extraInfo: blockTime(
                this.networkConst?.int_64_values?.NodePauseChainBlocks
              ),
            },
            {
              name: camelCase('BlocksPerYear'),
              value: this.networkConst?.int_64_values?.BlocksPerYear,
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
              name: camelCase('NativeTransactionFee'),
              value:
                this.networkConst?.int_64_values?.NativeTransactionFee /
                10 ** 8,
              filter: (v) => `${runeCur()} ${v}`,
            },

            {
              header: 'THORName',
            },
            {
              name: 'TNS Fee On Sale',
              value: this.networkConst?.int_64_values?.TNSFeeOnSale,
              filter: (v) => `${runeCur()} ${this.baseAmountFormatOrZero(v)}`,
            },
            {
              name: 'TNS Fee Per Block',
              value: this.networkConst?.int_64_values?.TNSFeePerBlock,
              filter: (v) => `${runeCur()} ${this.baseAmountFormatOrZero(v)}`,
            },
            {
              name: 'TNS Register Fee',
              value: this.networkConst?.int_64_values?.TNSRegisterFee,
              filter: (v) => `${runeCur()} ${this.baseAmountFormatOrZero(v)}`,
            },

            {
              header: 'LP Management',
            },
            {
              name: 'Add/Remove liquidity is paused',
              value: this.mimir?.PAUSELP ? 'Yes' : 'No',
            },
          ],
        },
        {
          title: 'Economics ',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: camelCase('EmissionCurve'),
              value: this.mimir?.EMISSIONCURVE,
              extraInfo: 'Overwritten by Mimir',
            },
            {
              name: camelCase('IncentiveCurve'),
              value: this.networkConst?.int_64_values?.IncentiveCurve,
            },
            {
              name: camelCase('MaxAvailablePools'),
              value: this.networkConst?.int_64_values?.MaxAvailablePools,
            },

            {
              ...this.parseConstant('MinRunePoolDepth', {}),
              extraInfo: 'Overwritten by Mimir',
              filter: (v) => `${this.$options.filters.number(v / 1e8, '0,0')}`,
            },
            {
              name: camelCase('PoolCycle'),
              value: this.mimir?.POOLCYCLE,
              extraInfo: `${blockTime(this.mimir?.POOLCYCLE)}, Overwritten by Mimir`,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: camelCase('StagedPoolCost'),
              value: this.networkConst?.int_64_values?.StagedPoolCost / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
              usdValue: true,
            },
            {
              ...this.parseConstant('LiquidityLockUpBlocks'),
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
              name: 'Permitted Solvency Gap',
              value: this.networkConst?.int_64_values?.PermittedSolvencyGap,
            },

            {
              header: 'Node Management',
            },

            {
              ...this.parseConstant('MinimumBondInRune', {
                filter: (v) =>
                  `${runeCur()} ${this.$options.filters.number(v / 1e8, '0,0')}`,
              }),
              extraInfo: 'Overwritten by Mimir',
            },
            {
              name: 'Asgard Size',
              value: this.networkConst?.int_64_values?.AsgardSize,
            },
            this.parseConstant('ValidatorMaxRewardRatio'),
            {
              name: camelCase('SigningTransactionPeriod'),
              value: this.networkConst?.int_64_values?.SigningTransactionPeriod,
              extraInfo: blockTime(
                this.networkConst?.int_64_values?.SigningTransactionPeriod
              ),
            },
            {
              name: camelCase('FailKeysignSlashPoints'),
              value: this.networkConst?.int_64_values?.FailKeysignSlashPoints,
              filter: (v) => `${v} slashes`,
            },
            {
              name: camelCase('FailKeygenSlashPoints'),
              value: this.networkConst?.int_64_values?.FailKeygenSlashPoints,
              filter: (v) => `${v} slashes`,
            },

            {
              name: camelCase('ObserveSlashPoints'),
              value: this.networkConst?.int_64_values?.ObserveSlashPoints,
              filter: (v) => `${v} slashes`,
            },
            {
              name: camelCase('LackOfObservationPenalty'),
              value: this.networkConst?.int_64_values?.LackOfObservationPenalty,
              filter: (v) => `${v} slashes`,
            },
            {
              name: camelCase('MinSlashPointsForBadValidator'),
              value:
                this.networkConst?.int_64_values?.MinSlashPointsForBadValidator,
              filter: (v) => `${v} slashes`,
            },
            {
              name: camelCase('DoubleSignMaxAge'),
              value: this.networkConst?.int_64_values?.DoubleSignMaxAge,
              extraInfo: blockTime(
                this.networkConst?.int_64_values?.DoubleSignMaxAge
              ),
              filter: (v) => `${v} blocks`,
            },
            {
              name: camelCase('ObservationDelayFlexibility'),
              value:
                this.networkConst?.int_64_values?.ObservationDelayFlexibility,
              extraInfo: blockTime(
                this.networkConst?.int_64_values?.ObservationDelayFlexibility
              ),
              filter: (v) => `${v} blocks`,
            },
            {
              name: camelCase('JailTimeKeygen'),
              value: this.networkConst?.int_64_values?.JailTimeKeygen,
              extraInfo: blockTime(
                this.networkConst?.int_64_values?.JailTimeKeygen
              ),
              filter: (v) => `${this.$options.filters.number(v, '0,0')} blocks`,
            },
            {
              name: camelCase('JailTimeKeysign'),
              value: this.networkConst?.int_64_values?.JailTimeKeysign,
              extraInfo: blockTime(
                this.networkConst?.int_64_values?.JailTimeKeysign
              ),
              filter: (v) => `${this.$options.filters.number(v, '0,0')} blocks`,
            },

            {
              header: 'Churning',
            },
            {
              name: camelCase('ChurnInterval'),
              value: this.mimir?.CHURNINTERVAL,
              extraInfo: blockTime(this.mimir?.CHURNINTERVAL),
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              ...this.parseConstant('HaltChurning', {
                filter: (v) => (v ? 'Yes' : 'No'),
              }),
              name: 'Churning is halted',
            },
            {
              name: 'Max node to churn out for lower version',
              ...this.parseConstant('MaxNodeToChurnOutForLowVersion'),
            },

            {
              ...this.parseConstant('DesiredValidatorSet', {}),
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
