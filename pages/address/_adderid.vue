<template>
  <Page>
    <div class="address-container">
      <div class="address-header">
        <WalletIcon class="icon" />
        <span>{{ isVault ? vaultType : 'Address' }}</span>
      </div>
      <div class="address-name">
        <span style="color: var(--primary-color)">{{ address }}</span>
        <div
          class="icon-wrapper"
          style="margin-left: 0.7rem"
          @click="copy(address)"
        >
          <span class="icon-name">{{ copyText }}</span>
          <CopyIcon class="icon small" />
        </div>
        <div
          class="icon-wrapper qr-wrapper"
          style="margin-left: 0.7rem"
          @mouseover="showQR = true"
          @mouseleave="showQR = false"
        >
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
          <Nav
            :active-mode.sync="activeMode"
            :nav-items="[
              { text: 'Balances', mode: 'balance' },
              { text: 'THORName', mode: 'thorname' },
              { text: 'LPs/Savers', mode: 'pools' },
              { text: 'Loans', mode: 'loans' },
            ]"
          />
          <balance
            v-if="activeMode == 'balance' && !isVault"
            :state="addressStat"
          />
          <keep-alive>
            <thorname v-if="activeMode == 'thorname'" :address="address" />
          </keep-alive>
          <keep-alive>
            <pools v-if="activeMode == 'pools'" :address="address" />
          </keep-alive>
          <loans v-if="activeMode == 'loans'" :address="address" />
        </div>
        <template v-if="isVault">
          <stat-table :table-settings="addressStat"></stat-table>
          <Card
            extra-class="mb-1"
            :navs="[
              { title: 'Chain Addresses', value: 'chain-addr' },
              { title: 'Node Members', value: 'node-mmb' },
            ]"
            :act-nav.sync="vaultMode"
          >
            <div v-if="vaultMode == 'chain-addr'" key="chain-addr">
              <div class="addresses-container">
                <div
                  v-for="address in chainAddresses"
                  :key="address.chain"
                  class="addresses"
                >
                  <img
                    class="asset-icon"
                    :src="assetImage(baseChainAsset(address.chain))"
                  />
                  <span
                    class="clickable mono"
                    @click="gotoAddr(address.address)"
                    >{{ address.address.slice(0, 8) }}...{{
                      address.address.slice(-8)
                    }}</span
                  >
                </div>
              </div>
            </div>
            <div v-if="vaultMode == 'node-mmb'" key="node-mmb">
              <div class="addresses-container">
                <div
                  v-for="address in nodeAddresses"
                  :key="address.chain"
                  class="addresses"
                >
                  <span
                    class="clickable mono"
                    @click="gotoAddr(address.address)"
                    >{{ address.slice(0, 8) }}...{{ address.slice(-8) }}</span
                  >
                </div>
              </div>
            </div>
          </Card>
          <div class="simple-card mb-1">
            <card title="Vault Balances">
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
                  <div
                    v-if="props.column.field == 'asset'"
                    v-tooltip="props.row.asset"
                    class="cell-content clickable"
                    @click="gotoPool(props.row.asset)"
                  >
                    <img
                      class="table-asset-icon"
                      :src="assetImage(props.row.asset)"
                      alt="asset-icon"
                    />
                    <span>{{ props.formattedRow[props.column.field] }}</span>
                  </div>
                  <span v-else-if="props.column.field == 'amount'">
                    <span
                      >{{ props.formattedRow[props.column.field] }}
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
            </card>
          </div>
        </template>
        <template>
          <transactions
            v-if="addrTxs && addrTxs.actions"
            :txs="addrTxs"
            :loading="loading"
          />
          <pagination
            v-if="addrTxs && addrTxs.actions && count"
            :limit="10"
            :offset="offset"
            :count="count"
            @changePage="getActions"
          />
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
import { compact } from 'lodash'
import Thorname from './components/thorname.vue'
import Balance from './components/balance.vue'
import Pools from './components/pools.vue'
import Loans from './components/loans.vue'
import WalletIcon from '~/assets/images/wallet.svg?inline'
import CopyIcon from '~/assets/images/copy.svg?inline'
import ExpandIcon from '~/assets/images/expand.svg?inline'
import { formatAsset, assetFromString } from '~/utils'

