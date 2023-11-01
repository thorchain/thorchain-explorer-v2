<template>
  <div class="pool-stats base-container">
    <div class="stat-group">
      <div class="stat-item">
        <span class="title">Total Pooled:</span>
        <span class="mono value">{{ totalInfo.pooled | currency }}</span>
      </div>
      <hr>
      <div class="stat-item">
        <span class="title">24hr Volume:</span>
        <span class="mono value">{{ totalInfo.day.volume | currency }}</span>
      </div>
      <div class="stat-item">
        <span class="title">24hr Earnings:</span>
        <span class="mono value">{{ totalInfo.day.earnings | currency }}</span>
      </div>
      <div class="stat-item">
        <span class="title">24hr Earnings APR:
          <unknown-icon v-tooltip="'(Earnings / Pooled) * Period Per Year'" class="header-icon" />
        </span>
        <span class="mono value">{{ totalInfo.day.earningsAPR | percent(2) }}</span>
      </div>
      <div class="stat-item">
        <span class="title">24hr Swap Count:</span>
        <span class="mono value">{{ totalInfo.day.swapCount | number('0,0') }}</span>
      </div>
      <div class="stat-item">
        <span class="title">24hr Average Fee:
          <unknown-icon v-tooltip="'Average Fee in basis point (Earnings / Volume)'" class="header-icon" />
        </span>
        <span class="mono value">{{ totalInfo.day.avgFee | number('0.00') }} BP</span>
      </div>
    </div>
    <hr>
    <div class="stat-group">
      <div class="stat-item">
        <span class="title">7D Volume:</span>
        <span class="mono value">{{ totalInfo.week.volume | currency }}</span>
      </div>
      <div class="stat-item">
        <span class="title">7D Earnings:</span>
        <span class="mono value">{{ totalInfo.week.earnings | currency }}</span>
      </div>
      <div class="stat-item">
        <span class="title">7D Earnings APR:</span>
        <span class="mono value">{{ totalInfo.week.earningsAPR | percent(2) }}</span>
      </div>
      <div class="stat-item">
        <span class="title">7D Swap Count:</span>
        <span class="mono value">{{ totalInfo.week.swapCount | number('0,0') }}</span>
      </div>
      <div class="stat-item">
        <span class="title">7D Average Fee:</span>
        <span class="mono value">{{ totalInfo.week.avgFee | number('0.00') }} BP</span>
      </div>
    </div>
    <hr>
    <div class="stat-group">
      <div class="stat-item">
        <span class="title">30D Volume:</span>
        <span class="mono value">{{ totalInfo.month.volume | currency }}</span>
      </div>
      <div class="stat-item">
        <span class="title">30D Earnings:</span>
        <span class="mono value">{{ totalInfo.month.earnings | currency }}</span>
      </div>
      <div class="stat-item">
        <span class="title">30D Earnings APR:</span>
        <span class="mono value">{{ totalInfo.month.earningsAPR | percent(2) }}</span>
      </div>
      <div class="stat-item">
        <span class="title">30D Swap Count:</span>
        <span class="mono value">{{ totalInfo.month.swapCount | number('0,0') }}</span>
      </div>
      <div class="stat-item">
        <span class="title">30D Average Fee:</span>
        <span class="mono value">{{ totalInfo.month.avgFee | number('0.00') }} BP</span>
      </div>
    </div>
    <hr>
    <div class="stat-group">
      <div class="stat-item">
        <span class="title">Year Volume:</span>
        <span class="mono value">{{ totalInfo.year.volume | currency }}</span>
      </div>
      <div class="stat-item">
        <span class="title">Year Earnings:</span>
        <span class="mono value">{{ totalInfo.year.earnings | currency }}</span>
      </div>
      <div class="stat-item">
        <span class="title">Year Earnings APR:</span>
        <span class="mono value">{{ totalInfo.year.earningsAPR | percent(2) }}</span>
      </div>
      <div class="stat-item">
        <span class="title">Year Swap Count:</span>
        <span class="mono value">{{ totalInfo.year.swapCount | number('0,0') }}</span>
      </div>
      <div class="stat-item">
        <span class="title">Year Average Fee:</span>
        <span class="mono value">{{ totalInfo.year.avgFee | number('0.00') }} BP</span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import UnknownIcon from '~/assets/images/unknown.svg?inline'

