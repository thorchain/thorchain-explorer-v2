<template>
  <Page>
    <stat-table header="Protocol Owned Liquidity" :table-settings="polSettings">
      <template #pnl>
        <span v-if="pnl.value" :style="{ 'color': pnl.isDown ? 'red' : 'green' }">
          <span v-if="pnl.isDown">-</span>
          <span v-if="!pnl.isDown">+</span>
          {{ pnl.value | number('0,0.00') }}
          <small>RUNE</small>
        </span>
        <span v-else>-</span>
      </template>
    </stat-table>
    <stat-table v-if="providersOverview" header="Providers" :table-settings="providersSettings">
      <template #providerspnl>
        <span v-if="providerspnl.value" :style="{ 'color': providerspnl.isDown ? 'red' : 'green' }">
          <span v-if="providerspnl.isDown">-</span>
          <span v-if="!providerspnl.isDown">+</span>
          {{ providerspnl.value | number('0,0.00') }}
          <small>RUNE</small>
        </span>
        <span v-else>-</span>
      </template>
    </stat-table>
    <stat-table v-if="reserveOverview" header="Reserve" :table-settings="reserveSettings">
      <template #reservepnl>
        <span v-if="reservepnl.value" :style="{ 'color': reservepnl.isDown ? 'red' : 'green' }">
          <span v-if="reservepnl.isDown">-</span>
          <span v-if="!reservepnl.isDown">+</span>
          {{ reservepnl.value | number('0,0.00') }}
          <small>RUNE</small>
        </span>
        <span v-else>-</span>
      </template>
    </stat-table>
    <stat-table header="Mimirs" :table-settings="polMimirSettings" />
    <Card title="Rune Pool">
      <div>
        <vue-good-table
          :columns="cols"
          :rows="lps"
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
              <div v-if="props.row.label" class="bubble-container" style="margin-left: 10px">
                {{ props.row.label }}
              </div>
            </div>
            <span v-else-if="props.column.field.startsWith('pool')" class="pool-cell ellipsis">
              <span v-if="props.row[props.column.field][0]">{{ props.row[props.column.field][0] | number('0,0.00') }}
                <small>RUNE</small></span>
              <span
                v-if="props.row[props.column.field][1]"
                class="ellipsis"
              >{{ props.row[props.column.field][1] ||
                 props.row[props.column.field][1] === 0 ? ($options.filters.number(props.row[props.column.field][1], '0,0.000000')) : '-' }}
                <small class="ellipsis">{{ props.row.pool }}</small></span>
              <span v-else-if="!props.row[props.column.field][0]">-</span>
            </span>
            <span v-else-if="props.column.field == 'share'">
              <span v-if="props.row.share">{{ percentageFormat(props.row.share, 4) }}</span>
              <span v-else>-</span>
            </span>
          </template>
        </vue-good-table>
      </div>
    </Card>
  </Page>
</template>

<script>
import moment from 'moment'
import endpoints from '~/api/endpoints'

