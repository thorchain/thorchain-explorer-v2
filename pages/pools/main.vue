<template>
  <Page>
    <div>
      <Nav :active-mode.sync="tableMode" :nav-items="tableModeItems" :extra-classes="['pools-type-table']" />
    </div>
    <Card>
      <TableLoader v-if="loading" :cols="poolCols" :rows="Array(10).fill({})" />
      <div v-else-if="pools && pools.length > 0" class="pools-box">
        <template v-for="(k, v, i) in tables">
          <template v-if="k.mode === tableMode && k.data.length === 0">
            <div class="no-pools-message">
              No Pools {{ k.mode | capitalize }}
            </div>
          </template>
          <vue-good-table v-else-if="k.data.length > 0 && tableMode === k.mode" :key="i" :columns="poolCols"
            :rows="k.data" style-class="vgt-table net-table sticky-header" :fixed-header="true" :line-numbers="true"
            :sort-options="{
              enabled: true,
              initialSortBy: { field: 'depth', type: 'desc' },
            }" @on-row-click="gotoPoolTable">
            <template slot="table-row" slot-scope="props">
              <div v-if="props.column.field == 'asset'" v-tooltip="props.row.asset" class="cell-content">
                <AssetIcon :asset="props.row.asset" />
                <span class="clickable">{{
                  props.formattedRow[props.column.field]
                }}</span>
              </div>
              <VTooltip
                v-else-if="props.column.field == 'price'"
                class="price-cell"
              >
                <div class="price-value">{{ curFormat(props.row.price) }}</div>
                <div :class="['oracle-diff', `oracle-${props.row.oracleTone}`]">
                  <span class="oracle-dot" />
                  <span v-if="props.row.oraclePrice">
                    {{ oracleDiffFormat(props.row.oracleDiff) }}
                  </span>
                  <span v-else>no feed</span>
                </div>
                <template #popper>
                  <div class="tooltip-header">Oracle price</div>
                  <div class="tooltip-body">
                    <template v-if="props.row.oraclePrice">
                      <span>
                        <span>Oracle</span>
                        <b>{{ curFormat(props.row.oraclePrice) }}</b>
                      </span>
                      <span>
                        <span>Pool</span>
                        <b>{{ curFormat(props.row.price) }}</b>
                      </span>
                      <span>
                        <span>Difference</span>
                        <b>{{ oracleDiffFormat(props.row.oracleDiff) }}</b>
                      </span>
                      <small>
                        How far the pool price sits from the oracle price feed.
                      </small>
                    </template>
                    <small v-else>
                      No oracle price feed is published for this asset, so the
                      pool price cannot be compared.
                    </small>
                  </div>
                </template>
              </VTooltip>
              <div v-else-if="props.column.field == 'volume'">
                <span>{{ props.formattedRow[props.column.field] }}</span>
              </div>
              <div v-else-if="props.column.field == 'earningsAPR'">
                <span>{{ props.formattedRow[props.column.field] }}</span>
              </div>
              <div v-else-if="props.column.field == 'balances'">
                <div v-if="props.row.balances > 0">
                  <div class="balance-row">
                    {{ props.row.assetDepth | number('0,0.00a') }}
                    <small>{{ showAsset(props.row.asset, true) }}</small>
                    <small class="balance-usd">
                      ({{ formattedPrice(props.row.assetDepth * props.row.price) }})
                    </small>
                  </div>
                  <div class="balance-row balance-secondary">
                    {{ props.row.balances | number('0,0.00a') }}
                    <RuneAsset :show-icon="false" />
                    <small class="balance-usd">
                      ({{ formattedPrice(props.row.balances * runePrice) }})
                    </small>
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
              <div
                v-else-if="props.column.field == 'feesDepth'"
                class="pol-row"
              >
                <VTooltip v-if="props.row.asset === nextPolAsset">
                  <span class="next-pol">
                    {{ props.formattedRow[props.column.field] }}
                  </span>
                  <template #popper>
                    <div class="tooltip-header">Next POL target</div>
                    <div class="tooltip-body">
                      <template v-if="poolCycle">
                        <span>
                          <span>Cycle</span>
                          <b>{{ percentageFormat(poolCycle.progress, 0) }}</b>
                        </span>
                        <span>
                          <span>Resets at</span>
                          <b>{{ poolCycle.nextReset | number('0,0') }}</b>
                        </span>
                        <span>
                          <span>Time left</span>
                          <b>~{{ durationFormat(poolCycle.secondsLeft) }}</b>
                        </span>
                      </template>
                      <small>
                        Leads this cycle among pools POL can deploy into. At the
                        reset it becomes the pool POL deploys into.
                      </small>
                    </div>
                  </template>
                </VTooltip>
                <span v-else>{{ props.formattedRow[props.column.field] }}</span>
              </div>
              <div v-else-if="props.column.field == 'polTotal'">
                <div v-if="props.row.polPositions.length > 0">
                  <div
                    v-for="position in props.row.polPositions"
                    :key="position.type"
                    class="pol-row"
                  >
                    <span :class="['pol-tag', `pol-tag-${position.type}`]">
                      {{ position.label }}
                    </span>
                    <span>
                      {{ formattedPrice(position.value) }}
                      ({{ percentageFormat(position.share, 2) }})
                    </span>
                  </div>
                </div>
                <span v-else> - </span>
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
import { capitalize } from 'lodash'
import moment from 'moment'
import { mapGetters } from 'vuex'
import endpoints from '~/api/endpoints'
import { assetFromString, tradeToAsset } from '~/utils'
import RuneAsset from '~/components/RuneAsset.vue'
import {
  cycleFeesDepth,
  nextPolReserveTarget,
  poolCycleProgress,
} from '~/utils/polReserve'
import stickyHeaderScrollSync from '~/mixins.js/stickyHeaderScrollSync'

