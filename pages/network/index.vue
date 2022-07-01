<template>
  <Page>
    <stat-table
      :isLoading="!network || network.length == 0"
      :tableSettings="networkSettings"
      header="Network Overview"
      :iconSrc="require('@/assets/images/database.svg')"
    ></stat-table>
    <Card title="THORChain version upgrade progress">
      <ProgressBar v-if="versionProgress" :width="versionProgress" :color="versionProgress == 100? '#81C784':false" />
      <h3 style="text-align: center">
        <span class="sec-color">{{ uptodateNodes?uptodateNodes.length:'*' }}</span> of <span class="sec-color">{{ activeNodes?activeNodes.length:'*' }}</span> nodes
        upgraded to <span class="sec-color">{{ activeNodes?uptodateNodeVersion(activeNodes):'*' }}</span>
      </h3>
      <p v-if="newStandByVersion || (uptodateNodes && uptodateNodes.length == 1)" style="text-align: center; color: var(--primary-color)">✨ New version detected! ({{newStandByVersion || uptodateNodeVersion(activeNodes) }})</p>
      <p v-if="versionProgress === 100" style="text-align: center; color: var(--primary-color)">✅ All nodes are updated to the latest.</p>
    </Card>
    <stat-table
      :isLoading="!inAddresses"
      :tableSettings="gasSettings"
      header="Gas Fees"
      :iconSrc="require('@/assets/images/gas.svg')"
    ></stat-table>
    <Card v-show="outboundQueue" title="Outbound Queue" :imgSrc="require('~/assets/images/sign-out.svg')">
      <vue-good-table
          :columns="cols"
          :rows="outboundQueue"
          styleClass="vgt-table net-table bordered"
          :pagination-options="{
            enabled: true,
            perPage: 30,
            perPageDropdownEnabled: false,
          }"
        >
          <template slot="table-row" slot-scope="props">
            <div v-if="props.column.field == 'coin.asset'" class="cell-content">
              <img
                class="table-asset-icon"
                :src="assetImage(props.row.coin.asset)"
                alt="asset-icon"
              />
              <span v-tooltip="props.row.coin.asset">{{
                props.formattedRow[props.column.field]
              }}</span>
            </div>
            <span v-else-if="props.column.field == 'coin.amount'">
              <span
                >{{ props.formattedRow[props.column.field] }}
                <span class="extra-text">
                  {{ showAsset(props.row.coin.asset) }}
                </span>
              </span>
            </span>
            <span
              v-else-if="props.column.field == 'to_address'"
              @click="gotoAddr(props.row.to_address)"
            >
              <span class="clickable" v-tooltip="props.row.to_address">{{
                props.formattedRow[props.column.field]
              }}</span>
            </span>
            <span
              v-else-if="props.column.field == 'in_hash'"
              @click="gotoTx(props.row.in_hash)"
            >
              <span class="clickable" v-tooltip="props.row.in_hash">{{
                props.formattedRow[props.column.field]
              }}</span>
            </span>
            <span v-else>
              {{ props.formattedRow[props.column.field] }}
            </span>
          </template>
        </vue-good-table>
    </Card>
  </Page>
</template>

