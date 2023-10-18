<template>
  <Page>
    <!-- <Nav :active-mode.sync="viewMode" :nav-items="viewPools" /> -->
    <!-- <Nav :active-mode.sync="period" :nav-items="periods" pre-text="APY Period :" /> -->
    <div v-if="!loading" class="pool-stats base-container">
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
    <Card :is-loading="loading">
      <!-- <template>
        <pool-card/>
      </template> -->
      <div v-if="pools && pools.length > 0" class="pools-box">
        <Nav :active-mode.sync="tableMode" :nav-items="tableModeItems" :extra-classes="['pools-type-table']" />
        <template v-for="(k, v, i) in tables">
          <vue-good-table
            v-if="k.data.length > 0"
            v-show="tableMode == k.mode"
            :key="i"
            :columns="poolCols"
            :rows="k.data"
            style-class="vgt-table net-table"
            :pagination-options="{
              enabled: true,
              perPage: 30,
              perPageDropdownEnabled: false,
            }"
            :sort-options="{
              enabled: true,
              initialSortBy: {field: 'vd', type: 'desc'}
            }"
            @on-row-click="gotoPoolTable"
          >
            <template slot="table-row" slot-scope="props">
              <div v-if="props.column.field == 'asset'" v-tooltip="props.row.asset" class="cell-content">
                <AssetIcon :asset="props.row.asset" />
                <span>{{ props.formattedRow[props.column.field] }}</span>
              </div>
              <div v-else-if="props.column.field == 'volume'" class="action-content">
                <span>{{ props.formattedRow[props.column.field] }}</span>
                <drop-modal name="swap" :index="props.row.originalIndex">
                  <template #button>
                    <swap-icon />
                  </template>
                  <a v-for="ie in interfaces" :href="ie.swap_url || ie.info_url" target="_blank" class="interface">
                    <span>{{ ie.name }}</span>
                  </a>
                </drop-modal>
              </div>
              <div v-else-if="props.column.field == 'earningsAPR'" class="action-content">
                <span>{{ props.formattedRow[props.column.field] }}</span>
                <drop-modal name="earn" :index="props.row.originalIndex">
                  <template #button>
                    <finance-icon class="finance-icon" />
                  </template>
                  <a v-for="ie in interfaces.filter(e => e.earn_url)" :href="ie.earn_url" target="_blank" class="interface">
                    <span>{{ ie.name }}</span>
                  </a>
                </drop-modal>
              </div>
              <span v-else>
                {{ props.formattedRow[props.column.field] }}
              </span>
            </template>
          </vue-good-table>
        </template>
      </div>
    </Card>
  </Page>
</template>

<script>
import { shuffle } from 'lodash'
import { mapGetters } from 'vuex'
import UnknownIcon from '~/assets/images/unknown.svg?inline'
import SwapIcon from '~/assets/images/swap.svg?inline'
import FinanceIcon from '~/assets/images/finance-selected.svg?inline'
import InterfacesJSON from '~/assets/wallets/index'

