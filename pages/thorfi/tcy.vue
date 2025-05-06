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
        title="Allocation"
        style="min-width: 400px"
        :img-src="require('@/assets/images/allocations.svg')"
      >
        <pie-chart
          :pie-data="allocationPie"
          :extra-series="extraSeries"
          :extra="extra"
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
            <div v-else>
              {{ props.formattedRow[props.column.field] | number('0,0.00a') }}
              <small>TCY</small>
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
              v-if="item.value === 'True'"
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
import Checkmark from '~/assets/images/square-checkmark.svg?inline'
import Xmark from '~/assets/images/xmark.svg?inline'

export default {
  components: {
    Checkmark,
    Xmark,
  },
  data() {
    return {
      tcyAssetColumns: [
        { label: 'Asset', field: 'asset', sortable: true },
        {
          label: 'Value (TCY)',
          field: 'value',
          type: 'number',
          sortable: true,
        },
      ],
      mimir: undefined,
      networkConst: undefined,
      tcyInfo: undefined,
      extraSeries: {
        center: ['55%', '50%'],
        radius: ['40%', '70%'],
        nodeClick: 'link',
        label: {
          formatter: (a) => {
            return `${a.name}: ${this.$options.filters.number(a?.data?.value, '0,0.00a')} TCY`
          },
          distanceToLabelLine: 5,
          fontFamily: 'Montserrat',
        },
      },
    }
  },
  computed: {
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
              name: 'Number',
              value: this.tcyInfo?.claimed_info.count,
              filter: (v) =>
                `${this.$options.filters.number(v, '0,0')} (${this.$options.filters.percent(this.tcyInfo?.claimed_info.count / 11614)})`,
            },
            {
              name: 'Supply',
              value: this.tcyInfo?.claimed_info.total,
              filter: (v) =>
                `${this.$options.filters.number(v / 1e8, '0,0.00a')} TCY`,
            },
          ],
        },
        {
          title: 'Stakers',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Number',
              value: this.tcyInfo?.staker_info.count,
              filter: (v) => this.$options.filters.number(v, '0,0'),
            },
            {
              name: 'Supply',
              value: this.tcyInfo?.staker_info.total,
              filter: (v) =>
                `${this.$options.filters.number(v / 1e8, '0,0.00a')} TCY`,
            },
          ],
        },
        {
          title: 'Unclaimed',
          rowStart: 2,
          colSpan: 1,
          items: [
            {
              name: 'Number',
              value: this.tcyInfo?.unclaim_info.count,
              filter: (v) => this.$options.filters.number(v, '0,0'),
            },
            {
              name: 'Supply',
              value: this.tcyInfo?.unclaim_info.total,
              filter: (v) =>
                `${this.$options.filters.number(v / 1e8, '0,0.00a')} TCY`,
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
                `${this.$options.filters.number(v / 1e8, '0,0.00a')} TCY`,
            },
            {
              name: 'Claimed but not staked',
              value: this.tcyInfo?.claimed_not_staked,
              filter: (v) =>
                `${this.$options.filters.number(v / 1e8, '0,0.00a')} TCY`,
              extraInfo: `Almost ${this.$options.filters.percent(this.tcyInfo?.claimed_not_staked / this.tcyInfo?.claimed_info.total)} of claimers hasn't staked`,
            },
          ],
        },
      ]
    },
    allocationPie() {
      const others =
        210_000_000 -
        (this.tcyInfo?.staker_info.total +
          this.tcyInfo?.unclaim_info.total +
          this.tcyInfo?.tcy_in_pool) /
          1e8

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
          name: 'Others',
          value: others,
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
          title: 'Halt',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'TCY CLAIMING HALT',
              value: checkHaltStatus(this.mimir?.TCYCLAIMINGHALT),
              valueSlot: 'mimir',
            },
            {
              name: 'TCY CLAIMING SWAP HALT',
              value: checkHaltStatus(this.mimir?.TCYCLAIMINGSWAPHALT),
              valueSlot: 'mimir',
            },
            {
              name: 'TCY STAKE DISTRIBUTION HALT',
              value: checkHaltStatus(this.mimir?.TCYSTAKEDISTRIBUTIONHALT),
              valueSlot: 'mimir',
            },
            {
              name: 'TCY STAKING HALT',
              value: checkHaltStatus(this.mimir?.TCYSTAKINGHALT),
              valueSlot: 'mimir',
            },
            {
              name: 'TCY UNSTAKING HALT',
              value: checkHaltStatus(this.mimir?.TCYUNSTAKINGHALT),
              valueSlot: 'mimir',
            },
            {
              name: 'HALT TCY TRADING',
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
  },
}
</script>

<style lang="scss" scoped>
.tcy-card {
  display: flex;
  flex-wrap: wrap;
  gap: $space-8;
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
</style>
