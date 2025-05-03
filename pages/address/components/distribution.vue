<template>
  <div>
    <div class="main-stats">
      <div class="stat-info">
        <h6 class="info-title">Staked TCY</h6>
        <b class="info-value">
          {{ stakedAmount | number('0,0.00') }}
          <asset-icon
            :asset="'THOR.TCY'"
            class="asset-icon"
            :height="'1.2rem'"
          />
        </b>
      </div>
      <div class="stat-info border-left">
        <h6 class="info-title">APY</h6>
        <b class="info-value">{{ tcyAPY | percent(2) }}</b>
      </div>
      <div class="stat-info border-left">
        <h6 class="info-title">Daily Earn (est)</h6>
        <b class="info-value">
          {{ dailyEarn | number('0,0.00000') }}
          <asset-icon
            :asset="'THOR.RUNE'"
            class="asset-icon"
            :height="'1.2rem'"
          />
        </b>
      </div>
      <div class="stat-info border-left">
        <h6 class="info-title">Total Earned</h6>
        <b class="info-value">
          {{ (distribution.total / 1e8) | number('0,0.0000') }}
          <asset-icon
            :asset="'THOR.RUNE'"
            class="asset-icon"
            :height="'1.2rem'"
          />
        </b>
      </div>
    </div>
    <div class="distributions">
      <h3 class="info-title">Distributions</h3>
      <vue-good-table
        :columns="distributionsColumns"
        :rows="distribution && distribution.distributions"
        :line-numbers="true"
        max-height="400px"
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

export default {
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
      pools: 'getPools',
    }),
    dailyEarn() {
      if (this.distribution?.distributions?.length >= 2) {
        const lastTwo = this.distribution.distributions
          .slice(-2)
          .map((dist) => ({
            amount: dist.amount,
            date: moment.unix(dist.date),
          }))

        const hoursDifference = lastTwo[1].date.diff(lastTwo[0].date, 'hours')
        const amountDifference = (lastTwo[1].amount - lastTwo[0].amount) / 1e8

        return hoursDifference > 0
          ? ((amountDifference / hoursDifference) * 24).toFixed(4)
          : 0
      }
      return 0
    },
    tcyAPY() {
      if (!this.dailyEarn || !this.pools) {
        return 0
      }

      const TCYPrice = this.pools.find((pool) => pool.asset === 'THOR.TCY')
      const dailyReturn =
        (this.dailyEarn * this.runePrice) /
        (this.stakedAmount * TCYPrice.assetPriceUSD)

      return (1 + dailyReturn / 365) ** 365 - 1
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
