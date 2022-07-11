<template>
  <Page>
    <template v-if="!isError && !isLoading">
      <div class="tx-header">
        <h3>
          Transaction
          <span v-if="tx.type" class="bubble-container" style="margin-left: 0.2rem">{{tx.type}}</span>
          <span v-if="tx.status" class="bubble-container blue" style="margin-left: 0.2rem">{{tx.status}}</span>
          <span v-if="tx.synth" class="bubble-container yellow" style="margin-left: 0.2rem">synth</span>
        </h3>
      </div>
      <div class="utility">
        <div class="tx-id clickable" @click="gotoTx($route.params.txhash)">{{ $route.params.txhash }}</div>
        <div class="break"></div>
        <div class="icon-wrapper" @click="copy($route.params.txhash)">
          <span class="icon-name">{{ copyText }}</span>
          <CopyIcon class="icon small"/>
        </div>
      </div>
      <div class="tx-date">
        {{ tx.date.toLocaleString() }} ({{fromNow(tx.date)}})
      </div>
      <div style="margin: .2rem 0"></div>
      <div v-for="(txa, j) in tx.inout" :key="j">
        <div class="tx-container" v-if="tx">
          <div class="tx-contain" v-for="(txs, i) in txa" :key="i">
            <div v-for="(one_tx, j) in txs" :key="j">
              <template v-if="one_tx.is">
                <div class="txid">
                  <div :class="['bubble-container', i?'blue':'']">{{i?'Out':'In'}}</div>
                  <span class="tx-hash clickable" @click="gotoTx(one_tx.txID)">{{one_tx.txID}}</span>
                </div>
                <div class="asset-icon-container">
                  <img
                    class="asset-icon"
                    :src="assetImage(one_tx.asset.name)"
                    alt="in-coin"
                  />
                  <span>
                    {{(+one_tx.asset.amount).toFixed(8)}} {{one_tx.asset.name}}
                  </span>
                  <div style="margin-left: .2rem" v-if="checkSynth(one_tx.asset.name)" class="bubble-container yellow">synth</div>
                </div>
                <div class="address">
                  <span v-if="one_tx.address" class="clickable" @click="gotoAddr(one_tx.address)">{{formatAddress(one_tx.address)}}</span>
                  <ArrowIcon v-if="one_tx.outAddress" class="icon small" />
                  <span v-if="one_tx.outAddress" class="clickable" @click="gotoAddr(one_tx.outAddress)">{{formatAddress(one_tx.outAddress)}}</span>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
      <div v-if="tx" class="extra-details">
        <stat-table :tableSettings="extraDetail">
          <template #Pools>
            <div v-for="p in tx.pools" class="pool-box">
              <img
                class="asset-icon"
                :src="assetImage(p)"
                alt="in-coin"
              />
              <span>{{p}}</span>
            </div>
          </template>
        </stat-table>
      </div>
    </template>
    <div v-else-if="isError" class="notify-card card-bg">
      <h3>{{error.title}}</h3>
      <span>{{error.message}}</span>
      <DisconnectIcon class="disconnect-icon"/>
    </div>
    <div v-else-if="isLoading && !isError">
      <div class="notify-card" style="width: 18.75rem">
        <h3>Searching transaction</h3>
        <progress-bar :width="loadingPercentage" :extraText="progressText + ' of queries'"></progress-bar>
      </div>
    </div>
  </Page>
</template>

<script>
import CopyIcon from "~/assets/images/copy.svg?inline";
import DisconnectIcon from "~/assets/images/disconnect.svg?inline"
import ArrowIcon from "~/assets/images/arrow-small-right.svg?inline"
import { parseCosmosTx, parseMidgardTx } from "~/utils";

