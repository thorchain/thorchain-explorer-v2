<template>
  <Page>
    <template v-if="!isError && !isLoading">
      <div class="tx-header">
        <h3>
          Transaction
          <span v-if="tx.type" class="bubble-container" style="margin-left: 0.2rem">{{ tx.type }}</span>
          <span v-if="tx.status" class="bubble-container blue" style="margin-left: 0.2rem">{{ tx.status }}</span>
          <span v-if="tx.synth" class="bubble-container yellow" style="margin-left: 0.2rem">synth</span>
          <template v-for="(l, i) in tx.label">
            <span :key="i" class="bubble-container" style="margin-left: 0.2rem">{{ l }}</span>
          </template>
        </h3>
      </div>
      <div class="utility">
        <div class="tx-id clickable" @click="gotoTx($route.params.txhash)">
          {{ $route.params.txhash }}
        </div>
        <div class="icon-wrapper" style="margin: 0" @click="copy($route.params.txhash)">
          <span class="icon-name">{{ copyText }}</span>
          <CopyIcon class="icon small" />
        </div>
      </div>
      <div v-if="tx.date" class="tx-date">
        <span class="sec-color">Submitted:</span> {{ tx.date.toLocaleString() }} ({{ fromNow(tx.date) }})
      </div>
      <div style="margin: .2rem 0" />
      <div v-for="(txa, j) in tx.inout" :key="j" class="tx-wrapper">
        <div v-if="tx" class="tx-container">
          <template v-for="(txs, i) in txa">
            <div v-if="i && txs.map(o => o.is).length > 0" :key="i + '-arrow'" class="arrow">
              <ArrowIcon class="icon" />
            </div>
            <div :key="i" class="tx-contain">
              <div v-for="(one_tx, j) in txs" :key="j">
                <template v-if="one_tx.is">
                  <div class="txid">
                    <div :class="['bubble-container', i?'blue':'']">
                      {{ i?'Out':'In' }}
                    </div>
                    <div v-if="one_tx.status === 'pending'" :class="['bubble-container', 'blue']">
                      pending
                    </div>
                    <span class="tx-hash clickable" @click="gotoTx(one_tx.txID)">{{ one_tx.txID }}</span>
                  </div>
                  <div v-if="one_tx.asset && one_tx.asset.name" class="asset-icon-container">
                    <img
                      class="asset-icon"
                      :src="assetImage(one_tx.asset.name)"
                      alt="in-coin"
                    >
                    <span class="asset-text">
                      {{ (+one_tx.asset.amount).toFixed(8) }} <span class="sec-color">{{ one_tx.asset.name }}</span>
                    </span>
                    <div v-if="checkSynth(one_tx.asset.name)" style="margin-left: .2rem" class="bubble-container yellow">
                      synth
                    </div>
                    <div v-if="one_tx.label" style="margin-left: .3rem" class="bubble-container">
                      {{ one_tx.label }}
                    </div>
                  </div>
                  <div class="address">
                    <span v-if="one_tx.address" class="clickable" @click="gotoAddr(one_tx.address)">{{ formatAddress(one_tx.address) }}</span>
                    <ArrowIcon v-if="one_tx.outAddress" class="icon small" />
                    <span v-if="one_tx.outAddress" class="clickable" @click="gotoAddr(one_tx.outAddress)">{{ formatAddress(one_tx.outAddress) }}</span>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>
      <streaming-swap v-if="txFormatted" :inbound-hash="txFormatted" :tx="tx" />
      <tx-stages v-if="txFormatted" :inbound-hash="txFormatted" />
      <div v-if="tx" class="extra-details">
        <stat-table :table-settings="extraDetail">
          <template #Pools>
            <div v-for="(p, i) in tx.pools" :key="i" class="pool-box">
              <img
                class="asset-icon"
                :src="assetImage(p)"
                alt="in-coin"
              >
              <span>{{ p }}</span>
            </div>
          </template>
        </stat-table>
      </div>
    </template>
    <div v-else-if="isError" class="notify-card card-bg">
      <h3>{{ error.title }}</h3>
      <span>{{ error.message }}</span>
      <DisconnectIcon class="disconnect-icon" />
    </div>
    <div v-else-if="isLoading && !isError">
      <div class="notify-card" style="width: 18.75rem">
        <h3>Searching transaction</h3>
        <progress-bar :width="loadingPercentage" :extra-text="progressText + ' of queries'" />
      </div>
    </div>
  </Page>
</template>

<script>
import moment from 'moment'
import { mapGetters } from 'vuex'
import streamingSwap from './components/streamingSwap.vue'
import txStages from './components/txStages.vue'
import CopyIcon from '~/assets/images/copy.svg?inline'
import DisconnectIcon from '~/assets/images/disconnect.svg?inline'
import ArrowIcon from '~/assets/images/arrow-small-right.svg?inline'
import { parseCosmosTx, parseMidgardTx, parseExtraSwap, parseThornodeStatus, shortAssetName } from '~/utils'

