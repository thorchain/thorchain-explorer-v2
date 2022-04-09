<template>
  <div class="vaults-container">
    <template v-if="yggdrasil.length > 0">
      <vue-good-table
        v-if="cols && yggdrasil.length > 0"
        :columns="cols"
        :rows="yggdrasil"
        styleClass="vgt-table net-table vgt-compact"
        :pagination-options="{
          enabled: true,
          perPage: 100,
          perPageDropdownEnabled: false,
        }"
      >
        <template slot="table-row" slot-scope="props">
          <span v-if="props.column.field == 'bond'">
            <span v-tooltip="curFormat(runePrice * props.row.bond)">
              <span class="extra">{{runeCur()}}</span>  
              {{numberFormat(props.row.bond)}}
            </span> 
          </span>
          <span v-else-if="props.column.field == 'total_value'">
            <span v-tooltip="curFormat(runePrice * props.row.total_value)">
              <span class="extra">{{runeCur()}}</span>  
              {{numberFormat(props.row.total_value)}}
            </span> 
          </span>
        </template>
      </vue-good-table>
    </template>
    <div v-else class="loading">
      <BounceLoader color="#9F9F9F" size="3rem"></BounceLoader>
    </div>
  </div>
</template>

<script>
import { runeCur } from '~/utils';
import { mapGetters } from 'vuex';
import BounceLoader from 'vue-spinner/src/BounceLoader.vue';

export default {
  components: {
    BounceLoader
  },
  data: function() {
    return {
      cols: [
        {
          label: 'Hash',
          field: 'hash'
        },
        {
          label: 'Type',
          field: 'type'
        },
        {
          label: 'Status',
          field: 'status'
        },
        {
          label: 'Bond',
          field: 'bond'
        },
        {
          label: 'Total Vaule',
          field: 'total_value'
        },
        {
          label: 'Ins',
          field: 'ins',
          type: 'number'
        },
        {
          label: 'Outs',
          field: 'outs',
          type: 'number'
        }
      ],
      yggdrasil: []
    }
  },
  mounted() {
    this.$api.getYggdrasil().then(res => {
      this.yggdrasil = this.formatYggdrasil(res?.data);
    }).catch(e => {
      console.error(e);
    })
  },
  methods: {
    formatYggdrasil(data) {
      let y = []
      for(let vault of data) {
        y.push({
          hash: vault.addresses.find(e => e.chain === 'THOR').address,
          type: 'Yggdrasil',
          status: vault.status,
          ins: vault.inbound_tx_count,
          bond: +vault.bond / 10**8,
          total_value: +vault.total_value / 10**8,
          outs: vault.outbound_tx_count
        })
      }
      return y
    },
    runeCur() {
      return runeCur()
    },
    curFormat(number) {
      return this.$options.filters.currency(number)
    },
    numberFormat(number) {
      return this.$options.filters.number(number, '0,0')
    },
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice'
    }),
  }
}
</script>

<style>

</style>