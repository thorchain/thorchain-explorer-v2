<template>
  <vue-good-table
    :columns="cols"
    :rows="bs"
    style-class="vgt-table net-table"
    :pagination-options="{
      enabled: true,
      perPage: 5,
      perPageDropdownEnabled: false,
    }"
  >
    <template slot="table-row" slot-scope="props">
      <div v-if="props.column.field == 'collateral_asset'" class="asset-cell">
        <AssetIcon :asset="props.row.collateral_asset" />
        <span class="ellipsis">
          {{ props.row.collateral_asset }}
        </span>
      </div>
      <span
        v-else-if="props.column.field === 'collateral'"
        class="pool-cell ellipsis"
      >
        <span v-if="props.row[props.column.field][0]">
          <small>Deposited: </small>
          {{ props.row[props.column.field][0] | number('0,0.0000') }}
          <small>{{ showAsset(props.row.collateral_asset) }}</small></span
        >
        <hr v-if="props.row[props.column.field][1]" class="table-hr" />
        <span v-if="props.row[props.column.field][1]" class="ellipsis">
          <small>Withdrawn: </small>
          {{
            props.row[props.column.field][1] ||
            props.row[props.column.field][1] === 0
              ? $options.filters.number(
                  props.row[props.column.field][1],
                  '0,0.0000'
                )
              : '-'
          }}
          <small class="ellipsis">{{
            showAsset(props.row.collateral_asset)
          }}</small>
        </span>
        <span v-else-if="!props.row[props.column.field][0]">-</span>
      </span>
      <span v-else-if="props.column.field == 'debt'">
        <span v-if="props.row[props.column.field][0]">
          <small>Issued: </small>
          {{ props.row[props.column.field][0] | currency }}</span
        >
        <hr v-if="props.row[props.column.field][1]" class="table-hr" />
        <span v-if="props.row[props.column.field][1]" class="ellipsis">
          <small>Repaid: </small>
          {{
            props.row[props.column.field][1] ||
            props.row[props.column.field][1] === 0
              ? $options.filters.currency(props.row[props.column.field][1])
              : '-'
          }}
        </span>
        <span v-else-if="!props.row[props.column.field][0]">-</span>
      </span>
    </template>
  </vue-good-table>
</template>

<script>
import moment from 'moment'
export default {
  props: ['address'],
  data() {
    return {
      bs: [],
      cols: [
        {
          label: 'Collateral Asset',
          field: 'collateral_asset',
          formatFn: this.formatAsset,
        },
        {
          label: 'Collateral Deposited/Withdraw',
          field: 'collateral',
          type: 'number',
          tdClass: 'mono',
        },
        {
          label: 'Debt Issued/Repaid',
          field: 'debt',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono',
        },
        {
          label: 'Last Open Loan',
          field: 'lastOpenLoan',
          type: 'text',
          tdClass: 'center',
          thClass: 'center',
          sortable: false,
        },
        {
          label: 'Last Repay Loan',
          field: 'lastRepayLoan',
          type: 'text',
          tdClass: 'center',
          thClass: 'center',
          sortable: false,
        },
      ],
    }
  },
  async mounted() {
    if (!this.address) {
      return
    }
    try {
      const {
        data: { pools: borrowerDetails },
      } = await this.$api.getBorrowerDetails(this.address)
      this.parseBorrower(borrowerDetails)
    } catch (error) {
      console.error('member not found', error)
    }
  },
  methods: {
    parseBorrower(b) {
      this.bs = b.map((p) => ({
        ...p,
        collateral: [
          p.collateral_deposited / 1e8,
          p.collateral_withdrawn / 1e8,
        ],
        debt: [p.debt_issued_tor / 1e8, p.debt_repaid_tor / 1e8],
        lastOpenLoan:
          p.last_open_loan_timestamp !== '0'
            ? moment.unix(p.last_open_loan_timestamp).fromNow()
            : '-',
        lastRepayLoan:
          p.last_repay_loan_timestamp !== '0'
            ? moment.unix(p.last_repay_loan_timestamp).fromNow()
            : '-',
      }))
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
  span {
    display: block;
    max-width: 200px;
  }
}

.vgt-right-align .pool-cell span {
  margin-left: auto;
}

.table-hr {
  border: 1px solid var(--border-color);
  margin: $space-3 $space-0;
}
</style>
