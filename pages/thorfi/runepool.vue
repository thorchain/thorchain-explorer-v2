<template>
  <Page>
    <info-card :grid-settings="gridTest">
      <template #pnl>
        <skeleton-item
          :loading="!pnl.value"
          :style="{
            color: pnl.isDown ? 'red' : 'green',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }"
        >
          <span v-if="pnl.isDown">-</span>
          <span v-if="!pnl.isDown">+</span>
          {{ pnl.value | number('0,0.00') }}
          <small>RUNE</small>
          <progress-icon
            v-if="oldRunePool.pol"
            :data-number="
              normalFormat((polOverview.pnl - oldRunePool.pol.pnl) / 1e8)
            "
            :is-down="+polOverview.pnl < +oldRunePool.pol.pnl"
          >
          </progress-icon>
        </skeleton-item>
      </template>
    </info-card>

    <Card
      :navs="[
        { title: 'Rune Pools', value: 'rune-pools' },
        { title: 'Mimirs', value: 'mimirs' },
        { title: 'Members', value: 'members' },
      ]"
      :act-nav.sync="cardMode"
    >
      <stat-table
        v-if="cardMode === 'mimirs'"
        :key="1"
        :table-settings="polMimirSettings"
      />

      <vue-good-table
        v-else-if="cardMode === 'rune-pools'"
        :key="2"
        :columns="cols"
        :rows="lps"
        style-class="vgt-table net-table"
      >
        <template slot="table-row" slot-scope="props">
          <div v-if="props.column.field == 'pool'" class="asset-cell">
            <AssetIcon :asset="props.row.pool" />
            <span class="ellipsis">
              {{ props.row.pool }}
            </span>
            <div
              v-if="props.row.label"
              class="bubble-container"
              style="margin-left: 10px"
            >
              {{ props.row.label }}
            </div>
          </div>
          <div v-else-if="props.column.field == 'luvi'">
            <progress-icon
              :data-number="props.row.luvi"
              :filter="$options.filters.percent"
              :is-down="+props.row.luvi < 0"
            ></progress-icon>
          </div>
          <span
            v-else-if="props.column.field.startsWith('pool')"
            class="pool-cell ellipsis"
          >
            <span v-if="props.row[props.column.field][0]">
              {{ props.row[props.column.field][0] | number('0,0.00') }}
              <small>RUNE</small>
            </span>
            <span v-if="props.row[props.column.field][1]" class="ellipsis">
              {{
                props.row[props.column.field][1] ||
                props.row[props.column.field][1] === 0
                  ? $options.filters.number(
                      props.row[props.column.field][1],
                      '0,0.000000'
                    )
                  : '-'
              }}
              <small class="ellipsis">{{ props.row.pool }}</small>
            </span>
            <span v-else-if="!props.row[props.column.field][0]">-</span>
          </span>
          <span v-else-if="props.column.field == 'share'">
            <span v-if="props.row.share">{{
              percentageFormat(props.row.share, 4)
            }}</span>
            <span v-else>-</span>
          </span>
        </template>
      </vue-good-table>

      <vue-good-table
        v-else-if="cardMode === 'members'"
        :key="3"
        :columns="memberCols"
        :rows="members"
        style-class="vgt-table net-table"
        :pagination-options="{
          enabled: true,
          perPage: 10,
          perPageDropdownEnabled: false,
        }"
      >
        <template slot="table-row" slot-scope="props">
          <NuxtLink
            v-if="props.column.field == 'rune_address'"
            class="clickable"
            :to="{ path: `/address/${props.row.rune_address}` }"
          >
            {{ props.formattedRow[props.column.field] }}
          </NuxtLink>
          <span v-else-if="props.column.field == 'deposit_amount'">
            {{ $options.filters.number(props.row.deposit_amount, '0,0.00') }}
            <small>RUNE</small>
          </span>
          <span v-else-if="props.column.field == 'value'">
            {{ $options.filters.number(props.row.value, '0,0.00') }}
            <small>RUNE</small>
            <progress-icon
              v-if="props.row.value"
              :data-number="props.row.pnl"
              :is-down="+props.row.pnl < 0"
              :filter="
                (value) => {
                  return $options.filters.number(value, '0,0.00')
                }
              "
            />
          </span>
          <span v-else-if="props.column.field == 'untilMature'">
            <span
              :class="[
                { 'not-mature': !props.row.mature, mature: props.row.mature },
              ]"
              >{{ +height.THOR - +props.row.last_deposit_height }}/<small
                >{{ +props.row.matureConstant }}
              </small>
            </span>
            <small
              >({{
                +props.row.untilMature && props.row.untilMature.toFixed(2)
              }})</small
            >
          </span>
          <span v-else-if="props.column.field == 'last_deposit_height'">
            {{ props.formattedRow[props.column.field] }}
            <small v-if="props.row.lastTimeDeposit">
              ({{ props.row.lastTimeDeposit }})
            </small>
          </span>
          <span v-else>
            {{ props.formattedRow[props.column.field] }}
          </span>
        </template>
      </vue-good-table>
    </Card>
    <div class="footer-stat">
      <small>
        <sup>*</sup>
        All of the stat changes are based on 24 hours period
      </small>
    </div>
  </Page>
