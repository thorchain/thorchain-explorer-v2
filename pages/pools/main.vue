<template>
  <Page>
    <div>
      <Nav
        :active-mode.sync="tableMode"
        :nav-items="tableModeItems"
        :extra-classes="['pools-type-table']"
      />
    </div>
    <Card :is-loading="loading">
      <div v-if="pools && pools.length > 0" class="pools-box">
        <template v-for="(k, v, i) in tables">
          <template v-if="k.mode === tableMode && k.data.length === 0">
            No Pools {{ k.mode | capitalize }}
          </template>
          <vue-good-table
            v-if="k.data.length > 0"
            v-show="tableMode == k.mode"
            :key="i"
            :columns="poolCols"
            :rows="k.data"
            style-class="vgt-table net-table"
            :sort-options="{
              enabled: true,
              initialSortBy: { field: 'depth', type: 'desc' },
            }"
            @on-row-click="gotoPoolTable"
          >
            <template slot="table-row" slot-scope="props">
              <div
                v-if="props.column.field == 'asset'"
                v-tooltip="props.row.asset"
                class="cell-content"
              >
                <AssetIcon :asset="props.row.asset" />
                <span class="clickable">{{
                  props.formattedRow[props.column.field]
                }}</span>
              </div>
              <div v-else-if="props.column.field == 'volume'">
                <span>{{ props.formattedRow[props.column.field] }}</span>
              </div>
              <div v-else-if="props.column.field == 'earningsAPR'">
                <span>{{ props.formattedRow[props.column.field] }}</span>
              </div>
              <div v-else-if="props.column.field == 'balances'">
                <div v-if="props.row.balances > 0">
                  <div class="balance-row">
                    {{ props.row.balances | number('0,0.00a') }}
                    <small>RUNE</small>
                  </div>
                  <div class="balance-row">
                    {{ props.row.assetDepth | number('0,0.00a') }}
                    <small>{{ showAsset(props.row.asset, true) }}</small>
                  </div>
                </div>
                <span v-else> - </span>
              </div>
              <div v-else-if="props.column.field == 'trading'">
                <span v-if="props.row.trading > 0">
                  ${{ props.row.trading | number('0,0.00a') }} ({{
                    (props.row.trading / props.row.depth) | percent
                  }})
                </span>
                <span v-else> - </span>
              </div>
              <div v-else-if="props.column.field == 'polShare'">
                <span v-if="props.row.polShare > 0">
                  {{ formattedPrice(props.row.polShare) }}
                  ({{
                    percentageFormat(props.row.polShare / props.row.depth, 0)
                  }})
                </span>
                <span v-else> - </span>
              </div>
              <div
                v-else-if="props.column.field == 'actions'"
                class="action-content"
              >
                <drop-modal name="swap" :index="props.row.originalIndex">
                  <template #button>
                    <swap-icon />
                  </template>
                  <a
                    v-for="ie in interfaces"
                    :href="ie.swap_url || ie.info_url"
                    target="_blank"
                    class="interface"
                  >
                    <span>{{ ie.name }}</span>
                  </a>
                </drop-modal>
                <drop-modal name="earn" :index="props.row.originalIndex">
                  <template #button>
                    <finance-icon class="finance-icon" />
                  </template>
                  <a
                    v-for="ie in interfaces.filter((e) => e.earn_url)"
                    :href="ie.earn_url"
                    target="_blank"
                    class="interface"
                  >
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
import { shuffle, capitalize } from 'lodash'
import { mapGetters } from 'vuex'
import SwapIcon from '~/assets/images/swap.svg?inline'
import FinanceIcon from '~/assets/images/finance-selected.svg?inline'
import InterfacesJSON from '~/assets/wallets/index'
import { tradeToAsset } from '~/utils'

