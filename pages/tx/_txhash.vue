<template>
  <Page>
    <template v-if="!isError && !isLoading">
      <div class="tx-header">
        <h3>
          Transaction
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
      <streaming-swap v-if="inboundHash" :inbound-hash="inboundHash" />
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
import { isInternalTx } from '~/utils'
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
      updateInterval: undefined,
      cards: [],
      inboundHash: undefined
    }
  },
  computed: {
    ...mapGetters({
      chainsHeight: 'getChainsHeight',
      pools: 'getPools'
    })
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
      const swapAction = md.actions?.find(a => a.type === 'swap')
      if (swapAction) {
        hash = swapAction.in[0].txID
      }

      // get inbound hash
      this.inboundHash = hash

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
          const inboundStages = this.getInboundStages(a)
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
                },
                {
                  key: 'Gas',
                  value: `${a.gas / 1e8} ${this.showAsset(a.gasAsset)}`,
                  is: a.gas && a.gasAsset
                },
                {
                  key: 'Inbound Stage',
                  value: inboundStages,
                  type: 'bubble',
                  is: inboundStages.length > 0
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
                is: accordions.action.streaming?.quantity
              },
              {
                key: 'Stream',
                value: `${accordions.action.streaming?.count} / ${accordions.action.streaming?.quantity}`,
                is: accordions.action.streaming?.count
              },
              {
                key: 'Interval',
                value: `${accordions.action.streaming?.interval} Block/Swap`,
                is: accordions.action.streaming?.interval
              },
              {
                key: 'Liquidity Fee',
                value: `${accordions.action.liquidityFee / 1e8} ${this.showAsset(accordions.out[0]?.asset)}`,
                is: accordions.action.liquidityFee
              },
              {
                key: 'Limit',
                value: `${accordions.action.limit / 1e8} ${this.showAsset(accordions.action.limitAsset)}`,
                is: accordions.action.limit
              },
              {
                key: 'Liquidity Units',
                value: `${accordions.action.liquidityUnits}`,
                is: accordions.action.liquidityUnits
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

      // Swap
      // From track code
      // TODO: check all kind of actions
      if (memo.type === 'swap') {
        const { cards, accordions } = this.createSwapState(thorStatus, thorTx, midgardAction, memo)
        this.cards = [this.createCard(cards, accordions)]
      } else if (memo.type === 'add') {
        const { cards, accordions } = this.createAddLiquidityState(thorStatus, midgardAction, thorTx)
        this.cards = [this.createCard(cards, accordions)]
      } else if (memo.type === 'withdraw') {
        const { cards, accordions } = this.createAddLiquidityState(thorStatus, midgardAction, thorTx)
        this.cards = [this.createCard(cards, accordions)]
      }
    },
    createNativeTx (nativeTx) {

    },
    createAddLiquidityState (thorStatus, actions, thorTx) {
      const inAsset = this.parseMemoAsset(thorStatus.tx.coins[0].asset, this.pools)
      const inAmount = parseInt(thorStatus.tx.coins[0].amount)

      return {
        cards: {
          title: 'add Liquidity',
          in: [{
            asset: inAsset,
            amount: inAmount
          }],
          out: []
        },
        accordions: {
          in: [{
            txid: thorStatus.tx.id,
            from: thorStatus.tx.from_address,
            asset: inAsset,
            amount: inAmount
          }],
          action: {
            type: 'Add',
            liquidityUnits: parseInt(actions?.actions[0]?.metadata?.addLiquidity?.liquidityUnits) || null,
            done: thorStatus.stages.swap_finalised?.completed &&
              !thorStatus.stages.swap_status?.pending
          },
          out: []
        }
      }
    },
    getInboundStages (inbound) {
      const ret = []

      if (inbound?.done) {
        ret.push({
          text: 'done'
        })
      }

      if (inbound?.inboundConfCount) {
        ret.push({
          text: 'Confirm Counted'
        })
      }

      if (inbound?.observationsCompleted) {
        ret.push({
          text: 'Observed'
        })
      }

      return ret
    },
    createRemoveLiquidityState (thorStatus, actions, thorTx) {

    },
    createSwapState (thorStatus, thorTx, actions, memo) {
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

      const outMemoAsset = this.parseMemoAsset(memo.asset)

      // Midgard
      const outboundFee =
        actions?.actions[0]?.metadata.swap?.networkFees[0]?.amount
      const outboundFeeAsset = outboundFee
        ? this.parseMemoAsset(
          actions?.actions[0]?.metadata.swap?.networkFees[0].asset,
          this.pools
        )
        : null

      // Refunds
      const outboundHasRefund = outTxs?.some(
        tx => tx.refund || tx.memo?.toLowerCase().startsWith('refund')
      )
      // sometimes the outbound doesn't come out if the outbound is in native chain
      const outboundHasSuccess = outTxs?.some(tx =>
        tx.memo?.toLowerCase().startsWith('out')
      )
      const outboundRefundReason = actions?.actions.find(
        action => action.type === 'refund'
      )?.metadata.refund.reason

      // only refund happened
      const onlyRefund = actions?.actions.every(
        action => action?.type === 'refund'
      )

      return {
        cards: {
          title: onlyRefund ? 'refunded Swap' : 'swap',
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
            amount: inAmount,
            gas: thorStatus.tx.gas ? thorStatus.tx.gas[0].amount : null,
            gasAsset: thorStatus.tx.gas
              ? this.parseMemoAsset(thorStatus.tx.gas[0].asset, this.pools)
              : null,
            preObservations: thorStatus.stages?.inbound_observed?.pre_confirmation_count,
            observations: thorStatus.stages?.inbound_observed?.final_count,
            observationsCompleted: thorStatus.stages?.inbound_observed?.completed,
            finalisedHeight: thorTx.finalised_height,
            inboundConfCount: thorStatus?.stages?.inbound_confirmation_counted,
            done: thorStatus.stages?.inbound_finalised?.completed
          }],
          action: {
            type: onlyRefund ? 'refunded Swap' : 'swap',
            limit: memo.limit,
            limitAsset: onlyRefund ? outMemoAsset : outAsset,
            affiliateName: memo.affiliate,
            affiliateFee: parseInt(actions?.actions[0]?.metadata?.swap?.affiliateFee) || null,
            liquidityFee: parseInt(actions?.actions[0]?.metadata?.swap?.liquidityFee) || null,
            liquidityUnits: null,
            refundReason: outboundRefundReason,
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
          }]
        }
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
