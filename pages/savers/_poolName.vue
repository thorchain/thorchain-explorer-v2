<template>
  <Page>
    <div class="simple-card">
      <div class="card-body savers-header">
        <AssetIcon :asset="poolName" height="1.6rem" />
        <h3>
          {{ poolName }}
        </h3>
      </div>
    </div>
    <div v-show="networkEnv === 'mainnet' && saversGeneralStats && saversGeneralStats.length > 0" class="savers-stat-header">
      <div v-for="(stat, i) in computedSaversGeneralStats" :key="i" class="savers-stat-card">
        <div class="value">
          {{ stat.value }}
        </div>
        <div class="extra-text" v-html="stat.extraText" />
        <div class="name">
          {{ stat.name }}
        </div>
      </div>
    </div>
    <Nav
      :is-link="true"
      :nav-items="[
        {link: `/savers/${poolName}`, text: 'Savers Overview'},
      ]"
    />
    <div v-if="saversExtraData">
      <nuxt-child keep-alive :savers-data="saversExtraData" />
    </div>
  </Page>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  asyncData ({ params }) {
    return { poolName: params.poolName }
  },
  data () {
    return {
      error: false,
      saversGeneralStats: [],
      saversExtraData: undefined
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice'
    }),
    networkEnv () {
      return process.env.NETWORK
    },
    computedSaversGeneralStats () {
      return this.saversGeneralStats.filter(s => !s.hide)
    }
  },
  async mounted () {
    const saversExtraData = (await this.$api.getSaversInfo()).data[this.poolName]?.savers
    if (!saversExtraData) { this.error = true }
    this.saversExtraData = saversExtraData
    this.updateGeneralStats(saversExtraData)
  },
  methods: {
    updateGeneralStats (saversExtraData) {
      this.saversGeneralStats = [
        {
          name: 'Total Earned',
          value: this.$options.filters.currency((+saversExtraData.earned * +saversExtraData.assetPriceUSD) / 1e8),
          hide: !saversExtraData.earned
        },
        {
          name: 'Total Annualised Return',
          value: this.$options.filters.percent(saversExtraData.saversReturn, 2)
        },
        {
          name: 'Savers Count',
          value: this.$options.filters.number(saversExtraData.saversCount, '0,0')
        },
        {
          name: 'Savers Depth',
          value: this.$options.filters.currency(((saversExtraData.saversDepth * saversExtraData.assetPriceUSD) / 1e8)),
          extraText: `(${this.$options.filters.number(saversExtraData.saversDepth / 1e8, '0,0.00')} <small>${saversExtraData.asset}</small>)`
        }
      ]
    }
  }
}
</script>

<style lang="scss">
.nav-pool-header {
  display: flex;
  margin-bottom: 1rem;

  a {
    padding: .5rem .7rem;
    margin: 0 .1rem;
    color: var(--font-color);
    text-decoration: none;
    border-radius: .3rem;

    &:first-of-type {
      margin-left: 0;
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
  margin: 0;
}

.savers-header {
  display: flex;
  align-items: center;
}

.savers-stat-header {
  display: grid;
  gap: 15px;
  margin-bottom: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  grid-template-rows: auto;

  .savers-stat-card {
    padding: 2rem 0;
    border-radius: 8px;
    background-color: var(--card-bg-color);
    border: 1px solid var(--border-color);

    .value {
      color: var(--sec-font-color);
      font-size: 1.5rem;
      text-align: center;
    }

    .name {
      color: var(--font-color);
      text-align: center;
    }

    .extra-text {
      font-size: .9rem;
      text-align: center;
    }
  }
}

.savers-filled-card {
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-width: 350px;
}

.chart-edition {
  margin-bottom: 15px;
  display: flex;
  gap: 15px;
  flex-wrap: wrap;

  .card-container {
    border: 1px solid var(--border-color);
    border-radius: .5rem;
    margin: auto;
  }

  h4 {
    color: var(--sec-font-color);
    text-align: center;
  }
}

.inner-pie-chart {
  max-width: 300px;
}
</style>
