<template>
  <Page>
    <StatsPanel :metrics="statsMetrics" />
    <Card title="RUJI Pending Revenue">
      <TableLoader v-if="loading" :cols="cols" />
      <vue-good-table
        v-else
        :columns="cols"
        :rows="rows"
        style-class="vgt-table net-table"
        :sort-options="{
          enabled: true,
          initialSortBy: { field: 'valueUsd', type: 'desc' },
        }"
      >
        <template slot="table-column" slot-scope="props">
          <span>
            {{ props.column.label }}
          </span>
        </template>
        <template slot="table-row" slot-scope="props">
          <div
            v-if="props.column.field == 'asset'"
            v-tooltip="props.row.asset"
            class="cell-content"
          >
            <AssetIcon :asset="props.row.asset" />
            <span>{{ props.formattedRow[props.column.field] }}</span>
          </div>
          <div v-else-if="props.column.field == 'amount'">
            {{ props.formattedRow[props.column.field] }}
            <small>
              {{ showAsset(props.row.asset, true) }}
            </small>
          </div>
          <span v-else>
            <span v-if="props.row[props.column.field]">
              {{ props.formattedRow[props.column.field] }}
            </span>
            <span v-else>-</span>
          </span>
        </template>
      </vue-good-table>
    </Card>
  </Page>
</template>

<script>
import { mapGetters } from 'vuex'
import { formatAsset } from '~/utils'

export default {
  data() {
    return {
      cols: [
        {
          label: 'Asset',
          field: 'asset',
          formatFn: formatAsset,
        },
        {
          label: 'Pending',
          field: 'amount',
          type: 'number',
          formatFn: this.baseAmountFormat,
          tdClass: 'mono',
        },
        {
          label: 'Pending (USD)',
          field: 'valueUsd',
          type: 'number',
          formatFn: (n) => this.$options.filters.currency(n / 1e8),
          tdClass: 'mono',
        },
      ],
      rows: [],
      stats: [],
      pendingRevenue: 0,
      error: false,
      loading: true,
    }
  },
  head: {
    title: 'THORChain Network Explorer | Ruji Merge',
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
    statsMetrics() {
      return [
        {
          label: 'RUJI Staked (TVL)',
          value: this.stats?.tvl,
          filter: (v) =>
            `${this.$options.filters.number(v / 1e8, '0,0.00')} RUJI`,
        },
        {
          label: 'RUJI Staked (USD)',
          value: +this.stats?.tvl_usd,
          filter: (v) => this.$options.filters.currency(v / 1e8),
        },
        {
          label: 'Pending Revenue (USD)',
          value: this.pendingRevenue,
          filter: (v) => this.$options.filters.currency(v / 1e8),
        },
        {
          label: 'Auto Compounding',
          value: this.stats?.compounding,
          filter: (v) => this.$options.filters.percent(v, 2),
        },
        {
          label: 'Holders',
          value: this.stats?.holders,
          filter: (v) => this.$options.filters.number(v, '0,0'),
          link: '/holders?asset=x%2Fruji',
        },
      ]
    },
  },
  async mounted() {
    try {
      const { ruji, pendingBalances } = (await this.$api.getRUJIStats()).data
      this.stats = ruji
      this.pendingRevenue = pendingBalances.reduce((acc, item) => {
        acc += +item.valueUsd
        return acc
      }, 0)
      this.rows = pendingBalances
    } catch (e) {
      this.error = true
      console.error(e)
    } finally {
      this.loading = false
    }
  },
  methods: {},
}
</script>

<style lang="scss" scoped>
th.end .table-asset {
  justify-content: flex-end;
}

.button-more {
  display: flex;
  gap: 8px;
}
</style>
