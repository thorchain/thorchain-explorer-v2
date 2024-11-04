<template>
  <page>
    <Nav :active-mode.sync="period" :nav-items="periods" pre-text="Period :" />
    <affiliate-table
      v-if="period === 'month'"
      :affiliate-data="affiliateDataMonthly"
    ></affiliate-table>
    <affiliate-table
      v-if="period === 'week'"
      :affiliate-data="affiliateDataWeekly"
    ></affiliate-table>
  </page>
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
      period: 'month',
      periods: [
        { text: '1 Week', mode: 'week' },
        { text: '1 Month', mode: 'month' },
      ],
    }
  },
  mounted() {
    try {
      this.$api.getAffiliateSwapsByWallet().then(({ data }) => {
        this.affiliateDataMonthly = this.formatData(data)
      })
    } catch (error) {
      console.error('Error fetching affiliate data:', error)
    }

    try {
      this.$api.getAffiliateSwapsWeekly().then(({ data }) => {
        this.affiliateDataWeekly = this.formatData(data)
      })
    } catch (error) {
      console.error('Error fetching affiliate data:', error)
    }
  },
  methods: {
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

<style lang="scss" scoped></style>
