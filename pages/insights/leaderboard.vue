<template>
  <div>
    <Nav :active-mode.sync="period" :nav-items="periods" pre-text="Period :" />
    <cards-header :table-general-stats="getOverallInfo(period)" />
    <affiliate-table
      v-if="period === 'month'"
      :affiliate-data="affiliateDataMonthly"
    ></affiliate-table>

    <affiliate-table
      v-if="period === 'week'"
      :affiliate-data="affiliateDataWeekly"
    ></affiliate-table>

    <affiliate-table
      v-if="period === 'day'"
      :affiliate-data="affiliateDataDaily"
    ></affiliate-table>
  </div>
</template>

<script>
import AffiliateTable from './component/affiliateTables.vue'

export default {
  components: {
    AffiliateTable,
  },
  data() {
    return {
      affiliateDataMonthly: [],
      affiliateDataWeekly: [],
      affiliateDataDaily: [],
      overallInfoMonthly: null,
      overallInfoWeekly: null,
      overallInfoDaily: null,
      period: 'month',
      periods: [
        { text: '24 Hours', mode: 'day' },
        { text: '1 Week', mode: 'week' },
        { text: '1 Month', mode: 'month' },
      ],
    }
  },
  watch: {
    period(newPeriod, oldPeriod) {
      if (newPeriod === oldPeriod) return
      this.$router.push({ query: { period: newPeriod } })
      this.fetchAffiliateData()
    },
  },
  mounted() {
    if (this.$route.query.period) {
      this.period = this.$route.query.period
    } else {
      this.$router.push({ query: { period: this.period } })
    }
    this.fetchAffiliateData()
  },
  methods: {
    getOverallInfo(period) {
      switch (period) {
        case 'month':
          return this.overallInfoMonthly
        case 'week':
          return this.overallInfoWeekly
        case 'day':
          return this.overallInfoDaily
        default:
          return null
      }
    },
    async fetchAffiliateData() {
      try {
        if (this.period === 'month') {
          const { data } = await this.$api.getAffiliateSwapsByWallet()
          this.affiliateDataMonthly = this.formatData(data)
          this.overallInfoMonthly = this.calculateOverallInfo(data)
        } else if (this.period === 'week') {
          const { data } = await this.$api.getAffiliateSwapsWeekly()
          this.affiliateDataWeekly = this.formatData(data)
          this.overallInfoWeekly = this.calculateOverallInfo(data)
        } else if (this.period === 'day') {
          const { data } = await this.$api.getAffiliateSwapsDaily()
          this.affiliateDataDaily = this.formatData(data)
          this.overallInfoDaily = this.calculateOverallInfo(data)
        }
      } catch (error) {
        console.error(`Error fetching ${this.period} affiliate data:`, error)
      }
    },
    mapMissing(item) {
      switch (item.affiliate) {
        case 'Edge Wallet':
          return 'edge'
        case 'OneKey Wallet':
          return 'oneKey'
        case 'ELD':
          return 'Eldorito'
        case 'dcf':
          return 'Decentralfi'
        default:
          return item.affiliate
      }
    },
    calculateOverallInfo(data) {
      const totalAffiliates = data.reduce(
        (sum, item) => sum + item.affiliate_fees_usd,
        0
      )
      const totalSwaps = data.reduce((sum, item) => sum + item.total_swaps, 0)
      const totalVolume = data.reduce(
        (sum, item) => sum + +item.total_volume_usd,
        0
      )

      const avgFee = data.reduce((sum, item) => {
        const volumeRatio = item.total_volume_usd / totalVolume
        return sum + item.avg_affiliate_fee_basis_points * volumeRatio
      }, 0)

      const volumePerSwap = totalVolume / totalSwaps

      return [
        {
          name: 'Affiliates Collected',
          value: `$${this.$options.filters.number(totalAffiliates, '0.00a')}`,
        },
        {
          name: 'AVG Fee',
          value: `${this.$options.filters.percent(avgFee / 1e4, 2)}`,
        },
        {
          name: 'Swap Count',
          value: this.$options.filters.number(totalSwaps, '0a'),
        },
        {
          name: 'Volume / Count',
          value: `$${this.$options.filters.number(volumePerSwap, '0.00a')}`,
        },
      ]
    },
    formatData(data) {
      return data.map((item) => {
        return {
          affiliate: this.mapMissing(item),
          affiliate_fees_usd: item.affiliate_fees_usd,
          total_swaps: item.total_swaps,
          total_volume_usd: item.total_volume_usd,
          vc: item.vc,
          avg_bps: item.avg_affiliate_fee_basis_points / 1e4,
        }
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.leaderboard-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;

  @include md {
    flex-direction: row;
  }

  .data-section {
    flex: 1;
    margin: $space-0 $space-10;

    @include lg {
      margin: $space-0;
    }

    .section-title {
      text-align: center;
      color: var(--sec-font-color);
      padding: $space-18 $space-0;
      border-bottom: 1px solid var(--border-color);
      margin-top: $space-0;
    }
  }
}
</style>
