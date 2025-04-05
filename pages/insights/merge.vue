<template>
  <div>
    <Card
      title="RUJIRA Merge"
      :img-src="require('@/assets/images/ruji-merge.png')"
    >
      <TableLoader v-if="loading" :cols="cols" />
      <vue-good-table
        v-else
        :columns="cols"
        :rows="rows"
        style-class="vgt-table net-table"
        :sort-options="{
          enabled: true,
        }"
      >
        <template slot="table-column" slot-scope="props">
          <span>
            {{ props.column.label }}
          </span>
        </template>
        <template slot="table-row" slot-scope="props">
          <div
            v-if="props.column.field == 'Asset'"
            v-tooltip="props.row.asset"
            class="cell-content"
          >
            <AssetIcon :asset="props.row.Asset" />
            <span>{{ props.formattedRow[props.column.field] }}</span>
          </div>
          <div
            v-else-if="
              props.column.field == 'MintE8' || props.column.field == 'BurnE8'
            "
          >
            {{ props.formattedRow[props.column.field] }}
            <small>
              {{ showAsset(props.row.Asset, true) }}
            </small>
          </div>
          <span v-else>
            <span v-if="props.row[props.column.field]">
              {{ props.formattedRow[props.column.field] }}
            </span>
            <span v-else>-</span>
          </span>
        </template>
      </vue-good-table>
    </Card>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { formatAsset } from '~/utils'

export default {
  data() {
    return {
      cols: [
        {
          label: 'Asset',
          field: 'Asset',
          formatFn: formatAsset,
        },
        {
          label: 'Minted',
          field: 'MintE8',
          type: 'number',
          formatFn: this.baseAmountFormat,
          tdClass: 'mono',
        },
        {
          label: 'Burned',
          field: 'BurnE8',
          type: 'number',
          formatFn: this.baseAmountFormat,
          tdClass: 'mono',
        },
        {
          label: 'Count',
          field: 'Count',
          type: 'number',
          tdClass: 'mono',
        },
      ],
      rows: [],
      error: false,
      loading: true,
    }
  },
  head: {
    title: 'THORChain Network Explorer | Ruji Merge',
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
  },
  async mounted() {
    try {
      const mergeData = (await this.$api.getInfraRUJIMerge()).data
      mergeData.map((item) => {
        item.Asset = item.Asset.replace('THOR.', 'GAIA.')
        return item
      })
      this.rows = mergeData
    } catch (e) {
      this.error = true
      console.error(e)
    } finally {
      this.loading = false
    }
  },
  methods: {},
}
</script>

<style lang="scss">
th.end .table-asset {
  justify-content: flex-end;
}
</style>
