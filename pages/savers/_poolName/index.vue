<template>
  <div>
    <div class="chart-edition savers-distro">
      <Card title="Address Distribution" :is-loading="(!saverDetails || saverDetails.length == 0)" class="inner-pie-chart">
        <pie-chart :pie-data="saverDetails" :formatter="totalSaverFormatter" />
      </Card>
      <Card title="Savers Cap Filled" :is-loading="!saversData.filled" class="savers-filled-card">
        <ProgressBar :width="(saversData.filled*100)" />
        <h4>
          {{
            $options.filters.percent(saversData.filled, 2)
          }}
          Total Savers Filled
        </h4>
      </Card>
    </div>
    <Card>
      <vue-good-table
        :columns="saverCols"
        :rows="saverDetails"
        style-class="vgt-table net-table"
        :pagination-options="{
          enabled: true,
          perPage: 50,
          perPageDropdownEnabled: true,
        }"
        :sort-options="{
          enabled: true,
          initialSortBy: {field: 'asset_deposit_value', type: 'desc'}
        }"
      >
        <template slot="table-row" slot-scope="props">
          <template v-if="props.column.field.includes('asset_address')">
            <NuxtLink
              class="address-link clickable"
              :to="`/address/${props.row.asset_address}`"
            >
              {{ props.formattedRow[props.column.field] }}
            </NuxtLink>
          </template>
          <template v-else-if="props.column.field.includes('asset')">
            <span>
              {{ props.formattedRow[props.column.field] }}
            </span>
            <small>
              {{ props.row.asset }}
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
export default {
  props: ['saversData'],
  asyncData ({ params }) {
    return { poolName: params.poolName }
  },
  data () {
    return {
      loading: false,
      error: false,
      saverCols: [
        {
          label: 'Address',
          field: 'asset_address',
          tdClass: 'mono clickable',
          formatFn: this.formatAddress
        },
        {
          label: 'Asset Balance',
          field: 'asset_deposit_value',
          tdClass: 'mono',
          type: 'number',
          formatFn: this.baseAmountFormatOrZero
        },
        {
          label: 'Earned',
          field: 'asset_earned',
          tdClass: 'mono',
          type: 'number',
          formatFn: this.baseAmountFormatOrZero
        },
        {
          label: 'Realized Yield',
          field: 'realizedYield',
          tdClass: 'mono',
          type: 'percentage'
        },
        {
          label: 'Annualised Yield',
          field: 'APR',
          tdClass: 'mono',
          type: 'percentage'
        },
        {
          label: 'Last Height Added',
          field: 'last_add_height',
          tdClass: 'mono',
          type: 'number',
          formatFn: this.normalFormat
        }
      ],
      saverDetails: [],
      lastBlockHeight: undefined
    }
  },
  mounted () {
    this.updateSavers()
  },
  methods: {
    async updateSavers () {
      this.loading = true

      try {
        this.lastBlockHeight = (await this.$api.getLastBlockHeight()).data?.find(e => e.chain === 'BTC')?.thorchain
      } catch (error) {
        this.error = true
        console.error(error)
      }

      this.$api
        .getSavers(this.poolName)
        .then(({ data: savers }) => {
          this.saverDetails = savers.map(saverDetail => ({
            ...saverDetail,
            asset_earned: saverDetail.asset_deposit_value - saverDetail.units,
            APR: this.calcAPR(saverDetail),
            realizedYield: this.realizedYield(saverDetail),
            // for pie chart
            value: (saverDetail.asset_deposit_value * this.saversData.assetPrice) / 10e8,
            name: saverDetail.asset_address
          }))
        })
        .catch((e) => {
          this.error = true
          console.error(e)
        })
    },
    calcAPR (saverDetail) {
      if (!this.lastBlockHeight) { return 0 }
      const diffHeight = (this.lastBlockHeight - saverDetail.last_add_height)
      const periodPerYear = 5256000 / diffHeight
      return ((saverDetail.asset_deposit_value / saverDetail.units) - 1) * periodPerYear
    },
    realizedYield (saverDetail) {
      if (!this.lastBlockHeight) { return 0 }
      return ((saverDetail.asset_deposit_value / saverDetail.units) - 1)
    },
    totalSaverFormatter (param) {
      return (`
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
      `)
    }
  }
}
</script>

<style lang='scss'>
.address-link {
  text-decoration: none;
}
</style>
