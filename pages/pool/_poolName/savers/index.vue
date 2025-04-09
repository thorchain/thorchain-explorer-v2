<template>
  <div>
    <div class="chart-edition savers-distro">
      <Card
        title="Address Distribution"
        :is-loading="!saverDetails || saverDetails.length == 0"
        class="inner-pie-chart"
      >
        <pie-chart :pie-data="saversPie" :formatter="totalSaverFormatter" />
      </Card>
      <Card
        v-if="saversData.filled !== null"
        title="Savers Cap Filled"
        class="savers-filled-card"
      >
        <ProgressBar :width="saversData.filled * 100" />
        <h4>
          {{ $options.filters.percent(saversData.filled, 2) }}
          Total Savers Filled
        </h4>
      </Card>
    </div>
    <Card>
      <TableLoader v-if="loading" :cols="cols" :rows="Array(10).fill({})" />
      <vue-good-table
        v-else
        :columns="cols"
        :rows="saverDetails"
        style-class="vgt-table net-table"
        :pagination-options="{
          enabled: true,
          perPage: 50,
          perPageDropdownEnabled: true,
        }"
        :sort-options="{
          enabled: true,
          initialSortBy: { field: 'asset_deposit_value', type: 'desc' },
        }"
      >
        <template slot="table-row" slot-scope="props">
          <template v-if="props.column.field.includes('asset_address')">
            <address-bar :address-str="props.row.asset_address"></address-bar>
          </template>
          <template v-else-if="props.column.field.includes('asset')">
            <span>
              {{ props.formattedRow[props.column.field] }}
            </span>
            <small>
              {{ showAsset(props.row.asset) }}
            </small>
          </template>
          <span v-else>
            {{ props.formattedRow[props.column.field] }}
          </span>
        </template>
      </vue-good-table>
    </Card>
  </div>
</template>

<script>
import { orderBy, sumBy } from 'lodash'

export default {
  props: ['saversData'],
  asyncData({ params }) {
    return { poolName: params.poolName }
  },
  data() {
    return {
      loading: false,
      error: false,
      cols: [
        {
          label: 'Address',
          field: 'asset_address',
          tdClass: 'mono clickable',
          formatFn: this.formatAddress,
        },
        {
          label: 'Member Deposit',
          field: 'asset_deposit_value',
          tdClass: 'mono',
          type: 'number',
          formatFn: this.baseAmountFormatOrZero,
        },
        {
          label: 'Member Redeem',
          field: 'asset_redeem_value',
          tdClass: 'mono',
          type: 'number',
          formatFn: this.baseAmountFormatOrZero,
        },
        {
          label: 'Earned',
          field: 'asset_earned',
          tdClass: 'mono',
          type: 'number',
          formatFn: this.baseAmountFormatOrZero,
        },
        {
          label: 'Growth Percentage',
          field: 'growth_pct',
          tdClass: 'mono',
          type: 'percentage',
        },
        {
          label: 'Annualised Yield',
          field: 'APR',
          tdClass: 'mono',
          type: 'percentage',
        },
        {
          label: 'Last Height Added',
          field: 'last_add_height',
          tdClass: 'mono',
          type: 'number',
          formatFn: this.normalFormat,
        },
      ],
      saverDetails: [],
      saversPie: [],
      lastBlockHeight: undefined,
    }
  },
  mounted() {
    this.updateSavers()
  },
  methods: {
    async updateSavers() {
      this.loading = true

      try {
        this.lastBlockHeight = (
          await this.$api.getLastBlockHeight()
        ).data?.find((e) => e.chain === 'BTC')?.thorchain
      } catch (error) {
        this.error = true
        console.error(error)
      }

      this.$api
        .getSavers(this.poolName)
        .then(({ data: savers }) => {
          this.saverDetails = orderBy(
            savers,
            [(o) => +o.asset_redeem_value],
            ['desc']
          ).map((saverDetail) => ({
            ...saverDetail,
            asset_earned:
              saverDetail.asset_redeem_value - saverDetail.asset_deposit_value,
            APR: this.calcAPR(saverDetail),
            value:
              (saverDetail.asset_redeem_value * this.saversData.assetPriceUSD) /
              10 ** 8,
            name: saverDetail.asset_address,
          }))

          this.saversPie =
            this.saverDetails.length > 1
              ? [
                  ...this.saverDetails.slice(0, 10),
                  {
                    name: 'Others',
                    value: sumBy(this.saverDetails.slice(10), (o) => o.value),
                  },
                ]
              : [...this.saverDetails]

          this.loading = false
        })
        .catch((e) => {
          this.error = true
          console.error(e)
          this.loading = false
        })
    },
    calcAPR(saverDetail) {
      if (!this.lastBlockHeight) {
        return 0
      }
      const diffHeight = this.lastBlockHeight - saverDetail.last_add_height
      const periodPerYear = 5256000 / diffHeight
      return (
        (saverDetail.asset_redeem_value / saverDetail.asset_deposit_value - 1) *
        periodPerYear
      )
    },
    totalSaverFormatter(param) {
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
.address-link {
  text-decoration: none;
}
.inner-pie-chart {
  max-width: 500px;
}
</style>
