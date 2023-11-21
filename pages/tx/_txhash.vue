<template>
  <Page>
    <template v-if="!isError && !isLoading">
      <div class="tx-header">
        <h3>
          Transaction
          <!-- <span v-if="tx.type" class="bubble-container" style="margin-left: 0.2rem">{{ tx.type }}</span>
          <span v-if="tx.status" class="bubble-container blue" style="margin-left: 0.2rem">{{ tx.status }}</span>
          <span v-if="tx.synth" class="bubble-container yellow" style="margin-left: 0.2rem">synth</span> -->
          <!-- <template v-for="(l, i) in tx.label">
            <span :key="i" class="bubble-container" style="margin-left: 0.2rem">{{ l }}</span>
          </template> -->
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

      <tx-card v-for="(c, i) in cards" :key="i" :tx-data="c.details">
        <template v-for="(s, j) in c.accordions.filter(c => c.data.title)" #[s.name]>
          <accordion :key="i + '.' + j" :data="s.data" />
        </template>
      </tx-card>

      <!-- <div v-if="tx.date" class="tx-date">
        <span class="sec-color">Submitted:</span> {{ tx.date.toLocaleString() }} ({{ fromNow(tx.date) }})
      </div> -->

      <!-- <div v-for="(txa, j) in tx.inout" :key="j" class="tx-wrapper">
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
      </div> -->

      <streaming-swap v-if="txFormatted" :inbound-hash="txFormatted" :tx="tx" />
      <tx-stages v-if="txFormatted" :inbound-hash="txFormatted" />

      <!-- <div v-if="tx" class="extra-details">
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
      </div> -->
    </template>
    <div v-else-if="isError" class="notify-card card-bg">
      <h3>{{ error.title }}</h3>
      <span>{{ error.message }}</span>
      <DisconnectIcon class="disconnect-icon" />
    </div>
    <div v-else-if="isLoading && !isError">
      <div class="notify-card" style="width: 18.75rem">
        <h3>Searching transaction</h3>
        <BounceLoader color="var(--font-color)" size="3rem" />
      </div>
    </div>
  </Page>
</template>

<script>
import moment from 'moment'
import { mapGetters } from 'vuex'
import BounceLoader from 'vue-spinner/src/BounceLoader.vue'
import streamingSwap from './components/streamingSwap.vue'
import txStages from './components/txStages.vue'
import txCard from './components/txCard.vue'
import CopyIcon from '~/assets/images/copy.svg?inline'
import DisconnectIcon from '~/assets/images/disconnect.svg?inline'
import { parseCosmosTx, parseMidgardTx, parseExtraSwap, parseThornodeStatus, shortAssetName, isInternalTx } from '~/utils'
import Accordion from '~/components/Accordion.vue'

