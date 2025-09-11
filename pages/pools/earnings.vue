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
          <template slot="table-column" slot-scope="props">
            <div
              v-if="props.column.field == 'distributed'"
              v-tooltip="
                'The distributed amount to Node Operator, Burn, TCY and dev fund'
              "
              class="table-asset end"
            >
              {{ props.column.label }}
              <info-icon class="header-icon" />
            </div>
          </template>
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
                <RuneAsset height="0.7rem" />
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
                props.column.field === 'estEarnings' ||
                props.column.field === 'distributed'
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
                props.column.field === 'lpDistributed' ||
                props.column.field === 'feesVolume' ||
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
import InfoIcon from '~/assets/images/info.svg?inline'

export default {
  components: { InfoIcon },
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
          label: 'Swap Fees',
          field: 'swapFees',
          type: 'number',
          formatFn: this.smallBaseAmountFormat,
          tdClass: 'mono',
        },
        {
          label: 'LP Earnings',
          field: 'earnings',
          type: 'number',
          formatFn: this.smallBaseAmountFormat,
          tdClass: 'mono',
        },
        {
          label: 'Distributed',
          field: 'distributed',
          type: 'number',
          tooltip:
            'The distributed amount to Node Operator, Burn, TCY and dev fund',
          formatFn: this.smallBaseAmountFormat,
          tdClass: 'mono',
        },
        {
          label: 'Fees/Volume',
          field: 'feesVolume',
          type: 'percentage',
          tdClass: 'mono',
        },
        {
          label: 'LP/Distributed',
          field: 'lpDistributed',
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
        const pe = p.swapFees * this.getPPY(this.period)
        const ea = pe / (+p.endRuneDepth * 2)
        const oea =
          (o?.swapFees * this.getPPY(this.period)) / (+p?.startRuneDepth * 2)

        return {
          ...p,
          lpDistributed: p.earnings / (+p.rewards * -1),
          feesVolume: p.swapFees / p.swapVolume,
          poolAPR: ea,
          estEarnings: pe,
          distributed: +p.rewards * -1,
          change: {
            endAssetDepth: this.getChange(p.endAssetDepth, p.startAssetDepth),
            endRuneDepth: this.getChange(p.endRuneDepth, p.startRuneDepth),
            earnings: this.getChange(p.earnings, o?.earnings),
            swapVolume: this.getChange(p.swapVolume, o?.swapVolume),
            swapFees: this.getChange(p.swapFees, o?.swapFees),
            rewards: this.getChange(p.rewards, o?.rewards),
            lpDistributed: this.getChange(
              p.earnings / (+p.rewards * -1),
              o?.earnings / (+o?.rewards * -1)
            ),
            feesReward: this.getChange(
              p.swapFees / p.rewards,
              o?.swapFees / o?.rewards
            ),
            estEarnings: this.getChange(
              pe,
              o?.swapFees * this.getPPY(this.period)
            ),
            feesVolume: this.getChange(
              p.swapFees / p.swapVolume,
              o?.swapFees / o?.swapVolume
            ),
            poolAPR: this.getChange(ea, oea),
            distributed: this.getChange(+p.rewards * -1, +o?.rewards * -1),
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
