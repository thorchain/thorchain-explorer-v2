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
          <span v-if="props.column.field === 'address'">
            <address-bar :address-str="props.row.address"></address-bar>
          </span>
          <span v-else-if="props.column.field === 'amount'">
            {{
              props.row.amount >= 10000
                ? normalFormat(props.row.amount)
                : props.row.amount
            }}
          </span>

          <span v-else-if="props.column.field === 'value' && showValue">
            {{ normalFormat(props.row.value) }}
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

export default {
  name: 'ThorHolders',
  data() {
    return {
      allColumns: [
        {
          label: 'Address',
          field: 'address',
        },
        {
          label: 'Balance',
          field: 'amount',
          type: 'number',
        },
        {
          label: 'Value',
          field: 'value',
          type: 'number',
        },
      ],
      holders: [],
      asset: '',
      loading: true,
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
      pools: 'getPools',
    }),
    showValue() {
      return this.asset === 'THOR.RUNE'
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
      this.asset = this.$route.query.asset
      this.fetchHoldersData()
    }
  },
  methods: {
    async fetchHoldersData() {
      try {
        const { data } = await this.$api.getHolders(this.asset)

        this.holders = data.map((holder, index) => {
          const coin = holder.coins.find((c) => c.asset === this.asset)
          const amount = coin.amount / 1e8
          return {
            address: holder.address,
            amount,
            value: this.showValue ? amount * this.runePrice : 0,
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
