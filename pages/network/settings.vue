<template>
  <Page>
    <stat-table :table-settings="outboundTxs" header="Outbound Transactions" />
    <stat-table :table-settings="swapping" header="Swapping" />
    <stat-table :table-settings="lpManagement" header="LP Management" />
    <stat-table :table-settings="chainManagement" header="Chain Management" />
    <stat-table :table-settings="nodeManagement" header="Node Management" />
    <stat-table :table-settings="economics" header="Economics" />
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
    outboundTxs() {
      return [
        [
          {
            name: camelCase('OutboundTransactionFee'),
            value:
              this.networkConst?.int_64_values?.OutboundTransactionFee /
              10 ** 8,
            filter: true,
            usdValue: true,
          },
        ],
        [
          {
            name: camelCase('MaxTxOutOffset'),
            value: this.networkConst?.int_64_values?.MaxTxOutOffset,
            extraText: blockTime(
              this.networkConst?.int_64_values?.MaxTxOutOffset
            ),
          },
          {
            name: camelCase('MinTxOutVolumeThreshold'),
            value:
              this.networkConst?.int_64_values?.MinTxOutVolumeThreshold /
              10 ** 8,
            usdValue: true,
          },
          {
            name: camelCase('TxOutDelayMax'),
            value: this.networkConst?.int_64_values?.TxOutDelayMax,
            extraText: blockTime(
              this.networkConst?.int_64_values?.TxOutDelayMax
            ),
          },
          {
            name: camelCase('TxOutDelayRate'),
            value: this.networkConst?.int_64_values?.TxOutDelayRate,
          },
        ],
      ]
    },
    swapping() {
      return [
        [
          {
            name: 'All Trading are Halted',
            value: this.mimir?.HALTTRADING ? 'Yes' : 'No',
            filter: true,
          },
        ],
        [
          {
            name: 'BTC Trading is Halted',
            value: this.mimir?.HALTBTCTRADING ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'ETH Trading is Halted',
            value: this.mimir?.HALTETHTRADING ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'BNB Trading is Halted',
            value: this.mimir?.HALTBNBTRADING ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'DOGE Trading is Halted',
            value: this.mimir?.HALTDOGETRADING ? 'Yes' : 'No',
            filter: true,
          },
        ],
        [
          {
            name: 'BCH Trading is Halted',
            value: this.mimir?.HALTBCHTRADING ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'GAIA Trading is Halted',
            value: this.mimir?.HALTGAIATRADING ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'LTC Trading is Halted',
            value: this.mimir?.HALTLTCTRADING ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'AVAX Trading is Halted',
            value: this.mimir?.HALTAVAXTRADING ? 'Yes' : 'No',
            filter: true,
          },
        ],
        [
          {
            name: camelCase('MaxSwapsPerBlock'),
            value: this.networkConst?.int_64_values?.MaxSwapsPerBlock,
          },
          {
            name: camelCase('MinSwapsPerBlock'),
            value: this.networkConst?.int_64_values?.MinSwapsPerBlock,
          },
        ],
        // Synths
        [
          {
            ...this.parseConstant('MaxSynthPerPoolDepth', {
              filter: (v) => this.$options.filters.percent(v / 1e4, 2),
            }),
            filter: true,
          },
          {
            name: 'Synth Burning',
            value: this.mimir?.BURNSYNTHS ? 'Disabled' : 'Enabled',
            filter: true,
          },
          {
            name: 'Synth Minting',
            value: this.mimir?.MINTSYNTHS ? 'Disabled' : 'Enabled',
            filter: true,
          },
          {
            name: 'Virtual Mult Synths',
            value: this.networkConst?.int_64_values?.VirtualMultSynths,
          },
        ],
      ]
    },
    lpManagement() {
      return [
        [
          {
            name: 'Add/Remove liquidity is paused',
            value: this.mimir?.PAUSELP ? 'Yes' : 'No',
            filter: true,
          },
        ],
        [
          {
            name: 'BTC LP is paused',
            value: this.mimir?.PAUSELPBTC ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'ETH LP is paused',
            value: this.mimir?.PAUSELPETH ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'BNB LP is paused',
            value: this.mimir?.PAUSELPBNB ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'DOGE LP is paused',
            value: this.mimir?.PAUSELPDOGE ? 'Yes' : 'No',
            filter: true,
          },
        ],
        [
          {
            name: 'BCH LP is paused',
            value: this.mimir?.PAUSELPBCH ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'GAIA LP is paused',
            value: this.mimir?.PAUSELPGAIA ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'LTC LP is paused',
            value: this.mimir?.PAUSELPLTC ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'AVAX LP is paused',
            value: this.mimir?.PAUSELPAVAX ? 'Yes' : 'No',
            filter: true,
          },
        ],
        [
          {
            ...this.parseConstant('LiquidityLockUpBlocks'),
          },
        ],
        // Impermanent Loss Protection
        [
          {
            ...this.parseConstant('FullImpLossProtectionBlocks', {
              extraText: (v) => blockTime(v),
            }),
            name: 'Impermanent Loss Protection (Block)',
          },
        ],
      ]
    },
    chainManagement() {
      return [
        [
          {
            name: 'Observations on all chains are paused',
            value: this.mimir?.HALTCHAINGLOBAL ? 'Yes' : 'No',
            filter: true,
          },
        ],
        [
          {
            name: 'BTC CHAIN is paused',
            value: this.mimir?.HALTBTCCHAIN ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'ETH CHAIN is paused',
            value: this.mimir?.HALTETHCHAIN ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'BNB CHAIN is paused',
            value: this.mimir?.HALTBNBCHAIN ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'DOGE CHAIN is paused',
            value: this.mimir?.HALTDOGECHAIN ? 'Yes' : 'No',
            filter: true,
          },
        ],
        [
          {
            name: 'BCH CHAIN is paused',
            value: this.mimir?.HALTBCHCHAIN ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'GAIA CHAIN is paused',
            value: this.mimir?.HALTGAIACHAIN ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'LTC CHAIN is paused',
            value: this.mimir?.HALTLTCCHAIN ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'AVAX CHAIN is paused',
            value: this.mimir?.HALTAVAXCHAIN ? 'Yes' : 'No',
            filter: true,
          },
        ],
        [
          {
            name: camelCase('NodePauseChainBlocks'),
            value: this.networkConst?.int_64_values?.NodePauseChainBlocks,
            extraText: blockTime(
              this.networkConst?.int_64_values?.NodePauseChainBlocks
            ),
          },
          {
            name: camelCase('BlocksPerYear'),
            value: this.networkConst?.int_64_values?.BlocksPerYear,
          },
          {
            ...this.parseConstant('MAXUTXOSTOSPEND'),
            name: 'Max UTXO to be spend on one block',
            filter: true,
          },
          {
            ...this.parseConstant('MinimumNodesForBFT'),
          },
        ],
        // Fee Management
        [
          {
            name: camelCase('NativeTransactionFee'),
            value:
              this.networkConst?.int_64_values?.NativeTransactionFee / 10 ** 8,
            filter: true,
            usdValue: true,
          },
          {
            name: 'TNS Fee On Sale',
            value: this.networkConst?.int_64_values?.TNSFeeOnSale,
          },
          {
            name: 'TNS Fee Per Block',
            value: this.networkConst?.int_64_values?.TNSFeePerBlock,
          },
          {
            name: 'TNS Register Fee',
            value: this.networkConst?.int_64_values?.TNSRegisterFee,
          },
        ],
        // Solvency Checker
        [
          {
            name: 'Solvency Check',
            value: this.mimir?.STOPSOLVENCYCHECK ? 'Disabled' : 'Enabled',
            filter: true,
          },
          {
            name: 'BNB Solvency Check',
            value: this.mimir?.STOPSOLVENCYCHECKBNB ? 'Disabled' : 'Enabled',
            filter: true,
          },
          {
            name: 'ETH Solvency Check',
            value: this.mimir?.STOPSOLVENCYCHECKETH ? 'Disabled' : 'Enabled',
            filter: true,
          },
          {
            // Is this In RUNE
            name: 'Permitted Solvency Gap',
            value: this.networkConst?.int_64_values?.PermittedSolvencyGap,
          },
        ],
      ]
    },
    nodeManagement() {
      return [
        [
          // Can't find the maximum bond
          {
            ...this.parseConstant('MinimumBondInRune', {
              filter: (v) => v / 1e8,
            }),
            usdValue: true,
          },
          this.parseConstant('ValidatorMaxRewardRatio'),
        ],
        // Yggdrasil Management
        [
          {
            ...this.parseConstant('YggFundLimit', {
              filter: (v) => this.$options.filters.percent(v / 100),
            }),
            filter: true,
          },
          {
            ...this.parseConstant('YggFundRetry', {
              extraText: `${blockTime(this.mimir?.YGGFUNDRETRY)}, `,
            }),
          },
          {
            ...this.parseConstant('YggFundLimit', {
              filter: (v) => (v ? 'Disabled' : 'Enabled'),
            }),
            filter: true,
          },
        ],
        [
          {
            ...this.parseConstant('MinimumNodesForYggdrasil'),
          },
        ],
        // Slashing Management
        [
          {
            name: camelCase('LackOfObservationPenalty'),
            value: this.networkConst?.int_64_values?.LackOfObservationPenalty,
            extraText: 'Slashes',
          },
          {
            name: camelCase('SigningTransactionPeriod'),
            value: this.networkConst?.int_64_values?.SigningTransactionPeriod,
            extraText: blockTime(
              this.networkConst?.int_64_values?.SigningTransactionPeriod
            ),
          },
          {
            name: camelCase('DoubleSignMaxAge'),
            value: this.networkConst?.int_64_values?.DoubleSignMaxAge,
            extraText: blockTime(
              this.networkConst?.int_64_values?.DoubleSignMaxAge
            ),
          },
          {
            name: camelCase('FailKeysignSlashPoints'),
            value: this.networkConst?.int_64_values?.FailKeysignSlashPoints,
            extraText: 'Slashes',
          },
          {
            name: camelCase('FailKeygenSlashPoints'),
            value: this.networkConst?.int_64_values?.FailKeygenSlashPoints,
            extraText: 'Slashes',
          },
        ],
        [
          {
            name: camelCase('ObserveSlashPoints'),
            value: this.networkConst?.int_64_values?.ObserveSlashPoints,
            extraText: 'Slashes',
          },
          {
            name: camelCase('ObservationDelayFlexibility'),
            value:
              this.networkConst?.int_64_values?.ObservationDelayFlexibility,
            extraText: blockTime(
              this.networkConst?.int_64_values?.ObservationDelayFlexibility
            ),
          },
          {
            name: camelCase('JailTimeKeygen'),
            value: this.networkConst?.int_64_values?.JailTimeKeygen,
            extraText: blockTime(
              this.networkConst?.int_64_values?.JailTimeKeygen
            ),
          },
          {
            name: camelCase('JailTimeKeysign'),
            value: this.networkConst?.int_64_values?.JailTimeKeysign,
            extraText: blockTime(
              this.networkConst?.int_64_values?.JailTimeKeysign
            ),
          },
        ],
        // Churning
        [
          {
            name: 'Asgard Size',
            value: this.networkConst?.int_64_values?.AsgardSize,
          },
          {
            name: camelCase('MinSlashPointsForBadValidator'),
            value:
              this.networkConst?.int_64_values?.MinSlashPointsForBadValidator,
            extraText: 'Slashes',
          },
          {
            name: camelCase('ChurnInterval'),
            value: this.mimir?.CHURNINTERVAL,
            extraText: blockTime(this.mimir?.CHURNINTERVAL),
          },
          {
            ...this.parseConstant('HaltChurning', {
              filter: (v) => (v ? 'Yes' : 'No'),
            }),
            name: 'Churning is halted',
            filter: true,
          },
          {
            name: 'Max node to churn out for lower version',
            ...this.parseConstant('MaxNodeToChurnOutForLowVersion'),
          },
        ],
        [
          {
            ...this.parseConstant('DesiredValidatorSet', {
              extraText: 'Max number of validators',
            }),
          },
          {
            ...this.parseConstant('FundMigrationInterval'),
          },
          {
            ...this.parseConstant('NumberOfNewNodesPerChurn'),
          },
          {
            ...this.parseConstant('BadValidatorRedline'),
          },
        ],
      ]
    },
    economics() {
      return [
        [
          {
            name: camelCase('EmissionCurve'),
            value: this.mimir?.EMISSIONCURVE,
            extraText: 'Overwritten by Mimir',
          },
          {
            name: camelCase('IncentiveCurve'),
            value: this.networkConst?.int_64_values?.IncentiveCurve,
          },
          {
            name: camelCase('MaxAvailablePools'),
            value: this.networkConst?.int_64_values?.MaxAvailablePools,
          },
        ],
        [
          {
            ...this.parseConstant('MinRunePoolDepth', {
              filter: (v) => v / 1e8,
            }),
            usdValue: true,
          },
          {
            name: camelCase('PoolCycle'),
            value: this.mimir?.POOLCYCLE,
            extraText: `${blockTime(this.mimir?.POOLCYCLE)}, Overwritten by Mimir`,
          },
          {
            name: camelCase('StagedPoolCost'),
            value: this.networkConst?.int_64_values?.StagedPoolCost / 10 ** 8,
            usdValue: true,
          },
        ],
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
