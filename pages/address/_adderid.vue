<template>
  <Page>
    <div class="address-container">
      <div class="address-header">
        <WalletIcon class="icon" />
        <span>{{ isVault?vaultType:'Address' }}</span>
      </div>
      <div class="address-name">
        <span style="color: var(--primary-color)">{{ address }}</span>
        <div class="icon-wrapper" style="margin-left: .7rem;" @click="copy(address)">
          <span class="icon-name">{{ copyText }}</span>
          <CopyIcon class="icon small" />
        </div>
        <div class="icon-wrapper qr-wrapper" style="margin-left: .7rem;" @mouseover="showQR = true" @mouseleave="showQR = false">
          <span class="icon-name">QR</span>
          <ExpandIcon class="icon small" />
          <transition name="fade">
            <div v-show="showQR" class="qr-show">
              <qrcode-vue :value="address" />
            </div>
          </transition>
        </div>
      </div>
      <template v-if="addrTxs">
        <div class="stat-wrapper mb-1">
          <Nav :active-mode.sync="activeMode" :nav-items="[{text: 'Balances', mode: 'balance'},{text: 'THORName', mode: 'thorname'}, {text: 'Pools', mode: 'pools'}]" />
          <balance v-if="activeMode == 'balance'" :state="addressStat" :balance="balance" />
          <template v-else-if="activeMode == 'thorname'">
            <stat-table :table-settings="thornames" />
            <div v-if="thornameAddresses.length > 0" class="simple-card">
              <div class="card-header">
                Thorname Addresses
              </div>
              <div class="card-body">
                <div class="addresses-container">
                  <div v-for="address in thornameAddresses" :key="address.chain" class="addresses">
                    <img class="asset-icon" :src="assetImage(baseChainAsset(address.chain))">
                    <span class="clickable mono" @click="gotoAddr(address.address)">{{ address.address.slice(0,8) }}...{{ address.address.slice(-8) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <keep-alive>
            <pools v-if="activeMode == 'pools'" :address="address" />
          </keep-alive>
        </div>
        <template v-if="isVault">
          <Card extra-class="mb-1" :navs="[{title: 'Chain Addresses', value: 'chain-addr'}, {title: 'Node Members', value: 'node-mmb'}]" :act-nav.sync="vaultMode">
            <div v-if="vaultMode == 'chain-addr'" key="chain-addr">
              <div class="addresses-container">
                <div v-for="address in chainAddresses" :key="address.chain" class="addresses">
                  <img class="asset-icon" :src="assetImage(baseChainAsset(address.chain))">
                  <span class="clickable mono" @click="gotoAddr(address.address)">{{ address.address.slice(0,8) }}...{{ address.address.slice(-8) }}</span>
                </div>
              </div>
            </div>
            <div v-if="vaultMode == 'node-mmb'" key="node-mmb">
              <div class="addresses-container">
                <div v-for="address in nodeAddresses" :key="address.chain" class="addresses">
                  <span class="clickable mono" @click="gotoAddr(address.address)">{{ address.slice(0,8) }}...{{ address.slice(-8) }}</span>
                </div>
              </div>
            </div>
          </Card>
          <div class="simple-card mb-1">
            <div class="card-header">
              Vault Balances
            </div>
            <div class="card-body">
              <vue-good-table
                v-if="vaultInfo"
                :columns="cols"
                :rows="vaultInfo.coins"
                style-class="vgt-table net-table vgt-compact"
                :pagination-options="{
                  enabled: true,
                  perPage: 30,
                  perPageDropdownEnabled: false,
                }"
              >
                <template slot="table-row" slot-scope="props">
                  <div v-if="props.column.field == 'asset'" v-tooltip="props.row.asset" class="cell-content clickable" @click="gotoPool(props.row.asset)">
                    <img class="table-asset-icon" :src="assetImage(props.row.asset)" alt="asset-icon">
                    <span>{{ props.formattedRow[props.column.field] }}</span>
                  </div>
                  <span v-else-if="props.column.field == 'amount'">
                    <span>{{ props.formattedRow[props.column.field] }}
                      <span class="extra-text">
                        {{ showAsset(props.row.asset) }}
                      </span>
                    </span>
                  </span>
                  <span v-else>
                    {{ props.formattedRow[props.column.field] }}
                  </span>
                </template>
              </vue-good-table>
            </div>
          </div>
        </template>
        <template>
          <transactions v-if="addrTxs && addrTxs.actions" :txs="addrTxs" :loading="loading" />
          <pagination v-if="addrTxs && addrTxs.actions && count" :limit="10" :offset="offset" :count="count" @changePage="getActions" />
        </template>
      </template>
      <div v-else-if="!addrTxs" class="error-container">
        Can't Fetch the Address! Please Try again Later.
      </div>
    </div>
  </Page>
</template>

<script>
import QrcodeVue from 'qrcode.vue'
import { mapGetters } from 'vuex'
import Balance from './components/balance.vue'
import Pools from './components/pools.vue'
import WalletIcon from '~/assets/images/wallet.svg?inline'
import CopyIcon from '~/assets/images/copy.svg?inline'
import ExpandIcon from '~/assets/images/expand.svg?inline'
import { formatAsset } from '~/utils'

export default {
  components: {
    WalletIcon,
    CopyIcon,
    ExpandIcon,
    QrcodeVue,
    Balance,
    Pools
  },
  async asyncData ({ params, $api }) {
    const address = params.adderid
    const addrTxs = await $api.getAddress(address, 0).catch((e) => {
      console.error(e)
    })
    const count = addrTxs?.data?.count ?? 0
    let balance = 0
    let otherBalances = []
    if (address.match(/^[st]?thor.*/gmi)) {
      try {
        const balances = (await $api.getBalance(address)).data.result
        const index = balances.findIndex((object) => {
          return object.denom === 'rune'
        })

        if (index !== -1) {
          balance = Number.parseFloat(balances[index]?.amount) / 10 ** 8 ?? 0
          balances.splice(index, 1)
        }

        otherBalances = balances.map((item) => {
          return [{
            name: 'Synth ' + item.denom.toUpperCase(),
            value: (item?.amount / 10 ** 8).toFixed(8),
            filter: true
          }]
        })
      } catch (e) {
        console.warn('can\'t get the balances')
      }
    }

    return { address, addrTxs: addrTxs?.data, count, balance, otherBalances }
  },
  data () {
    return {
      offset: 0,
      count: undefined,
      loading: false,
      balance: undefined,
      copyText: 'Copy',
      showQR: false,
      thornames: undefined,
      activeMode: 'balance',
      isVault: false,
      chainAddresses: [],
      vaultInfo: undefined,
      thornameAddresses: [],
      vaultType: 'Asgard',
      vaultMode: 'chain-addr',
      nodeAddresses: [],
      cols: [
        {
          label: 'Asset',
          field: 'asset',
          formatFn: formatAsset
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
    addressStat () {
      const otherBalances = this.otherBalances ?? []
      let vaultInfo = []
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
              value: this.vaultInfo?.inbound_tx_count
            },
            {
              name: 'Outbound Txs',
              value: this.vaultInfo?.outbound_tx_count
            }
          ],
          [
            {
              name: 'Block Height',
              value: this.vaultInfo?.block_height
            }
          ]
        ]
      }
      return [
        [
          {
            name: 'Balance'
          },
          {
            name: 'Transactions',
            value: this.count
          }
        ],
        ...otherBalances,
        ...vaultInfo
      ]
    },
    ...mapGetters({
      runePrice: 'getRunePrice',
      nodesData: 'getNodesData'
    })
  },
  watch: {
    nodesData () {
      this.fillNodesAddresses()
    }
  },
  mounted () {
    this.rlookThorname(this.address)
    this.checkIsVault(this.address)
  },
  methods: {
    getActions (offset = 0) {
      this.loading = true
      this.offset = offset
      this.$api.getAddress(this.address, this.offset)
        .then((res) => {
          this.addrTxs = res.data
          this.count = res.data.count
        })
        .catch((error) => {
          console.error(error)
        })
        .finally(() => {
          this.loading = false
        })
    },
    checkThornameAddresses (names) {
      if (!names) {
        return
      }

      names.forEach((n) => {
        this.$api.getThorname(n).then((res) => {
          if (this.thornameAddresses.length < res.data?.entries.length) {
            this.thornameAddresses = res.data?.entries
          }
        })
      })
    },
    rlookThorname (address) {
      this.$api.getRevThorname(address)
        .then((res) => {
          const names = res?.data
          this.thornames = names.map((n) => {
            return [{
              name: 'Address Name',
              value: n,
              filter: true
            }]
          })
          this.checkThornameAddresses(names)
        })
        .catch((e) => {
          if (e.response.status === 404) {
            this.thornames = [[
              {
                name: 'Address Name',
                value: 'Not assigned',
                filter: true
              }
            ]]
          } else { console.error(e) }
        })
    },
    checkIsVault (address) {
      this.$api.getAsgard().then(({ data }) => {
        for (const vaultIndex in data) {
          if (data[vaultIndex].addresses.map(a => a.address.toUpperCase()).includes(address.toUpperCase())) {
            this.isVault = true
            this.vaultType = 'Asgard'
            this.chainAddresses = data[vaultIndex].addresses
            this.vaultInfo = data[vaultIndex]
          }
        }
      }).catch(e => console.error(e))
      this.$api.getYggdrasil().then(({ data }) => {
        for (const vaultIndex in data) {
          if (data[vaultIndex].addresses.map(a => a.address.toUpperCase()).includes(address.toUpperCase())) {
            this.isVault = true
            this.vaultType = 'Yggdrasil'
            this.chainAddresses = data[vaultIndex].addresses
            this.vaultInfo = data[vaultIndex]
          }
        }
      }).catch(e => console.error(e))
    },
    fillNodesAddresses () {
      this.nodeAddresses = []
      if (this.nodesData && this.vaultInfo) {
        this.nodesData.forEach((n) => {
          const nodePubKey = n?.pub_key_set?.secp256k1
          if (nodePubKey && this.vaultInfo?.membership.includes(nodePubKey)) {
            this.nodeAddresses.push(n.node_address)
          }
        })
      }
      console.log(this.nodeAddresses)
    }
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
      z-index: 2;
      border: 1px solid var(--border-color);
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
    padding: 0 .8rem;

    span {
      margin-left: .7rem;
      line-height: 1.5rem;
      font-size: 1.5rem;
      color: var(--sec-font-color);
    }
  }
  .address-name {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin: .4rem 0;
    font-weight: bold;
    color: var(--font-color);
    padding: 0 .8rem;
  }
}

.cell-content {
  display: flex;
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

.stat-wrapper {
  .value {
    color: var(--primary-color);
  }
}
</style>
