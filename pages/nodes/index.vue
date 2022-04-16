<template>
  <div class="nodes-wrapper">
      <div v-if="nodesQuery && nodesQuery.nodes" class="nodes-container">
        <div class="grid-network">
        <div>
          <stat-table :tableSettings="topActiveBonds" header="Top Active Bonds"></stat-table>
        </div>
        <div>
          <stat-table :tableSettings="topStandbyBonds" header="Top Standby Bonds"></stat-table>
        </div>
      </div>
      <div class="nav-headers">
        <div class="nav-item" @click="mode = 'active'" :class="{'active': mode == 'active'}">Active</div>
        <div class="nav-item" @click="mode = 'standby'" :class="{'active': mode == 'standby'}">Stand By</div>
      </div>
      <div v-if="mode == 'active'" class="base-container">
        <h2>Active Nodes</h2>
        <vue-good-table
          v-if="cols && activeNodes.length > 0"
          :columns="cols"
          :rows="activeNodes"
          @on-row-click="gotoNode"
          styleClass="vgt-table net-table vgt-compact"
          :pagination-options="{
            enabled: true,
            perPage: 50,
            perPageDropdownEnabled: false,
          }"
        >
          <template slot="table-row" slot-scope="props">
            <span v-if="props.column.field == 'address'">
              <span v-tooltip="props.row.address">{{addressFormat(props.row.address)}}</span> 
            </span>
            <span v-else-if="props.column.field == 'bond'">
              <span v-tooltip="curFormat(runePrice * props.row.bond)">
                <span class="extra">{{runeCur()}}</span>  
                {{numberFormat(props.row.bond)}}
              </span> 
            </span>
            <span v-else-if="props.column.field == 'award'">
              <span v-tooltip="curFormat(runePrice * props.row.award)">
                <span class="extra">{{runeCur()}}</span>  
                {{props.row.award}}
              </span> 
            </span>
            <span v-else-if="props.column.field == 'status'">
              <div :class="'bubble-container'">
                <span>{{props.row.status}}</span>
              </div>
            </span>
            <span v-else>
              {{props.formattedRow[props.column.field]}}
            </span>
          </template>
        </vue-good-table>
      </div>
      <div v-else-if="mode === 'standby'" class="base-container">
        <h2>Standby Nodes</h2>
        <vue-good-table
          v-if="cols && standbyNodes.length > 0"
          :columns="cols"
          :rows="standbyNodes"
          @on-row-click="gotoNode"
          styleClass="vgt-table net-table vgt-compact"
          :pagination-options="{
            enabled: true,
            perPage: 50,
            perPageDropdownEnabled: false,
          }"
        >
          <template slot="table-row" slot-scope="props">
            <span v-if="props.column.field == 'address'">
              <span v-tooltip="props.row.address">{{addressFormat(props.row.address)}}</span> 
            </span>
            <span v-else-if="props.column.field == 'bond'">
              <span v-tooltip="curFormat(runePrice * props.row.bond)">
                <span class="extra">{{runeCur()}}</span>  
                {{numberFormat(props.row.bond)}}
              </span> 
            </span>
            <span v-else-if="props.column.field == 'award'">
              <span v-tooltip="curFormat(runePrice * props.row.award)">
                <span class="extra">{{runeCur()}}</span>  
                {{props.row.award}}
              </span> 
            </span>
            <span v-else-if="props.column.field == 'status'">
              <div :class="['bubble-container yellow', {
                'red': props.row.status === 'Disabled',
                'black': props.row.status === 'Unknown',
                'white': props.row.status === 'Whitelisted',
              }]">
                <span>{{props.row.status}}</span>
              </div>
            </span>
            <span v-else>
              {{props.formattedRow[props.column.field]}}
            </span>
          </template>
        </vue-good-table>
      </div>
    </div>
    <div v-else class="loading">
      <BounceLoader color="#9F9F9F" size="3rem"></BounceLoader>
    </div>
  </div>
</template>

<script>
import {bondMetrics, nodesQuery} from "~/_gql_queries";
import BounceLoader from 'vue-spinner/src/BounceLoader.vue';
import { mapGetters } from 'vuex';
import { addressFormat, curFormat, fillNodeData, numberFormat } from '~/utils';
import { AssetCurrencySymbol } from '@xchainjs/xchain-util';

