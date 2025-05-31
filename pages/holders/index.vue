<template>
  <page>
    <card>
      <TableLoader
        v-if="loading"
        :cols="filteredColumns"
        :rows="Array(10).fill({})"
      />

      <vue-good-table
        v-else
        :columns="filteredColumns"
        :rows="holders"
        style-class="vgt-table net-table"
      >
        <template slot="table-row" slot-scope="props">
          <span
            v-if="props.column.field === 'address'"
            class="address-container"
          >
            <avatar :name="props.row.address" :small="true" />
            <address-bar :address-str="props.row.address"></address-bar>
          </span>
          <span v-else-if="props.column.field === 'amount'">
            {{
              props.row.amount >= 1000
                ? normalFormat(props.row.amount)
                : decimalFormat(props.row.amount)
            }}
            <small>
              {{ showAsset(props.row.asset, true) }}
            </small>
          </span>

          <span v-else-if="props.column.field === 'value' && showValue">
            {{ props.row.value | currency }}
          </span>
          <span v-else-if="props.column.field === 'value' && !showValue">
            -
          </span>
        </template>
      </vue-good-table>
    </card>
  </page>
</template>

<script>
import { mapGetters } from 'vuex'
import { assetFromString } from '~/utils'

export default {
  name: 'ThorHolders',
  data() {
    return {
      holders: [],
      asset: '',
      loading: true,
      showValue: false,
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
      pools: 'getPools',
    }),
    allColumns() {
      return [
        {
          label: 'Address',
          field: 'address',
        },
        {
          label: 'Balance',
          field: 'amount',
          type: 'number',
          tdClass: 'mono',
        },
        {
          label: 'Value',
          field: 'value',
          type: 'number',
          tdClass: 'mono',
          hide: this.showValue === true,
        },
      ]
    },
    filteredColumns() {
      return this.allColumns.filter((column) => {
        if (column.field === 'value') {
          return this.showValue
        }
        return true
      })
    },
  },
  watch: {
    '$route.query.asset'(newAsset) {
      this.asset = newAsset || 'THOR.RUNE'
      this.fetchHoldersData()
    },
  },
  mounted() {
    if (!this.$route.query.asset) {
      this.$router.replace({ query: { asset: 'THOR.RUNE' } })
    } else {
      this.asset = this.$route.query.asset.toUpperCase()
      this.fetchHoldersData()
    }
  },
  methods: {
    async fetchHoldersData() {
      try {
        let assetPrice = null
        if (this.pools) {
          const assetObject = assetFromString(this.asset)
          const assetPool = this.pools.find(
            (p) => assetFromString(p.asset).ticker === assetObject.ticker
          )
          assetPrice = +assetPool?.assetPriceUSD
        }

        if (this.asset === 'THOR.RUNE') {
          assetPrice = this.runePrice
        }

        if (assetPrice) {
          this.showValue = true
        }
        const { data } = await this.$api.getHolders(this.asset)

        this.holders = data.map((holder, index) => {
          const coin = holder.coins.find((c) => c.asset === this.asset)
          const amount = coin.amount / 1e8
          return {
            address: holder.address,
            amount,
            value: this.showValue ? amount * assetPrice : 0,
            asset: coin.asset,
          }
        })
      } catch (error) {
        console.error('Error fetching holders data:', error)
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.address-container {
  display: flex;
  gap: $space-8;
}
</style>
