<template>
  <Page>
    <info-card :options="networkOverview">
      <template #chains="{ items }">
        <table class="chain-table">
          <tr>
            <th>Chain</th>
            <th>Observed Tips</th>
            <th>Fee Rate</th>
          </tr>
          <tr v-for="it in items" :key="it.chain">
            <td>
              <div class="asset-cell">
                <asset-icon :asset="it.name" />
                {{ it.chain }}
              </div>
            </td>
            <td style="color: var(--sec-font-color); font-weight: bold">
              {{ it.value | number('0,0') }}
            </td>
            <td style="color: var(--sec-font-color); font-weight: bold">
              {{ it.gasRate | number('0,0') }}
            </td>
          </tr>
        </table>
      </template>
      <template #blocktime="{ item }">
        <span style="font-family: 'Roboto'">
          {{ item.filter(item.value) }}
        </span>
      </template>
    </info-card>
    <Card title="THORChain version upgrade progress">
      <ProgressBar
        v-if="versionProgress"
        :width="versionProgress"
        :color="versionProgress == 100 ? '#81C784' : false"
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
        v-if="newStandByVersion || (uptodateNodes && uptodateNodes.length == 1)"
        style="text-align: center; color: var(--primary-color)"
      >
        ✨ New version detected! ({{
          newStandByVersion || uptodateNodeVersion(activeNodes)
        }})
      </p>
      <p
        v-if="versionProgress === 100"
        style="text-align: center; color: var(--primary-color)"
      >
        All nodes are updated to the latest. ✅
      </p>
    </Card>
    <card class="chain-status">
      <vue-good-table
        :columns="inboundCols"
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
          <span v-else>
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
          </span>
        </template>
      </vue-good-table>
    </card>
  </Page>
</template>

<script>
import { gt, rsort, valid } from 'semver'
import { formatAsset, blockTime } from '~/utils'
import DangerIcon from '@/assets/images/danger.svg?inline'