export default {
  components: { UnknownIcon },
  data () {
    return {
      totalInfo: {
        pooled: 0,
        day: {
          volume: 0,
          earnings: 0,
          earningsAPR: 0,
          swapCount: 0,
          avgFee: 0
        },
        week: {
          volume: 0,
          earnings: 0,
          earningsAPR: 0,
          swapCount: 0,
          avgFee: 0
        },
        month: {
          volume: 0,
          earnings: 0,
          earningsAPR: 0,
          swapCount: 0,
          avgFee: 0
        },
        year: {
          volume: 0,
          earnings: 0,
          earningsAPR: 0,
          swapCount: 0,
          avgFee: 0
        }
      }
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice'
    })
  },
  async mounted () {
    const pd = await this.getDVEs()
    this.getTotalInfo(pd)
  },
  methods: {
    async getDVEs () {
      try {
        const poolsDataDay = (await this.$api.getPoolsHistory()).data
        const poolsDataWeek = (await this.$api.getPoolsHistory('Week')).data
        const poolsDataMonth = (await this.$api.getPoolsHistory('Month')).data
        const poolsDataYear = (await this.$api.getPoolsHistory('Year')).data
        return {
          day: poolsDataDay,
          week: poolsDataWeek,
          month: poolsDataMonth,
          year: poolsDataYear
        }
      } catch (error) {
        return undefined
      }
    },
    getTotalInfo (poolDatum) {
      const updatePeriod = (period, ppy) => {
        poolDatum[period].pools.forEach((p) => {
          if (period === 'day') {
            this.totalInfo.pooled += (+p.endRuneDepth * 2 * this.runePrice) / 1e8
          }

          this.totalInfo[period].volume += (+p.swapVolume * this.runePrice) / 1e8
          this.totalInfo[period].earnings += (+p.earnings * this.runePrice) / 1e8
          this.totalInfo[period].swapCount += (+p.swapCount)
        })

        const ve = (this.totalInfo[period].earnings / this.totalInfo[period].volume)
        const ep = (this.totalInfo[period].earnings / this.totalInfo.pooled)

        this.totalInfo[period].earningsAPR = ep * ppy
        this.totalInfo[period].avgFee = ve * 1e4
      }

      updatePeriod('day', 365)
      updatePeriod('week', 52.1429)
      updatePeriod('month', 12)
      updatePeriod('year', 1)
    }
  }
}
</script>

<style lang="scss">
.pool-stats {
  margin-bottom: 1rem;

  .stat-item {
    display: flex;
    align-items: center;
    padding: 5px 0;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 5px;

    .title {
      display: flex;
      align-items: center;
      color: var(--sec-font-color);
      margin-right: .5rem;
      font-size: .9rem;

      .header-icon {
        display: inline-block;
        height: .9rem;
        width: .9rem;
        fill: var(--sec-font-color);
        margin-left: 5px;
      }
    }

    .value {
      color: var(--primary-color);
      font-size: .85rem;
    }
  }

  hr {
    margin: .5rem 0;
    opacity: 0.65;
    overflow: visible;
    height: 0;
    border: 0;
    border-top: 1px solid var(--border-color);
  }

}

@include md {
  .pool-stats {
    padding: 0;
    display: flex;
    justify-content: space-between;

    .stat-group {
      position: relative;
      padding: 1rem;
      flex: 1;
      margin-top: auto;

      &::after {
        align-self: stretch;
        position: absolute;
        right: 0;
        top: 0;
        content: "";
        display: block;
        height: calc(100% - 1rem);
        border-left: 0;
        border-right: 1px solid var(--border-color);
        margin: 0.5rem 0;
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
