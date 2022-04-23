<template>
  <div class="vaults-container">
    <template v-if="yggdrasil.length > 0">
      <vue-good-table
        v-if="cols && yggdrasil.length > 0"
        :columns="cols"
        :rows="[...asgard, ...yggdrasil]"
        styleClass="vgt-table net-table vgt-compact"
        :pagination-options="{
          enabled: true,
          perPage: 120,
          perPageDropdownEnabled: false,
        }"
      >
        <template slot="table-row" slot-scope="props">
          <span v-if="props.column.field == 'hash'" @click="gotoAddr(props.row.hash)">
            <span class="mono clickable" v-tooltip="props.row.hash">
              {{props.row.hash.slice(0,8)}}...{{props.row.hash.slice(-8)}}
            </span> 
          </span>
          <span v-else-if="props.column.field == 'bond'">
            <span class="mono" v-if="props.row.bond" v-tooltip="curFormat(runePrice * props.row.bond)">
              <span class="extra">{{runeCur()}}</span>  
              {{numberFormat(props.row.bond)}}
            </span> 
            <span v-else>
              -
            </span>
          </span>
          <span v-else-if="props.column.field == 'total_value'">
            <span class="mono" v-if="props.row.total_value" v-tooltip="curFormat(runePrice * props.row.total_value)">
              <span class="extra">{{runeCur()}}</span>  
              {{numberFormat(props.row.total_value)}}
            </span> 
            <span v-else>
              -
            </span>
          </span>
          <span v-else-if="props.column.field == 'type'">
            <div :class="['bubble-container', {'blue': props.row.type == 'Yggdrasil'}]">
              <span>{{props.row.type}}</span>
            </div>
          </span>
          <span v-else-if="props.column.field == 'status'">
            <div :class="['bubble-container', {'yellow': props.row.status == 'Standby'}]">
              <span>{{props.row.status}}</span>
            </div>
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
          field: 'bond',
          type: 'number'
        },
        {
          label: 'Total Vaule',
          field: 'total_value',
          type: 'number'
        },
        {
          label: 'Ins',
          field: 'ins',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono'
        },
        {
          label: 'Outs',
          field: 'outs',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono'
        }
      ],
      yggdrasil: [],
      asgard: []
    }
  },
  mounted() {
    this.$api.getYggdrasil().then(res => {
      this.yggdrasil = this.formatVaults(res?.data, 'Yggdrasil');
    }).catch(e => {
      console.error(e);
    })

    this.$api.getAsgard().then(res => {
      this.asgard = this.formatVaults(res?.data, 'Asgard');
    }).catch(e => {
      console.error(e);
    })
  },
  methods: {
    formatStatus(status) {
      if (status === 'ActiveVault') {
        return 'Active'
      }
      return status
    },
    formatVaults(data, type='Yggdrasil') {
      let y = []
      for(let vault of data) {
        y.push({
          hash: vault.addresses.find(e => e.chain === 'THOR').address,
          type: type,
          status: this.formatStatus(vault.status),
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