export default {
  components: { RuneAsset },
  mixins: [stickyHeaderScrollSync],
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
          tooltip: 'Pool price, with its difference from the oracle price.',
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
          label: 'Protocol Liquidity',
          field: 'polTotal',
          type: 'number',
          tdClass: 'mono',
          tooltip:
            'Liquidity the protocol owns in this pool, split by the module holding it.\nPOL: the POL reserve module.\nReserve: the reserve module, which backs RUNEPool.\nEach row is the current redeemable value and the share of pool units it owns.',
        },
        {
          label: 'Volume/Depth',
          field: 'vd',
          type: 'percentage',
          tdClass: 'mono',
        },
        {
          label: 'Fees/Depth',
          field: 'feesDepth',
          type: 'number',
          formatFn: this.feesDepthFormat,
          tdClass: 'mono',
          tooltip:
            'Liquidity fees collected this pool cycle (3 days) divided by the RUNE depth. It resets to zero every cycle.\nPOL deploys into the eligible pool that led the previous cycle, so the leader here is the next POL target.',
        },
        {
          label: 'Est. Yr. Earnings',
          field: 'estEarnings',
          type: 'number',
          formatFn: this.formattedPrice,
          tdClass: 'mono',
        },
      ],
      reserveAddress: endpoints[process.env.NETWORK].MODULE_ADDR,
      polReserveAddress: endpoints[process.env.NETWORK].POL_RESERVE_ADDR,
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
      oraclePrices: [],
      thorPools: {},
      reserveUnits: {},
      polReserveUnits: {},
      mimir: {},
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
      chainsHeight: 'getChainsHeight',
    }),
    thorHeight() {
      return this.chainsHeight?.THOR
    },
    nextPolAsset() {
      return nextPolReserveTarget(
        Object.values(this.thorPools),
        this.mimir,
        this.thorHeight
      )
    },
    poolCycle() {
      return poolCycleProgress(this.thorHeight, this.mimir)
    },
    tableModeItems() {
      const count = (rows) => (this.pools ? ` (${rows.data.length})` : '')
      return [
        {
          text: `Active Pools${count(this.tables.activeRows)}`,
          mode: 'active',
        },
        {
          text: `Staged Pools${count(this.tables.standbyRows)}`,
          mode: 'staged',
        },
      ]
    },
  },
  watch: {
    async period(period) {
      await this.loadOraclePrices()
      this.updatePool(period)
    },
  },
  async mounted() {
    await Promise.all([this.loadOraclePrices(), this.loadModulePositions()])
    this.updatePool(this.period)
  },
  methods: {
    async loadOraclePrices() {
      try {
        const oracleResponse = await this.$api.getOraclePrices()

        if (Array.isArray(oracleResponse.data)) {
          this.oraclePrices = oracleResponse.data
        } else if (oracleResponse.data && Array.isArray(oracleResponse.data.prices)) {
          this.oraclePrices = oracleResponse.data.prices
        } else if (oracleResponse.data && typeof oracleResponse.data === 'object') {
          this.oraclePrices = Object.keys(oracleResponse.data).map(symbol => ({
            symbol: symbol,
            price: oracleResponse.data[symbol]
          }))
        } else {
          this.oraclePrices = []
        }
      } catch (error) {
        this.oraclePrices = []
      }
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

            let usdPrice = 0

            if (p.assetPriceUSD && +p.assetPriceUSD > 0) {
              usdPrice = +p.assetPriceUSD
            }
            else if (p.priceUSD && +p.priceUSD > 0) {
              usdPrice = +p.priceUSD
            }
            else if (p.price && +p.price > 0) {
              usdPrice = +p.price
            }
            else if (p.assetPrice && +p.assetPrice > 0) {
              usdPrice = +p.assetPrice
            }

            const oraclePrice = this.getOraclePriceForAsset(p.asset)
            const oracleDiff = this.calculateOracleDifference(usdPrice, oraclePrice)
            const polReserve = this.moduleShare(
              p.asset,
              this.polReserveUnits[p.asset]
            )
            const reserveShare = this.moduleShare(
              p.asset,
              this.reserveUnits[p.asset]
            )

            return {
              status: p.status,
              price: usdPrice,
              oraclePrice,
              oracleDiff,
              oracleTone: this.oracleTone(oraclePrice, oracleDiff),
              depth: (+p.assetDepth / 10 ** 8) * p.assetPriceUSD,
              apy: p.annualPercentageRate,
              volume: (+p.volume24h / 10 ** 8) * this.runePrice,
              vd: +p.volume24h / (+p.assetDepth * +p.assetPrice),
              feesDepth: this.thorPools[p.asset]
                ? cycleFeesDepth(this.thorPools[p.asset])
                : 0,
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
              polTotal: polReserve.value + reserveShare.value,
              polPositions: [
                { type: 'pol', label: 'POL', ...polReserve },
                { type: 'reserve', label: 'Reserve', ...reserveShare },
              ].filter((position) => position.value > 0),
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
    durationFormat(seconds) {
      return moment.duration(seconds, 'seconds').humanize()
    },
    feesDepthFormat(number) {
      return this.percentageFormat(number, 3)
    },
    curFormat(number) {
      return this.$options.filters.currency(number)
    },
    gotoPoolTable(params) {
      this.gotoPool(params.row.asset)
    },
    // Both module positions are read from THORNode. Midgard's pool `units` is
    // negative on any pool with negative synthUnits (11 of 43 today), which is
    // what made the old Midgard-derived share come out negative.
    async loadModulePositions() {
      let thorPools = []
      const mimirLoad = this.loadMimir()
      try {
        ;({ data: thorPools } = await this.$api.getThorPools())
      } catch (error) {
        console.warn('No thornode pools', error)
      }
      await mimirLoad
      this.thorPools = Object.fromEntries(thorPools.map((p) => [p.asset, p]))
      const [reserveUnits, polReserveUnits] = await Promise.all([
        this.loadReserveUnits(),
        this.loadPolReserveUnits(thorPools),
      ])
      this.reserveUnits = reserveUnits
      this.polReserveUnits = polReserveUnits
    },
    // Only used for POL eligibility (TOR anchors, deposit pauses, ...).
    async loadMimir() {
      try {
        const { data } = await this.$api.getMimir()
        this.mimir = data
      } catch (error) {
        console.warn('No mimir', error)
      }
    },
    // The reserve module keeps its legacy POL positions as a plain LP, and the
    // middleware already merges the THORNode liquidity provider into each row.
    async loadReserveUnits() {
      if (!this.reserveAddress) {
        return {}
      }
      try {
        const { data } = await this.$api.getRunePoolsInfo()
        return Object.fromEntries(data.map((e) => [e.pool, +e.units]))
      } catch (error) {
        console.warn('No runepools', error)
        return {}
      }
    },
    // New style POL is deployed from its own module address, and the pools that
    // hold it are the ones reporting pol_reserve_rune_deposited.
    async loadPolReserveUnits(thorPools) {
      if (!this.polReserveAddress) {
        return {}
      }
      const polAssets = thorPools
        .filter((p) => +p.pol_reserve_rune_deposited > 0)
        .map((p) => p.asset)
      const positions = await Promise.all(
        polAssets.map(async (asset) => {
          try {
            const { data } = await this.$api.getUserLpPosition(
              asset,
              this.polReserveAddress
            )
            return [asset, +data.units]
          } catch (error) {
            return [asset, 0]
          }
        })
      )
      return Object.fromEntries(positions.filter(([, units]) => units > 0))
    },
    // Redeem value is strictly proportional to unit ownership, so the RUNE side
    // is units / pool_units * balance_rune and the whole position is twice that.
    // `depth` only covers the asset side of the pool, so the percentage comes
    // from the unit ownership rather than from value / depth.
    moduleShare(asset, units) {
      const pool = this.thorPools[asset]
      if (!units || !pool || +pool.pool_units <= 0) {
        return { value: 0, share: 0 }
      }
      const share = units / +pool.pool_units
      return {
        value: ((share * +pool.balance_rune * 2) / 1e8) * this.runePrice,
        share,
      }
    },
    getOraclePriceForAsset(asset) {
      if (!this.oraclePrices || this.oraclePrices.length === 0) {
        return null
      }

      const {chain, ticker} = assetFromString(asset)
      const searchPatterns = [ticker, `${chain}.${ticker}`]

      console.log(this.oraclePrices)
      for (const pattern of searchPatterns) {
        const oraclePrice = this.oraclePrices.find(p =>
          p.symbol && p.symbol.toUpperCase() === pattern.toUpperCase()
        )

        if (oraclePrice) {
          const price = parseFloat(oraclePrice.price)
          return price
        }
      }

      return null
    },
    // percentageFormat renders a bare 0 as '-' and never signs a gain, so the
    // drift gets its own formatter.
    oracleDiffFormat(diff) {
      const percent = this.$options.filters.percent(diff, 2)
      return diff > 0 ? `+${percent}` : percent
    },
    // A pool always drifts from the feed a little, so only a wider gap is worth
    // colouring as something to look at.
    oracleTone(oraclePrice, oracleDiff) {
      if (!oraclePrice) {
        return 'none'
      }
      const drift = Math.abs(oracleDiff)
      if (drift < 0.01) {
        return 'ok'
      }
      return drift < 0.03 ? 'warn' : 'bad'
    },
    calculateOracleDifference(usdPrice, oraclePrice) {
      if (!oraclePrice || oraclePrice <= 0 || !usdPrice || usdPrice <= 0) {
        return 0
      }

      const diff = (1 - (usdPrice / oraclePrice))

      return diff
    },
    sepPools(pools) {
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

.balance-row {
  display: flex;
  justify-content: end;
  align-items: center;
  gap: $space-8;
}

.balance-usd {
  color: var(--font-color);
}

.balance-secondary {
  color: var(--font-color);
  font-size: $font-size-sm;
}

.price-cell {
  display: block;
  text-align: right;
}

.price-value {
  color: var(--sec-font-color);
}

.oracle-diff {
  align-items: center;
  color: var(--font-color);
  display: flex;
  font-size: $font-size-sm;
  gap: $space-4;
  justify-content: end;
}

.oracle-dot {
  border-radius: $radius-full;
  background-color: currentColor;
  height: 6px;
  width: 6px;
}

.oracle-ok {
  color: var(--green);
}

.oracle-warn {
  color: var(--warning-color);
}

.oracle-bad {
  color: var(--red);
}

.pol-row {
  display: flex;
  justify-content: end;
  align-items: center;
  gap: $space-8;
  white-space: nowrap;
}

.pol-tag {
  border: 1px solid var(--border-color);
  border-radius: $radius-sm;
  color: var(--font-color);
  font-size: $font-size-xs;
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 0 $space-4;
  text-transform: uppercase;
  white-space: nowrap;
}

.pol-tag-pol {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.next-pol {
  border: 1px solid var(--primary-color);
  border-radius: $radius-sm;
  padding: 0 $space-4;
  cursor: help;
  color: var(--primary-color);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    background-color: var(--primary-color);
    color: var(--bg-color);
  }
}
</style>