</template>

<script>
import { isInteger } from 'lodash'
import moment from 'moment'
import { mapGetters } from 'vuex'
import endpoints from '~/api/endpoints'

export default {
  data() {
    return {
      reserveAddress: endpoints[process.env.NETWORK].MODULE_ADDR,
      polOverview: undefined,
      reserveOverview: undefined,
      providersOverview: undefined,
      networkConst: undefined,
      mimir: undefined,
      cardMode: 'rune-pools',
      gridTest: undefined,
      pools: [],
      lps: [],
      oldRunePool: [],
      members: [],
      cols: [
        {
          label: 'Pool',
          field: 'pool',
          formatFn: this.formatAsset,
        },
        {
          label: 'Liquidity Share',
          field: 'share',
          type: 'number',
          tdClass: 'mono',
          tooltip: 'The liquidity share of the pool that POL participated in',
        },
        {
          label: 'POL Weight',
          field: 'polWeight',
          type: 'percentage',
          tdClass: 'mono',
          tooltip: 'The total share of the POL in the pool',
        },
        {
          label: 'Rune/Asset Share',
          field: 'poolShare',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono',
        },
        {
          label: 'Rune Added',
          field: 'poolAdded',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono',
        },
        {
          label: 'Rune Withdrawn',
          field: 'poolWithdrawn',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono',
        },
        {
          label: 'LUVI Growth',
          field: 'luvi',
          type: 'percentage',
          tdClass: 'mono',
        },
        {
          label: 'First Added',
          field: 'dateFirstAdded',
          formatFn: this.formatTimeNow,
          sortFn: this.formatTimeSort,
          type: 'text',
        },
      ],
      memberCols: [
        {
          label: 'Address',
          field: 'rune_address',
          type: 'text',
          tdClass: 'mono',
          formatFn: this.formatAddress,
        },
        {
          label: 'Current Deposit',
          field: 'deposit_amount',
          type: 'number',
          tdClass: 'mono',
        },
        {
          label: 'Current Value',
          field: 'value',
          type: 'number',
          tdClass: 'mono',
        },
        {
          label: 'Mature',
          field: 'untilMature',
          type: 'number',
          tdClass: 'mono',
          tooltip:
            'The blocks passed from last deposit to the maturity block.\nThe remaining days for the deposit to be mature.',
        },
        {
          label: 'Provider Share',
          field: 'share',
          type: 'percentage',
          tdClass: 'mono',
        },
        {
          label: 'Lat Deposit Block',
          field: 'last_deposit_height',
          type: 'number',
          formatFn: this.normalFormat,
          tdClass: 'mono',
        },
      ],
    }
  },
  computed: {
    ...mapGetters({
      height: 'getChainsHeight',
    }),
    tab() {
      return this.$route.query.tab
    },
    pnl() {
      const pnl = +this.polOverview?.value - +this.polOverview?.current_deposit

      return {
        value: Math.abs(pnl) / 1e8,
        name: 'Current RUNE PnL',
        isDown: pnl <= 0,
      }
    },
    reservepnl() {
      const pnl =
        +this.reserveOverview?.value - +this.reserveOverview?.current_deposit
      return {
        value: Math.abs(pnl) / 1e8,
        name: 'Current RUNE PnL',
        isDown: pnl <= 0,
      }
    },
    providerspnl() {
      const pnl = this.providersOverview?.pnl
      return {
        value: Math.abs(pnl) / 1e8,
        name: 'Current RUNE PnL',
        isDown: pnl <= 0,
      }
    },
    polSettings() {
      return [
        [
          {
            name: 'Current PnL',
            slotName: 'pnl',
          },
          {
            name: 'Current Deposited',
            value: this.polOverview?.current_deposit / 1e8,
            filter: true,
            runeValue: true,
            progress: {
              data:
                (this.polOverview?.current_deposit -
                  (this.oldRunePool?.pol?.current_deposit ?? 0)) /
                1e8,
              down:
                this.polOverview?.current_deposit <
                (this.oldRunePool?.pol?.current_deposit ?? 0),
              filter: (v) => this.$options.filters.number(v, '0,0'),
            },
          },
        ],
        [
          {
            name: 'Overall Deposited',
            value: this.polOverview?.rune_deposited / 1e8,
            filter: true,
            runeValue: true,
            progress: {
              data:
                (this.polOverview?.rune_deposited -
                  (this.oldRunePool?.pol?.rune_deposited ?? 0)) /
                1e8,
              down:
                this.polOverview?.rune_deposited <
                (this.oldRunePool?.pol?.rune_deposited ?? 0),
              filter: (v) => this.$options.filters.number(v, '0,0'),
            },
          },
          {
            name: 'Overall Withdrawn',
            value: this.polOverview?.rune_withdrawn / 1e8,
            filter: true,
            runeValue: true,
            progress: {
              data:
                (this.polOverview?.rune_withdrawn -
                  (this.oldRunePool?.pol?.rune_withdrawn ?? 0)) /
                1e8,
              down:
                this.polOverview?.rune_withdrawn <
                (this.oldRunePool?.pol?.rune_withdrawn ?? 0),
              filter: (v) => this.$options.filters.number(v, '0,0'),
            },
          },
        ],
      ]
    },
    reserveSettings() {
      return [
        [
          {
            name: 'Current PnL',
            slotName: 'reservepnl',
          },
          {
            name: 'Current Deposit',
            value: this.reserveOverview?.current_deposit / 1e8,
            filter: true,
            runeValue: true,
            progress: {
              data:
                (this.reserveOverview?.current_deposit -
                  (this.oldRunePool?.reserve?.current_deposit ?? 0)) /
                1e8,
              down:
                this.reserveOverview?.current_deposit <
                (this.oldRunePool?.reserve?.current_deposit ?? 0),
              filter: (v) => this.$options.filters.number(v, '0,0'),
            },
          },
        ],
        [
          {
            name: 'Reserve Units',
            value: this.reserveOverview?.units,
          },
        ],
        [
          {
            name: 'Reserve Share',
            value:
              +this.reserveOverview?.value &&
              this.$options.filters.percent(
                +this.reserveOverview?.value / +this.polOverview?.value,
                3
              ),
            filter: true,
            progress: {
              data:
                this.reserveOverview?.value / +this.polOverview?.value -
                (this.oldRunePool?.reserve?.value /
                  this.oldRunePool?.pol?.value ?? 0),
              down:
                this.reserveOverview?.value / +this.polOverview?.value <
                (this.oldRunePool?.reserve?.value /
                  this.oldRunePool?.pol?.value ?? 0),
              filter: this.$options.filters.percent,
            },
          },
        ],
      ]
    },
    providersSettings() {
      return [
        [
          {
            name: 'Current PnL',
            slotName: 'providerspnl',
          },
          {
            name: 'Current Deposit',
            value: this.providersOverview?.current_deposit / 1e8,
            filter: true,
            runeValue: true,
            progress: {
              data:
                (this.providersOverview?.current_deposit -
                  (this.oldRunePool?.providers?.current_deposit ?? 0)) /
                1e8,
              down:
                this.providersOverview?.current_deposit <
                (this.oldRunePool?.providers?.current_deposit ?? 0),
              filter: (v) => this.$options.filters.number(v, '0,0'),
            },
          },
        ],
        [
          {
            name: 'Pending Rune / Units',
            value: `${this.$options.filters.number(this.providersOverview?.pending_rune / 1e8, '0,0 a')} RUNE (${this.$options.filters.number(this.providersOverview?.pending_units, '0,0 a')})`,
            filter: true,
            extraInfo:
              'The Rune / Units of RUNEPool owned by providers that remain pending',
            is: !isInteger(+this.providersOverview?.pending_rune),
          },
          {
            name: 'Providers Units',
            value: this.providersOverview?.units,
            extraInfo:
              'The units of RUNEPool owned by providers (including pending)',
          },
        ],
        [
          {
            name: 'Provider Share',
            value:
              +this.providersOverview?.value &&
              this.$options.filters.percent(
                +this.providersOverview?.value / +this.polOverview?.value,
                3
              ),
            filter: true,
            progress: {
              data:
                this.providersOverview?.value / +this.polOverview?.value -
                (this.oldRunePool?.providers?.value /
                  this.oldRunePool?.pol?.value ?? 0),
              down:
                this.providersOverview?.value / +this.polOverview?.value <
                (this.oldRunePool?.providers?.value /
                  this.oldRunePool?.pol?.value ?? 0),
              filter: this.$options.filters.percent,
            },
          },
        ],
      ]
    },
    polMimirSettings() {
      if (!this.mimir) {
        return []
      }

      const synthTargetPerPool = this.mimir?.POLTARGETSYNTHPERPOOLDEPTH / 1e4
      const polBuffer = this.mimir?.POLBUFFER / 1e4
      const PolMaxPoolMovement = this.mimir?.POLMAXPOOLMOVEMENT / 1e4

      return [
        [
          {
            ...this.parseConstant('MaxSynthPerPoolDepth', {
              filter: (v) => this.$options.filters.percent(v / 1e4, 2),
            }),
            name: 'Max Synth Utilisation per Pool',
            filter: true,
          },
          {
            ...this.parseConstant('POLTargetSynthPerPoolDepth', {
              filter: (v) => this.$options.filters.percent(v / 1e4, 2),
            }),
            name: 'POL Target Synth per Pool Depth',
            filter: true,
            extraInfo: `POL will continue adding RUNE to a pool until the synth depth of that pool is ${this.$options.filters.percent(synthTargetPerPool, 2)}`,
          },
        ],
        [
          {
            ...this.parseConstant('POLBuffer', {
              filter: (v) => this.$options.filters.percent(v / 1e4, 2),
            }),
            name: 'POL Buffer',
            filter: true,
            extraInfo: `Synth utilization must be >${polBuffer * 100}% from the target synth per pool depth in order to add liquidity / remove liquidity. In this context, liquidity will be withdrawn below ${(synthTargetPerPool - polBuffer) * 100}% synth utilization and deposited above ${(synthTargetPerPool + polBuffer) * 100}% synth utilization.`,
          },
          {
            ...this.parseConstant('POLMaxPoolMovement', {
              filter: (v) => this.$options.filters.percent(v / 1e7, 4),
            }),
            name: 'POL Max Pool Movement',
            filter: true,
            extraInfo: `POL will move the pool price at most ${PolMaxPoolMovement / 10}% in one block.`,
          },
          {
            ...this.parseConstant('POLMaxNetworkDeposit', {
              filter: (v) => v / 1e8,
            }),
            name: 'POL Max Network Deposit',
            filter: true,
            runeValue: true,
          },
        ],
        [
          {
            name: 'Enable POL on BTC',
            value: this.mimir['POL-BTC-BTC'] ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'Enable POL on ETH',
            value: this.mimir['POL-ETH-ETH'] ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'Enable POL on AVAX',
            value: this.mimir['POL-AVAX-AVAX'] ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'Enable POL on AVAX.USDC',
            value: this.mimir[
              'POL-AVAX-USDC-0XB97EF9EF8734C71904D8002F8B6BC66DD9C48A6E'
            ]
              ? 'Yes'
              : 'No',
            filter: true,
          },
        ],
        [
          {
            name: 'Enable POL on BCH',
            value: this.mimir['POL-BCH-BCH'] ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'Enable POL on BSC.BNB',
            value: this.mimir['POL-BSC-BNB'] ? 'Yes' : 'No',
            filter: true,
          },
          {
            name: 'Enable POL on DOGE',
            value: this.mimir['POL-DOGE-DOGE'] ? 'Yes' : 'No',
            filter: true,
          },
        ],
      ]
    },
  },
  watch: {
    cardMode(n, o) {
      if (n !== o) {
        this.$router.replace({ path: '/thorfi/runepool', query: { tab: n } })
      }
    },
    height() {
      this.updateRunePool()
    },
  },
  mounted() {
    if (this.tab) {
      this.cardMode = this.tab
    } else {
      this.$router.replace({
        path: '/thorfi/runepool',
        query: { tab: 'rune-pools' },
      })
    }
  },
  methods: {
    createStatsData(pol, providers, reserve, oldRunepool) {
      const ret = [
        {
          title: 'Protocol Owned Liquidity',
          rowStart: 1,
          colStart: 1,
          colSpan: 4,
          items: [
            {
              name: 'Current PnL',
              slotName: 'pnl',
            },
            {
              name: 'Current Deposited',
              value: pol?.current_deposit / 1e8,
              filter: (v) => this.$options.filters.number(v, '0,0.00'),
              progress: {
                data:
                  (pol?.current_deposit -
                    (oldRunepool?.pol?.current_deposit ?? 0)) /
                  1e8,
                down:
                  pol?.current_deposit <
                  (oldRunepool?.pol?.current_deposit ?? 0),
                filter: (v) => this.$options.filters.number(v, '0,0'),
              },
            },
            {
              name: 'Overall Deposited',
              value: this.polOverview?.rune_deposited / 1e8,
              filter: (v) => this.$options.filters.number(v, '0,0.00'),
              progress: {
                data:
                  (this.polOverview?.rune_deposited -
                    (this.oldRunePool?.pol?.rune_deposited ?? 0)) /
                  1e8,
                down:
                  this.polOverview?.rune_deposited <
                  (this.oldRunePool?.pol?.rune_deposited ?? 0),
                filter: (v) => this.$options.filters.number(v, '0,0'),
              },
            },
            {
              name: 'Overall Withdrawn',
              value: this.polOverview?.rune_withdrawn / 1e8,
              filter: (v) => this.$options.filters.number(v, '0,0.00'),
              progress: {
                data:
                  (this.polOverview?.rune_withdrawn -
                    (this.oldRunePool?.pol?.rune_withdrawn ?? 0)) /
                  1e8,
                down:
                  this.polOverview?.rune_withdrawn <
                  (this.oldRunePool?.pol?.rune_withdrawn ?? 0),
                filter: (v) => this.$options.filters.number(v, '0,0'),
              },
            },
          ],
        },
        {
          title: 'Providers',
          rowStart: 2,
          colStart: 1,
          colSpan: 2,
          items: [
            {
              name: 'Current PnL',
              slotName: 'pnl',
            },
            {
              name: 'Current Deposited',
              value: providers?.current_deposit / 1e8,
              filter: (v) => this.$options.filters.number(v, '0,0.00'),
              progress: {
                data:
                  (providers?.current_deposit -
                    (oldRunepool?.providers?.current_deposit ?? 0)) /
                  1e8,
                down:
                  providers?.current_deposit <
                  (oldRunepool?.providers?.current_deposit ?? 0),
                filter: (v) => this.$options.filters.number(v, '0,0'),
              },
            },
            {
              name: 'Providers Units',
              value: providers?.units,
              filter: (v) => this.$options.filters.number(v, '0,0'),
              extraInfo:
                'The units of RUNEPool owned by providers (including pending)',
            },
            {
              name: 'Provider Share',
              value: +providers?.value / +this.polOverview?.value,
              filter: (v) => this.$options.filters.percent(v, 3),
              progress: {
                data:
                  providers?.value / +this.polOverview?.value -
                  (this.oldRunePool?.providers?.value /
                    this.oldRunePool?.pol?.value ?? 0),
                down:
                  providers?.value / +this.polOverview?.value <
                  (this.oldRunePool?.providers?.value /
                    this.oldRunePool?.pol?.value ?? 0),
                filter: (v) => this.$options.filters.percent(v, 3),
              },
            },
          ],
        },
        {
          title: 'Reserve',
          rowStart: 2,
          colStart: 3,
          colSpan: 2,
          items: [
            {
              name: 'Current PnL',
              slotName: 'pnl',
            },
            {
              name: 'Current Deposited',
              value: reserve?.current_deposit / 1e8,
              filter: (v) => this.$options.filters.number(v, '0,0.00'),
              progress: {
                data:
                  (reserve?.current_deposit -
                    (oldRunepool?.reserve?.current_deposit ?? 0)) /
                  1e8,
                down:
                  reserve?.current_deposit <
                  (oldRunepool?.reserve?.current_deposit ?? 0),
                filter: (v) => this.$options.filters.number(v, '0,0'),
              },
            },
            {
              name: 'Reserve Units',
              value: reserve?.units,
              filter: (v) => this.$options.filters.number(v, '0,0'),
            },
            {
              name: 'Reserve Share',
              value: +reserve?.value / +pol?.value,
              filter: (v) => this.$options.filters.percent(v, 2),
              progress: {
                data:
                  reserve?.value / +pol?.value -
                  (oldRunepool?.reserve?.value / oldRunepool?.pol?.value ?? 0),
                down:
                  reserve?.value / +pol?.value <
                  (oldRunepool?.reserve?.value / oldRunepool?.pol?.value ?? 0),
                filter: (v) => this.$options.filters.percent(v, 3),
              },
            },
          ],
        },
      ]
      return ret
    },
    async updateRunePool() {
      try {
        ;({ data: this.lps } = await this.$api.getRunePoolsInfo())
      } catch (error) {
        console.error('member not found', error)
      }

      try {
        ;({
          pol: this.polOverview,
          providers: this.providersOverview,
          reserve: this.reserveOverview,
        } = (await this.$api.getRunePool()).data)
        ;({ data: this.oldRunePool } = await this.$api.getOldRunePools())

        this.gridTest = this.createStatsData(
          this.polOverview,
          this.providersOverview,
          this.reserveOverview,
          this.oldRunePool
        )

        this.lps = this.lps.map((e) => ({
          ...e,
          polWeight:
            (+e.rune_deposit_value * 2) / +this.polOverview?.current_deposit,
        }))

        this.$api.getMimir().then(({ data }) => {
          this.mimir = data
        })

        let matureConstant = 1296000
        this.networkConst = (await this.$api.getConstants()).data
        matureConstant = this.parseConstant(
          'RUNEPoolDepositMaturityBlocks'
        ).value

        const { data: membersData } = await this.$api.getRunePoolProviders()
        this.members = membersData.map((e) => ({
          ...e,
          deposit_amount: (+e.deposit_amount - +e.withdraw_amount) / 1e8,
          pnl: +e.pnl / 1e8,
          value: +e.value / 1e8,
          mature: +this.height.THOR - +e.last_deposit_height > matureConstant,
          matureConstant,
          share: +e.units / +this.providersOverview?.units,
          lastTimeDeposit: moment
            .duration((+this.height.THOR - +e.last_deposit_height) * 6, 's')
            .humanize(),
          untilMature: moment
            .duration(
              (+this.height.THOR - +e.last_deposit_height - matureConstant) * 6,
              's'
            )
            .asDays(),
        }))
      } catch (error) {
        console.error(error)
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.asset-cell {
  max-width: 200px;
  display: flex;
  align-items: center;

  span {
    display: block;
    font-size: 0.9rem;
  }
}

.pool-cell {
  span {
    display: block;
    max-width: 200px;
  }
}

.vgt-right-align .pool-cell span {
  margin-left: auto;
}

.pol-actors {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  grid-template-rows: auto;
  gap: 8px;
}

.mature {
  color: var(--primary-color);
}

.not-mature {
  color: #f04832;
}
</style>
