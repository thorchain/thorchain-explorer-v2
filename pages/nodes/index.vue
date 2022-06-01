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
      <Nav :activeMode.sync="mode" :navItems="[{text: 'Active', mode: 'active'}, {text: 'Stand By', mode: 'standby'}]" />
      <div v-if="mode == 'active'" class="base-container">
        <h2>Active Nodes</h2>
        <vue-good-table
          v-if="activeCols && activeNodes.length > 0"
          :columns="activeCols"
          :rows="activeNodes"
          @on-row-click="gotoNode"
          styleClass="vgt-table net-table"
          :pagination-options="{
            enabled: true,
            perPage: 50,
            perPageDropdownEnabled: false,
          }"
        >
          <template slot="table-row" slot-scope="props">
            <span class="clickable" v-if="props.column.field == 'address'">
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
          styleClass="vgt-table net-table"
          :pagination-options="{
            enabled: true,
            perPage: 50,
            perPageDropdownEnabled: false,
          }"
        >
          <template slot="table-row" slot-scope="props">
            <span class="clickable" v-if="props.column.field == 'address'">
              <span v-if="props.row.address" v-tooltip="props.row.address">{{addressFormat(props.row.address)}}</span> 
              <span v-else class="not-clickable">No Address Set</span>
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
      <BounceLoader color="var(--font-color)" size="3rem"></BounceLoader>
    </div>
  </div>
</template>

<script>
import {bondMetrics, nodesQuery} from "~/_gql_queries";
import BounceLoader from 'vue-spinner/src/BounceLoader.vue';
import { mapGetters } from 'vuex';
import { addressFormat, fillNodeData } from '~/utils';
import { AssetCurrencySymbol } from '@xchainjs/xchain-util';
import _ from 'lodash';

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
      if (t.row.address)
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
    },
    calAverageBond() {
      return _.mean(this.bondMetrics?.standbyBonds.filter(b => b >= this.minBond))/10**8;
    },
    calMinBond() {
      return _.min(this.bondMetrics?.standbyBonds.filter(b => b >= this.minBond))/10**8;
    },
    calMedianBond() {
      const eNodes = this.bondMetrics?.standbyBonds.filter(b => b >= this.minBond)
      return eNodes.sort((a, b) => +a - +b)[Math.floor(eNodes.length / 2)]/10**8; 
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
          type: 'text',
          sortFn: this.versionSort
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
      ],
      minBond: 30000000000000,
      lastBlockHeight: undefined
    }
  },
  mounted() {
    this.$api.getMimir().then(res => {
      this.minBond = +res.data.MINIMUMBONDINRUNE;
    }).catch(e => {
      console.error(e);
    })

    this.$api.getLastBlockHeight().then(res => {
      this.lastBlockHeight = res.data;
    }).catch(e => {
      console.error(e);
    })
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice'
    }),
    activeCols: function() {
      return [
        ...this.cols,
        // Commenting these because it's not yet implemented.
        // {
        //   label: 'BTC',
        //   field: 'BTC',
        //   type: 'number',
        //   formatFn: this.numberFormat,
        //   tdClass: 'mono'
        // },
        // {
        //   label: 'BCH',
        //   field: 'BCH',
        //   type: 'number',
        //   formatFn: this.numberFormat,
        //   tdClass: 'mono'
        // },
        // {
        //   label: 'LTC',
        //   field: 'LTC',
        //   type: 'number',
        //   formatFn: this.numberFormat,
        //   tdClass: 'mono'
        // },
        // {
        //   label: 'ETH',
        //   field: 'ETH',
        //   type: 'number',
        //   formatFn: this.numberFormat,
        //   tdClass: 'mono'
        // },
        // {
        //   label: 'BNB',
        //   field: 'BNB',
        //   type: 'number',
        //   formatFn: this.numberFormat,
        //   tdClass: 'mono'
        // },
        // {
        //   label: 'DOGE',
        //   field: 'DOGE',
        //   type: 'number',
        //   formatFn: this.numberFormat,
        //   tdClass: 'mono'
        // },
        // {
        //   label: 'TERRA',
        //   field: 'TERRA',
        //   type: 'number',
        //   formatFn: this.numberFormat,
        //   tdClass: 'mono'
        // }
      ]
    },
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
            name: 'Total Node Count',
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
            value: this.calAverageBond(),
            usdValue: true
          },
          {
            name: 'Total Node Count',
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
            value: this.calMedianBond(),
            usdValue: true
          },
          {
            name: 'Minimum Bond',
            value: this.calMinBond(),
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
          fillNodeData(filteredNodes, el);
          if (this.lastBlockHeight) {
            this.lastBlockHeight.forEach(chain => {
              filteredNodes[chain.chain] = 
                chain
            })
          }
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
.grid-network {
  margin-bottom: 1rem;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  grid-gap: .5rem;
  gap: .5rem;
}

.extra {
  font-size: .7rem;
}
</style>