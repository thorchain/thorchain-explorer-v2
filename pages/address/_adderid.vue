<template>
  <page class="address-container">
    <div class="address-header">
      <WalletIcon class="icon" />
      <span>{{ isVault ? vaultType : 'Address' }}</span>
    </div>
    <div class="address-name">
      <span style="color: var(--primary-color)">{{ address }}</span>
      <UtilityBox :value="address" />
    </div>
    <template v-show="addrTxs">
      <template v-if="!isVault">
        <div class="stat-wrapper mb-1">
          <div class="balance-nav-container">
            <balance
              class="card-balance"
              :state="addressStat"
              :fetchAddressData="fetchAddressDataMethod"
            />
            <Card
              extra-class="node-address-card"
              :navs="[
                { title: 'LP/Savers', value: 'pools' },
                { title: 'Thorname', value: 'thorname' },
                { title: 'Loans', value: 'loans' },
              ]"
              :isLoading="loading"
              :act-nav.sync="activeMode"
            >
              <keep-alive>
                <thorname v-if="activeMode == 'thorname'" :address="address" />
              </keep-alive>
              <keep-alive>
                <pools
                  v-if="activeMode == 'pools' && !loading"
                  :address="address"
                />
              </keep-alive>
              <keep-alive>
                <loans
                  v-if="activeMode == 'loans' && !loading"
                  :address="address"
                />
              </keep-alive>
            </Card>
          </div>
        </div>
      </template>
      <template v-if="isVault">
        <info-card
          :options="addressStat"
          style="margin-bottom: 8px"
        ></info-card>
        <Card
          extra-class="mb-1"
          :navs="[
            { title: 'Chain Addresses', value: 'chain-addr' },
            { title: 'Node Members', value: 'node-mmb' },
            { title: 'Routers', value: 'routers' },
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
                <span class="clickable mono" @click="gotoAddr(address.address)"
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
                <span class="clickable mono" @click="gotoAddr(address.address)"
                  >{{ address.slice(0, 8) }}...{{ address.slice(-8) }}</span
                >
              </div>
            </div>
          </div>
          <div v-if="vaultMode == 'routers'" key="routers">
            <div class="addresses-container">
              <div v-for="r in routers" :key="r.chain" class="addresses">
                <img
                  class="asset-icon"
                  :src="assetImage(baseChainAsset(r.chain))"
                />
                <span class="clickable mono" @click="gotoAddr(r.router)"
                  >{{ r.router.slice(0, 8) }}...{{ r.router.slice(-8) }}</span
                >
              </div>
            </div>
          </div>
        </Card>
        <div>
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
          :txs="addrTxs"
          :owner="address"
          :loading="loading"
        />
        <pagination
          v-if="addrTxs && addrTxs.actions"
          :is-first-page="!prevPageToken"
          @nextPage="goNext"
          @prevPage="goPrev"
          @firstPage="goFirst"
        />
      </template>
    </template>
    <div v-show="!addrTxs && !loading" class="error-container">
      Can't Fetch the Address! Please Try again Later.
    </div>
  </page>
</template>

<script>
import { mapGetters } from 'vuex'
import { compact } from 'lodash'
import Thorname from './components/thorname.vue'
import Balance from './components/balance.vue'
import Pools from './components/pools.vue'
import Loans from './components/loans.vue'
import WalletIcon from '~/assets/images/wallet.svg?inline'
import { formatAsset, assetFromString } from '~/utils'

