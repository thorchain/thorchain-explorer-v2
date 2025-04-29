<template>
  <Page>
    <cards-header :table-general-stats="lendingGeneralStats" />
    <info-card :options="lendingSettings">
      <template #mini="{ item }">
        <div :class="['mini-bubble', { danger: !item.value }]">
          {{ item.filter(item.value) }}
        </div>
      </template>
    </info-card>
    <Card title="Lending Pools">
      <vue-good-table
        :columns="cols"
        :rows="borrowers"
        style-class="vgt-table net-table"
        :pagination-options="{
          enabled: true,
          perPage: 5,
          perPageDropdownEnabled: false,
        }"
      >
        <template slot="table-row" slot-scope="props">
          <div v-if="props.column.field == 'pool'" class="asset-cell">
            <AssetIcon :asset="props.row.pool" />
            <span class="ellipsis">
              {{ props.row.pool }}
            </span>
            <div
              v-if="props.row.label"
              class="bubble-container"
              style="margin-left: 10px"
            >
              {{ props.row.label }}
            </div>
          </div>
          <span
            v-else-if="props.column.field.startsWith('pool')"
            class="pool-cell ellipsis"
          >
            <span v-if="props.row[props.column.field][0]"
              >{{ props.row[props.column.field][0] | number('0,0.00') }}
              <small>RUNE</small></span
            >
            <span v-if="props.row[props.column.field][1]" class="ellipsis"
              >{{
                props.row[props.column.field][1] ||
                props.row[props.column.field][1] === 0
                  ? $options.filters.number(
                      props.row[props.column.field][1],
                      '0,0.000000'
                    )
                  : '-'
              }}
              <small class="ellipsis">{{ props.row.pool }}</small></span
            >
            <span v-else-if="!props.row[props.column.field][0]">-</span>
          </span>
          <span
            v-else-if="
              props.column.field == 'collateral' ||
              props.column.field == 'collateralAvailable'
            "
          >
            <span
              v-if="props.row.collateral"
              :class="{
                'danger-text':
                  props.row.fill >= 1 &&
                  props.column.field == 'collateralAvailable',
              }"
            >
              {{ props.formattedRow[props.column.field] }}
              <small>{{ props.row.pool }}</small>
            </span>
            <span v-else>-</span>
          </span>
          <span v-else-if="props.column.field == 'debt'">
            <span v-if="props.row.debt"
              >{{ formatSmallCurrency(props.row.debt) }}
              <small>TOR</small></span
            >
            <span v-else>-</span>
          </span>
          <span v-else-if="props.column.field == 'availableRune'">
            <span v-if="props.row.debt"
              >{{ props.formattedRow[props.column.field] }}
              <small>RUNE</small></span
            >
            <span v-else>-</span>
          </span>
          <span v-else-if="props.column.field == 'fill'">
            <span :class="{ 'danger-text': props.row.fill >= 1 }">{{
              props.formattedRow[props.column.field]
            }}</span>
          </span>
        </template>
      </vue-good-table>
    </Card>
  </Page>
</template>

<script>
import endpoints from '~/api/endpoints'
import { mapGetters } from 'vuex'