export default {
  components: {
    CopyIcon,
    ArrowIcon,
    DisconnectIcon
  },
  data() {
     return {
      tx: undefined,
      isLoading: true,
      isError: false,
      copyText: "Copy Hash",
      loadingPercentage: 0,
      progressText: '',
      error: {
        title: 'Couldn\'t find the Transaction',
        message: 'Something bad happened.'
      }
    };
  },
  async mounted() {
    const txHash = this.$route.params.txhash;

    setInterval(() => {
      this.loadingPercentage = (this.loadingPercentage+8)%100;
    }, 700);

    try {
      let res;

      //Searching midgard database 
      this.progressText = "1/2";
      res = await this.$api.getTx(txHash).catch((e) => {
        if (e?.response?.status === 404) {
          this.error.message = "Please make sure the correct transaction hash or account address is inserted.";
          this.isError = true;
        }
      });

      if (res.status / 200 == 1 && res.data.count !== "0") {
        this.tx = parseMidgardTx(res.data);
        this.isLoading = false;
        this.loadingPercentage = 100;
        return;
      }

      this.progressText = "2/2";

      res = await this.$api.getNativeTx(txHash).catch((e) => {
        if (e?.response?.status === 404) {
          this.error.message = "Please make sure the correct transaction hash or account address is inserted.";
          this.isError = true;
        }
      });

      if (res.status / 200 == 1) {
        this.tx = parseCosmosTx(res.data);
        this.isLoading = false;
        this.loadingPercentage = 100;
        return;
      }

      // Commenting observe tx for now, seems midgard is supporting it now.
      // res = await this.$api.getThorchainTx(txHash).catch((e) => {
      //   if (e?.response?.status === 404) {
      //     this.error.message = "Please make sure the correct transaction hash or account address is inserted.";
      //     this.isError = true;
      //   }
      // });

      // if (res.status / 200 == 1) {
      //   parseNativeThorchainTx(res.data);
      //   this.isLoading = false;
      //   return;
      // }
    } catch (error) {
      //Please make sure the correct transaction hash or account address is inserted.
      console.error(error);
      this.isError = true
    }

  },
  computed: {
    extraDetail: function() {
      if (!this.tx) {
        return
      }

      let res = [
        [
          {
            name: "Block Height",
            value: this.tx?.height,
          },
          {
            name: "Type",
            value: this.$options.filters.capitalize(this.tx?.type),
            filter: true,
          },
          
        ],
      ];

      if (this.tx.status) {
        res.push([
          {
            name: 'Status',
            value: this.$options.filters.capitalize(this.tx.status),
            filter: true
          }
        ])
      }

      if (this.tx.pools) {
        res.push([
          {
            name: 'Pools',
            value: this.tx.pools.join('\n').trim(),
            filter: true
          }
        ])
      }

      if (this.tx.gas) {
        res.push([
          {
            name: 'Gas Fees',
            value: this.tx.gas.join('\n').trim(),
            filter: true
          }
        ])
      }

      if (this.tx.memo) {
        res.push([
          {
            name: 'Memo',
            value: this.tx.memo,
            filter: true
          }
        ])
      }

      return res;
    }
  }
};
</script>

<style lang="scss" scoped>
.tx-container {
  border: 1px solid var(--border-color);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  background: var(--card-bg-color);
  border-radius: 5px;
  padding: 20px;
  gap: 10px;
}

.tx-contain {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;

  .asset-icon-container {
    margin: 10px 0;
    display: flex;
    align-items: center;

    span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 300px;
    }
  }

  .txid {
    width: 300px;
    display: flex;
    align-items: center;
    gap: 10px;

    .tx-hash {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
}

.tx-header {
  h3 {
    display: flex;
    align-items: center;
    margin-top: 0;
  }
}

.icon {
  fill: var(--sec-font-color);
  height: 1.5rem;

  &.small {
    margin-right: 0;
    height: 0.8rem;
    width: 0.8rem;
  }
}

.extra-details {
  margin-top: 1rem;

  .pool-box {
    margin: 5px 0;
    display: flex;
    align-items: center;
  }
}

.utility, .tx-date, .tx-header {
  padding: 0 1rem;
}

.tx-id {
  word-break: break-all;
}
</style>