export default {
  components: {
    WalletIcon,
    Thorname,
    Balance,
    Pools,
    Loans,
  },
  data() {
    return {
      address: this.$route.params.adderid,
      addrTxs: null,
      count: undefined,
      otherBalances: [],
      runeBalance: undefined,
      loading: true,
      nextPageToken: undefined,
      prevPageToken: undefined,
      activeMode: 'pools',
      isVault: false,
      chainAddresses: [],
      routers: [],
      vaultInfo: undefined,
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
          type: 'number',
          tdClass: 'mono',
          formatFn: this.baseAmountFormat,
        },
        {
          label: 'Price',
          field: 'price',
          type: 'number',
          tdClass: 'mono',
          formatFn: this.formatCurrency,
        },
        {
          label: 'Value',
          field: 'value',
          type: 'number',
          tdClass: 'mono',
          formatFn: this.formatCurrency,
        },
      ],
      pools: undefined,
    }
  },
  computed: {
    addressStat() {
      const balances = this.otherBalances ?? []
      if (this.isVault) {
        return [
          {
            title: 'Overall Info',
            rowStart: 1,
            colSpan: 1,
            items: [
              {
                name: 'Block Height',
                value: this.vaultInfo?.block_height,
                filter: (v) => this.$options.filters.number(v, '0,0'),
              },
              {
                name: 'Status',
                value: this.formatStatus(this.vaultInfo?.status),
              },
            ],
          },
          {
            title: 'Ins/Outs',
            rowStart: 1,
            colSpan: 1,
            items: [
              {
                name: 'Inbound Txs',
                value: this.vaultInfo?.inbound_tx_count,
                filter: (v) => this.$options.filters.number(v, '0,0'),
              },
              {
                name: 'Outbound Txs',
                value: this.vaultInfo?.outbound_tx_count,
                filter: (v) => this.$options.filters.number(v, '0,0'),
              },
            ],
          },
        ]
      }
      return balances
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
    this.fetchAddressData(this.address)
    this.checkIsVault(this.address)
  },
  methods: {
    async fetchAddressData(address) {
      this.loading = true
      try {
        const addrTxs = await this.$api.getMidgardActions({
          address,
          limit: 30,
        })
        this.addrTxs = addrTxs.data
        this.count = addrTxs.data.count
        this.nextPageToken = addrTxs.data.meta.nextPageToken
        this.prevPageToken = addrTxs.data.meta.prevPageToken

        if (address.match(/^[st]?thor.*/gim)) {
          const balances = (await this.$api.getBalance(address)).data.result
          const synthBalances = balances.map((item) => {
            if (item.denom === 'rune') {
              this.runeBalance = {
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

          let tradeBalances = (await this.$api.getTradeAsset(address)).data
          tradeBalances = tradeBalances.map((item) => {
            return {
              asset: assetFromString(item.asset),
              quantity: (item?.units / 10 ** 8).toFixed(8),
            }
          })

          this.otherBalances = compact([
            this.runeBalance,
            ...tradeBalances,
            ...synthBalances,
          ])
        }
      } catch (e) {
        console.error(e)
      } finally {
        this.loading = false
      }
    },
    goNext() {
      this.getActions({
        limit: 30,
        address: this.address,
        nextPageToken: this.nextPageToken,
      })
    },
    goPrev() {
      this.getActions({
        limit: 30,
        address: this.address,
        prevPageToken: this.prevPageToken,
      })
    },
    formatStatus(status) {
      return status === 'ActiveVault' ? 'Active' : status
    },
    getActions(params) {
      this.loading = true
      this.$api
        .getMidgardActions(params)
        .then((res) => {
          this.addrTxs = res.data
          this.count = res.data.count
          this.nextPageToken = res.data.meta.nextPageToken
          this.prevPageToken = res.data.meta.prevPageToken
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
        .then(async ({ data }) => {
          for (const vaultIndex in data) {
            if (
              data[vaultIndex].addresses
                .map((a) => a.address.toUpperCase())
                .includes(address.toUpperCase())
            ) {
              this.isVault = true
              this.vaultType = 'Asgard'
              this.chainAddresses = data[vaultIndex].addresses
              this.routers = data[vaultIndex].routers
              this.vaultInfo = data[vaultIndex]
              if (!this.pools) {
                this.pools = (await this.$api.getPools()).data
              }
              this.vaultInfo.coins = this.vaultInfo.coins.map((c) => ({
                ...c,
                amount: +c.amount < 1e3 ? 0 : c.amount,
                price: this.amountToUSD(c.asset, 1e8, this.pools),
                value: this.amountToUSD(c.asset, +c.amount, this.pools),
              }))
              this.fillNodesAddresses()
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
  .nav {
    flex: 1;
  }
  .balance-nav-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1rem;
    max-width: auto;
  }

  .card-balance,
  .node-address-card {
    flex: 1 1 calc(50% - 1rem);
  }

  @include lg {
    .card-balance,
    .node-address-card {
      flex: 1 1 calc(20% - 1rem);
    }
  }
  .content {
    margin-top: 0.5rem;
  }
  .utility-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.4rem;
    border-radius: 0.3rem;
    background-color: var(--bg-color);

    .divider {
      margin: 0 8px;

      &::after {
        display: block;
        content: ' ';
        border-right: 1px solid var(--border-color);
        height: 16px;
      }
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
      z-index: 999;
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

    span {
      text-overflow: ellipsis;
      max-width: 70%;
      overflow: hidden;
    }
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
