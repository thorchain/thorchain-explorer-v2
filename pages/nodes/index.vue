<template>
  <Page>
    <div v-if="nodesQuery" class="grid-network">
      <stat-table :tableSettings="topActiveBonds" header="Top Active Bonds"></stat-table>
      <stat-table :tableSettings="topStandbyBonds" header="Top Standby Bonds"></stat-table>
    </div>
    <Nav :activeMode.sync="mode" :navItems="[{text: 'Active', mode: 'active'}, {text: 'StandBy', mode: 'standby'}]" />
    <KeepAlive>
      <Card title="Active Nodes" v-if="mode == 'active'" :isLoading="!activeNodes">
        <vue-good-table
          v-if="activeCols && activeNodes"
          :columns="activeCols"
          :rows="activeNodes"
          styleClass="vgt-table net-table bordered"
          :pagination-options="{
            enabled: true,
            perPage: 50,
            perPageDropdownEnabled: false,
          }"
          :key="1"
        >
          <template slot="table-column" slot-scope="props">
            <div class="table-asset" v-if="props.column.field.includes('chains')">
              <img class="asset-chain" :src="assetImage(`${props.column.label}.${props.column.label}`)">
            </div>
            <span v-else>
                {{props.column.label}}
            </span>
          </template>
          <template slot="table-row" slot-scope="props">
            <span class="clickable" v-if="props.column.field == 'address'">
              <div class="table-wrapper-row">
                <span v-tooltip="props.row.address" @click="gotoNode(props.row.address)">
                  {{addressFormat(props.row.address)}}
                </span> 
                <template>
                  <StaredIcon v-if="isFav(props.row.address)" class="table-icon" @click="delFav(props.row.address)" style="fill: #FFEE58"></StaredIcon>
                  <StarIcon v-else class="table-icon" @click="addFav(props.row.address)"></StarIcon>
                </template>
                <a style="height: 1rem" :href="gotoNodeUrl(props.row.address)" target="_blank">
                  <NetworkIcon class="table-icon" />
                </a>
                <LinkIcon @click="gotoAddr(props.row.address)" class="table-icon" />
              </div>
            </span>
            <span v-else-if="props.column.field == 'age'">
              <span v-if="props.row.age" style="cursor: pointer;" v-tooltip="props.row.age.text">{{props.row.age.number | number('0,0.00')}}</span>
              <span v-else>-</span>
            </span>
            <span v-else-if="props.column.field == 'isp'">
              <cloud-image v-if="props.row.isp" :name="props.row.isp"></cloud-image>
              <span v-else>-</span>
            </span>
            <span v-else-if="props.column.field == 'location'">
              <div v-tooltip="`${props.row.location.code}, ${props.row.location.region}, ${props.row.location.city}`" class="countries">
                <!-- <span>{{getUnicodeFlagIcon(props.row.location.code)}}</span>  -->
                <VFlag :flag="props.row.location.code"/>
                <span>{{props.row.location.city}}</span>
              </div>
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
            <span v-else-if="props.column.field == 'ip'">
              <div class="table-wrapper-row">
                <span>{{props.row.ip}}</span>
                <Copy :strCopy="props.row.ip" />
              </div>
            </span>
            <span v-else-if="props.column.field == 'providers'">
              <div 
                :id="props.row.providers.length?`popover-${props.row.originalIndex}`:false"
                class="bubble-container gery"
              >
                {{props.row.providers.length}}
              </div>
              <b-popover
                triggers="hover focus"
                :target="`popover-${props.row.originalIndex}`"
                customClass="cutsom-popover"
              >
                <div class="title" style="margin-bottom: 5px;">
                  <strong>Providers</strong>
                </div>
                <div class="popover-table" v-for="(p,i) in props.row.providers" :key="i">
                  <span class="clickable" @click="gotoAddr(p.bond_address)">
                    {{addressFormat(p.bond_address)}}
                  </span>
                  <span class="text">
                    {{(p.bond/10**8)/(props.row.bond) | percent}}
                  </span>
                  <div style="justify-content: end;" class="text">
                    <span class="extra">{{runeCur()}}</span>  
                    {{numberFormat(p.bond/10**8)}}
                  </div>
                </div>
              </b-popover>
            </span>
            <span v-else-if="props.column.field.includes('chains.')">
              <span v-if="props.formattedRow[props.column.field] == 0" style="color: #81C784;">OK</span> 
              <span v-else style="color: #EF5350;">-{{props.formattedRow[props.column.field]}}</span>
            </span>
            <span v-else>
              {{props.formattedRow[props.column.field]}}
            </span>
          </template>
        </vue-good-table>
      </Card>
      <Card v-else-if="mode === 'standby'" title="Standby Nodes" :isLoading="!standbyNodes">
        <vue-good-table
          v-if="cols && standbyNodes"
          :columns="cols"
          :rows="standbyNodes"
          styleClass="vgt-table net-table bordered"
          :pagination-options="{
            enabled: true,
            perPage: 50,
            perPageDropdownEnabled: false,
          }"
          :sort-options="{
            enabled: true,
            initialSortBy: {field: 'bond', type: 'desc'}
          }"
          :key="2"
        >
          <template slot="table-row" slot-scope="props">
            <span class="clickable" v-if="props.column.field == 'address'">
              <div class="table-wrapper-row" v-if="props.row.address">
                <span v-tooltip="props.row.address" @click="gotoNode(props.row.address)">{{addressFormat(props.row.address)}}</span>
                <a style="height: 1rem" :href="gotoNodeUrl(props.row.address)" target="_blank">
                  <NetworkIcon class="table-icon" />
                </a>
                <LinkIcon @click="gotoAddr(props.row.address)" class="table-icon" />
              </div> 
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
            <span v-else-if="props.column.field == 'ip'">
              <div v-if="props.row.ip" class="table-wrapper-row">
                <span>{{props.row.ip}}</span>
                <Copy :strCopy="props.row.ip" />
              </div>
              <div v-else></div>
            </span>
            <span v-else>
              {{props.formattedRow[props.column.field]}}
            </span>
          </template>
        </vue-good-table>
      </Card>
    </KeepAlive>
  </Page>
