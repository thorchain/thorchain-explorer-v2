<template>
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
</template>

<script>
import moment from 'moment'
export default {
  data () {
    return {
      reserveAddress: 'thor1dheycdevq39qlkxs2a6wuuzyn4aqxhve4qxtxt',
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
      console.log(this.lps)
    } catch (error) {
      console.error('member not found', error)
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
