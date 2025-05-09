<template>
  <page>
    <div class="tcy-card">
      <card
        title="TCY Overview"
        :img-src="require('@/assets/images/network.svg')"
      >
        <info-card :options="infoCardData" :inner="true"> </info-card>
      </card>
      <card
        title="Allocation & Earnings"
        :img-src="require('@/assets/images/allocations.svg')"
      >
        <pie-chart
          :pie-data="allocationPie"
          :extra-series="extraSeries"
          :extra="extra"
        />
        <VChart
          class="tcy-chart"
          :option="earningsHistory"
          :loading="!earningsHistory"
          :loading-options="showLoading"
          :theme="chartTheme"
          :autoresize="true"
        />
      </card>
    </div>
    <div class="tcy-card">
      <card
        title="TCY Unclaimed asset distribution"
        :img-src="require('@/assets/images/asset.svg')"
      >
        <vue-good-table
          v-if="tcyInfo"
          style-class="vgt-table net-table vgt-compact"
          :columns="tcyAssetColumns"
          :rows="
            Object.entries(tcyInfo.unclaim_info.assets).map(
              ([asset, value]) => ({
                asset: asset,
                value: value / 1e8,
              })
            )
          "
          max-height="400px"
          :sort-options="{
            enabled: true,
            initialSortBy: { field: 'value', type: 'desc' },
          }"
        >
          <template slot="table-row" slot-scope="props">
            <div
              v-if="props.column.field == 'asset'"
              v-tooltip="props.row.asset"
              class="tcy-card"
            >
              <asset-icon
                :asset="props.row.asset"
                :height="'1.2rem'"
                :chain-height="'0.5rem'"
              />
              <span>{{
                showAsset(props.formattedRow[props.column.field])
              }}</span>
            </div>
            <div v-else-if="props.column.field == 'value'">
              {{ props.formattedRow[props.column.field] | number('0,0.00a') }}
              <small>TCY</small>
            </div>
            <div v-else-if="props.column.field == 'usdValue'">
              {{ (props.row.value * tcyInfo.price) | currency() }}
            </div>
          </template>
        </vue-good-table>
        <table-loader
          v-else
          :cols="tcyAssetColumns"
          :rows="Array(10).fill({})"
        />
      </card>
      <card title="TCY Mimirs" :img-src="require('@/assets/images/gear.svg')">
        <info-card :options="mimirInfoCard" :inner="true">
          <template #mimir="{ item }">
            <checkmark
              v-if="item.value === 'False'"
              class="mimir-icon"
            ></checkmark>
            <xmark v-else class="mimir-icon"></xmark>
          </template>
        </info-card>
      </card>
    </div>
  </page>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import Xmark from '~/assets/images/xmark.svg?inline'
import Checkmark from '~/assets/images/square-checkmark.svg?inline'

use([
  SVGRenderer,
  GridComponent,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
])

