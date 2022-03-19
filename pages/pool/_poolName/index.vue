<template>
  <div>
    <div v-if="pool.poolQuery" class="pool-container">
      <img class="asset-icon" :src="assetImage(pool.poolQuery.asset)" />
      <div class="pool-header">{{ pool.poolQuery.asset }}</div>
      <!-- nuxt child -->
      <div class="pool-overview">
        <div class="pool-detail-header">
          <div class="item">
            <div class="header">Asset Price</div>
            <div class="value">
              {{ (Number.parseFloat(pool.poolQuery.price) * runePrice) | currency }}
            </div>
          </div>
          <div class="item">
            <div class="header">Pool APY</div>
            <div class="value">
              {{ Number.parseFloat(pool.poolQuery.poolAPY) | percent }}
            </div>
          </div>
          <div class="item">
            <div class="header">Status</div>
            <div class="value">{{ pool.poolQuery.status | capitalize }}</div>
          </div>
          <div class="item">
            <div class="header">Asset Depth</div>
            <div class="value">
              {{ (pool.poolQuery.depth.assetDepth / 10 ** 8) | number("0,0") }}
              <span style="font-size: 0.7rem">{{
                assetString(pool.poolQuery.asset)
              }}</span>
            </div>
          </div>
          <div class="item">
            <div class="header">Rune Depth</div>
            <div class="value">
              {{ (pool.poolQuery.depth.runeDepth / 10 ** 8) | number("0,0") }}
              <span style="font-size: 0.7rem">THOR.RUNE</span>
            </div>
          </div>
          <div class="item">
            <div class="header">Units</div>
            <div class="value">
              {{ (pool.poolQuery.units / 10 ** 8) | number("0,0.00") }}
            </div>
          </div>
        </div>
        <volume-chart :chartSettings="pool.volumeHistory"></volume-chart>
        <div class="pool-swap-detail" v-for="(settings, i) in poolStats" :key="i">
          <stat-table :tableSettings="settings.content" :header="settings.header"></stat-table>
        </div>
      </div>
    </div>
    <div v-else class="loading">
      <BounceLoader color="#9F9F9F" size="3rem" />
    </div>
  </div>
</template>

<script>
import { poolQuery } from "~/_gql_queries";
import BounceLoader from "vue-spinner/src/BounceLoader.vue";
import { AssetImage } from "~/classes/assetImage";
import { assetFromString } from "@xchainjs/xchain-util";
import { mapGetters } from 'vuex';

