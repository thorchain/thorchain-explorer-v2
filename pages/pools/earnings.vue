<template>
  <Page>
    <Nav :active-mode.sync="period" :nav-items="periods" pre-text="Period :" />
    <Card title="Pool Earnings">
      <template #header>
        <span v-if="tableData.length > 0">
          {{ formatUnixDate(tableData[0].startTime) }}
          -
          {{ formatUnixDate(tableData[0].endTime) }}
        </span>
        <button
          class="button-container full-screen-btn"
          @click="showChange = !showChange"
        >
          <template v-if="showChange"> Hide Changes </template>
          <template v-else> Show Changes </template>
        </button>
      </template>
      <div class="earning-box">
        <TableLoader v-if="loading" :cols="cols" :rows="Array(10).fill({})" />
        <vue-good-table
          v-if="!loading && tableData.length > 0"
          :columns="cols"
          :rows="tableData"
          style-class="vgt-table net-table"
          :sort-options="{
            enabled: true,
            initialSortBy: { field: 'swapVolume', type: 'desc' },
          }"
        >
          <template slot="table-row" slot-scope="props">
            <div
              v-if="props.column.field == 'pool'"
              v-tooltip="props.row.asset"
              class="cell-content"
            >
              <AssetIcon :asset="props.row.pool" />
              <span>{{ props.formattedRow[props.column.field] }}</span>
            </div>
            <div v-else-if="props.column.field === 'endAssetDepth'">
              {{ props.formattedRow[props.column.field] }}
              <progress-icon
                v-if="showChange"
                :data-number="
                  smallBaseAmountFormat(props.row.change.endAssetDepth)
                "
                :is-down="props.row.change.endAssetDepth < 0"
              />
              <span
                class="extra-text"
                style="font-size: 0.6rem; font-weight: bold"
              >
                {{ showAsset(props.row.pool) }}
              </span>
            </div>
            <div v-else-if="props.column.field === 'endRuneDepth'">
              <span
                class="extra-text"
                style="font-size: 0.6rem; font-weight: bold"
              >
                {{ runeCur() }}
              </span>
              {{ props.formattedRow[props.column.field] }}
              <progress-icon
                v-if="showChange"
                :data-number="
                  smallBaseAmountFormat(props.row.change.endRuneDepth)
                "
                :is-down="props.row.change.endRuneDepth < 0"
              />
            </div>
            <div
              v-else-if="
                props.column.field === 'swapFees' ||
                props.column.field === 'earnings' ||
                props.column.field === 'swapVolume' ||
                props.column.field === 'rewards' ||
                props.column.field === 'estEarnings'
              "
            >
              $
              {{
                smallBaseAmountFormat(
                  +props.row[props.column.field] * runePrice
                )
              }}
              <progress-icon
                v-if="showChange"
                :data-number="
                  smallBaseAmountFormat(
                    +props.row.change[props.column.field] * runePrice
                  )
                "
                :is-down="+props.row.change[props.column.field] < 0"
              />
            </div>
            <div
              v-else-if="
                props.column.field === 'feesEarnings' ||
                props.column.field === 'feesReward' ||
                props.column.field === 'poolAPR'
              "
            >
              {{ props.formattedRow[props.column.field] }}
              <progress-icon
                v-if="showChange"
                :data-number="`${percentageFormat(props.row.change[props.column.field], 2)}`"
                :is-down="props.row.change[props.column.field] < 0"
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
  asyncData({ redirect }) {
    if (process.env.NETWORK === 'mainnet') {
      return
    }
    return redirect('/pools/main')
  },
  data() {
    return {
      loading: false,
      error: false,
      period: 'Week',
      showChange: true,
      periods: [
        { text: '24 Hours', mode: 'day' },
        { text: '1 Week', mode: 'Week' },
        { text: '1 Month', mode: 'Month' },
        { text: '1 Year', mode: 'Year' },
      ],
      cols: [
        {
          label: 'Asset',
          field: 'pool',
          formatFn: this.formatAsset,
        },
        {
          label: 'Asset Depth',
          field: 'endAssetDepth',
          type: 'number',
          formatFn: this.smallBaseAmountFormat,
          tdClass: 'mono',
        },
        {
          label: 'Rune Depth',
          field: 'endRuneDepth',
          type: 'number',
          formatFn: this.smallBaseAmountFormat,
          tdClass: 'mono',
        },
        {
          label: 'Swap Volume',
          field: 'swapVolume',
          type: 'number',
          formatFn: this.baseAmountFormat,
          tdClass: 'mono',
        },
        {
          label: 'Earnings',
          field: 'earnings',
          type: 'number',
          tdClass: 'mono',
        },
        {
          label: 'Fees',
          field: 'swapFees',
          type: 'number',
          formatFn: this.smallBaseAmountFormat,
          tdClass: 'mono',
        },
        {
          label: 'Rewards',
          field: 'rewards',
          type: 'number',
          formatFn: this.smallBaseAmountFormat,
          tdClass: 'mono',
        },
        {
          label: 'Fees/Earnings',
          field: 'feesEarnings',
          type: 'percentage',
          tdClass: 'mono',
        },
        {
          label: 'Fees/Reward',
          field: 'feesReward',
          type: 'percentage',
          tdClass: 'mono',
        },
        {
          label: 'Est. Yr. Earnings',
          field: 'estEarnings',
          type: 'number',
          formatFn: this.baseAmountFormat,
          tdClass: 'mono',
        },
        {
          label: 'Est. Yr. Return',
          field: 'poolAPR',
          type: 'percentage',
          tdClass: 'mono',
        },
      ],
      tableData: [],
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
  },
  watch: {
    period(period) {
      this.updatePool(period)
    },
  },
  mounted() {
    this.updatePool(this.period)
  },
  methods: {
    async updatePool(period) {
      this.loading = true
      const poolsData = (await this.$api.getPoolsHistory(period)).data
      const oldPoolsData = (await this.$api.getOldPoolsHistory(period)).data
      this.createTableData(poolsData, oldPoolsData)
      this.loading = false
    },
    formatAsset(asset) {
      return asset.length > 10 ? asset.slice(0, 14) + '...' : asset
    },
    getChange(newD, oldD) {
      return oldD ? +newD - +oldD : +newD
    },
    createTableData(poolsData, oldPoolsData) {
      this.tableData = poolsData.pools.map((p) => {
        const o = oldPoolsData.pools.find((op) => op.pool === p.pool)
        const pe = p.earnings * this.getPPY(this.period)
        const ea = pe / (+p.endRuneDepth * 2)
        const oea =
          (o?.earnings * this.getPPY(this.period)) / (+p?.startRuneDepth * 2)
        return {
          ...p,
          feesEarnings: p.swapFees / p.earnings,
          feesReward: p.swapFees / p.rewards,
          poolAPR: ea,
          estEarnings: pe,
          change: {
            endAssetDepth: this.getChange(p.endAssetDepth, p.startAssetDepth),
            endRuneDepth: this.getChange(p.endRuneDepth, p.startRuneDepth),
            earnings: this.getChange(p.earnings, o?.earnings),
            swapVolume: this.getChange(p.swapVolume, o?.swapVolume),
            swapFees: this.getChange(p.swapFees, o?.swapFees),
            rewards: this.getChange(p.rewards, o?.rewards),
            feesEarnings: this.getChange(
              p.swapFees / p.earnings,
              o?.swapFees / o?.earnings
            ),
            feesReward: this.getChange(
              p.swapFees / p.rewards,
              o?.swapFees / o?.rewards
            ),
            estEarnings: this.getChange(
              pe,
              o?.earnings * this.getPPY(this.period)
            ),
            poolAPR: this.getChange(ea, oea),
          },
        }
      })
    },
    getPPY(period) {
      switch (period) {
        case 'day':
          return 365
        case 'Month':
          return 12
        case 'Year':
          return 1
        case 'Week':
          return 52.1429
      }
    },
  },
  head: {
    title: 'THORChain Network Explorer | Pools Earnings',
  },
}
</script>

<style lang="scss">
.earning-box {
  .nav-headers.box.pools-type-table {
    margin: $space-0 !important;
    border: 1px solid var(--border-color);
    border-bottom: 0;
    border-radius: 7px 8px 0 0;
  }
}
</style>
