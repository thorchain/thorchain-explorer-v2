<template>
  <Page>
    <div class="chart-container">
      <div class="network-stats base-container">
        <div class="stat-group">
          <div class="stat-item">
            <img
              class="stat-image"
              src="~/assets/images/blockchain.png"
              alt="blockchain"
            />
            <div class="item-detail">
              <div class="header">Block Height</div>
              <div v-if="thorHeight" class="value">
                {{ thorHeight | number("0,0") }}
              </div>
              <span v-else>-</span>
            </div>
          </div>
          <hr />
          <div class="stat-item">
            <!-- <globe class="stat-image" /> -->
            <Globe class="stat-image" />
            <div class="item-detail">
              <div class="header">RUNE Supply</div>
              <div class="value" v-if="runeSupply">
                {{ runeSupply | number("0,0") }}
                <span style="font-size: 0.75rem">RUNE</span>
                <span class="extra" v-if="stats"
                  >(${{
                    (runeSupply * stats.runePriceUSD) | number("0.00 a")
                  }})</span
                >
              </div>
              <span v-else>-</span>
            </div>
          </div>
          <hr />
        </div>
        <div class="stat-group">
          <div class="stat-item">
            <img
              class="stat-image"
              src="~/assets/images/coin.png"
              alt="rune-coin"
            />
            <div class="item-detail">
              <div class="header">RUNE Price</div>
              <div v-if="stats && stats.runePriceUSD" class="value">
                {{ stats.runePriceUSD | currency }}
              </div>
              <span v-else>-</span>
            </div>
          </div>
          <hr />
          <div class="stat-item">
            <circulate class="stat-image" />
            <div class="item-detail">
              <div class="header">Total Circulating Volume (On Chain)</div>
              <div v-if="runeVolume" class="value">
                {{ runeVolume | number("0,0") }}
                <span style="font-size: 0.75rem">RUNE</span>
                <span class="extra" v-if="stats"
                  >(${{
                    (runeVolume * stats.runePriceUSD) | number("0.00 a")
                  }})</span
                >
              </div>
              <span v-else>-</span>
            </div>
          </div>
          <hr />
        </div>
        <div class="stat-group">
          <div class="stat-item">
            <img
              class="stat-image"
              src="~/assets/images/book.png"
              style="width: 2rem; height: auto; padding: 0.3rem"
              alt="rune-coin"
            />
            <div class="item-detail">
              <div class="header">Total Addresses</div>
              <div v-if="totalAddresses" class="value">
                {{ totalAddresses | number("0,0") }}
              </div>
              <span v-else>-</span>
            </div>
          </div>
          <hr />
          <div class="stat-item">
            <Chart class="stat-image" />
            <div class="item-detail">
              <div class="header">Total Swap, Add, and Withdraw txs</div>
              <div v-if="totalTxs" class="value">
                {{ totalTxs | number("0,0") }}
              </div>
              <span v-else>-</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="break"></div>
    <div class="chart-inner-container">
      <Card title="Swap History">
        <VChart
          :option="swapHistory"
          :loading="!swapHistory"
          :autoresize="true"
          :loading-options="showLoading"
        ></VChart>
      </Card>
      <Card title="Value Locked History">
        <VChart
          :option="tvlHistory"
          :loading="!tvlHistory"
          :autoresize="true"
          :loading-options="showLoading"
        ></VChart>
      </Card>
    </div>
    <div class="chart-inner-container">
      <Card title="Earnings Volume">
        <VChart
          :option="earningsHistory"
          :loading="!earningsHistory"
          :autoresize="true"
          :loading-options="showLoading"
        ></VChart>
      </Card>
      <Card title="Liquidity Volume Change">
        <VChart
          :option="volumeHistory"
          :loading="!volumeHistory"
          :autoresize="true"
          :loading-options="showLoading"
        ></VChart>
      </Card>
    </div>
    <div class="break"></div>
    <div class="cards-container">
      <div class="card">
        <div class="card-header">
          <div class="card-header-title">
            <h2>Latest Blocks</h2>
          </div>
        </div>
        <div class="card-body">
          <template v-if="blocks">
            <template v-for="(b, i) in blocks">
              <div class="row-item" :key="i">
                <div class="meta">
                  <span class="header">
                    {{ b.height | number("0,0") }}
                  </span>
                  <span class="timestamp">
                    {{ b.date }}
                  </span>
                </div>
                <div class="txs" style="width: 40%">
                  <span
                    >Tx Size: <span class="value">{{ b.txs }}</span></span
                  >
                  <span
                    >Block Size:
                    <span class="value">{{
                      b.size | number("0,0")
                    }}</span></span
                  >
                </div>
              </div>
              <hr class="hr-space" :key="i + 'hr'" />
            </template>
          </template>
          <div v-else class="loading">
            <BounceLoader color="var(--font-color)" size="3rem" />
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-header-title">
            <h2>Latest Transactions</h2>
          </div>
        </div>
        <div class="card-body">
          <template v-if="txs">
            <template v-for="(t, i) in txs">
              <div class="row-item" :key="i">
                <div class="meta">
                  <span class="header">
                    {{ t.height | number("0,0") }}
                  </span>
                  <span class="timestamp">
                    {{ formatMoment(t.date) }}
                  </span>
                </div>
                <div class="txs">
                  <span
                    >TxID
                    <a @click="gotoTx(t.in && t.in[0].txID)" class="value">{{
                      t.in && t.in[0].txID
                    }}</a></span
                  >
                  <span
                    >From
                    <a @click="gotoAddr(t.in[0].address)" class="value">{{
                      t.in && t.in[0].address
                    }}</a></span
                  >
                </div>
              </div>
              <hr class="hr-space" :key="i + 'hr'" />
            </template>
          </template>
          <div v-else class="loading">
            <BounceLoader color="var(--font-color)" size="3rem" />
          </div>
        </div>
      </div>
    </div>
    <div class="footer-stats">
      <stat-table header="Stats" :tableSettings="statsSettings"></stat-table>
      <stat-table
        header="Network"
        :tableSettings="networkSettings"
      ></stat-table>
    </div>
  </Page>
