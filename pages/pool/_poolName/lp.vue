<template>
  <div>
    <div v-if="!loading && !error" class="base-container lp-container">
      <vue-good-table
        v-if="cols && rows.length > 0"
        :columns="cols"
        :rows="rows"
        styleClass="vgt-table net-table vgt-compact"
        :pagination-options="{
          enabled: true,
          perPage: 30,
          perPageDropdownEnabled: false,
        }"
      />
    </div>
    <div v-if="loading">
      <BounceLoader color="var(--font-color)" size="3rem"/>
    </div>
    <div v-if="error" class="base-container">
      <span>Can't fetch the pool LPs</span>
    </div>
  </div>
</template>

<script>
import BounceLoader from 'vue-spinner/src/BounceLoader.vue';

export default {
  components: {
    BounceLoader,
  },
  data() {
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
          field: 'rune_addr'
        },
        {
          label: 'Asset address',
          field: 'asset_addr'
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
  async asyncData({ params }) {
    return { poolName: params.poolName };
  },
  mounted() {
    this.$api.getLpPositions(this.$route.params.poolName).then(res => {
      this.lpPositions = this.formatLP(res?.data);
    }).catch(e => {
      this.error = true
      console.error(e);
    })
    .finally(() => {
      this.loading = false;
    })
  },
  methods: {
    checkPostion(position) {
      let pos = ''
      if ('asset_address' in position)
        pos = 'Asymmetrical Asset'
      if ('rune_address' in position)
        pos = 'Asymmetrical Rune'
      if ('asset_address' in position && 'rune_address' in position)
        pos = 'Symmetrical'
      return pos
    },
    formatLP(pos) {
      for(let i in pos) {
        this.rows.push({
          position: this.checkPostion(pos[i]),
          rune_addr: pos[i]?.rune_address? this.formatAddress(pos[i]?.rune_address):'Not Assigned',
          asset_addr: pos[i]?.asset_address? this.formatAddress(pos[i]?.asset_address):'Not Assigned',
          rune_add: pos[i]?.rune_deposit_value? pos[i]?.rune_deposit_value/10**8:'Not Added',
          asset_add: pos[i]?.asset_deposit_value? pos[i]?.asset_deposit_value/10**8:'Not Added',
          last_add_height: pos[i]?.last_add_height? pos[i]?.last_add_height:' '
        })
      }
    },
    formatAddress(address, length=6) {
      return `${address.slice(0, length)}...${address.slice(-1*length)}`
    },
    formatNumber(number) {
      return this.$options.filters.number(number, '0,0.00')
    },
    formatBlock(number) {
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