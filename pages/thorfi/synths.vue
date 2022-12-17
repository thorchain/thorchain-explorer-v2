<template>
  <Page>
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
    >
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
        <span v-else>
          {{ props.formattedRow[props.column.field] }}
        </span>
      </template>
    </vue-good-table>
  </Page>
</template>

<script>
import { formatAsset, synthToAsset } from '~/utils'

export default {
  async asyncData ({ $api }) {
    const synthAssets = (await $api.getAssets().catch(e => console.error(e))).data
    const pools = (await $api.getThorPools().catch(e => console.error(e))).data
    const synthUtils = []
    for (const asset of synthAssets.supply) {
      const assetName = synthToAsset(asset.denom)
      const pool = pools.find(p => p.asset === assetName)
      synthUtils.push({
        asset: assetName,
        synth: asset.denom,
        amount: asset.amount,
        synth_units: pool?.synth_units,
        synth_supply: pool?.synth_supply,
        asset_depth: pool?.balance_asset,
        savers_depth: pool?.savers_depth,
        units: pool?.pool_units,
        supply: asset?.amount
      })
    }
    return { pools, synthAssets, synthUtils }
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
          label: 'Saver Utilisation',
          field: 'saverUtilisation',
          type: 'percentage',
          tdClass: 'mono'
        },
        {
          label: 'Utilisation',
          field: 'utilisation',
          type: 'percentage',
          tdClass: 'mono'
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
          utilisation: +asset?.synth_supply / (+asset?.asset_depth * 2),
          saverUtilisation: +asset?.savers_depth / +asset?.supply,
          supply: +asset?.supply / 10 ** 8
        })
      }
    }
  }
}
</script>

<style>
</style>