export default {
  data() {
    return {
      reserveAddress: endpoints[process.env.NETWORK].MODULE_ADDR,
      polOverview: undefined,
      mimir: undefined,
      networkConst: undefined,
      currentRuneSupply: undefined,
      maxRuneSupply: 50000000000000000,
      torPool: undefined,
      lendingSettings: [
        {
          title: 'Lending Settings',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Pause Loan',
              extraInfo: 'Ability to pause opening/closing loans',
            },
            {
              name: 'Loan Repayment Maturity',
              extraInfo:
                'Specifies how long a loan must be open before it can be closed',
            },
            {
              name: 'Minimum Collateral Ratio',
            },
            {
              name: 'Maximum Collateral Ratio',
            },
            {
              name: 'Lending Lever',
              extraInfo:
                'Determines the risk profile the protocol is willing to take',
            },
          ],
        },
        {
          title: 'Lending Assets',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Enable Lending on BTC',
            },
            {
              name: 'Enable Lending on ETH',
            },
          ],
        },
      ],
      pools: [],
      borrowers: [],
      cols: [
        {
          label: 'Pool',
          field: 'pool',
          formatFn: this.formatAsset,
        },
        {
          label: 'Total Collateral',
          field: 'collateral',
          type: 'number',
          formatFn: this.baseAmountFormat,
          tdClass: 'mono',
        },
        {
          label: 'Total Debt',
          field: 'debt',
          type: 'number',
          formatFn: this.baseAmountFormat,
          tdClass: 'mono',
        },
        {
          label: 'Borrowers',
          field: 'borrowersCount',
          type: 'number',
          formatFn: this.normalFormat,
          tdClass: 'mono',
        },
        {
          label: 'Collateral Available',
          field: 'collateralAvailable',
          type: 'number',
          formatFn: this.baseAmountFormat,
          tdClass: 'mono',
        },
        {
          label: 'Lending Cap',
          field: 'fill',
          type: 'percentage',
          tdClass: 'mono',
        },
        {
          label: 'Available Rune',
          field: 'availableRune',
          type: 'number',
          formatFn: this.baseAmountFormat,
          tdClass: 'mono',
        },
      ],
      lendingGeneralStats: [
        {
          name: 'Health Factor',
        },
        {
          name: 'Lending Fill Percentage',
        },
        {
          name: 'Total Collateral',
        },
        {
          name: 'Total Debt',
        },
      ],
    }
  },
  head: {
    title: 'THORChain Network Explorer | Lending',
  },
  computed: {
    ...mapGetters({
      midgardPools: 'getPools',
      runePrice: 'getRunePrice',
    }),
  },
  async mounted() {
    try {
      const { data: mimirData } = await this.$api.getMimir()
      this.mimir = mimirData

      const { data: constantsData } = await this.$api.getConstants()
      this.networkConst = constantsData

      const { data: borrowersData } = await this.$api.getBorrowersInfo()
      this.borrowers = borrowersData

      this.loadSettings()
    } catch (error) {
      console.error(error)
    }

    // Get RUNE supply
    const { data: supplies } = await this.$api.getSupplyRune()
    for (const [, v] of Object.entries(supplies)) {
      if (v.denom === 'rune') {
        this.currentRuneSupply = +v.amount
      }
    }
    if (process.env.NETWORK === 'stagenet') {
      this.maxRuneSupply = +this.mimir.MAXRUNESUPPLY ?? 100000000000000
    }
    this.updateGeneralStats()
  },
  methods: {
    calculateTotalCollateral() {
      if (!this.borrowers || this.borrowers.length === 0) {
        return 0
      }
      return this.borrowers.reduce(
        (total, borrower) => total + borrower.collateralPoolInRune,
        0
      )
    },

    healthScore() {
      const totalCollateralInRune = this.calculateTotalCollateral()
      if (
        totalCollateralInRune === 0 ||
        !this.currentRuneSupply ||
        !this.maxRuneSupply
      ) {
        return undefined
      }

      return (
        (this.maxRuneSupply - this.currentRuneSupply) / totalCollateralInRune
      )
    },

    pctFull() {
      const totalCollateralInRune = this.calculateTotalCollateral()
      if (totalCollateralInRune === 0 || !this.mimir?.LENDINGLEVER) {
        return undefined
      }

      const availableRune = this.maxRuneSupply - this.currentRuneSupply
      const lendingCap = availableRune / (10000 / this.mimir.LENDINGLEVER)

      return totalCollateralInRune / lendingCap
    },

    collateralValue() {
      const totalCollateralInRune = this.calculateTotalCollateral()
      return (totalCollateralInRune * this.runePrice) / 1e8
    },

    totalDebt() {
      if (!this.borrowers || this.borrowers.length === 0) {
        return 0
      }

      const totalDebtInRune = this.borrowers.reduce(
        (total, borrower) => total + borrower.debtInRune,
        0
      )
      return (totalDebtInRune * this.runePrice) / 1e8
    },

    updateGeneralStats() {
      if (!this.borrowers || this.borrowers.length < 2) {
        return
      }

      this.lendingGeneralStats = [
        {
          name: 'Health Factor',
          value: this.$options.filters.percent(this.healthScore()),
          description: 'Total Burned in Rune / Total Collateral in Rune',
        },
        {
          name: 'Lending Fill Percentage',
          value: this.$options.filters.percent(this.pctFull()),
          description: 'Used Capacity of THORChain Lending',
        },
        {
          name: 'Total Collateral',
          value: this.$options.filters.currency(this.collateralValue()),
        },
        {
          name: 'Total Debt',
          value: this.$options.filters.currency(this.totalDebt()),
        },
      ]
    },

    loadSettings() {
      if (!this.mimir) {
        return
      }

      this.lendingSettings = [
        {
          title: 'Lending Settings',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              valueSlot: 'mini',
              ...this.parseConstant('PauseLoans'),
              filter: (v) => (v ? 'Yes' : 'No'),
              extraInfo: 'Ability to pause opening/closing loans',
            },
            {
              ...this.parseConstant('LoanRepaymentMaturity'),
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
              extraInfo:
                'Specifies how long a loan must be open before it can be closed',
            },
            {
              ...this.parseConstant('MinCR'),
              filter: (v) => `${this.$options.filters.percent(v / 1e4, 2)}`,
              name: 'Minimum Collateral Ratio',
            },
            {
              ...this.parseConstant('MaxCR'),
              filter: (v) => `${this.$options.filters.percent(v / 1e4, 2)}`,
              name: 'Maximum Collateral Ratio',
            },
            {
              ...this.parseConstant('LendingLever'),
              filter: (v) => `${this.$options.filters.percent(v / 1e4, 2)}`,
              extraInfo:
                'Determines the risk profile the protocol is willing to take',
            },
          ],
        },
        {
          title: 'Lending Assets',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              valueSlot: 'mini',
              ...this.parseConstant('LENDING-THOR-BTC'),
              filter: (v) => (v ? 'Yes' : 'No'),
              name: 'Enable Lending on BTC',
            },
            {
              valueSlot: 'mini',
              ...this.parseConstant('LENDING-THOR-ETH'),
              filter: (v) => (v ? 'Yes' : 'No'),
              name: 'Enable Lending on ETH',
            },
          ],
        },
      ]
    },
  },
}
</script>

<style lang="scss" scoped>
.ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.asset-cell {
  max-width: 200px;
  display: flex;
  align-items: center;

  span {
    display: block;
    font-size: $font-size-mobile;
  }
}

.pool-cell {
  span {
    display: block;
    max-width: 200px;
  }
}

.vgt-right-align .pool-cell span {
  margin-left: auto;
}

.stat-template {
  display: grid;
  gap: 15px;
  margin-bottom: $space-16;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  grid-template-rows: auto;

  .stat-card {
    padding: $space-32 $space-0;
    border-radius: $radius-lg;
    background-color: var(--card-bg-color);
    border: 1px solid var(--border-color);

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .stat-value {
      color: var(--sec-font-color);
      font-size: $font-size-xl;
      text-align: center;
      min-width: 80%;
    }

    .stat-header {
      color: var(--font-color);
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;

      .header-icon {
        fill: var(--font-color);
        margin-left: $space-10;
        height: 0.9rem;
        width: 0.9rem;
      }
    }
  }
}
</style>
