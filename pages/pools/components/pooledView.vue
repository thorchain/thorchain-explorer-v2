<template>
  <div class="pool-stats base-container">
    <div class="stat-group">
      <skeleton-item class="stat-item" :loading="loading">
        <span class="title">Total Pooled:</span>
        <span class="mono value">${{ totalInfo.pooled | number('0a') }}</span>
      </skeleton-item>
      <hr />
      <skeleton-item class="stat-item" :loading="loading">
        <span class="title">24hr Volume:</span>
        <span class="mono value">
          ${{ totalInfo.day.volume | number('0a') }}
        </span>
      </skeleton-item>
      <skeleton-item class="stat-item" :loading="loading">
        <span class="title">24hr Earnings:</span>
        <span class="mono value">
          ${{ totalInfo.day.earnings | number('0a') }}
        </span>
      </skeleton-item>
      <skeleton-item class="stat-item" :loading="loading">
        <span class="title"
          >24hr Earnings APR:
          <unknown-icon
            v-tooltip="'(Earnings / Pooled) * Period Per Year'"
            class="header-icon"
          />
        </span>
        <span class="mono value">{{
          totalInfo.day.earningsAPR | percent(2)
        }}</span>
      </skeleton-item>
      <skeleton-item class="stat-item" :loading="loading">
        <span class="title">24hr Swap Count:</span>
        <span class="mono value">{{
          totalInfo.day.swapCount | number('0,0')
        }}</span>
      </skeleton-item>
      <skeleton-item class="stat-item" :loading="loading">
        <span class="title"
          >24hr Fee Ratio:
          <unknown-icon
            v-tooltip="'Average Fee in basis point (Fees / Volume)'"
            class="header-icon"
          />
        </span>
        <span class="mono value"
          >{{ totalInfo.day.avgFee | number('0.00') }} BP</span
        >
      </skeleton-item>
    </div>
    <hr />
    <div class="stat-group">
      <skeleton-item class="stat-item" :loading="loading">
        <span class="title">7D Volume:</span>
        <span class="mono value">
          ${{ totalInfo.week.volume | number('0a') }}
        </span>
      </skeleton-item>
      <skeleton-item class="stat-item" :loading="loading">
        <span class="title">7D Earnings:</span>
        <span class="mono value">
          ${{ totalInfo.week.earnings | number('0a') }}
        </span>
      </skeleton-item>
      <skeleton-item class="stat-item" :loading="loading">
        <span class="title">7D Earnings APR:</span>
        <span class="mono value">{{
          totalInfo.week.earningsAPR | percent(2)
        }}</span>
      </skeleton-item>
      <skeleton-item class="stat-item" :loading="loading">
        <span class="title">7D Swap Count:</span>
        <span class="mono value">{{
          totalInfo.week.swapCount | number('0,0')
        }}</span>
      </skeleton-item>
      <skeleton-item class="stat-item" :loading="loading">
        <span class="title">7D Fee Ratio:</span>
        <span class="mono value"
          >{{ totalInfo.week.avgFee | number('0.00') }} BP</span
        >
      </skeleton-item>
    </div>
    <hr />
    <div class="stat-group">
      <skeleton-item class="stat-item" :loading="loading">
        <span class="title">30D Volume:</span>
        <span class="mono value">
          ${{ totalInfo.month.volume | number('0a') }}
        </span>
      </skeleton-item>
      <skeleton-item class="stat-item" :loading="loading">
        <span class="title">30D Earnings:</span>
        <span class="mono value">
          ${{ totalInfo.month.earnings | number('0a') }}
        </span>
      </skeleton-item>
      <skeleton-item class="stat-item" :loading="loading">
        <span class="title">30D Earnings APR:</span>
        <span class="mono value">{{
          totalInfo.month.earningsAPR | percent(2)
        }}</span>
      </skeleton-item>
      <skeleton-item class="stat-item" :loading="loading">
        <span class="title">30D Swap Count:</span>
        <span class="mono value">{{
          totalInfo.month.swapCount | number('0,0')
        }}</span>
      </skeleton-item>
      <skeleton-item class="stat-item" :loading="loading">
        <span class="title">30D Fee Ratio:</span>
        <span class="mono value">
          {{ totalInfo.month.avgFee | number('0.00') }} BP
        </span>
      </skeleton-item>
    </div>
    <hr />
    <div class="stat-group">
      <skeleton-item class="stat-item" :loading="loading">
        <span class="title">Year Volume:</span>
        <span class="mono value">
          ${{ totalInfo.year.volume | number('0a') }}
        </span>
      </skeleton-item>
      <skeleton-item class="stat-item" :loading="loading">
        <span class="title">Year Earnings:</span>
        <span class="mono value">
          ${{ totalInfo.year.earnings | number('0a') }}
        </span>
      </skeleton-item>
      <skeleton-item class="stat-item" :loading="loading">
        <span class="title">Year Earnings APR:</span>
        <span class="mono value">{{
          totalInfo.year.earningsAPR | percent(2)
        }}</span>
      </skeleton-item>
      <skeleton-item class="stat-item" :loading="loading">
        <span class="title">Year Swap Count:</span>
        <span class="mono value">{{
          totalInfo.year.swapCount | number('0,0')
        }}</span>
      </skeleton-item>
      <skeleton-item class="stat-item" :loading="loading">
        <span class="title">Year Fee Ratio:</span>
        <span class="mono value"
          >{{ totalInfo.year.avgFee | number('0.00') }} BP</span
        >
      </skeleton-item>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import UnknownIcon from '~/assets/images/unknown.svg?inline'

