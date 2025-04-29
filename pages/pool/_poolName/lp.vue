<template>
  <div>
    <cards-header :table-general-stats="lpGeneralStats" />
    <div class="pie-chart-container">
      <Card
        title="Address Distribution"
        :is-loading="!runePieData || runePieData.length == 0"
      >
        <pie-chart :pie-data="runePieData" :formatter="totalRuneFormatter" />
      </Card>
    </div>
    <card class="table-card">
      <div v-if="!error" class="base-container lp-container">
        <TableLoader v-if="loading" :cols="cols" :rows="Array(10).fill({})" />
        <vue-good-table
          v-else
          :columns="cols"
          :rows="rows"
          style-class="vgt-table net-table"
          :pagination-options="{
            enabled: true,
            perPage: 30,
            perPageDropdownEnabled: false,
          }"
          :sort-options="{
            enabled: true,
            initialSortBy: { field: 'ownershipPercentage', type: 'desc' },
          }"
        >
          <template slot="table-row" slot-scope="props">
            <template v-if="props.column.field.includes('addr')">
              <template v-if="props.row[props.column.field]">
                <address-bar
                  :address-str="props.row[props.column.field]"
                ></address-bar>
              </template>
              <span v-else> Not Assigned </span>
            </template>

            <template v-else-if="props.column.field === 'ownershipPercentage'">
              <span>
                {{ props.row.ownershipPercentage | percent(3) }}
              </span>
            </template>
          </template>
        </vue-good-table>
      </div>
      <div v-if="error" class="base-container">
        <span>Can't fetch the pool LPs</span>
      </div>
    </card>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { orderBy, sumBy } from 'lodash'

export default {
  components: {},
  asyncData({ params }) {
    return { poolName: params.poolName }
  },
  data() {
    return {
      lpPositions: [],
      loading: true,
      error: false,
      runePieData: [],
      cols: [
        {
          label: 'Position',
          field: 'position',
        },
        {
          label: 'Rune address',
          field: 'rune_addr',
          formatFn: this.formatAddress,
          tdClass: 'mono',
        },
        {
          label: 'Asset address',
          field: 'asset_addr',
          formatFn: this.formatAddress,
          tdClass: 'mono',
        },
        {
          label: 'Asset added',
          field: 'asset_add',
          type: 'number',
          formatFn: (v) => `${this.formatNumber(v)}`,
        },
        {
          label: 'Rune added',
          field: 'rune_add',
          type: 'number',
          formatFn: (v) => `${this.runeCur()} ${this.formatNumber(v)}`,
        },
        {
          label: 'Asset Claimable',
          field: 'assetClaimable',
          type: 'number',
          formatFn: this.formatNumber,
        },
        {
          label: 'Rune Claimable',
          field: 'claimableRune',
          type: 'number',
          formatFn: (v) => `${this.runeCur()} ${this.formatNumber(v)}`,
        },
        {
          label: 'Ownership',
          field: 'ownershipPercentage',
          type: 'percentage',
        },
        {
          label: 'Last Height added',
          field: 'last_add_height',
          type: 'number',
          formatFn: this.formatBlock,
        },
      ],
      lpGeneralStats: [
        {
          name: 'Total Rune Balance',
        },
        {
          name: 'Total Asset Balance',
        },
      ],
      rows: [],
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
  },
  mounted() {
    this.loading = true
    this.$api
      .getLpPositions(this.$route.params.poolName)
      .then((res) => {
        this.lpPositions = res?.data
        this.fetchPoolDetail()
      })
      .catch((e) => {
        this.error = true
        console.error('Error fetching LP positions:', e)
      })
      .finally(() => {
        this.loading = false
      })
  },
  methods: {
    fetchPoolDetail() {
      this.$api
        .getPoolDetail(this.$route.params.poolName)
        .then((res) => {
          this.poolDetail = res?.data
          this.formatLP(this.lpPositions)
          this.updateGeneralStats()
        })
        .catch((e) => {
          this.error = true
          console.error('Error fetching pool detail:', e)
        })
        .finally(() => {
          this.loading = false
        })
    },
    checkPostion(position) {
      let pos = ''
      if ('asset_address' in position) {
        pos = 'Asymmetrical Asset'
      }
      if ('rune_address' in position) {
        pos = 'Asymmetrical Rune'
      }
      if ('asset_address' in position && 'rune_address' in position) {
        pos = 'Symmetrical'
      }
      return pos
    },
    formatLP(pos) {
      if (!this.poolDetail) return

      const lpUnits = this.poolDetail.LP_units
      const balanceRune = this.poolDetail.balance_rune
      const balanceAsset = this.poolDetail.balance_asset

      const runeData = []

      for (const i in pos) {
        const userUnits = pos[i]?.units

        const assetClaimable = ((userUnits / lpUnits) * balanceAsset) / 1e8
        const claimableRune = ((userUnits / lpUnits) * balanceRune) / 1e8

        const ownershipPercentage = userUnits / lpUnits

        this.rows.push({
          position: this.checkPostion(pos[i]),
          rune_addr: pos[i]?.rune_address ? pos[i]?.rune_address : undefined,
          asset_addr: pos[i]?.asset_address ? pos[i]?.asset_address : undefined,
          rune_add: pos[i]?.rune_deposit_value
            ? pos[i]?.rune_deposit_value / 10 ** 8
            : 'Not Added',
          asset_add: pos[i]?.asset_deposit_value
            ? pos[i]?.asset_deposit_value / 10 ** 8
            : 'Not Added',
          last_add_height: pos[i]?.last_add_height
            ? pos[i]?.last_add_height
            : ' ',

          assetClaimable,
          claimableRune,
          ownershipPercentage,
        })

        if (claimableRune > 0) {
          runeData.push({
            name: pos[i]?.asset_address || pos[i]?.rune_address,
            value: this.runePrice * claimableRune * 2,
            ownership: ownershipPercentage,
          })
        }
      }

      this.createRunePieData(runeData)
    },
    updateGeneralStats() {
      if (this.poolDetail) {
        const balanceRune = this.poolDetail.balance_rune
        const balanceAsset = this.poolDetail.balance_asset

        this.lpGeneralStats = [
          {
            name: 'Balance Rune',
            value: this.$options.filters.number(balanceRune / 1e8, '0a'),
          },
          {
            name: 'Balance Asset',
            value: this.$options.filters.number(balanceAsset / 1e8, '0a'),
          },
        ]
      } else {
        console.error('poolDetail is not defined')
      }
    },
    createRunePieData(runeData) {
      const topRuneData = orderBy(runeData, 'ownership', 'desc').slice(0, 10)
      const othersValue = sumBy(runeData.slice(10), 'value')

      this.runePieData = [
        ...topRuneData,
        {
          name: 'Others',
          value: othersValue,
        },
      ]
    },
    formatNumber(number) {
      return this.$options.filters.number(number, '0,0.0000')
    },
    formatBlock(number) {
      return this.$options.filters.number(number, '0,0')
    },
    totalRuneFormatter(param) {
      return `
        <div class="tooltip-header">
          <div class="data-color" style="background-color: ${param.color}"></div>
          ${this.formatAddress(param.name)}
        </div>
        <div class="tooltip-body">
          <span>
            <span>Value</span>
            <b>$${this.$options.filters.number(param.value, '0,0.00 a')}</b>
          </span>
        </div>
      `
    },
  },
}
</script>

<style lang="scss" scoped>
.lp-container {
  border: none;
  padding: $space-0;
}

.pie-chart-container {
  display: flex;
  margin-bottom: $space-20;
}

.table-card {
  margin-top: $space-20;
}
</style>
