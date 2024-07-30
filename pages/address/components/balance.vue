<template>
  <card title="Balances">
    <vue-good-table
      v-if="state"
      :columns="tokenCols"
      :rows="tokenRows"
      style-class="vgt-table net-table"
      :pagination-options="{
        enabled: true,
        perPage: 10,
      }"
    >
      <template slot="table-row" slot-scope="props">
        <div
          v-if="props.column.field == 'asset'"
          v-tooltip="props.row.asset"
          class="cell-content"
        >
          <AssetIcon :asset="props.row.asset" />
          <span>{{ showAsset(props.row.asset) }}</span>
        </div>
        <template
          v-else-if="
            props.column.field == 'price' || props.column.field == 'value'
          "
        >
          <span
            v-if="
              props.row[props.column.field] > 0 &&
              !isNaN(props.row[props.column.field])
            "
            class="vgt-right-align"
          >
            ${{ props.row[props.column.field] | number('0,0.00') }}
          </span>
          <span v-else>-</span>
        </template>
        <span v-else>
          {{ props.formattedRow[props.column.field] }}
        </span>
      </template>
    </vue-good-table>
  </card>
</template>

<script>
import { bnOrZero } from '@xchainjs/xchain-util'
import { mapGetters } from 'vuex'
import { assetFromString } from '~/utils'

export default {
  props: ['state'],
  data() {
    return {
      tokenCols: [
        {
          label: 'Asset',
          field: 'asset',
        },
        {
          label: 'Type',
          field: 'type',
        },
        {
          label: 'Quantity',
          field: 'quantity',
          type: 'number',
          tdClass: 'mono',
        },
        {
          label: 'Price',
          field: 'price',
          type: 'number',
          tdClass: 'mono',
        },
        {
          label: 'Value',
          field: 'value',
          type: 'number',
          tdClass: 'mono',
        },
      ],
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
      pools: 'getPools',
    }),
    tokenRows() {
      if (!this.state) {
        return []
      }

      const ret = []
      for (let i = 0; i < this.state.length; i++) {
        const e = this.state[i]

        let poolAsset
        this.pools?.forEach((p) => {
          const pa = assetFromString(p.asset)
          if (pa.chain === e.asset.chain && pa.ticker === e.asset.ticker) {
            poolAsset = p
          }
        })

        if (e.asset.ticker === 'RUNE' && e.asset.chain === 'THOR') {
          poolAsset = {
            assetPriceUSD: this.runePrice,
          }
        }

        ret.push({
          asset: e.asset,
          quantity: e.quantity,
          price: bnOrZero(poolAsset?.assetPriceUSD).toFixed(2),
          value: bnOrZero(poolAsset?.assetPriceUSD * e.quantity).toFixed(2),
          type: this.getAssetType(e.asset),
        })
      }

      return ret
    },
  },
  methods: {
    getAssetType(asset) {
      if (asset.synth) {
        return 'Synth'
      } else if (asset.trade) {
        return 'Trade'
      } else {
        return 'Native'
      }
    },
  },
}
</script>

<style></style>
