<template>
  <div>
    <cards-header :table-general-stats="synthsGeneralStats" />
    <Card title="Synth Assets">
      <TableLoader v-if="loading" :cols="cols" />
      <vue-good-table
        v-else
        :columns="cols"
        :rows="rows"
        style-class="vgt-table net-table"
        :pagination-options="{
          enabled: true,
          perPage: 30,
          perPageDropdownEnabled: false,
        }"
        :sort-options="{
          enabled: true,
          initialSortBy: { field: 'utilisation', type: 'desc' },
        }"
      >
        <template slot="table-column" slot-scope="props">
          <div
            v-if="props.column.field === 'saverPercentage'"
            class="table-asset"
          >
            Saver %
            <info-icon class="header-icon" />
          </div>
          <div
            v-else-if="props.column.field === 'utilisation'"
            class="table-asset"
          >
            Utilisation
            <info-icon class="header-icon" />
          </div>
          <span v-else>
            {{ props.column.label }}
          </span>
        </template>
        <template slot="table-row" slot-scope="props">
          <div
            v-if="props.column.field === 'asset'"
            v-tooltip="props.row.asset"
            class="cell-content"
          >
            <AssetIcon :asset="props.row.asset" chain="THOR.RUNE" />
            <span>{{ props.formattedRow[props.column.field] }}</span>
          </div>
          <span v-else-if="props.column.field === 'synth'">
            <span v-tooltip="props.row.synth">{{
              props.formattedRow[props.column.field]
            }}</span>
          </span>
          <span v-else-if="props.column.field === 'supply'">
            <span
              >{{ props.formattedRow[props.column.field] }}
              <span class="extra-text">
                {{ showAsset(props.row.asset) }}
              </span>
            </span>
          </span>
          <span v-else-if="props.column.field === 'saverUtilisation'">
            <span v-if="props.row.saverUtilisation !== 0">
              {{ props.formattedRow[props.column.field] }}
            </span>
            <span v-else> - </span>
          </span>
          <span v-else-if="props.column.field === 'utilisation'">
            <span v-if="props.row.utilisation < 1">
              {{ props.formattedRow[props.column.field] }}
              <span
                v-if="props.row.isPol === true"
                style="color: var(--primary-color)"
                >(POL Cap)</span
              >
            </span>
            <span v-else style="color: var(--primary-color)"> Filled </span>
          </span>
          <span v-else>
            {{ props.formattedRow[props.column.field] }}
          </span>
        </template>
      </vue-good-table>
    </Card>
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
import { formatAsset, synthToAsset } from '~/utils'
import InfoIcon from '~/assets/images/info.svg?inline'
export default {
  components: { InfoIcon },
  data() {
    return {
      synthsGeneralStats: [
        {
          name: 'Total Synth Supply',
        },
        {
          name: 'Total Utilisation',
        },
        {
          name: 'Total Saver Percentage',
        },
        {
          name: 'POL Cap',
        },
      ],
      rows: [],
      pools: [],
      synthAssets: [],
      synthUtils: [],
      mimirData: {},
      polCap: 0,
      synthCap: 0,
      loading: true,
    }
  },
  computed: {
    ...mapGetters({
      midgardPools: 'getPools',
    }),
    cols() {
      return [
        {
          label: 'Asset',
          field: 'asset',
          formatFn: formatAsset,
        },
        {
          label: 'Synth',
          field: 'synth',
          formatFn: formatAsset,
        },
        {
          label: 'Saver %',
          field: 'saverPercentage',
          type: 'percentage',
          tooltip: 'Savers depth to the Synth Supply',
          tdClass: 'mono',
          thClass: 'end',
        },
        {
          label: 'Utilisation',
          field: 'utilisation',
          type: 'percentage',
          tooltip: `Synth supply to the Pool Depth relative to the Synth cap (${this.$options.filters.percent(this.synthCap)})`,

          tdClass: 'mono',
          thClass: 'end',
        },
        {
          label: 'Supply',
          field: 'supply',
          type: 'number',
          tdClass: 'mono',
          formatFn: this.numberFormat,
        },
      ]
    },
  },
  watch: {
    midgardPools(pools) {
      if (this.synthUtils && this.synthUtils.length > 0) {
        this.updateGeneralStats(pools)
      }
    },
  },
  async mounted() {
    try {
      const { data: synthAssets } = await this.$api.getAssets()
      const { data: pools } = await this.$api.getThorPools()
      const { data: mimirData } = await this.$api.getMimir()

      this.synthAssets = synthAssets
      this.pools = pools
      this.mimirData = mimirData

      this.polCap =
        (mimirData.POLTARGETSYNTHPERPOOLDEPTH + mimirData.POLBUFFER) / 10000
      this.synthCap = mimirData.MAXSYNTHPERPOOLDEPTH / 10000

      await this.loadSynthUtils()
    } catch (error) {
      console.error(error)
    } finally {
      this.loading = false
    }
  },
  methods: {
    loadSynthUtils() {
      try {
        const synthUtils = []
        for (const asset of this.synthAssets.supply) {
          if (asset.denom === 'bnb/bnb') {
            continue
          }
          const assetName = synthToAsset(asset.denom)
          const pool = this.pools.find((p) => p.asset === assetName)
          synthUtils.push({
            asset: assetName,
            synth: asset.denom,
            synth_units: pool?.synth_units,
            synth_supply: pool?.synth_supply,
            asset_depth: pool?.balance_asset,
            savers_depth: pool?.savers_depth,
            units: pool?.pool_units,
          })
        }
        this.synthUtils = synthUtils

        this.rows = this.synthUtils.map((asset) => ({
          asset: asset?.asset,
          synth: asset?.synth,
          utilisation:
            (+asset?.synth_supply / (+asset?.asset_depth * 2)) *
            (1 / this.synthCap),
          isPol:
            +asset?.synth_supply / (+asset?.asset_depth * 2) >= this.polCap,
          saverPercentage: +asset?.savers_depth / +asset?.synth_supply,
          supply: +asset?.synth_supply / 10 ** 8,
        }))

        if (this.midgardPools) {
          this.updateGeneralStats(this.midgardPools)
        }
      } catch (error) {}
    },
    updateGeneralStats(pools) {
      const totalSynthSupply = this.synthUtils.reduce((total, o) => {
        if (o.synth_supply > 0) {
          return total + this.amountToUSD(o.asset, o.synth_supply, pools)
        } else {
          return total
        }
      }, 0)

      const totalPoolDepth = this.synthUtils.reduce((total, o) => {
        if (o.asset_depth > 0) {
          return total + this.amountToUSD(o.asset, o.asset_depth * 2, pools)
        } else {
          return total
        }
      }, 0)

      const totalSaversDepth = this.synthUtils.reduce((total, o) => {
        if (o.savers_depth > 0) {
          return total + this.amountToUSD(o.asset, o.savers_depth, pools)
        } else {
          return total
        }
      }, 0)

      this.synthsGeneralStats = [
        {
          name: 'Total Synth Supply',
          value:
            '$' + this.$options.filters.number(totalSynthSupply || 0, '0,0a'),
          description: 'Total synth asset in the protocol',
        },
        {
          name: 'Total Utilisation',
          value: this.$options.filters.percent(
            totalSynthSupply / totalPoolDepth
          ),
          description: 'Total Synth Supply (USD) / Total Pool Depth (USD)',
        },
        {
          name: 'Total Saver Percentage',
          value: this.$options.filters.percent(
            totalSaversDepth / totalSynthSupply
          ),
          description: 'Total Savers Depth (USD) / Total Synth Supply (USD)',
        },
        {
          name: 'POL Cap',
          value: this.$options.filters.percent(this.polCap),
          description: 'POL synth per pool depth + POL Buffer',
        },
      ]
    },
  },
  head: {
    title: 'THORChain Network Explorer | Synths',
  },
}
</script>

<style lang="scss">
th.end .table-asset {
  justify-content: flex-end;
}
</style>