<script>
import { activeNodesQuery, bondMetrics, networkQuery } from "~/_gql_queries";
import StatTable from "~/components/StatTable.vue";
import { formatAsset, addressFormat, blockTime } from "~/utils";
import { Chain } from '@xchainjs/xchain-util';
import {gt, rsort, valid} from 'semver';

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
      activeNodes: undefined,
      uptodateNodes: undefined,
      inAddresses: [],
      cols: [
        {
          label: "Asset",
          field: "coin.asset",
          formatFn: formatAsset,
        },
        {
          label: "Chain",
          field: "chain",
        },
        {
          label: "Type",
          field: "type",
        },
        {
          label: "Balance",
          field: "coin.amount",
          formatFn: this.balanceAmount,
        },
        {
          label: "Gas Rate",
          field: "gas_rate",
        },
        {
          label: "Inbound TxID",
          field: "in_hash",
          formatFn: this.outAddressHash,
        },
        {
          label: "To Address",
          field: "to_address",
          formatFn: this.outAddressHash,
        }
      ],
    };
  },
  apollo: {
    $prefetch: false,
    network: networkQuery,
    bondMetrics: bondMetrics,
    activeNodesQuery: {
      query: activeNodesQuery,
      update(data) {
        return data;
      },
    },
  },
  mounted() {
    this.$api
      .getLastBlockHeight()
      .then((res) => (this.lastblock = res.data))
      .catch((error) => {
        console.error(error);
      });

    this.$api
      .getThorNetwork()
      .then((res) => (this.thorNetwork = res.data))
      .catch((error) => {
        console.error(error);
      });

    this.$api
      .getInboundAddresses()
      .then((res) => (this.inAddresses = res.data))
      .catch((error) => {
        console.error(error);
      });

    this.$api
      .getOutbound()
      .then(
        (res) =>
          (this.outboundQueue = res.data.map((t) => ({
            ...t,
            type: t.memo?.split(":")[0] ?? "-",
          })))
      )
      .catch((error) => {
        console.error(error);
      });

    this.$api
      .getBlockChainVersion()
      .then((res) => (this.blockchainVersion = res.data))
      .catch((error) => {
        console.error(error);
      });
  },
  methods: {
    nextChurnTime() {
      if (this.lastblock && this.network) {
        console.log(this.network);
        return blockTime(
          this.network.nextChurnHeight - this.lastblock[0]["thorchain"]
        );
      }
    },
    formatGas(gas_rate, chain) {
      switch (chain) {
        case "BCH":
        case "BTC":
        case "LTC":
        case "DOGE":
          return (250 * +gas_rate) / 10 ** 8;

        case "ETH":
        case "ERC20":
          const limit = chain === "ERC20" ? 70000 : 35000;
          return (limit * (+gas_rate * 10 ** 9)) / 10 ** 18;

        case "BNB":
          return (+gas_rate * 1) / 10 ** 8;

        case "TERRA":
          return (+gas_rate * 1.5) / 10 ** 8;
        
        default:
          return gas_rate;
      } 
    },
    balanceAmount(number) {
      return (+number/1e8).toFixed(4)
    },
    outAddressHash(txID) {
      return txID.slice(0,6) + '...' + txID.slice(-6);
    },
    lowerLevelGas(chain) {
      if (chain == Chain.Bitcoin || chain == Chain.Litecoin || chain == Chain.BitcoinCash || chain == Chain.Doge) {
        return (10**8/250)
      }
      else if (chain == Chain.Ethereum) {
        return (10**9/35000)
      }
      else if (chain == Chain.Binance) {
        return (10**8)
      }
      else if (chain == Chain.Terra) {
        return (10**6)
      }
      else
        return false
    },
    gasFormat(chain) {
      if (chain == Chain.Bitcoin || chain == Chain.Litecoin || chain == Chain.BitcoinCash || chain == Chain.Doge) {
        return ' sat/byte'
      }
      else if (chain == Chain.Ethereum) {
        return ' gwei'
      }
      else if (chain == Chain.Binance) {
        return ' sat'
      }
      else if (chain == Chain.Terra) {
        return ' uluna'
      }
      else
        return false
    },
    uptodateNodeVersion(nodes) {
      if (nodes && nodes.length > 0) {
        let nodesVersion = nodes.map(n => n.version);
        // TODO: should make sure all active nodes are vaild
        return rsort(nodesVersion)[0]
      }
      return undefined
    }
  },
  computed: {
    versionProgress: function () {
      if (!!this.activeNodesQuery && this.blockchainVersion) {
        this.activeNodes = this.activeNodesQuery.nodes.filter(
          (n) => n.status === "Active"
        );
        this.uptodateNodes = this.activeNodes.filter(
          (n) => n.version == this.uptodateNodeVersion(this.activeNodes)
        );
        return Math.ceil (
          parseFloat(this.uptodateNodes.length / this.activeNodes.length) * 100
        );
      }
      return 1;
    },
    networkSettings: function () {
      return [
        [
          {
            name: "Current Blockchain version",
            value: this.blockchainVersion?.current,
            filter: true
          }
        ],
        [
          {
            name: "Bonding APY",
            value: this.$options.filters.percent(this.network.bondingAPY, 2),
            filter: true,
          },
          {
            name: "Liquidity APY",
            value: this.$options.filters.percent(this.network.liquidityAPY, 2),
            filter: true,
          },
        ],
        [
          {
            name: "Next Churn Height",
            value: this.network.nextChurnHeight,
            extraText: this.nextChurnTime(),
          },
          {
            name: "Pool Activation Countdown",
            value: this.network.poolActivationCountdown,
            extraText: blockTime(+this.network.poolActivationCountdown),
          },
          {
            name: "Pool Share Factor",
            value: this.$options.filters.percent(this.network.poolShareFactor),
            filter: true,
          },
        ],
        [
          {
            name: "Total Reserve",
            value: (this.network.totalReserve ?? 0) / 10 ** 8,
            usdValue: true,
          },
          {
            name: "Total Pooled Rune",
            value: (this.network.totalPooledRune ?? 0) / 10 ** 8,
            usdValue: true,
          },
        ],
        [
          {
            name: "Block Reward / Day",
            value:
              (this.network.blockRewards?.blockReward / 10 ** 8 ?? 0) *
              (5256000 / 365),
            usdValue: true,
          },
          {
            name: "Block Bond Reward / Day",
            value:
              (this.network.blockRewards?.bondReward / 10 ** 8 ?? 0) *
              (5256000 / 365),
            usdValue: true,
          },
          {
            name: "Block Pool Reward / Day",
            value:
              (this.network.blockRewards?.poolReward / 10 ** 8 ?? 0) *
              (5256000 / 365),
            usdValue: true,
          },
          {
            name: "Block Reward / Node / Month",
            value:
              (this.network.blockRewards?.bondReward /
                10 ** 8 /
                this.network.activeNodeCount ?? 0) *
              (5256000 / 12),
            usdValue: true,
          },
        ],
        [
          {
            name: "Total Bond Units",
            value: this.thorNetwork?.total_bond_units,
          },
          {
            name: "Total Bond Reward",
            value: this.thorNetwork?.bond_reward_rune / 10 ** 8,
            usdValue: true,
          },
        ],
        [
          {
            name: "Total Burned BEP2 RUNE",
            value: this.thorNetwork?.burned_bep_2_rune / 10 ** 8,
            usdValue: true,
          },
          {
            name: "Total Burned ERC20 RUNE",
            value: this.thorNetwork?.burned_erc_20_rune / 10 ** 8,
            usdValue: true,
          },
        ],
      ];
    },
    gasSettings: function () {
      const getChain = (c) =>
        this.inAddresses?.find((e) => e.chain === c)?.gas_rate;
      const chains = this.inAddresses.map((e) => {
        return {
          name: `${e.chain} gas fee`,
          value: this.formatGas(getChain(e.chain), e.chain),
          image: this.assetImage(`${e.chain}.${e.chain}`),
          extraText: this.lowerLevelGas(e.chain)? this.formatGas(getChain(e.chain), e.chain)*this.lowerLevelGas(e.chain)+this.gasFormat(e.chain):false,
          filter: true,
        };
      });
      chains.push({
        name: "ERC20 gas fee",
        value: this.formatGas(getChain("ETH"), "ERC20"),
        image: this.assetImage("ETH.ETH"),
        filter: true,
      });
      return [
        chains.slice(0, 2),
        chains.slice(2, 4),
        chains.slice(4, 6),
        chains.slice(6),
      ];
    },
    newStandByVersion: function () {
      if (!this.blockchainVersion || !this.activeNodesQuery)
        return
      let currentVer = this.blockchainVersion.current;
      let node = this.activeNodesQuery.nodes.filter(
        (n) => valid(n.version) && gt(n.version, currentVer)
      ).map(n => n.version);
      if (node && node.length > 0)
        return rsort(node)[0].version;
    }
  },
};
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