export default {
  name: "nodesPage",
  components: {
    BounceLoader
  },
  apollo: {
    nodesQuery: {
      query: nodesQuery,
      update(data) {
        return data;
      },
    },
    bondMetrics: bondMetrics,
  },
  methods: {
    gotoNode(t) {
      this.$router.push({path: `/node/${t.row.address}`});
    },
    numberFormat(number) {
      return this.$options.filters.number(number, '0,0')
    },
    addressFormat(string) {
      return addressFormat(string)
    },
    runeCur() {
      return AssetCurrencySymbol.RUNE
    },
    curFormat(number) {
      return this.$options.filters.currency(number)
    }
  },
  data: function() {
    return {
      mode: 'active',
      cols: [
        {
          label: 'Address',
          field: 'address',
          formatFn: addressFormat,
          tdClass: 'mono'
        },
        {
          label: 'IP',
          field: 'ip',
          sortable: false,
        },
        {
          label: 'Flag',
          field: 'status'
        },
        {
          label: 'Version',
          field: 'version',
          type: 'number'
        },
        {
          label: 'Slash Point',
          field: 'slash',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono'
        },
        {
          label: 'Current Award',
          field: 'award',
          type: 'number',
          tdClass: 'mono'
        },
        {
          label: 'Bond',
          field: 'bond',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono'
        }
      ]
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice'
    }),
    topActiveBonds: function() {
      return [
        [
          {
            name: 'Total Bond',
            value: ((this.bondMetrics?.bondMetrics?.active?.totalBond ?? 0)/10**8),
            usdValue: true
          },
          {
            name: 'Average Bond',
            value: ((this.bondMetrics?.bondMetrics?.active?.averageBond ?? 0)/10**8),
            usdValue: true
          },
          {
            name: 'Total Node Cound',
            value: this.bondMetrics?.activeNodeCount
          }
        ],
        [
          {
            name: 'Maximum Bond',
            value: Math.floor(Math.floor((Number.parseInt(this.bondMetrics?.bondMetrics?.active?.maximumBond) ?? 0)/10**8)),
            usdValue: true
          },
          {
            name: 'Median Bond',
            value: Math.floor((Number.parseInt(this.bondMetrics?.bondMetrics?.active?.medianBond) ?? 0)/10**8),
            usdValue: true
          },
          {
            name: 'Minimum Bond',
            value: Math.floor((Number.parseInt(this.bondMetrics?.bondMetrics?.active?.minimumBond) ?? 0)/10**8),
            usdValue: true
          }
        ]
      ]
    },
    topStandbyBonds: function() {
      return [
        [
          {
            name: 'Total Bond',
            value: ((this.bondMetrics?.bondMetrics?.standby?.totalBond ?? 0)/10**8),
            usdValue: true
          },
          {
            name: 'Average Bond',
            value: ((this.bondMetrics?.bondMetrics?.standby?.averageBond ?? 0)/10**8),
            usdValue: true
          },
          {
            name: 'Total Node Cound',
            value: this.bondMetrics?.standbyNodeCount
          }
        ],
        [
          {
            name: 'Maximum Bond',
            value: Math.floor((Number.parseInt(this.bondMetrics?.bondMetrics?.standby?.maximumBond) ?? 0)/10**8),
            usdValue: true
          },
          {
            name: 'Median Bond',
            value: Math.floor((Number.parseInt(this.bondMetrics?.bondMetrics?.standby?.medianBond) ?? 0)/10**8),
            usdValue: true
          },
          {
            name: 'Minimum Bond',
            value: Math.floor((this.bondMetrics?.bondMetrics?.standby?.minimumBond)/10**8).toString(),
            usdValue: true
          }
        ]
      ]
    },
    activeNodes: function () {
      if (this.nodesQuery) {
        const actNodes = this.nodesQuery.nodes?.filter(
          (e) => e.status === "Active"
        );
        let filteredNodes = [];
        actNodes.forEach((el) => {
          fillNodeData(filteredNodes, el)
        });
        return filteredNodes;
      } else {
        return [];
      }
    },
    standbyNodes: function () {
      if (this.nodesQuery) {
        const actNodes = this.nodesQuery.nodes?.filter(
          (e) => e.status !== "Active"
        );
        let filteredNodes = [];
        actNodes.forEach((el) => {
          fillNodeData(filteredNodes, el)
        });
        return filteredNodes;
      } else {
        return [];
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.nodes-wrapper {
  display: flex;
  justify-content: center;

  .nodes-container {
    flex: 1 0;
  }
}

.grid-network {
  margin-bottom: 1rem;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-gap: .5rem;
  gap: .5rem;
}

.extra {
  font-size: .7rem;
}
</style>