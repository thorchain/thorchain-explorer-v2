<template>
  <Page>
    <template v-if="!isError && !isLoading && pools">
      <div class="tx-header">
        <h3>Transaction</h3>
      </div>
      <div class="utility">
        <div class="tx-id clickable" @click="gotoTx($route.params.txhash)">
          {{ $route.params.txhash }}
        </div>
        <div
          class="icon-wrapper"
          style="margin: 0"
          @click="copy($route.params.txhash)"
        >
          <span class="icon-name">{{ copyText }}</span>
          <CopyIcon class="icon small" />
        </div>
      </div>

      <tx-card v-for="(c, i) in cards" :key="i" :tx-data="c.details">
        <template
          v-for="(s, j) in c.accordions.filter((c) => c.data.title)"
          #[s.name]
        >
          <accordion
            :key="i + '.' + j"
            :title="s.data.title"
            :pending="s.data.pending"
            :stacks="s.data.stacks"
            :show-at-first="s.data.showAtFirst"
          />
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
import { assetToString } from '@xchainjs/xchain-util'
import { orderBy } from 'lodash'
import { mapGetters } from 'vuex'
import BounceLoader from 'vue-spinner/src/BounceLoader.vue'
import streamingSwap from './components/streamingSwap.vue'
import txCard from './components/txCard.vue'
import CopyIcon from '~/assets/images/copy.svg?inline'
import DisconnectIcon from '~/assets/images/disconnect.svg?inline'
import {
  assetFromString,
  assetToTrade,
  isInternalTx,
  tradeToAsset,
} from '~/utils'
import Accordion from '~/components/Accordion.vue'

