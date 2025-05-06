<template>
  <Page>
    <div class="grid-network">
      <card
        v-if="isMainnet()"
        :is-loading="!reserveHistory"
        title="Reserve Breakdown"
        :img-src="require('@/assets/images/signal.svg')"
        :img-style="{
          width: '36px',
          height: '36px',
        }"
      >
        <VChart
          :option="reserveHistory"
          :loading="!reserveHistory"
          :loading-options="showLoading"
          :theme="chartTheme"
          :autoresize="true"
        />
      </card>
      <Card>
        <info-card :options="allocations" :inner="true" />
        <pie-chart
          :pie-data="allocationPie"
          :extra-series="extraSeries"
          :extra="extra"
          :click="navigatePie"
        />
      </Card>
    </div>
    <div class="grid-network">
      <card>
        <info-card :options="networkOverview" :inner="true" />
      </card>
      <card
        title="THORChain version upgrade progress"
        :img-src="require('@/assets/images/time.svg')"
        :img-style="{
          width: '36px',
          height: '36px',
        }"
      >
        <ProgressBar
          v-if="versionProgress"
          :width="versionProgress"
          color="linear-gradient(to right, #00c0ff, #00ff9f)"
        />
        <h3 style="text-align: center">
          <span class="sec-color">{{
            uptodateNodes ? uptodateNodes.length : '*'
          }}</span>
          of
          <span class="sec-color">{{
            activeNodes ? activeNodes.length : '*'
          }}</span>
          nodes upgraded to
          <span class="sec-color">{{
            activeNodes ? uptodateNodeVersion(activeNodes) : '*'
          }}</span>
        </h3>
        <p
          v-if="
            newStandByVersion || (uptodateNodes && uptodateNodes.length == 1)
          "
          style="text-align: center; color: var(--primary-color)"
        >
          ✨ New version detected! ({{
            newStandByVersion || uptodateNodeVersion(activeNodes)
          }})
        </p>
        <p v-if="versionProgress === 100" class="version-progress">
          All nodes are updated to the latest.
          <Checkmark class="checkmark" />
        </p>
      </card>
    </div>

    <card class="chain-status">
      <TableLoader v-if="loading" :cols="cols" :rows="Array(10).fill({})" />
      <vue-good-table
        v-else
        :columns="cols"
        :rows="inboundInfo"
        style-class="vgt-table net-table"
        :sort-options="{ enabled: false }"
      >
        <template slot="table-row" slot-scope="props">
          <div v-if="props.column.field == 'chain'" class="chain-col">
            <asset-icon :asset="baseChainAsset(props.row.chain)" />
            <span>
              {{ props.formattedRow[props.column.field] }}
            </span>
          </div>
          <template v-else-if="props.column.field === 'gas_rate'">
            {{ props.formattedRow[props.column.field] }}
            {{ props.row.gas_rate_units }}
          </template>

          <template v-else-if="props.column.field === 'outbound_fee'">
            {{ props.formattedRow[props.column.field] }}
          </template>
          <template v-else-if="props.column.field === 'outbound_tx_size'">
            {{ props.formattedRow[props.column.field] }}
          </template>
          <template v-else-if="props.column.field === 'dust_threshold'">
            {{ props.formattedRow[props.column.field] }}
          </template>
          <template v-else-if="props.column.field === 'last_observed_in'">
            {{ props.formattedRow[props.column.field] }}
          </template>
          <template v-else>
            <template v-if="props.row[props.column.field] > 1">
              <danger-icon
                v-tooltip="`Scheduled halt: ${props.row[props.column.field]}`"
                class="table-icon"
                style="fill: var(--red)"
              />
            </template>
            <template v-else-if="props.row[props.column.field] == 1">
              <danger-icon
                v-tooltip="`Mimir halt`"
                class="table-icon"
                style="fill: var(--red)"
              />
            </template>
            <span v-else class="mono" style="color: var(--green)">OK</span>
          </template>
        </template>
      </vue-good-table>
    </card>
  </Page>
</template>

<script>
import { gt, rsort, valid } from 'semver'
import { mapGetters } from 'vuex'

import moment from 'moment'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'

import VChart from 'vue-echarts'

import Checkmark from '~/assets/images/check-mark.svg?inline'
import DangerIcon from '@/assets/images/danger.svg?inline'
import { blockTime } from '~/utils'
import endpoints from '~/api/endpoints'

use([
  SVGRenderer,
  GridComponent,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
])

