<template>
  <div class="address-container">
    <div class="address-header">
      <WalletIcon class="icon" />
      <span>Address</span>
    </div>
    <div class="address-name">
      <span>{{address}}</span>
      <div class="icon-wrapper"  style="margin-left: .7rem;" @click="copy(address)">
        <span class="icon-name">{{copyText}}</span>
        <CopyIcon class="icon small"/>
      </div>
      <div class="icon-wrapper qr-wrapper"  style="margin-left: .7rem;" @mouseover="showQR = true" @mouseleave="showQR = false">
        <span class="icon-name">QR</span>
        <ExpandIcon class="icon small"/>
        <transition name="fade">
          <div v-show="showQR" class="qr-show">
            <qrcode-vue :value="address"></qrcode-vue>
          </div>
        </transition>
      </div>
    </div>
    <template v-if="addrTxs">
      <div class="stat-wrapper">
        <stat-table :tableSettings="addressStat"></stat-table>
      </div>
      <div style="margin: 1rem 0"></div>
      <transactions v-if="addrTxs && addrTxs.actions" :txs="addrTxs" :loading="loading"></transactions>
      <pagination v-if="addrTxs && addrTxs.actions && count" :limit="10" :offset="offset" :count="count" @changePage="getActions"></pagination>
    </template>
    <div class="error-container" v-else>
      Can't Fetch the Address! Please Try again Later.
    </div>
  </div>
</template>

<script>
import WalletIcon from '~/assets/images/wallet.svg?inline';
import CopyIcon from '~/assets/images/copy.svg?inline';
import ExpandIcon from '~/assets/images/expand.svg?inline';
import QrcodeVue from 'qrcode.vue'

export default {
  components: {
    WalletIcon,
    CopyIcon,
    ExpandIcon,
    QrcodeVue
  },
  data() {
    return {
      offset: 0,
      count: undefined,
      loading: false,
      balance: undefined,
      copyText: 'Copy',
      showQR: false
    }
  },
  computed: {
    addressStat: function() {
      let otherBalances = this.otherBalances ?? [];
      return [
        [
          {
            name: 'RUNE Balance',
            value: this.balance && this.$options.filters.number(this.balance, '0,0.00'),
            filter: true,
          },
          {
            name: 'Transactions',
            value: this.count
          }
        ],
        ...otherBalances
      ]
    }
  },
  methods: {
    getActions(offset=0) {
      this.loading = true;
      this.offset = offset;
      this.$api.getAddress(this.address, this.offset)
      .then(res => {
        this.addrTxs = res.data;
        this.count = res.data.count;
      })
      .catch(error => {
        console.error(error)
      })
      .finally(() => {
        this.loading = false;
      })
    },
    copy(address) {
      navigator.clipboard.writeText(address).then(() => {
        this.copyText = 'Copied';
        setTimeout(() => {
          this.copyText = 'Copy'
        }, 2000);
      }, (err) => {
        console.error('Could not copy text: ', err);
      });
    },
  },
  async asyncData({params, $api}) {
    const address = params.adderid;
    const addrTxs = await $api.getAddress(address, 0).catch(e => {
      console.error(e);
    });
    const count = addrTxs?.data?.count ?? 0;
    let balance = 0;
    let otherBalances = [];
    // TODO: change with regex
    if (address.toUpperCase().includes('THOR')) {
      try {
        let balances = (await $api.getBalance(address)).data.result;
        const index = balances.findIndex(object => {
        return object.denom === 'rune';
        });

        if (index !== -1) {
          balance = Number.parseFloat(balances[index]?.amount)/10**8 ?? 0;
          balances.splice(index, 1);
        }

        otherBalances = balances.map(item => {
          return [{
            name: 'Synth ' + item.denom.toUpperCase(),
            value: (item?.amount/10**8).toFixed(8),
            filter: true
          }]
        })
      }
      catch(e) {
        console.warn('can\'t get the balances');
      }
    }

    return { address, addrTxs: addrTxs?.data, count, balance, otherBalances }
  },
  async mounted() {
  }
}
</script>

<style lang="scss" scoped>
.address-container {
  .icon {
    fill: #e6e6e6;
    height: 1.5rem;

    &.small {
      height: .8rem;
      width: .8rem;
    }
  }

  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: .4rem;
    border-radius: .3rem;

    &:hover {
      background-color: #3E464B;
    }
    
    .icon-name {
      color: #e6e6e6;
      font-size: .625rem;
      margin-right: .3rem;
    }
  }

  .qr-wrapper {
    position: relative;

    .qr-show {
      border-radius: .3rem;
      background-color: #fff;
      padding: .625rem;
      top: calc(100% + .625rem);
      position: absolute;
    }
  }

  .utility {
    font-size: .7rem;
    line-height: .7rem;
  }

  .address-header {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;

    span {
      margin-left: .7rem;
      line-height: 1.5rem;
      font-size: 1.5rem;
      color: #e6e6e6;
    }
  }
  .address-name {
    display: flex;
    align-items: center;
    margin: .4rem 0;
    font-weight: bold;
    color: #9F9F9F;
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .2s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>