<template>
  <Page>
    <div class="tx-header">
      <div class="item tx-id">
        <span class="mono">
          {{ $route.params.txhash }}
        </span>
      </div>
      <div class="item">
        <Copy :str-copy="$route.params.txhash" />
      </div>
      <div id="qrcode" class="item">
        <qr-btn :qrcode="$route.params.txhash"></qr-btn>
      </div>
    </div>
    <template v-if="!isError && !isLoading && pools">
      <template v-if="cards && cards.length > 0">
        <tx-card v-for="(c, i) in cards" :key="i" :tx-data="c.details">
          <template
            v-for="(s, j) in c.accordions.filter((c) => c.data.title)"
            #[s.name]
          >
            <accordion
              :key="i + '.' + j"
              :title="s.data.title"
              :pending="s.data.pending"
              :done="s.data.done"
              :remaining-time="s.data.remainingTime"
              :total-time="s.data.totalTime"
              :asset="s.data.asset"
              :stacks="s.data.stacks"
              :error="s.data.error"
              :show-at-first="true"
              :attributes="s.data.attributes"
            />
          </template>
        </tx-card>
        <streaming-swap
          v-if="inboundHash"
          :inbound-hash="inboundHash"
          :quote="quote"
          :height="height"
        />
      </template>
      <tx-loader v-else></tx-loader>
    </template>
    <div v-else-if="isError" class="notify-card card-bg">
      <h3>{{ error.title }}</h3>
      <span>{{ error.message }}</span>
      <DisconnectIcon class="disconnect-icon" />
    </div>
    <div v-else-if="isLoading && !isError">
      <tx-loader />
    </div>
  </Page>
</template>

<script>
import moment from 'moment'
import { orderBy, groupBy, sumBy } from 'lodash'
import { mapGetters } from 'vuex'
import streamingSwap from './components/streamingSwap.vue'
import txCard from './components/txCard.vue'
import DisconnectIcon from '~/assets/images/disconnect.svg?inline'
import {
  assetFromString,
  assetToTrade,
  assetToSecure,
  isInternalTx,
  tradeToAsset,
  assetToString,
} from '~/utils'
import Accordion from '~/components/Accordion.vue'

