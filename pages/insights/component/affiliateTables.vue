<template>
  <div class="leaderboard-container">
    <leaderboard-card
      title=" "
      :data="affiliateData"
      sort-key="affiliate_fees_usd"
      :limit="limit"
      :is-loading="!affiliateData || affiliateData.length === 0"
    >
      <template #header>
        <span>
          <h2 class="card-header-title">
            Affiliate Collected
            <small class="sub-title">- AVG affiliate bps</small>
          </h2>
        </span>
      </template>
      <template #default="{ row }">
        ${{ row.affiliate_fees_usd | number('0.00a') }}
        <small>- {{ row.avg_bps | percent(2) }}</small>
      </template>
    </leaderboard-card>

    <leaderboard-card
      title="Swap Volume"
      :data="affiliateData"
      sort-key="total_volume_usd"
      :limit="limit"
      :is-loading="!affiliateData || affiliateData.length === 0"
    >
      <template #default="{ row }">
        ${{ row.total_volume_usd | number('0.00a') }}
      </template>
    </leaderboard-card>

    <leaderboard-card
      title="Swap Count"
      :data="affiliateData"
      sort-key="total_swaps"
      :limit="limit"
      :is-loading="!affiliateData || affiliateData.length === 0"
    >
      <template #default="{ row }">
        {{ row.total_swaps | number('0,0') }}
      </template>
    </leaderboard-card>

    <leaderboard-card
      title="Volume / Swap Count"
      :data="affiliateData"
      sort-key="vc"
      :limit="limit"
      :is-loading="!affiliateData || affiliateData.length === 0"
    >
      <template #default="{ row }"> ${{ row.vc | number('0,0') }} </template>
    </leaderboard-card>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import LeaderboardCard from './LeaderboardCard'
import { nameMapping } from '~/utils'

export default {
  components: {
    LeaderboardCard,
  },
  props: {
    affiliateData: {
      type: Array,
      required: true,
    },
    isOverview: {
      type: Boolean,
      default: false,
    },
    limit: {
      type: Number,
      default: 30,
    },
  },
  computed: {
    ...mapGetters({
      theme: 'getTheme',
    }),
  },
  methods: {
    getAffiliateNames(name) {
      const affiliates = nameMapping[name]
      if (affiliates && affiliates.length > 0) {
        return affiliates.join(',')
      }

      return name
    },
  },
}
</script>

<style lang="scss" scoped>
.sub-title {
  color: var(--sec-font-color);
}

.leaderboard-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;

  @include md {
    flex-direction: row;
  }
}
</style>
