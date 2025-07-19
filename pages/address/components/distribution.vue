<template>
  <div>
    <stats-panel :metrics="statsMetrics">
      <template #metric-icon-0>
        <asset-icon asset="THOR.TCY" height="1.2rem" />
      </template>
      <template #metric-icon-2>
        <RuneAsset asset="THOR.RUNE" :height="'1.2rem'" />
      </template>
      <template #metric-icon-3>
        <RuneAsset asset="THOR.RUNE" :height="'1.2rem'" />
      </template>
    </stats-panel>
    <Card title="Distributions" class="distributions-card">
      <template #header>
        <div class="icon-group">
          <Business
            v-tooltip="
              showPriceInterval
                ? 'Showing Value based on RUNE price on its interval'
                : 'Showing Value amount on the latest RUNE price'
            "
            :class="['rotate', { active: showPriceInterval }]"
            @click="showPriceInterval = !showPriceInterval"
          ></Business>

          <div
            class="csv-download"
            title="csv-download"
            @click="downloadDistribution(distribution.distributions)"
          >
            <file-download class="clickable"></file-download>
          </div>
        </div>
      </template>
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
            <RuneAsset :show-icon="false" />
          </div>
          <div v-else-if="props.column.field == 'value'" class="value-cell">
            <span v-if="showPriceInterval">
              {{ formatPriceTimesAmount(props.row) | currency }}
            </span>
            <span v-else>
              {{ formatRuneValue(props.row.amount) | currency }}
            </span>
          </div>
          <span v-else>
            {{ props.formattedRow[props.column.field] }}
          </span>
        </template>
      </vue-good-table>
    </Card>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import FileDownload from '~/assets/images/file-download.svg?inline'
import Business from '~/assets/images/business.svg?inline'
import RuneAsset from '~/components/RuneAsset.vue'

export default {
  components: {
    FileDownload,
    Business,
    RuneAsset,
  },
  props: {
    address: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      apr: 0,
      stakedAmount: 0,
      distribution: [],
      price: 0,
      showPriceInterval: true,
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
          label: 'APR',
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
          subValue: this.$options.filters.currency(
            this.showPriceInterval
              ? this.calculateTotalValuePriceBased()
              : this.calculateTotalValueRuneBased()
          ),
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
      if (this.showPriceInterval) {
        return this.apr
      }

      if (!this.dailyEarn || !this.tcyPrice) {
        return 0
      }

      const dailyReturn =
        (this.dailyEarn * this.runePrice) / (this.stakedAmount * this.tcyPrice)

      return dailyReturn * 365
    },
  },
  async mounted() {
    try {
      const [tcyRes, , stakerRes] = await Promise.all([
        this.$api.getTCY(this.address),
        this.$api.getTCYDistribution(this.address),
        this.$api.getTCYStaker(this.address),
      ])

      this.distribution = tcyRes.data
      this.price = tcyRes.data.price
      this.apr = tcyRes.data.apr
      this.stakedAmount = stakerRes.data?.amount / 1e8
    } catch (error) {
      console.error('Error loading data:', error)
    }
  },
  methods: {
    calculateTotalValueRuneBased() {
      return (this.distribution.total * this.runePrice) / 1e8
    },
    calculateTotalValuePriceBased() {
      if (!this.distribution?.distributions?.length) return 0
      return this.distribution.distributions.reduce((sum, row) => {
        return sum + (row.amount * row.price) / 1e16
      }, 0)
    },

    formatPriceTimesAmount(row) {
      const amount = Number(row.amount)
      const price = Number(row.price)
      return (amount * price) / 1e16
    },
    formatRuneValue(amount) {
      return (Number(amount) * this.runePrice) / 1e8
    },
    downloadDistribution(data) {
      if (!data || !data.length) {
        console.error('No data provided for CSV download.')
        return
      }

      data = data.map((d) => {
        const row = {
          amount: d.amount / 1e8,
          date: d.date,
        }

        if (this.showPriceInterval) {
          row.value = (d.amount * d.price) / 1e16
        } else {
          row.value = (d.amount * this.runePrice) / 1e8
        }
        return row
      })

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



 

    .icon-group {
      display: flex;
      align-items: center;
      gap: $space-8;
      justify-content: space-between;

    }

    .csv-download svg {
      fill: var(--sec-font-color);
      height: 1.2rem;
      width: 1.2rem;

      &:hover {
        fill: var(--primary-color);
      }
    }

    .rotate {
      color: var(--sec-font-color);
      height: 1.4rem;
      width: 1.4rem;
      cursor: pointer;
      align-items: center;
      display: flex;
      transition: transform 0.3s ease;
      transform: rotate(0deg);
      margin-bottom: 5px;
      &.active {
        transform: rotate(180deg);
        color: var(--primary-color);
      }

      &:hover {
        color: var(--primary-color);
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

.toggle-icon {
  margin-left: 8px;
  cursor: pointer;
  color: var(--primary-color);
  &:hover {
    opacity: 0.8;
  }
}

.distributions-card {
  margin-top: $space-16;
}
</style>