</template>

<script>
import { blockTime } from "~/utils";
import Block from "~/assets/images/block.svg?inline";
import Globe from "~/assets/images/world.svg?inline";
import Circulate from "~/assets/images/stats.svg?inline";
import Chart from "~/assets/images/chart.svg?inline";
import { AssetCurrencySymbol } from "@xchainjs/xchain-util";
import BounceLoader from "vue-spinner/src/BounceLoader.vue";
import moment from "moment";

import { use } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { LineChart, BarChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from "echarts/components";
import VChart from "vue-echarts";

use([
  SVGRenderer,
  GridComponent,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
]);

export default {
  components: {
    VChart,
    Block,
    Chart,
    Globe,
    Circulate,
    BounceLoader,
  },
  name: "OverviewPage",
  data() {
    return {
      network: [],
      rune: "",
      lastblock: undefined,
      stats: [],
      volumeHistory: undefined,
      swapHistory: undefined,
      tvlHistory: undefined,
      earningsHistory: undefined,
      runeSupply: undefined,
      lastHeight: undefined,
      blocks: undefined,
      txs: undefined,
      totalTxs: undefined,
      totalAddresses: undefined,
      thorHeight: undefined,
    };
  },
  activated() {
    // Call fetch again if last fetch more than 30 sec ago
    if (this.$fetchState.timestamp <= Date.now() - 6000) {
      this.$fetch();
    }
  },
  async fetch() {
    const resBlock = await this.$api.getRPCLastBlockHeight();
    this.lastHeight = +resBlock?.data?.block?.header?.height;
  },
  fetchOnServer: false,
  computed: {
    runeSymbol() {
      return AssetCurrencySymbol.RUNE;
    },
    runeVolume() {
      return (
        (+this.stats.swapVolume +
          +this.stats.withdrawVolume +
          +this.stats.addLiquidityVolume) /
        10 ** 8
      );
    },
    networkSettings: function () {
      return [
        [
          {
            name: "Bonding APY",
            value:
              this.network.bondingAPY &&
              this.stringToPercentage(this.network.bondingAPY),
            filter: true,
          },
          {
            name: "Liquidity APY",
            value:
              this.network.bondingAPY &&
              this.stringToPercentage(this.network.liquidityAPY),
            filter: true,
          },
        ],
        [
          {
            name: "Total Standby Bonded",
            value: +this.network.bondMetrics?.totalStandbyBond / 10 ** 8,
            usdValue: true,
          },
          {
            name: "Total Active Bonded",
            value: +this.network.bondMetrics?.totalActiveBond / 10 ** 8,
            usdValue: true,
          },
        ],
        [
          {
            name: "Active Node Count",
            value: this.network.activeNodeCount,
          },
          {
            name: "Standby Node Count",
            value: this.network.standbyNodeCount,
          },
        ],
        [
          {
            name: "Next Churn Height",
            value: this.network.nextChurnHeight,
            extraText: this.nextChurnTime(),
          },
        ],
        [
          {
            name: "Pool Activation Countdown",
            value: this.network.poolActivationCountdown,
            extraText: blockTime(this.network.poolActivationCountdown),
          },
        ],
        [
          {
            name: "Pool Share Factor",
            value:
              this.network.bondingAPY &&
              this.stringToPercentage(this.network.poolShareFactor),
            filter: true,
          },
        ],
        [
          {
            name: "Total Reserve",
            value: (this.network.totalReserve ?? 0) / 10 ** 8,
            usdValue: true,
          },
        ],
        [
          {
            name: "Total Pooled Rune",
            value: (this.network.totalPooledRune ?? 0) / 10 ** 8,
            usdValue: true,
          },
        ],
      ];
    },
    statsSettings: function () {
      return [
        [
          {
            name: "RUNE Price USD",
            value: this.$options.filters.currency(this.stats.runePriceUSD),
            filter: true,
          },
          {
            name: "RUNE Depth",
            value: Math.ceil(this.stats.runeDepth / 10 ** 8) ?? 0,
            usdValue: true,
          },
        ],
        [
          {
            name: "24h Swap Count",
            value: this.stats.swapCount24h ?? 0,
          },
          {
            name: "30d Swap Count",
            value: this.stats.swapCount30d ?? 0,
          },
          {
            name: "Total Swap Count",
            value: this.stats.swapCount ?? 0,
          },
        ],
        [
          {
            name: "Synth Burn Count",
            value: this.stats.synthBurnCount ?? 0,
          },
          {
            name: "Synth Mint Count",
            value: this.stats.synthMintCount ?? 0,
          },
        ],
        [
          {
            name: "Swap To Asset Count",
            value: this.stats.toAssetCount ?? 0,
          },
          {
            name: "Swap To RUNE Count",
            value: this.stats.toRuneCount ?? 0,
          },
        ],
        [
          {
            name: "Swap Volume",
            value: this.stats.swapVolume / 10 ** 8 ?? 0,
            usdValue: true,
          },
          {
            name: "Switched RUNE",
            value: this.stats.switchedRune / 10 ** 8 ?? 0,
            usdValue: true,
          },
        ],
        [
          {
            name: "Add Liquidity Volume",
            value: this.stats.addLiquidityVolume / 10 ** 8 ?? 0,
            usdValue: true,
          },
          {
            name: "Add Liquidity Count",
            value: this.stats.addLiquidityCount ?? 0,
          },
        ],
        [
          {
            name: "Withdraw Volume",
            value: this.stats.withdrawVolume / 10 ** 8 ?? 0,
            usdValue: true,
          },
          {
            name: "Withdraw Count",
            value: this.stats.withdrawCount ?? 0,
          },
        ],
        [
          {
            name: "Impermanent Loss Protection Paid",
            value: this.stats.impermanentLossProtectionPaid / 10 ** 8 ?? 0,
            usdValue: true,
          },
        ],
      ];
    },
  },
  methods: {
    stringToPercentage(val) {
      return (Number.parseFloat(val ?? 0) * 100).toFixed(2).toString() + " %";
    },
    nextChurnTime() {
      if (this.lastblock && this.network) {
        return blockTime(
          this.network.nextChurnHeight - this.lastblock[0]["thorchain"]
        );
      }
    },
    formatLPChange(d) {
      let xAxis = [];
      let lv = [];
      let wv = [];
      let alv = [];
      d?.intervals.forEach((interval) => {
        xAxis.push(
          moment(
            Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format("MM/DD")
        );
        alv.push(
          (+interval.addLiquidityVolume * +interval.runePriceUSD) / 10 ** 8
        );
        wv.push(
          -1 * ((+interval.withdrawVolume * +interval.runePriceUSD) / 10 ** 8)
        );
        lv.push(
          ((+interval.addLiquidityVolume - +interval.withdrawVolume) *
            +interval.runePriceUSD) /
            10 ** 8
        );
      });

      return this.basicChartFormat(
        (value) => `$ ${this.normalFormat(value)}`,
        [
          {
            type: "bar",
            name: "Total Change",
            showSymbol: false,
            data: lv,
            smooth: true,
          },
          {
            type: "bar",
            name: "Add Volume",
            showSymbol: false,
            data: alv,
            smooth: true,
          },
          {
            type: "bar",
            name: "Withdraw Volume",
            showSymbol: false,
            data: wv,
            smooth: true,
          },
        ],
        xAxis
      );
    },
    formatSwap: function (d) {
      let xAxis = [];
      let tv = [];
      let tva = [];
      let tvr = [];
      d?.intervals.forEach((interval) => {
        xAxis.push(
          moment(
            Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format("MM/DD")
        );
        tv.push(
          (+interval.totalVolume / 10 ** 8) *
            Number.parseFloat(interval.runePriceUSD)
        );
        tva.push((+interval.toAssetVolume * +interval.runePriceUSD) / 10 ** 8);
        tvr.push((+interval.toRuneVolume * +interval.runePriceUSD) / 10 ** 8);
      });

      const res = this.basicChartFormat(
        (value) => `$ ${this.normalFormat(value)}`,
        [
          {
            type: "bar",
            name: "Total Volume",
            showSymbol: false,
            data: tv,
            smooth: true,
          },
          {
            type: "bar",
            name: "to Asset Volume",
            showSymbol: false,
            data: tva,
            smooth: true,
          },
          {
            type: "bar",
            name: "to Rune Volume",
            showSymbol: false,
            data: tvr,
            smooth: true,
          },
        ],
        xAxis
      );
      console.log(res, tva, tvr, tv);

      return res;
    },
    formatTvl: function (d) {
      let xAxis = [];
      let tvp = [];
      d?.intervals.forEach((interval) => {
        xAxis.push(
          moment(
            Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format("MM/DD")
        );
        tvp.push(
          (+interval.totalValuePooled / 10 ** 8) *
            Number.parseFloat(interval.runePriceUSD)
        );
      });

      return this.basicChartFormat(
        (value) => `$ ${this.normalFormat(value)}`,
        [
          {
            type: "line",
            name: "Total Value Pooled",
            showSymbol: false,
            data: tvp,
            smooth: true,
          },
        ],
        xAxis
      );
    },
    formatEarnings: function (d) {
      let xAxis = [];
      let le = [];
      let be = [];
      d?.intervals.forEach((interval) => {
        xAxis.push(
          moment(
            Math.floor((~~interval.endTime + ~~interval.startTime) / 2) * 1e3
          ).format("MM/DD")
        );
        le.push(
          (+interval.liquidityEarnings / 10 ** 8) *
            Number.parseFloat(interval.runePriceUSD)
        );
        be.push(
          (+interval.bondingEarnings / 10 ** 8) *
            Number.parseFloat(interval.runePriceUSD)
        );
      });

      return this.basicChartFormat(
        (value) => `$ ${this.normalFormat(value)}`,
        [
          {
            type: "line",
            name: "Liquidity Earning",
            showSymbol: false,
            data: le,
            smooth: true,
          },
          {
            type: "line",
            name: "Bond Earning",
            showSymbol: false,
            data: be,
            smooth: true,
          },
        ],
        xAxis
      );
    },
    formatTendermintBlocks: function (blocks) {
      let blockJsons = [];
      for (let block of blocks) {
        blockJsons.push({
          height: block?.header?.height,
          date: moment(block?.header?.time).fromNow(),
          txs: block?.num_txs,
          size: block?.block_size,
        });
      }
      return blockJsons.slice(0, 10);
    },
    formatMoment: function (time) {
      return moment(Number.parseInt(time / 10 ** 6)).fromNow();
    },
  },
  mounted() {
    this.$api
      .getDashboardData()
      .then(({ data }) => {
        this.stats = data?.stats;
        this.runeSupply = +data?.runeSupply?.amount?.amount / 10 ** 8;
        this.lastblock = data?.lastBlockHeight;
        this.thorHeight = data?.lastBlockHeight.find(
          (e) => e.chain === "BTC"
        ).thorchain;
        this.txs = data?.txs?.actions;
        this.totalTxs = +data?.txs?.count;
        this.totalAddresses = +data?.addresses?.pagination?.total;
      })
      .catch((e) => {
        this.$api
          .getStats()
          .then((res) => (this.stats = res.data))
          .catch((error) => {
            console.error(error);
          });

        this.$api
          .getLastBlockHeight()
          .then((res) => {
            this.lastblock = res.data;
            this.thorHeight = res.data.find((e) => e.chain === "BTC").thorchain;
          })
          .catch((error) => {
            console.error(error);
          });

        this.$api
          .getSupplyRune()
          .then(
            (res) => (this.runeSupply = +res?.data?.amount?.amount / 10 ** 8)
          )
          .catch((error) => {
            console.error(error);
          });

        this.$api
          .getTxs()
          .then((res) => {
            this.txs = res?.data?.actions;
            this.totalTxs = +res?.data?.count;
          })
          .catch((error) => {
            console.error(error);
          });

        this.$api
          .getAddresses()
          .then((res) => (this.totalAddresses = +res?.data?.pagination?.total))
          .catch((error) => {
            console.error(error);
          });
      });

    this.$api
      .getDashboardPlots()
      .then(({ data }) => {
        this.volumeHistory = this.formatLPChange(data?.LPChange);
        this.swapHistory = this.formatSwap(data?.swaps);
        this.tvlHistory = this.formatTvl(data?.tvl);
        this.earningsHistory = this.formatEarnings(data?.earning);
      })
      .catch((error) => {
        this.$api
          .volumeHistory()
          .then((res) => (this.volumeHistory = this.formatLPChange(res.data)))
          .catch((error) => {
            console.error(error);
          });

        this.$api
          .swapHistory()
          .then((res) => (this.swapHistory = this.formatSwap(res.data)))
          .catch((error) => {
            console.error(error);
          });

        this.$api
          .tvlHistory()
          .then((res) => (this.tvlHistory = this.formatTvl(res.data)))
          .catch((error) => {
            console.error(error);
          });

        this.$api
          .earningsHistory()
          .then((res) => (this.earningsHistory = this.formatEarnings(res.data)))
          .catch((error) => {
            console.error(error);
          });
      });

    this.$api
      .getRPCLastBlockHeight()
      .then((res) => {
        this.lastHeight = +res?.data?.block?.header?.height;
        this.$api
          .getTendermintLatestBlocks(+this.lastHeight - 9)
          .then(
            (res) =>
              (this.blocks = this.formatTendermintBlocks(
                res?.data?.result.block_metas
              ))
          )
          .catch((error) => {
            console.error(error);
          });
      })
      .catch((error) => {
        console.error(error);
      });

    this.$api.getNetwork().then(({data}) => {
      this.network = data;
    })
  },
};
</script>

<style lang="scss">
.overview-container {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}

.footer-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-wrap: wrap;
  flex: 1;

  @include lg {
    flex-direction: row;
  }
}

.break {
  flex-basis: 100%;
  height: 0;
}

.network-stats {
  .stat-item {
    display: flex;
    align-items: center;

    .header {
      color: var(--font-color);
      font-size: 0.875rem;
    }

    .value {
      .extra {
        color: var(--font-color);
        font-size: 0.78rem;
      }
    }

    .stat-image {
      margin-right: 0.75rem;
      width: 2rem;
      height: 2rem;
      fill: #9f9f9f;
    }
  }

  hr {
    margin: 0.75rem 0;
    opacity: 0.65;
    overflow: visible;
    height: 0;
    border: 0;
    border-top: 1px solid var(--border-color);
  }

  .rune-symbol {
    color: var(--font-color);
    margin: 0 0.6rem;
    font-size: 2rem;
    line-height: 28px;
    width: 1.6rem;
  }
}

@include md {
  .network-stats {
    padding: 0;
    display: flex;
    justify-content: space-between;

    .stat-group {
      position: relative;
      padding: 1rem;
      flex: 1;

      &::after {
        position: absolute;
        right: 0;
        top: 0;
        content: "";
        display: block;
        height: calc(100% - 1rem);
        border-left: 0;
        border-right: 1px solid var(--border-color);
        margin: 0.5rem 0;
      }

      &:last-of-type::after {
        display: none;
      }
    }

    .stat-group hr:last-child {
      display: none;
    }
  }
}

.cards-container {
  display: grid;
  width: 100%;
  grid-gap: 10px;
  grid-auto-columns: minmax(100px, auto);

  .card {
    margin: 0;
  }

  @include lg {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.echarts {
  min-height: 400px;
}
</style>