export default {
  components: {
    Checkmark,
    Xmark,
    VChart,
  },
  data() {
    return {
      tcyAssetColumns: [
        { label: 'Asset', field: 'asset' },
        {
          label: 'Value (TCY)',
          field: 'value',
          type: 'number',
        },
        {
          label: 'Value ($)',
          field: 'usdValue',
          type: 'number',
          sortable: false,
        },
      ],
      mimir: undefined,
      networkConst: undefined,
      tcyInfo: undefined,
      earningsHistory: undefined,
      extraSeries: {
        center: ['55%', '50%'],
        radius: ['40%', '70%'],
        label: {
          formatter: (a) => {
            return `${a.name}: ${this.$options.filters.number(a?.data?.value, '0,0.00a')} TCY\n(${a.percent}%)`
          },
          distanceToLabelLine: 5,
          fontFamily: 'Montserrat',
        },
      },
    }
  },
  computed: {
    ...mapGetters({
      chainsHeight: 'getChainsHeight',
      runePrice: 'getRunePrice',
    }),
    extra() {
      return {
        legend: {
          show: true,
          type: 'scroll',
          orient: 'vertical',
          x: 'left',
          y: 'top',
          icon: 'circle',
          textStyle: {
            color: 'var(--font-color)',
          },
        },
        tooltip: {
          formatter: (a) => {
            return `${a.name}: ${this.$options.filters.number(a?.data?.value, '0,0.00a')} TCY`
          },
        },
      }
    },
    infoCardData() {
      return [
        {
          title: 'Claimed',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Number of Wallets',
              value: this.tcyInfo?.claimed_info.count,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
              extraText: `${this.$options.filters.percent(this.tcyInfo?.claimed_info.count / 11614)}`,
            },
            {
              name: 'Supply',
              value: this.tcyInfo?.claimed_info.total,
              filter: (v) =>
                `${this.$options.filters.number(v / 1e8, '0,0.00a')} TCY`,
              extraText: `${this.$options.filters.percent(this.tcyInfo?.claimed_info.total / 20660654128874864)}`,
            },
          ],
        },
        {
          title: 'Unclaimed',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Number of Wallets',
              value: this.tcyInfo?.unclaim_info.count,
              filter: (v) => this.$options.filters.number(v, '0,0'),
            },
            {
              name: 'Supply',
              value: this.tcyInfo?.unclaim_info.total,
              filter: (v) =>
                `${this.$options.filters.number(v / 1e8, '0,0.00a')} TCY`,
              extraText: `$${this.$options.filters.number((this.tcyInfo?.unclaim_info.total / 1e8) * this.tcyInfo?.price, '0,0.00a')}`,
            },
          ],
        },
        {
          title: 'Stakers',
          rowStart: 2,
          colSpan: 1,
          items: [
            {
              name: 'Number of Wallets',
              value: this.tcyInfo?.staker_info.count,
              filter: (v) => this.$options.filters.number(v, '0,0'),
            },
            {
              name: 'Supply',
              value: this.tcyInfo?.staker_info.total,
              filter: (v) =>
                `${this.$options.filters.number(v / 1e8, '0,0.00a')} TCY`,
              extraText: `$${this.$options.filters.number((this.tcyInfo?.staker_info.total / 1e8) * this.tcyInfo?.price, '0,0.00a')}`,
            },
            {
              name: 'Pending Reward',
              value: this.tcyInfo?.pending_reward / 1e8,
              usdValue: true,
              filter: (v) =>
                `${this.$options.filters.number(v, '0,0.00a')} RUNE`,
            },
            {
              name: 'Next Payout',
              value:
                Math.ceil(this.chainsHeight?.THOR / 14_400) * 14_400 -
                this.chainsHeight?.THOR,
              filter: (v) => `${this.$options.filters.number(v, '0,0')} Blocks`,
              extraText: `${moment
                .duration(
                  (Math.ceil(this.chainsHeight?.THOR / 14_400) * 14_400 -
                    this.chainsHeight?.THOR) *
                    6,
                  'seconds'
                )
                .humanize()}`,
            },
          ],
        },
        {
          title: 'Others',
          rowStart: 2,
          colSpan: 1,
          items: [
            {
              name: 'Pooled TCY',
              value: this.tcyInfo?.tcy_in_pool,
              filter: (v) =>
                `${this.$options.filters.number(v / 1e8, '0,0a')} TCY`,
              extraText: `$${this.$options.filters.number((this.tcyInfo?.tcy_in_pool / 1e8) * this.tcyInfo?.price, '0,0.00a')}`,
            },
            {
              name: 'Not staked',
              value: this.tcyInfo?.claimed_not_staked,
              filter: (v) =>
                `${this.$options.filters.number(v / 1e8, '0,0.00a')} TCY`,
              extraInfo: `Almost ${this.$options.filters.percent(this.tcyInfo?.claimed_not_staked / this.tcyInfo?.claimed_info.total, 2)} of claimers haven't staked`,
              extraText: `$${this.$options.filters.number((this.tcyInfo?.claimed_not_staked / 1e8) * this.tcyInfo?.price, '0,0.00a')}`,
            },
            {
              name: 'Protocol Owned',
              value: this.tcyInfo?.pol_tcy,
              filter: (v) =>
                `${this.$options.filters.number(v / 1e8, '0,0.00a')} TCY`,
              extraInfo: `Total TCY bought back by the protocol`,
              extraText: `$${this.$options.filters.number((this.tcyInfo?.pol_tcy / 1e8) * this.tcyInfo?.price, '0,0.00a')}`,
            },
          ],
        },
        {
          title: 'Economics',
          rowStart: 3,
          colSpan: 1,
          items: [
            {
              name: 'Fixed Supply',
              value: this.tcyInfo?.TCYSupply,
              filter: (v) => `${this.$options.filters.number(v, '0,0.00')} TCY`,
            },
            {
              name: 'TCY Marketcap',
              value: this.tcyInfo?.TCYSupply * this.tcyInfo?.price,
              filter: (v) => `${this.$options.filters.currency(v)}`,
            },
            {
              name: 'vs RUNE Marketcap',
              value: this.runePrice
                ? (this.tcyInfo?.TCYSupply * this.tcyInfo?.price) /
                  ((this.tcyInfo?.runeSupply / 1e8) * (this.runePrice ?? 1))
                : undefined,
              filter: (v) => `${this.$options.filters.percent(v, 2)}`,
            },
            {
              name: 'TCY Price',
              value: this.tcyInfo?.price,
              filter: (v) => `${this.$options.filters.currency(v)}`,
            },
            {
              name: 'Earnings (7d)',
              value: this.tcyInfo?.last_week_earnings / 1e8,
              filter: (v) =>
                `${this.$options.filters.number(v, '0,0.00a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'APR',
              value:
                ((this.tcyInfo?.last_week_earnings / 1e8) *
                  this.runePrice *
                  52) /
                this.tcyInfo?.TCYSupply /
                this.tcyInfo?.price,
              filter: (v) => `${this.$options.filters.percent(v, 2)}`,
              extraInfo: `Annualized earnings based on last week's earnings`,
            },
            {
              name: 'Multiple',
              value:
                1 /
                (((this.tcyInfo?.last_week_earnings / 1e8) *
                  this.runePrice *
                  52) /
                  this.tcyInfo?.TCYSupply /
                  this.tcyInfo?.price),
              filter: (v) => `${this.$options.filters.number(v)}x`,
            },
          ],
        },
      ]
    },
    allocationPie() {
      return [
        {
          name: 'Staked',
          value: this.tcyInfo?.staker_info.total / 1e8,
        },
        {
          name: 'Unclaimed',
          value: this.tcyInfo?.unclaim_info.total / 1e8,
        },
        {
          name: 'Pooled',
          value: this.tcyInfo?.tcy_in_pool / 1e8,
        },
        {
          name: 'Protocol Owned',
          value: this.tcyInfo?.pol_tcy / 1e8,
        },
        {
          name: 'Unstaked',
          value: this.tcyInfo?.claimed_not_staked / 1e8,
        },
      ]
    },
    mimirInfoCard() {
      const checkHaltStatus = (value) => {
        if (value === undefined) return undefined
        return value === 0 ? 'False' : 'True'
      }

      return [
        {
          title: 'Status',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'TCY CLAIMING',
              value: checkHaltStatus(this.mimir?.TCYCLAIMINGHALT),
              valueSlot: 'mimir',
            },
            {
              name: 'TCY CLAIMING SWAP',
              value: checkHaltStatus(this.mimir?.TCYCLAIMINGSWAPHALT),
              valueSlot: 'mimir',
            },
            {
              name: 'TCY STAKE DISTRIBUTION',
              value: checkHaltStatus(this.mimir?.TCYSTAKEDISTRIBUTIONHALT),
              valueSlot: 'mimir',
            },
            {
              name: 'TCY STAKING',
              value: checkHaltStatus(this.mimir?.TCYSTAKINGHALT),
              valueSlot: 'mimir',
            },
            {
              name: 'TCY UNSTAKING',
              value: checkHaltStatus(this.mimir?.TCYUNSTAKINGHALT),
              valueSlot: 'mimir',
            },
            {
              name: 'TCY TRADING',
              value: checkHaltStatus(this.mimir?.HALTTCYTRADING),
              valueSlot: 'mimir',
            },
          ],
        },
        {
          title: 'Economic Settings',
          rowStart: 2,
          colSpan: 1,
          items: [
            {
              ...this.parseConstant('MinTCYForTCYStakeDistribution'),
              name: 'Min TCY For Stake Distribution',
              filter: (v) => `${v / 1e8} TCY`,
            },
            {
              ...this.parseConstant('MinRuneForTCYStakeDistribution'),
              name: 'Min Rune For Stake Distribution',
              filter: (v) => `${v / 1e8} RUNE`,
            },
            {
              ...this.parseConstant('TCYStakeSystemIncomeBps'),
              name: 'TCY System Income',
              filter: (v) => `${v / 1e2}%`,
            },
          ],
        },
      ]
    },
  },
  async mounted() {
    this.tcyInfo = (await this.$api.getTcyInfo()).data
    this.mimir = (await this.$api.getMimir()).data
    this.networkConst = (await this.$api.getConstants()).data
    const earnings = (await this.$api.earnings('day', '30')).data
    this.earningsHistory = this.formatEarnings(earnings)
  },
  methods: {
    formatEarnings(d) {
      const xAxis = []
      const pe = []
      const pf = []
      d?.intervals.forEach((interval, index) => {
        // ignore the last index
        if (index === d?.intervals?.length - 1) {
          pe.push((this.tcyInfo?.tcy_stake_eod / 1e8) * this.runePrice)
          pf.push((this.tcyInfo?.tcy_pool_eod / 1e8) * this.runePrice)
        }
        xAxis.push(
          moment(
            Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format('dddd, MMM D')
        )
        const tcy = interval?.pools?.find((p) => p.pool === 'THOR.TCY')
        const staked = interval?.pools?.find(
          (p) => p.pool === 'tcy_stake_reward'
        )
        const earnings = (+staked?.earnings * +interval.runePriceUSD) / 10 ** 8
        const liquidityFee =
          (+tcy?.totalLiquidityFeesRune * +interval.runePriceUSD) / 10 ** 8

        pe.push(earnings)
        pf.push(liquidityFee)
      })

      return this.basicChartFormat(
        (value) => `$ ${this.normalFormat(value)}`,
        [
          {
            type: 'bar',
            name: 'TCY Pool Fees',
            showSymbol: false,
            data: pf,
          },
          {
            type: 'bar',
            name: `Stake Earnings`,
            showSymbol: false,
            data: pe,
          },
        ],
        xAxis,
        {
          legend: {
            type: 'scroll',
            x: 'right',
            y: 'top',
            icon: 'circle',
            textStyle: {
              color: 'var(--font-color)',
            },
          },
        },
        (param) => {
          if (param.length === 0) return ''

          return `
          <div class="tooltip-header">
            ${param[0].name}
          </div>
          <div class="tooltip-body">
            ${param
              .map(
                (p) => `
                <span>
                  <div class="tooltip-item">
                    <div class="data-color" style="background-color: ${p.color}"></div>
                    <span style="text-align: left;">
                      ${p.seriesName}
                    </span>
                  </div>
                  <b>$${this.$options.filters.number(p.value, '0,0.00a')}</b>
                </span>`
              )
              .join('')}
          </div>
          `
        }
      )
    },
  },
}
</script>

<style lang="scss" scoped>
.tcy-card {
  display: flex;
  gap: $space-8;
  flex-direction: column;

  @include lg {
    flex-direction: row;
  }
}

.asset-item {
  display: flex;
  justify-content: space-between;
  padding: $space-4 $space-6;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }

  .asset-name {
    font-weight: bold;
    color: var(--font-color);
  }

  .asset-value {
    color: var(--sec-font-color);
  }
}

.mimir-icon {
  height: 1.2rem;
}

.tcy-chart {
  height: 300px;
}
</style>
