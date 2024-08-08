<template>
  <Page>
    <info-card :options="infoCardData">
      <template #pnl="{ item }">
        <skeleton-item
          :loading="!item.value"
          :style="{
            color: item.isDown ? 'red' : 'green',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }"
        >
          {{ runeCur() }}<span v-if="!item.isDown">+</span>
          {{ item.filter(item.value) }}
          <progress-icon
            v-if="item.progress"
            :data-number="item.progress.data"
            :filter="item.progress.filter"
            :is-down="item.progress.down"
          />
        </skeleton-item>
      </template>
    </info-card>

    <card>
      <div class="runepool-cap">
        <div>
          <span>RUNEPool Cap</span>
          <unknown-icon
            v-tooltip="
              `This is the overall RUNE Pool deposited by reserve and providers. It isn't related to providers cap.`
            "
          ></unknown-icon>
        </div>
        <skeleton-item
          :loading="!runepoolCap"
          :custom-class="['runepool-cap-loader']"
        >
          <span v-if="runepoolCap">
            {{ runeCur() }}{{ runepoolCap.current | number('0,0.00a') }} /
            <small
              >{{ runeCur() }}{{ runepoolCap.max | number('0,0.00a') }}</small
            >
          </span>
        </skeleton-item>
      </div>
      <skeleton-item :loading="!runepoolCap">
        <dist-chart
          v-if="runepoolCap"
          :options="runepoolCap.bars"
          height="7px"
        />
      </skeleton-item>
    </card>

    <Card
      :navs="[
        { title: 'Rune Pools', value: 'rune-pools' },
        { title: 'Mimirs', value: 'mimirs' },
        { title: 'Members', value: 'members' },
      ]"
      :act-nav.sync="cardMode"
    >
      <template #header>
        <RefreshIcon
          class="refresh-icon"
          :class="{ spinning: isUpdating }"
          @click="updateRunePool"
        />
      </template>

      <info-card
        v-if="cardMode === 'mimirs'"
        :key="1"
        :inner="true"
        :options="polMimirSettings"
      >
        <template #name="{ item }">
          <asset-icon :asset="item.name" style="margin-bottom: 0.5rem" />
        </template>
        <template #asset="{ item }">
          <div :class="['mini-bubble', { danger: item.value == 'No' }]">
            {{ item.value }}
          </div>
        </template>
      </info-card>

      <vue-good-table
        v-else-if="cardMode === 'rune-pools'"
        :key="2"
        :columns="RunePoolsCols"
        :rows="runePoolsRows"
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
import moment from 'moment'
import { mapGetters } from 'vuex'
import endpoints from '~/api/endpoints'
import RefreshIcon from '~/assets/images/refresh.svg?inline'

