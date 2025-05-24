<template>
  <page class="address-container">
    <div class="address-section">
      <div class="left-section">
        <div class="address-header">
          <Avatar :name="address" />
        </div>
        <div class="address-name">
          <span class="address-value" style="color: var(--sec-font-color)">{{
            address
          }}</span>
          <div class="qr-copy-wrapper">
            <div class="item">
              <Copy :str-copy="address" />
            </div>
            <div id="qrcode" class="item">
              <qr-btn :qrcode="address"></qr-btn>
            </div>
          </div>
        </div>
      </div>
      <div class="action-types desktop-filters">
        <advanced-filter
          ref="advancedFilter"
          :hide-address-filter="true"
          class="desktop-filters"
        />
      </div>
    </div>
    <template>
      <template v-if="!isVault">
        <div class="stat-wrapper mb-1">
          <div class="balance-nav-container">
            <balance
              class="card-balance"
              :address="address"
              :state="addressStat"
              :loading="addressLoading"
            />
            <Card
              extra-class="node-address-card"
              :navs="[
                { title: 'LP/Savers', value: 'pools' },
                { title: 'Bond', value: 'bond' },
                { title: 'Thorname', value: 'thorname' },
                { title: 'TCY', value: 'distribution' },
              ]"
              :is-loading="loading"
              :act-nav.sync="activeMode"
            >
              <keep-alive>
                <thorname v-if="activeMode == 'thorname'" :address="address" />
              </keep-alive>
              <keep-alive>
                <pools v-if="activeMode == 'pools'" :address="address" />
              </keep-alive>
              <keep-alive>
                <bonds
                  v-if="activeMode == 'bond'"
                  :address="address"
                  :nodes="nodesData"
                />
              </keep-alive>
              <keep-alive>
                <distribution
                  v-if="activeMode == 'distribution'"
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
                <nuxt-link :to="`/node/${address}`" class="clickable mono">
                  {{ addressFormatV2(address) }}
                </nuxt-link>
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
        <transactions :txs="addrTxs" :owner="address" :loading="loading" />
        <NewPagination
          v-if="addrTxs && addrTxs.actions && count > -1"
          :total-rows="+count"
          :per-page="30"
          :current-page="currentPage"
          @change="onPageChange"
        />
        <pagination
          v-else-if="addrTxs && addrTxs.actions"
          :meta="addrTxs.actions"
          :loading="loading"
          @nextPage="goNext"
          @prevPage="goPrev"
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
import advancedFilter from '../txs/components/advancedFilter.vue'
import Thorname from './components/thorname.vue'
import Balance from './components/balance.vue'
import Pools from './components/pools.vue'
import Bonds from './components/bonds.vue'
import Distribution from './components/distribution.vue'
import { formatAsset, assetFromString } from '~/utils'
export default {
  components: {
    Thorname,
    Balance,
    Pools,
    Bonds,
    Distribution,
    advancedFilter,
  },
  data() {
    return {
      address: this.$route.params.adderid,
      addrTxs: null,
      count: undefined,
      otherBalances: [],
      addressLoading: true,
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
      currentPage: 1,
      limit: 30,
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
      nodes: 'getNodesData',
      pools: 'getPools',
    }),
    nodeAddress() {
      return this.nodes?.some((node) => node.node_address === this.address)
    },
  },
  watch: {
    nodesData() {
      this.fillNodesAddresses()
    },
    '$route.query': {
      handler(query) {
        this.fetchData(query)
      },
      immediate: true,
      deep: true,
    },
  },
  mounted() {
    const { nextPageToken, prevPageToken, page } = this.$route.query
    this.currentPage = page ? parseInt(page) : 1
    this.fetchAddressData(
      this.address,
      (this.currentPage - 1) * 30,
      this.limit,
      nextPageToken,
      prevPageToken
    )
    this.checkIsVault(this.address)
  },
  methods: {
    async fetchAddressData(address, offset = 0, limit = 30) {
      this.loading = true
      try {
        const params = {
          address,
          limit,
          offset,
          ...this.checkQuery(this.$route.query),
        }

        const addrTxs = await this.$api.getActions(params)
        this.addrTxs = addrTxs.data
        this.count = addrTxs.data.count
        this.nextPageToken = addrTxs.data.meta.nextPageToken
        this.prevPageToken = addrTxs.data.meta.prevPageToken

        if (address.match(/^[st]?thor.*/gim)) {
          const balances = (await this.$api.getBalance(address)).data.result
          const synthBalances =
            balances?.map((item) => {
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
            }) ?? []

          // if there is no balance show zero
          if (!balances) {
            this.runeBalance = {
              asset: assetFromString('THOR.RUNE'),
              quantity: 0,
            }
          }

          let tradeBalances =
            (await this.$api.getTradeAsset(address)).data ?? []
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
          this.addressLoading = false
        }
      } catch (e) {
        console.error(e)
      } finally {
        this.loading = false
      }
    },
    onPageChange(newPage) {
      this.currentPage = newPage
      this.$router.push({
        path: this.$route.path,
        query: {
          ...this.$route.query,
          page: newPage,
        },
      })
    },
    goNext() {
      const query = {
        ...this.$route.query,
        nextPageToken: this.nextPageToken,
      }
      delete query.prevPageToken

      this.$router.push({
        path: `/address/${this.address}`,
        query,
      })
    },
    goPrev() {
      const query = {
        ...this.$route.query,
        prevPageToken: this.prevPageToken,
      }
      delete query.nextPageToken

      this.$router.push({
        path: `/address/${this.address}`,
        query,
      })
    },
    formatStatus(status) {
      return status === 'ActiveVault' ? 'Active' : status
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
    fetchData(params) {
      this.loading = true

      const cleanParams = this.checkQuery(params)

      let offset
      if (this.$route.query.page) {
        this.currentPage = +this.$route.query.page
        offset = (this.currentPage - 1) * this.limit
      }

      this.$api
        .getActions({
          limit: this.limit,
          ...cleanParams,
          address: this.address,
          offset,
        })
        .then((res) => {
          this.addrTxs = res.data
          this.nextPageToken = res.data.meta.nextPageToken
          this.prevPageToken = res.data.meta.prevPageToken
          this.count = res.data.count
          this.error = false
          this.loading = false
        })
        .catch((error) => {
          if (error.message === 'cancel') {
            this.loading = true
            return
          }
          this.error = true
          console.error(error)
        })
    },
    checkQuery(queries) {
      const validParams = [
        'address',
        'asset',
        'height',
        'fromHeight',
        'affiliate',
        'txType',
        'type',
        'fromTimestamp',
        'timestamp',
        'nextPageToken',
        'prevPageToken',
      ]

      return Object.keys(queries)
        .filter((key) => validParams.includes(key))
        .reduce((obj, key) => {
          obj[key] = queries[key]
          return obj
        }, {})
    },
  },
  head: {
    title: `THORChain Network Explorer | Address`,
  },
}
</script>

