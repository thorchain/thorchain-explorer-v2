<template>
  <div>
    <Card style="margin-bottom: 1rem">
      <span>
        Holders of
        <b style="color: var(--sec-font-color)"
          >KUJI, rKUJI, FUZN, NSTK, WINK, and LVN</b
        >
        tokens are able to migrate and convert these tokens into RUJI on Rujira,
        the THORChain app layer.
      </span>
      <br />
      <br />
      <a href="https://rujira.network/merge/KUJI" target="_blank">More Info</a>
    </Card>
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
          <div v-else-if="props.column.field == 'MintE8'">
            {{ props.formattedRow[props.column.field] }}
            / {{ props.row.maxSupply | number('0,0.00a') }}
            <small>
              {{ showAsset(props.row.Asset, true) }}
            </small>
          </div>
          <div v-else-if="props.column.field == 'Allocation'">
            {{ props.formattedRow[props.column.field] }}
            <small>RUJI</small>
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
          label: 'Switched',
          field: 'MintE8',
          type: 'number',
          formatFn: this.baseAmountFormat,
          tdClass: 'mono',
        },
        {
          label: 'Allocation',
          field: 'Allocation',
          type: 'number',
          formatFn: (n) => this.$options.filters.number(n, '0,0.00a'),
          tdClass: 'mono',
        },
        {
          label: 'Tx Count',
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
        switch (item.Asset) {
          case 'GAIA.KUJI':
            item.maxSupply = 122349807
            item.Allocation = 41_840_000
            break
          case 'GAIA.WINK':
            item.maxSupply = 69000000
            item.Allocation = 1_430_000
            break
          case 'GAIA.RKUJI':
            item.maxSupply = 10000000
            item.Allocation = 3_720_000
            break
          case 'GAIA.FUZN':
            item.maxSupply = 171740000
            item.Allocation = 1_560_000
            break
          case 'GAIA.LVN':
            item.maxSupply = 695260000
            item.Allocation = 5_000_000
            break
          case 'GAIA.NSTK':
            item.maxSupply = 65000000
            item.Allocation = 1_440_000
            break
          default:
            break
        }
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