export default {
  async asyncData({ params }) {
    return { poolName: params.poolName };
  },
  components: {
    BounceLoader,
    VolumeChart: () => {
      if (process.client) {
        return import("~/components/page_components/volumeChart.vue");
      }
    },
  },
  methods: {
    assetImage(assetStr) {
      try {
        return AssetImage(assetStr) ?? require("~/assets/images/unknown.png");
      } catch (error) {
        return require("~/assets/images/unknown.png");
      }
    },
    assetString(assetStr) {
      const { chain, ticker } = assetFromString(assetStr);
      return `${chain}.${ticker}`;
    },
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice'
    })
  },
  mounted() {
    this.$api
      .getPoolStats(this.poolName)
      .then((res) => {
        this.poolStats = [
          {
            header: 'Swap',
            content: [
              [
                {
                  name: "To Asset Fees",
                  value: Number.parseInt(res.data?.toAssetFees) / 10 ** 8,
                  usd: true
                },
                {
                  name: 'To RUNE Fees',
                  value: Number.parseInt(res.data?.toRuneFees) / 10 ** 8,
                  usd: true
                },
                {
                  name: 'Total Fees',
                  value: Number.parseInt(res.data?.totalFees) / 10 ** 8,
                  usd: true
                },
              ],
              [
                {
                  name: 'To Asset Count',
                  value: Number.parseInt(res.data?.toAssetCount),
                },
                {
                  name: 'To RUNE Count',
                  value: Number.parseInt(res.data?.toRuneCount),
                },
                {
                  name: 'Swap Count',
                  value: Number.parseInt(res.data?.swapCount),
                },
                {
                  name: 'Unique Swapper Count',
                  value: Number.parseInt(res.data?.uniqueSwapperCount),
                },
              ],
              [
                {
                  name: 'To Asset Volume',
                  value: Number.parseInt(res.data?.toAssetVolume) / 10**8,
                  usd: true
                },
                {
                  name: 'To RUNE Volume',
                  value: Number.parseInt(res.data?.toRuneVolume) / 10**8,
                  usd: true
                },
                {
                  name: 'Swap Volume',
                  value: Number.parseInt(res.data?.swapVolume) / 10**8,
                  usd: true
                },
              ]
            ],
          },
          {
            header: 'Deposit',
            content: [
              [
                {
                  name: 'Add Liquidity Count',
                  value: Number.parseInt(res.data?.addLiquidityCount)
                },
                {
                  name: 'Unique Member Count',
                  value: Number.parseInt(res.data?.uniqueMemberCount)
                },
                {
                  name: 'Loss Protection Paid',
                  value: Number.parseInt(res.data?.impermanentLossProtectionPaid) / 10**8,
                  usd: true
                }
              ],
              [
                {
                  name: 'Add Asset Liquidity Volume',
                  value: Number.parseInt(res.data?.addAssetLiquidityVolume) / 10**8,
                  usd: true
                },
                {
                  name: 'Add RUNE Liquidity Volume',
                  value: Number.parseInt(res.data?.addRuneLiquidityVolume) / 10**8,
                  usd: true
                },
                {
                  name: 'Add Liquidity Volume',
                  value: Number.parseInt(res.data?.addLiquidityVolume) / 10**8,
                  usd: true
                }
              ]
            ]
          },
          {
            header: 'Withdraw',
            content: [
              [
                {
                  name: 'Withdraw Count',
                  value: Number.parseInt(res.data?.withdrawCount)
                }
              ],
              [
                {
                  name: 'Withdraw Asset Volume',
                  value: Number.parseInt(res.data?.withdrawAssetVolume) / 10**8,
                  usd: true
                },
                {
                  name: 'Withdraw RUNE Volume',
                  value: Number.parseInt(res.data?.withdrawRuneVolume) / 10**8,
                  usd: true
                },
                {
                  name: 'Withdraw Volume',
                  value: Number.parseInt(res.data?.withdrawVolume) / 10**8,
                  usd: true
                }
              ]
            ]
          }
        ];
      })
      .catch((e) => console.error(e));
  },
  data() {
    return {
      pool: [],
      poolStats: []
    };
  },
  apollo: {
    $prefetch: false,
    pool: {
      query: poolQuery,
      update(data) {
        return data;
      },
      variables() {
        let d = new Date();
        const until = Math.round(Date.now() / 1000);
        const from = Math.round(d.setDate(d.getDate() - 7) / 1000);

        return { until, from, asset: this.poolName };
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.pool-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  flex-direction: column;

  .asset-icon {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    margin-bottom: 1rem;
  }

  .pool-header {
    font-weight: bold;
    color: #e6e6e6;
    text-align: center;
  }

  @include sm {
    flex-direction: row;
    justify-content: flex-start;

    .asset-icon {
      width: 1.5rem;
      height: 1.5rem;
      margin-right: 0.4rem;
      margin-bottom: 0rem;
    }

    .pool-header {
      text-align: initial;
      word-break: break-word;
      font-size: 1.2rem;
    }
  }

  .pool-overview {
    margin-top: 1rem;
    width: 100%;
    display: flex;
    flex-direction: column;
    background-color: #191c1e;
    border: 1px solid #263238;
    padding: 1rem;
    border-radius: 0.4rem;

    .chart-wrapper {
      border-color: transparent;
    }
  }

  .pool-detail-header {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
    grid-gap: 0.5rem;

    .item {
      .header {
        font-size: 0.8rem;
      }

      .value {
        color: #e6e6e6;
      }
    }
  }
}

.loading {
  display: flex;
  justify-content: center;
}
</style>