<style lang="scss" scoped>
.address-container {
  margin: auto;

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
    flex-direction: column;
    flex-wrap: nowrap;

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
    .balance-nav-container {
      flex-direction: row;
      flex-wrap: wrap;
    }
  }
  .content {
    margin-top: $space-8;
  }

  .qr-wrapper {
    position: relative;

    .qr-show {
      border-radius: $radius-s;
      background-color: #fff;
      padding: $space-10;
      top: calc(100% + 0.625rem);
      position: absolute;
      z-index: 999;
      border: 1px solid var(--border-color);
    }
  }

  .utility {
    font-size: $font-size-xs;
    line-height: 0.7rem;
  }

  .address-section {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    align-items: center;
    flex-direction: row;
    align-items: center;
    gap: 0.6rem;
    padding: $space-0 $space-12;
  }
  .left-section {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .address-header {
    display: flex;
    align-items: center;

    span {
      margin-left: $space-12;
      line-height: 1.5rem;
      font-size: $font-size-xl;
      color: var(--sec-font-color);
    }
  }

  .address-name {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin: $space-5 $space-0;
    font-weight: bold;
    color: var(--font-color);
    gap: 8px;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .address-value {
    align-items: center;
    background-color: var(--card-bg-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-s;
    display: flex;
    padding: $space-8;
    font-size: $font-size-xxs;

    @include md {
      font-size: $font-size-desktop;
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
.qr-copy-wrapper {
  display: flex;
  gap: 5px;
  align-items: center;

  .item {
    border: 1px solid var(--border-color);
    background-color: var(--card-bg-color);
    padding: $space-8;
    border-radius: $radius-s;
    display: flex;
    align-items: center;
    margin: $space-0;
    max-width: 100%;
    min-width: 32px;

    &:not(.tx-id) {
      height: 28px;
      width: 28px;
      @include md {
        height: 32px;
        width: 32px;
      }
    }

    span {
      color: var(--sec-font-color);
      line-height: 15px;
      height: 16px;
    }

    &:hover {
      span {
        color: var(--primary-color);
      }

      * {
        fill: var(--primary-color);
      }
    }

    * {
      fill: var(--sec-font-color);
    }
  }
}
</style>
