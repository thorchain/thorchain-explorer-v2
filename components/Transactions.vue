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
              <div class="bubble">In</div>
              <a v-if="tx.in[0].txID" class="tx" @click="gotoTx(tx.in[0].txID)">{{(tx.in[0].txID.slice(0,4)+'...'+tx.in[0].txID.slice(end=-4))}}</a>
              <!-- in coin -->
              <div style="margin: .5rem 0; display: flex; align-items: center;" v-if="tx.in[0].coins[0]">
                <img class="asset-icon" :src="assetImage(tx.in[0].coins[0].asset)" alt="in-coin" @error="imgErr">
                <span style="line-height: 1.2rem; margin-left: .4rem">{{(tx.in[0].coins[0].amount/10**8) | number('0,0.00000000')}} {{tx.in[0].coins[0].asset | shortSymbol}}</span>
              </div>
              <!-- address -->
              <a v-if="tx.in[0].address" class="address" @click="gotoAddr(tx.in[0].address)">{{tx.in[0].address.slice(0,4)+'...'+tx.in[0].address.slice(end=-4)}}</a>
            </div>
            <!-- check pending status -->
            <div v-if="tx.out.length > 0" class="tx-out">
              <right-arrow class="icon-arrow"></right-arrow>
              <div class="bubble">Out</div>
              <a v-if="tx.out[0].txID" @click="gotoTx(tx.out[0].txID)" class="tx">{{(tx.out[0].txID.slice(0,4)+'...'+tx.out[0].txID.slice(end=-4))}}</a>
              <!-- out coin -->
              <div style="margin: .5rem 0; display: flex; align-items: center;" v-if="tx.out[0].coins[0]">
                <img class="asset-icon" :src="assetImage(tx.out[0].coins[0].asset)" alt="out-coin" @error="imgErr">
                <span style="line-height: 1.2rem; margin-left: .4rem">{{(tx.out[0].coins[0].amount/10**8) | number('0,0.00000000')}} {{tx.out[0].coins[0].asset | shortSymbol}}</span>
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
      <BounceLoader color="#9F9F9F" size="3rem" />
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
  border-radius: .5rem;
  background-color: #191C1E;
  border: 1px solid #263238;

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
    border-bottom: 1px solid #263238;
    overflow: auto;

    &:last-of-type {
      border-bottom: none;
    }

    .tx-header {
      display: flex;
      flex-direction: column;

      .action {
        color: #e6e6e6;
      }

      .date {
        margin-top: .5rem;
      }
    }

    .tx-content {
      display: flex;
      flex: 1;
      border: 1px solid #263238;
      border-radius: .5rem;
      margin-left: 2rem;
      
      > * {
        color: #e6e6e6;
        padding: .7rem;
        flex: 1 1 50%;
      }

      .bubble {
        line-height: 17px;
        padding: 0 .5rem;
        border-radius: .2rem;
        display: inline-block;
        background-color: #2196F3;
      }

      .tx {
        cursor: pointer;
        color: #63FDD9;
        margin-left: .2rem;
        display: inline-block;
      }

      .tx-out {
        position: relative;
        border-left: 1px solid #263238;
        padding-left: 2rem;
        min-height: 4rem;

        .bubble {
          background-color: #4CAF50;
        }
      }

      .address {
        cursor: pointer;
        color: #63FDD9;
      }

      .icon-arrow {
        fill: #9f9f9f;
        background-color: #263238;
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