export default {
  data () {
    return {
      reserveAddress: endpoints[process.env.NETWORK].MODULE_ADDR,
      polOverview: undefined,
      reserveOverview: undefined,
      providersOverview: undefined,
      networkConst: undefined,
      mimir: undefined,
      pools: [],
      lps: [],
      cols: [
        {
          label: 'Pool',
          field: 'pool',
          formatFn: this.formatAsset
        },
        {
          label: 'Liquidity Share',
          field: 'share',
          type: 'number',
          tdClass: 'mono'
        },
        {
          label: 'Rune/Asset Share',
          field: 'poolShare',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono'
        },
        {
          label: 'Rune Added',
          field: 'poolAdded',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono'
        },
        {
          label: 'Rune Withdrawn',
          field: 'poolWithdrawn',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono'
        },
        {
          label: 'LUVI Growth',
          field: 'luvi',
          type: 'percentage',
          tdClass: 'mono'
        },
        {
          label: 'First Added',
          field: 'dateFirstAdded',
          type: 'text'
        }
      ]
    }
  },
  computed: {
    pnl () {
      const pnl = (+this.polOverview?.value - +this.polOverview?.current_deposit)

      return {
        value: Math.abs(pnl) / 1e8,
        name: 'Current RUNE PnL',
        isDown: pnl <= 0
      }
    },
    reservepnl () {
      const pnl = (+this.reserveOverview?.value - +this.reserveOverview?.current_deposit)
      return {
        value: Math.abs(pnl) / 1e8,
        name: 'Current RUNE PnL',
        isDown: pnl <= 0
      }
    },
    providerspnl () {
      const pnl = this.providersOverview?.pnl
      return {
        value: Math.abs(pnl) / 1e8,
        name: 'Current RUNE PnL',
        isDown: pnl <= 0
      }
    },
    polSettings () {
      return [
        [
          {
            name: 'Current PnL',
            slotName: 'pnl'
          },
          {
            name: 'Current Deposited',
            value: this.polOverview?.current_deposit / 1e8,
            filter: true,
            runeValue: true
          }
        ],
        [
          {
            name: 'Overall Deposited',
            value: this.polOverview?.rune_deposited / 1e8,
            filter: true,
            runeValue: true
          },
          {
            name: 'Overall Withdrawn',
            value: this.polOverview?.rune_withdrawn / 1e8,
            filter: true,
            runeValue: true
          }
        ]
      ]
    },
    reserveSettings () {
      return [
        [
          {
            name: 'Current PnL',
            slotName: 'reservepnl'
          },
          {
            name: 'Current Deposit',
            value: this.reserveOverview?.current_deposit / 1e8,
            filter: true,
            runeValue: true
          }
        ],
        [
          {
            name: 'Reserve Units',
            value: this.reserveOverview?.units
          }
        ],
        [
          {
            name: 'Reserve Share',
            value: this.$options.filters.percent(+this.reserveOverview?.value / +this.polOverview?.value, 3),
            filter: true
          }
        ]
      ]
    },
    providersSettings () {
      console.log(this.providersOverview?.value / this.polOverview?.value)
      return [
        [
          {
            name: 'Current RUNE PnL',
            slotName: 'providerspnl'
          },
          {
            name: 'Current Deposit',
            value: this.providersOverview?.current_deposit / 1e8,
            filter: true,
            runeValue: true
          },
          {
            name: 'Pending Rune',
            value: this.providersOverview?.pending_rune / 1e8,
            filter: true,
            runeValue: true
          }
        ],
        [
          {
            name: 'Providers Units',
            value: this.providersOverview?.units,
            extraInfo: 'The units of RUNEPool owned by providers (including pending)'
          },
          {
            name: 'Providers Pending Units',
            value: this.providersOverview?.pending_units,
            extraInfo: 'The units of RUNEPool owned by providers that remain pending'
          }
        ],
        [
          {
            name: 'Provider Share',
            value: this.$options.filters.percent(+this.providersOverview?.value / +this.polOverview?.value, 3),
            filter: true
          }
        ]
      ]
    },
    polMimirSettings () {
      if (!this.mimir) {
        return []
      }

      const synthTargetPerPool = this.mimir?.POLTARGETSYNTHPERPOOLDEPTH / 1e4
      const polBuffer = this.mimir?.POLBUFFER / 1e4
      const PolMaxPoolMovement = this.mimir?.POLMAXPOOLMOVEMENT / 1e4

      return [
        [
          {
            ...this.parseConstant('MaxSynthPerPoolDepth', { filter: v => this.$options.filters.percent(v / 1e4, 2) }),
            name: 'Max Synth Utilisation per Pool',
            filter: true
          },
          {
            ...this.parseConstant('POLTargetSynthPerPoolDepth', { filter: v => this.$options.filters.percent(v / 1e4, 2) }),
            name: 'POL Target Synth per Pool Depth',
            filter: true,
            extraInfo: `POL will continue adding RUNE to a pool until the synth depth of that pool is ${this.$options.filters.percent(synthTargetPerPool, 2)}`
          }
        ],
        [
          {
            ...this.parseConstant('POLBuffer', { filter: v => this.$options.filters.percent(v / 1e4, 2) }),
            name: 'POL Buffer',
            filter: true,
            extraInfo: `Synth utilization must be >${polBuffer * 100}% from the target synth per pool depth in order to add liquidity / remove liquidity. In this context, liquidity will be withdrawn below ${(synthTargetPerPool - polBuffer) * 100}% synth utilization and deposited above ${(synthTargetPerPool + polBuffer) * 100}% synth utilization.`
          },
          {
            ...this.parseConstant('POLMaxPoolMovement', { filter: v => this.$options.filters.percent(v / 1e7, 4) }),
            name: 'POL Max Pool Movement',
            filter: true,
            extraInfo: `POL will move the pool price at most ${PolMaxPoolMovement / 10}% in one block.`
          },
          {
            ...this.parseConstant('POLMaxNetworkDeposit', { filter: v => v / 1e8 }),
            name: 'POL Max Network Deposit',
            filter: true,
            runeValue: true
          }
        ],
        [
          {
            name: 'Enable POL on BTC',
            value: this.mimir['POL-BTC-BTC'] ? 'Yes' : 'No',
            filter: true
          },
          {
            name: 'Enable POL on ETH',
            value: this.mimir['POL-ETH-ETH'] ? 'Yes' : 'No',
            filter: true
          }
        ]
      ]
    }
  },
  async mounted () {
    if (!this.reserveAddress) {
      return
    }
    const { data: pools } = await this.$api.getPools()
    this.pools = pools
    try {
      const { data: { pools: memberDetails } } = await this.$api.getMemberDetails(this.reserveAddress)
      this.parseMemberDetails(memberDetails)
      this.findShare(pools, memberDetails)
      for (const poolData of memberDetails) {
        const { data: thorData } = await this.$api.getUserLpPosition(poolData.pool, this.reserveAddress)
        this.lps.find(p => p.pool === poolData.pool).luvi = thorData.luvi_growth_pct
      }
    } catch (error) {
      console.error('member not found', error)
    }

    try {
      try {
        ({ pol: this.polOverview, providers: this.providersOverview, reserve: this.reserveOverview } = (await this.$api.getRunePool()).data)
      } catch (error) {
        console.error('the rune pool endpoint is not ready')
        this.polOverview = (await this.$api.getPol()).data
      }

      const { data: mimirData } = await this.$api.getMimir()
      this.mimir = mimirData

      const { data: constantsData } = await this.$api.getConstants()
      this.networkConst = constantsData
    } catch (error) {
      console.error(error)
    }
  },
  methods: {
    parseMemberDetails (pools) {
      this.lps = pools.map(p => ({
        ...p,
        poolAdded: [p.runeAdded / 100000000, p.assetAdded / 100000000],
        poolWithdrawn: [p.runeWithdrawn / 100000000, p.assetWithdrawn / 100000000],
        dateFirstAdded: moment.unix(p.dateFirstAdded).fromNow(),
        share: 0,
        luvi: 0,
        poolShare: []
      }))
    },
    findShare (pools, memberDetails) {
      memberDetails.forEach((m, i) => {
        const poolDetail = pools.find(p => p.asset === m.pool)
        const share = m.liquidityUnits / poolDetail.units
        const runeAmount = share * poolDetail.runeDepth
        const assetAmount = share * poolDetail.assetDepth
        this.lps[i].share = share
        this.lps[i].poolShare.push(+runeAmount / 10e7, +assetAmount / 10e7)
      })
    }
  }
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
    font-size: .9rem;
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
</style>