export default {
  components: {
    WalletIcon,
    CopyIcon,
    ExpandIcon,
    QrcodeVue,
    Thorname,
    Balance,
    Pools,
    Loans,
  },
  async asyncData({ params, $api }) {
    const address = params.adderid
    const addrTxs = await $api.getAddress(address, 0).catch((e) => {
      console.error(e)
    })
    const count = addrTxs?.data?.count ?? 0
    let otherBalances = []
    let runeBalance
    if (address.match(/^[st]?thor.*/gim)) {
      try {
        const balances = (await $api.getBalance(address)).data.result

        const synthBalances = balances.map((item) => {
          if (item.denom === 'rune') {
            runeBalance = {
              asset: assetFromString('THOR.RUNE'),
              quantity: Number.parseFloat(item?.amount) / 10 ** 8 ?? 0,
            }
            return false
          }

          return {
            asset: assetFromString(item.denom.toUpperCase()),
            quantity: (item?.amount / 10 ** 8).toFixed(8),
          }
        })

        let tradeBalances = (await $api.getTradeAsset(address)).data
        tradeBalances = tradeBalances.map((item) => {
          return {
            asset: assetFromString(item.asset),
            quantity: (item?.units / 10 ** 8).toFixed(8),
          }
        })

        otherBalances = compact([
          runeBalance,
          ...tradeBalances,
          ...synthBalances,
        ])
      } catch (e) {
        console.warn("can't get the balances")
      }
    }

    return {
      address,
      addrTxs: addrTxs?.data,
      count,
      otherBalances,
      runeBalance,
    }
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
          formatFn: formatAsset,
        },
        {
          label: 'Balance',
          field: 'amount',
          formatFn: this.baseAmountFormat,
        },
      ],
    }
  },
  computed: {
    addressStat() {
      const balances = this.otherBalances ?? []
      let vaultInfo = []
      if (this.isVault) {
        vaultInfo = [
          [
            {
              name: 'Vault type',
              value: this.vaultType,
              filter: true,
            },
            {
              name: 'Status',
              value: this.vaultInfo?.status,
              filter: true,
            },
            {
              name: 'Inbound Txs',
              value: this.vaultInfo?.inbound_tx_count,
            },
            {
              name: 'Outbound Txs',
              value: this.vaultInfo?.outbound_tx_count,
            },
          ],
          [
            {
              name: 'Block Height',
              value: this.vaultInfo?.block_height,
            },
          ],
        ]
      }
      return [...balances, ...vaultInfo]
    },
    ...mapGetters({
      runePrice: 'getRunePrice',
      nodesData: 'getNodesData',
    }),
  },
  watch: {
    nodesData() {
      this.fillNodesAddresses()
    },
  },
  mounted() {
    this.checkIsVault(this.address)
  },
  methods: {
    getActions(offset = 0) {
      this.loading = true
      this.offset = offset
      this.$api
        .getAddress(this.address, this.offset)
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
    checkIsVault(address) {
      this.$api
        .getAsgard()
        .then(({ data }) => {
          for (const vaultIndex in data) {
            if (
              data[vaultIndex].addresses
                .map((a) => a.address.toUpperCase())
                .includes(address.toUpperCase())
            ) {
              this.isVault = true
              this.vaultType = 'Asgard'
              this.chainAddresses = data[vaultIndex].addresses
              this.vaultInfo = data[vaultIndex]
              this.fillNodesAddresses()
            }
          }
        })
        .catch((e) => console.error(e))
      this.$api
        .getYggdrasil()
        .then(({ data }) => {
          for (const vaultIndex in data) {
            if (
              data[vaultIndex].addresses
                .map((a) => a.address.toUpperCase())
                .includes(address.toUpperCase())
            ) {
              this.isVault = true
              this.vaultType = 'Yggdrasil'
              this.chainAddresses = data[vaultIndex].addresses
              this.vaultInfo = data[vaultIndex]
            }
          }
        })
        .catch((e) => console.error(e))
    },
    fillNodesAddresses() {
      this.nodeAddresses = []
      if (this.nodesData && this.vaultInfo) {
        this.nodesData.forEach((n) => {
          const nodePubKey = n?.pub_key_set?.secp256k1
          if (nodePubKey && this.vaultInfo?.membership.includes(nodePubKey)) {
            this.nodeAddresses.push(n.node_address)
          }
        })
      }
    },
  },
  head: {
    title: `THORChain Network Explorer | Address`,
  },
}
</script>

<style lang="scss" scoped>
.address-container {
  .icon {
    fill: var(--sec-font-color);
    height: 1.5rem;

    &.small {
      height: 0.8rem;
      width: 0.8rem;
    }
  }

  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0.4rem;
    border-radius: 0.3rem;

    &:hover {
      background-color: var(--active-bg-color);
    }

    .icon-name {
      color: var(--sec-font-color);
      font-size: 0.625rem;
      margin-right: 0.3rem;
    }
  }

  .qr-wrapper {
    position: relative;

    .qr-show {
      border-radius: 0.3rem;
      background-color: #fff;
      padding: 0.625rem;
      top: calc(100% + 0.625rem);
      position: absolute;
      z-index: 2;
      border: 1px solid var(--border-color);
    }
  }

  .utility {
    font-size: 0.7rem;
    line-height: 0.7rem;
  }

  .address-header {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    padding: 0 0.8rem;

    span {
      margin-left: 0.7rem;
      line-height: 1.5rem;
      font-size: 1.5rem;
      color: var(--sec-font-color);
    }
  }
  .address-name {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin: 0.4rem 0;
    font-weight: bold;
    color: var(--font-color);
    padding: 0 0.8rem;
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
