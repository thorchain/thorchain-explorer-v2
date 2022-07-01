<template>
  <div class="txs-component-container">
    <template v-if="!loading">
      <template v-if="txs.actions && txs.actions.length > 0">
        <div class="tx-container" v-for="(tx, idx) in txs.actions" :key="idx">
          <div class="tx-header">
            <div class="action">{{tx.type | capitalize }}</div>
            <div class="date">{{ (new Date(tx.date/10**6)).toLocaleDateString() }}</div>
            <div class="time">{{ (new Date(tx.date/10**6)).toLocaleTimeString() }}</div>
          </div>
          <div class="tx-content">
            <div class="tx-in">
              <div class="bubble-container">In</div>
              <a v-if="tx.in[0].txID" class="tx" @click="gotoTx(tx.in[0].txID)">{{(tx.in[0].txID.slice(0,4)+'...'+tx.in[0].txID.slice(end=-4))}}</a>
              <!-- in coin -->
              <div style="margin: .5rem 0; display: flex; align-items: center;" v-if="tx.in[0].coins[0]">
                <img class="asset-icon" :src="assetImage(tx.in[0].coins[0].asset)" alt="in-coin" @error="imgErr">
                <span style="line-height: 1.2rem; margin-left: .4rem">{{(tx.in[0].coins[0].amount/1e8).toFixed(8)}} {{tx.in[0].coins[0].asset | shortSymbol}}</span>
              </div>
              <!-- address -->
              <a v-if="tx.in[0].address" class="address" @click="gotoAddr(tx.in[0].address)">{{tx.in[0].address.slice(0,4)+'...'+tx.in[0].address.slice(end=-4)}}</a>
            </div>
            <!-- check pending status -->
            <div v-if="tx.out.length > 0" class="tx-out">
              <right-arrow class="icon-arrow"></right-arrow>
              <div class="bubble-container blue">Out</div>
              <a v-if="tx.out[0].txID" @click="gotoTx(tx.out[0].txID)" class="tx">{{(tx.out[0].txID.slice(0,4)+'...'+tx.out[0].txID.slice(end=-4))}}</a>
              <!-- out coin -->
              <div style="margin: .5rem 0; display: flex; align-items: center;" v-if="tx.out[0].coins[0]">
                <img class="asset-icon" :src="assetImage(tx.out[0].coins[0].asset)" alt="out-coin" @error="imgErr">
                <span style="line-height: 1.2rem; margin-left: .4rem">{{(tx.out[0].coins[0].amount/1e8).toFixed(8)}} {{tx.out[0].coins[0].asset | shortSymbol}}</span>
              </div>
              <!-- address -->
              <a v-if="tx.out[0].address" class="address" @click="gotoAddr(tx.out[0].address)">{{tx.out[0].address.slice(0,4)+'...'+tx.out[0].address.slice(end=-4)}}</a>
            </div>
          </div>
        </div>
      </template>
      <div v-else>
        <div class="no-tx">
          <span>No transaction has been found in Midgard</span>
        </div>
      </div>
    </template>
    <div v-else class="loading">
      <BounceLoader color="var(--font-color)" size="3rem" />
    </div>
  </div>
</template>

<script>
import rightArrow from '~/assets/images/arrow-small-right.svg?inline';
import { AssetImage } from '~/classes/assetImage';
import BounceLoader from "vue-spinner/src/BounceLoader.vue";

export default {
  props: ['txs', 'loading'],
  components: {
    rightArrow,
    BounceLoader
  },
  methods: {
    assetImage(assetStr) {
      try {
        return AssetImage(assetStr) ?? require('~/assets/images/unknown.png');
      }
      catch (e) {
        console.error(e)
        return require('~/assets/images/unknown.png');
      }
    },
    gotoTx(txid) {
      this.$router.push({ path: `/tx/${txid}` })
    },
    gotoAddr(address) {
      this.$router.push({ path: `/address/${address}` })
    },
    imgErr(e) {
      e.target.src = require('~/assets/images/unknown.png');
    }
  },
  filters: {
    shortSymbol: function(assetStr) {
      if (assetStr.includes('-')) {
        let assetStrSplit = assetStr.split('-');
        if (assetStrSplit[1].length > 8)
          return assetStrSplit[0] + '-' + assetStrSplit[1].slice(0,4) + '...' + assetStrSplit[1].slice(-4);
        else
          return assetStr
      } else {
        return assetStr;
      }
    }
  }
}
</script>

<style lang="scss">
.txs-component-container {
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  border-width: 1px 0 1px 0;

  @include lg {
    border-width: 1px;
    border-radius: .5rem;
  }

  .loading {
    height: 10rem;
    align-items: center;
  }

  .no-tx {
    padding: 1rem;
  }

  .tx-container {
    display: flex;
    flex: 1 1 100%;
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
    overflow: auto;

    &:last-of-type {
      border-bottom: none;
    }

    .tx-header {
      display: flex;
      flex-direction: column;

      .action {
        color: var(--sec-font-color);
      }

      .date {
        margin-top: .5rem;
      }
    }

    .tx-content {
      display: flex;
      flex: 1;
      border: 1px solid var(--border-color);
      border-radius: .5rem;
      margin-left: 2rem;
      
      > * {
        color: var(--sec-font-color);
        padding: .7rem;
        flex: 1 1 50%;
      }

      .tx {
        cursor: pointer;
        color: var(--primary-color);
        margin-left: .2rem;
        display: inline-block;
      }

      .tx-out {
        position: relative;
        border-left: 1px solid var(--border-color);
        padding-left: 2rem;
        min-height: 4rem;
      }

      .address {
        cursor: pointer;
        color: var(--primary-color);
      }

      .icon-arrow {
        fill: var(--font-color);
        background-color: var(--border-color);
        border-radius: 50%;
        position: absolute;
        width: 2rem;
        left: -1rem;
        top: calc(50% - 1rem);
      }

      .asset-icon {
        width: 1.2rem;
        height: 1.2rem;
        border-radius: 50%;
      }
    }

  }
}

</style>