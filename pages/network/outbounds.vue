<template>
  <card title="Outbound Fees">
    <TableLoader v-if="loading" :cols="columns" :rows="Array(10).fill({})" />
    <vue-good-table
      v-else
      :columns="columns"
      :rows="outboundFees"
      style-class="vgt-table net-table"
      :sort-options="{
        enabled: true,
        initialSortBy: { field: 'asset', type: 'asc' },
      }"
    >
      <template slot="table-row" slot-scope="props">
        <span v-if="props.column.field === 'asset'" class="cell-content">
          <AssetIcon :asset="props.row.asset" class="asset-icon" />
          <span>{{ props.formattedRow[props.column.field] }}</span>
        </span>
        <span v-else-if="props.column.field === 'outboundFee'">
          {{ decimalFormat(props.row.outboundFee / 1e8) }}
          {{ showAsset(props.row.asset, true) }}
        </span>
        <span v-else-if="props.column.field === 'feeWithheld'">
          {{ runeCur() }}
          {{ (props.row.feeWithheld / 1e8) | number('0,0.00a') }}
          <small v-if="+props.row.feeWithheld > 0">
            (${{
              ((props.row.feeWithheld / 1e8) * runePrice) | number('0,0.00a')
            }})
          </small>
        </span>
        <span v-else-if="props.column.field === 'feeSpent'">
          {{ runeCur() }}
          {{ (props.row.feeSpent / 1e8) | number('0,0.00a') }}
          <small v-if="+props.row.feeSpent > 0">
            (${{
              ((props.row.feeSpent / 1e8) * runePrice) | number('0,0.00a')
            }})
          </small>
        </span>
        <span v-else-if="props.column.field === 'surplus'">
          {{ runeCur() }}
          {{ (props.row.surplus / 1e8) | number('0,0.00a') }}
          <small v-if="+props.row.surplus > 0">
            (${{ ((props.row.surplus / 1e8) * runePrice) | number('0,0.00a') }})
          </small>
        </span>

        <span v-else-if="props.column.field === 'dynamicMultiplier'">
          {{ (props.row.dynamicMultiplier / 1e6) | percent(2) }}
        </span>
        <span v-else>
          {{ props.formattedRow[props.column.field] }}
        </span>
      </template>
    </vue-good-table>
  </card>
</template>

<script>
import { mapGetters } from 'vuex'
import { formatAsset } from '~/utils'

export default {
  data() {
    return {
      loading: true,

      outboundFees: [],
      columns: [
        {
          label: 'Asset',
          field: 'asset',
          formatFn: formatAsset,
        },
        {
          label: 'Outbound Fee',
          field: 'outboundFee',
          sortable: true,
          tdClass: 'mono',
          type: 'number',
        },
        {
          label: 'Fee Withheld',
          field: 'feeWithheld',
          sortable: true,
          tdClass: 'mono',
          type: 'number',
        },
        {
          label: 'Fee Spent',
          field: 'feeSpent',
          sortable: true,
          tdClass: 'mono',
          type: 'number',
        },
        {
          label: 'Surplus',
          field: 'surplus',
          sortable: true,
          tdClass: 'mono',
          type: 'number',
        },
        {
          label: 'Dynamic Multiplier',
          field: 'dynamicMultiplier',
          sortable: true,
          tdClass: 'mono',
          type: 'number',
        },
      ],
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
  },
  mounted() {
    this.fetchOutboundFees()
  },
  methods: {
    async fetchOutboundFees() {
      try {
        const response = await this.$api.getOutboundFees()
        this.outboundFees = response.data.map((item) => ({
          asset: item.asset,
          outboundFee: item.outbound_fee,
          feeWithheld: item.fee_withheld_rune || 0,
          feeSpent: item.fee_spent_rune || 0,
          surplus: item.surplus_rune || 0,
          dynamicMultiplier: item.dynamic_multiplier_basis_points || 0,
        }))
        this.loading = false
      } catch (error) {
        console.error('Error fetching outbound fees:', error)
      }
    },
  },
}
</script>
