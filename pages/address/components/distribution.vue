<template>
  <div>
    <stats-panel :metrics="statsMetrics">
      <template #metric-icon-0>
        <asset-icon asset="THOR.TCY" height="1.2rem" />
      </template>
      <template #metric-icon-2>
        <asset-icon asset="THOR.RUNE" height="1.2rem" />
      </template>
      <template #metric-icon-3>
        <asset-icon asset="THOR.RUNE" height="1.2rem" />
      </template>
    </stats-panel>
    <div class="distributions">
      <div class="distribution-header">
        <h3 class="info-title">Distributions</h3>
        <div
          class="csv-download"
          title="csv-download"
          @click="downloadDistribution(distribution.distributions)"
        >
          <file-download class="clickable"></file-download>
        </div>
      </div>
      <vue-good-table
        :columns="distributionsColumns"
        :rows="distribution && distribution.distributions"
        :line-numbers="true"
        max-height="200px"
        style-class="vgt-table net-table vgt-compact"
        :sort-options="{
          enabled: true,
          initialSortBy: { field: 'date', type: 'desc' },
        }"
      >
        <template slot="table-row" slot-scope="props">
          <div
            v-if="props.column.field == 'amount'"
            v-tooltip="props.row.amount * runePrice"
          >
            {{ props.formattedRow[props.column.field] }}
            <small>RUNE</small>
          </div>
          <div v-else-if="props.column.field == 'value'">
            {{ ((props.row.amount * runePrice) / 1e8) | currency() }}
          </div>
          <span v-else>
            {{ props.formattedRow[props.column.field] }}
          </span>
        </template>
      </vue-good-table>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import FileDownload from '~/assets/images/file-download.svg?inline'

export default {
  components: {
    FileDownload,
  },
  props: {
    address: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      stakedAmount: 0,
      distribution: [],
      distributionsColumns: [
        {
          label: 'Earned',
          field: 'amount',
          tdClass: 'mono',
          formatFn: this.baseAmountFormat,
        },
        {
          label: 'Value',
          field: 'value',
          tdClass: 'mono',
          formatFn: this.baseAmountFormat,
        },
        {
          label: 'Date',
          field: 'date',
          type: 'text',
          formatFn: (value) => {
            return moment.unix(value).format('MM/DD/YYYY')
          },
        },
      ],
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
    tcyPrice() {
      const pools = this.$store.getters.getPools
      console.log(pools)

      if (pools && pools.length > 0) {
        const tcyPool = pools.find((pool) => pool.asset === 'THOR.TCY')
        return tcyPool ? tcyPool.assetPriceUSD : 0
      }
      return 0
    },
    statsMetrics() {
      return [
        {
          label: 'Staked TCY',
          value: this.stakedAmount,
          filter: (val) => {
            return `${this.$options.filters.number(val, '0,0.00')} `
          },
          subValue: `${this.$options.filters.currency(this.stakedAmount * this.tcyPrice)}`,
        },
        {
          label: 'APY',
          value: this.tcyAPY,
          filter: (val) => this.$options.filters.percent(val, 2),
        },
        {
          label: 'Daily Earn (est)',
          value: this.dailyEarn,
          filter: (val) => {
            return `${this.$options.filters.number(val, '0,0.00000')} `
          },
        },
        {
          label: 'Total Earned',
          value: this.distribution.total / 1e8,
          filter: (val) => {
            return `${this.$options.filters.number(val, '0,0.0000')} `
          },
        },
      ]
    },
    dailyEarn() {
      const totalEarn = +this.distribution?.total / 1e8
      const days = this.distribution?.distributions?.length

      if (+totalEarn <= 0) {
        return 0
      }

      return totalEarn / days
    },
    tcyAPY() {
      if (!this.dailyEarn || !this.tcyPrice) {
        return 0
      }

      const dailyReturn =
        (this.dailyEarn * this.runePrice) / (this.stakedAmount * this.tcyPrice)

      return dailyReturn * 365
    },
  },
  mounted() {
    this.$api.getTCYDistribution(this.address).then((res) => {
      this.distribution = res.data
    })

    this.$api.getTCYStaker(this.address).then((res) => {
      this.stakedAmount = res.data?.amount / 1e8
    })
  },
  methods: {
    downloadDistribution(data) {
      if (!data || !data.length) {
        console.error('No data provided for CSV download.')
        return
      }

      data = data.map((d) => ({
        amount: d.amount / 1e8,
        date: d.date,
      }))

      const csvContent = [
        Object.keys(data[0]).join(','), // Header row
        ...data.map((row) =>
          Object.values(row)
            .map((value) => `"${value}"`)
            .join(',')
        ),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      const lastDistribution = data[data.length - 1]?.date
        ? moment.unix(data[data.length - 1].date).format('YYYY-MM-DD')
        : 'unknown'

      link.setAttribute('href', url)
      link.setAttribute(
        'download',
        `distribution-${this.address.slice(-4)}-${lastDistribution}`
      )
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
  },
}
</script>

<style lang="scss" scoped>
.main-stats {
  padding: $space-16;
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color);
  flex-wrap: wrap;
  border-radius: $radius-s;
  flex-direction: column;

  @include lg {
    flex-direction: row;
  }

  .stat-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $space-8 0;
    gap: $space-5;
    width: 100%;

    @include lg {
      flex: 1;
      justify-content: center;
      padding: $space-8 $space-24;
      flex-direction: column;
      width: initial;
    }

    &:first-of-type {
      padding-left: 0;
    }

    .info-title {
      font-size: $font-size-sm;
      margin: 0;
    }

    .info-value {
      display: flex;
      align-items: center;
      gap: $space-4;
      font-size: $font-size-md;
      color: var(--sec-font-color);
    }

    &.border-left {
      border-top: 1px solid var(--border-color);

      @include lg {
        border-top: none;
        border-left: 1px solid var(--border-color);
      }
    }
  }
}

.distributions {
  padding: $space-16;
  border: 1px solid var(--border-color);
  border-radius: $radius-s;
  margin-top: $space-16;

  .distribution-header {
    display: flex;
    gap: $space-8;
    justify-content: space-between;
    align-items: center;

    .csv-download svg {
      fill: var(--sec-font-color);
      height: 1.2rem;
      width: 1.2rem;

      &:hover {
        fill: var(--primary-color);
      }
    }
  }

  h3 {
    font-size: $font-size-md;
    margin: 0;
    margin-bottom: $space-8;
    color: var(--sec-font-color);
  }

  .vgt-table {
    width: 100%;
    border-radius: $radius-s;

    .vgt-table__header {
      background-color: var(--bg-color);
      border-bottom: 1px solid var(--border-color);
    }

    .vgt-table__body {
      background-color: var(--bg-color);
    }
  }
}
</style>
