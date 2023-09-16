<template>
  <Page>
    <Nav :active-mode.sync="period" :nav-items="periods" pre-text="Period :" />
    <Card :is-loading="loading">
      <div v-if="tableData.length > 0" class="pools-box">
        <vue-good-table
          v-if="tableData.length > 0"
          :columns="poolCols"
          :rows="tableData"
          style-class="vgt-table net-table"
          :sort-options="{
            enabled: true,
          }"
        >
          <template slot="table-row" slot-scope="props">
            <div v-if="props.column.field == 'pool'" v-tooltip="props.row.asset" class="cell-content">
              <AssetIcon :asset="props.row.pool" />
              <span>{{ props.formattedRow[props.column.field] }}</span>
            </div>
            <div v-else-if="props.column.field === 'endAssetDepth'">
              {{ props.formattedRow[props.column.field] }}
              <progress-icon
                v-if="true"
                :data-number="smallBaseAmountFormat(props.row.change.endAssetDepth)"
                :is-down="props.row.change.endAssetDepth < 0"
              />
              <span class="extra-text" style="font-size: .6rem; font-weight: bold;">
                {{ showAsset(props.row.pool) }}
              </span>
            </div>
            <div v-else-if="props.column.field === 'endRuneDepth'">
              <span class="extra-text" style="font-size: .6rem; font-weight: bold;">
                {{ runeCur() }}
              </span>
              {{ props.formattedRow[props.column.field] }}
              <progress-icon
                v-if="true"
                :data-number="smallBaseAmountFormat(props.row.change.endRuneDepth)"
                :is-down="props.row.change.endRuneDepth < 0"
              />
            </div>
            <div
              v-else-if="
                props.column.field === 'swapFees' ||
                  props.column.field === 'earnings' ||
                  props.column.field === 'swapVolume' ||
                  props.column.field === 'rewards'"
            >
              $ {{ smallBaseAmountFormat(+props.row[props.column.field]* runePrice) }}
              <progress-icon
                v-if="true"
                :data-number="smallBaseAmountFormat(+props.row.change[props.column.field]* runePrice)"
                :is-down="+props.row.change[props.column.field]< 0"
              />
            </div>
            <div v-else-if="props.column.field === 'feesEarnings'">
              {{ props.formattedRow[props.column.field] }}
              <progress-icon
                v-if="true"
                :data-number="`${props.row.change.feesEarnings.toFixed(2) * 1e2}%`"
                :is-down="props.row.change.feesEarnings < 0"
              />
            </div>
            <span v-else>
              {{ props.formattedRow[props.column.field] }}
            </span>
          </template>
        </vue-good-table>
      </div>
    </Card>
  </Page>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  data () {
    return {
      loading: false,
      error: false,
      period: 'Week',
      periods: [
        { text: '24 Hours', mode: 'day' },
        { text: '1 Week', mode: 'Week' },
        { text: '1 Month', mode: 'Month' },
        { text: '1 Year', mode: 'Year' }
      ],
      poolCols: [
        {
          label: 'Asset',
          field: 'pool',
          formatFn: this.formatAsset
        },
        {
          label: 'Asset Depth',
          field: 'endAssetDepth',
          type: 'number',
          formatFn: this.smallBaseAmountFormat,
          tdClass: 'mono'
        },
        {
          label: 'Rune Depth',
          field: 'endRuneDepth',
          type: 'number',
          formatFn: this.smallBaseAmountFormat,
          tdClass: 'mono'
        },
        {
          label: 'Swap Volume',
          field: 'swapVolume',
          type: 'number',
          formatFn: this.baseAmountFormat,
          tdClass: 'mono'
        },
        {
          label: 'Earnings',
          field: 'earnings',
          type: 'number',
          tdClass: 'mono'
        },
        {
          label: 'Fees',
          field: 'swapFees',
          formatFn: this.smallBaseAmountFormat,
          tdClass: 'mono'
        },
        {
          label: 'Rewards',
          field: 'rewards',
          formatFn: this.smallBaseAmountFormat,
          tdClass: 'mono'
        },
        {
          label: 'Fees Ratio',
          field: 'feesEarnings',
          type: 'percentage',
          tdClass: 'mono'
        }
      ],
      tableData: []
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice'
    })
  },
  watch: {
    period (period) {
      this.updatePool(period)
    }
  },
  mounted () {
    this.updatePool(this.period)
  },
  methods: {
    async updatePool (period) {
      this.loading = true
      const poolsData = (await this.$api.getPoolsHistory(period)).data
      const oldPoolsData = (await this.$api.getOldPoolsHistory(period)).data
      this.createTableData(poolsData, oldPoolsData)
      this.loading = false
    },
    formatAsset (asset) {
      return asset.length > 10
        ? asset.slice(0, 14) + '...'
        : asset
    },
    getChange (newD, oldD) {
      return (oldD ? (+newD - +oldD) : +newD)
    },
    createTableData (poolsData, oldPoolsData) {
      this.tableData = poolsData.pools.map((p) => {
        const o = oldPoolsData.pools.find(op => op.pool === p.pool)
        return {
          ...p,
          feesEarnings: p.swapFees / p.earnings,
          change: {
            endAssetDepth: this.getChange(p.endAssetDepth, p.startAssetDepth),
            endRuneDepth: this.getChange(p.endRuneDepth, p.startRuneDepth),
            earnings: this.getChange(p.earnings, o?.earnings),
            swapVolume: this.getChange(p.swapVolume, o?.swapVolume),
            swapFees: this.getChange(p.swapFees, o?.swapFees),
            rewards: this.getChange(p.rewards, o?.rewards),
            feesEarnings: this.getChange((p.swapFees / p.earnings), (o?.swapFees / o?.earnings))
          }
        }
      })
    }
  }
}
</script>

<style lang="scss">
.pools-box {
  .nav-headers.box.pools-type-table {
    margin: 0 !important;
    border: 1px solid var(--border-color);
    border-bottom: 0;
    border-radius: 7px 8px 0 0;
  }
}
</style>