</template>

<script>
import {bondMetrics} from "~/_gql_queries";
import { mapGetters } from 'vuex';
import { addressFormat, fillNodeData, observeredChains } from '~/utils';
import { AssetCurrencySymbol } from '@xchainjs/xchain-util';
import _ from 'lodash';
import NetworkIcon from '@/assets/images/chart-network.svg?inline';
import LinkIcon from '@/assets/images/link.svg?inline';
import StarIcon from '@/assets/images/star.svg?inline';
import StaredIcon from '@/assets/images/stared.svg?inline';

export default {
  name: "nodesPage",
  components: {
    NetworkIcon,
    LinkIcon,
    StarIcon,
    StaredIcon
  },
  apollo: {
    bondMetrics: bondMetrics,
  },
  methods: {
    gotoNode(address) {
      if (address === typeof String)
        this.$router.push({path: `/node/${address}`});
    },
    numberFormat(number) {
      return this.$options.filters.number(number, '0,0')
    },
    addressFormat(string) {
      return addressFormat(string, 4, true)
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
      return eNodes?.sort((a, b) => +a - +b)[Math.floor(eNodes.length / 2)]/10**8; 
    },
    pSort(x, y, col, rowX, rowY) {
      return (x?.length > y?.length)
    },
    cSort(x, y, col, rowX, rowY) {
      return (x.code > y.code)
    },
    aSort(x, y, col, rowX, rowY) {
      return (x.number > y.number)
    },
    getUnicodeFlagIcon(name) {
      return getUnicodeFlagIcon(name)
    },
    isFav(address) {
      if (this.favNodes && this.favNodes.includes(address)) {
        return true
      }
      return false
    },
    addFav(address) {
      let favNodes;
      try {
        favNodes = this.favNodes || [];
      }
      catch (e) {
        this.favNodes = [];
      }
      
      if (address) {
        this.favNodes = [...favNodes, address];
      }
    },
    delFav(address) {
      let favNodes = this.favNodes;
      _.remove(favNodes, (n) => {
        return n == address;
      });
      this.favNodes = [...favNodes];
    }
  },
  data: function() {
    return {
      mode: 'active',
      nodesQuery: undefined,
      popoverText: 'Test',
      nodesExtra: undefined,
      cols: [
        {
          label: 'Address',
          field: 'address',
          formatFn: this.addressFormat,
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
        },
      ],
      minBond: 30000000000000,
      lastBlockHeight: undefined,
      churnInterval: undefined,
      localFavNodes: undefined,
    }
  },
  mounted() {
    this.$api.getMimir().then(res => {
      this.minBond = +res.data.MINIMUMBONDINRUNE;
      this.churnInterval = +res.data.CHURNINTERVAL;
    }).catch(e => {
      console.error(e);
    })

    // this.$api.getLastBlockHeight().then(res => {
    //   this.lastBlockHeight = res.data;
    // }).catch(e => {
    //   console.error(e);
    // })
    
    this.$api.getRPCLastBlockHeight()
    .then(res => {
      this.lastBlockHeight = +res?.data?.block?.header?.height;
    })
    .catch(error => {
      console.error(error)
    })

    this.$api.getNodes().then(({data}) => {
      this.nodesQuery = data;
    })

    this.$api.getExraNodesInfo().then(({data}) => {
      this.nodesExtra = data;
    })
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice'
    }),
    activeCols: function() {
      return [
        this.cols[0],
        {
          label: 'Age',
          field: 'age',
          type: 'number',
          tdClass: 'center',
          thClass: 'center',
          sortFn: this.aSort,
          formatFn: this.numberFormat,
        },
        {
          label: 'ISP',
          field: 'isp',
          type: 'text',
          hidden: !process.env.SERVER_URL,
          tdClass: 'center',
        },
        {
          label: 'Location',
          field: 'location',
          hidden: !process.env.SERVER_URL,
          tdClass: 'center',
          sortFn: this.cSort
        },
        ...this.cols.slice(1, 6),
        {

          label: 'Providers',
          field: 'providers',
          type: 'number',
          tdClass: 'mono center clickable',
          width: '100px',
          sortFn: this.pSort
        },
        ...this.cols.slice(-1),
        {
          label: 'Score',
          field: 'score',
          type: 'number',
          tdClass: 'mono center',
          thClass: 'center',
        },
        {
          label: 'APY',
          field: 'apy',
          type: 'percentage',
          tdClass: 'mono center',
          thClass: 'center',
        },
        {
          label: 'BTC',
          field: 'chains.BTC',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono center',
          thClass: 'center'
        },
        {
          label: 'BCH',
          field: 'chains.BCH',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono center',
          thClass: 'center'
        },
        {
          label: 'LTC',
          field: 'chains.LTC',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono center',
          thClass: 'center'
        },
        {
          label: 'ETH',
          field: 'chains.ETH',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono center',
        },
        {
          label: 'BNB',
          field: 'chains.BNB',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono center',
          thClass: 'center'
        },
        {
          label: 'DOGE',
          field: 'chains.DOGE',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono center',
          thClass: 'center'
        },
        {
          label: 'TERRA',
          field: 'chains.TERRA',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono center',
          thClass: 'center'
        }
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
        const actNodes = this.nodesQuery?.filter(
          (e) => e.status === "Active"
        );
        let filteredNodes = [];
        let chains = observeredChains(actNodes);
        let ratioReward = (this.churnInterval-(+this.bondMetrics.nextChurnHeight-this.lastBlockHeight))/this.churnInterval;
        actNodes.forEach((el) => {
          fillNodeData(
            filteredNodes,
            el,
            chains,
            this.nodesExtra,
            this.lastBlockHeight,
            ratioReward,
            this.churnInterval
          );
          // if (this.lastBlockHeight) {
          //   this.lastBlockHeight.forEach(chain => {
          //     filteredNodes[chain.chain] = 
          //       chain
          //   })
          // }
        });
        if (this.favNodes) {
          let favNodesFilter = filteredNodes.filter((n) => this.favNodes.includes(n.address));
          let nonFavNodesFilter = filteredNodes.filter((n) => !this.favNodes.includes(n.address));
          return [...favNodesFilter, ...nonFavNodesFilter];
        }
        return filteredNodes;
      } else {
        return undefined;
      }
    },
    standbyNodes: function () {
      if (this.nodesQuery) {
        const actNodes = this.nodesQuery?.filter(
          (e) => e.status !== "Active"
        );
        let filteredNodes = [];
        actNodes.forEach((el) => {
          fillNodeData(filteredNodes, el)
        });
        filteredNodes.sort((a,b) => {
          return b.bond - a.bond
        })
        return filteredNodes;
      } else {
        return undefined;
      }
    },
    favNodes: {
      set(array) {
        this.localFavNodes = array;
        localStorage.setItem('FavNodes', JSON.stringify(array));
      },
      get() {
        if (process.browser) {
          return this.localFavNodes ?? JSON.parse(localStorage.getItem('FavNodes'));
        }
      }
    }
  },
};
</script>

<style lang="scss" scoped>
.grid-network {
  margin-bottom: 1rem;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  grid-gap: .5rem;
  gap: .5rem;
}

.extra {
  font-size: .7rem;
}

.popover-table {
  display: flex;
  justify-content: space-between;
  gap: 20px;

  > * {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 5px;
  }
  
  .text {
    color: var(--font-color);
  }
}

.asset-chain {
  height: 1.2rem;
  border-radius: 50%;
}

.countries {
  display: flex;
  cursor: pointer;
  gap: 10px;
  align-items: center;
}
</style>