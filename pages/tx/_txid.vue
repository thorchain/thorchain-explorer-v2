<template>
  <div class="tx-container">
    <template v-if="tx">
      <div class="tx-header">Transaction</div>
      <div class="tx-id">{{ tx.in[0].txID }}</div>
      <div class="utility">
        <div class="icon-wrapper" @click="copy(tx.in[0].txID)">
          <span class="icon-name">{{ copyText }}</span>
          <CopyIcon class="icon small" />
        </div>
      </div>
      <div class="tx-date">
        {{ new Date(tx.date / 10 ** 6).toLocaleString() }}
      </div>
      <div style="margin: 1rem 0"></div>
      <div class="tx-inner-container">
        <div class="in-container">
          <div class="bubble">In</div>
          <div
            class="tx"
            v-if="tx.in[0] && tx.in[0].txID"
            @click="gotoTx(tx.in[0].txID)"
          >
            {{ tx.in[0].txID.slice(0, 4) }}...{{ tx.in[0].txID.slice(-4) }}
          </div>
          <div class="break"></div>
          <div class="tx-amount" v-if="tx.in[0] && tx.in[0].coins[0]">
            <img
              class="asset-coin"
              :src="assetImage(tx.in[0].coins[0].asset)"
              alt="in-coin"
            />
            <span
              >{{
                (tx.in[0].coins[0].amount / 10 ** 8) | number("0,0.00000000")
              }}
              {{ tx.in[0].coins[0].asset }}</span
            >
          </div>
          <div class="break"></div>
          <a
            class="tx-address"
            v-if="tx.in[0].address"
            @click="gotoAddress(tx.in[0].address)"
          >
            {{ tx.in[0].address.slice(0, 6) }}...{{ tx.in[0].address.slice(-6) }}
          </a>
        </div>
        <div class="out-container" v-if="tx.out[0]">
          <div class="bubble">Out</div>
          <div class="tx" v-if="tx.out[0].txID" @click="gotoTx(tx.out[0].txID)">
            {{ tx.out[0].txID.slice(0, 4) }}...{{ tx.out[0].txID.slice(-4) }}
          </div>
          <div class="break"></div>
          <div class="tx-amount" v-if="tx.out[0].coins[0]">
            <img
              class="asset-coin"
              :src="assetImage(tx.out[0].coins[0].asset)"
              alt="in-coin"
            />
            <span
              >{{
                (tx.out[0].coins[0].amount / 10 ** 8) | number("0,0.00000000")
              }}
              {{ tx.out[0].coins[0].asset }}</span
            >
          </div>
          <div class="break"></div>
          <a
            class="tx-address"
            v-if="tx.out[0].address"
            @click="gotoAddress(tx.out[0].address)"
          >
            {{ tx.out[0].address.slice(0, 6) }}...{{
              tx.out[0].address.slice(-6)
            }}
          </a>
        </div>
      </div>
      <stat-table :tableSettings="extraDetail"></stat-table>
    </template>
    <div v-else class="error-container">
      Can't Fetch the Transaction! Please Try again Later.
    </div>
  </div>
</template>

<script>
import { AssetImage } from "~/classes/assetImage";
import CopyIcon from "~/assets/images/copy.svg?inline";

export default {
  methods: {
    assetImage(assetStr) {
      try {
        return AssetImage(assetStr) ?? require("~/assets/images/unknown.png");
      } catch (error) {
        console.error(error);
        return require("~/assets/images/unknown.png");
      }
    },
    gotoAddress(address) {
      this.$router.push({ path: `/address/${address}` });
    },
    gotoTx(hash) {
      this.$router.push({ path: `/tx/${hash}` });
    },
    copy(hash) {
      navigator.clipboard.writeText(hash).then(
        () => {
          this.copyText = "Copied Hash";
          setTimeout(() => {
            this.copyText = "Copy Hash";
          }, 2000);
        },
        (err) => {
          console.error("Could not copy text: ", err);
        }
      );
    },
  },
  async asyncData({ params, $api }) {
    const txid = params.txid;
    const tx = await $api.getTx(txid).catch(e => {
      console.error(e)
    });
    return { txid, tx: tx?.data?.actions[0] };
  },
  components: {
    CopyIcon,
  },
  data() {
    return {
      copyText: "Copy Hash",
    };
  },
  computed: {
    extraDetail: function () {
      let res = [
        [
          {
            name: "Block Height",
            value: this.tx?.height,
          },
          {
            name: "Status",
            value: this.$options.filters.capitalize(this.tx?.status),
            filter: true,
          },
          {
            name: "Type",
            value: this.$options.filters.capitalize(this.tx?.type),
            filter: true,
          },
        ],
      ];

      let gasFee = undefined;
      if (this.tx?.metadata && this.tx?.metadata[Object.keys(this.tx?.metadata)[0]].networkFees) {
        gasFee = {
          name: "Gas Fee",
          value:
            this.$options.filters.number(
              Number.parseInt(
                this.tx?.metadata[Object.keys(this.tx?.metadata)[0]]
                  ?.networkFees[0].amount
              ) /
                10 ** 8,
              "0.00000000"
            ) +
            " " +
            this.tx?.metadata[Object.keys(this.tx?.metadata)[0]]?.networkFees[0]
              .asset,
          filter: true
        };
        res.push([gasFee])
      }

      return res;
    },
  },
};
</script>

<style lang="scss" scoped>
.tx-container {
  .icon {
    fill: #e6e6e6;
    height: 1.5rem;

    &.small {
      height: 0.8rem;
      width: 0.8rem;
    }
  }

  .utility {
    display: flex;
  }

  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0.4rem;
    border-radius: 0.3rem;
    background-color: #191c1e;

    &:hover {
      background-color: #3e464b;
    }

    .icon-name {
      color: #e6e6e6;
      font-size: 0.625rem;
      margin-right: 0.3rem;
    }
  }

  .tx-header {
    font-size: 1.5rem;
    color: #e6e6e6;
  }

  .tx-id {
    margin: 0.4rem 0;
    color: #63fdd9;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tx-date {
    color: #e6e6e6;
    margin: 0.4rem 0;
  }

  .tx-inner-container {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    flex-wrap: wrap;
    background-color: #191c1e;
    padding: 1rem;
    border: 1px solid #263238;
    border-radius: 0.3rem;
    margin: 0.5rem 0;
    width: 100%;

    .in-container,
    .out-container {
      display: flex;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .tx {
      cursor: pointer;
      line-height: 1.2rem;
      color: #63fdd9;
    }

    .bubble {
      color: #e6e6e6;
      padding: 0 0.5rem;
      border-radius: 0.2rem;
      display: inline-block;
      background-color: #2196f3;
      margin-right: 0.5rem;
    }

    .out-container .bubble {
      background-color: #4caf50;
    }

    .tx-amount {
      display: flex;
      align-items: center;
      margin: 0.5rem 0;
      color: #e6e6e6;

      span {
        line-height: 1.2rem;
        margin-left: 0.5rem;
      }
    }

    .asset-coin {
      width: 1.5rem;
    }

    .tx-address {
      cursor: pointer;
      color: #63fdd9;
    }

    .extra-details {
      display: flex;
      flex: 1 0;
      justify-content: space-between;
      padding: 1rem;
      margin-top: 2rem;

      .item-detail {
        display: flex;
        flex-direction: column;
        flex: 1;

        .header {
          font-size: 0.8rem;
        }

        .value {
          color: #e6e6e6;
        }
      }
    }
  }
}
</style>