<template>
  <div>
    <div v-if="!loading && !error" class="base-container lp-container">
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
          <template v-if="props.column.field.includes('addr')">
            <span v-if="props.row[props.column.field]" class="clickable" @click="gotoAddr(props.row[props.column.field])">
              {{ props.formattedRow[props.column.field] }}
            </span>
            <span v-else>
              Not Assgined
            </span>
          </template>
          <span v-else>
            {{ props.formattedRow[props.column.field] }}
          </span>
        </template>
      </vue-good-table>
    </div>
    <LoadingCard v-if="loading" />
    <div v-if="error" class="base-container">
      <span>Can't fetch the pool LPs</span>
    </div>
  </div>
</template>

<script>
import BounceLoader from 'vue-spinner/src/BounceLoader.vue'

export default {
  components: {
    BounceLoader
  },
  async asyncData ({ params }) {
    return { poolName: params.poolName }
  },
  data () {
    return {
      lpPositions: [],
      loading: true,
      error: false,
      cols: [
        {
          label: 'Position',
          field: 'position'
        },
        {
          label: 'Rune address',
          field: 'rune_addr',
          formatFn: this.formatAddress
        },
        {
          label: 'Asset address',
          field: 'asset_addr',
          formatFn: this.formatAddress
        },
        {
          label: 'Rune added',
          field: 'rune_add',
          type: 'number',
          formatFn: this.formatNumber
        },
        {
          label: 'Asset added',
          field: 'asset_add',
          type: 'number',
          formatFn: this.formatNumber
        },
        {
          label: 'Last Height added',
          field: 'last_add_height',
          type: 'number',
          formatFn: this.formatBlock
        }
      ],
      rows: []
    }
  },
  mounted () {
    this.$api.getLpPositions(this.$route.params.poolName).then((res) => {
      this.lpPositions = this.formatLP(res?.data)
    }).catch((e) => {
      this.error = true
      console.error(e)
    })
      .finally(() => {
        this.loading = false
      })
  },
  methods: {
    checkPostion (position) {
      let pos = ''
      if ('asset_address' in position) { pos = 'Asymmetrical Asset' }
      if ('rune_address' in position) { pos = 'Asymmetrical Rune' }
      if ('asset_address' in position && 'rune_address' in position) { pos = 'Symmetrical' }
      return pos
    },
    formatLP (pos) {
      for (const i in pos) {
        this.rows.push({
          position: this.checkPostion(pos[i]),
          rune_addr: pos[i]?.rune_address ? pos[i]?.rune_address : undefined,
          asset_addr: pos[i]?.asset_address ? pos[i]?.asset_address : undefined,
          rune_add: pos[i]?.rune_deposit_value ? pos[i]?.rune_deposit_value / 10 ** 8 : 'Not Added',
          asset_add: pos[i]?.asset_deposit_value ? pos[i]?.asset_deposit_value / 10 ** 8 : 'Not Added',
          last_add_height: pos[i]?.last_add_height ? pos[i]?.last_add_height : ' '
        })
      }
    },
    formatNumber (number) {
      return this.$options.filters.number(number, '0,0.0000')
    },
    formatBlock (number) {
      return this.$options.filters.number(number, '0,0')
    }
  }
}
</script>

<style lang="scss" scoped>
.lp-container {
  border: none;
  padding: 0;
}
</style>