export default {
  components: {
    CopyIcon,
    DisconnectIcon,
    BounceLoader,
    streamingSwap,
    txCard,
    Accordion,
  },
  data() {
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
        title: "Couldn't find the Transaction",
        message: 'Something bad happened.',
      },
      updateInterval: undefined,
      cards: [],
      inboundHash: undefined,
      thorStatus: undefined,
      thorHeight: 0,
    }
  },
  computed: {
    ...mapGetters({
      chainsHeight: 'getChainsHeight',
      pools: 'getPools',
      runePrice: 'getRunePrice',
    }),
  },
  async mounted() {
    let txHash = this.$route.params.txhash
    if (txHash.toLowerCase().startsWith('0x')) {
      txHash = txHash.slice(2)
    }

    let isPending = false
    try {
      isPending = await this.fetchTx(txHash)
    } catch (error) {
      if (txHash.length <= 45) {
        const addrTxs = await this.$api.getAddress(txHash, 0)
        if (addrTxs?.data?.actions?.length > 0) {
          this.gotoAddr(this.$route.params.txhash)
        }
      }
      console.error(error)
      this.isError = true
      this.isLoading = false
      return
    }

    // if has no outbound
    if (isPending) {
      const uI = setInterval(async () => {
        try {
          isPending = await this.fetchTx(txHash)
        } catch (error) {
          if (txHash.length <= 45) {
            const addrTxs = await this.$api.getAddress(txHash, 0)
            if (addrTxs?.data?.actions?.length > 0) {
              this.gotoAddr(this.$route.params.txhash)
            }
          }
          console.error(error)
          this.isError = true
          this.isLoading = false
          return
        }
        if (!isPending) {
          clearInterval(uI)
        }
      }, 5000)

      this.updateInterval = uI
    }
  },
  destroyed() {
    this.clearIntervalId(this.updateInterval)
  },
  methods: {
    // TODO: check hash in saver with streaming
    async fetchTx(hash) {
      if (!this.pools) {
        return true
      }

      // Here the hash can be outbound but the inbound should be caught if it's not
      // Get Midgard details
      const md = (
        await this.$api.getTx(hash).catch((e) => {
          if (e?.response?.status === 404) {
            this.error.message =
              'Transaction is not found in Midgard. Please make sure the correct transaction hash or account address is inserted.'
          }
        })
      )?.data

      // See if the hash is outbound
      const swapAction = md?.actions?.find((a) => a.type === 'swap')
      if (swapAction) {
        hash = swapAction.in[0].txID
      }

      // get inbound hash
      this.inboundHash = hash

      // Get THORNode details
      const thorRes = await this.$api.getThornodeDetailTx(hash).catch((e) => {
        if (e?.response?.status / 200 !== 1) {
          this.error.message =
            'Transaction is not found in Thornode. Please make sure the correct transaction hash or account address is inserted.'
        }
      })

      // Assign header and data if available
      let td, tdh
      if (thorRes) {
        td = thorRes.data
        tdh = thorRes.headers
      }

      const ts = (
        await this.$api.getTxStatus(hash).catch((e) => {
          if (e?.response?.status / 200 !== 1) {
            this.error.message =
              "Can't find transaction status. Please make sure the correct transaction hash or account address is inserted."
          }
        })
      )?.data

      // Native Transaction
      let nt
      if (!td) {
        nt = (
          await this.$api.getNativeTx(hash).catch((e) => {
            if (e?.response?.status === 404) {
              this.error.message =
                'Please make sure the correct transaction hash or account address is inserted.'
              this.loading = false
            }
          })
        )?.data
      }

      this.thorStatus = ts
      this.isLoading = false

      // TODO: add proper error handling
      if (nt) {
        this.createNativeTx(nt)
        return false
      } else {
        if (tdh) {
          this.thorHeight = parseInt(tdh['x-thorchain-height'] ?? 0)
        }
        this.createTxState(md, td, ts, tdh, this.pools)
        return this.isTxInPending(ts)
      }
    },
    isTxInPending(thorStatus, actions) {
      const memo = this.parseMemo(thorStatus.tx?.memo)

      const userAddresses = new Set([
        thorStatus?.tx?.from_address?.toLowerCase(),
        memo.destAddr?.toLowerCase(),
      ])

      let outTxs = thorStatus?.out_txs?.filter((tx) =>
        userAddresses.has(tx?.to_address?.toLowerCase())
      )

      if (!outTxs) {
        outTxs = thorStatus?.planned_out_txs
          ?.filter((tx) => userAddresses.has(tx.to_address.toLowerCase()))
          .map((tx) => ({
            ...tx,
            coins: [{ amount: tx.coin.amount, asset: tx.coin.asset }],
          }))
      }

      const outAsset = this.parseMemoAsset(
        outTxs?.length > 0 ? outTxs[0].coins[0].asset : memo.asset,
        this.pools
      )

      if (actions && actions.actions.length > 0) {
        const ta = assetFromString(outAsset)
        const isRefund = actions.actions.some((e, i) => e.type === 'refund')
        if (isRefund && (ta.synth || ta.trade)) {
          return false
        }
      }

      const inboundFinalised = thorStatus.stages?.inbound_finalised?.completed
      let actionFinalised = true
      if (memo.type === 'swap') {
        actionFinalised =
          thorStatus?.stages.swap_finalised?.completed &&
          !thorStatus.stages.swap_status?.pending
      }
      const outboundFinalised =
        (thorStatus.stages.outbound_signed?.completed ||
          outAsset?.chain === 'THOR' ||
          outAsset?.synth ||
          outAsset?.trade) &&
        (thorStatus.stages?.outbound_delay?.completed ?? true)

      return !inboundFinalised || !actionFinalised || !outboundFinalised
    },
    createCard(cardBase, accordions) {
      // What to show in the cards
      const ret = {
        details: {
          title: cardBase.title,
          overall: {
            in: cardBase.in?.map((a) => ({
              asset: a?.asset,
              amount: a?.amount,
              amountUSD: this.amountToUSD(a?.asset, a?.amount, this.pools),
            })),
            middle: {
              pending: cardBase.middle?.pending,
              send: cardBase.middle?.send ?? false,
              fail: cardBase.middle?.fail ?? false,
            },
            out: cardBase.out?.map((a) => ({
              asset: a?.asset,
              amount: a?.amount,
              amountUSD: this.amountToUSD(a?.asset, a?.amount, this.pools),
              text: a?.text,
              icon: a?.icon,
              borderColor: a?.borderColor,
            })),
          },
        },
        accordions: [],
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
              pending: !a?.done,
              stacks: [
                {
                  key: 'From',
                  value: a?.from,
                  is: true,
                  asset: a?.asset,
                  type: 'address',
                  formatter: this.formatAddress,
                },
                {
                  key: 'Hash',
                  value: a?.txid,
                  is: true,
                  type: 'hash',
                  formatter: this.formatAddress,
                },
                {
                  key: 'Pre confirmation Count',
                  value: [
                    {
                      text: `${a.preConfirmationCount} Nodes`,
                      class: a.inboundObserved ? 'success' : 'yellow',
                    },
                  ],
                  type: 'bubble',
                  is: a.preConfirmationCount > 0,
                },
                {
                  key: 'Inbound Confirmation Remaining',
                  value: moment
                    .duration(a.confirmationRemainingSeconds, 'seconds')
                    .humanize(),
                  is: a.confirmationRemainingSeconds > 0,
                },
                {
                  key: 'Gas',
                  value:
                    `${a?.gas / 1e8} ${this.showAsset(a?.gasAsset)}` +
                    (this.pools
                      ? ` (${this.formatCurrency(this.amountToUSD(a?.gasAsset, a?.gas, this.pools))})`
                      : ''),
                  is: a?.gas && a?.gasAsset,
                },
                {
                  key: 'Inbound Stage',
                  value: inboundStages,
                  type: 'bubble',
                  is: inboundStages.length > 0,
                },
              ],
            },
          }
          ret.accordions.push(accordionIn)
        })
      }

      if (accordions.action) {
        if (accordions.action.affiliateName) {
          ret.details.interface = this.mapAffiliateName(
            accordions.action.affiliateName
          )
        }

        let affiliateOutAmount
        if (
          accordions.action.affiliateOut &&
          accordions.action.affiliateOut.length > 0
        ) {
          affiliateOutAmount = accordions.action.affiliateOut[0].coins[0].amount
        }

        const accordionAction = {
          name: 'accordion-action',
          data: {
            title: accordions.action?.type ?? undefined,
            pending: !accordions.action?.done,
            showAtFirst: accordions.action?.showAtFirst,
            stacks: [
              {
                key: 'Timestamp',
                value: `${accordions.action?.timeStamp?.format(
                  'L LT'
                )} (${accordions.action?.timeStamp?.fromNow()})`,
                is: accordions.action?.timeStamp?.isValid(),
              },
              {
                key: 'Quantity',
                value: `${accordions.action.streaming?.quantity} Swaps`,
                is: accordions.action.streaming?.quantity,
              },
              {
                key: 'Stream',
                value: `${accordions.action.streaming?.count} / ${accordions.action.streaming?.quantity}`,
                is: accordions.action.streaming?.count,
              },
              {
                key: 'Interval',
                value: `${moment
                  .duration(accordions.action.streaming?.interval * 6, 's')
                  .as('seconds')} secs (${this.$options.filters.pluralize(
                  accordions.action?.streaming?.interval,
                  'Block',
                  { includeNumber: true }
                )})`,
                is: accordions.action.streaming?.interval,
              },
              {
                key: 'Liquidity Fee',
                value: `${
                  accordions.action.liquidityFee / 1e8
                } RUNE (${this.formatSmallCurrency(
                  accordions.action.liquidityFee * this.runePrice
                )})`,
                is: accordions.action.liquidityFee,
              },
              {
                key: 'Interface Fee',
                value: `${
                  affiliateOutAmount / 1e8
                } RUNE (${this.formatSmallCurrency(
                  affiliateOutAmount * this.runePrice
                )})`,
                is:
                  accordions.action.affiliateOut &&
                  accordions.action.affiliateOut.length > 0,
              },
              {
                key: 'Limit',
                value:
                  accordions.action.limit > 0
                    ? `${accordions.action.limit / 1e8} ${this.showAsset(
                        accordions.action.limitAsset
                      )}`
                    : 'No target limit',
                is: accordions.action.limit,
              },
              {
                key: 'Liquidity Units',
                value: `${accordions.action.liquidityUnits}`,
                is: accordions.action.liquidityUnits,
              },
              {
                key: 'Affiliate Name / Basis',
                value: `${accordions.action.affiliateName} / ${accordions.action.affiliateFee}`,
                is: accordions.action.affiliateName,
              },
              {
                key: 'Block Height',
                value: `${accordions.action?.height}`,
                is: accordions.action?.height,
              },
              {
                key: 'Memo',
                value: accordions.action?.memo,
                is: accordions.action?.memo,
              },
              {
                key: 'Refund Reseaon',
                value: accordions.action?.refundReason,
                is: accordions.action?.refundReason,
              },
            ],
          },
        }
        if (accordions.action?.type === 'send') {
          accordionAction?.data?.stacks.push(
            {
              key: 'Hash',
              value: accordions.action?.txid,
              is: accordions.action?.txid,
              type: 'hash',
              formatter: this.formatAddress,
            },
            {
              key: 'From',
              value: accordions.action?.from,
              is: accordions.action?.from,
              type: 'address',
              formatter: this.formatAddress,
            },
            {
              key: 'To',
              value: accordions.action?.to,
              is: accordions.action?.to,
              type: 'address',
              formatter: this.formatAddress,
            }
          )
        }
        ret.accordions.push(accordionAction)
      }

      if (accordions.out) {
        accordions.out.forEach((a, i) => {
          const outboundStages = this.getOutboundStages(a)
          const accordionOut = {
            name: `accordion-out-${i}`,
            data: {
              title: 'Outbound',
              pending: !a?.done,
              stacks: [
                {
                  key: 'Destination',
                  value: a?.to,
                  is: a?.to,
                  asset: a?.asset,
                  type: 'address',
                  formatter: this.formatAddress,
                },
                {
                  key: 'Hash',
                  value: a?.txid,
                  is: !isInternalTx(a?.txid),
                  type: 'hash',
                  formatter: this.formatAddress,
                },
                {
                  key: 'Gas',
                  value: `${this.baseAmountFormatOrZero(
                    a.gas
                  )} ${this.showAsset(a.gasAsset)} (${this.formatCurrency(
                    this.amountToUSD(a?.gasAsset, a?.gas, this.pools)
                  )})`,
                  is: a.fees?.length === 0 && a?.gas && a?.gasAsset,
                },
                {
                  key: 'Outbound Est.',
                  value: moment
                    .duration(
                      this.blockSeconds('THOR') * a.outboundETA,
                      'seconds'
                    )
                    .humanize(),
                  is: !a.outboundDelayRemaining && a.outboundETA > 0,
                },
                {
                  key: 'Outbound Delay Est.',
                  value: moment
                    .duration(a.outboundDelayRemaining, 'seconds')
                    .humanize(),
                  is: a.outboundDelayRemaining,
                },
                {
                  key: 'Outbound Delay Est.',
                  value: [
                    {
                      text: 'Scheduled Passed',
                      class: 'danger',
                    },
                  ],
                  type: 'bubble',
                  is: a.outboundETA < 0,
                },
                {
                  key: 'Outbound Stage',
                  value: outboundStages,
                  type: 'bubble',
                  is: outboundStages.length > 0,
                },
              ],
            },
          }
          if (a.fees?.length > 0) {
            accordionOut.data?.stacks?.push(
              ...a.fees.map((f, j) => ({
                key: 'Outbound Fee',
                value:
                  `${f / 1e8} ${this.showAsset(a.feeAssets[j])}` +
                  (this.pools
                    ? ` (${this.formatCurrency(
                        this.amountToUSD(a.feeAssets[j], f, this.pools)
                      )})`
                    : ''),
                is: f,
              }))
            )
          }
          ret.accordions.push(accordionOut)
        })
      }

      return ret
    },
    async createTxState(midgardAction, thorTx, thorStatus, thorHeader, pools) {
      // Push as much as data gathered along all endpoint into cards!
      // Actions accordion, inbound accordion, outbound accordion

      // Parse by Memo like thornode
      const memo = this.parseMemo(thorStatus.tx?.memo)

      if (memo.type === 'swap') {
        const { cards, accordions } = this.createSwapState(
          thorStatus,
          thorTx,
          midgardAction,
          memo,
          thorHeader
        )
        this.$set(this, 'cards', [this.createCard(cards, accordions)])
      } else if (memo.type === 'add') {
        const finalCards = []
        const { cards, accordions } = this.createAddLiquidityState(
          thorStatus,
          midgardAction,
          thorTx,
          memo
        )
        finalCards.push(this.createCard(cards, accordions))
        if (memo.asymmetry) {
          const ts = await this.getOtherActionHash(midgardAction, thorStatus)
          const m = this.parseMemo(ts.tx?.memo)
          const { cards, accordions } = this.createAddLiquidityState(
            ts,
            midgardAction,
            thorTx,
            m
          )
          finalCards.push(this.createCard(cards, accordions))
        }
        this.$set(this, 'cards', finalCards)
      } else if (memo.type === 'withdraw') {
        const { cards, accordions } = this.createRemoveLiquidityState(
          thorStatus,
          midgardAction,
          thorTx,
          memo
        )
        this.$set(this, 'cards', [this.createCard(cards, accordions)])
      } else if (memo.type === 'tradeWithdraw') {
        const { cards, accordions } = this.createTradeWithdrawState(
          thorStatus,
          midgardAction,
          thorTx,
          memo
        )
        this.$set(this, 'cards', [this.createCard(cards, accordions)])
      } else if (memo.type === 'tradeDeposit') {
        const { cards, accordions } = this.createTradeDepositState(
          thorStatus,
          midgardAction,
          thorTx,
          memo
        )
        this.$set(this, 'cards', [this.createCard(cards, accordions)])
      } else {
        const finalCards = []
        for (let i = 0; i < midgardAction?.actions?.length; i++) {
          const { cards, accordions } = this.createAbstractState(
            thorStatus,
            midgardAction.actions[i],
            thorTx,
            memo
          )
          finalCards.push(this.createCard(cards, accordions))
        }
        this.$set(this, 'cards', finalCards)
      }
    },
    createTradeDepositState(thorStatus, action, thorTx) {
      const memo = this.parseMemo(thorStatus.tx?.memo)

      const ast = this.parseMemoAsset(thorStatus.tx.coins[0].asset, this.pools)

      const ins = [
        {
          asset: ast,
          amount: thorStatus.tx.coins[0].amount,
          txid: thorStatus.tx?.id,
          from: thorStatus.tx?.from_address,
          gas: thorStatus.tx?.gas ? thorStatus.tx?.gas[0].amount : null,
          gasAsset: thorStatus.tx?.gas
            ? this.parseMemoAsset(thorStatus.tx?.gas[0].asset, this.pools)
            : null,
          done: true,
        },
      ]

      const outs = [
        {
          asset: assetToTrade(ast),
          amount: thorStatus.out_txs
            ? thorStatus.out_txs[0]?.coins[0].amount
            : thorStatus.tx.coins[0].amount,
          txid: thorStatus.out_txs ? thorStatus.out_txs[0].id : null,
          to: memo.address,
          done: true,
        },
      ]

      return {
        cards: {
          title: 'Trade Account',
          in: ins,
          middle: {
            pending: false,
          },
          out: outs,
        },
        accordions: {
          in: ins,
          action: {
            type: 'Deposit',
            memo: thorStatus.tx?.memo,
            done: true,
          },
          out: outs,
        },
      }
    },
    createTradeWithdrawState(thorStatus, action, thorTx) {
      const memo = this.parseMemo(thorStatus.tx?.memo)

      const ast = this.parseMemoAsset(thorStatus.tx.coins[0].asset, this.pools)

      const ins = [
        {
          asset: assetToTrade(ast),
          amount: thorStatus.tx.coins[0].amount,
          txid: thorStatus.tx?.id,
          from: thorStatus.tx?.from_address,
          gas: thorStatus.tx?.gas ? thorStatus.tx?.gas[0].amount : null,
          gasAsset: thorStatus.tx?.gas
            ? this.parseMemoAsset(thorStatus.tx?.gas[0].asset, this.pools)
            : null,
          done: true,
        },
      ]

      const outs = [
        {
          asset: tradeToAsset(ast),
          amount: thorStatus.out_txs
            ? thorStatus.out_txs[0]?.coins[0].amount
            : thorStatus.tx.coins[0].amount,
          txid: thorStatus.out_txs ? thorStatus.out_txs[0].id : null,
          to: memo.address,
          gas: thorStatus.out_txs ? thorStatus.out_txs[0].gas[0].amount : null,
          gasAsset: thorStatus.out_txs
            ? this.parseMemoAsset(
                thorStatus.out_txs[0].gas[0].asset,
                this.pools
              )
            : null,
          outboundSigned: thorStatus.stages.outbound_signed?.completed ?? false,
          done: thorStatus.status === 'done',
        },
      ]

      return {
        cards: {
          title: 'Trade Account',
          in: ins,
          middle: {
            pending: false,
          },
          out: outs,
        },
        accordions: {
          in: ins,
          action: {
            type: 'Withdraw',
            memo: thorStatus.tx?.memo,
            done: true,
          },
          out: outs,
        },
      }
    },
    createAbstractState(thorStatus, action, thorTx) {
      const ins = action?.in.map((a) => ({
        asset: this.parseMemoAsset(a.coins[0]?.asset),
        amount: a.coins[0].amount,
        txid: a?.txID,
        from: a?.address,
        done: true,
      }))

      const outs = action?.out.map((a) => ({
        asset: this.parseMemoAsset(a.coins[0]?.asset),
        amount: a.coins[0].amount,
        txid: a?.txID,
        to: a?.address,
        done: true,
      }))

      return {
        cards: {
          title: 'Action',
          in: ins,
          middle: {
            pending: false,
          },
          out: outs,
        },
        accordions: {
          in: ins,
          action: {
            type: 'Action',
            timeStamp: moment.unix(action?.date / 1e9) || null,
            done: true,
          },
          out: outs,
        },
      }
    },
    async getOtherActionHash(actions, thorStatus) {
      let hash = thorStatus.tx?.id

      hash = actions.actions
        ?.reduce(
          (r, a) => [
            ...a.in.map((i) => i.txID),
            ...a.out.map((o) => o.txID),
            ...r,
          ],
          []
        )
        .find((a) => a !== hash)

      const ts = (
        await this.$api.getTxStatus(hash).catch((e) => {
          if (e?.response?.status / 200 !== 1) {
            this.error.message =
              "Can't find transaction status. Please make sure the correct transaction hash or account address is inserted."
          }
        })
      )?.data

      return ts
    },
    createNativeTx(nativeTx) {
      const inAsset = this.getNativeAsset(
        nativeTx.tx?.body?.messages[0].amount[0].denom
      )
      const inAmount = nativeTx.tx?.body?.messages[0].amount[0].amount
      const timeStamp = moment(nativeTx?.tx_response.timestamp)

      const cards = {
        title: 'Send',
        in: [
          {
            asset: inAsset,
            amount: inAmount,
          },
        ],
        middle: {
          send: true,
        },
        out: [],
      }

      const accordions = {
        in: [],
        action: {
          type: 'send',
          txid: nativeTx?.tx_response.txhash,
          memo: nativeTx.tx?.body?.memo || null,
          from: nativeTx.tx?.body?.messages[0].from_address,
          to: nativeTx.tx?.body?.messages[0].to_address,
          timeStamp,
          done: true,
          showAtFirst: true,
        },
        out: [],
      }

      this.$set(this, 'cards', [this.createCard(cards, accordions)])
    },
    createAddLiquidityState(thorStatus, actions, thorTx, memo) {
      const isSaver = this.parseMemoAsset(memo.asset).synth

      const inAsset = this.parseMemoAsset(
        thorStatus.tx.coins[0].asset,
        this.pools
      )
      const inAmount = parseInt(thorStatus.tx.coins[0].amount)
      const addAction = actions?.actions?.find(
        (a) => a.type === 'add_liquidity'
      )
      const timeStamp = moment.unix(addAction?.date / 1e9)

      const outboundDelayRemaining =
        (thorStatus.stages.outbound_delay?.remaining_delay_seconds ?? 0) ||
        (thorStatus.stages.outbound_delay?.remaining_delay_blocks ?? 0) *
          this.blockSeconds('THOR')

      const pending =
        thorStatus.stages.swap_status?.pending ||
        !thorStatus.stages.inbound_observed?.completed ||
        !(thorStatus.stages.inbound_confirmation_counted?.completed ?? true) ||
        !thorStatus.stages.inbound_finalised?.completed

      return {
        cards: {
          title: 'add Liquidity',
          in: [
            {
              asset: inAsset,
              amount: inAmount,
            },
          ],
          middle: {
            pending,
          },
          out: [
            {
              text: isSaver ? 'THORChain Vault' : 'THORChain Pool',
              icon: require('@/assets/images/vault.svg'),
              borderColor: 'var(--border-color)',
            },
          ],
        },
        accordions: {
          in: [
            {
              txid: thorStatus.tx.id,
              from: thorStatus.tx.from_address,
              asset: inAsset,
              amount: inAmount,
              done: true,
            },
          ],
          action: {
            type: 'Add',
            timeStamp: timeStamp || null,
            liquidityUnits:
              parseInt(
                actions?.actions[0]?.metadata?.addLiquidity?.liquidityUnits
              ) || null,
            affiliateName: memo.affiliate,
            affiliateFee: parseInt(memo.fee),
            outboundDelayRemaining: outboundDelayRemaining || 0,
            outboundETA:
              thorStatus.stages.outbound_signed?.scheduled_outbound_height -
              this.thorHeight,
            outboundSigned:
              thorStatus.stages.outbound_signed?.completed ?? false,
            done: !thorStatus.stages.swap_status?.pending,
          },
          out: [],
        },
      }
    },
    getInboundStages(inbound) {
      const ret = []

      if (inbound?.done) {
        ret.push({
          text: 'done',
        })
      }

      if (inbound?.inboundConfCount) {
        ret.push({
          text: 'Confirm Counted',
        })
      }

      if (inbound?.observationsCompleted) {
        ret.push({
          text: 'Observed',
        })
      }

      return ret
    },
    getOutboundStages(outbound) {
      const ret = []

      if (outbound?.done) {
        ret.push({
          text: 'done',
        })
      }

      if (outbound?.outboundDelayRemaining) {
        ret.push({
          text: 'delayed',
          class: 'yellow',
        })
      }

      if (outbound?.outboundSigned) {
        ret.push({
          text: 'signed',
        })
      } else if (outbound?.outboundSigned !== undefined) {
        ret.push({
          text: 'not signed',
          class: 'yellow',
        })
      }

      return ret
    },
    createRemoveLiquidityState(thorStatus, actions, thorTx, memo) {
      const inAsset = this.parseMemoAsset(
        thorStatus.tx.coins[0].asset,
        this.pools
      )
      const inAmount = parseInt(thorStatus.tx.coins[0].amount)
      const withdrawAction = actions?.actions?.find(
        (a) => a.type === 'withdraw'
      )

      const outboundFees =
        withdrawAction?.metadata.withdraw?.networkFees.map((n) => n?.amount) ??
        []
      const outboundFeeAssets =
        outboundFees?.length > 0
          ? this.parseMemoAsset(
              withdrawAction?.metadata.withdraw?.networkFees.map(
                (n) => n?.asset
              ),
              this.pools
            )
          : []
      const timeStamp = moment.unix(withdrawAction?.date / 1e9)

      const outTxs = thorStatus?.out_txs ?? undefined
      const userTxs =
        outTxs && new Set([outTxs.map((t) => t?.id?.toUpperCase())])

      let hasOngoing = false
      if (thorStatus.planned_out_txs > 0) {
        hasOngoing = thorStatus.planned_out_txs?.some(
          (tx) => !userTxs.has(tx.to_address.toUpperCase())
        )
        outTxs.push(
          thorStatus.planned_out_txs?.filter(
            (tx) => !userTxs.has(tx.to_address.toUpperCase())
          )
        )
      }

      const outAsset = this.parseMemoAsset(outTxs[0].coins[0].asset, this.pools)
      const outAmount =
        outTxs?.length > 0 ? parseInt(outTxs[0].coins[0].amount) : 0

      const outboundDelayRemaining =
        (thorStatus.stages.outbound_delay?.remaining_delay_seconds ?? 0) ||
        (thorStatus.stages.outbound_delay?.remaining_delay_blocks ?? 0) *
          this.blockSeconds('THOR')

      return {
        cards: {
          title: 'Withdraw Liquidity',
          in: [
            {
              asset: inAsset,
              amount: inAmount,
            },
          ],
          middle: {
            pending: this.isTxInPending(thorStatus),
          },
          out: [
            {
              asset: outAsset,
              amount: outAmount,
            },
            ...outTxs?.slice(1).map((o) => ({
              asset: this.parseMemoAsset(o.coins[0].asset, this.pools),
              amount: parseInt(o.coins[0].amount),
            })),
          ],
        },
        accordions: {
          in: [
            {
              txid: thorStatus.tx.id,
              from: thorStatus.tx.from_address,
              asset: inAsset,
              amount: inAmount,
              done: true,
            },
          ],
          action: {
            type: 'Withdraw',
            timeStamp: timeStamp || null,
            liquidityUnits:
              parseInt(withdrawAction?.metadata?.withdraw?.liquidityUnits) ||
              null,
            done: !hasOngoing,
          },
          out: [
            {
              fees: outboundFees,
              feeAssets: outboundFeeAssets,
              outboundDelayRemaining: outboundDelayRemaining || 0,
              outboundETA:
                thorStatus.stages.outbound_signed?.scheduled_outbound_height -
                this.thorHeight,
              outboundSigned:
                thorStatus.stages.outbound_signed?.completed ?? false,
              done:
                thorStatus.stages.outbound_signed?.completed ||
                outAsset.chain === 'THOR',
            },
            ...outTxs?.slice(1).map((o) => ({
              txid: o.id,
              to: o.to_address,
              asset: this.parseMemoAsset(o.coins[0].asset, this.pools),
              amount: parseInt(o.coins[0].amount),
              gas: o.gas ? o.gas[0].amount : null,
              gasAsset: o.gas
                ? this.parseMemoAsset(o.gas[0].asset, this.pools)
                : null,
              outboundSigned:
                thorStatus.stages.outbound_signed?.completed ?? false,
              done:
                thorStatus.stages.outbound_signed?.completed ||
                outAsset.chain === 'THOR',
            })),
          ],
        },
      }
    },
    createSwapState(thorStatus, thorTx, actions, memo, thorHeader) {
      // swap user addresses
      const userAddresses = new Set([
        thorStatus.tx.from_address.toLowerCase(),
        memo.destAddr?.toLowerCase(), // TODO: sometimes the memo destAddr will be THORName
      ])
      // Non affiliate outs
      let outTxs = thorStatus.out_txs?.filter(
        (tx) =>
          userAddresses.has(tx.to_address.toLowerCase()) ||
          (tx.coins[0].asset ===
            assetToString(this.parseMemoAsset(memo.asset)) &&
            (tx.id !==
              '0000000000000000000000000000000000000000000000000000000000000000' ||
              tx.id !== ''))
      )
      // get affiliate out if available
      const affiliateOut = thorStatus.out_txs?.filter(
        (tx) =>
          !userAddresses.has(tx.to_address.toLowerCase()) &&
          (tx.id !==
            '0000000000000000000000000000000000000000000000000000000000000000' ||
            tx.id !== '')
      )
      // TODO: fix this in track code
      if (!outTxs || outTxs?.length === 0) {
        outTxs = thorStatus.planned_out_txs
          ?.filter((tx) => userAddresses.has(tx.to_address.toLowerCase()))
          .map((tx) => ({
            ...tx,
            coins: [{ amount: tx.coin.amount, asset: tx.coin.asset }],
          }))
      }

      // order by target swapped asset if we have refund in swap
      outTxs = orderBy(
        outTxs,
        (o) => o.coins[0].asset === thorStatus.tx.coins[0].asset
      )

      // Add native in/out search
      const inAsset = this.parseMemoAsset(
        thorStatus.tx.coins[0].asset,
        this.pools
      )
      const inAmount = parseInt(thorStatus.tx.coins[0].amount)

      const outAsset = this.parseMemoAsset(
        outTxs?.length > 0 ? outTxs[0].coins[0].asset : memo.asset,
        this.pools
      )
      let outAmount =
        outTxs?.length > 0 ? parseInt(outTxs[0].coins[0].amount) : 0
      if (!outAmount && actions?.actions?.length > 0 && outAsset.trade) {
        outAmount = parseInt(actions?.actions[0]?.out[0]?.coins[0].amount)
      }

      const outMemoAsset = this.parseMemoAsset(memo.asset)

      // Midgard
      // There are multiple outbound fee
      // also there might be refund involved
      const swapAction = actions?.actions?.find((a) => a.type === 'swap')
      const outboundFees =
        swapAction?.metadata.swap?.networkFees.map((n) => n?.amount) ?? []
      const outboundFeeAssets =
        outboundFees?.length > 0
          ? this.parseMemoAsset(
              swapAction?.metadata.swap?.networkFees.map((n) => n?.asset),
              this.pools
            )
          : null
      let timeStamp = swapAction?.date

      // Refunds
      const outboundHasRefund = outTxs?.some(
        (tx) => tx.refund || tx.memo?.toLowerCase().startsWith('refund')
      )
      // sometimes the outbound doesn't come out if the outbound is in native chain
      const outboundHasSuccess = outTxs?.some((tx) =>
        tx.memo?.toLowerCase().startsWith('out')
      )
      const outboundRefundReason = actions?.actions.find(
        (action) => action.type === 'refund'
      )?.metadata.refund.reason

      // only refund happened
      const onlyRefund =
        actions?.actions.length > 0 &&
        actions?.actions.every((action) => action?.type === 'refund')

      if (onlyRefund) {
        const refundAction = actions?.actions?.find((a) => a.type === 'refund')
        timeStamp = refundAction?.date
      }

      // TODO: add nice check with animation (transition from pending to complete)
      // TODO: add failed swaps from midgard
      // TODO: Add refunded swap info
      // TODO: fix the loading check/spinner on complete
      // TODO: fix streaming card when finished
      // TODO: sometimes the pools price is fetched after the status

      const outboundDelayRemaining =
        (thorStatus.stages.outbound_delay?.remaining_delay_seconds ?? 0) ||
        (thorStatus.stages.outbound_delay?.remaining_delay_blocks ?? 0) *
          this.blockSeconds('THOR')

      if (timeStamp) {
        timeStamp = moment.unix(timeStamp / 1e9)
      }

      return {
        cards: {
          title: onlyRefund ? 'refunded Swap' : 'swap',
          in: [
            {
              asset: inAsset,
              amount: inAmount,
            },
          ],
          middle: {
            pending: this.isTxInPending(thorStatus, actions),
            fail: onlyRefund,
          },
          out: [
            {
              asset: outAsset,
              amount: outAmount,
            },
            ...outTxs?.slice(1).map((o) => ({
              asset: this.parseMemoAsset(o.coins[0].asset, this.pools),
              amount: parseInt(o.coins[0].amount),
            })),
          ],
        },
        accordions: {
          in: [
            {
              txid: thorStatus.tx.id,
              from: thorStatus.tx.from_address,
              asset: inAsset,
              amount: inAmount,
              gas: thorStatus.tx.gas ? thorStatus.tx.gas[0].amount : null,
              gasAsset: thorStatus.tx.gas
                ? this.parseMemoAsset(thorStatus.tx.gas[0].asset, this.pools)
                : null,
              preObservations:
                thorStatus.stages?.inbound_observed?.pre_confirmation_count,
              observations: thorStatus.stages?.inbound_observed?.final_count,
              observationsCompleted:
                thorStatus.stages?.inbound_observed?.completed,
              finalisedHeight: thorTx.finalised_height,
              inboundObserved:
                thorStatus?.stages?.inbound_observed?.completed || false,
              inboundConfCount:
                thorStatus?.stages?.inbound_confirmation_counted || 0,
              preConfirmationCount:
                thorStatus.stages?.inbound_observed?.pre_confirmation_count ||
                0,
              confirmationRemainingSeconds:
                thorStatus.stages?.inbound_confirmation_counted
                  ?.remaining_confirmation_seconds || 0,
              done: thorStatus.stages?.inbound_finalised?.completed,
            },
          ],
          action: {
            type: onlyRefund ? 'refunded Swap' : 'swap',
            timeStamp: timeStamp || null,
            limit: memo.limit,
            limitAsset: onlyRefund ? outMemoAsset : outAsset,
            affiliateName: memo.affiliate,
            affiliateFee:
              parseInt(actions?.actions[0]?.metadata?.swap?.affiliateFee) ||
              parseInt(memo.fee) ||
              0,
            liquidityFee:
              parseInt(actions?.actions[0]?.metadata?.swap?.liquidityFee) ||
              null,
            liquidityUnits: null,
            refundReason: outboundRefundReason,
            asymmetry: null,
            affiliateOut: affiliateOut || undefined,
            swapSlip: parseInt(actions?.actions[0]?.metadata?.swap?.swapSlip),
            streaming: {
              count: thorStatus.stages.swap_status?.streaming?.count,
              interval:
                thorStatus.stages.swap_status?.streaming?.interval ||
                memo.interval,
              quantity:
                thorStatus.stages.swap_status?.streaming?.quantity ||
                memo.quantity,
              lastHeight: null, // Add on midgard if available
            },
            done:
              thorStatus.stages.swap_finalised?.completed &&
              !thorStatus.stages.swap_status?.pending,
          },
          out: [
            {
              txid: outTxs?.length > 0 ? outTxs[0]?.id : null,
              to: (outTxs?.length > 0 && outTxs[0].to_address) || memo.destAddr,
              asset: outAsset,
              amount: parseInt(outAmount),
              gas:
                outTxs?.length > 0 && outTxs[0].gas
                  ? outTxs[0].gas[0].amount
                  : null,
              gasAsset:
                outTxs?.length > 0 && outTxs[0].gas
                  ? this.parseMemoAsset(outTxs[0].gas[0].asset, this.pools)
                  : null,
              fees: outboundFees,
              feeAssets: outboundFeeAssets,
              delayBlocksRemaining:
                thorStatus.stages.outbound_delay?.remaining_delay_blocks || 0,
              outboundDelayRemaining: outboundDelayRemaining || 0,
              outboundETA:
                thorStatus.stages.outbound_signed?.scheduled_outbound_height -
                this.thorHeight,
              outboundSigned:
                thorStatus.stages.outbound_signed?.completed ?? undefined,
              done:
                thorStatus.stages.swap_finalised?.completed &&
                !thorStatus.stages.swap_status?.pending &&
                (thorStatus.stages.outbound_signed?.completed ||
                  outAsset.chain === 'THOR' ||
                  outAsset.synth ||
                  outAsset.trade) &&
                (thorStatus.stages.outbound_delay?.completed ?? true),
            },
            ...outTxs?.slice(1).map((o) => ({
              txid: o.id,
              to: o.to_address,
              asset: this.parseMemoAsset(o.coins[0].asset, this.pools),
              amount: parseInt(o.coins[0].amount),
              gas: o.gas ? o.gas[0].amount : null,
              gasAsset: o.gas
                ? this.parseMemoAsset(o.gas[0].asset, this.pools)
                : null,
              done:
                thorStatus.stages.swap_finalised?.completed &&
                !thorStatus.stages.swap_status?.pending &&
                (thorStatus.stages.outbound_signed?.completed ||
                  outAsset.chain === 'THOR' ||
                  outAsset.synth ||
                  outAsset.trade),
            })),
          ],
        },
      }
    },
  },
  head: {
    title: 'THORChain Network Explorer | TX',
  },
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

.utility,
.tx-date,
.tx-header {
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
