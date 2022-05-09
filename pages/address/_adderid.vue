<template>
  <div class="address-container">
    <div class="address-header">
      <WalletIcon class="icon" />
      <span>{{isVault?vaultType:'Address'}}</span>
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
        <div class="nav-headers">
          <div class="nav-item" @click="mode = 'balance'" :class="{'active': mode == 'balance'}">Balances</div>
          <div class="nav-item" @click="mode = 'thorname'" :class="{'active': mode == 'thorname'}">THORName</div>
        </div>
        <stat-table v-if="mode == 'balance'" :tableSettings="addressStat"></stat-table>
        <stat-table v-else-if="mode == 'thorname'" :tableSettings="thornames"></stat-table>
      </div>
      <div style="margin: 1rem 0"></div>
      <template v-if="isVault">
        <div class="simple-card">
          <div class="card-header">
            Chain Addresses
          </div>
          <div class="card-body">
            <div class="addresses-container">
              <div class="addresses" v-for="address in chainAddresses" :key="address.chain">
                <img class="asset-icon" :src="assetImage(baseChainAsset(address.chain))">
                <span class="clickable mono" @click="gotoAddr(address.address)">{{address.address.slice(0,8)}}...{{address.address.slice(-8)}}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="simple-card">
          <div class="card-header">
            Vault Balances
          </div>
          <div class="card-body">
            <vue-good-table
              v-if="vaultInfo"
              :columns="cols"
              :rows="vaultInfo.coins"
              styleClass="vgt-table net-table vgt-compact"
              :pagination-options="{
                enabled: true,
                perPage: 30,
                perPageDropdownEnabled: false,
              }"
            >
              <template slot="table-row" slot-scope="props">
                <div v-if="props.column.field == 'asset'" class="cell-content" v-tooltip="props.row.asset">
                  <img class="table-asset-icon" :src="assetImage(props.row.asset)" alt="asset-icon">
                  <span>{{props.formattedRow[props.column.field]}}</span>
                </div>
                <span v-else-if="props.column.field == 'amount'">
                  <span>{{props.formattedRow[props.column.field]}}
                    <span class="extra-text">
                      {{showAsset(props.row.asset)}}
                    </span>
                  </span>
                </span>
                <span v-else>
                  {{props.formattedRow[props.column.field]}}
                </span>
              </template>
            </vue-good-table>
          </div>
        </div>
      </template>
      <template>
        <transactions v-if="addrTxs && addrTxs.actions" :txs="addrTxs" :loading="loading"></transactions>
        <pagination v-if="addrTxs && addrTxs.actions && count" :limit="10" :offset="offset" :count="count" @changePage="getActions"></pagination>
      </template>
    </template>
    <div class="error-container" v-else-if="!addrTxs">
      Can't Fetch the Address! Please Try again Later.
    </div>
  </div>
</template>

<script>
import WalletIcon from '~/assets/images/wallet.svg?inline';
import CopyIcon from '~/assets/images/copy.svg?inline';
import ExpandIcon from '~/assets/images/expand.svg?inline';
import QrcodeVue from 'qrcode.vue'
import { formatAsset } from '~/utils';

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
      showQR: false,
      thornames: undefined,
      mode: 'balance',
      isVault: false,
      chainAddresses: [],
      vaultInfo: undefined,
      vaultType: 'Asgard',
      cols: [
        {
          label: 'Asset',
          field: 'asset',
          formatFn: formatAsset,
        },
        {
          label: 'Balance',
          field: 'amount',
          formatFn: this.baseAmountFormat
        }
      ]
    }
  },
  computed: {
    addressStat: function() {
      let otherBalances = this.otherBalances ?? [];
      let vaultInfo = [];
      if (this.isVault) {
        vaultInfo = [
          [
            {
              name: 'Vault type',
              value: this.vaultType,
              filter: true
            },
            {
              name: 'Status',
              value: this.vaultInfo?.status,
              filter: true
            },
            {
              name: 'Inbound Txs',
              value: this.vaultInfo?.inbound_tx_count,
            },
            {
              name: 'Outbound Txs',
              value: this.vaultInfo?.outbound_tx_count,
            }
          ],
          [
            {
              name: 'Block Height',
              value: this.vaultInfo?.block_height,
            }
          ]
        ]
      }
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
        ...otherBalances,
        ...vaultInfo
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
    rlookThorname(address) {
      this.$api.getRevThorname(address)
      .then(res => {
        const names = res?.data;
        this.thornames = names.map(n => {
          return [{
            name: 'Address Name',
            value: n,
            filter: true
          }]
        })
      })
      .catch(e => {
        if (e.response.status == 404) {
          this.thornames = [[
            {
              name: 'Address Name',
              value: 'Not assigned',
              filter: true
            }
          ]]
        }
        else 
          console.error(e);
      })
    },
    checkIsVault(address) {
      this.$api.getAsgard().then(({data}) => {
        for (let vaultIndex in data) {
          if (data[vaultIndex].addresses.map(a => a.address.toUpperCase()).includes(address.toUpperCase())) {
            this.isVault = true;
            this.vaultType = 'Asgard';
            this.chainAddresses = data[vaultIndex].addresses;
            this.vaultInfo = data[vaultIndex];
          }
        }
      }).catch(e => console.error(e));
      this.$api.getYggdrasil().then(({data}) => {
        for (let vaultIndex in data) {
          if (data[vaultIndex].addresses.map(a => a.address.toUpperCase()).includes(address.toUpperCase())) {
            this.isVault = true;
            this.vaultType = 'Yggdrasil';
            this.chainAddresses = data[vaultIndex].addresses;
            this.vaultInfo = data[vaultIndex];
          }
        }
      }).catch(e => console.error(e));
    }
  },
  async asyncData({params, $api}) {
    const address = params.adderid;
    const addrTxs = await $api.getAddress(address, 0).catch(e => {
      console.error(e);
    });
    const count = addrTxs?.data?.count ?? 0;
    let balance = 0;
    let otherBalances = [];
    if (address.match(/^[st]?thor.*/gmi)) {
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
    this.rlookThorname(this.address);
    this.checkIsVault(this.address);
  }
}
</script>

<style lang="scss" scoped>
.address-container {
  .icon {
    fill: var(--sec-font-color);
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
      background-color: var(--active-bg-color);
    }
    
    .icon-name {
      color: var(--sec-font-color);
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
      color: var(--sec-font-color);
    }
  }
  .address-name {
    display: flex;
    align-items: center;
    margin: .4rem 0;
    font-weight: bold;
    color: var(--font-color);
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .2s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

.nav-headers {
  margin-bottom: .2rem;
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 5px;

  .nav-item {
    margin: .2rem;
    font-size: .875rem;
    cursor: pointer;

    &.active {
      color: var(--primary-color);
    }
  }
}

.addresses-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 10px;
  align-items: center;
  justify-items: center;

  .addresses {
    display: flex;
    align-items: center;
  }
}
</style>