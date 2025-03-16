<template>
  <div>
    <cards-header :table-general-stats="tradingGeneralStats" />
    <Card title="Trade Assets">
      <template #header>
        <button class="button-container full-screen-btn" @click="toggleUSD">
          <template v-if="usdDenom">
            <usd-fill-icon class="btn-icon" />
          </template>
          <template v-else>
            <usd-icon class="btn-icon" />
          </template>
        </button>
      </template>
      <TableLoader v-if="loading" :cols="cols" />
      <vue-good-table
        v-else
        :columns="cols"
        :rows="rows"
        style-class="vgt-table net-table"
        :pagination-options="{
          enabled: true,
          perPage: 50,
          perPageDropdownEnabled: false,
        }"
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
            v-if="props.column.field == 'asset'"
            v-tooltip="props.row.asset"
            class="cell-content"
          >
            <AssetIcon :asset="props.row.asset" chain="THOR.RUNE" />
            <span>{{ props.formattedRow[props.column.field] }}</span>
          </div>
          <div
            v-else-if="
              props.column.field == 'depth' ||
              props.column.field == 'vaultDepth'
            "
          >
            <span v-if="props.row[props.column.field]">
              <span v-if="usdDenom">$</span
              >{{ props.formattedRow[props.column.field] }}
              <small v-if="!usdDenom">{{
                tradeToAsset(props.row.asset)
              }}</small>
            </span>
            <span v-else>-</span>
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
import { formatAsset, tradeToAsset, assetFromString } from '~/utils'
import UsdIcon from '~/assets/images/usd.svg?inline'
import UsdFillIcon from '~/assets/images/usd-fill.svg?inline'

export default {
  components: { UsdIcon, UsdFillIcon },
  data() {
    return {
      cols: [
        {
          label: 'Asset',
          field: 'asset',
          formatFn: formatAsset,
        },
        {
          label: 'Trade Depth',
          field: 'depth',
          type: 'number',
          thClass: 'end',
          formatFn: this.baseAmountFormat,
          tdClass: 'mono end',
        },
        {
          label: 'Trade / Pool Depth',
          field: 'depthRatio',
          type: 'percentage',
          tdClass: 'mono',
        },
        {
          label: 'Vault Depth',
          field: 'vaultDepth',
          type: 'number',
          formatFn: this.baseAmountFormat,
          tdClass: 'mono',
        },
        {
          label: 'Vault / Pool Depth',
          field: 'vaultRatio',
          type: 'percentage',
          tdClass: 'mono',
        },
        {
          label: 'Units',
          field: 'units',
          type: 'number',
          tdClass: 'mono',
          thClass: 'end',
          formatFn: this.baseAmountFormat,
        },
      ],
      rows: [],
      tradingGeneralStats: [
        {
          name: 'Total Trade Depth',
        },
        {
          name: 'Total Vault Depth',
        },
        {
          name: 'Total Vault / Pool',
        },
        {
          name: 'Total Trade / Pool',
        },
      ],
      usdDenom: false,
      error: false,
      tradeAssets: undefined,
      pools: undefined,
      asgard: undefined,
      loading: true,
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
  },
  async mounted() {
    try {
      this.tradeAssets = (await this.$api.getTradeAssets()).data
      this.pools = (await this.$api.getThorPools()).data
      this.asgard = (await this.$api.getAsgard()).data
      this.rows = this.fillTradeData(this.tradeAssets, this.pools, this.asgard)
    } catch (e) {
      this.error = true
      console.error(e)
    } finally {
      this.loading = false
    }
  },
  methods: {
    fillTradeData(tradeAssets, pools, asgard) {
      const assetPerVault = {}
      const asgardCoins = asgard.map((a) => a.coins)
      for (let i = 0; i < asgardCoins.length; i++) {
        const v = asgardCoins[i]
        for (let j = 0; j < v.length; j++) {
          const { asset, amount } = v[j]
          if (!assetPerVault[asset]) {
            assetPerVault[asset] = +amount
          } else {
            assetPerVault[asset] += +amount
          }
        }
      }

      let totalTradeDepth = 0
      const ret = []
      for (const asset of tradeAssets) {
        const assetName = tradeToAsset(asset.asset)
        const pool = pools.find((p) => p.asset === assetName)
        const vaultDepth = assetPerVault[assetName]

        // Ignore the assets that are not in pools
        if (!pool) {
          continue
        }

        let assetPrice = 1
        if (this.usdDenom) {
          assetPrice =
            (pool?.balance_rune / pool?.balance_asset) * this.runePrice
        }

        totalTradeDepth +=
          (asset.depth / 1e8) *
          (pool?.balance_rune / pool?.balance_asset) *
          this.runePrice

        ret.push({
          ...asset,
          depth: asset.depth * assetPrice ?? 0,
          price: assetPrice,
          vaultDepth: vaultDepth * assetPrice ?? 0,
          vaultRatio: vaultDepth / pool?.balance_asset ?? 0,
          depthRatio: asset.depth / pool?.balance_asset ?? 0,
        })
      }

      let totalVaultDepth = 0
      let totalPoolDepth = 0
      for (const pool of pools) {
        const assetName = pool.asset
        const vaultDepth = assetPerVault[assetName]
        if (!vaultDepth) {
          continue
        }

        totalVaultDepth +=
          ((vaultDepth ?? 0) / 1e8) *
          (pool?.balance_rune / pool?.balance_asset) *
          this.runePrice
        totalPoolDepth += (pool?.balance_rune / 1e8) * this.runePrice
      }

      this.tradingGeneralStats = [
        {
          name: 'Total Trade Depth',
          value:
            '$' + this.$options.filters.number(totalTradeDepth || 0, '0,0a'),
        },
        {
          name: 'Total Vault Depth',
          value:
            '$' + this.$options.filters.number(totalVaultDepth || 0, '0,0a'),
        },
        {
          name: 'Total Vault / Pool',
          value: this.$options.filters.percent(
            totalVaultDepth / totalPoolDepth
          ),
        },
        {
          name: 'Total Trade / Pool',
          value: this.$options.filters.percent(
            totalTradeDepth / totalPoolDepth
          ),
        },
      ]

      return ret
    },
    toggleUSD() {
      this.usdDenom = !this.usdDenom
      this.rows = this.fillTradeData(this.tradeAssets, this.pools, this.asgard)
    },
    tradeToAsset(asset) {
      return assetFromString(asset)?.ticker
    },
  },
  head: {
    title: 'THORChain Network Explorer | Trades',
  },
}
</script>

<style lang="scss">
th.end .table-asset {
  justify-content: flex-end;
}
</style>
