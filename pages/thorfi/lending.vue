<template>
  <Page>
    <div class="stat-template">
      <div class="stat-card">
        <div class="stat-header">
          Health Factor
          <unknown-icon
            v-tooltip="'Total Burned in Rune / Total Collateral in Rune'"
            class="header-icon"
          />
        </div>
        <skeleton-item :loading="!healthScore" class="stat-value">
          {{ healthScore | percent }}
        </skeleton-item>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          Lending Fill Percentage
          <unknown-icon
            v-tooltip="'Used Capacity of THORChain Lending'"
            class="header-icon"
          />
        </div>
        <skeleton-item :loading="!pctFull" class="stat-value">
          {{ pctFull | percent }}
        </skeleton-item>
      </div>
      <div class="stat-card">
        <div class="stat-header">Total Collateral</div>
        <skeleton-item :loading="!collateralValue" class="stat-value">
          {{ collateralValue | number('0a') }}
          <span class="mono">RUNE</span>
        </skeleton-item>
      </div>
      <div class="stat-card">
        <div class="stat-header">Total Debt</div>
        <skeleton-item :loading="!totalDebt" class="stat-value">
          {{ totalDebt | number('0a') }}
          <span class="mono">RUNE</span>
        </skeleton-item>
      </div>
    </div>
    <stat-table header="Mimirs" :table-settings="lendingSettings" />
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
    }
  },
  computed: {
    lendingSettings() {
      if (!this.mimir) {
        return []
      }

      return [
        [
          {
            ...this.parseConstant('PauseLoans', {
              filter: (v) => (v ? 'Yes' : 'No'),
            }),
            filter: true,
            extraInfo: 'Ability to pause opening/closing loans',
          },
          {
            ...this.parseConstant('LoanRepaymentMaturity'),
            extraInfo:
              'Specifies how long a loan must be open before it can be closed',
          },
        ],
        [
          {
            ...this.parseConstant('MinCR', {
              filter: (v) => `${this.$options.filters.percent(v / 1e4, 2)}`,
            }),
            name: 'Minimum Collateral Ratio',
            filter: true,
          },
          {
            ...this.parseConstant('MaxCR', {
              filter: (v) => `${this.$options.filters.percent(v / 1e4, 2)}`,
            }),
            name: 'Maximum Collateral Ratio',
            filter: true,
          },
          {
            ...this.parseConstant('LendingLever', {
              filter: (v) => `${this.$options.filters.percent(v / 1e4, 2)}`,
            }),
            extraInfo:
              'Determines the risk profile the protocol is willing to take',
            filter: true,
          },
        ],
        [
          {
            ...this.parseConstant('LENDING-THOR-BTC', {
              filter: (v) => (v ? 'Yes' : 'No'),
            }),
            name: 'Enable Lending on BTC',
            filter: true,
          },
          {
            ...this.parseConstant('LENDING-THOR-ETH', {
              filter: (v) => (v ? 'Yes' : 'No'),
            }),
            name: 'Enable Lending on ETH',
            filter: true,
          },
          {
            ...this.parseConstant('LENDING-THOR-ATOM', {
              filter: (v) => (v ? 'Yes' : 'No'),
            }),
            name: 'Enable Lending on ATOM',
            filter: true,
          },
          {
            ...this.parseConstant('LENDING-THOR-AVAX', {
              filter: (v) => (v ? 'Yes' : 'No'),
            }),
            name: 'Enable Lending on AVAX',
            filter: true,
          },
        ],
        [
          {
            ...this.parseConstant('LENDING-THOR-BNB', {
              filter: (v) => (v ? 'Yes' : 'No'),
            }),
            name: 'Enable Lending on BNB',
            filter: true,
          },
          {
            ...this.parseConstant('LENDING-THOR-BCH', {
              filter: (v) => (v ? 'Yes' : 'No'),
            }),
            name: 'Enable Lending on BCH',
            filter: true,
          },
          {
            ...this.parseConstant('LENDING-THOR-DOGE', {
              filter: (v) => (v ? 'Yes' : 'No'),
            }),
            name: 'Enable Lending on DOGE',
            filter: true,
          },
        ],
      ]
    },
    healthScore() {
      if (!this.borrowers || this.borrowers < 2) {
        return undefined
      }
      let totalCollateralInRune = 0

      for (let i = 0; i < this.borrowers.length; i++) {
        totalCollateralInRune += this.borrowers[i].collateralPoolInRune
      }
      return (
        (this.maxRuneSupply - this.currentRuneSupply) / totalCollateralInRune
      )
    },
    pctFull() {
      if (!this.borrowers || this.borrowers < 2) {
        return undefined
      }
      let totalCollateralInRune = 0
      for (let i = 0; i < this.borrowers.length; i++) {
        totalCollateralInRune += this.borrowers[i].collateralPoolInRune
      }

      return (
        totalCollateralInRune /
        ((this.maxRuneSupply - this.currentRuneSupply) /
          (10000 / (this.mimir.LENDINGLEVER ?? 3333)))
      )
    },
    collateralValue() {
      let totalCollateralInRune = 0
      for (let i = 0; i < this.borrowers.length; i++) {
        totalCollateralInRune += this.borrowers[i].collateralPoolInRune
      }

      return totalCollateralInRune / 1e8
    },
    totalDebt() {
      let debtInRune = 0
      for (let i = 0; i < this.borrowers.length; i++) {
        debtInRune += this.borrowers[i].debtInRune
      }

      return debtInRune / 1e8
    },
  },
  async mounted() {
    const { data: pools } = await this.$api.getThorPools()
    this.pools = pools

    try {
      const { data: mimirData } = await this.$api.getMimir()
      this.mimir = mimirData

      const { data: constantsData } = await this.$api.getConstants()
      this.networkConst = constantsData

      const { data: torPool } = await this.$api.getDerivedPoolDetail('THOR.TOR')
      this.torPool = torPool
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
    const totalRuneForProtocol =
      ((this.mimir.LENDINGLEVER ?? 3333) / 10000) *
      (this.maxRuneSupply - this.currentRuneSupply)

    const totalBalanceRune = this.pools
      .filter((e) => e.asset === 'BTC.BTC' || e.asset === 'ETH.ETH')
      .map((e) => e.balance_rune)
      .reduce((a, c) => a + +c, 0)

    const lendingPools = [
      'BTC.BTC',
      'ETH.ETH',
      'AVAX.AVAX',
      'GAIA.ATOM',
      'BNB.BNB',
      'BCH.BCH',
      'DOGE.DOGE',
    ]

    try {
      for (const p of lendingPools) {
        const { data: bs } = await this.$api.getBorrowers(p)
        const poolData = this.pools.find((e) => e.asset === p)
        const collateralPoolInRune =
          poolData.loan_collateral *
          (+poolData.balance_rune / +poolData.balance_asset)

        if (!bs || poolData.loan_collateral === '0') {
          continue
        }

        bs.map((b) => ({
          ...b,
          collateral: +b.collateral_current,
          debt: +b.debt_current,
        }))

        const res = bs.reduce(
          (ac, cv, i, brs) => {
            const debt = +cv.debt_current

            return {
              debt: ac.debt + debt,
              borrowersCount: ac.borrowersCount + 1,
            }
          },
          {
            collateral: 0,
            debt: 0,
            borrowersCount: 0,
          }
        )

        this.borrowers.push({
          ...res,
          collateral: poolData.loan_collateral,
          pool: poolData.asset,
          availableRune:
            (poolData.balance_rune / totalBalanceRune) * totalRuneForProtocol,
          fill:
            collateralPoolInRune /
            ((poolData.balance_rune / totalBalanceRune) * totalRuneForProtocol),
          collateralPoolInRune,
          debtInRune:
            res.debt * (this.torPool.balance_rune / this.torPool.balance_asset),
          collateralAvailable: poolData.loan_collateral_remaining,
        })
      }
    } catch (error) {
      console.error('borrower not found', error)
    }
  },
  head: {
    title: 'THORChain Network Explorer | Lending',
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
    font-size: 0.9rem;
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
  margin-bottom: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  grid-template-rows: auto;

  .stat-card {
    padding: 2rem 0;
    border-radius: 8px;
    background-color: var(--card-bg-color);
    border: 1px solid var(--border-color);

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .stat-value {
      color: var(--sec-font-color);
      font-size: 1.5rem;
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
        margin-left: 10px;
        height: 0.9rem;
        width: 0.9rem;
      }
    }
  }
}
</style>
