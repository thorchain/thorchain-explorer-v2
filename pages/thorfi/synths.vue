<template>
  <Page>
    <Card title="Synth Assets" :isLoading="!(rows && rows.length > 0)">
      <vue-good-table
        v-if="cols && rows.length > 0"
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
          initialSortBy: {field: 'utilisation', type: 'desc'}
        }"
      >
        <template slot="table-column" slot-scope="props">
          <div v-if="props.column.field == 'saverPercentage'" v-tooltip="'Savers depth to the Synth Supply'" class="table-asset">
            Saver %
            <info-icon class="header-icon" />
          </div>
          <div v-else-if="props.column.field == 'utilisation'" v-tooltip="`Synth supply to the Pool Depth relative to the Synth cap (${(synthCap*100).toFixed(2)}%)`" class="table-asset">
            Utilisation
            <info-icon class="header-icon" />
          </div>
          <span v-else>
            {{ props.column.label }}
          </span>
        </template>
        <template slot="table-row" slot-scope="props">
          <div v-if="props.column.field == 'asset'" v-tooltip="props.row.asset" class="cell-content">
            <AssetIcon :asset="props.row.asset" chain="THOR.RUNE" />
            <span>{{ props.formattedRow[props.column.field] }}</span>
          </div>
          <span v-else-if="props.column.field == 'synth'">
            <span v-tooltip="props.row.synth">{{ props.formattedRow[props.column.field] }}</span>
          </span>
          <span v-else-if="props.column.field == 'supply'">
            <span>{{ props.formattedRow[props.column.field] }}
              <span class="extra-text">
                {{ showAsset(props.row.asset) }}
              </span>
            </span>
          </span>
          <span v-else-if="props.column.field == 'saverUtilisation'">
            <span v-if="props.row.saverUtilisation != 0">
              {{ props.formattedRow[props.column.field] }}
            </span>
            <span v-else>
              -
            </span>
          </span>
          <span v-else-if="props.column.field == 'utilisation'">
            <span v-if="props.row.utilisation < 1">
              {{ props.formattedRow[props.column.field] }}
              <span v-if="props.row.isPol == true" style="color: var(--primary-color)">(POL Cap)</span>
            </span>
            <span v-else style="color: var(--primary-color)">
              Filled
            </span>
          </span>
          <span v-else>
            {{ props.formattedRow[props.column.field] }}
          </span>
        </template>
      </vue-good-table>
    </Card>
  </Page>
</template>

<script>
import { formatAsset, synthToAsset } from '~/utils'
import InfoIcon from '~/assets/images/info.svg?inline'

export default {
  components: { InfoIcon },
  async asyncData ({ $api }) {
    const synthAssets = (await $api.getAssets().catch(e => console.error(e))).data
    const pools = (await $api.getThorPools().catch(e => console.error(e))).data
    const { data: mimirData } = await $api.getMimir()
    const polCap = (mimirData.POLTARGETSYNTHPERPOOLDEPTH + mimirData.POLBUFFER) / 10000
    const synthCap = mimirData.MAXSYNTHPERPOOLDEPTH / 10000
    const synthUtils = []
    for (const asset of synthAssets.supply) {
      // bnb chain is deprecated
      if (asset.denom === 'bnb/bnb') {
        continue
      }
      const assetName = synthToAsset(asset.denom)
      const pool = pools.find(p => p.asset === assetName)
      synthUtils.push({
        asset: assetName,
        synth: asset.denom,
        synth_units: pool?.synth_units,
        synth_supply: pool?.synth_supply,
        asset_depth: pool?.balance_asset,
        savers_depth: pool?.savers_depth,
        units: pool?.pool_units
      })
    }
    return { pools, synthAssets, synthUtils, mimirData, polCap, synthCap }
  },
  data () {
    return {
      cols: [
        {
          label: 'Asset',
          field: 'asset',
          formatFn: formatAsset
        },
        {
          label: 'Synth',
          field: 'synth',
          formatFn: formatAsset
        },
        {
          label: 'Saver %',
          field: 'saverPercentage',
          type: 'percentage',
          tdClass: 'mono',
          thClass: 'end'
        },
        {
          label: 'Utilisation',
          field: 'utilisation',
          type: 'percentage',
          tdClass: 'mono',
          thClass: 'end'
        },
        {
          label: 'Supply',
          field: 'supply',
          type: 'number',
          tdClass: 'mono',
          formatFn: this.numberFormat
        }
      ],
      rows: []
    }
  },
  mounted () {
    if (this.synthUtils && this.synthUtils.length > 0) {
      for (const asset of this.synthUtils) {
        if (!asset) {
          continue
        }
        this.rows.push({
          asset: asset?.asset,
          synth: asset?.synth,
          utilisation: (+asset?.synth_supply / (+asset?.asset_depth * 2)) * (1 / this.synthCap),
          isPol: (+asset?.synth_supply / (+asset?.asset_depth * 2)) >= this.polCap,
          saverPercentage: +asset?.savers_depth / +asset?.synth_supply,
          supply: +asset?.synth_supply / 10 ** 8
        })
      }
    }
  }
}
</script>

<style lang="scss">

th.end .table-asset {
  justify-content: flex-end;
}
</style>