export default {
  components: { UnknownIcon, SwapIcon, FinanceIcon },
  data () {
    return {
      loading: false,
      error: false,
      period: '30d',
      periods: [
        { text: '1 Hour', mode: '1h' },
        { text: '24 Hours', mode: '24h' },
        { text: '7 Days', mode: '7d' },
        { text: '1 Month', mode: '30d' },
        { text: '3 Month', mode: '90d' },
        { text: '100 Days', mode: '100d' },
        { text: '6 Months', mode: '180d' },
        { text: '1 Year', mode: '365d' },
        { text: 'All', mode: 'all' }
      ],
      tableModeItems: [
        { text: 'Active Pools', mode: 'active' },
        { text: 'Staged/Suspended Pools', mode: 'staged' }
      ],
      tableMode: 'active',
      poolCols: [
        {
          label: 'Asset',
          field: 'asset',
          formatFn: this.formatAsset
        },
        {
          label: 'USD Price',
          field: 'price',
          type: 'number',
          formatFn: this.curFormat,
          tdClass: 'mono'
        },
        {
          label: 'Volume 24H',
          field: 'volume',
          type: 'number',
          formatFn: this.formattedPrice,
          tdClass: 'mono',
        },
        {
          label: 'Depth',
          field: 'depth',
          type: 'number',
          formatFn: this.formattedPrice,
          tdClass: 'mono'
        },
        {
          label: 'Volume/Depth',
          field: 'vd',
          type: 'percentage',
          tdClass: 'mono'
        },
        {
          label: 'Fee/Reward',
          field: 'feeRatio',
          type: 'percentage',
          tdClass: 'mono'
        },
        {
          label: '24Hr Earning',
          field: 'earning24hr',
          type: 'number',
          formatFn: this.formattedPrice,
          tdClass: 'mono'
        },
        {
          label: 'Annual Earnings Extrapolated',
          field: 'annualEarningsExtrapolated',
          type: 'number',
          formatFn: this.formattedPrice,
          tdClass: 'mono'
        },
        {
          label: 'Earnings APR',
          field: 'earningsAPR',
          type: 'percentage',
          tdClass: 'mono'
        }
      ],
      pools: undefined,
      tables: {
        activeRows: {
          data: [],
          mode: 'active'
        },
        standbyRows: {
          data: [],
          mode: 'staged'
        }
      },
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
      },
      interfaces: []
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice'
    })
  },
  watch: {
    period (period) {
      this.updatePool(period)
    }
  },
  mounted () {
    this.loadInterfaces()
    this.updatePool(this.period)
  },
  methods: {
    loadInterfaces () {
      this.interfaces = shuffle(InterfacesJSON)
    },
    updatePool (period) {
      this.loading = true
      this.$api.getPools(period).then(async ({ data }) => {
        this.pools = data
        const pd = await this.getDVEs()

        const ps = this.pools.map((p) => {
          const pe = pd?.day.pools.find(e => e.pool === p.asset)
          this.totalInfo.pooled += ((+p.assetDepth * 2 / 10 ** 8) * p.assetPriceUSD)

          return {
            status: p.status,
            price: p.assetPriceUSD,
            depth: ((+p.assetDepth / 10 ** 8) * p.assetPriceUSD),
            apy: p.annualPercentageRate,
            volume: pe ? (+pe.swapVolume / 10 ** 8) * this.runePrice : (+p.volume24h / 10 ** 8) * this.runePrice,
            vd: pe ? (+pe.swapVolume * this.runePrice) / (+p.assetDepth * +p.assetPriceUSD) : (+p.volume24h) / ((+p.assetDepth * +p.assetPrice)),
            asset: p.asset,
            saversDepth: (+p.saversDepth / 10 ** 8),
            depthToUnitsRatio: p.saversDepth ? this.$options.filters.number(+p.saversDepth / +p.saversUnits, '0.00000') : 0,
            earning24hr: pe ? (pe.earnings * this.runePrice) / 10 ** 8 : 0,
            annualEarningsExtrapolated: pe ? (pe.earnings * this.runePrice * 365) / 10 ** 8 : 0,
            feeRatio: pe ? (pe.swapFees / pe.earnings) : 0,
            earningsAPR: pe ? (pe.earnings / ((+p.assetDepth * p.assetPrice) + +p.runeDepth)) * 365 : 0
          }
        })
        this.sepPools(ps)
        this.getTotalInfo(pd)
        this.loading = false
      }).catch((e) => {
        console.error(e)
      })
    },
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
          this.totalInfo[period].volume += (+p.swapVolume * this.runePrice) / 1e8
          this.totalInfo[period].earnings += (+p.earnings * this.runePrice) / 1e8
          this.totalInfo[period].swapCount += (+p.swapCount)
        })

        const ve = (this.totalInfo[period].earnings / this.totalInfo[period].volume)
        const ep = (this.totalInfo[period].earnings / this.totalInfo.pooled)

        this.totalInfo[period].earningsAPR = ep * ppy
        this.totalInfo[period].avgFee = ve * 10000
      }

      updatePeriod('day', 365)
      updatePeriod('week', 52.1429)
      updatePeriod('month', 12)
      updatePeriod('year', 1)
    },
    normalNumberFormat (number, filter) {
      return number ? this.$options.filters.number(+number, '0,0.00') : '-'
    },
    formattedPrice (number, filter) {
      return '$' + this.$options.filters.number(number, '0.00a')
    },
    numberFormat (number, filter) {
      return this.$options.filters.number(number, '0.00a')
    },
    curFormat (number) {
      return this.$options.filters.currency(number)
    },
    formatAsset (asset) {
      return asset.length > 10
        ? asset.slice(0, 14) + '...'
        : asset
    },
    gotoPoolTable (params) {
      const ac = Array.from(document.querySelectorAll('.action-section'))
      const el = params.event.srcElement
      if (ac?.some(l => l?.contains(el))) {
        return
      }
      this.gotoPool(params.row.asset)
    },
    sepPools (pools) {
      if (!pools && pools.length <= 0) {
        return
      }

      this.tables.standbyRows.data = []
      this.tables.activeRows.data = []

      for (const i in pools) {
        if (pools[i].status === 'available') {
          this.tables.activeRows.data.push(pools[i])
        } else {
          this.tables.standbyRows.data.push(pools[i])
        }
      }
    }
  }
}
</script>

<style lang="scss">
.pools-box {
  .nav-headers.box.pools-type-table {
    margin: 0 !important;
    border: 1px solid var(--border-color);
    border-bottom: 0;
    border-radius: 7px 8px 0 0;
  }
}

.pool-stats {
  .stat-item {
    display: flex;
    align-items: center;
    padding: 5px 0;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 5px;

    .value {
      margin-top: 5px;
    }

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
      font-size: .875rem;
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

.finance-icon {
  fill: #14b8a6;
}

.action-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.action-btn {
  cursor: pointer;
  border-radius: .5rem;
  border: none;

  svg {
    height: 1.3rem;
    width: 1.3rem;
  }
}

.action-section {
  position: relative;
}

.swap-interfaces {
  .swap-menu {
    display: flex;
    position: absolute;
    padding: 0.2rem 0;
    left: calc(100% + 10px);
    top: 0;

    a {
      display: flex;
      align-items: center;
      color: var(--font-color);
      text-decoration: none;
      padding: 0.5rem;
      border-radius: 0.2rem;
      margin: 0 0.2rem;
      gap: 10px;
      font-family: "Exo 2";
      font-size: 0.9rem;
      text-wrap: nowrap;

      .interface-icon {
        fill: inherit;
        widows: 1rem;
        height: 1rem;
      }

      &:hover {
        background-color: var(--darker-bg);
      }

      .interface-icon {
        width: 1.3rem;
        height: 1.3rem;
      }
    }

    &.blue {
      a {
        color: var(--font-color);
      }
    }
  }
}

a.interface {
  display: flex;
  align-items: center;
  color: var(--font-color);
  text-decoration: none;
  padding: 0.5rem 0.3rem;
  border-radius: 0.2rem;
  margin: 0.1rem 0.2rem;
  gap: 10px;
  font-family: "Exo 2";
  font-size: 0.9rem;
  text-wrap: nowrap;

  &:hover {
    background-color: var(--darker-bg);
  }

  .interface-icon {
    width: 1.3rem;
    height: 1.3rem;
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
