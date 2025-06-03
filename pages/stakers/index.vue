<template>
  <page>
    <Header :title="`Tcy Stakers`"></Header>

    <card>
      <TableLoader v-if="loading" :cols="columns" :rows="Array(10).fill({})" />
      <vue-good-table
        v-else
        :columns="columns"
        :rows="rows"
        style-class="vgt-table net-table"
        :line-numbers="true"
        :sort-options="{
          enabled: true,
          initialSortBy: { field: 'amount', type: 'desc' },
        }"
        :pagination-options="{
          enabled: true,
          perPage: 50,
          perPageDropdownEnabled: false,
        }"
      >
        <template slot="table-row" slot-scope="props">
          <span v-if="props.column.field === 'value'">
            {{ props.row.value | currency }}
          </span>
          <span v-else-if="props.column.field === 'amount'">
            {{ numberFormat(props.row.amount) }}
            <small>TCY</small>
          </span>
          <span
            v-else-if="props.column.field === 'address'"
            class="address-container"
          >
            <avatar :name="props.row.address" :small="true" />
            <address-bar
              :address-str="props.row.address"
              :use-custom-name="true"
            ></address-bar>
          </span>
          <span v-else>
            {{ props.formattedRow[props.column.field] }}
          </span>
        </template>
      </vue-good-table>
    </card>
  </page>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'TCYStakers',

  data() {
    return {
      columns: [
        {
          label: 'Address',
          field: 'address',
        },
        {
          label: 'Amount',
          field: 'amount',
          type: 'number',
          sortable: true,
          tdClass: 'mono',
        },
        {
          label: 'Value',
          field: 'value',
          type: 'number',
          sortable: true,
          tdClass: 'mono',
        },
      ],
      rows: [],
      loading: true,
      error: null,
    }
  },
  computed: {
    ...mapGetters({
      pools: 'getPools',
    }),
    tcyPrice() {
      if (this.pools && this.pools.length > 0) {
        const tcyPool = this.pools.find((pool) => pool.asset === 'THOR.TCY')
        return tcyPool ? tcyPool.assetPriceUSD : null
      }
      return null
    },
  },
  mounted() {
    this.fetchStakers()
  },
  methods: {
    async fetchStakers() {
      try {
        const { data } = await this.$api.getStakers()

        if (!data || !Array.isArray(data.tcy_stakers)) {
          console.error('Unexpected API response:', data)
          this.error = 'Invalid stakers data format'
          return
        }

        this.rows = data.tcy_stakers.map((staker) => ({
          address: staker.address,
          amount: +staker.amount / 1e8,
          value: (+staker.amount * this.tcyPrice) / 1e8,
        }))
      } catch (err) {
        this.error = 'Failed to fetch stakers data'
        console.error('Error fetching stakers:', err)
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.address-container {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