export default {
  components: { SwapIcon, FinanceIcon },
  data() {
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
        { text: 'All', mode: 'all' },
      ],
      tableModeItems: [
        { text: 'Active Pools', mode: 'active' },
        { text: 'Staged Pools', mode: 'staged' },
      ],
      tableMode: 'active',
      poolCols: [
        {
          label: 'Asset',
          field: 'asset',
          formatFn: this.formatAsset,
        },
        {
          label: 'USD Price',
          field: 'price',
          type: 'number',
          formatFn: this.curFormat,
          tdClass: 'mono',
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
          tdClass: 'mono',
        },
        {
          label: 'Balances',
          field: 'balances',
          type: 'number',
          tdClass: 'mono',
        },
        {
          label: 'Trade Asset Depth',
          field: 'trading',
          type: 'number',
          formatFn: 'number',
          tdClass: 'mono',
        },
        {
          label: 'RUNEPool Share',
          field: 'polShare',
          type: 'number',
          tdClass: 'mono',
        },
        {
          label: 'Volume/Depth',
          field: 'vd',
          type: 'percentage',
          tdClass: 'mono',
        },
        {
          label: 'Est. Yr. Earnings',
          field: 'estEarnings',
          type: 'number',
          formatFn: this.formattedPrice,
          tdClass: 'mono',
        },
        {
          label: 'Swap/LP',
          field: 'actions',
          sortable: false,
          thClass: 'th-center',
        },
      ],
      pools: undefined,
      tables: {
        activeRows: {
          data: [],
          mode: 'active',
        },
        standbyRows: {
          data: [],
          mode: 'staged',
        },
      },
      interfaces: [],
      runePoolData: [],
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
  },
  watch: {
    period(period) {
      this.updatePool(period)
    },
  },
  async mounted() {
    this.loadInterfaces()
    this.updatePool(this.period)
    try {
      this.runePoolData = await this.$api.getRunePoolsInfo()
    } catch (error) {
      console.warn('No runepools')
    }
  },
  methods: {
    loadInterfaces() {
      this.interfaces = shuffle(InterfacesJSON)
    },
    updatePool(period) {
      this.loading = true
      this.$api
        .getPools(period)
        .then(async ({ data }) => {
          this.pools = data
          const pd = await this.getDVEs()
          const { data: tradeAssets } = await this.$api.getTradeAssets()

          const ps = this.pools.map((p) => {
            const pe = pd?.day.pools.find((e) => e.pool === p.asset)
            const tradeAsset = tradeAssets.find(
              (e) => tradeToAsset(e.asset) === p.asset
            )

            return {
              status: p.status,
              price: +p.assetPriceUSD,
              depth: (+p.assetDepth / 10 ** 8) * p.assetPriceUSD,
              apy: p.annualPercentageRate,
              volume: (+p.volume24h / 10 ** 8) * this.runePrice,
              vd: +p.volume24h / (+p.assetDepth * +p.assetPrice),
              asset: p.asset,
              saversDepth: +p.saversDepth / 10 ** 8,
              depthToUnitsRatio: p.saversDepth
                ? this.$options.filters.number(
                    +p.saversDepth / +p.saversUnits,
                    '0.00000'
                  )
                : 0,
              earning24hr: pe ? (pe.earnings * this.runePrice) / 10 ** 8 : 0,
              estEarnings: pe
                ? (pe.earnings * this.runePrice * 365) / 10 ** 8
                : 0,
              collateral: +p.totalCollateral / 1e8,
              assetDepth: +p.assetDepth / 1e8,
              balances: +p.runeDepth / 1e8,
              trading: (+tradeAsset?.depth / 1e8) * p.assetPriceUSD,
            }
          })
          this.sepPools(ps)
          this.loading = false
        })
        .catch((e) => {
          console.error(e)
        })
    },
    async getDVEs() {
      try {
        const poolsDataDay = (await this.$api.getPoolsHistory()).data
        return {
          day: poolsDataDay,
        }
      } catch (error) {
        return undefined
      }
    },
    normalNumberFormat(number, filter) {
      return number ? this.$options.filters.number(+number, '0,0.00') : '-'
    },
    formattedPrice(number, filter) {
      return '$' + this.$options.filters.number(number, '0.00a')
    },
    numberFormat(number, filter) {
      return this.$options.filters.number(number, '0.00a')
    },
    curFormat(number) {
      return this.$options.filters.currency(number)
    },
    gotoPoolTable(params) {
      const ac = Array.from(document.querySelectorAll('.action-section'))
      const el = params.event.srcElement
      if (ac?.some((l) => l?.contains(el))) {
        return
      }
      this.gotoPool(params.row.asset)
    },
    getLiquidityShareByAsset(asset) {
      for (const i in this.runePoolData.data) {
        if (asset === this.runePoolData.data[i].pool) {
          return this.runePoolData.data[i].share
        }
      }
      return 0
    },
    sepPools(pools) {
      if (!pools && pools.length <= 0) {
        return
      }

      this.tables.standbyRows.data = []
      this.tables.activeRows.data = []

      for (const i in pools) {
        if (pools[i].status === 'available') {
          pools[i].polShare =
            this.getLiquidityShareByAsset(pools[i].asset) * pools[i].depth
          this.tables.activeRows.data.push(pools[i])
        } else {
          this.tables.standbyRows.data.push(pools[i])
        }
      }
    },
  },
  head: {
    title: 'THORChain Network Explorer | Pools',
  },
}
</script>

<style lang="scss" scoped>
.pools-box {
  .nav-headers.box.pools-type-table {
    border: none !important;
    margin-bottom: $space-16 !important;
    border-radius: $radius-md $radius-md;
  }
}

.finance-icon {
  fill: #14b8a6;
}

.action-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-10;
}

.action-btn {
  cursor: pointer;
  border-radius: $radius-lg;
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
    padding: $space-3 $space-0;
    left: calc(100% + 10px);
    top: 0;

    a {
      display: flex;
      align-items: center;
      color: var(--font-color);
      text-decoration: none;
      padding: $space-8;
      border-radius: $radius-sm;
      margin: $space-0 $space-3;
      gap: 10px;
      font-family: 'Exo 2';
      font-size: $font-size-mobile;
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
  padding: $space-8 $space-5;
  border-radius: $radius-sm;
  margin: 0.1rem $space-3;
  gap: 10px;
  font-family: 'Exo 2';
  font-size: $font-size-mobile;
  text-wrap: nowrap;

  &:hover {
    background-color: var(--darker-bg);
  }

  .interface-icon {
    width: 1.3rem;
    height: 1.3rem;
  }
}

.balance-row {
  display: flex;
  justify-content: end;
  align-items: center;
  gap: $space-8;
}
</style>