export default {
  components: {
    CopyIcon,
    DisconnectIcon,
    BounceLoader,
    streamingSwap,
    txStages,
    txCard,
    Accordion
  },
  data () {
    return {
      tx: undefined,
      extraSwapDetails: undefined,
      isLoading: true,
      isError: false,
      copyText: 'Copy',
      loadingPercentage: 0,
      progressText: '',
      txFormatted: undefined,
      error: {
        title: 'Couldn\'t find the Transaction',
        message: 'Something bad happened.'
      },
      updateInterval: undefined
    }
  },
  computed: {
    ...mapGetters({
      chainsHeight: 'getChainsHeight',
      pools: 'getPools'
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
    let txHash = this.$route.params.txhash
    if (txHash.toLowerCase().startsWith('0x')) {
      txHash = txHash.slice(2)
    }

    await this.fetchTx(txHash)

    // if has no outbound
    if (this.tx?.status === 'pending') {
      const uI = setInterval(async () => {
        await this.fetchTx(txHash)
        if (this.tx?.status !== 'pending') {
          clearInterval(uI)
        }
      }, 60000)

      this.updateInterval = uI
    }
  },
  destroyed () {
    this.clearIntervalId(this.updateInterval)
  },
  methods: {
    // TODO: check hash in saver with streaming
    async fetchTx (hash) {
      // Here the hash can be outbound but the inbound should be caught if it's not
      // Get Midgard details
      const md = (await this.$api.getTx(hash).catch((e) => {
        if (e?.response?.status === 404) {
          this.error.message = 'Transaction is not found in Midgard. Please make sure the correct transaction hash or account address is inserted.'
        }
      }))?.data

      // See if the hash is outbound
      const swapAction = md.actions.find(a => a.type === 'swap')
      if (swapAction) {
        hash = swapAction.in[0].txID
      }

      // Get THORNode details
      const thorRes = (await this.$api.getThornodeDetailTx(hash).catch((e) => {
        if (e?.response?.status / 200 !== 1) {
          this.error.message = 'Transaction is not found in Thornode. Please make sure the correct transaction hash or account address is inserted.'
        }
      }))

      // Assign header and data if available
      let td, tdh
      if (thorRes) {
        td = thorRes.data
        tdh = thorRes.headers
      }

      const ts = (await this.$api.getTxStatus(hash).catch((e) => {
        if (e?.response?.status / 200 !== 1) {
          this.error.message = 'Can\'t find transaction status. Please make sure the correct transaction hash or account address is inserted.'
        }
      }))?.data

      // Native Transaction
      let nt
      if (!td) {
        nt = (await this.$api.getNativeTx(hash).catch((e) => {
          if (e?.response?.status === 404) {
            this.error.message = 'Please make sure the correct transaction hash or account address is inserted.'
            this.loading = false
          }
        }))?.data
      }

      if (nt) {
        this.createNativeTx(nt)
      } else {
        this.createTxState(md, td, ts, tdh, this.pools)
      }

      this.isLoading = false
      // TODO: add proper error handling
    },
    createCard (cardBase, accordions) {
      // What to show in the cards
      const ret = {
        details: {
          title: cardBase.title,
          overall: {
            in: cardBase.in?.map(a => ({
              asset: a?.asset,
              amount: a?.amount / 1e8,
              amountUSD: this.amountToUSD(a?.asset, a?.amount, this.pools)
            })),
            out: cardBase.out?.map(a => ({
              asset: a?.asset,
              amount: a?.amount / 1e8,
              amountUSD: this.amountToUSD(a?.asset, a?.amount, this.pools)
            }))
          }
        },
        accordions: []
      }

      if (!accordions) {
        return
      }

      if (accordions.in) {
        accordions.in.forEach((a, i) => {
          const accordionIn = {
            name: `accordion-in-${i}`,
            data: {
              title: 'Inbound',
              stacks: [
                {
                  key: 'From',
                  value: a?.from,
                  is: true,
                  type: 'address',
                  formatter: this.formatAddress
                },
                {
                  key: 'Hash',
                  value: a?.txid,
                  is: true,
                  type: 'hash',
                  formatter: this.formatAddress
                }
              ]
            }
          }
          ret.accordions.push(accordionIn)
        })
      }

      if (accordions.action) {
        const accordionAction = {
          name: 'accordion-action',
          data: {
            title: accordions.action?.type ?? undefined,
            stacks: [
              {
                key: 'Quantity',
                value: `${accordions.action.streaming?.quantity} Swap`,
                is: accordions.action.streaming.quantity
              },
              {
                key: 'Stream',
                value: `${accordions.action.streaming?.count} / ${accordions.action.streaming?.quantity}`,
                is: accordions.action.streaming.count
              },
              {
                key: 'Interval',
                value: `${accordions.action.streaming?.interval} Block/Swap`,
                is: accordions.action.streaming.interval
              },
              {
                key: 'Liquidity Fee',
                value: `${accordions.action.liquidityFee / 1e8} ${this.showAsset(accordions.out[0].asset)}`,
                is: accordions.action.liquidityFee
              },
              {
                key: 'Limit',
                value: `${accordions.action.limit / 1e8}`,
                is: accordions.action.limit
              }
            ]
          }
        }
        ret.accordions.push(accordionAction)
      }

      if (accordions.out) {
        accordions.out.forEach((a, i) => {
          const accordionIn = {
            name: `accordion-out-${i}`,
            data: {
              title: 'Outbound',
              stacks: [
                {
                  key: 'Destination',
                  value: a?.to,
                  is: true,
                  type: 'address',
                  formatter: this.formatAddress
                },
                {
                  key: 'Hash',
                  value: a?.txid,
                  is: !isInternalTx(a?.txid),
                  type: 'hash',
                  formatter: this.formatAddress
                },
                {
                  key: 'Outbound Fee',
                  value: `${a.fee / 1e8} ${this.showAsset(a.asset)}`,
                  is: a.fee
                }
              ]
            }
          }
          ret.accordions.push(accordionIn)
        })
      }

      return ret
    },
    createTxState (midgardAction, thorTx, thorStatus, thorHeight, pools) {
      // Push as much as data gathered along all endpoint into cards!
      // Actions accordion, inbound accordion, outbound accordion

      // Get out/in assets
      const memo = this.parseMemo(thorStatus.tx?.memo)

      // Get abstracts in

      // Swap
      // From track code
      if (memo.type === 'swap') {
        const { cards, accordions } = this.createSwapState(thorStatus, midgardAction, memo)
        this.cards = [this.createCard(cards, accordions)]
      } else if (memo.type === 'add' || memo.type === 'withdraw') {
        // TODO
      }
    },
    createNativeTx (nativeTx) {

    },
    createSwapState (thorStatus, actions, memo) {
      // swap user addresses
      const userAddresses = new Set([
        thorStatus.tx.from_address.toLowerCase(),
        memo.destAddr?.toLowerCase()
      ])
      // Non affiliate outs
      let outTxs = thorStatus.out_txs?.filter(tx =>
        userAddresses.has(tx.to_address.toLowerCase())
      )
      if (!outTxs) {
        outTxs = thorStatus.planned_out_txs
          ?.filter(tx => userAddresses.has(tx.to_address.toLowerCase()))
          .map(tx => ({
            ...tx,
            coins: [{ amount: tx.coin.amount, asset: tx.coin.asset }]
          }))
      }

      // Add native in/out search
      const inAsset = this.parseMemoAsset(thorStatus.tx.coins[0].asset, this.pools)
      const inAmount = parseInt(thorStatus.tx.coins[0].amount)

      const outAsset = this.parseMemoAsset(
        outTxs?.length > 0 ? outTxs[0].coins[0].asset : memo.asset,
        this.pools
      )
      const outAmount =
        outTxs?.length > 0
          ? parseInt(outTxs[0].coins[0].amount)
          : 0

      // Midgard
      const outboundFee =
        actions?.actions[0]?.metadata.swap?.networkFees[0]?.amount
      const outboundFeeAsset = outboundFee
        ? this.parseMemoAsset(
          actions?.actions[0]?.metadata.swap?.networkFees[0].asset,
          this.pools
        )
        : null

      const ret = {
        cards: {
          title: 'swap',
          in: [{
            asset: inAsset,
            amount: inAmount
          }],
          out: [{
            asset: outAsset,
            amount: outAmount
          }]
        },
        accordions: {
          in: [{
            txid: thorStatus.tx.id,
            from: thorStatus.tx.from_address,
            asset: inAsset,
            amount: inAmount
          }],
          action: {
            type: 'swap',
            limit: memo.limit,
            affiliateName: memo.affiliate,
            affiliateFee: parseInt(actions?.actions[0]?.metadata?.swap?.affiliateFee) || null,
            liquidityFee: parseInt(actions?.actions[0]?.metadata?.swap?.liquidityFee) || null,
            liquidityUnits: null,
            refundReason: null,
            basisPoint: null,
            asymmetry: null,
            swapSlip: parseInt(actions?.actions[0]?.metadata?.swap?.swapSlip),
            streaming: {
              count: thorStatus.stages.swap_status?.streaming?.count,
              interval: thorStatus.stages.swap_status?.streaming?.interval || memo.interval,
              quantity: thorStatus.stages.swap_status?.streaming?.quantity || memo.quantity,
              lastHeight: null // Add on midgard if available
            },
            done: thorStatus.stages.swap_finalised?.completed &&
              !thorStatus.stages.swap_status?.pending
          },
          out: [{
            txid: outTxs?.length > 0 ? outTxs[0]?.id : null,
            to: (outTxs?.length > 0 && outTxs[0].to_address) || memo.destAddr,
            asset: outAsset,
            amount: parseInt(outAmount),
            fee: outboundFee,
            feeAsset: outboundFeeAsset,
            delayBlocksRemaining:
              thorStatus.stages.outbound_delay?.remaining_delay_blocks || 0,
            done: thorStatus.stages.swap_finalised?.completed &&
              !thorStatus.stages.swap_status?.pending &&
              (thorStatus.stages.outbound_signed?.completed ||
                outAsset.chain === 'THOR' ||
                outAsset.synth)
          }, ...outTxs.slice(1).map(tx => ({
            txid: tx.id,
            gas: tx.gas ? tx.gas[0].amount : null,
            gasAsset: tx.gas ? this.parseMemoAsset(tx.gas[0].asset, this.pools) : null,
            to: tx.to_address,
            asset: this.parseMemoAsset(tx.coins[0].asset, this.pools),
            amount: parseInt(tx.coins[0].amount)
          }))]
        },
        inAsset
      }

      return ret
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
