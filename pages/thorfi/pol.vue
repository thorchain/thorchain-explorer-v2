<template>
  <Page>
    <stat-table header="Overview" :table-settings="polSettings" />
    <stat-table header="Mimirs" :table-settings="polMimirSettings" />
    <div class="simple-card">
      <div class="card-header">
        Pools
      </div>
      <div class="card-body">
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
              <span v-if="props.row[props.column.field][0]">{{ props.row[props.column.field][0] | number('0,0.00') }} <small>RUNE</small></span>
              <span v-if="props.row[props.column.field][1]" class="ellipsis">{{ props.row[props.column.field][1] || props.row[props.column.field][1] === 0 ? ($options.filters.number(props.row[props.column.field][1], '0,0.000000')) : '-' }} <small class="ellipsis">{{ props.row.pool }}</small></span>
              <span v-else-if="!props.row[props.column.field][0]">-</span>
            </span>
            <span v-else-if="props.column.field == 'share'">
              <span v-if="props.row.share">{{ percentageFormat(props.row.share, 4) }}</span>
              <span v-else>-</span>
            </span>
          </template>
        </vue-good-table>
      </div>
    </div>
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
    polSettings () {
      return [
        [
          {
            name: 'Current RUNE deposited',
            value: this.polOverview?.current_deposit / 1e8,
            filter: true,
            runeValue: true
          },
          {
            name: 'Current value',
            value: this.polOverview?.value / 1e8,
            filter: true,
            runeValue: true
          },
          {
            name: 'Overall RUNE deposited',
            value: this.polOverview?.rune_deposited / 1e8,
            filter: true,
            runeValue: true
          },
          {
            name: 'Overall RUNE Withdrawn',
            value: this.polOverview?.rune_withdrawn / 1e8,
            filter: true,
            runeValue: true
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
      const POLMaxNetworkDeposit = this.mimir?.POLMAXNETWORKDEPOSIT / 1e8

      return [
        [
          {
            name: 'Enable POL',
            value: this.mimir?.ENABLEPOL ? 'Yes' : 'No',
            filter: true
          }
        ],
        [
          {
            name: 'Max Synth Utilisation per Pool',
            value: this.$options.filters.percent(this.mimir?.MAXSYNTHPERPOOLDEPTH / 1e4, 2),
            filter: true
          },
          {
            name: 'POL Target Synth per Pool Depth',
            value: this.$options.filters.percent(synthTargetPerPool, 2),
            filter: true,
            extraInfo: `POL will continue adding RUNE to a pool until the synth depth of that pool is ${this.$options.filters.percent(synthTargetPerPool, 2)}`
          }
        ],
        [
          {
            name: 'POL Buffer',
            value: this.$options.filters.percent(polBuffer, 2),
            filter: true,
            extraInfo: `Synth utilization must be >${polBuffer * 100}% from the target synth per pool depth in order to add liquidity / remove liquidity. In this context, liquidity will be withdrawn below ${(synthTargetPerPool - polBuffer) * 100}% synth utilization and deposited above ${(synthTargetPerPool + polBuffer) * 100}% synth utilization.`
          },
          {
            name: 'POL Max Pool Movement',
            value: this.$options.filters.percent(PolMaxPoolMovement, 2),
            filter: true,
            extraInfo: `POL will move the pool price at most ${PolMaxPoolMovement * 100}% in one block.`
          },
          {
            name: 'POL Max Network Deposit',
            value: POLMaxNetworkDeposit,
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
      const { data: polData } = await this.$api.getPol()
      this.polOverview = polData

      const { data: mimirData } = await this.$api.getMimir()
      this.mimir = mimirData
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
