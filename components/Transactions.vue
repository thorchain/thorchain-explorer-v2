<template>
  <div class="txs-component-container">
    <template v-if="!loading">
      <template v-if="txs.actions && txs.actions.length > 0">
        <div v-for="(tx, idx) in txs.actions" :key="idx" class="tx-container">
          <div class="tx-header">
            <div class="action bubble-container grey">
              {{ tx.type | capitalize }}
            </div>
            <div :class="['action bubble-container blue', {'green': tx.status == 'success'}]" style="margin-top: .2rem;">
              {{ tx.status | capitalize }}
            </div>
            <div class="date">
              {{ (new Date(tx.date/10**6)).toLocaleDateString() }}
            </div>
            <div class="time">
              {{ (new Date(tx.date/10**6)).toLocaleTimeString() }}
            </div>
            <div class="since">
              ({{ since(tx.date) }})
            </div>
          </div>
          <div class="tx-content">
            <div class="tx-in">
              <div v-for="(t, j) in tx.in" :key="j" class="tx-contain">
                <div>
                  <div class="bubble-container">
                    In
                  </div>
                  <div v-if="t.coins[0] && checkSynth(t.coins[0].asset)" class="bubble-container yellow">
                    Synth
                  </div>
                  <a v-if="t.txID" class="tx" @click="gotoTx(t.txID)">{{ (t.txID.slice(0,4)+'...'+t.txID.slice(end=-4)) }}</a>
                </div>
                <!-- in coin -->
                <div v-if="t.coins[0]" style="display: flex; align-items: center;">
                  <img class="asset-icon" :src="assetImage(t.coins[0].asset)" alt="in-coin" @error="imgErr">
                  <span style="line-height: 1.2rem; margin-left: .4rem">{{ (t.coins[0].amount/1e8).toFixed(8) }} {{ t.coins[0].asset | shortSymbol }}</span>
                </div>
                <!-- address -->
                <a v-if="t.address" class="address" @click="gotoAddr(t.address)">{{ t.address.slice(0,4)+'...'+t.address.slice(end=-4) }}</a>
              </div>
            </div>
            <!-- check pending status -->
            <div v-if="tx.out.length > 0" class="tx-out">
              <right-arrow class="icon-arrow" />
              <div v-for="(t, j) in tx.out" :key="j" class="tx-contain">
                <!-- out coin -->
                <div>
                  <div class="bubble-container blue">
                    Out
                  </div>
                  <div v-if="checkSynth(t.coins[0] && t.coins[0].asset)" class="bubble-container yellow">
                    Synth
                  </div>
                  <a v-if="t.txID" class="tx" @click="gotoTx(t.txID)">{{ (t.txID.slice(0,4)+'...'+t.txID.slice(end=-4)) }}</a>
                </div>
                <div v-if="t.coins[0]" style="display: flex; align-items: center;">
                  <img class="asset-icon" :src="assetImage(t.coins[0].asset)" alt="out-coin" @error="imgErr">
                  <span style="line-height: 1.2rem; margin-left: .4rem">{{ (t.coins[0].amount/1e8).toFixed(8) }} {{ t.coins[0].asset | shortSymbol }}</span>
                </div>
                <!-- address -->
                <a v-if="t.address" class="address" @click="gotoAddr(t.address)">{{ t.address.slice(0,4)+'...'+t.address.slice(end=-4) }}</a>
              </div>
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
import BounceLoader from 'vue-spinner/src/BounceLoader.vue'
import { assetFromString, isSynthAsset } from '@xchainjs/xchain-util'
import moment from 'moment'
import { AssetImage } from '~/classes/assetImage'
import rightArrow from '~/assets/images/arrow-small-right.svg?inline'

export default {
  components: {
    rightArrow,
    BounceLoader
  },
  filters: {
    shortSymbol (assetStr) {
      if (assetStr?.includes('-')) {
        const assetStrSplit = assetStr.split('-')
        if (assetStrSplit[1].length > 8) { return assetStrSplit[0] + '-' + assetStrSplit[1].slice(0, 4) + '...' + assetStrSplit[1].slice(-4) } else { return assetStr }
      } else {
        return assetStr
      }
    }
  },
  props: ['txs', 'loading'],
  methods: {
    assetImage (assetStr) {
      try {
        return AssetImage(assetStr) ?? require('~/assets/images/unknown.png')
      } catch (e) {
        console.error(e)
        return require('~/assets/images/unknown.png')
      }
    },
    gotoTx (txid) {
      this.$router.push({ path: `/tx/${txid}` })
    },
    gotoAddr (address) {
      this.$router.push({ path: `/address/${address}` })
    },
    imgErr (e) {
      e.target.src = require('~/assets/images/unknown.png')
    },
    since (date) {
      console.log(date)
      return moment(date / 1e6).fromNow()
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

    .since, .date, .time {
      font-size: .875rem;
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

      .tx-in {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .tx-out {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 10px;
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

.tx-contain {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tx-out .tx-contain:not(:first-of-type), .tx-in .tx-contain:not(:first-of-type) {
  border-top: 1px solid var(--border-color);
  padding-top: 0.8rem;
}
</style>
