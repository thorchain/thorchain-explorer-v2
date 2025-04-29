<template>
  <div>
    <div v-if="error">
      <h4>There are no savers for this pool</h4>
    </div>
    <cards-header
      v-if="
        saversExtraData &&
        (saversExtraData.earned > 0 ||
          saversExtraData.saversCount > 0 ||
          saversExtraData.saversDepth > 0)
      "
      :table-general-stats="saversGeneralStats"
    />
    <div
      v-if="
        saversExtraData &&
        (saversExtraData.earned > 0 ||
          saversExtraData.saversCount > 0 ||
          saversExtraData.saversDepth > 0)
      "
    >
      <nuxt-child keep-alive :savers-data="saversExtraData" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  asyncData({ params }) {
    return { poolName: params.poolName }
  },
  data() {
    return {
      error: false,
      saversExtraData: undefined,
      saversGeneralStats: [
        {
          name: 'Total Earned',
        },
        {
          name: 'Total Annualised Return',
        },
        {
          name: 'Savers Count',
        },
        {
          name: 'Savers Depth',
        },
      ],
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
    networkEnv() {
      return process.env.NETWORK
    },
    computedSaversGeneralStats() {
      return this.saversGeneralStats.filter((s) => !s.hide)
    },
  },
  async mounted() {
    const saversExtraData = (await this.$api.getSaversInfo()).data[
      this.poolName
    ]?.savers
    if (!saversExtraData) {
      this.error = true
    }
    this.saversExtraData = saversExtraData
    this.updateGeneralStats(saversExtraData)
  },
  methods: {
    updateGeneralStats(saversExtraData) {
      if (!saversExtraData) {
        return
      }
      this.saversGeneralStats = [
        {
          name: 'Total Earned',
          value:
            '$' +
            this.$options.filters.number(
              (+saversExtraData?.earned * +saversExtraData?.assetPriceUSD) /
                1e8 || 0,
              '0,0a'
            ),
          hide: !saversExtraData?.earned,
        },
        {
          name: 'Total Annualised Return',
          value: this.$options.filters.percent(saversExtraData.saversReturn, 2),
        },
        {
          name: 'Savers Count',
          value: this.$options.filters.number(
            saversExtraData.saversCount,
            '0,0'
          ),
        },
        {
          name: 'Savers Depth',
          value:
            '$' +
            this.$options.filters.number(
              (saversExtraData.saversDepth * saversExtraData.assetPriceUSD) /
                1e8 || 0,
              '0,0a'
            ),

          extraText: `(${this.$options.filters.number(saversExtraData.saversDepth / 1e8, '0,0.00a')} ${this.showAsset(saversExtraData.asset)})`,
        },
      ]
    },
  },
  head: {
    title: 'THORChain Network Explorer | Saver Pool',
  },
}
</script>

<style lang="scss">
.nav-pool-header {
  display: flex;
  margin-bottom: $space-16;

  a {
    padding: $space-8 $space-12;
    margin: $space-0 0.1rem;
    color: var(--font-color);
    text-decoration: none;
    border-radius: $radius-s;

    &:first-of-type {
      margin-left: $space-0;
    }

    &:hover {
      background-color: var(--active-bg-color);
    }

    &.nuxt-link-exact-active {
      background-color: var(--active-bg-color);
      color: var(--sec-font-color);
    }
  }
}

h3 {
  color: var(--sec-font-color);
  margin: $space-0;
}

.savers-stat-header {
  display: grid;
  gap: 15px;
  margin-bottom: $space-16;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  grid-template-rows: auto;

  .savers-stat-card {
    padding: $space-32 $space-0;
    border-radius: $radius-lg;
    background-color: var(--card-bg-color);
    border: 1px solid var(--border-color);

    .value {
      color: var(--sec-font-color);
      font-size: $font-size-xl;
      text-align: center;
    }

    .name {
      color: var(--font-color);
      text-align: center;
    }

    .extra-text {
      font-size: $font-size-mobile;
      text-align: center;
    }
  }
}

.savers-filled-card {
  display: flex;
  flex-direction: column;
  gap: $space-14;
  min-width: 350px;
}

.chart-edition {
  margin-bottom: $space-14;
  display: flex;
  gap: $space-14;
  flex-wrap: wrap;
  margin: $space-14 $space-10;

  @include lg {
    margin: $space-14 $space-0;
  }

  .card-container {
    border: 1px solid var(--border-color);
    border-radius: $radius-lg;
    margin: $space-0;

    @include lg {
      margin: auto;
    }
  }

  h4 {
    color: var(--sec-font-color);
    text-align: center;
  }
}
</style>