export default {
  components: {
    DangerIcon,
  },
  data() {
    return {
      network: [],
      rune: [],
      lastblock: undefined,
      thorNetwork: undefined,
      outboundQueue: undefined,
      blockchainVersion: undefined,
      nodes: undefined,
      activeNodes: undefined,
      uptodateNodes: undefined,
      thorVersion: undefined,
      inAddresses: [],
      cols: [
        {
          label: 'Asset',
          field: 'coin.asset',
          formatFn: formatAsset,
        },
        {
          label: 'Chain',
          field: 'chain',
        },
        {
          label: 'Type',
          field: 'type',
        },
        {
          label: 'Balance',
          field: 'coin.amount',
          formatFn: this.balanceAmount,
        },
        {
          label: 'Gas Rate',
          field: 'gas_rate',
        },
        {
          label: 'Inbound TxID',
          field: 'in_hash',
          formatFn: this.outAddressHash,
        },
        {
          label: 'To Address',
          field: 'to_address',
          formatFn: this.outAddressHash,
        },
      ],
      inboundCols: [
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
          thClass: 'th-center',
        },
        {
          label: 'Trading',
          field: 'haltTradingHeight',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono center',
          thClass: 'th-center',
        },
        {
          label: 'LP',
          field: 'haltLPHeight',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono center',
          thClass: 'th-center',
        },
        {
          label: 'Signing',
          field: 'haltSigningHeight',
          type: 'number',
          formatFn: this.numberFormat,
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
    versionProgress() {
      if (!!this.nodes && this.blockchainVersion) {
        return Math.ceil(
          parseFloat(this.uptodateNodes.length / this.activeNodes.length) * 100
        )
      }
      return 1
    },
    networkOverview() {
      const observed = this.lastblock?.map((b) => {
        const chain = this.inAddresses.find((e) => e.chain === b.chain)
        return {
          name: this.baseChainAsset(b.chain),
          chain: b.chain,
          value: b.last_observed_in,
          gasRate: chain?.gas_rate,
          filter: (v) => this.$options.filters.number(v, '0,0'),
        }
      })

      return [
        {
          title: 'Network Overview',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Blockchain Version',
              value: this.blockchainVersion?.current,
            },
            {
              name: 'Version Age',
              value:
                this.lastblock &&
                this.lastblock[0].thorchain -
                  this.thorVersion?.next_since_height,
              filter: (v) => blockTime(v, true),
              valueSlot: 'blocktime',
            },
            {
              name: 'Active / Standby Nodes',
              value:
                this.network &&
                `${this.network?.activeNodeCount} / ${this.network?.standbyNodeCount}`,
            },
            {
              name: 'TOR Price in RUNE',
              value: this.thorNetwork?.tor_price_in_rune,
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v / 1e8, '0,0.00000')}`,
            },
            {
              name: 'Vaults Migrating',
              value: this.thorNetwork?.vaults_migrating ? 'Yes' : 'No',
            },
          ],
        },
        {
          title: 'Block Rewards',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Block Bond Reward Per Day',
              value:
                (this.network.blockRewards?.bondReward / 10 ** 8 ?? 0) *
                (5256000 / 365),
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: 'Block Pool Reward Per Day',
              value:
                (this.network.blockRewards?.poolReward / 10 ** 8 ?? 0) *
                (5256000 / 365),
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: 'Block Reward Per Day',
              value:
                (this.network.blockRewards?.blockReward / 10 ** 8 ?? 0) *
                (5256000 / 365),
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,0')}`,
            },
          ],
        },
        {
          title: 'Allocations',
          rowStart: 2,
          colSpan: 1,
          items: [
            {
              name: 'Total Pooled RUNE',
              value: this.network?.totalPooledRune,
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v / 1e8, '0,0')}`,
            },
            {
              name: 'Total Bonded RUNE',
              value:
                +this.network?.bondMetrics?.totalActiveBond +
                +this.network?.bondMetrics?.totalActiveBond,
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v / 1e8, '0,0')}`,
            },
            {
              name: 'Total Reserved RUNE',
              value: this.network?.totalReserve,
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v / 1e8, '0,0')}`,
            },
            {
              header: 'Burned',
            },
            {
              name: 'Total Burned BEP2 RUNE',
              value: this.thorNetwork?.burned_bep_2_rune,
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v / 1e8, '0,0')}`,
            },
            {
              name: 'Total Burned ERC20 RUNE',
              value: this.thorNetwork?.burned_erc_20_rune,
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v / 1e8, '0,0')}`,
            },
            {
              header: 'Yields',
            },
            {
              name: 'Bond APY',
              value: this.network.bondingAPY,
              filter: (v) => this.$options.filters.percent(v, 2),
            },
            {
              name: 'Liquidity APY',
              value: this.network.liquidityAPY,
              filter: (v) => this.$options.filters.percent(v, 2),
            },
            {
              name: 'Pool Share Factor',
              value: this.network.poolShareFactor,
              filter: (v) => this.$options.filters.percent(v, 2),
            },
          ],
        },
        {
          title: 'Chains',
          rowStart: 2,
          colSpan: 1,
          allSlot: 'chains',
          items: observed,
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
    this.$api
      .getLastBlockHeight()
      .then((res) => (this.lastblock = res.data))
      .catch((error) => {
        console.error(error)
      })

    this.$api
      .getThorNetwork()
      .then((res) => (this.thorNetwork = res.data))
      .catch((error) => {
        console.error(error)
      })

    this.$api
      .getInboundAddresses()
      .then(async (res) => {
        const mi = (await this.$api.getMimir()).data
        this.inAddresses = res.data
        this.inboundInfo = res.data.map((chain) => ({
          ...chain,
          haltHeight: Math.max(
            ...Object.keys(mi)
              .filter(
                (key) =>
                  new RegExp(`.*HALT.*${chain.chain}CHAIN`).test(key) &&
                  mi[key] !== 0
              )
              .map((key) => mi[key])
          ),
          haltTradingHeight: Math.max(
            ...Object.keys(mi)
              .filter(
                (key) =>
                  new RegExp(`HALT${chain.chain}TRADING`).test(key) &&
                  mi[key] !== 0
              )
              .map((key) => mi[key])
          ),
          haltSigningHeight: Math.max(
            ...Object.keys(mi)
              .filter(
                (key) =>
                  new RegExp(`HALTSIGNING${chain.chain}`).test(key) &&
                  mi[key] !== 0
              )
              .map((key) => mi[key])
          ),
          haltLPHeight: Math.max(
            ...Object.keys(mi)
              .filter(
                (key) =>
                  new RegExp(`PAUSELP${chain.chain}`).test(key) && mi[key] !== 0
              )
              .map((key) => mi[key])
          ),
          ...(chain.halted === true && { haltHeight: 1, haltSigningHeight: 1 }),
          ...(chain.global_trading_paused === true && { haltTradingHeight: 1 }),
          ...(chain.chain_trading_paused === true && { haltTradingHeight: 1 }),
          ...(chain.chain_lp_actions_paused === true && { haltLPHeight: 1 }),
        }))
      })
      .catch((error) => {
        console.error(error)
      })

    this.$api
      .getOutbound()
      .then(
        (res) =>
          (this.outboundQueue = res.data.map((t) => ({
            ...t,
            type: t.memo?.split(':')[0] ?? '-',
          })))
      )
      .catch((error) => {
        console.error(error)
      })

    this.$api
      .getBlockChainVersion()
      .then((res) => (this.blockchainVersion = res.data))
      .catch((error) => {
        console.error(error)
      })

    this.$api
      .getThorVersion()
      .then((res) => (this.thorVersion = res.data))
      .catch((error) => {
        console.error(error)
      })

    this.$api.getNetwork().then(({ data }) => {
      this.network = data
    })

    this.$api.getNodes().then(({ data }) => {
      this.nodes = data
      this.activeNodes = this.nodes?.filter((n) => n.status === 'Active')
      this.uptodateNodes = this.activeNodes.filter(
        (n) => n.version === this.uptodateNodeVersion(this.activeNodes)
      )
    })
  },
  methods: {
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

<style lang="scss">
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
</style>