export default {
  components: {
    CopyIcon,
    ArrowIcon,
    DisconnectIcon,
    streamingSwap,
    txStages
  },
  data () {
    return {
      tx: undefined,
      extraSwapDetails: undefined,
      isLoading: true,
      isError: false,
      copyText: 'Copy Hash',
      loadingPercentage: 0,
      progressText: '',
      txFormatted: undefined,
      error: {
        title: 'Couldn\'t find the Transaction',
        message: 'Something bad happened.'
      }
    }
  },
  computed: {
    ...mapGetters({
      chainsHeight: 'getChainsHeight'
    }),
    extraDetail () {
      if (!this.tx) {
        return
      }

      let res = []
      let tmp = []

      if (this?.tx?.height) {
        tmp = [{
          name: 'Block Height',
          value: this.tx.height
        }]
      }

      tmp.push({
        name: 'Type',
        value: this.$options.filters.capitalize(this.tx?.type),
        filter: true
      })

      res = [tmp]

      if (this.tx.status) {
        const fields = [
          {
            name: 'Status',
            value: this.$options.filters.capitalize(this.tx.status),
            filter: true
          }
        ]

        if (this.extraSwapDetails && this.extraSwapDetails?.txOutDelay) {
          fields.push(
            {
              name: 'Outbound Tx Delay',
              value: moment.duration(this.extraSwapDetails?.txOutDelay, 'seconds').humanize(),
              filter: true
            }
          )
        }

        res.push(fields)
      }

      if (this.tx.pools) {
        res.push([
          {
            slotName: 'Pools',
            name: 'Pools',
            value: this.tx.pools.join('\n').trim(),
            filter: true
          }
        ])
      }

      if (this.extraSwapDetails) {
        res.push([
          {
            name: 'Inbound Gas Fees',
            value: this.extraSwapDetails.inboundGases?.map(e => e.amount / 1e8 + ' ' + e.asset).join('\n').trim(),
            filter: true
          },
          {
            name: 'Outbound Gas Fees',
            value: this.extraSwapDetails.outboundGases?.map(e => e.amount / 1e8 + ' ' + e.asset).join('\n').trim(),
            filter: true
          }
        ], [
          {
            name: 'Affiliate Fee',
            value: this.extraSwapDetails.affiliateFee?.map(e => e.amount / 1e8 + ' ' + e.asset).join('\n').trim(),
            filter: true
          },
          {
            name: 'Liquidity Fee',
            value: (this.tx?.liqidityFee?.swap ?? 0) && this.tx.liqidityFee.swap.liquidityFee / 1e8 + ' THOR.RUNE',
            filter: true
          }
        ])
      } else if (this.tx.gas) {
        res.push([
          {
            name: 'Gas Fees',
            value: this.tx.gas.join('\n').trim(),
            filter: true
          }
        ])
      }

      // disable this for now
      // if (this.extraSwapDetails && this.chainsHeight && this.extraSwapDetails?.inChain !== 'THOR') {
      //   let confs = 1
      //   if (defaultCoinBase(this.extraSwapDetails?.inChain) > 0) {
      //     confs = (this.tx.inout[0][0][0].asset.amount) / defaultCoinBase(this.extraSwapDetails?.inChain)
      //     confs = Math.ceil(confs)
      //   }
      //   const filtered = this.$options.filters.number((this.chainsHeight[this.extraSwapDetails?.inChain] - this.extraSwapDetails?.inboundHeight), '0,0')
      //   const filteredDelay = moment.duration(confs * approxBlockSeconds(this.extraSwapDetails?.inChain), 'seconds').humanize()

      //   res.push([
      //     {
      //       name: 'Est Inbound Confirms needed / Confirmed',
      //       value: confs + ' / ' + filtered,
      //       filter: true
      //     },
      //     {
      //       name: 'Est Inbound Delay',
      //       value: filteredDelay,
      //       filter: true
      //     }
      //   ])
      // }

      if (this.tx.memo) {
        res.push([
          {
            name: 'Memo',
            value: this.tx.memo,
            filter: true
          }
        ])
      }

      return res
    }
  },
  async mounted () {
    await this.updateTx()

    // if has no outbound
    if (this.tx?.status === 'pending') {
      const inter = setInterval(async () => {
        await this.updateTx()
        if (this.tx?.status !== 'pending') {
          clearInterval(inter)
        }
      }, 60000)
    }
  },
  methods: {
    async updateTx () {
      let txHash = this.$route.params.txhash

      if (txHash.toLowerCase().startsWith('0x')) {
        txHash = txHash.slice(2)
      }

      this.txFormatted = txHash

      setInterval(() => {
        this.loadingPercentage = (this.loadingPercentage + 8) % 100
      }, 700)

      try {
        let res

        // Searching midgard database
        this.progressText = '1/3'

        res = await this.$api.getServerTx(txHash).catch((e) => {
          if (e?.response?.status === 404) {
            this.error.message = 'Please make sure the correct transaction hash or account address is inserted.'
          }
        })

        if (res?.status / 200 === 1 && res.data.count !== '0') {
          this.tx = parseMidgardTx(res.data)

          // parse extra fees and details from thornode
          if (this.tx.type === 'swap') {
            const inboundHash = this.tx?.inout[0][0][0].txID
            res = await this.$api.getThornodeDetailTx(inboundHash).catch((e) => {
              this.isLoading = false
              this.loadingPercentage = 100
            })

            const outTxs = this.tx?.inout.map(a => a[1].length > 0)
            if (outTxs && outTxs.length > 0 && outTxs.every(a => a === false) && res.data?.out_txs?.length > 0) {
              this.tx.inout[0][1] =
              res.data?.out_txs.map(t => ({
                is: t.coins[0]?.asset,
                address: t?.to_address ?? '',
                txID: t?.id ?? '',
                asset: {
                  name: t?.coins[0]?.asset,
                  amount: t?.coins[0]?.amount / 10 ** 8
                },
                status: 'success',
                type: 'swap'
              }))
            }

            try {
              if (this.tx.label.includes('streaming')) {
                this.tx.inout = [this.tx.inout[0]]
                const getInTx = res.data.tx.tx
                this.tx.inout[0][0] = [{
                  asset: {
                    amount: getInTx.coins[0].amount / 1e8,
                    name: getInTx.coins[0].asset
                  },
                  is: getInTx.coins[0].asset,
                  address: getInTx.from_address,
                  txID: getInTx.id,
                  status: 'success',
                  type: 'swap'
                }]
              }
              this.extraSwapDetails = parseExtraSwap(res.data)
            } catch (error) {
              this.extraSwapDetails = undefined
            }

            const resStatus = await this.$api.getTxStatus(txHash).catch((e) => {
              if (e?.response?.status === 404) {
                this.error.message = 'Please make sure the correct transaction hash or account address is inserted.'
              }
            })

            if (resStatus?.status / 200 === 1 && (resStatus.data?.stages.outbound_signed?.completed === false)) {
              this.tx.inout[0][1] = parseThornodeStatus(resStatus.data).inout[0][1]
            }

            if (!this.tx.outAsset) {
              const m = this.tx.memo.split(':', 3)[1]

              this.tx.outAsset = shortAssetName(m)
            }
          }

          this.isLoading = false
          this.loadingPercentage = 100
          return
        }

        this.progressText = '2/3'

        // see if this tx is an observed tx
        res = await this.$api.getTxStatus(txHash).catch((e) => {
          if (e?.response?.status === 404) {
            this.error.message = 'Please make sure the correct transaction hash or account address is inserted.'
          }
        })

        if (res?.status / 200 === 1 && (res.data?.inbound_observed?.started !== false || res.data?.inbound_observed?.completed === true || res.data?.outbound_signed?.completed === false)) {
          this.tx = parseThornodeStatus(res.data)
          this.isLoading = false
          this.loadingPercentage = 100
          return
        }

        res = await this.$api.getNativeTx(txHash).catch((e) => {
          if (e?.response?.status === 404) {
            this.error.message = 'Please make sure the correct transaction hash or account address is inserted.'
          }
        })

        if (res?.status / 200 === 1) {
          this.tx = parseCosmosTx(res.data)
          this.isLoading = false
          this.loadingPercentage = 100
          return
        }

        this.progressText = '3/3'

        res = await this.$api.getAddress(txHash, 0).catch((e) => {})

        if (res.status / 200 === 1) {
          this.$router.push({ path: `/address/${this.$route.params.txhash}` })
          return
        }
      } catch (error) {
        // Please make sure the correct transaction hash or account address is inserted.
        console.error(error)
        this.isError = true
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.tx-wrapper {
  position: relative;

  .arrow {
    display: none;
    flex: 1;
    justify-content: center;
    align-items: center;

    .icon {
      margin-right: 0;
    }

    @include md {
      display: flex;
    }
  }
}
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

  .asset-icon-container {
    margin-top: 10px;
    display: flex;
    align-items: center;

    span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 300px;
    }
  }

  .address {
    margin-top: 10px;
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

.utility {
  justify-content: space-between;
  gap: 1rem;
}

.asset-text {
  font-size: 1.1rem;
}

.tx-id {
  word-break: break-all;
}
</style>
