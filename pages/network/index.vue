<template>
  <Page>
    <stat-table :is-loading="!network || network.length == 0" :table-settings="networkSettings"
      header="Network Overview" />
    <Card title="THORChain version upgrade progress">
      <ProgressBar v-if="versionProgress" :width="versionProgress" :color="versionProgress == 100 ? '#81C784' : false" />
      <h3 style="text-align: center">
        <span class="sec-color">{{ uptodateNodes ? uptodateNodes.length : '*' }}</span> of <span class="sec-color">{{
          activeNodes ? activeNodes.length : '*' }}</span> nodes
        upgraded to <span class="sec-color">{{ activeNodes ? uptodateNodeVersion(activeNodes) : '*' }}</span>
      </h3>
      <p v-if="newStandByVersion || (uptodateNodes && uptodateNodes.length == 1)"
        style="text-align: center; color: var(--primary-color)">
        ✨ New version detected! ({{ newStandByVersion || uptodateNodeVersion(activeNodes) }})
      </p>
      <p v-if="versionProgress === 100" style="text-align: center; color: var(--primary-color)">
        ✅ All nodes are updated to the latest.
      </p>
    </Card>
    <stat-table :is-loading="!inAddresses" :table-settings="gasSettings" header="Gas Fees" />
  </Page>
</template>

<script>
import { chunk } from 'lodash'
import { gt, rsort, valid } from 'semver'
import StatTable from '~/components/StatTable.vue'
import { formatAsset, blockTime } from '~/utils'

export default {
  components: { StatTable },
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
      inAddresses: [],
      cols: [
        {
          label: 'Asset',
          field: 'coin.asset',
          formatFn: formatAsset
        },
        {
          label: 'Chain',
          field: 'chain'
        },
        {
          label: 'Type',
          field: 'type'
        },
        {
          label: 'Balance',
          field: 'coin.amount',
          formatFn: this.balanceAmount
        },
        {
          label: 'Gas Rate',
          field: 'gas_rate'
        },
        {
          label: 'Inbound TxID',
          field: 'in_hash',
          formatFn: this.outAddressHash
        },
        {
          label: 'To Address',
          field: 'to_address',
          formatFn: this.outAddressHash
        }
      ]
    }
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
    networkSettings() {
      return [
        [
          {
            name: 'Current Blockchain version',
            value: this.blockchainVersion?.current,
            filter: true
          }
        ],
        [
          {
            name: 'Bonding APY',
            value: this.$options.filters.percent(this.network.bondingAPY, 2),
            filter: true
          },
          {
            name: 'Liquidity APY',
            value: this.$options.filters.percent(this.network.liquidityAPY, 2),
            filter: true
          }
        ],
        [
          {
            name: 'Next Churn Height',
            value: this.network.nextChurnHeight,
            extraText: this.nextChurnTime()
          },
          {
            name: 'Pool Activation Countdown',
            value: this.network.poolActivationCountdown,
            extraText: blockTime(+this.network.poolActivationCountdown)
          },
          {
            name: 'Pool Share Factor',
            value: this.$options.filters.percent(this.network.poolShareFactor),
            filter: true
          }
        ],
        [
          {
            name: 'Total Reserve',
            value: (this.network.totalReserve ?? 0) / 10 ** 8,
            usdValue: true
          },
          {
            name: 'Total Pooled Rune',
            value: (this.network.totalPooledRune ?? 0) / 10 ** 8,
            usdValue: true
          }
        ],
        [
          {
            name: 'Block Reward / Day',
            value:
              (this.network.blockRewards?.blockReward / 10 ** 8 ?? 0) *
              (5256000 / 365),
            usdValue: true
          },
          {
            name: 'Block Bond Reward / Day',
            value:
              (this.network.blockRewards?.bondReward / 10 ** 8 ?? 0) *
              (5256000 / 365),
            usdValue: true
          },
          {
            name: 'Block Pool Reward / Day',
            value:
              (this.network.blockRewards?.poolReward / 10 ** 8 ?? 0) *
              (5256000 / 365),
            usdValue: true
          },
          {
            name: 'Block Reward / Node / Month',
            value:
              (this.network.blockRewards?.bondReward /
                10 ** 8 /
                this.network.activeNodeCount ?? 0) *
              (5256000 / 12),
            usdValue: true
          }
        ],
        [
          {
            name: 'Total Bond Units',
            value: this.thorNetwork?.total_bond_units
          },
          {
            name: 'Total Bond Reward',
            value: this.thorNetwork?.bond_reward_rune / 10 ** 8,
            usdValue: true
          }
        ],
        [
          {
            name: 'Total Burned BEP2 RUNE',
            value: this.thorNetwork?.burned_bep_2_rune / 10 ** 8,
            usdValue: true
          },
          {
            name: 'Total Burned ERC20 RUNE',
            value: this.thorNetwork?.burned_erc_20_rune / 10 ** 8,
            usdValue: true
          }
        ]
      ]
    },
    gasSettings() {
      const chains = this.inAddresses.map((e) => {
        return {
          name: `${e.chain} gas rate`,
          value: e.gas_rate,
          image: this.assetImage(`${e.chain}.${e.chain}`),
          extraText: e.gas_rate_units,
          filter: true
        }
      })
      return chunk(chains, 3)
    },
    newStandByVersion() {
      if (!this.blockchainVersion || !this.nodes) { return }
      const currentVer = this.blockchainVersion.current
      const node = this.nodes?.filter(
        n => valid(n.version) && gt(n.version, currentVer)
      ).map(n => n.version)
      if (node && node.length > 0) { return rsort(node)[0].version }
      return null
    }
  },
  mounted() {
    this.$api
      .getLastBlockHeight()
      .then(res => (this.lastblock = res.data))
      .catch((error) => {
        console.error(error)
      })

    this.$api
      .getThorNetwork()
      .then(res => (this.thorNetwork = res.data))
      .catch((error) => {
        console.error(error)
      })

    this.$api
      .getInboundAddresses()
      .then(res => (this.inAddresses = res.data))
      .catch((error) => {
        console.error(error)
      })

    this.$api
      .getOutbound()
      .then(
        res =>
        (this.outboundQueue = res.data.map(t => ({
          ...t,
          type: t.memo?.split(':')[0] ?? '-'
        })))
      )
      .catch((error) => {
        console.error(error)
      })

    this.$api
      .getBlockChainVersion()
      .then(res => (this.blockchainVersion = res.data))
      .catch((error) => {
        console.error(error)
      })

    this.$api.getNetwork()
      .then(({ data }) => {
        this.network = data
      })

    this.$api.getNodes()
      .then(({ data }) => {
        this.nodes = data
        this.activeNodes = this.nodes?.filter(
          n => n.status === 'Active'
        )
        this.uptodateNodes = this.activeNodes.filter(
          n => n.version === this.uptodateNodeVersion(this.activeNodes)
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
        const nodesVersion = nodes.map(n => n.version)
        // TODO: should make sure all active nodes are vaild
        return rsort(nodesVersion)[0]
      }
      return undefined
    }
  }
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
</style>
