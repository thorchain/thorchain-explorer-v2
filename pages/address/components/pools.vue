<template>
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
        <span
          v-if="props.row[props.column.field][0]"
          v-tooltip="
            showPrice(
              { poolPrice: runePrice },
              props.row[props.column.field][0]
            )
          "
          >{{ props.row[props.column.field][0] | number('0,0.00') }}
          <small>RUNE</small></span
        >
        <span
          v-if="props.row[props.column.field][1]"
          v-tooltip="showPrice(props.row, props.row[props.column.field][1])"
          class="ellipsis"
        >
          {{
            props.row[props.column.field][1] ||
            props.row[props.column.field][1] === 0
              ? $options.filters.number(
                  props.row[props.column.field][1],
                  '0,0.000000'
                )
              : '-'
          }}
          <small class="ellipsis">{{ showAsset(props.row.pool) }}</small>
        </span>
        <span v-else-if="!props.row[props.column.field][0]">-</span>
      </span>
      <span v-else-if="props.column.field == 'share'">
        <span v-if="props.row.share">{{
          percentageFormat(props.row.share, 4)
        }}</span>
        <span v-else>-</span>
      </span>
    </template>
  </vue-good-table>
</template>

<script>
import moment from 'moment'
import { mapGetters } from 'vuex'
export default {
  props: ['address'],
  data() {
    return {
      type: 'saver',
      pools: [],
      lps: [],
      cols: [
        {
          label: 'Pool',
          field: 'pool',
          formatFn: this.formatAsset,
        },
        {
          label: 'Liquidity Share',
          field: 'share',
          type: 'number',
          tdClass: 'mono',
        },
        {
          label: 'Rune/Asset Redeem',
          field: 'poolShare',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono',
        },
        {
          label: 'Rune/Asset Added',
          field: 'poolAdded',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono',
        },
        {
          label: 'Rune/Asset Withdrawn',
          field: 'poolWithdrawn',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono',
        },
        {
          label: 'First Added',
          field: 'dateFirstAdded',
          type: 'text',
        },
      ],
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
  },
  async mounted() {
    if (!this.address) {
      return
    }
    const { data: pools } = await this.$api.getPools()
    this.pools = pools
    try {
      const {
        data: { pools: memberDetails },
      } = await this.$api.getMemberDetails(this.address)
      this.parseMemberDetails(memberDetails)
      this.findShare(pools, memberDetails)
    } catch (error) {
      console.error('member not found', error)
    }
    try {
      const {
        data: { pools: saverDetails },
      } = await this.$api.getSaverDetails(this.address)
      this.parseSaverDetails(saverDetails)
    } catch (error) {
      console.error('saver not found', error)
    }
  },
  methods: {
    parseMemberDetails(pools) {
      this.lps = pools.map((p) => ({
        ...p,
        poolAdded: [p.runeAdded / 100000000, p.assetAdded / 100000000],
        poolWithdrawn: [
          p.runeWithdrawn / 100000000,
          p.assetWithdrawn / 100000000,
        ],
        dateFirstAdded: moment.unix(p.dateFirstAdded).fromNow(),
        share: 0,
        poolShare: [],
        poolPrice: this.getPoolPrice(p),
      }))
    },
    parseSaverDetails(saverPools) {
      this.lps.push(
        ...saverPools.map((p) => ({
          ...p,
          poolAdded: [undefined, p.assetDeposit / 1e8],
          poolWithdrawn: [undefined, p.assetWithdrawn / 1e8],
          dateFirstAdded: moment.unix(p.dateFirstAdded).fromNow(),
          share: this.getSaverShare(p),
          poolShare: [undefined, p.assetRedeem / 1e8],
          poolPrice: this.getPoolPrice(p),
          label: 'saver',
        }))
      )
    },
    findShare(pools, memberDetails) {
      memberDetails.forEach((m, i) => {
        const poolDetail = pools.find((p) => p.asset === m.pool)
        const share = m.liquidityUnits / poolDetail.units
        const runeAmount = share * poolDetail.runeDepth
        const assetAmount = share * poolDetail.assetDepth
        this.lps[i].share = share
        this.lps[i].poolShare.push(+runeAmount / 10e7, +assetAmount / 10e7)
      })
    },
    getPoolPrice(saverPool) {
      const poolDetail = this.pools.find((p) => p.asset === saverPool.pool)
      if (!poolDetail) {
        return 0
      }
      return +poolDetail.assetPriceUSD
    },
    getSaverShare(saverPool) {
      const poolDetail = this.pools.find((p) => p.asset === saverPool.pool)
      if (!poolDetail) {
        return 0
      }
      return +saverPool.saverUnits / +poolDetail.saversUnits
    },
    showPrice(row, amount) {
      if (!amount) {
        return ''
      }
      return this.$options.filters.currency(amount * row.poolPrice)
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
  cursor: pointer;

  span {
    display: block;
    max-width: 200px;
  }
}

.vgt-right-align .pool-cell span {
  margin-left: auto;
}
</style>