export default {
  components: { RefreshIcon },

  data() {
    return {
      loading: false,
      isUpdating: false,
      reserveAddress: endpoints[process.env.NETWORK].MODULE_ADDR,
      polOverview: undefined,
      reserveOverview: undefined,
      providersOverview: undefined,
      networkConst: undefined,
      mimir: undefined,
      cardMode: 'rune-pools',
      pools: [],
      runePoolsRows: [],
      oldRunePool: [],
      providersInfo: [],
      oldProvidersInfo: [],
      members: [],
      infoCardData: [
        {
          title: 'Protocol Owned Liquidity',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Current PnL',
              valueSlot: 'pnl',
            },
            {
              name: 'Current Deposited',
            },
            {
              name: 'Overall Deposited',
            },
            {
              name: 'Overall Withdrawn',
            },
          ],
        },
        {
          title: 'Providers',
          rowStart: 2,
          colSpan: 1,
          items: [
            {
              name: 'Current PnL',
              valueSlot: 'pnl',
            },
            {
              name: 'Current Deposited',
            },
            {
              name: 'Providers Units',
            },
            {
              name: 'Provider Share',
            },
            {
              name: 'Provider Count',
            },
          ],
        },
        {
          title: 'Reserve',
          rowStart: 2,
          colSpan: 1,
          items: [
            {
              name: 'Current PnL',
              valueSlot: 'pnl',
            },
            {
              name: 'Current Deposited',
            },
            {
              name: 'Reserve Units',
            },
            {
              name: 'Reserve Share',
            },
          ],
        },
      ],
      RunePoolsCols: [
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
          label: 'Last Added',
          field: 'dateLastAdded',
          formatFn: this.formatTimeNow,
          sortFn: this.formatTimeSort,
          type: 'text',
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
    polMimirSettings() {
      if (!this.mimir) {
        return []
      }

      const synthTargetPerPool = this.mimir?.POLTARGETSYNTHPERPOOLDEPTH / 1e4
      const polBuffer = this.mimir?.POLBUFFER / 1e4
      const PolMaxPoolMovement = this.mimir?.POLMAXPOOLMOVEMENT / 1e4

      const polItems = []
      for (const key in this.mimir) {
        if (key.startsWith('POL-')) {
          const asset = key.slice(4).replace('-', '.')
          polItems.push({
            name: asset,
            value: this.mimir[key] ? 'Yes' : 'No',
            valueSlot: 'asset',
            nameSlot: true,
          })
        }
      }

      return [
        {
          title: 'Settings',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              ...this.parseConstant('POLMaxNetworkDeposit'),
              name: 'RUNEPool Max Network Deposit',
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v / 1e8, '0,0')}`,
            },
            {
              ...this.parseConstant('MINRUNEPOOLDEPTH'),
              name: 'Min RUNEPool depth',
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v / 1e8, '0,0')}`,
            },
            {
              ...this.parseConstant('MaxSynthPerPoolDepth', {
                filter: (v) => this.$options.filters.percent(v / 1e4, 2),
              }),
              name: 'Max Synth Utilisation per Pool',
            },
            {
              ...this.parseConstant('POLTargetSynthPerPoolDepth', {
                filter: (v) => this.$options.filters.percent(v / 1e4, 2),
              }),
              name: 'RUNEPool Target Synth per Pool Depth',
              extraInfo: `RUNEPool will continue adding RUNE to a pool until the synth depth of that pool is ${this.$options.filters.percent(synthTargetPerPool, 2)}`,
            },
            {
              ...this.parseConstant('POLBuffer', {
                filter: (v) => this.$options.filters.percent(v / 1e4, 2),
              }),
              name: 'RUNEPool Buffer',
              extraInfo: `Synth utilization must be >${polBuffer * 100}% from the target synth per pool depth in order to add liquidity / remove liquidity. In this context, liquidity will be withdrawn below ${(synthTargetPerPool - polBuffer) * 100}% synth utilization and deposited above ${(synthTargetPerPool + polBuffer) * 100}% synth utilization.`,
            },
            {
              ...this.parseConstant('POLMaxPoolMovement', {
                filter: (v) => this.$options.filters.percent(v / 1e7, 4),
              }),
              name: 'RUNEPool Max Pool Movement',
              extraInfo: `RUNEPool will move the pool price at most ${PolMaxPoolMovement / 10}% in one block.`,
            },
          ],
        },
        {
          title: 'RUNE Pools Enabled',
          rowStart: 1,
          colSpan: 1,
          cluster: true,
          items: polItems,
        },
      ]
    },
    runepoolCap() {
      if (
        !this.polOverview ||
        !this.mimir ||
        !this.networkConst ||
        !this.networkConst?.int_64_values
      ) {
        return
      }

      const ret = {
        current: +this.polOverview.current_deposit / 1e8,
        max: this.parseConstant('POLMaxNetworkDeposit').value / 1e8,
      }

      const bars = [
        {
          name: 'Providers',
          value: +this.providersOverview.current_deposit / 1e8,
        },
        {
          name: 'Reserve',
          value: +this.reserveOverview.current_deposit / 1e8,
        },
      ]

      if (
        +this.polOverview.current_deposit <
        this.parseConstant('POLMaxNetworkDeposit').value
      ) {
        bars.push({
          name: 'Remaining Cap',
          value:
            (+this.polOverview.current_deposit -
              this.parseConstant('POLMaxNetworkDeposit').value) /
            1e8,
          color: 'var(--border-color)',
        })
      }

      return {
        ...ret,
        bars,
      }
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
    this.updateRunePool()
  },
  methods: {
    createStatsData(pol, providers, reserve, oldRunePool) {
      const ret = [
        {
          title: 'RUNEPool *',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Current PnL',
              valueSlot: 'pnl',
              value: pol.value - +pol.current_deposit,
              isDown: pol.value - +pol.current_deposit <= 0,
              filter: (v) => this.$options.filters.number(v / 1e8, '0,0.00'),
              progress: {
                data: (pol?.value - (oldRunePool?.pol?.value ?? 0)) / 1e8,
                down: pol?.value < (oldRunePool?.pol?.value ?? 0),
                filter: (v) => this.$options.filters.number(v, '0,0.00'),
              },
            },
            {
              name: 'Current Deposited',
              value: pol?.current_deposit / 1e8,
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,0.00')}`,
              progress: {
                data:
                  (pol?.current_deposit -
                    (oldRunePool?.pol?.current_deposit ?? 0)) /
                  1e8,
                down:
                  pol?.current_deposit <
                  (oldRunePool?.pol?.current_deposit ?? 0),
                filter: (v) => this.$options.filters.number(v, '0,0'),
              },
            },
            {
              name: 'Overall Deposited',
              value: this.polOverview?.rune_deposited / 1e8,
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,0.00')}`,
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
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,0.00')}`,
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
          title: 'Providers *',
          rowStart: 2,
          colSpan: 1,
          items: [
            {
              name: 'Current PnL',
              valueSlot: 'pnl',
              value: providers.pnl,
              isDown: +providers.pnl <= 0,
              filter: (v) => this.$options.filters.number(v / 1e8, '0,0.00'),
              progress: {
                data: (providers?.pnl - oldRunePool?.providers?.pnl) / 1e8,
                down: +providers?.pnl < +oldRunePool?.providers?.pnl,
                filter: (v) => this.$options.filters.number(v, '0,0.00'),
              },
            },
            {
              name: 'Current Deposited',
              value:
                (+providers?.current_deposit + +providers?.pending_rune) / 1e8,
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,0.00')}`,
              extraInfo:
                'The amount rune deposited by providers (including pending)',
              progress: {
                data:
                  +providers?.current_deposit +
                  +providers?.pending_rune -
                  (+oldRunePool?.providers?.current_deposit +
                    +oldRunePool?.providers?.pending_rune),
                down:
                  +providers?.current_deposit <
                  (+oldRunePool?.providers?.current_deposit ?? 0),
                filter: (v) => this.$options.filters.number(v / 1e8, '0,0'),
              },
            },
            {
              name: 'Providers Units',
              value: providers?.units + providers?.pending_units,
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
            {
              name: 'Providers Count',
              value: this.providersInfo?.count,
              filter: (v) => this.$options.filters.number(v, '0,0'),
              progress: {
                data:
                  this.providersInfo?.count -
                  (this.oldProvidersInfo?.count ?? 0),
                down:
                  this.providersInfo?.count <
                  (this.oldProvidersInfo?.count ?? 0),
                filter: (v) => this.$options.filters.number(v, '0,0'),
              },
            },
          ],
        },
        {
          title: 'Reserve *',
          rowStart: 2,
          colSpan: 1,
          items: [
            {
              name: 'Current PnL',
              valueSlot: 'pnl',
              value: reserve.pnl,
              isDown: +reserve.pnl <= 0,
              filter: (v) => this.$options.filters.number(v / 1e8, '0,0.00'),
              progress: {
                data: (reserve?.pnl - oldRunePool?.reserve?.pnl) / 1e8,
                down: +reserve?.pnl < +oldRunePool?.reserve?.pnl,
                filter: (v) => this.$options.filters.number(v, '0,0.00'),
              },
            },
            {
              name: 'Current Deposited',
              value: reserve?.current_deposit / 1e8,
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,0.00')}`,
              progress: {
                data:
                  (reserve?.current_deposit -
                    (oldRunePool?.reserve?.current_deposit ?? 0)) /
                  1e8,
                down:
                  reserve?.current_deposit <
                  (oldRunePool?.reserve?.current_deposit ?? 0),
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
                  (oldRunePool?.reserve?.value / oldRunePool?.pol?.value ?? 0),
                down:
                  reserve?.value / +pol?.value <
                  (oldRunePool?.reserve?.value / oldRunePool?.pol?.value ?? 0),
                filter: (v) => this.$options.filters.percent(v, 3),
              },
            },
          ],
        },
      ]
      return ret
    },
    async updateRunePool() {
      this.isUpdating = true
      try {
        ;({ data: this.runePoolsRows } = await this.$api.getRunePoolsInfo())
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
        ;({ data: this.providersInfo } =
          await this.$api.getRunePoolProvidersInfo())
        ;({ data: this.oldProvidersInfo } =
          await this.$api.getOldRunePoolProvidersInfo())

        this.infoCardData = this.createStatsData(
          this.polOverview,
          this.providersOverview,
          this.reserveOverview,
          this.oldRunePool
        )

        this.runePoolsRows = this.runePoolsRows.map((e) => ({
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
        this.isUpdating = false
      } catch (error) {
        console.error(error)
      }
    },
  },
  head: {
    title: 'THORChain Network Explorer | RUNEPool',
  },
}
</script>

<style lang="scss" scoped>
.refresh-icon {
  width: 24px;
  height: 24px;
  transition: transform 0.5s ease-in-out;
  cursor: pointer;
  fill: var(--font-color);
}

.spinning {
  fill: var(--primary-color);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
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

.runepool-cap {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;

  span {
    color: var(--sec-font-color);

    small {
      color: var(--font-color);
    }
  }
}

.runepool-cap-loader {
  width: 200px !important;
}
</style>