export default {
  components: {
    DangerIcon,
    Checkmark,
    VChart,
  },
  data() {
    return {
      loading: true,
      network: [],
      rune: [],
      lastblock: undefined,
      thorNetwork: undefined,
      blockchainVersion: undefined,
      nodes: undefined,
      activeNodes: undefined,
      uptodateNodes: undefined,
      thorVersion: undefined,
      inboundInfo: undefined,
      metaReserve: undefined,
      reserveHistory: undefined,
      networkAllocations: undefined,
      extraSeries: {
        center: ['55%', '50%'],
        radius: ['40%', '70%'],
        nodeClick: 'link',
        label: {
          formatter: (a) => {
            return `${a.name}: ${this.$options.filters.number(a?.data?.value, '0,0a')} RUNE`
          },
          distanceToLabelLine: 5,
          fontFamily: 'Montserrat',
        },
      },
      inAddresses: [],
      cols: [
        {
          label: 'Chain',
          field: 'chain',
          type: 'text',
        },
        {
          label: 'Scanning',
          field: 'haltHeight',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono center',
          thClass: 'th-center monitor-cell',
        },
        {
          label: 'Trading',
          field: 'haltTradingHeight',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono center',
          thClass: 'th-center monitor-cell',
        },
        {
          label: 'LP',
          field: 'haltLPHeight',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono center',
          thClass: 'th-center monitor-cell',
        },
        {
          label: 'Signing',
          field: 'haltSigningHeight',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono center',
          thClass: 'th-center monitor-cell',
        },
        {
          label: 'Observed Height',
          field: 'last_observed_in',
          type: 'number',
          formatFn: this.normalFormat,
          tdClass: 'mono center',
          thClass: 'th-center',
        },
        {
          label: 'Fee Rate',
          field: 'gas_rate',
          type: 'number',
          formatFn: this.normalFormat,
          tdClass: 'mono center',
          thClass: 'th-center',
        },
        {
          label: 'Outbound Fee',
          field: 'outbound_fee',
          type: 'number',
          formatFn: (v) => `${v / 1e8}`,
          tdClass: 'mono center',
          thClass: 'th-center',
        },
        {
          label: 'Outbound Tx size',
          field: 'outbound_tx_size',
          type: 'number',
          formatFn: this.normalFormat,
          tdClass: 'mono center',
          thClass: 'th-center',
        },
        {
          label: 'Dust Threshold',
          field: 'dust_threshold',
          type: 'number',
          formatFn: (v) => `${v / 1e8}`,
          tdClass: 'mono center',
          thClass: 'th-center',
        },
      ],
    }
  },
  head: {
    title: 'THORChain Network Explorer | Network',
  },
  computed: {
    ...mapGetters({
      chainsHeight: 'getChainsHeight',
      theme: 'getTheme',
    }),
    extra() {
      return {
        legend: {
          show: true,
          type: 'scroll',
          orient: 'vertical',
          x: 'left',
          y: 'top',
          icon: 'circle',
          textStyle: {
            color: 'var(--font-color)',
          },
        },
        tooltip: {
          formatter: (a) => {
            return `${a.name}: ${this.$options.filters.number(a?.data?.value, '0,0.00a')} RUNE`
          },
        },
      }
    },
    versionProgress() {
      if (!!this.nodes && this.blockchainVersion) {
        return Math.ceil(
          parseFloat(this.uptodateNodes.length / this.activeNodes.length) * 100
        )
      }
      return 1
    },
    networkOverview() {
      let revenueOverview = []
      if (this.isMainnet()) {
        revenueOverview = [
          {
            name: 'Outbound Fee (30D)',
            value: this.metaReserve?.gasFeeOutbound / 1e8,
            filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
            usdValue: true,
          },
          {
            name: 'Network Fee (30D)',
            value: this.metaReserve?.networkFee / 1e8,
            filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
            usdValue: true,
          },
          {
            name: 'Gas Reimbursement (30D)',
            value: this.metaReserve?.gasReimbursement / 1e8,
            filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
            usdValue: true,
          },
        ]
      }

      return [
        {
          title: 'Network Overview',
          rowStart: 1,
          colSpan: 1,
          icon: require('@/assets/images/network.svg'),
          items: [
            {
              name: 'Blockchain Version',
              value: this.blockchainVersion?.current,
            },
            {
              name: 'Version Age',
              value:
                this.chainsHeight?.THOR - this.thorVersion?.next_since_height,
              filter: (v) => blockTime(v, true),
            },
            {
              name: 'TOR Price in RUNE',
              value: this.thorNetwork?.tor_price_in_rune / 1e8,
              filter: (v) =>
                `${this.$options.filters.number(v, '0,0.0000a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'Vaults Migrating',
              value: this.thorNetwork?.vaults_migrating ? 'Yes' : 'No',
            },
            {
              name: 'Effective Security Bond',
              value: this.thorNetwork?.effective_security_bond / 1e8,
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
              usdValue: true,
            },
            ...revenueOverview,
          ],
        },
      ]
    },
    allocationPie() {
      const circulating =
        +this.networkAllocations?.runeSupply -
        +this.network?.totalPooledRune -
        +this.network?.bondMetrics?.totalActiveBond -
        +this.network?.totalReserve -
        +this.networkAllocations?.totalCexs
      const burnt = 50000000000000000 - +this.networkAllocations?.runeSupply
      return [
        {
          name: 'Pooled',
          value: +this.network?.totalPooledRune / 10 ** 8,
        },
        {
          name: 'Bonded',
          value: +this.network?.bondMetrics?.totalActiveBond / 10 ** 8,
        },
        {
          name: 'Reserve',
          value: +this.network?.totalReserve / 10 ** 8,
        },
        {
          name: 'CEXs',
          value: this.networkAllocations?.totalCexs / 10 ** 8,
        },
        {
          name: 'Free',
          value: circulating / 10 ** 8,
        },
        {
          name: 'Burnt/Killed',
          value: burnt / 10 ** 8,
        },
      ]
    },
    allocations() {
      return [
        {
          title: 'Allocations',
          rowStart: 2,
          colSpan: 1,
          icon: require('@/assets/images/allocations.svg'),
          items: [],
        },
      ]
    },
    newStandByVersion() {
      if (!this.blockchainVersion || !this.nodes) {
        return
      }
      const currentVer = this.blockchainVersion.current
      const node = this.nodes
        ?.filter((n) => valid(n.version) && gt(n.version, currentVer))
        .map((n) => n.version)
      if (node && node.length > 0) {
        return rsort(node)[0].version
      }
      return null
    },
  },
  mounted() {
    Promise.allSettled([
      this.$api.getLastBlockHeight(),
      this.$api.getThorNetwork(),
      this.$api.getInboundAddresses(),
      this.$api.getNetworkAllocation(),
      this.$api.getBlockChainVersion(),
      this.$api.getThorVersion(),
      this.$api.getNetwork(),
      this.$api.getNodes(),
      this.$api.getReserveHistory(),
    ])
      .then(async (results) => {
        const [
          lastBlockRes,
          thorNetworkRes,
          inboundAddressesRes,
          networkAllocationsRes,
          blockchainVersionRes,
          thorVersionRes,
          networkRes,
          nodesRes,
          reserveHistoryRes,
        ] = results.map((res) =>
          res.status === 'fulfilled' ? res.value : null
        )

        if (!lastBlockRes || !thorNetworkRes || !inboundAddressesRes) {
          console.warn('One or more required endpoints failed.')
          this.loading = false
          return
        }

        this.lastblock = lastBlockRes.data
        this.thorNetwork = thorNetworkRes.data
        this.inAddresses = inboundAddressesRes.data

        try {
          const mimirData = (await this.$api.getMimir()).data

          this.inboundInfo = inboundAddressesRes.data.map((chain) => ({
            ...chain,
            haltHeight: Math.max(
              ...Object.keys(mimirData)
                .filter(
                  (key) =>
                    (new RegExp(`.*HALT.*${chain.chain}CHAIN`).test(key) ||
                      key === 'HALTCHAINGLOBAL') &&
                    mimirData[key] !== 0
                )
                .map((key) => mimirData[key])
            ),
            haltTradingHeight: Math.max(
              ...Object.keys(mimirData)
                .filter(
                  (key) =>
                    (new RegExp(`HALT${chain.chain}TRADING`).test(key) ||
                      key === 'HALTTRADING') &&
                    mimirData[key] !== 0
                )
                .map((key) => mimirData[key])
            ),
            haltSigningHeight: Math.max(
              ...Object.keys(mimirData)
                .filter(
                  (key) =>
                    (new RegExp(`HALTSIGNING${chain.chain}`).test(key) ||
                      key === 'HALTSIGNING') &&
                    mimirData[key] !== 0
                )
                .map((key) => mimirData[key])
            ),
            haltLPHeight: Math.max(
              ...Object.keys(mimirData)
                .filter(
                  (key) =>
                    new RegExp(`PAUSELP${chain.chain}`).test(key) &&
                    mimirData[key] !== 0
                )
                .map((key) => mimirData[key])
            ),
            last_observed_in:
              this.lastblock?.find((b) => b.chain === chain.chain)
                ?.last_observed_in ?? 0,
          }))
        } catch (error) {
          console.warn('Failed to fetch Mimir data:', error)
        }

        if (networkAllocationsRes)
          this.networkAllocations = networkAllocationsRes.data
        if (blockchainVersionRes)
          this.blockchainVersion = blockchainVersionRes.data
        if (thorVersionRes) this.thorVersion = thorVersionRes.data
        if (networkRes) this.network = networkRes.data
        if (nodesRes) {
          this.nodes = nodesRes.data
          this.activeNodes = this.nodes?.filter((n) => n.status === 'Active')
          this.uptodateNodes = this.activeNodes?.filter(
            (n) => n.version === this.uptodateNodeVersion(this.activeNodes)
          )
        }

        try {
          const rewards = (await this.$api.getEarningHistory()).data
          if (reserveHistoryRes) {
            this.metaReserve = reserveHistoryRes.data?.meta
            this.reserveHistory = this.formatReserve(
              reserveHistoryRes.data,
              rewards
            )
          }
        } catch (error) {
          console.warn('Failed to fetch earning history:', error)
        }

        this.loading = false
      })
      .catch((error) => {
        console.error('An unexpected error occurred:', error)
        this.loading = false
      })
  },
  methods: {
    navigatePie(param) {
      switch (param?.name) {
        case 'Pooled':
          this.$router.push(`/pools`)
          break
        case 'Bonded':
          this.$router.push('/nodes')
          break
        case 'Reserve':
          this.$router.push(
            '/address/' + endpoints[process.env.NETWORK].MODULE_ADDR
          )
          break
        default:
          break
      }
    },
    formatReserve(d, rewards) {
      const xAxis = []
      const pf = []
      const pr = []
      const pn = []
      const pt = []
      const pre = []
      d?.intervals.forEach((interval, index) => {
        // ignore the last index
        if (index === d?.intervals?.length - 1) {
          return
        }
        xAxis.push(
          moment(
            Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format('dddd, MMM D')
        )
        pf.push(+interval.gasFeeOutbound / 10 ** 8)
        pr.push((+interval.gasReimbursement * -1) / 10 ** 8)
        pn.push(+interval.networkFee / 10 ** 8)

        pt.push(
          (+interval.gasFeeOutbound +
            +interval.networkFee -
            +interval.gasReimbursement -
            +rewards?.intervals[index]?.blockRewards) /
            1e8
        )

        pre.push((-1 * rewards?.intervals[index]?.blockRewards) / 1e8)
      })
      return this.basicChartFormat(
        (value) => `${this.normalFormat(value)} RUNE`,
        [
          {
            type: 'bar',
            name: 'Fee outbound',
            stack: 'total',
            showSymbol: false,
            data: pf,
          },
          {
            type: 'bar',
            name: 'Network Fee',
            stack: 'total',
            showSymbol: false,
            data: pn,
          },
          {
            type: 'bar',
            name: 'Gas Reimbursement',
            stack: 'total',
            showSymbol: false,
            data: pr,
          },
          {
            type: 'bar',
            name: 'Reward Emission',
            stack: 'total',
            showSymbol: false,
            data: pre,
          },
          {
            type: 'line',
            name: 'Total Income',
            showSymbol: false,
            areaStyle: {
              color: 'rgba(243, 186, 47, 0.2)',
            },
            data: pt,
            smooth: true,
            lineStyle: {
              width: 2,
            },
            z: 3,
          },
        ],
        xAxis,
        {
          yAxis: [
            {
              type: 'value',
              position: 'left',
              show: false,
              splitLine: {
                show: true,
              },
              axisLine: {
                show: false,
              },
              min: 'dataMin',
              max: 'dataMax',
            },
          ],
        }
      )
    },
    nextChurnTime() {
      if (this.lastblock && this.network) {
        return blockTime(
          this.network.nextChurnHeight - this.lastblock[0].thorchain
        )
      }
    },
    balanceAmount(number) {
      return (+number / 1e8).toFixed(4)
    },
    outAddressHash(txID) {
      return txID.slice(0, 6) + '...' + txID.slice(-6)
    },
    uptodateNodeVersion(nodes) {
      if (nodes && nodes.length > 0) {
        const nodesVersion = nodes.map((n) => n.version)
        // TODO: should make sure all active nodes are vaild
        return rsort(nodesVersion)[0]
      }
      return undefined
    },
  },
}
</script>

<style lang="scss" scoped>
.version-progress {
  text-align: center;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.checkmark {
  width: 18px;
  height: 18px;
  align-items: center;
  border-radius: $radius-full;
  border: 1px solid var(--primary-color);
}
.grid-network {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-gap: 0.5rem;
  gap: 0.5rem;
}

.chain-table {
  width: 100%;

  th {
    text-align: left;
  }

  th {
    color: var(--sec-font-color);
    text-wrap: nowrap;
  }

  td {
    color: var(--font-color);
    text-wrap: nowrap;
  }

  .asset-cell {
    display: flex;
  }
}

.chain-col {
  display: flex;
  gap: 5px;
  align-items: center;
}

.chain-status {
  .status-header {
    color: var(--sec-font-color);
  }
}

.monitor-cell {
  width: 100px !important;
}
</style>