export default {
  components: { UnknownIcon },
  data() {
    return {
      loading: true,
      totalInfo: {
        pooled: 0,
        day: {
          volume: 0,
          earnings: 0,
          earningsAPR: 0,
          swapCount: 0,
          avgFee: 0,
          liquidityFees: 0,
        },
        week: {
          volume: 0,
          earnings: 0,
          earningsAPR: 0,
          swapCount: 0,
          avgFee: 0,
          liquidityFees: 0,
        },
        month: {
          volume: 0,
          earnings: 0,
          earningsAPR: 0,
          swapCount: 0,
          avgFee: 0,
          liquidityFees: 0,
        },
        year: {
          volume: 0,
          earnings: 0,
          earningsAPR: 0,
          swapCount: 0,
          avgFee: 0,
          liquidityFees: 0,
        },
      },
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
  },
  async mounted() {
    const pd = await this.getDVEs()
    this.getTotalInfo(pd)
  },
  methods: {
    async getDVEs() {
      try {
        const poolsDataDay = (await this.$api.getPoolsHistory()).data
        const poolsDataWeek = (await this.$api.getPoolsHistory('Week')).data
        const poolsDataMonth = (await this.$api.getPoolsHistory('Month')).data
        const poolsDataYear = (await this.$api.getPoolsHistory('Year')).data
        return {
          day: poolsDataDay,
          week: poolsDataWeek,
          month: poolsDataMonth,
          year: poolsDataYear,
        }
      } catch (error) {
        return undefined
      } finally {
        this.loading = false
      }
    },
    getTotalInfo(poolDatum) {
      const updatePeriod = (period, ppy) => {
        if (!poolDatum) {
          return
        }
        poolDatum[period]?.pools.forEach((p) => {
          if (period === 'day') {
            this.totalInfo.pooled +=
              (+p.endRuneDepth * 2 * this.runePrice) / 1e8
          }

          // Sometimes the earnings are zero
          if (p.earnings === undefined) {
            p.earnings = 0
          }

          this.totalInfo[period].volume +=
            (+p.swapVolume * this.runePrice) / 1e8
          this.totalInfo[period].earnings +=
            (+p.earnings * this.runePrice) / 1e8
          this.totalInfo[period].swapCount += +p.swapCount
          this.totalInfo[period].liquidityFees +=
            +p.totalLiquidityFeesRune / 1e8
        })

        const ve =
          this.totalInfo[period].liquidityFees / this.totalInfo[period].volume
        const ep = this.totalInfo[period].earnings / this.totalInfo.pooled

        this.totalInfo[period].earningsAPR = ep * ppy
        this.totalInfo[period].avgFee = ve * 1e4
      }

      updatePeriod('day', 365)
      updatePeriod('week', 52.1429)
      updatePeriod('month', 12)
      updatePeriod('year', 1)
    },
  },
}
</script>

<style lang="scss">
.pool-stats {
  margin-bottom: $space-16;

  .stat-item {
    display: flex;
    align-items: center;
    padding-top: $space-5;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: $space-5;

    .title {
      display: flex;
      align-items: center;
      color: var(--sec-font-color);
      margin-right: $space-8;
      font-size: $font-size-sm;

      .header-icon {
        display: inline-block;
        height: 0.9rem;
        width: 0.9rem;
        fill: var(--sec-font-color);
        margin-left: $space-5;
      }
    }

    .value {
      color: var(--primary-color);
      font-size: $font-size-sm;
    }
  }

  hr {
    margin: $space-8 $space-0;
    opacity: 0.65;
    overflow: visible;
    height: 0;
    border: 0;
    border-top: 1px solid var(--border-color);
  }
}

@include md {
  .pool-stats {
    padding: $space-0;
    display: flex;
    justify-content: space-between;

    .stat-group {
      position: relative;
      padding: $space-16;
      flex: 1;
      margin-top: auto;

      &::after {
        align-self: stretch;
        position: absolute;
        right: 0;
        top: 0;
        content: '';
        display: block;
        height: calc(100% - 1rem);
        border-left: 0;
        border-right: 1px solid var(--border-color);
        margin: $space-8 $space-0;
      }

      &:last-of-type::after {
        display: none;
      }
    }

    .stat-group hr:last-child {
      display: none;
    }
  }
}
</style>