export default {
  components: {
    DisconnectIcon,
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
      quote: undefined,
      height: undefined,
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
        await this.$api.getActions({ txid: hash }).catch((e) => {
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
      let archival = false
      let thorRes = await this.$api.getThornodeDetailTx(hash).catch((e) => {
        if (e?.response?.status / 200 !== 1) {
          this.error.message =
            'Transaction is not found in Thornode. Please make sure the correct transaction hash or account address is inserted.'
        }
      })

      if (!thorRes) {
        thorRes = await this.$api.getThornodeArchiveTx(hash).catch((e) => {
          if (e?.response?.status / 200 !== 1) {
            this.error.message =
              'Transaction is not found in Thornode. Please make sure the correct transaction hash or account address is inserted.'
          }
        })
        archival = true
      }

      // Assign header and data if available
      let td, tdh
      if (thorRes) {
        td = thorRes.data
        tdh = thorRes.headers
      }

      let ts = (
        await this.$api.getTxStatus(hash).catch((e) => {
          if (e?.response?.status / 200 !== 1) {
            this.error.message =
              "Can't find transaction status. Please make sure the correct transaction hash or account address is inserted."
          }
        })
      )?.data

      if (archival) {
        ts = (
          await this.$api.getTxArchiveStatus(hash).catch((e) => {
            if (e?.response?.status / 200 !== 1) {
              this.error.message =
                "Can't find transaction status. Please make sure the correct transaction hash or account address is inserted."
            }
          })
        )?.data
      }

      this.thorStatus = ts
      this.isLoading = false

      const nt = md?.actions?.find((a) => a.type === 'send')
      const memo = this.parseMemo(td?.tx?.tx?.memo)
      // TODO: add proper error handling
      if (nt && (!memo.type || memo.type === 'unknown')) {
        this.createNativeTx(nt)
        return false
      } else {
        if (tdh) {
          this.thorHeight = parseInt(tdh['x-thorchain-height'] ?? 0)
        }
        this.createTxState(md, td, ts, tdh, this.pools)
        return this.isTxInPending(ts, md)
      }
    },
    isTxInPending(thorStatus, actions) {
      const memo = this.parseMemo(thorStatus?.tx?.memo)

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

      if (actions && actions.actions?.length > 0) {
        if (memo.type !== 'swap') {
          const success = actions.actions.some((e, i) => e.status === 'success')
          if (success) {
            return false
          }
        }
        let ta
        if (outAsset) {
          ta = assetFromString(outAsset)
        }
        const isRefund = actions.actions.some((e, i) => e.type === 'refund')
        if (isRefund && (ta?.synth || ta?.trade || ta?.secure)) {
          return false
        }
      }

      const inboundFinalised = thorStatus?.stages?.inbound_finalised?.completed
      let actionFinalised = true
      if (memo.type === 'swap') {
        actionFinalised =
          (outAsset?.chain !== 'THOR' &&
            thorStatus?.stages.swap_finalised?.completed) ||
          !thorStatus?.stages.swap_status?.pending
      }
      const outboundFinalised =
        (thorStatus?.stages.outbound_signed?.completed ||
          outAsset?.chain === 'THOR' ||
          outAsset?.synth ||
          outAsset?.trade ||
          outAsset?.secure) &&
        (thorStatus?.stages?.outbound_delay?.completed ?? true)

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
              amountUSD:
                a?.amountUSD ??
                this.amountToUSD(a?.asset, a?.amount, this.pools),
              filter: a?.filter,
              text: a?.text,
              icon: a?.icon,
              address: a?.address,
              class: a?.class,
            })),
            middle: {
              pending: cardBase.middle?.pending,
              send: cardBase.middle?.send ?? false,
              fail: cardBase.middle?.fail ?? false,
            },
            out: cardBase.out?.map((a) => ({
              asset: a?.asset,
              amount: a?.amount,
              amountUSD:
                a?.amountUSD ??
                this.amountToUSD(a?.asset, a?.amount, this.pools),
              text: a?.text,
              icon: a?.icon,
              address: a?.address,
              borderColor: a?.borderColor,
              filter: a?.filter,
              class: a?.class,
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
              done: a?.done,
              pending: !a?.done,
              remainingTime: a.confirmationRemainingSeconds,
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
                  asset: a?.asset,
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
        ret.details.interface = ''
        if (accordions.action.affiliateName) {
          const affiliates = accordions.action.affiliateName
          ret.details.interface = affiliates
        }

        let affiliateOutAmount
        if (
          accordions.action.affiliateOut &&
          accordions.action.affiliateOut.length > 0
        ) {
          affiliateOutAmount = accordions.action.affiliateOut.reduce(
            (a, b) => a + +b.coins[0].amount,
            0
          )
        }

        let liquidityFeeName = 'Liquidity Fee'
        let totalLiquidityFees = accordions.action?.liquidityFee
        if (
          accordions.action.streaming?.count <
          accordions.action.streaming?.quantity
        ) {
          liquidityFeeName = 'Liquidity Fee (est)'
          const one =
            +accordions.action?.liquidityFee /
            accordions.action.streaming?.count
          totalLiquidityFees +=
            one *
            (+accordions.action.streaming?.quantity -
              +accordions.action.streaming?.count)
        }

        const blockDuration = this.chainsHeight?.THOR - this.height

        const remainingTime =
          (+accordions?.action?.streaming?.quantity *
            +accordions.action.streaming?.interval -
            blockDuration) *
          6

        const totalTime =
          +accordions?.action?.streaming?.quantity *
          +accordions.action.streaming?.interval *
          6

        const accordionAction = {
          name: 'accordion-action',
          data: {
            title: accordions.action?.type ?? undefined,
            remainingTime,
            totalTime,
            pending: !accordions.action?.done,
            done: accordions.action?.done,
            showAtFirst: accordions.action?.showAtFirst,
            error: accordions.action?.error,
            attributes: accordions?.action?.attributes,
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
                key: 'Rate',
                value: accordions.action.rate,
                is: accordions.action.rate && accordions.action.rate.length > 0,
                type: 'rate',
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
                key: liquidityFeeName,
                value: `${
                  totalLiquidityFees / 1e8
                } RUNE (${this.formatSmallCurrency(
                  totalLiquidityFees * this.runePrice
                )})`,
                is: accordions.action.liquidityFee,
              },
              {
                key: 'Swap Slip',
                value: `${this.percentageFormat(accordions.action.swapSlip / 1e4, 2)}`,
                is: accordions.action.swapSlip,
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
                key: 'Units',
                value: `${accordions.action.units}`,
                is: accordions.action.units,
              },
              {
                key: 'Affiliate Name',
                value: `${accordions.action.affiliateName}`,
                is: accordions.action.affiliateName,
              },
              {
                key: 'Affiliate Basis',
                value: `${accordions.action.affiliateFee}`,
                is: accordions.action.affiliateFee,
              },
              {
                key: 'Block Height',
                value: `${accordions.action?.height}`,
                is: accordions.action?.height,
                formatter: this.normalFormat,
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
              // Bond
              {
                key: 'Node Address',
                value: accordions.action?.nodeAddress,
                is: accordions.action?.nodeAddress,
                type: 'address',
                formatter: this.formatAddress,
              },
              {
                key: 'Bond Provider',
                value: accordions.action?.provider,
                is: accordions.action?.provider,
                type: 'address',
                formatter: this.formatAddress,
              },
              // THORName
              {
                key: 'THORName',
                value: accordions.action?.thorname,
                is: accordions.action?.thorname,
              },
              {
                key: 'Address',
                value: accordions.action?.address,
                is: accordions.action?.address,
                type: 'address',
                formatter: this.formatAddress,
              },
              {
                key: 'Owner',
                value: accordions.action?.owner,
                is: accordions.action?.owner,
                type: 'address',
                formatter: this.formatAddress,
              },
              {
                key: 'Expire',
                value: accordions.action?.expire,
                is: accordions.action?.expire,
                formatter: this.normalFormat,
              },
              {
                key: 'Registration Fee',
                value: `${accordions.action?.registrationFee}`,
                is: accordions.action?.registrationFee,
              },
              // Failed Deposit
              {
                key: 'Reason',
                value: `${accordions.action?.reason}`,
                is: accordions.action?.reason,
              },
              {
                key: 'Code',
                value: `${accordions.action?.code}`,
                is: accordions.action?.code,
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
        let showAssets = false
        if (accordions.out.length > 1) {
          showAssets = true
        }

        accordions.out.forEach((a, i) => {
          const outboundStages = this.getOutboundStages(a)
          let delay = 0
          if (a.outboundETA > this.chainsHeight?.THOR) {
            delay =
              this.blockSeconds('THOR') *
              (+a.outboundETA - +this.chainsHeight?.THOR)
          }
          if (delay === 0) {
            delay = a.outboundDelayRemaining
          }

          const accordionOut = {
            name: `accordion-out-${i}`,
            data: {
              title: 'Outbound',
              done: a.done,
              pending: !a?.done,
              remainingTime: delay,
              totalTime: delay,
              asset: showAssets ? a?.asset : undefined,
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
                  asset: a?.asset,
                  type: 'hash',
                  formatter: this.formatAddress,
                },
                {
                  key: 'Executed at',
                  value: a.height,
                  formatter: this.normalFormat,
                  is: a.height,
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
                      this.blockSeconds('THOR') *
                        (+this.chainsHeight?.THOR - +a.outboundETA),
                      'seconds'
                    )
                    .humanize(),
                  is: a.outboundETA > this.chainsHeight?.THOR,
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
                  is:
                    a.outboundETA > 0 &&
                    a.outboundETA < this.chainsHeight?.THOR,
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
      const memo = this.parseMemo(thorTx?.tx?.tx?.memo)
      if (memo.type === 'outbound') {
        this.gotoTx(memo.hash)
        return
      }

      if (memo.type === 'swap') {
        const inAsset = this.parseMemoAsset(
          thorStatus?.tx.coins[0].asset,
          this.pools
        )
        const inAmount = parseInt(thorStatus?.tx.coins[0].amount)
        const outAsset = this.parseMemoAsset(memo.asset, this.pools)

        // get quote
        const swapAction = midgardAction?.actions?.find(
          (a) => a.type === 'swap'
        )
        const affiliateBasis = memo.fee
        const affiliateFee = affiliateBasis || 0
        if (thorStatus?.stages.swap_status?.pending && !this.quote) {
          try {
            const { data: quoteData } = await this.$api.getQuote({
              amount: inAmount,
              from_asset: assetToString(inAsset),
              to_asset: assetToString(outAsset),
              destination: memo.destAddr,
              streaming_interval:
                thorStatus?.stages.swap_status?.streaming?.interval ||
                memo.interval,
              ...(affiliateFee && { affiliate: memo.affiliate }),
              ...(affiliateFee && { affiliate_bps: affiliateFee }),
              height: midgardAction?.actions[0]?.height,
            })
            this.quote = quoteData
          } catch (error) {
            console.error(error)
          }
        }

        const { cards, accordions } = await this.createSwapState(
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
          if (ts && ts.tx) {
            const m = this.parseMemo(ts.tx?.memo)
            const { cards, accordions } = this.createAddLiquidityState(
              ts,
              midgardAction,
              thorTx,
              m
            )
            finalCards.push(this.createCard(cards, accordions))
          }
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
      } else if (memo.type === 'runePoolWithdraw') {
        const { cards, accordions } = this.createRunePoolWithdraw(
          thorStatus,
          midgardAction,
          thorTx,
          memo
        )
        this.$set(this, 'cards', [this.createCard(cards, accordions)])
      } else if (memo.type === 'runePoolDeposit') {
        const { cards, accordions } = this.createRunePoolDeposit(
          thorStatus,
          midgardAction,
          thorTx,
          memo
        )
        this.$set(this, 'cards', [this.createCard(cards, accordions)])
      } else if (
        memo.type === 'tradeWithdraw' ||
        memo.type === 'secureWithdraw'
      ) {
        const { cards, accordions } = this.createTradeWithdrawState(
          thorStatus,
          midgardAction,
          thorTx,
          memo
        )
        this.$set(this, 'cards', [this.createCard(cards, accordions)])
      } else if (
        memo.type === 'tradeDeposit' ||
        memo.type === 'secureDeposit'
      ) {
        const { cards, accordions } = this.createTradeDepositState(
          thorStatus,
          midgardAction,
          thorTx,
          memo
        )
        this.$set(this, 'cards', [this.createCard(cards, accordions)])
      } else if (memo.type === 'bond') {
        const { cards, accordions } = this.createBondState(
          thorStatus,
          midgardAction,
          thorTx,
          memo
        )
        this.$set(this, 'cards', [this.createCard(cards, accordions)])
      } else if (memo.type === 'unbound') {
        const { cards, accordions } = this.createUnbondState(
          thorStatus,
          midgardAction,
          thorTx,
          memo
        )
        this.$set(this, 'cards', [this.createCard(cards, accordions)])
      } else if (memo.type === 'thorname') {
        const { cards, accordions } = this.createThornameState(
          thorStatus,
          midgardAction,
          thorTx,
          memo
        )
        this.$set(this, 'cards', [this.createCard(cards, accordions)])
      } else if (
        midgardAction.actions &&
        midgardAction.actions[0]?.type === 'failed'
      ) {
        const { cards, accordions } = this.createFailedState(
          thorStatus,
          midgardAction,
          thorTx,
          memo
        )
        this.$set(this, 'cards', [this.createCard(cards, accordions)])
      } else if (
        midgardAction.actions &&
        midgardAction.actions[0]?.type === 'contract'
      ) {
        const finalCards = []
        for (let i = 0; i < midgardAction?.actions?.length; i++) {
          const { cards, accordions } = this.createContractState(
            thorStatus,
            midgardAction.actions[i],
            thorTx,
            memo
          )
          finalCards.push(this.createCard(cards, accordions))
        }
        this.$set(this, 'cards', finalCards)
      } else if (memo.type === 'loanRepayment') {
        const { cards, accordions } = this.createLoanRepayment(
          thorStatus,
          midgardAction,
          thorTx,
          memo
        )
        this.$set(this, 'cards', [this.createCard(cards, accordions)])
      } else if (memo.type === 'tcyUnstake') {
        const { cards, accordions } = this.createTCYUnstake(
          thorStatus,
          midgardAction,
          thorTx,
          memo
        )

        this.$set(this, 'cards', [this.createCard(cards, accordions)])
      } else if (memo.type === 'tcyStake') {
        const { cards, accordions } = this.createTCYStake(
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
    createThornameState(thorStatus, action, thorTx) {
      action = action.actions[0]
      const timeStamp = moment.unix(action?.date / 1e9)

      const ins = action?.in.map((a) => ({
        txid: a?.txID,
        from: a?.address,
        icon: require('@/assets/images/wallet.svg?inline'),
        address: action.metadata?.thorname?.address,
        done: true,
      }))

      const outs = action?.in.map((a) => ({
        icon: require('@/assets/images/name.svg?inline'),
        text: action.metadata?.thorname?.thorname,
        class: 'pad-icon',
      }))

      return {
        cards: {
          title: 'THORName',
          in: ins,
          middle: {
            pending: false,
          },
          out: outs,
        },
        accordions: {
          in: ins,
          action: {
            type: 'THORName',
            memo: action.metadata?.thorname?.memo,
            expire: action.metadata?.thorname?.expire,
            thorname: action.metadata?.thorname?.thorname,
            owner: action.metadata?.thorname?.owner,
            registrationFee: action.metadata?.thorname?.registrationFee,
            address: action.metadata?.thorname?.address,
            height: action?.height,
            timeStamp,
            done: true,
          },
          out: [],
        },
      }
    },
    createLoanRepayment(thorStatus, actions, thorTx) {
      const action = actions.actions[0]

      const ins = action?.in.map((a) => ({
        asset: this.parseMemoAsset(a.coins[0]?.asset),
        amount: a.coins[0]?.amount,
        txid: a?.txID,
        from: a?.address,
        done: true,
      }))

      let outs = []
      outs = action?.out.map((a) => ({
        asset: this.parseMemoAsset(a.coins[0]?.asset),
        amount: a.coins[0]?.amount,
        txid: a?.txID,
        to: a?.address,
        height: a?.height,
        done: true,
      }))

      if (outs?.length === 0 && thorStatus.planned_out_txs?.length > 0) {
        thorStatus.planned_out_txs.map((t) => ({
          asset: this.parseMemoAsset(t.coin.asset),
          amount: t.coin.amount,
          to: t.to_address,
          done: false,
          pending: true,
        }))
      }

      return {
        cards: {
          title: 'Loan Repay',
          in: ins,
          middle: {
            pending: false,
          },
          out: outs,
        },
        accordions: {
          in: ins,
          action: {
            type: 'Repay',
            timeStamp: moment.unix(action?.date / 1e9) || null,
            height: action?.height,
            done: true,
          },
          out: outs,
        },
      }
    },
    createContractState(thorStatus, action) {
      const ins = action?.in.map((a) => ({
        asset: this.parseMemoAsset(a.coins[0]?.asset),
        amount: a.coins[0]?.amount,
        txid: a?.txID,
        from: a?.address,
        done: true,
      }))

      return {
        cards: {
          title: 'Contract Call',
          in: [
            {
              icon: require('@/assets/images/wallet.svg?inline'),
              address: action?.in[0]?.address,
            },
          ],
          middle: {
            pending: false,
            fail: false,
            success: true,
            empty: true,
          },
          out: [
            {
              icon: require('@/assets/images/contract.svg?inline'),
              address: action?.out[0]?.address,
            },
          ],
        },
        accordions: {
          in: ins,
          action: {
            type: action.metadata.contract.contractType,
            attributes: {
              attributes: action.metadata.contract.attributes,
              funds: action.metadata.contract.funds,
              msg: action.metadata.contract.msg,
            },
            done: true,
          },
          out: [],
        },
      }
    },
    createFailedState(thorStatus, action, thorTx) {
      action = action.actions[0]
      const timeStamp = moment.unix(action?.date / 1e9)
      const { type } = this.parseMemo(action?.metadata?.failed.memo)

      const ins = action?.in.map((a) => ({
        asset: this.parseMemoAsset(a.coins[0]?.asset),
        amount: a.coins[0].amount,
        txid: a?.txID,
        from: a?.address,
        gas: thorStatus?.tx?.gas ? thorStatus?.tx?.gas[0].amount : null,
        gasAsset: thorStatus?.tx?.gas
          ? this.parseMemoAsset(thorStatus?.tx?.gas[0].asset, this.pools)
          : null,
        done: true,
      }))

      return {
        cards: {
          title: type,
          in: ins,
          middle: {
            pending: false,
            fail: true,
          },
          out: [],
        },
        accordions: {
          in: ins,
          action: {
            type,
            memo: action.metadata?.failed?.memo,
            reason: action.metadata?.failed?.reason,
            code: action.metadata?.failed?.code,
            height: action?.height,
            timeStamp,
            done: true,
            error: true,
          },
          out: [],
        },
      }
    },
    createBondState(thorStatus, action, thorTx) {
      action = action.actions[0]
      const timeStamp = moment.unix(action?.date / 1e9)

      const ins = action?.in.map((a) => ({
        asset: this.parseMemoAsset(a.coins[0]?.asset),
        amount: a.coins[0].amount,
        gas: thorStatus?.tx?.gas ? thorStatus?.tx?.gas[0].amount : null,
        gasAsset: thorStatus?.tx?.gas
          ? this.parseMemoAsset(thorStatus?.tx?.gas[0].asset, this.pools)
          : null,
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

      const isWhitelist = action.metadata?.bond?.provider

      return {
        cards: {
          title: 'Bond' + (isWhitelist ? ' Whitelist' : ''),
          in: ins,
          middle: {
            pending: false,
          },
          out: [
            {
              icon: require('@/assets/images/node.svg?inline'),
              address: action.metadata?.bond?.nodeAddress,
              class: 'pad-icon',
            },
          ],
        },
        accordions: {
          in: ins,
          action: {
            type: 'Bond',
            memo: action.metadata?.bond?.memo,
            nodeAddress: action.metadata?.bond?.nodeAddress,
            provider: action.metadata?.bond?.provider,
            timeStamp,
            height: action?.height,
            done: true,
          },
          out: outs,
        },
      }
    },
    createUnbondState(thorStatus, action, thorTx) {
      action = action.actions[0]
      const timeStamp = moment.unix(action?.date / 1e9)

      const ins = action?.in.map((a) => ({
        asset: this.parseMemoAsset(a.coins[0]?.asset),
        amount: a.coins[0]?.amount,
        gas: thorStatus?.tx?.gas ? thorStatus?.tx?.gas[0].amount : null,
        gasAsset: thorStatus?.tx?.gas
          ? this.parseMemoAsset(thorStatus?.tx?.gas[0].asset, this.pools)
          : null,
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
          title: 'Unbond',
          in: [
            {
              icon: require('@/assets/images/node.svg?inline'),
              address: action.metadata?.bond?.nodeAddress,
              class: 'pad-icon',
            },
          ],
          middle: {
            pending: false,
          },
          out: outs,
        },
        accordions: {
          in: ins,
          action: {
            type: 'Unbond',
            memo: action.metadata?.bond?.memo,
            nodeAddress: action.metadata?.bond?.nodeAddress,
            timeStamp,
            height: action?.height,
            done: true,
          },
          out: outs,
        },
      }
    },
    createTradeDepositState(thorStatus, action, thorTx) {
      action = action.actions[0]
      const timeStamp = moment.unix(action?.date / 1e9)
      const memo = this.parseMemo(thorStatus?.tx?.memo)

      const ast = this.parseMemoAsset(thorStatus?.tx.coins[0].asset, this.pools)

      let isSecure = false
      if (memo.type.includes('secure')) {
        isSecure = true
      }

      const ins = [
        {
          asset: ast,
          amount: thorStatus?.tx.coins[0].amount,
          txid: thorStatus?.tx?.id,
          from: thorStatus?.tx?.from_address,
          gas: thorStatus?.tx?.gas ? thorStatus?.tx?.gas[0].amount : null,
          gasAsset: thorStatus?.tx?.gas
            ? this.parseMemoAsset(thorStatus?.tx?.gas[0].asset, this.pools)
            : null,
          done: true,
        },
      ]

      const outs = [
        {
          asset: isSecure ? assetToSecure(ast) : assetToTrade(ast),
          amount: thorStatus.out_txs
            ? thorStatus.out_txs[0]?.coins[0].amount
            : thorStatus?.tx.coins[0].amount,
          txid: thorStatus.out_txs ? thorStatus.out_txs[0].id : null,
          to: memo.address,
          done: true,
        },
      ]

      return {
        cards: {
          title: this.camelCase(memo.type),
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
            memo: thorStatus?.tx?.memo,
            height: action?.height,
            timeStamp,
            done: true,
          },
          out: outs,
        },
      }
    },
    createTradeWithdrawState(thorStatus, action, thorTx) {
      action = action.actions[0]
      const timeStamp = moment.unix(action?.date / 1e9)
      const memo = this.parseMemo(thorStatus?.tx?.memo)

      const ast = this.parseMemoAsset(thorStatus?.tx.coins[0].asset, this.pools)

      let isSecure = false
      if (memo.type.includes('secure')) {
        isSecure = true
      }

      const ins = [
        {
          asset: isSecure ? assetToSecure(ast) : assetToTrade(ast),
          amount: thorStatus?.tx.coins[0].amount,
          txid: thorStatus?.tx?.id,
          from: thorStatus?.tx?.from_address,
          gas: thorStatus?.tx?.gas ? thorStatus?.tx?.gas[0].amount : null,
          gasAsset: thorStatus?.tx?.gas
            ? this.parseMemoAsset(thorStatus?.tx?.gas[0].asset, this.pools)
            : null,
          done: true,
        },
      ]

      const outs = [
        {
          asset: tradeToAsset(ast),
          amount: thorStatus.out_txs
            ? thorStatus.out_txs[0]?.coins[0].amount
            : thorStatus?.tx.coins[0].amount,
          txid: thorStatus.out_txs ? thorStatus.out_txs[0].id : null,
          to: memo.address,
          gas: thorStatus.out_txs ? thorStatus.out_txs[0].gas[0].amount : null,
          gasAsset: thorStatus.out_txs
            ? this.parseMemoAsset(
                thorStatus.out_txs[0].gas[0].asset,
                this.pools
              )
            : null,
          outboundSigned:
            thorStatus?.stages.outbound_signed?.completed ?? false,
          outboundETA:
            thorStatus?.stages.outbound_signed?.scheduled_outbound_height -
            this.thorHeight,
          done: thorStatus?.stages?.outbound_signed?.completed === true,
        },
      ]

      return {
        cards: {
          title: this.camelCase(memo.type),
          in: ins,
          middle: {
            pending: this.isTxInPending(thorStatus, action),
          },
          out: outs,
        },
        accordions: {
          in: ins,
          action: {
            type: 'Withdraw',
            memo: thorStatus?.tx?.memo,
            height: action?.height,
            timeStamp,
            done: true,
          },
          out: outs,
        },
      }
    },
    createTCYUnstake(thorStatus, actions, thorTx) {
      const TCYUnstake = actions?.actions?.find((a) => a.type === 'tcy_unstake')
      const RefundAction = actions?.actions?.find((a) => a.type === 'refund')

      let memo = TCYUnstake?.metadata?.tcy?.memo
      let reason = ''
      let outs = []
      let ins = []

      let isRefund = false
      if (RefundAction) {
        const m = Object.keys(RefundAction.metadata)[0]
        memo = RefundAction.metadata[m]?.memo ?? undefined
        reason =
          RefundAction.metadata[m]?.reason ??
          RefundAction.metadata[m]?.code ??
          undefined
        isRefund = true
      }

      let action = TCYUnstake
      if (isRefund) {
        action = RefundAction
      }

      if (isRefund === false) {
        outs = [
          {
            asset: TCYUnstake.out[0].coins[0].asset,
            amount: TCYUnstake.out[0].coins[0].amount,
            txid: TCYUnstake.out[0].txID,
            to: TCYUnstake.out[0].address,
            done: true,
          },
        ]

        ins = [
          {
            from: TCYUnstake.out[0].address,
            txid: TCYUnstake.out[0].txID,
            done: true,
          },
        ]
      }

      return {
        cards: {
          title: 'Unstake ' + (isRefund ? '(Refund)' : ''),
          in: [
            {
              icon: require('@/assets/images/vault.svg?inline'),
              text: 'Stake Module',
              class: 'pad-icon',
            },
          ],
          middle: {
            fail: isRefund,
            pending: false,
          },
          out: outs,
        },
        accordions: {
          in: ins,
          action: {
            type: 'Unstake',
            timeStamp: moment.unix(action?.date / 1e9) || null,
            height: action?.height,
            memo,
            reason,
            done: true,
          },
          out: outs,
        },
      }
    },
    createTCYStake(thorStatus, actions, thorTx) {
      const TCYStake = actions?.actions?.find((a) => a.type === 'tcy_stake')
      const RefundAction = actions?.actions?.find((a) => a.type === 'refund')

      let memo = TCYStake?.metadata?.tcy?.memo
      let reason = ''
      let outs = []
      let ins = []

      let isRefund = false
      if (RefundAction) {
        const m = Object.keys(RefundAction.metadata)[0]
        memo = RefundAction.metadata[m]?.memo ?? undefined
        reason =
          RefundAction.metadata[m]?.reason ??
          RefundAction.metadata[m]?.code ??
          undefined
        isRefund = true
      }

      let action = TCYStake
      if (isRefund) {
        action = RefundAction
      }

      if (isRefund === false) {
        ins = [
          {
            asset: TCYStake.in[0].coins[0].asset,
            amount: TCYStake.in[0].coins[0].amount,
            txid: TCYStake.in[0].txID,
            from: TCYStake.in[0].address,
            done: true,
          },
        ]

        outs = [
          {
            to: TCYStake.in[0].address,
            txid: TCYStake.in[0].txID,
            done: true,
          },
        ]
      }

      return {
        cards: {
          title: 'Stake ' + (isRefund ? '(Refund)' : ''),
          in: ins,
          middle: {
            fail: isRefund,
            pending: false,
          },
          out: [
            {
              icon: require('@/assets/images/vault.svg?inline'),
              text: 'Stake Module',
              class: 'pad-icon',
            },
          ],
        },
        accordions: {
          in: ins,
          action: {
            type: 'Stake',
            timeStamp: moment.unix(action?.date / 1e9) || null,
            height: action?.height,
            memo,
            reason,
            done: true,
          },
          out: outs,
        },
      }
    },
    createAbstractState(thorStatus, action, thorTx) {
      let ins = action?.in.map((a) => ({
        asset: this.parseMemoAsset(a.coins[0]?.asset),
        amount: a.coins[0]?.amount,
        txid: a?.txID,
        from: a?.address,
        done: true,
      }))

      const outs = action?.out.map((a) => ({
        asset: this.parseMemoAsset(a.coins[0]?.asset),
        amount: a.coins[0]?.amount,
        txid: a?.txID,
        to: a?.address,
        done: true,
      }))

      let memo
      let reason
      let isRefund = false
      if (action.metadata) {
        const m = Object.keys(action.metadata)[0]
        memo = action.metadata[m]?.memo ?? undefined
        reason =
          action.metadata[m]?.reason ?? action.metadata[m]?.code ?? undefined
        if (Object.keys(action.metadata).length === 1) {
          isRefund = m === 'refund'
        }
      }

      let title = 'Action'
      if (action.type === 'tcy_claim') {
        title = 'Tcy Claim'

        ins = [
          {
            icon: require('@/assets/images/vault.svg?inline'),
            text: 'Claim Module',
            class: 'pad-icon',
            from: action?.in[0].address,
            txid: action?.in[0].txID,
            done: true,
          },
        ]
      }

      return {
        cards: {
          title,
          in: ins,
          middle: {
            fail: isRefund,
            pending: false,
          },
          out: outs,
        },
        accordions: {
          in: ins,
          action: {
            type: 'Action',
            timeStamp: moment.unix(action?.date / 1e9) || null,
            height: action?.height,
            memo,
            reason,
            done: true,
          },
          out: outs,
        },
      }
    },
    async getOtherActionHash(actions, thorStatus) {
      let hash = thorStatus?.tx?.id

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
      const inAsset = nativeTx?.in[0]?.coins[0]?.asset
      const inAmount = nativeTx?.in[0]?.coins[0]?.amount
      const timeStamp = moment(nativeTx.date / 1e6)

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
        out: [
          {
            icon: require('@/assets/images/wallet.svg?inline'),
            address: nativeTx?.out[0]?.address,
          },
        ],
      }

      const isError = nativeTx?.metadata?.send?.code !== '0'

      const accordions = {
        in: [],
        action: {
          type: 'send',
          txid: nativeTx?.in[0]?.txID,
          memo: nativeTx.metadata?.send?.memo || '',
          from: nativeTx?.in[0]?.address,
          to: nativeTx?.out[0]?.address,
          height: nativeTx?.height,
          timeStamp,
          pending: false,
          error: isError,
          reason: isError ? nativeTx?.metadata?.send?.reason : undefined,
          done: true,
          showAtFirst: true,
        },
        out: [],
      }

      this.$set(this, 'cards', [this.createCard(cards, accordions)])
    },
    createAddLiquidityState(thorStatus, actions, thorTx, memo) {
      const isSaver = this.parseMemoAsset(memo.asset)?.synth

      const inAsset = this.parseMemoAsset(
        thorStatus?.tx?.coins[0].asset,
        this.pools
      )
      const inAmount = parseInt(thorStatus?.tx?.coins[0].amount)
      const addAction = actions?.actions?.find(
        (a) => a.type === 'addLiquidity' && a.in[0].address !== ''
      )
      const timeStamp = moment.unix(addAction?.date / 1e9)

      const isRefund = actions?.actions?.find((a) => a.type === 'refund')

      const outboundDelayRemaining =
        (thorStatus?.stages.outbound_delay?.remaining_delay_seconds ?? 0) ||
        (thorStatus?.stages.outbound_delay?.remaining_delay_blocks ?? 0) *
          this.blockSeconds('THOR')

      const pending =
        thorStatus?.stages.swap_status?.pending ||
        !thorStatus?.stages.inbound_observed?.completed ||
        !(thorStatus?.stages.inbound_confirmation_counted?.completed ?? true) ||
        !thorStatus?.stages.inbound_finalised?.completed

      const memoText = thorStatus?.tx?.memo || isRefund?.metadata.refund.memo

      return {
        cards: {
          title: 'add Liquidity' + (isRefund ? ' (Refunded)' : ''),
          in: [
            {
              asset: inAsset,
              amount: inAmount,
            },
          ],
          middle: {
            pending,
            fail: isRefund,
          },
          out: [
            {
              text: isSaver ? 'THORChain Vault' : 'THORChain Pool',
              icon: require('@/assets/images/safe.svg?inline'),
              borderColor: 'var(--primary-color)',
            },
          ],
        },
        accordions: {
          in: [
            {
              txid: thorStatus?.tx?.id,
              from: thorStatus?.tx?.from_address,
              asset: inAsset,
              amount: inAmount,
              done: true,
            },
          ],
          action: {
            type: isRefund ? 'Refund' : 'Add',
            timeStamp: timeStamp || null,
            liquidityUnits:
              parseInt(addAction?.metadata?.addLiquidity?.liquidityUnits) ||
              null,
            affiliateName: memo.affiliate,
            affiliateFee: parseInt(memo.fee),
            outboundDelayRemaining: outboundDelayRemaining || 0,
            outboundETA:
              thorStatus?.stages.outbound_signed?.scheduled_outbound_height -
              this.thorHeight,
            outboundSigned:
              thorStatus?.stages.outbound_signed?.completed ?? false,
            refundReason: isRefund
              ? isRefund?.metadata?.refund?.reason
              : undefined,
            memo: memoText,
            done: !thorStatus?.stages.swap_status?.pending,
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
        thorStatus?.tx.coins[0].asset,
        this.pools
      )
      const inAmount = parseInt(thorStatus?.tx.coins[0].amount)
      const withdrawAction = actions?.actions?.find(
        (a) => a.type === 'withdraw'
      )

      const refundAction = actions?.actions?.find((a) => a.type === 'refund')

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
      const timeStamp = moment.unix(
        (withdrawAction || refundAction)?.date / 1e9
      )

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

      let outAsset
      let outAmount
      const isOut = outTxs && outTxs[0]
      if (isOut) {
        outAsset = this.parseMemoAsset(outTxs[0].coins[0].asset, this.pools)
        outAmount = outTxs?.length > 0 ? parseInt(outTxs[0].coins[0].amount) : 0
      }

      const outs = []
      if (outAsset) {
        outs.push({
          asset: outAsset,
          amount: outAmount,
        })
      }

      const moreOuts = outTxs?.slice(1)
      if (moreOuts && moreOuts.length > 0) {
        outs.push(
          ...moreOuts.map((o) => ({
            asset: this.parseMemoAsset(o.coins[0].asset, this.pools),
            amount: parseInt(o.coins[0].amount),
          }))
        )
      }

      const outboundDelayRemaining =
        (thorStatus?.stages.outbound_delay?.remaining_delay_seconds ?? 0) ||
        (thorStatus?.stages.outbound_delay?.remaining_delay_blocks ?? 0) *
          this.blockSeconds('THOR')

      const outboundETA =
        this.thorHeight <
        thorStatus?.stages.outbound_signed?.scheduled_outbound_height
          ? thorStatus?.stages.outbound_signed?.scheduled_outbound_height -
            this.thorHeight
          : 0

      const outActions = []
      if (isOut) {
        outActions.push({
          fees: outboundFees,
          feeAssets: outboundFeeAssets,
          outboundDelayRemaining: outboundDelayRemaining || 0,
          outboundETA,
          outboundSigned:
            thorStatus?.stages.outbound_signed?.completed ?? false,
          done:
            thorStatus?.stages.outbound_signed?.completed ||
            outAsset?.chain === 'THOR',
        })

        if (moreOuts && moreOuts.length > 0) {
          outActions.push(
            ...moreOuts.map((o) => ({
              txid: o.id,
              to: o.to_address,
              asset: this.parseMemoAsset(o.coins[0].asset, this.pools),
              amount: parseInt(o.coins[0].amount),
              gas: o.gas ? o.gas[0].amount : null,
              gasAsset: o.gas
                ? this.parseMemoAsset(o.gas[0].asset, this.pools)
                : null,
              outboundSigned:
                thorStatus?.stages.outbound_signed?.completed ?? false,
              done:
                thorStatus?.stages.outbound_signed?.completed ||
                outAsset?.chain === 'THOR',
            }))
          )
        }
      }

      let refundReason
      if (refundAction) {
        refundReason = refundAction.metadata.refund?.reason
      }

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
            fail: refundAction,
          },
          out: outs,
        },
        accordions: {
          in: [
            {
              txid: thorStatus?.tx.id,
              from: thorStatus?.tx.from_address,
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
            refundReason,
            done: !hasOngoing,
          },
          out: outActions,
        },
      }
    },
    createRunePoolDeposit(thorStatus, actions, thorTx, memo) {
      const action = actions.actions.find((a) => a.type === 'runePoolDeposit')

      const ins = action?.in.map((a) => ({
        asset: this.parseMemoAsset(a.coins[0]?.asset),
        amount: a.coins[0]?.amount,
        txid: a?.txID,
        from: a?.address,
        done: true,
      }))

      const outs = action?.out.map((a) => ({
        asset: this.parseMemoAsset(a.coins[0]?.asset),
        amount: a.coins[0]?.amount,
        txid: a?.txID,
        to: a?.address,
        done: true,
      }))

      return {
        cards: {
          title: 'RUNEPool Deposit',
          in: ins,
          middle: {
            pending: false,
          },
          out: [
            {
              text: 'THORChain Vault',
              icon: require('@/assets/images/safe.svg?inline'),
              borderColor: 'var(--primary-color)',
            },
          ],
        },
        accordions: {
          in: ins,
          action: {
            type: 'RUNEPool Deposit',
            timeStamp: moment.unix(action?.date / 1e9) || null,
            height: action?.height,
            units: parseInt(action?.metadata?.runePoolDeposit?.units) || null,
            done: true,
          },
          out: outs,
        },
      }
    },
    createRunePoolWithdraw(thorStatus, actions, thorTx, memo) {
      const action = actions.actions.find((a) => a.type === 'runePoolWithdraw')

      const ins = action?.in.map((a) => ({
        asset: this.parseMemoAsset(a.coins[0]?.asset),
        amount: a.coins[0]?.amount,
        txid: a?.txID,
        from: a?.address,
        done: true,
      }))

      const outs = action?.out.map((a) => ({
        asset: this.parseMemoAsset(a.coins[0]?.asset),
        amount: a.coins[0]?.amount,
        txid: a?.txID,
        to: a?.address,
        done: true,
      }))

      return {
        cards: {
          title: 'RUNEPool Withdraw',
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
            timeStamp: moment.unix(action?.date / 1e9) || null,
            height: action?.height,
            units: parseInt(action?.metadata?.runePoolWithdraw?.units) || null,
            done: true,
          },
          out: outs,
        },
      }
    },
    createSwapState(thorStatus, thorTx, actions, memo, thorHeader, quote) {
      // swap user addresses
      const userAddresses = new Set([
        thorStatus?.tx.from_address.toLowerCase(),
        memo.destAddr?.toLowerCase(), // TODO: sometimes the memo destAddr will be THORName
      ])
      // Non affiliate outs
      let outTxs = thorStatus.out_txs?.filter(
        (tx) =>
          userAddresses.has(tx.to_address.toLowerCase()) ||
          (tx.coins[0].asset ===
            assetToString(this.parseMemoAsset(memo.asset)) &&
            tx.id !==
              '0000000000000000000000000000000000000000000000000000000000000000' &&
            tx.id !== '')
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
      if (
        !outTxs ||
        outTxs?.length === 0 ||
        outTxs.every((o) => o.to_address === thorStatus?.tx.from_address) // Add scheduled outbound while having a refund
      ) {
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
        (o) => o.coins[0].asset === thorStatus?.tx.coins[0].asset
      )

      // Add native in/out search
      const inAsset = this.parseMemoAsset(
        thorStatus?.tx.coins[0].asset,
        this.pools
      )
      const inAmount = parseInt(thorStatus?.tx.coins[0].amount)

      const outAsset = this.parseMemoAsset(
        outTxs?.length > 0 ? outTxs[0].coins[0].asset : memo.asset,
        this.pools
      )
      let outAmount =
        outTxs?.length > 0 ? parseInt(outTxs[0].coins[0].amount) : 0
      if (
        !outAmount &&
        actions?.actions?.length > 0 &&
        (outAsset.trade || outAsset.secure)
      ) {
        outAmount = parseInt(
          Object.values(
            groupBy(
              actions?.actions
                ?.find((a) => a.type === 'swap')
                ?.out?.filter(
                  (a) => a.coins[0].asset === assetToString(outAsset)
                ),
              'txID'
            )
          ).map((group) => sumBy(group, (item) => +item.coins[0].amount))[0]
        )
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
      const height = swapAction?.height
      this.height = height

      // Refunds
      const outboundHasRefund = outTxs?.some(
        (tx) => tx.refund || tx.memo?.toLowerCase().startsWith('refund')
      )
      // sometimes the outbound doesn't come out if the outbound is in native chain
      const outboundHasSuccess = outTxs?.some((tx) =>
        tx.memo?.toLowerCase().startsWith('out')
      )

      const inAmountUSD =
        (+swapAction?.metadata.swap.inPriceUSD * inAmount) / 1e8
      let outAmountUSD =
        (+swapAction?.metadata.swap.outPriceUSD *
          (outAmount || +this.quote?.expected_amount_out)) /
        1e8
      if (!outboundHasSuccess && outboundHasRefund) {
        outAmountUSD = (+swapAction?.metadata.swap.inPriceUSD * outAmount) / 1e8
      }

      const outboundRefundReason = actions?.actions.find(
        (action) => action.type === 'refund'
      )?.metadata.refund.reason

      // only refund happened
      const onlyRefund =
        actions?.actions.length > 0 &&
        actions?.actions.every((action) => action?.type === 'refund')

      const refundAction = actions?.actions?.find((a) => a.type === 'refund')
      if (onlyRefund) {
        timeStamp = refundAction?.date
      }

      // TODO: add nice check with animation (transition from pending to complete)
      // TODO: add failed swaps from midgard
      // TODO: Add refunded swap info
      // TODO: fix the loading check/spinner on complete
      // TODO: fix streaming card when finished
      // TODO: sometimes the pools price is fetched after the status

      const outboundDelayRemaining =
        (thorStatus?.stages.outbound_delay?.remaining_delay_seconds ?? 0) ||
        (thorStatus?.stages.outbound_delay?.remaining_delay_blocks ?? 0) *
          this.blockSeconds('THOR')

      if (timeStamp) {
        timeStamp = moment.unix(timeStamp / 1e9)
      }

      const rates = []
      if (inAmount && outAmount) {
        rates.push(
          `1 ${this.showTicker(inAsset)} = ${outAmount / inAmount} ${this.showTicker(outAsset)}`
        )
        rates.push(
          `1 ${this.showTicker(outAsset)} = ${inAmount / outAmount} ${this.showTicker(inAsset)}`
        )
      }

      return {
        cards: {
          title: onlyRefund ? 'refunded Swap' : 'swap',
          in: [
            {
              asset: inAsset,
              amount: inAmount,
              amountUSD: inAmountUSD,
            },
          ],
          middle: {
            pending: this.isTxInPending(thorStatus, actions),
            fail: onlyRefund,
          },
          out: [
            {
              asset: outAsset,
              amount: outAmount || +this.quote?.expected_amount_out,
              amountUSD: outAmountUSD,
              filter: outAmount
                ? undefined
                : (v) => `~ ${this.baseAmountFormatOrZero(v)}`,
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
              txid: thorStatus?.tx.id,
              from: thorStatus?.tx.from_address,
              asset: inAsset,
              amount: inAmount,
              gas: thorStatus?.tx.gas ? thorStatus?.tx.gas[0].amount : null,
              gasAsset: thorStatus?.tx.gas
                ? this.parseMemoAsset(thorStatus?.tx.gas[0].asset, this.pools)
                : null,
              preObservations:
                thorStatus?.stages?.inbound_observed?.pre_confirmation_count,
              observations: thorStatus?.stages?.inbound_observed?.final_count,
              observationsCompleted:
                thorStatus?.stages?.inbound_observed?.completed,
              finalisedHeight: thorTx.finalised_height,
              inboundObserved:
                thorStatus?.stages?.inbound_observed?.completed || false,
              inboundConfCount:
                thorStatus?.stages?.inbound_confirmation_counted || 0,
              preConfirmationCount:
                thorStatus?.stages?.inbound_observed?.pre_confirmation_count ||
                0,
              confirmationRemainingSeconds:
                thorStatus?.stages?.inbound_confirmation_counted
                  ?.remaining_confirmation_seconds || 0,
              done: thorStatus?.stages?.inbound_finalised?.completed,
            },
          ],
          action: {
            type: onlyRefund ? 'refunded Swap' : 'swap',
            timeStamp: timeStamp || null,
            limit: memo.limit,
            limitAsset: outMemoAsset,
            affiliateName: memo.affiliate,
            affiliateFee: memo.fee || 0,
            liquidityFee:
              parseInt(actions?.actions[0]?.metadata?.swap?.liquidityFee) ||
              null,
            liquidityUnits: null,
            refundReason: onlyRefund ? outboundRefundReason : null,
            asymmetry: null,
            affiliateOut: affiliateOut || undefined,
            swapSlip: parseInt(actions?.actions[0]?.metadata?.swap?.swapSlip),
            height,
            rate: rates,
            streaming: {
              count: thorStatus?.stages.swap_status?.streaming?.count,
              interval:
                thorStatus?.stages.swap_status?.streaming?.interval ||
                memo.interval,
              quantity:
                thorStatus?.stages.swap_status?.streaming?.quantity ||
                memo.quantity,
              lastHeight: null, // Add on midgard if available
            },
            done:
              thorStatus?.stages?.inbound_finalised?.completed &&
              (thorStatus?.stages.swap_finalised?.completed ||
                !thorStatus?.stages.swap_status?.pending),
            error: onlyRefund,
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
              height: outTxs?.length > 0 ? outTxs[0].height : null,
              fees: outboundFees,
              feeAssets: outboundFeeAssets,
              delayBlocksRemaining:
                thorStatus?.stages.outbound_delay?.remaining_delay_blocks || 0,
              outboundDelayRemaining: outboundDelayRemaining || 0,
              outboundETA:
                thorStatus?.stages.outbound_signed?.scheduled_outbound_height -
                this.thorHeight,
              outboundSigned:
                thorStatus?.stages.outbound_signed?.completed ?? undefined,
              done:
                !thorStatus?.stages.swap_status?.pending &&
                (thorStatus?.stages.outbound_signed?.completed ||
                  outAsset.chain === 'THOR' ||
                  outAsset.synth ||
                  outAsset.trade ||
                  outAsset.secure) &&
                (thorStatus?.stages.outbound_delay?.completed ?? true),
            },
            ...outTxs?.slice(1).map((o) => ({
              txid: o.id,
              to: o.to_address,
              asset: this.parseMemoAsset(o.coins[0].asset, this.pools),
              amount: parseInt(o.coins[0].amount),
              gas: o.gas ? o.gas[0].amount : null,
              height: o.height,
              gasAsset: o.gas
                ? this.parseMemoAsset(o.gas[0].asset, this.pools)
                : null,
              done:
                !thorStatus?.stages.swap_status?.pending &&
                (thorStatus?.stages.outbound_signed?.completed ||
                  outAsset.chain === 'THOR' ||
                  outAsset.synth ||
                  outAsset.trade ||
                  outAsset.secure),
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
.tx-header {
  display: flex;
  max-width: 680px;
  gap: 8px;
  align-items: center;
  justify-content: center;
  margin: $space-0 $space-10;

  @include lg {
    margin: auto;
    width: 100%;
  }

  @include md {
    justify-content: flex-start;
  }

  .item {
    border: 1px solid var(--border-color);
    background-color: var(--card-bg-color);
    padding: $space-8;
    border-radius: $radius-s;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: $space-0;
    flex-grow: 1;
    max-width: 100%;
    min-width: 32px;

    &:not(.tx-id) {
      height: 32px;
      width: 32px;
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

.qr-icon {
  fill: var(--font-color);
  width: 16px;
  height: 16px;
}

.tx-wrapper {
  position: relative;

  .arrow {
    display: none;
    flex: 1;
    justify-content: center;
    align-items: center;

    .icon {
      margin-right: $space-0;
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
  border-radius: $radius-s;
  padding: $space-20;
  gap: $space-10;
}

.tx-contain {
  display: flex;
  flex-direction: column;
  gap: $space-10;

  .asset-icon-container {
    margin-top: $space-10;
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
    margin-top: $space-10;
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

.icon {
  fill: var(--sec-font-color);
  height: 1.5rem;

  &.small {
    margin-right: $space-0;
    height: 0.8rem;
    width: 0.8rem;
  }
}

.extra-details {
  margin-top: $space-16;

  .pool-box {
    margin: $space-5 $space-0;
    display: flex;
    align-items: center;
  }
}

.utility,
.tx-date {
  padding: $space-0 $space-16;
}

.utility {
  justify-content: space-between;
  gap: $space-16;
}

.asset-text {
  font-size: $font-size-md;
}

.tx-id {
  flex-shrink: 5;
  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
