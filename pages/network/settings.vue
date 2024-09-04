<template>
  <Page>
    <info-card :options="networkSettings" />
  </Page>
</template>

<script>
import StatTable from '~/components/StatTable.vue'
import { blockTime } from '~/utils'

const camelCase = (e) => e && e.replace(/([A-Z])/g, ' $1')

export default {
  components: { StatTable },
  data() {
    return {
      networkConst: [],
      mimir: undefined,
    }
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
              usdValue: true,
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
              header: 'Swappings',
            },
            {
              name: 'All Trading are Halted',
              value: this.mimir?.HALTTRADING ? 'Yes' : 'No',
            },

            {
              name: 'BTC Trading is Halted',
              value: this.mimir?.HALTBTCTRADING ? 'Yes' : 'No',
            },
            {
              name: 'ETH Trading is Halted',
              value: this.mimir?.HALTETHTRADING ? 'Yes' : 'No',
            },
            {
              name: 'BNB Trading is Halted',
              value: this.mimir?.HALTBNBTRADING ? 'Yes' : 'No',
            },
            {
              name: 'DOGE Trading is Halted',
              value: this.mimir?.HALTDOGETRADING ? 'Yes' : 'No',
            },

            {
              name: 'BCH Trading is Halted',
              value: this.mimir?.HALTBCHTRADING ? 'Yes' : 'No',
            },
            {
              name: 'GAIA Trading is Halted',
              value: this.mimir?.HALTGAIATRADING ? 'Yes' : 'No',
            },
            {
              name: 'LTC Trading is Halted',
              value: this.mimir?.HALTLTCTRADING ? 'Yes' : 'No',
            },
            {
              name: 'AVAX Trading is Halted',
              value: this.mimir?.HALTAVAXTRADING ? 'Yes' : 'No',
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
              value: this.mimir?.HALTCHAINGLOBAL ? 'Yes' : 'No',
            },

            {
              name: 'BTC CHAIN is paused',
              value: this.mimir?.HALTBTCCHAIN ? 'Yes' : 'No',
            },
            {
              name: 'ETH CHAIN is paused',
              value: this.mimir?.HALTETHCHAIN ? 'Yes' : 'No',
            },
            {
              name: 'BNB CHAIN is paused',
              value: this.mimir?.HALTBNBCHAIN ? 'Yes' : 'No',
            },
            {
              name: 'DOGE CHAIN is paused',
              value: this.mimir?.HALTDOGECHAIN ? 'Yes' : 'No',
            },

            {
              name: 'BCH CHAIN is paused',
              value: this.mimir?.HALTBCHCHAIN ? 'Yes' : 'No',
            },
            {
              name: 'GAIA CHAIN is paused',
              value: this.mimir?.HALTGAIACHAIN ? 'Yes' : 'No',
            },
            {
              name: 'LTC CHAIN is paused',
              value: this.mimir?.HALTLTCCHAIN ? 'Yes' : 'No',
            },
            {
              name: 'AVAX CHAIN is paused',
              value: this.mimir?.HALTAVAXCHAIN ? 'Yes' : 'No',
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
            },

            {
              name: camelCase('NativeTransactionFee'),
              value:
                this.networkConst?.int_64_values?.NativeTransactionFee /
                10 ** 8,
              usdValue: true,
            },
            {
              name: 'TNS Fee On Sale',
              value: this.networkConst?.int_64_values?.TNSFeeOnSale,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: 'TNS Fee Per Block',
              value: this.networkConst?.int_64_values?.TNSFeePerBlock,
            },
            {
              name: 'TNS Register Fee',
              value: this.networkConst?.int_64_values?.TNSRegisterFee,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
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
              header: 'LP Management',
            },

            {
              name: 'Add/Remove liquidity is paused',
              value: this.mimir?.PAUSELP ? 'Yes' : 'No',
            },

            {
              name: 'BTC LP is paused',
              value: this.mimir?.PAUSELPBTC ? 'Yes' : 'No',
            },
            {
              name: 'ETH LP is paused',
              value: this.mimir?.PAUSELPETH ? 'Yes' : 'No',
            },
            {
              name: 'BNB LP is paused',
              value: this.mimir?.PAUSELPBNB ? 'Yes' : 'No',
            },
            {
              name: 'DOGE LP is paused',
              value: this.mimir?.PAUSELPDOGE ? 'Yes' : 'No',
            },

            {
              name: 'BCH LP is paused',
              value: this.mimir?.PAUSELPBCH ? 'Yes' : 'No',
            },
            {
              name: 'GAIA LP is paused',
              value: this.mimir?.PAUSELPGAIA ? 'Yes' : 'No',
            },
            {
              name: 'LTC LP is paused',
              value: this.mimir?.PAUSELPLTC ? 'Yes' : 'No',
            },
            {
              name: 'AVAX LP is paused',
              value: this.mimir?.PAUSELPAVAX ? 'Yes' : 'No',
            },

            {
              ...this.parseConstant('LiquidityLockUpBlocks'),
            },

            // Impermanent Loss Protection

            {
              ...this.parseConstant('FullImpLossProtectionBlocks', {
                extraInfo: (v) => blockTime(v),
              }),
              name: 'Impermanent Loss Protection (Block)',
              extraInfo: 'Overwritten by Mimir',
            },

            {
              header: 'Node Management',
            },
            {
              ...this.parseConstant('MinimumBondInRune', {
                filter: (v) =>
                  `${this.$options.filters.number(v / 1e8, '0,0')}`,
              }),
              extraInfo: 'Overwritten by Mimir',
            },
            this.parseConstant('ValidatorMaxRewardRatio'),

            // Yggdrasil Management

            {
              ...this.parseConstant('YggFundLimit', {
                filter: (v) => this.$options.filters.percent(v / 100),
              }),
              extraInfo: 'Overwritten by Mimir',
            },
            {
              ...this.parseConstant('YggFundRetry', {
                extraInfo: `${blockTime(this.mimir?.YGGFUNDRETRY)}, `,
              }),
              extraInfo: 'Overwritten by Mimir',
            },
            {
              ...this.parseConstant('YggFundLimit', {
                filter: (v) => (v ? 'Disabled' : 'Enabled'),
              }),
              extraInfo: 'Overwritten by Mimir',
            },

            {
              ...this.parseConstant('MinimumNodesForYggdrasil'),
            },

            {
              name: camelCase('LackOfObservationPenalty'),
              value: this.networkConst?.int_64_values?.LackOfObservationPenalty,
              extraInfo: 'Slashes',
            },
            {
              name: camelCase('SigningTransactionPeriod'),
              value: this.networkConst?.int_64_values?.SigningTransactionPeriod,
              extraInfo: blockTime(
                this.networkConst?.int_64_values?.SigningTransactionPeriod
              ),
            },
            {
              name: camelCase('DoubleSignMaxAge'),
              value: this.networkConst?.int_64_values?.DoubleSignMaxAge,
              extraInfo: blockTime(
                this.networkConst?.int_64_values?.DoubleSignMaxAge
              ),
            },
            {
              name: camelCase('FailKeysignSlashPoints'),
              value: this.networkConst?.int_64_values?.FailKeysignSlashPoints,
              extraInfo: 'Slashes',
            },
            {
              name: camelCase('FailKeygenSlashPoints'),
              value: this.networkConst?.int_64_values?.FailKeygenSlashPoints,
              extraInfo: 'Slashes',
            },

            {
              name: camelCase('ObserveSlashPoints'),
              value: this.networkConst?.int_64_values?.ObserveSlashPoints,
              extraInfo: 'Slashes',
            },
            {
              name: camelCase('ObservationDelayFlexibility'),
              value:
                this.networkConst?.int_64_values?.ObservationDelayFlexibility,
              extraInfo: blockTime(
                this.networkConst?.int_64_values?.ObservationDelayFlexibility
              ),
            },
            {
              name: camelCase('JailTimeKeygen'),
              value: this.networkConst?.int_64_values?.JailTimeKeygen,
              extraInfo: blockTime(
                this.networkConst?.int_64_values?.JailTimeKeygen
              ),
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: camelCase('JailTimeKeysign'),
              value: this.networkConst?.int_64_values?.JailTimeKeysign,
              extraInfo: blockTime(
                this.networkConst?.int_64_values?.JailTimeKeysign
              ),
            },

            {
              name: 'Asgard Size',
              value: this.networkConst?.int_64_values?.AsgardSize,
            },
            {
              name: camelCase('MinSlashPointsForBadValidator'),
              value:
                this.networkConst?.int_64_values?.MinSlashPointsForBadValidator,
              extraInfo: 'Slashes',
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
              extraInfo: 'Max number of validatorsOverwritten by Mimir',
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
  head: {
    title: 'THORChain Network Explorer | Network Settings',
  },
}
</script>

<style></style>
