<template>
  <Page>
    <template
      v-if="
        failedOverview ||
        sendOverview ||
        bondOverview ||
        mimirOverview ||
        refundOverview ||
        multiOutboundOverview ||
        streamingOverview ||
        swapOverview ||
        contractOverview
      "
    >
      <FailedHero v-if="failedOverview" :overview="failedOverview" />
      <SendHero v-else-if="sendOverview" :overview="sendOverview" />
      <BondHero
        v-else-if="bondOverview"
        :overview="bondOverview"
        :node-snapshot="nodeSnapshot"
        :network-info="networkInfo"
        :current-height="chainsHeight && chainsHeight.THOR"
      />
      <MimirVoteHero
        v-else-if="mimirOverview"
        :overview="mimirOverview"
        :node-snapshot="nodeSnapshot"
        :consensus="mimirConsensus"
      />
      <RefundHero v-else-if="refundOverview" :overview="refundOverview" />
      <MultiOutboundHero
        v-else-if="multiOutboundOverview"
        :overview="multiOutboundOverview"
      />
      <StreamingSwapHero
        v-else-if="streamingOverview"
        :overview="streamingOverview"
      />
      <SwapHero
        v-else-if="swapOverview || contractOverview"
        :overview="activeOverview"
      />
    </template>
    <TxHeroSkeleton v-else-if="isLoading && !isError" />
    <div v-else class="tx-header">
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
    <template v-if="!isError && !isLoading && pools && !hasNewHeroUi">
      <template v-if="cards && cards.length > 0">
        <tx-card v-for="(c, i) in visibleCards" :key="i" :tx-data="c.details">
          <template
            v-for="(s, j) in c.accordions.filter(
              (c) => c.data.title && !c.data.hide
            )"
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
              :events="s.data.events"
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
  </Page>
</template>

<script>
import moment from 'moment'
import { groupBy, sumBy } from 'lodash'
import { mapGetters } from 'vuex'
import streamingSwap from './components/streamingSwap.vue'
import txCard from './components/txCard.vue'
import { createCard as buildCard } from './state/cardBuilder.js'
import {
  BUILDERS as BUILDERS_MODULE,
  createFailedState as createFailedStateBuilder,
} from './state/builders.js'
import {
  resolveOutboundSignal,
  resolveOutboundLegState,
  resolveOutboundLegStatus,
  resolveTxOutboundTotals,
} from './state/outboundStatus.js'
import { resolveOutboundTxs } from './state/outboundTxs.js'
import { resolveTxMemo } from './state/resolveTxMemo.js'
import { parseActionReason } from './state/parseActionReason.js'
import { computeMimirConsensus } from './state/mimirConsensus.js'
import {
  PRE_GUARD_BUILDERS as CONTRACT_PRE_GUARD_BUILDERS,
  SINGLE_ACTION_BUILDERS as CONTRACT_SINGLE_ACTION_BUILDERS,
  buildCalcAggregateOverview,
} from './state/contract/index.js'
import FailedHero from './components/hero/FailedHero.vue'
import SendHero from './components/hero/SendHero.vue'
import BondHero from './components/hero/BondHero.vue'
import MimirVoteHero from './components/hero/MimirVoteHero.vue'
import RefundHero from './components/hero/RefundHero.vue'
import MultiOutboundHero from './components/hero/MultiOutboundHero.vue'
import StreamingSwapHero from './components/hero/StreamingSwapHero.vue'
import SwapHero from './components/hero/SwapHero.vue'
import TxHeroSkeleton from './components/TxHeroSkeleton.vue'
import DisconnectIcon from '~/assets/images/disconnect.svg?inline'
import {
  blockTime,
  assetFromString,
  assetToTrade,
  assetToSecure,
  tradeToAsset,
  assetToString,
  securedToAsset,
  sumAffiliateFee,
  isInternalTx,
} from '~/utils'
import Accordion from '~/components/Accordion.vue'
import {
  getRujiraContractLabel,
  getRujiraContractProduct,
} from '~/utils/rujiraContracts'

export default {
  components: {
    DisconnectIcon,
    streamingSwap,
    txCard,
    Accordion,
    FailedHero,
    SendHero,
    BondHero,
    MimirVoteHero,
    RefundHero,
    MultiOutboundHero,
    StreamingSwapHero,
    SwapHero,
    TxHeroSkeleton,
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
      rawActions: null,
      // Raw Midgard 'send' action for a native RUNE send — set by
      // createNativeTx. sendOverview reads this directly instead of
      // this.cards (Phase 2 of the tx-detail-UI raw-data migration): a
      // native send never goes through the swap/contract card pipeline, so
      // this is its own dedicated raw-data source rather than a slot in the
      // shared `cards` array.
      nativeSendAction: null,
      // Set by createTxState — the parsed memo and raw THORNode tx/details
      // response, both needed by refundOverview's raw-data derivation.
      txMemo: null,
      // Provenance of txMemo — see resolveTxMemo.js's precedence chain.
      // 'synthesized' means only .type is populated (no other memo field),
      // so a hero reading anything beyond .type from txMemo should treat
      // it as absent rather than render a blank.
      txMemoSource: null,
      thorTx: null,
      inboundHash: undefined,
      thorStatus: undefined,
      thorHeight: 0,
      quote: undefined,
      height: undefined,
      nodeSnapshot: null,
      nodeSnapshotAddress: null,
      networkInfo: null,
      mimirConsensus: null,
      mimirConsensusKey: null,
      streamingProgress: null,
      streamingProgressHash: null,
      streamingProgressFetchedAt: 0,
    }
  },
  head() {
    const hash = this.$route.params.txhash || ''
    const suffix = hash.slice(-4).toUpperCase()
    return {
      title: `THORChain Network Explorer | TX …${suffix}`,
    }
  },
  computed: {
    ...mapGetters({
      chainsHeight: 'getChainsHeight',
      pools: 'getPools',
      runePrice: 'getRunePrice',
    }),
    activeOverview() {
      const co = this.contractOverview
      if (co?.priority) return co
      return this.swapOverview || co || null
    },
    // The legacy tx-card/Accordion list (template line ~538) is a sibling
    // of the hero-selection v-if/else-if/else chain above it, not part of
    // it — so without this guard it renders unconditionally underneath
    // whichever hero matched. True whenever any hero owns the page.
    hasNewHeroUi() {
      return !!(
        this.failedOverview ||
        this.sendOverview ||
        this.bondOverview ||
        this.mimirOverview ||
        this.refundOverview ||
        this.multiOutboundOverview ||
        this.streamingOverview ||
        this.swapOverview ||
        this.contractOverview
      )
    },
    // The template only ever reads visibleCards inside `v-if="!hasNewHeroUi"`
    // (Phase 3 of the tx-detail-UI raw-data migration — all 8 hero
    // overviews, including swapOverview/contractOverview, now read raw data
    // directly rather than this.cards) — so by the time this getter is
    // actually evaluated for rendering, every overview is already known to
    // be null. The old swapOverview-card/contractOverview-card filtering
    // that used to live here was consequently dead: those branches could
    // never be reached without hasNewHeroUi already being true, which hides
    // this getter's result from the template entirely.
    visibleCards() {
      return this.cards || []
    },
    // Any message THORChain accepted on-chain but rejected during execution
    // (Midgard `type: 'failed'`, `metadata.failed`) — a distinct outcome
    // from refundOverview's case, which always has an outbound leg
    // returning funds. A failed message has none: out is always empty, and
    // nothing was scheduled. Reads this.rawActions directly (Midgard, not
    // THORNode) so it's unaffected by THORNode having nothing for the tx —
    // confirmed against a real failed bond attempt,
    // 2F8EA9D66B0B1AA3D1507FC20668C12260EA1161192A958AA7221FF2FF3B2AA3,
    // whose THORNode /tx/ returns "doesn't exist". This is also why the
    // template checks failedOverview before every other memo-type-driven
    // hero (sendOverview/bondOverview/etc.) — createTxState's own routing
    // has the matching guard (see the `failedAction` check ahead of the
    // BUILDERS lookup) so a failed bond attempt's memo, which does parse to
    // `type: 'bond'` once recovered from metadata.failed.memo via
    // resolveTxMemo, can never satisfy bondOverview's gate and render as a
    // completed bond.
    failedOverview() {
      const failedAction = this.rawActions?.find((a) => a.type === 'failed')
      if (!failedAction) return null

      const attemptedMemo = this.parseMemo(failedAction.metadata?.failed?.memo)
      const inCoin = failedAction.in?.[0]?.coins?.[0]
      const inAsset = inCoin?.asset ? this.parseMemoAsset(inCoin.asset) : null
      const inAmount = inCoin?.amount ?? 0

      const timeStamp = failedAction.date
        ? moment.unix(failedAction.date / 1e9)
        : null
      const time = this.splitTrailingParen(
        timeStamp ? `${timeStamp.format('L LT')} (${timeStamp.fromNow()})` : ''
      )
      const height =
        Number(failedAction.height) > 0 ? Number(failedAction.height) : null
      const heightDisplay = height ? `#${this.normalFormat(height)}` : '-'

      const reasonRaw = failedAction.metadata?.failed?.reason || ''
      const parsedReason = reasonRaw
        ? parseActionReason(reasonRaw, {
            formatAmount: (raw) =>
              this.formatAssetAmount(
                raw,
                inAsset || { chain: 'THOR', ticker: 'RUNE', symbol: 'RUNE' }
              ),
            heightDisplay,
          })
        : null

      const ATTEMPTED_TYPE_LABEL = {
        bond: 'Bond',
        unbond: 'Unbond',
        swap: 'Swap',
        add: 'Add liquidity',
        withdraw: 'Withdraw',
        thorname: 'THORName',
        donate: 'Donate',
      }

      return {
        kind: 'failed',
        status: this.getOverviewStatus({ fail: true }),
        hash: this.$route.params.txhash,
        attemptedType: attemptedMemo.type || null,
        attemptedLabel: ATTEMPTED_TYPE_LABEL[attemptedMemo.type] || null,
        memo: failedAction.metadata?.failed?.memo || '',
        inboundHash: failedAction.in?.[0]?.txID || '',
        from: failedAction.in?.[0]?.address || '',
        asset: inAsset,
        amountDisplay: inAsset
          ? this.formatAssetAmount(inAmount, inAsset)
          : null,
        amountUsdDisplay: inAsset
          ? this.formatUsdValue(
              this.amountToUSD(inAsset, inAmount, this.pools) || 0
            )
          : null,
        amountRaw: Number(inAmount) || 0,
        reasonTitle: parsedReason?.title || null,
        reason:
          parsedReason?.body || reasonRaw || 'No reason provided by THORChain.',
        reasonRaw,
        code: failedAction.metadata?.failed?.code || null,
        timeDisplay: time.main,
        timeAgoDisplay: time.paren,
        height,
        heightDisplay,
        // Only meaningful for a failed bond/unbond attempt — the most
        // common failed-message case in practice — so FailedHero can show
        // them without re-parsing the memo itself.
        nodeAddress: attemptedMemo.nodeAddress || null,
        providerAddress: attemptedMemo.provider || null,
      }
    },
    // Native RUNE sends never reach the swap/contract card pipeline — they
    // short-circuit through createNativeTx (see fetchTx), which sets
    // this.nativeSendAction to the raw Midgard 'send' action. Reads that
    // directly (Phase 2 of the tx-detail-UI raw-data migration) instead of
    // going through this.cards/accordion stacks the way this builder used
    // to — the stack layer was just re-formatting the same raw fields
    // (createNativeTx's own accordions.action was itself built from these
    // exact fields), so this is a data-source swap, not a behavior change.
    // Independent of swapOverview so it renders through its own hero
    // regardless of swap/contract state.
    sendOverview() {
      const nt = this.nativeSendAction
      if (!nt) return null
      const inCoin = nt.in?.[0]?.coins?.[0]
      if (!inCoin?.asset) return null

      const failed = nt.metadata?.send?.code !== '0'
      const gasAsset = 'THOR.RUNE'
      const gasRaw = nt.metadata?.send?.networkFees?.[0]?.amount
      const gasDisplay = gasRaw
        ? `${gasRaw / 1e9} ${this.showAsset(gasAsset)}` +
          (this.pools
            ? ` (${this.formatCurrency(this.amountToUSD(gasAsset, gasRaw, this.pools))})`
            : '')
        : ''
      const timeStamp = moment(nt.date / 1e6)
      const time = this.splitTrailingParen(
        timeStamp.isValid()
          ? `${timeStamp.format('L LT')} (${timeStamp.fromNow()})`
          : ''
      )
      const height = Number(nt.height) > 0 ? Number(nt.height) : null
      const heightDisplay = height ? `#${this.normalFormat(height)}` : '-'
      const failureCode = failed ? `${nt.metadata?.send?.code ?? ''}` : null
      const failureReason = failed ? `${nt.metadata?.send?.reason ?? ''}` : null
      const parsedFailure = failed
        ? parseActionReason(failureReason, {
            formatAmount: (raw) => this.formatAssetAmount(raw, inCoin.asset),
            heightDisplay,
          })
        : null

      return {
        kind: 'send',
        status: this.getOverviewStatus({ fail: failed }),
        failed,
        failure: failed
          ? {
              title: parsedFailure?.title || 'Transaction failed',
              body:
                parsedFailure?.body ||
                'The transaction was included in a block and rejected during execution — the transfer never happened, and the gas below was still charged.',
              code: failureCode,
              codeLine: parsedFailure
                ? `code ${failureCode}`
                : `code ${failureCode}${failureReason ? ` · ${failureReason}` : ''}`,
            }
          : null,
        failureReasonRaw: failureReason,
        hash: nt.in?.[0]?.txID || this.$route.params.txhash,
        from: nt.in?.[0]?.address || '',
        to: nt.out?.[0]?.address || '',
        asset: inCoin.asset,
        assetRaw: inCoin.asset,
        amountRaw: Number(inCoin.amount) || 0,
        amountDisplay: this.formatAssetAmount(inCoin.amount, inCoin.asset),
        zeroAmountDisplay: this.formatAssetAmount(0, inCoin.asset),
        amountUsdDisplay: this.formatUsdValue(
          this.amountToUSD(inCoin.asset, inCoin.amount, this.pools)
        ),
        amountUsdAtExecution: false,
        runePriceDisplay: this.formatUsdValue(this.runePrice),
        gasDisplay,
        gasRuneOnly: this.splitTrailingParen(gasDisplay).main || gasDisplay,
        gasUsd: this.splitFeeValue(gasDisplay).usd,
        confirmedIn: `${this.blockSeconds('THOR')} seconds`,
        timeDisplay: time.main,
        timeAgoDisplay: time.paren,
        height,
        heightDisplay,
        memo: nt.metadata?.send?.memo || '',
      }
    },
    // Bonds/whitelist-bonds always come through createBondState (memo.type
    // === 'bond' — a plain unbond is a separate memo type/builder,
    // createUnbondState, which this overview deliberately doesn't cover,
    // matching the original card-title regex's `^Bond\b` — it never
    // matched "Unbond" either). The node's current status/total-bond/
    // provider-count/next-churn aren't in that builder's output (the tx
    // only carries the delta), so BondHero gets them from a small live
    // fetch — see the bondOverview watcher below. Reads raw
    // rawActions/txMemo directly instead of this.cards/accordion stacks
    // (Phase 2 of the tx-detail-UI raw-data migration) — createBondState
    // unconditionally uses rawActions[0] (no type filter), so this mirrors
    // that exactly rather than searching for a 'bond'-typed action.
    bondOverview() {
      if (this.txMemo?.type !== 'bond') return null
      const action = this.rawActions?.[0]
      if (!action) return null

      const inCoin = action.in?.[0]?.coins?.[0]
      const inAsset = inCoin?.asset ? this.parseMemoAsset(inCoin.asset) : null
      if (!inAsset) return null
      const inAmount = inCoin?.amount ?? 0

      const nodeAddress = action.metadata?.bond?.nodeAddress || ''
      const providerAddress =
        action.metadata?.bond?.provider || action.in?.[0]?.address || ''
      const timeStamp = action.date ? moment.unix(action.date / 1e9) : null
      const time = this.splitTrailingParen(
        timeStamp ? `${timeStamp.format('L LT')} (${timeStamp.fromNow()})` : ''
      )
      const height = Number(action.height) > 0 ? Number(action.height) : null

      return {
        kind: 'bond',
        status: this.getOverviewStatus({}),
        hash: this.$route.params.txhash,
        nodeAddress,
        providerAddress,
        isWhitelist: !!action.metadata?.bond?.provider,
        asset: inAsset,
        amountDisplay: this.formatAssetAmount(inAmount, inAsset),
        amountUsdDisplay: this.formatUsdValue(
          this.amountToUSD(inAsset, inAmount, this.pools) || 0
        ),
        amountUsdAtExecution: false,
        amountRaw: Number(inAmount) || 0,
        timeDisplay: time.main,
        timeAgoDisplay: time.paren,
        heightDisplay: height ? `#${this.normalFormat(height)}` : '-',
        memo: action.metadata?.bond?.memo || '',
      }
    },
    // Two distinct builders produce a "standalone refund" card, and this
    // covers both, now reading raw thorStatus/rawActions data instead of
    // going through this.cards/accordion stacks (Phase 2 of the
    // tx-detail-UI raw-data migration): (1) createSwapState's onlyRefund
    // case — THORChain accepted the swap attempt and the whole thing came
    // back (slip tolerance, invalid destination, no route) — identified by
    // this.txMemo.type === 'swap' with every rawActions entry being a
    // refund; and (2) createAbstractState's generic per-Midgard-action
    // card for a Midgard `type: 'refund'` action with no matching
    // swap/failed builder (confirmed against a real empty-memo deposit,
    // 734A958BAAF44300E246BAD9FA9AF0FD8FD122B938F4ADD8367211324FF37312 —
    // THORChain couldn't tell what the memo meant at all, so it refunded
    // the deposit). Both cases can produce a rawActions list that's
    // entirely `type: 'refund'` entries, so that alone can't tell them
    // apart — the original memo type is the actual discriminator, which is
    // why this.txMemo is captured in createTxState. The two cases also
    // read the refund reason from different raw fields (case 1 only ever
    // has `.reason`; case 2 falls back to `.code` too) — mirrors
    // createSwapState's 'Refund Reason' vs. createAbstractState's plain
    // 'Reason' stack, two different field names for the same concept in
    // the legacy builders. Not gated on the reason text itself being
    // present — THORNode sometimes returns an empty refund reason, and
    // that's still this screen, just with a "not provided" fallback below.
    refundOverview() {
      const refundAction = this.rawActions?.find((a) => a.type === 'refund')
      if (!refundAction) return null

      const isSwapOriginated =
        this.txMemo?.type === 'swap' &&
        this.rawActions.every((a) => a.type === 'refund')

      if (isSwapOriginated) {
        const inAsset = this.parseMemoAsset(
          this.thorStatus?.tx?.coins?.[0]?.asset,
          this.pools
        )
        if (!inAsset) return null
        const inAmount = parseInt(this.thorStatus?.tx?.coins?.[0]?.amount ?? 0)

        // A trade/secure-asset refund settles as an internal THORChain
        // ledger update, not an observed cross-chain outbound — outTxs
        // stays empty, so the refunded asset/amount fall back to the same
        // asset+amount that was sent in (a refund always returns the
        // original asset).
        const { outTxs } = resolveOutboundTxs(
          this.thorStatus,
          this.thorTx,
          { actions: this.rawActions },
          this.txMemo,
          {
            parseMemoAsset: this.parseMemoAsset.bind(this),
            assetToString,
            pools: this.pools,
          }
        )
        let outAsset = inAsset
        let outAmount = inAmount
        if (outTxs?.length) {
          const oAsset = this.parseMemoAsset(
            outTxs[0]?.coins?.[0]?.asset,
            this.pools
          )
          if (oAsset) {
            outAsset = oAsset
            outAmount = parseInt(outTxs[0]?.coins?.[0]?.amount ?? 0)
          }
        }

        const timeStamp = refundAction.date
          ? moment.unix(refundAction.date / 1e9)
          : null
        const time = this.splitTrailingParen(
          timeStamp
            ? `${timeStamp.format('L LT')} (${timeStamp.fromNow()})`
            : ''
        )
        const height =
          Number(refundAction.height) > 0 ? Number(refundAction.height) : null
        const reasonRaw = refundAction.metadata?.refund?.reason || ''
        const parsedReason = reasonRaw ? parseActionReason(reasonRaw) : null
        const outboundHash =
          outTxs?.length && !isInternalTx(outTxs[0]?.id) ? outTxs[0].id : ''

        return {
          kind: 'refund',
          status: { label: 'Refunded', tone: 'yellow' },
          hash: this.$route.params.txhash,
          // Same field the shipped swapOverview hero reads for its own
          // Affiliate.vue badge — shown regardless of the refund (the
          // interface that originated the tx is unrelated to whether the
          // swap itself succeeded).
          affiliateAddress: this.txMemo?.affiliate || null,
          outboundHash,
          inboundHash: this.thorStatus?.tx?.id || '',
          from: this.thorStatus?.tx?.from_address || '',
          sentAsset: inAsset,
          sentAmountRaw: inAmount,
          sentAmountDisplay: this.formatAssetAmount(inAmount, inAsset),
          sentAmountUsdDisplay: this.formatUsdValue(
            this.amountToUSD(inAsset, inAmount, this.pools) || 0
          ),
          sentAmountUsdAtExecution: false,
          refundedAsset: outAsset,
          refundedAmountRaw: outAmount,
          refundedAmountDisplay: this.formatAssetAmount(outAmount, outAsset),
          refundedAmountUsdDisplay: this.formatUsdValue(
            this.amountToUSD(outAsset, outAmount, this.pools) || 0
          ),
          refundedAmountUsdAtExecution: false,
          reasonTitle: parsedReason?.title || null,
          reason:
            parsedReason?.body ||
            reasonRaw ||
            'No reason provided by THORChain.',
          reasonRaw,
          // Never set: onlyRefund has no swap action to carry a network-fee
          // breakdown from (matches the legacy builder's own output — its
          // 'Outbound Fee' stack only ever gets pushed from a swap's
          // networkFees, which doesn't exist for a pure refund either).
          networkFee: null,
          timeDisplay: time.main,
          timeAgoDisplay: time.paren,
          height,
          heightDisplay: height ? `#${this.normalFormat(height)}` : '-',
          memo: refundAction.metadata?.refund?.memo || '',
        }
      }

      // A swap that mostly succeeded, with only its unfilled remainder
      // refunded, is NOT this screen — that's multiOutboundOverview's
      // partial-refund case (or plain swapOverview for a single-leg
      // delivery). Without this guard, this generic branch would win the
      // v-if/-else-if race (refundOverview is checked before
      // multiOutboundOverview) purely because Midgard happened to label one
      // action 'refund', even with a real 'swap'/'limit_swap' action
      // sitting right next to it in the same rawActions list. Confirmed
      // against a real streaming swap that delivered ~$19,936 of USDC and
      // only refunded a small unfilled remainder,
      // 402F3496F288522EB87CB3DAD837E2BD8EF8E2FC3AD5610D09EDB4142F17C072 —
      // Midgard's own 'refund' action there bundles ALL of the tx's outs
      // (the delivered leg, the affiliate-fee leg, AND the refund leg) into
      // one `out[]` array, so refundAction.out[0] below isn't even
      // reliably the refund leg itself (it happened to be the affiliate
      // RUNE payout here) — reading it at all is unsafe once a real swap
      // occurred.
      const hasSuccessfulSwapAction = this.rawActions?.some(
        (a) => a.type === 'swap' || a.type === 'limit_swap'
      )
      if (hasSuccessfulSwapAction) return null

      // Generic per-action refund card (createAbstractState's case).
      const inCoin = refundAction.in?.[0]
      const outCoin = refundAction.out?.[0]
      const inAsset = inCoin?.coins?.[0]?.asset
        ? this.parseMemoAsset(inCoin.coins[0].asset)
        : null
      const outAsset = outCoin?.coins?.[0]?.asset
        ? this.parseMemoAsset(outCoin.coins[0].asset)
        : null
      if (!inAsset || !outAsset) return null

      const inAmount = parseInt(inCoin?.coins?.[0]?.amount ?? 0)
      const outAmount = parseInt(outCoin?.coins?.[0]?.amount ?? 0)
      const timeStamp = refundAction.date
        ? moment.unix(refundAction.date / 1e9)
        : null
      const time = this.splitTrailingParen(
        timeStamp ? `${timeStamp.format('L LT')} (${timeStamp.fromNow()})` : ''
      )
      const height =
        Number(refundAction.height) > 0 ? Number(refundAction.height) : null
      const reasonRaw =
        refundAction.metadata?.refund?.reason ??
        refundAction.metadata?.refund?.code ??
        ''
      const parsedReason = reasonRaw ? parseActionReason(reasonRaw) : null
      const outboundHash =
        outCoin?.txID && !isInternalTx(outCoin.txID) ? outCoin.txID : ''

      return {
        kind: 'refund',
        status: { label: 'Refunded', tone: 'yellow' },
        hash: this.$route.params.txhash,
        // createAbstractState never sets accordions.action.affiliateName
        // for this path, so details.interface (and thus this field) is
        // always empty in the legacy builder too.
        affiliateAddress: null,
        outboundHash,
        inboundHash: inCoin?.txID || '',
        from: inCoin?.address || '',
        sentAsset: inAsset,
        sentAmountRaw: inAmount,
        sentAmountDisplay: this.formatAssetAmount(inAmount, inAsset),
        sentAmountUsdDisplay: this.formatUsdValue(
          this.amountToUSD(inAsset, inAmount, this.pools) || 0
        ),
        sentAmountUsdAtExecution: false,
        refundedAsset: outAsset,
        refundedAmountRaw: outAmount,
        refundedAmountDisplay: this.formatAssetAmount(outAmount, outAsset),
        refundedAmountUsdDisplay: this.formatUsdValue(
          this.amountToUSD(outAsset, outAmount, this.pools) || 0
        ),
        refundedAmountUsdAtExecution: false,
        reasonTitle: parsedReason?.title || null,
        reason:
          parsedReason?.body || reasonRaw || 'No reason provided by THORChain.',
        reasonRaw,
        networkFee: null,
        timeDisplay: time.main,
        timeAgoDisplay: time.paren,
        height,
        heightDisplay: height ? `#${this.normalFormat(height)}` : '-',
        memo: refundAction.metadata?.refund?.memo || '',
      }
    },
    // Multi-leg outbounds — either createTradeWithdrawState's output (title
    // "trade Withdraw"/"secure Withdraw") or the swap card itself (e.g. one
    // swap output split across several destination-chain txs by a per-tx
    // amount cap — confirmed against a real 4-leg BTC->TRON.USDT streaming
    // swap where TRON capped each outbound). Any OTHER multi-out card (e.g.
    // createRemoveLiquidityState's "Withdraw Liquidity", or a swap with an
    // affiliate-fee leg producing a MIXED-asset out[]) is deliberately
    // excluded — unverified shape, and this hero's copy has no fitting
    // narrative for either. `kind` ('withdraw'|'swap') drives the wording
    // split in MultiOutboundHero. No per-leg scheduled height exists either
    // way — every still-pending leg shares one tx-wide overdue signal (see
    // resolveOutboundLegStatus). Reads rawActions/thorStatus/txMemo directly
    // instead of this.cards/accordion stacks (Phase 2 of the tx-detail-UI
    // raw-data migration) — the withdraw path re-derives
    // createTradeWithdrawState's own out[] logic (self-contained, no shared
    // helper needed); the swap path re-derives createSwapState's own out[]
    // logic, sharing resolveOutboundTxs with createSwapState itself/
    // refundOverview.
    multiOutboundOverview() {
      const memoType = this.txMemo?.type
      const isWithdraw =
        memoType === 'tradeWithdraw' || memoType === 'secureWithdraw'
      const isSwap = memoType === 'swap'
      if (!isWithdraw && !isSwap) return null

      const ZERO_HASH =
        '0000000000000000000000000000000000000000000000000000000000000000'
      // Precise (full base-unit precision, no 2dp rounding) — this hero
      // reads as a ledger reconciliation, where formatAssetAmount's usual
      // rounding would hide exactly the cents-level detail the "amount
      // accounting" rail card exists to show. Bare ticker, not chain.ticker
      // — the network's already shown by the panel's own badge chip below,
      // so repeating it in the amount line is redundant.
      const precise = (amount, asset) =>
        `${this.baseAmountFormatOrZero(amount)} ${this.showTicker(asset)}`

      let input, outs, kind, cardTitle, affiliateAddress, from, inboundHash
      let inboundGasRaw = null
      let inboundGasAsset = null
      let timeStampRaw = null
      let height = null
      let memoText = ''
      let intervalDisplay = null
      let priceImpactDisplay = null
      let liquidityFeeRawFormatted = null
      let affiliateFeeInfo = null

      if (isWithdraw) {
        const action = this.rawActions?.[0]
        if (!action) return null
        const isSecure = memoType === 'secureWithdraw'
        const ast = this.parseMemoAsset(
          this.thorStatus?.tx?.coins?.[0]?.asset,
          this.pools
        )
        if (!ast) return null
        const inAsset = isSecure ? assetToSecure(ast) : assetToTrade(ast)
        const inAmount = this.thorStatus?.tx?.coins?.[0]?.amount ?? 0
        input = {
          asset: inAsset,
          amount: inAmount,
          amountUSD: this.amountToUSD(inAsset, inAmount, this.pools),
          usdAtExecution: false,
        }

        const outAsset = isSecure ? securedToAsset(ast) : tradeToAsset(ast)
        const outboundSignal = resolveOutboundSignal(
          this.thorStatus,
          this.getOutboundStatusContext()
        )
        const outboundSigned = outboundSignal.signed ?? false
        const outboundETA = outboundSignal.eta
        const outDone = outboundSignal.signed === true
        const plannedOuts = this.thorStatus?.planned_out_txs ?? []
        const completedOuts = this.thorStatus?.out_txs ?? []
        const memoAddress = this.txMemo?.address

        let rawOuts
        if (plannedOuts.length > 0) {
          rawOuts = plannedOuts.map((planned) => {
            const completed = completedOuts.find(
              (tx) =>
                tx.coins?.[0]?.amount === planned.coin?.amount &&
                tx.coins?.[0]?.asset === planned.coin?.asset
            )
            const legState = resolveOutboundLegState(completed, {
              signed: outboundSigned,
              eta: outboundETA,
            })
            return {
              asset: outAsset,
              amount: planned.coin?.amount,
              txid: completed?.id ?? null,
              to: planned.to_address,
              gas: completed?.gas?.[0]?.amount ?? null,
              gasAsset: completed?.gas
                ? this.parseMemoAsset(completed.gas[0]?.asset, this.pools)
                : null,
              outboundETA: legState.eta,
              done: !!completed,
            }
          })
        } else if (completedOuts.length > 0) {
          rawOuts = completedOuts.map((tx) => ({
            asset: outAsset,
            amount: tx.coins?.[0]?.amount,
            txid: tx.id,
            to: memoAddress,
            gas: tx.gas?.[0]?.amount ?? null,
            gasAsset: tx.gas
              ? this.parseMemoAsset(tx.gas[0]?.asset, this.pools)
              : null,
            outboundETA,
            done: outDone,
          }))
        } else if (action.out?.length > 0) {
          rawOuts = action.out.map((o) => ({
            asset: outAsset,
            amount: o.coins?.[0]?.amount,
            txid: o.txID,
            to: memoAddress,
            outboundETA,
            done: outDone,
          }))
        } else {
          rawOuts = [
            {
              asset: outAsset,
              amount: this.thorStatus?.tx?.coins?.[0]?.amount ?? 0,
              txid: null,
              to: memoAddress,
              outboundETA,
              done: outDone,
            },
          ]
        }

        outs = rawOuts.map((o) => ({
          asset: o.asset,
          amount: o.amount,
          amountUSD: this.amountToUSD(o.asset, o.amount, this.pools),
          usdAtExecution: false,
          txid: o.txid,
          to: o.to,
          outboundETA: o.outboundETA,
          done: o.done,
          height: null,
          gas: o.gas ?? null,
          gasAsset: o.gasAsset ?? null,
          fees: null,
          feeAssets: null,
        }))

        kind = 'withdraw'
        cardTitle = this.capitalizeFirst(this.camelCase(memoType))
        affiliateAddress = null
        from = this.thorStatus?.tx?.from_address || ''
        inboundHash = this.thorStatus?.tx?.id || ''
        inboundGasRaw = this.thorStatus?.tx?.gas
          ? this.thorStatus.tx.gas[0]?.amount
          : null
        inboundGasAsset = this.thorStatus?.tx?.gas
          ? this.parseMemoAsset(this.thorStatus.tx.gas[0]?.asset, this.pools)
          : null
        timeStampRaw = action.date
        height = action.height
        memoText = this.thorStatus?.tx?.memo || ''
      } else {
        // A limit order's card title is always literally "limit order"
        // (createSwapState: swapTypeLabel picks isLimitOrder before
        // isRapidSwap) — never contains "swap", so the original
        // swapCardIndex's `/swap/i` title match could never find it. That
        // made swapOverview/multiOutboundOverview/streamingOverview all
        // unreachable for a limit order in the pre-migration code (it fell
        // through to the legacy card UI instead) — preserved here so this
        // migration doesn't silently widen coverage to a case that was
        // never actually handled/tested by this hero.
        if (this.txMemo?.isLimitOrder) return null

        const { outTxs, affiliateOut } = resolveOutboundTxs(
          this.thorStatus,
          this.thorTx,
          { actions: this.rawActions },
          this.txMemo,
          {
            parseMemoAsset: this.parseMemoAsset.bind(this),
            assetToString,
            pools: this.pools,
          }
        )
        // A swap's single-outbound case is already served by swapOverview.
        if (!outTxs || outTxs.length <= 1) return null

        const swapAction =
          this.rawActions?.find((a) => a.type === 'swap') ??
          this.rawActions?.find((a) => a.type === 'limit_swap')
        const swapMetadata =
          swapAction?.metadata?.swap ?? swapAction?.metadata?.limit_swap
        const streamingMeta = swapMetadata?.streamingSwapMeta
        const streamingCount =
          this.thorStatus?.stages?.swap_status?.streaming?.count ??
          streamingMeta?.count
        const streamingQuantity =
          this.thorStatus?.stages?.swap_status?.streaming?.quantity ??
          streamingMeta?.quantity ??
          this.txMemo?.quantity
        // A swap card that's still actively streaming defers to
        // streamingOverview instead (which bails safely if it ever sees
        // multiple legs while still mid-stream, see its own comment) —
        // don't show a "final" multi-leg summary while the stream could
        // still be producing more of it.
        if (
          Number(streamingQuantity) > 1 &&
          Number(streamingCount) < Number(streamingQuantity)
        ) {
          return null
        }

        const inAsset = this.parseMemoAsset(
          this.thorStatus?.tx?.coins?.[0]?.asset,
          this.pools
        )
        if (!inAsset) return null
        const inAmount = parseInt(this.thorStatus?.tx?.coins?.[0]?.amount ?? 0)
        const inAmountUSD =
          (+(swapMetadata?.inPriceUSD ?? 0) * inAmount) / 1e8 ||
          this.amountToUSD(inAsset, inAmount, this.pools) ||
          0
        input = {
          asset: inAsset,
          amount: inAmount,
          amountUSD: inAmountUSD,
          usdAtExecution: !!swapMetadata?.inPriceUSD,
        }

        const outAsset0 = this.parseMemoAsset(
          outTxs[0]?.coins?.[0]?.asset,
          this.pools
        )
        const outAmount0 = parseInt(outTxs[0]?.coins?.[0]?.amount ?? 0)
        const outboundHasRefund = outTxs.some(
          (tx) => tx.refund || tx.memo?.toLowerCase().startsWith('refund')
        )
        const outboundHasSuccess = outTxs.some((tx) =>
          tx.memo?.toLowerCase().startsWith('out')
        )
        let outAmountUSD0 =
          (+(swapMetadata?.outPriceUSD ?? 0) * outAmount0) / 1e8 ||
          this.amountToUSD(outAsset0, outAmount0, this.pools) ||
          0
        if (!outboundHasSuccess && outboundHasRefund) {
          outAmountUSD0 =
            (+(swapMetadata?.inPriceUSD ?? 0) * outAmount0) / 1e8 ||
            this.amountToUSD(outAsset0, outAmount0, this.pools) ||
            0
        }

        const outboundSignal = resolveOutboundSignal(
          this.thorStatus,
          this.getOutboundStatusContext()
        )
        const firstOutDone =
          !!outTxs[0]?.id ||
          (!this.thorStatus?.stages?.swap_status?.pending &&
            (this.thorStatus?.stages?.outbound_signed?.completed ||
              outAsset0?.chain === 'THOR' ||
              outAsset0?.synth ||
              outAsset0?.trade ||
              outAsset0?.secure) &&
            (this.thorStatus?.stages?.outbound_delay?.completed ?? true))
        const moreOutDone = (o) =>
          !!o.id ||
          (!this.thorStatus?.stages?.swap_status?.pending &&
            (this.thorStatus?.stages?.outbound_signed?.completed ||
              outAsset0?.chain === 'THOR' ||
              outAsset0?.synth ||
              outAsset0?.trade ||
              outAsset0?.secure))

        const outboundFees =
          swapMetadata?.networkFees?.map((n) => n?.amount) ?? []
        const outboundFeeAssets =
          outboundFees.length > 0
            ? this.parseMemoAsset(
                swapMetadata?.networkFees?.map((n) => n?.asset),
                this.pools
              )
            : null

        outs = [
          {
            asset: outAsset0,
            amount: outAmount0,
            amountUSD: outAmountUSD0,
            usdAtExecution:
              !outboundHasSuccess && outboundHasRefund
                ? !!swapMetadata?.inPriceUSD
                : !!swapMetadata?.outPriceUSD,
            txid: outTxs[0]?.id ?? null,
            to:
              outTxs[0]?.to_address ??
              this.txMemo?.destAddr?.split('/')[0] ??
              null,
            outboundETA: firstOutDone ? null : outboundSignal.eta,
            done: firstOutDone,
            height: outTxs[0]?.height ?? null,
            gas: outTxs[0]?.gas?.[0]?.amount ?? null,
            gasAsset: outTxs[0]?.gas
              ? this.parseMemoAsset(outTxs[0].gas[0]?.asset, this.pools)
              : null,
            fees: outboundFees,
            feeAssets: outboundFeeAssets,
          },
          ...outTxs.slice(1).map((o) => {
            const oAmount = parseInt(o.coins?.[0]?.amount ?? 0)
            const isRefundTx =
              o.refund || o.memo?.toLowerCase().startsWith('refund')
            const priceUSD = isRefundTx
              ? +(swapMetadata?.inPriceUSD ?? 0)
              : +(swapMetadata?.outPriceUSD ?? 0)
            return {
              asset: this.parseMemoAsset(o.coins?.[0]?.asset, this.pools),
              amount: oAmount,
              amountUSD: (priceUSD * oAmount) / 1e8,
              usdAtExecution: isRefundTx
                ? !!swapMetadata?.inPriceUSD
                : !!swapMetadata?.outPriceUSD,
              txid: o.id ?? null,
              to: o.to_address ?? null,
              outboundETA: moreOutDone(o) ? null : outboundSignal.eta,
              done: moreOutDone(o),
              height: o.height ?? null,
              gas: o.gas ? o.gas[0]?.amount : null,
              gasAsset: o.gas
                ? this.parseMemoAsset(o.gas[0]?.asset, this.pools)
                : null,
              fees: null,
              feeAssets: null,
            }
          }),
        ]

        kind = 'swap'
        const isLimitOrder = !!this.txMemo?.isLimitOrder
        const depositAmountZero = !parseInt(
          streamingMeta?.depositedCoin?.amount || 0
        )
        const rapidInterval = depositAmountZero
          ? this.txMemo?.interval
          : (streamingMeta?.interval ?? this.txMemo?.interval)
        const isRapidSwap =
          (rapidInterval === 0 || rapidInterval === '0') &&
          Number(swapAction?.height) > 25400000
        cardTitle = this.capitalizeFirst(
          isLimitOrder ? 'limit order' : isRapidSwap ? 'rapid Swap' : 'swap'
        )
        affiliateAddress = this.txMemo?.affiliate || null
        from = this.thorStatus?.tx?.from_address || ''
        inboundHash = this.thorStatus?.tx?.id || ''
        inboundGasRaw = this.thorStatus?.tx?.gas
          ? this.thorStatus.tx.gas[0]?.amount
          : null
        inboundGasAsset = this.thorStatus?.tx?.gas
          ? this.parseMemoAsset(this.thorStatus.tx.gas[0]?.asset, this.pools)
          : null
        timeStampRaw = swapAction?.date
        height = swapAction?.height
        memoText = swapAction?.metadata?.swap?.memo ?? ''

        const swapSlipRaw = parseInt(swapAction?.metadata?.swap?.swapSlip)
        priceImpactDisplay = swapSlipRaw
          ? `-${((swapSlipRaw / 1e4) * 100).toFixed(2)}%`
          : null

        const interval =
          this.thorStatus?.stages?.swap_status?.streaming?.interval ??
          streamingMeta?.interval ??
          this.txMemo?.interval
        intervalDisplay =
          interval !== undefined && interval !== null
            ? (interval === 0 || interval === '0') && Number(height) > 25400000
              ? 'Rapid Swap'
              : `${moment.duration(interval * 6, 's').as('seconds')} secs (${this.$options.filters.pluralize(interval, 'Block', { includeNumber: true })})`
            : null

        const liquidityFeeRaw =
          parseInt(swapAction?.metadata?.swap?.liquidityFee) || null
        if (liquidityFeeRaw) {
          let totalLiquidityFees = liquidityFeeRaw
          if (Number(streamingCount) < Number(streamingQuantity)) {
            const one = liquidityFeeRaw / streamingCount
            totalLiquidityFees += one * (streamingQuantity - streamingCount)
          }
          liquidityFeeRawFormatted = `${totalLiquidityFees / 1e8} RUNE (${this.formatSmallCurrency(totalLiquidityFees * this.runePrice)})`
        }

        if (affiliateOut && affiliateOut.length > 0) {
          const affiliateOutAmount = affiliateOut.reduce(
            (a, b) => a + +(b.coins?.[0]?.amount ?? 0),
            0
          )
          affiliateFeeInfo = {
            kind: 'interface',
            formatted: `${affiliateOutAmount / 1e8} RUNE (${this.formatSmallCurrency(affiliateOutAmount * this.runePrice)})`,
          }
        } else {
          const affiliateBps = sumAffiliateFee(this.txMemo?.fee || 0)
          if (affiliateBps > 0) {
            affiliateFeeInfo = { kind: 'estimate', bps: affiliateBps }
          }
        }
      }

      if (!input?.asset) return null

      // A swap's out[] can legitimately mix the main output with an
      // affiliate-fee leg in a DIFFERENT asset (excluded below, unverified
      // shape) — but it can also legitimately mix the main output with a
      // PARTIAL REFUND leg: a limit/streaming swap that couldn't fully fill
      // within its price limit sends back whatever's left, in the input
      // asset, alongside whatever did execute (confirmed against a real
      // BTC->ETH limit/streaming swap,
      // 536C7E37EC65410A52E70673703220C2D1F91315ABB9B592200F9FE3A0EC71E7 —
      // out[] there is [ETH delivery, BTC refund]). A refund leg is
      // reliably identified by its asset matching the swap's OWN input
      // asset — a legitimate swap output is never the same asset as what
      // went in. Only one refund leg is handled (no verified case has
      // more); anything else mixed in still bails as unverified.
      const inputAssetStr = assetToString(assetFromString(input.asset))
      const refundLegsRaw =
        kind === 'swap'
          ? outs.filter(
              (o) => assetToString(assetFromString(o.asset)) === inputAssetStr
            )
          : []
      const deliveredOuts =
        kind === 'swap'
          ? outs.filter(
              (o) => assetToString(assetFromString(o.asset)) !== inputAssetStr
            )
          : outs
      if (kind === 'swap') {
        if (refundLegsRaw.length > 1 || deliveredOuts.length < 1) return null
        const deliveredAssetsMatch = deliveredOuts.every(
          (o) =>
            assetToString(assetFromString(o.asset)) ===
            assetToString(assetFromString(deliveredOuts[0].asset))
        )
        if (!deliveredAssetsMatch) return null
      }

      const legs = deliveredOuts.map((leg, i) => {
        const etaBlocks = leg.outboundETA
        const pastDueBlocks =
          etaBlocks != null && etaBlocks < 0 ? -etaBlocks : null
        return {
          index: i,
          status: resolveOutboundLegStatus({
            done: !!leg.done,
            outboundETA: etaBlocks,
          }),
          hash: leg.txid && leg.txid !== ZERO_HASH ? leg.txid : null,
          to: leg.to || null,
          asset: leg.asset,
          amountRaw: Number(leg.amount) || 0,
          amountUsdRaw: Number(leg.amountUSD) || 0,
          usdAtExecution: !!leg.usdAtExecution,
          amountDisplay: precise(leg.amount, leg.asset),
          pastDueBlocks,
          pastDueDisplay: pastDueBlocks
            ? `~${moment.duration(pastDueBlocks * this.blockSeconds('THOR'), 'seconds').humanize()}`
            : null,
        }
      })

      // The single partial-refund leg (see the guard above) — kept out of
      // `legs`/totals/DeliveryBar entirely (it's a different asset, so it
      // has no place in a same-asset delivery percentage), surfaced
      // separately instead. A PARTIAL refund (delivered legs + this one, as
      // opposed to refundOverview's onlyRefund case) only happens one way
      // in THORChain — a limit/streaming swap couldn't fill the remainder
      // within its price limit — so that's stated directly rather than
      // hedged.
      const refundLegRaw = refundLegsRaw[0] || null
      const refundHeight =
        refundLegRaw && Number(refundLegRaw.height) > 0
          ? Number(refundLegRaw.height)
          : null
      const refundPercent =
        refundLegRaw && input.amount > 0
          ? (Number(refundLegRaw.amount) / Number(input.amount)) * 100
          : null

      const refundLegStatusRaw = refundLegRaw
        ? resolveOutboundLegStatus({
            done: !!refundLegRaw.done,
            outboundETA: refundLegRaw.outboundETA,
          })
        : null
      const refundLegStatus =
        refundLegStatusRaw === 'delivered' ? 'refund' : refundLegStatusRaw
      const refundPastDueBlocks =
        refundLegRaw?.outboundETA != null && refundLegRaw.outboundETA < 0
          ? -refundLegRaw.outboundETA
          : null
      const refundLeg = refundLegRaw
        ? {
            // OutboundsTable numbers legs 1-based off this index — the
            // refund sits one past the last delivered leg, matching the
            // mockup ("Leg 5" after 4 delivered legs).
            index: legs.length,
            status: refundLegStatus,
            asset: refundLegRaw.asset,
            hash:
              refundLegRaw.txid && refundLegRaw.txid !== ZERO_HASH
                ? refundLegRaw.txid
                : null,
            to: refundLegRaw.to || null,
            amountRaw: Number(refundLegRaw.amount) || 0,
            amountDisplay: precise(refundLegRaw.amount, refundLegRaw.asset),
            amountUsdRaw: Number(refundLegRaw.amountUSD) || 0,
            amountUsdDisplay: this.formatUsdValue(refundLegRaw.amountUSD),
            pastDueBlocks: refundPastDueBlocks,
            pastDueDisplay: refundPastDueBlocks
              ? `~${moment.duration(refundPastDueBlocks * this.blockSeconds('THOR'), 'seconds').humanize()}`
              : null,
            note: `Unfilled remainder returned to the sender in the input asset — ${this.addressFormatV2(refundLegRaw.to)}.${refundHeight ? ` Delivered at block #${this.normalFormat(refundHeight)}.` : ''}`,
            reason:
              refundPercent != null
                ? `${refundPercent.toFixed(2)}% of the input could not be filled inside the swap's price limit, so it was returned to the sender as a separate outbound — it is not part of the ${this.showTicker(legs[0].asset)} received above.`
                : 'This portion could not be filled within the swap’s price limit, so it was returned to the sender.',
          }
        : null

      // Totals only mean anything when every leg is the same asset (true for
      // every trade/secure withdrawal, since they always split one asset
      // across outbounds) — a mixed-asset multi-out (e.g. a swap's main
      // output + a RUNE affiliate fee) has no single "percent delivered".
      const sameAsset = legs.every(
        (l) =>
          assetToString(assetFromString(l.asset)) ===
          assetToString(assetFromString(legs[0].asset))
      )
      // inputAmount is only a valid percent denominator when the input and
      // outbound legs are the SAME asset (a trade/secure withdrawal: the
      // trade-form and native-form amounts are 1:1 comparable). For a swap,
      // input is a different asset entirely — resolveTxOutboundTotals
      // already falls back to the outbound total (same-asset, always
      // correct) as its denominator when inputAmount is omitted.
      const totals = sameAsset
        ? resolveTxOutboundTotals(
            legs.map((l) => ({ status: l.status, amount: l.amountRaw })),
            kind === 'withdraw' ? { inputAmount: input.amount } : {}
          )
        : null
      const totalsAsset = sameAsset ? legs[0].asset : null

      const sameDestination = legs.every((l) => l.to === legs[0].to)
      const destination = sameDestination ? legs[0].to : null

      const overdueLegs = legs.filter((l) => l.status === 'overdue')
      const deliveredCount = legs.filter((l) => l.status === 'delivered').length
      // A still-pending refund leg is functionally an overdue/scheduled
      // outbound too, just not part of `legs` (different asset, excluded
      // from the same-asset delivery percentage above) — without folding it
      // in here, the page's own top-level status/overdue signal went blind
      // to it entirely (see refundLeg's own status comment above).
      const refundOverdue = refundLegStatus === 'overdue'
      const refundSettled = !refundLeg || refundLegStatus === 'refund'
      // Every still-pending leg shares one tx-wide overdue signal (see
      // resolveOutboundLegStatus's doc comment), so the "past due" duration
      // is the same for all of them — take the first (falling back to the
      // refund leg's own when it's the only overdue thing).
      const pastDueDisplay =
        overdueLegs[0]?.pastDueDisplay ??
        (refundOverdue ? refundLeg.pastDueDisplay : null)

      let status
      if (totals?.allDelivered && refundSettled) {
        status = { label: 'Delivered', tone: 'green' }
      } else if (
        deliveredCount === 0 &&
        (overdueLegs.length > 0 || refundOverdue)
      ) {
        status = { label: 'Overdue', tone: 'orange' }
      } else if (deliveredCount === 0 && refundSettled) {
        status = { label: 'Pending', tone: 'yellow' }
      } else {
        status = { label: 'Partially settled', tone: 'yellow' }
      }

      const inputAssetParsed = assetFromString(input.asset)
      const assetTypeBadge = this.getNetworkBadge(inputAssetParsed)
      const destinationBadge = destination
        ? this.getNetworkBadge(assetFromString(totalsAsset || legs[0].asset))
        : null

      const timeStamp = timeStampRaw ? moment.unix(timeStampRaw / 1e9) : null
      const time = this.splitTrailingParen(
        timeStamp ? `${timeStamp.format('L LT')} (${timeStamp.fromNow()})` : ''
      )
      const heightNum = Number(height) > 0 ? Number(height) : null

      // Swap-only metrics.
      const swapSlipDisplay = kind === 'swap' ? priceImpactDisplay : null

      // Fee breakdown — same derivation swapOverview uses (rows of
      // {label, usd, subtle}, Total Fees Paid last), just gathering
      // 'Outbound Fee'/'Gas' info across every leg's own raw record instead
      // of a single leg's.
      const feeRows = (() => {
        const toRow = (label, formatted) => {
          const { usd, subtle } = this.splitFeeValue(formatted)
          return { label, usd, subtle }
        }
        const rows = []
        // The gas the sender paid on the source chain to get this tx
        // observed by THORChain — same 'Gas' derivation streamingOverview's
        // own Fee Breakdown reads (also absent from the shipped swapOverview
        // hero's own breakdown — additive here too, not a value that
        // becomes available later).
        const inboundFeeRaw =
          inboundGasRaw && inboundGasAsset
            ? `${this.baseAmountFormatOrZero(inboundGasRaw)} ${this.showAsset(inboundGasAsset)}` +
              (this.pools
                ? ` (${this.formatCurrency(this.amountToUSD(inboundGasAsset, inboundGasRaw, this.pools))})`
                : '')
            : ''
        const inboundFee = this.formatFeeDisplay(inboundFeeRaw)
        if (inboundFee) rows.push(toRow('Inbound Fee', inboundFee))

        // A trade/secure withdrawal's leg carries its network cost as gas
        // instead (createTradeWithdrawState threads out_txs[].gas straight
        // through — confirmed against a real BTC trade withdrawal,
        // 2F2A6BA57358AA14FC1738E20961EA600D9AF522FB6440329AF0EDF05D2D99F7,
        // whose out_txs[0].gas is 1540 sats — never the richer
        // fees[]/feeAssets[] array only createSwapState populates). A leg
        // with fees[] set never also contributes a gas row (mirrors
        // buildOutboundAccordions' own `is: !a.fees?.length && ...` gate on
        // its Gas stack) — fee-array entries are collected leg-by-leg
        // first, then gas entries, matching the legacy builder's own
        // stack-collection order (fees stacks are collected across all
        // out-accordions before any Gas stacks are).
        const feeSourceRows = []
        outs.forEach((leg) => {
          if (leg.fees?.length) {
            leg.fees.forEach((f, j) => {
              feeSourceRows.push({
                type: 'fee',
                amount: f,
                asset: leg.feeAssets?.[j],
              })
            })
          }
        })
        outs.forEach((leg) => {
          if (!leg.fees?.length && leg.gas && leg.gasAsset) {
            feeSourceRows.push({
              type: 'gas',
              amount: leg.gas,
              asset: leg.gasAsset,
            })
          }
        })
        rows.push(
          ...feeSourceRows
            .map((src, i) => {
              const formatted = this.formatFeeDisplay(
                src.type === 'fee'
                  ? `${src.amount / 1e8} ${this.showAsset(src.asset)}` +
                      (this.pools
                        ? ` (${this.formatCurrency(this.amountToUSD(src.asset, src.amount, this.pools))})`
                        : '')
                  : `${this.baseAmountFormatOrZero(src.amount)} ${this.showAsset(src.asset)} (${this.formatCurrency(this.amountToUSD(src.asset, src.amount, this.pools))})`
              )
              return toRow(
                i === 0 ? 'Network Fee' : `Network Fee ${i + 1}`,
                formatted
              )
            })
            .filter((r) => r.usd !== '$0.00')
        )

        if (kind === 'swap') {
          if (liquidityFeeRawFormatted) {
            const liquidityFee = this.formatFeeDisplay(liquidityFeeRawFormatted)
            if (liquidityFee) rows.push(toRow('Liquidity Fee', liquidityFee))
          }
          // Same realized-vs-estimated split streamingOverview's Fee
          // Breakdown uses: an 'Affiliate Fee' row only has a value once
          // THORChain has actually paid the affiliate out (affiliateOut — a
          // leg tracked independently of the main delivery, so it can still
          // be unsettled even once every delivered leg has landed). Fall
          // back to the memo's own declared bps against the input value,
          // same as streamingOverview.
          if (affiliateFeeInfo?.kind === 'interface') {
            const interfaceFee = this.formatFeeDisplay(
              affiliateFeeInfo.formatted
            )
            if (interfaceFee) rows.push(toRow('Affiliate Fee', interfaceFee))
          } else if (affiliateFeeInfo?.kind === 'estimate') {
            const inputUsdForAffiliate =
              input.amountUSD ??
              this.amountToUSD(input.asset, input.amount, this.pools) ??
              0
            if (affiliateFeeInfo.bps > 0 && inputUsdForAffiliate > 0) {
              const estUsd =
                inputUsdForAffiliate * (affiliateFeeInfo.bps / 10000)
              rows.push({
                label: 'Affiliate Fee (est.)',
                usd: `$${this.formatFeeDisplay(estUsd)}`,
                subtle: `${(affiliateFeeInfo.bps / 100).toFixed(2)}% of input value`,
              })
            }
          }
        }
        if (!rows.length) return []

        const totalUsd = rows.reduce(
          (sum, r) => sum + this.parseUsdAmount(r.usd),
          0
        )
        const inputUsdNum =
          input.amountUSD ??
          this.amountToUSD(input.asset, input.amount, this.pools) ??
          0
        const totalPct =
          inputUsdNum > 0
            ? `${((totalUsd / inputUsdNum) * 100).toFixed(3)}% of ${kind === 'swap' ? 'swap' : 'withdrawal'} value`
            : null
        rows.push({
          label: 'Total Fees Paid',
          usd: `$${this.formatFeeDisplay(totalUsd)}`,
          subtle: totalPct,
          isTotal: true,
        })
        return rows
      })()

      return {
        kind: 'multiOutbound',
        multiOutboundKind: kind,
        status,
        title:
          this.capitalizeFirst(cardTitle?.replace(/^refunded\s*/i, '')) ||
          'Transaction',
        hasRefund: !!refundLeg,
        refundLeg,
        hash: this.$route.params.txhash,
        // Same field the shipped swapOverview hero reads for its own
        // Affiliate.vue badge — shown regardless of whether an affiliate
        // fee actually settled yet (see feeRows above), matching the base
        // hero's own unconditional display.
        affiliateAddress,
        from,
        inboundHash,
        destination,
        asset: input.asset,
        // getAssetDisplayName is a page-local method (not a global mixin),
        // so the hero component can't call it itself — resolved here, same
        // as streamingOverview's own inputName/outputName.
        assetName: this.getAssetDisplayName(input.asset),
        assetTypeBadge,
        destinationBadge,
        amountRaw: Number(input.amount) || 0,
        amountDisplay: precise(input.amount, input.asset),
        amountUsdDisplay: this.formatUsdValue(
          input.amountUSD ??
            this.amountToUSD(input.asset, input.amount, this.pools)
        ),
        amountUsdAtExecution: !!input.usdAtExecution,
        legs,
        sameAsset,
        totals,
        totalsAsset,
        totalsAssetName: totalsAsset
          ? this.getAssetDisplayName(totalsAsset)
          : this.getAssetDisplayName(input.asset),
        totalOutboundRaw: sameAsset ? totals.total : null,
        totalOutboundDisplay: sameAsset
          ? precise(totals.total, totalsAsset)
          : null,
        totalOutboundUsdDisplay: sameAsset
          ? this.formatUsdValue(
              legs.reduce((sum, l) => sum + l.amountUsdRaw, 0)
            )
          : null,
        // True only when every delivered leg's own USD figure is itself
        // execution-time-priced — one live-fallback leg makes the summed
        // total a mix, which the tooltip can't honestly call "at execution".
        totalOutboundUsdAtExecution:
          sameAsset && legs.every((l) => l.usdAtExecution),
        // Delivered + refunded — for the OutboundsTable "Total outbound"
        // summary specifically, which (once everything's settled) covers
        // the whole original input, not just what was received. The
        // RECEIVED panel above keeps totalOutboundUsdDisplay as-is (the
        // refund isn't part of what was "received").
        totalOutboundWithRefundUsdDisplay: sameAsset
          ? this.formatUsdValue(
              legs.reduce((sum, l) => sum + l.amountUsdRaw, 0) +
                (refundLeg?.amountUsdRaw || 0)
            )
          : null,
        // Unit-less, 2dp-rounded — for the H1's trailing clause (e.g.
        // "224.48 still to be delivered"), where the precise figure with
        // its ticker is already stated earlier in the same sentence.
        outstandingShortDisplay: sameAsset
          ? this.formatAssetAmount(totals.outstanding, totalsAsset).replace(
              /\s*\S+$/,
              ''
            )
          : null,
        intervalDisplay,
        feeRows,
        priceImpactDisplay: swapSlipDisplay,
        deliveredDisplay: sameAsset
          ? precise(totals.delivered, totalsAsset)
          : null,
        outstandingDisplay: sameAsset
          ? precise(totals.outstanding, totalsAsset)
          : null,
        deliveredCount,
        // legs-only — outboundsChipLabel/outboundsSummary derive "N
        // scheduled" from `legs.length - deliveredCount - overdueCount`, so
        // this must stay scoped to `legs` (refundLeg isn't one). Use
        // hasOverdueLeg (below) when the refund leg's own overdue-ness
        // needs to factor in too.
        overdueCount: overdueLegs.length,
        refundOverdue,
        hasOverdueLeg: overdueLegs.length > 0 || refundOverdue,
        pastDueDisplay,
        timeDisplay: time.main,
        timeAgoDisplay: time.paren,
        height: heightNum,
        heightDisplay: heightNum ? `#${this.normalFormat(heightNum)}` : '-',
        memo: memoText,
      }
    },
    // A swap still actively streaming, or done streaming but not yet
    // delivered (screen 1d + the outbound-pending transition the legacy UI
    // already showed via its own Inbound/Rapid Swap/Outbound accordions).
    // swapOverview bails on middle.pending for both, so this needs its own
    // resolver. Confirmed against real txs in both phases. Distinguished
    // from a plain single-swap "pending" (awaiting confirmation) by
    // quantity > 1; the 'outbound' phase (count >= quantity, output not
    // done yet) reads the same outbound-signal fields
    // resolveOutboundSignal/buildOutboundAccordions already derive for the
    // legacy Outbound accordion, re-derived directly here rather than
    // through that accordion layer. Once output.done too, it's a fully
    // settled swap — already served by swapOverview. Static fields
    // (asset/amount/memo/etc.) come from the same raw thorStatus/rawActions
    // every other *Overview reads; live streaming progress
    // (count/quantity/interval/in/out/deposit) comes from a dedicated fetch
    // (fetchStreamingProgress, watched below, only while phase is
    // 'streaming' — that endpoint returns zeroed data once a stream is no
    // longer active) since the accordion snapshot only has
    // count/quantity/interval, not the partial in/out amounts. Reads
    // rawActions/thorStatus/txMemo directly instead of
    // this.cards/accordion stacks (Phase 2 of the tx-detail-UI raw-data
    // migration) — shares its leg-0 (the swap's single outbound)
    // derivation with multiOutboundOverview's swap-kind path/createSwapState,
    // since it's reading the exact same underlying data.
    streamingOverview() {
      // See the matching comment in multiOutboundOverview's swap-kind
      // branch — a limit order's card title never contains "swap", so the
      // original swapCardIndex-based gate could never reach one either.
      if (this.txMemo?.type !== 'swap' || this.txMemo?.isLimitOrder) return null

      const pending = this.isTxInPending(this.thorStatus, {
        actions: this.rawActions,
      })
      if (!pending) return null

      const { outTxs } = resolveOutboundTxs(
        this.thorStatus,
        this.thorTx,
        { actions: this.rawActions },
        this.txMemo,
        {
          parseMemoAsset: this.parseMemoAsset.bind(this),
          assetToString,
          pools: this.pools,
        }
      )

      const swapAction =
        this.rawActions?.find((a) => a.type === 'swap') ??
        this.rawActions?.find((a) => a.type === 'limit_swap')
      const swapMetadata =
        swapAction?.metadata?.swap ?? swapAction?.metadata?.limit_swap
      const streamingMeta = swapMetadata?.streamingSwapMeta

      // A 'Stream' stack (the legacy accordion source for isStreaming) only
      // ever existed when count was truthy — a stream that hasn't landed
      // its first sub-swap yet (count still 0) was never detected as
      // "isStreaming" by the original either, so that gate is preserved
      // here rather than "improved".
      const streamCountRaw =
        this.thorStatus?.stages?.swap_status?.streaming?.count ??
        streamingMeta?.count
      const streamQuantityRaw =
        this.thorStatus?.stages?.swap_status?.streaming?.quantity ??
        streamingMeta?.quantity ??
        this.txMemo?.quantity
      const isStreaming = !!streamCountRaw && Number(streamQuantityRaw) > 1
      const swapExecuted = !!(
        this.thorStatus?.stages?.inbound_finalised?.completed &&
        (this.thorStatus?.stages?.swap_finalised?.completed ||
          !this.thorStatus?.stages?.swap_status?.pending)
      )
      if (!isStreaming && !swapExecuted) return null

      const inAsset = this.parseMemoAsset(
        this.thorStatus?.tx?.coins?.[0]?.asset,
        this.pools
      )
      if (!inAsset) return null
      const inAmount = parseInt(this.thorStatus?.tx?.coins?.[0]?.amount ?? 0)
      const inAmountUSD =
        (+(swapMetadata?.inPriceUSD ?? 0) * inAmount) / 1e8 ||
        this.amountToUSD(inAsset, inAmount, this.pools) ||
        0
      const input = {
        asset: inAsset,
        amount: inAmount,
        amountUSD: inAmountUSD,
        usdAtExecution: !!swapMetadata?.inPriceUSD,
      }

      const outAsset = this.parseMemoAsset(
        outTxs?.length > 0 ? outTxs[0]?.coins?.[0]?.asset : this.txMemo?.asset,
        this.pools
      )
      const outAmount =
        outTxs?.length > 0 ? parseInt(outTxs[0]?.coins?.[0]?.amount ?? 0) : 0
      const outboundHasRefund = outTxs?.some(
        (tx) => tx.refund || tx.memo?.toLowerCase().startsWith('refund')
      )
      const outboundHasSuccess = outTxs?.some((tx) =>
        tx.memo?.toLowerCase().startsWith('out')
      )
      const streamingProgressEstimate = (() => {
        const directEstimate = parseInt(streamingMeta?.outEstimation ?? 0)
        if (directEstimate) return directEstimate
        const partialOut = parseInt(streamingMeta?.outCoin?.amount ?? 0)
        const count = parseInt(streamingMeta?.count ?? 0)
        const quantity = parseInt(streamingMeta?.quantity ?? 0)
        if (!partialOut || !count || !quantity) return 0
        return Math.round((partialOut * quantity) / count)
      })()
      const estimatedOutAmount =
        outAmount ||
        +this.quote?.expected_amount_out ||
        streamingProgressEstimate
      let outAmountUSD =
        (+(swapMetadata?.outPriceUSD ?? 0) * estimatedOutAmount) / 1e8 ||
        this.amountToUSD(outAsset, estimatedOutAmount, this.pools) ||
        0
      if (!outboundHasSuccess && outboundHasRefund) {
        outAmountUSD =
          (+(swapMetadata?.inPriceUSD ?? 0) * outAmount) / 1e8 ||
          this.amountToUSD(outAsset, outAmount, this.pools) ||
          0
      }

      const outboundSignal = resolveOutboundSignal(
        this.thorStatus,
        this.getOutboundStatusContext()
      )
      const firstOutDone =
        (outTxs?.length > 0 && !!outTxs[0]?.id) ||
        (!this.thorStatus?.stages?.swap_status?.pending &&
          (this.thorStatus?.stages?.outbound_signed?.completed ||
            outAsset?.chain === 'THOR' ||
            outAsset?.synth ||
            outAsset?.trade ||
            outAsset?.secure) &&
          (this.thorStatus?.stages?.outbound_delay?.completed ?? true))

      const output = {
        asset: outAsset,
        amount: estimatedOutAmount,
        amountUSD: outAmountUSD,
        usdAtExecution:
          !outboundHasSuccess && outboundHasRefund
            ? !!swapMetadata?.inPriceUSD
            : !!swapMetadata?.outPriceUSD,
        done: firstOutDone,
        to:
          outTxs?.[0]?.to_address ??
          this.txMemo?.destAddr?.split('/')[0] ??
          null,
      }
      if (output.done) return null

      const snapshotCount = isStreaming ? Number(streamCountRaw) : 1
      const snapshotQuantity = isStreaming ? Number(streamQuantityRaw) : 1
      const streamingDone = isStreaming && snapshotCount >= snapshotQuantity
      const phase = !isStreaming || streamingDone ? 'outbound' : 'streaming'

      // output above only reads the first leg — fine once the stream is
      // done (multiOutboundOverview's swap-kind branch defers to this
      // computed while still actively streaming, then takes over once it
      // isn't, see its own comment), but if the destination chain's per-tx
      // cap ever splits an outbound before the stream itself finishes, a
      // single-leg read here would silently understate the real total. No
      // verified real tx has shown that actually happening mid-stream —
      // THORChain's own out_txs only appeared once settlement started in
      // every case checked — so this is a safety bail, not a confirmed
      // gap: fall through to the legacy page rather than risk
      // misrepresenting it.
      if (phase === 'streaming' && (outTxs?.length ?? 0) > 1) return null

      // Bare ticker, not chain.ticker — the network's already shown by the
      // panel's own badge chip below, so repeating it in the amount line
      // (e.g. "458,000 ETH.USDT" instead of "458,000 USDT") is redundant.
      const precise = (amount, asset) =>
        `${this.baseAmountFormatOrZero(amount)} ${this.showTicker(asset)}`

      const timeStamp = swapAction?.date
        ? moment.unix(swapAction.date / 1e9)
        : null
      const time = this.splitTrailingParen(
        timeStamp ? `${timeStamp.format('L LT')} (${timeStamp.fromNow()})` : ''
      )
      const height =
        Number(swapAction?.height) > 0 ? Number(swapAction.height) : null
      const swapSlipRaw = parseInt(swapAction?.metadata?.swap?.swapSlip)
      const swapSlipPercent = swapSlipRaw ? (swapSlipRaw / 1e4) * 100 : null

      // Outbound-phase fields — re-derived directly from resolveOutboundSignal
      // (the same source buildOutboundAccordions/the legacy Outbound
      // accordion already renders), not through that accordion layer.
      const outboundETA = outboundSignal.eta
      const outboundDelayRemaining = outboundSignal.delayRemaining
      const outboundSigned = outboundSignal.signed
      const outboundEstDisplay =
        !firstOutDone && outboundETA > 0
          ? moment
              .duration(this.blockSeconds('THOR') * outboundETA, 'seconds')
              .humanize()
          : null
      let outboundDelayEstDisplay = null
      if (!firstOutDone && outboundDelayRemaining) {
        outboundDelayEstDisplay = moment
          .duration(outboundDelayRemaining, 'seconds')
          .humanize()
      } else if (
        !firstOutDone &&
        outboundSigned === false &&
        outboundETA <= 0
      ) {
        outboundDelayEstDisplay = 'Scheduled Passed'
      }
      const outboundPastDueDisplay =
        !firstOutDone && outboundSigned === false && outboundETA < 0
          ? (() => {
              const blocksPastDue = -outboundETA
              const timePastDue = moment
                .duration(this.blockSeconds('THOR') * blocksPastDue, 'seconds')
                .humanize()
              return `~${timePastDue} (${blocksPastDue.toLocaleString()} blocks)`
            })()
          : null
      const outboundStages = this.getOutboundStages({
        done: firstOutDone,
        outboundDelayRemaining,
        outboundSigned,
      })
      const outboundFees =
        swapMetadata?.networkFees?.map((n) => n?.amount) ?? []
      const outboundFeeAssets =
        outboundFees.length > 0
          ? this.parseMemoAsset(
              swapMetadata?.networkFees?.map((n) => n?.asset),
              this.pools
            )
          : null
      const outboundFeeDisplay =
        outboundFees
          .map((f, j) =>
            f
              ? `${f / 1e8} ${this.showAsset(outboundFeeAssets?.[j])}` +
                (this.pools
                  ? ` (${this.formatCurrency(this.amountToUSD(outboundFeeAssets?.[j], f, this.pools))})`
                  : '')
              : null
          )
          .filter(Boolean)
          .join(', ') || null

      let outboundDelaySeconds = 0
      if (!firstOutDone) {
        if (outboundETA > 0) {
          outboundDelaySeconds = this.blockSeconds('THOR') * outboundETA
        }
        if (outboundDelaySeconds === 0) {
          outboundDelaySeconds = outboundDelayRemaining || 0
        }
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
      // The legacy 'Rate' stack's value is an array of plain strings, but
      // formatStackValue's array branch expects {text} objects — it maps
      // each string's nonexistent .text to '', so this has always rendered
      // empty. Preserved via the same shared helper rather than hardcoded,
      // in case that helper's behavior is ever revisited.
      const rateDisplay = this.formatStackValue(rates)

      const interval =
        this.thorStatus?.stages?.swap_status?.streaming?.interval ??
        streamingMeta?.interval ??
        this.txMemo?.interval
      const intervalDisplay =
        interval !== undefined && interval !== null
          ? (interval === 0 || interval === '0') && Number(height) > 25400000
            ? 'Rapid Swap'
            : `${moment.duration(interval * 6, 's').as('seconds')} secs (${this.$options.filters.pluralize(interval, 'Block', { includeNumber: true })})`
          : null
      // Fee breakdown — same derivation as multiOutboundOverview's, minus
      // the per-leg outbound-fee gathering (nothing's been paid out yet).
      const feeRows = (() => {
        const toRow = (label, formatted) => {
          const { usd, subtle } = this.splitFeeValue(formatted)
          return { label, usd, subtle }
        }
        const rows = []
        const inboundGasRaw = this.thorStatus?.tx?.gas
          ? this.thorStatus.tx.gas[0]?.amount
          : null
        const inboundGasAsset = this.thorStatus?.tx?.gas
          ? this.parseMemoAsset(this.thorStatus.tx.gas[0]?.asset, this.pools)
          : null
        const inboundFeeRaw =
          inboundGasRaw && inboundGasAsset
            ? `${this.baseAmountFormatOrZero(inboundGasRaw)} ${this.showAsset(inboundGasAsset)}` +
              (this.pools
                ? ` (${this.formatCurrency(this.amountToUSD(inboundGasAsset, inboundGasRaw, this.pools))})`
                : '')
            : ''
        const inboundFee = this.formatFeeDisplay(inboundFeeRaw)
        if (inboundFee) rows.push(toRow('Inbound Fee', inboundFee))

        const liquidityFeeRaw =
          parseInt(swapAction?.metadata?.swap?.liquidityFee) || null
        if (liquidityFeeRaw) {
          let totalLiquidityFees = liquidityFeeRaw
          if (Number(streamCountRaw) < Number(streamQuantityRaw)) {
            const one = liquidityFeeRaw / streamCountRaw
            totalLiquidityFees += one * (streamQuantityRaw - streamCountRaw)
          }
          const liquidityFee = this.formatFeeDisplay(
            `${totalLiquidityFees / 1e8} RUNE (${this.formatSmallCurrency(totalLiquidityFees * this.runePrice)})`
          )
          if (liquidityFee)
            rows.push(toRow('Liquidity Fee (est.)', liquidityFee))
        }
        // 'Interface Fee' only has a value once THORChain has actually paid
        // the affiliate out — gated on affiliateOut.length > 0. For a
        // streaming swap, that payout is only realized once the stream
        // settles (confirmed: absent — not zero, absent — for the whole
        // active-streaming window), so this row would otherwise vanish even
        // though the fee is guaranteed to be charged. Fall back to
        // estimating it from the memo's own declared bps against the input
        // value, labeled "(est.)" since it hasn't actually gone out yet —
        // same reasoning as Liquidity Fee (est.) above.
        const affiliateBps = sumAffiliateFee(this.txMemo?.fee || 0)
        const inputUsdForAffiliate =
          input.amountUSD ??
          this.amountToUSD(input.asset, input.amount, this.pools) ??
          0
        if (affiliateBps > 0 && inputUsdForAffiliate > 0) {
          const estUsd = inputUsdForAffiliate * (affiliateBps / 10000)
          rows.push({
            label: 'Affiliate Fee (est.)',
            usd: `$${this.formatFeeDisplay(estUsd)}`,
            subtle: `${(affiliateBps / 100).toFixed(2)}% of input value`,
          })
        }
        if (!rows.length) return []
        const totalUsd = rows.reduce(
          (sum, r) => sum + this.parseUsdAmount(r.usd),
          0
        )
        const totalPct =
          inputUsdForAffiliate > 0
            ? `${((totalUsd / inputUsdForAffiliate) * 100).toFixed(3)}% of swap value (est.)`
            : null
        rows.push({
          label: 'Total Fees Paid (est.)',
          usd: `$${this.formatFeeDisplay(totalUsd)}`,
          subtle: totalPct,
          isTotal: true,
        })
        return rows
      })()

      return {
        kind: 'streaming',
        status: { label: 'In progress', tone: 'yellow' },
        hash: this.$route.params.txhash,
        // Same field the shipped swapOverview hero reads for its own
        // Affiliate.vue badge — not derived here.
        affiliateAddress: this.txMemo?.affiliate || null,
        from: this.thorStatus?.tx?.from_address || '',
        inboundHash: this.thorStatus?.tx?.id || '',
        destination: output.to || null,
        asset: input.asset,
        // Full chain name for a chain's own gas asset (BTC.BTC ->
        // "Bitcoin", ETH.ETH -> "Ethereum"), bare ticker otherwise (ETH.USDC
        // -> "USDC") — matches the shipped swapOverview hero's own
        // .tx-asset-primary convention (getAssetDisplayName, page-local
        // only, not reachable from this child component).
        inputName: this.getAssetDisplayName(input.asset),
        assetBadge: this.getNetworkBadge(assetFromString(input.asset)),
        amountRaw: Number(input.amount) || 0,
        amountDisplay: precise(input.amount, input.asset),
        amountUsdDisplay: this.formatUsdValue(
          input.amountUSD ??
            this.amountToUSD(input.asset, input.amount, this.pools)
        ),
        amountUsdAtExecution: !!input.usdAtExecution,
        outputAsset: output.asset,
        outputName: this.getAssetDisplayName(output.asset),
        outputAssetBadge: this.getNetworkBadge(assetFromString(output.asset)),
        phase,
        isStreaming,
        // The swap's full projected FINAL total (swapMetadata's
        // streamingSwapMeta.outEstimation, computed once at swap creation)
        // — a distinct figure from "so far" below. Re-derived on every
        // rebuild, so no separate fetch needed. Once phase is 'outbound'
        // this is no longer just a projection — streaming's done, so it's
        // the real determined output.
        outputProjectedRaw: Number(output.amount) || 0,
        outputProjectedDisplay: precise(output.amount, output.asset),
        outputProjectedUsdDisplay: this.formatUsdValue(output.amountUSD),
        // Shared by both the projected total and "so far" USD figures
        // below — outputSoFarUsdDisplay is scaled proportionally off this
        // same output.amountUSD (see buildStreamingProgress), so it carries
        // the same price basis.
        outputUsdAtExecution: !!output.usdAtExecution,
        // "So far" (outputSoFarDisplay/-UsdDisplay) comes from the live
        // fetch below and stays null until it resolves (or once phase is
        // 'outbound' — see buildStreamingProgress) — deliberately not
        // falling back to outputProjectedDisplay, which would overstate
        // progress mid-stream (it's the full swap's total, not what's
        // landed yet).
        ...this.buildStreamingProgress(
          { snapshotCount, snapshotQuantity, phase },
          input.asset,
          output
        ),
        outboundHash:
          outTxs?.[0]?.id && !isInternalTx(outTxs[0].id) ? outTxs[0].id : '',
        outboundEstDisplay,
        outboundDelayEstDisplay,
        // buildOutboundAccordions sets both remainingTime/totalTime to this
        // exact same value (an ETA-derived delay, falling back to the raw
        // outboundDelayRemaining only when that ETA-derived figure is 0) —
        // StreamingSwapHero's own local countdown timer is what turns this
        // single "current remaining" value into a real remaining-vs-total
        // pair client-side (its outboundDelayTimerTotal only ever grows to
        // the largest remaining value observed across polls).
        outboundDelayRemainingSeconds: outboundDelaySeconds,
        outboundDelayTotalSeconds: outboundDelaySeconds,
        outboundPastDueDisplay,
        outboundStages,
        outboundFeeDisplay,
        intervalDisplay,
        rateDisplay,
        priceImpactDisplay:
          swapSlipPercent != null ? `-${swapSlipPercent.toFixed(2)}%` : null,
        feeRows,
        timeDisplay: time.main,
        timeAgoDisplay: time.paren,
        height,
        heightDisplay: height ? `#${this.normalFormat(height)}` : '-',
        memo: swapAction?.metadata?.swap?.memo ?? '',
      }
    },
    // Mimir votes always come through createAbstractState's mimir branch
    // (no dedicated builder) — that branch only carries the tx's own vote
    // (node address, key, value); the network-wide tally/threshold/current
    // effective value come from a live fetch (fetchMimirConsensus, watched
    // below), the same "gap" pattern as bondOverview's node snapshot. Reads
    // rawActions directly instead of this.cards/accordion stacks (Phase 2
    // of the tx-detail-UI raw-data migration).
    mimirOverview() {
      const mimirAction = this.rawActions?.find((a) => a.type === 'mimir')
      if (!mimirAction) return null

      const key = mimirAction.metadata?.mimir?.key
      if (!key) return null
      const rawValue = mimirAction.metadata?.mimir?.value
      const value = rawValue != null && rawValue !== '' ? `${rawValue}` : ''
      const nodeAddress = mimirAction.in?.[0]?.address || ''
      const timeStamp = mimirAction.date
        ? moment.unix(mimirAction.date / 1e9)
        : null
      const time = this.splitTrailingParen(
        timeStamp ? `${timeStamp.format('L LT')} (${timeStamp.fromNow()})` : ''
      )
      const height =
        Number(mimirAction.height) > 0 ? Number(mimirAction.height) : null

      return {
        kind: 'mimir',
        status: this.getOverviewStatus({}),
        hash: this.$route.params.txhash,
        nodeAddress,
        key,
        value,
        memo: `mimir:${key}:${value}`,
        timeDisplay: time.main,
        timeAgoDisplay: time.paren,
        height,
        heightDisplay: height ? `#${this.normalFormat(height)}` : '-',
      }
    },
    swapOverview() {
      // Same limit-order gate as multiOutboundOverview/streamingOverview
      // (see their matching comments) — a limit order's card title is
      // literally 'limit order', which the original /swap/i-matching
      // swapCardIndex could never find either, so swapOverview was
      // unreachable for one before this migration too.
      if (this.txMemo?.type !== 'swap' || this.txMemo?.isLimitOrder) return null

      // A pure refund (every Midgard action is type 'refund') is
      // refundOverview's case — matches createSwapState's own `onlyRefund`,
      // which fed the legacy card's `middle.fail`.
      const onlyRefund =
        this.rawActions?.length > 0 &&
        this.rawActions.every((a) => a.type === 'refund')
      if (onlyRefund) return null
      // Matches the legacy card's `middle.pending`.
      if (this.isTxInPending(this.thorStatus, { actions: this.rawActions }))
        return null

      const { outTxs, affiliateOut } = resolveOutboundTxs(
        this.thorStatus,
        this.thorTx,
        { actions: this.rawActions },
        this.txMemo,
        {
          parseMemoAsset: this.parseMemoAsset.bind(this),
          assetToString,
          pools: this.pools,
        }
      )
      // Multiple outbound legs is multiOutboundOverview's case.
      if (outTxs && outTxs.length > 1) return null

      const midgardSwap =
        this.rawActions?.find((a) => a.type === 'swap') ??
        this.rawActions?.find((a) => a.type === 'limit_swap')
      const swapMeta =
        midgardSwap?.metadata?.swap ?? midgardSwap?.metadata?.limit_swap
      const refundAction = this.rawActions?.find((a) => a.type === 'refund')
      const contractAction = this.rawActions?.find((a) => a.type === 'contract')

      const inAsset = this.parseMemoAsset(
        this.thorStatus?.tx?.coins?.[0]?.asset,
        this.pools
      )
      const inAmount = parseInt(this.thorStatus?.tx?.coins?.[0]?.amount ?? 0)
      const inAmountUSD =
        (+(swapMeta?.inPriceUSD ?? 0) * inAmount) / 1e8 ||
        this.amountToUSD(inAsset, inAmount, this.pools) ||
        0
      const inUsdAtExecution = !!swapMeta?.inPriceUSD
      const input = {
        asset: inAsset,
        amount: inAmount,
        amountUSD: inAmountUSD,
      }

      const outAsset = this.parseMemoAsset(
        outTxs?.length > 0 ? outTxs[0]?.coins?.[0]?.asset : this.txMemo?.asset,
        this.pools
      )
      if (!input.asset || !outAsset) {
        return null
      }
      const outAmount =
        outTxs?.length > 0 ? parseInt(outTxs[0]?.coins?.[0]?.amount ?? 0) : 0
      const outboundHasRefund = outTxs?.some(
        (tx) => tx.refund || tx.memo?.toLowerCase().startsWith('refund')
      )
      const outboundHasSuccess = outTxs?.some((tx) =>
        tx.memo?.toLowerCase().startsWith('out')
      )
      const streamingMeta = swapMeta?.streamingSwapMeta
      const streamingProgressEstimate = (() => {
        const directEstimate = parseInt(streamingMeta?.outEstimation ?? 0)
        if (directEstimate) return directEstimate
        const partialOut = parseInt(streamingMeta?.outCoin?.amount ?? 0)
        const count = parseInt(streamingMeta?.count ?? 0)
        const quantity = parseInt(streamingMeta?.quantity ?? 0)
        if (!partialOut || !count || !quantity) return 0
        return Math.round((partialOut * quantity) / count)
      })()
      const estimatedOutAmount =
        outAmount ||
        +this.quote?.expected_amount_out ||
        streamingProgressEstimate
      let outAmountUSD =
        (+(swapMeta?.outPriceUSD ?? 0) * estimatedOutAmount) / 1e8 ||
        this.amountToUSD(outAsset, estimatedOutAmount, this.pools) ||
        0
      if (!outboundHasSuccess && outboundHasRefund) {
        outAmountUSD =
          (+(swapMeta?.inPriceUSD ?? 0) * outAmount) / 1e8 ||
          this.amountToUSD(outAsset, outAmount, this.pools) ||
          0
      }
      const outUsdAtExecution =
        !outboundHasSuccess && outboundHasRefund
          ? !!swapMeta?.inPriceUSD
          : !!swapMeta?.outPriceUSD
      const output = {
        asset: outAsset,
        amount: estimatedOutAmount,
        amountUSD: outAmountUSD,
      }

      const inputAsset = assetFromString(input.asset)
      const outputAsset = assetFromString(output.asset)
      const status = this.getOverviewStatus({})

      // The legacy inbound accordion for a swap never carried a `height`
      // field at all (createSwapState's accordions.in[0] omits it), so the
      // 'Block Height' stack this used to read never actually had a value —
      // preserved as always-null rather than "improved" with a real height.
      const inboundHeight = null
      const outboundHeight =
        Number(outTxs?.[0]?.height) > 0 ? Number(outTxs[0].height) : null
      const inboundHash = this.thorStatus?.tx?.id || ''
      const outboundHash =
        outTxs?.[0]?.id && !isInternalTx(outTxs[0].id) ? outTxs[0].id : ''

      const settledSeconds =
        inboundHeight && outboundHeight && outboundHeight >= inboundHeight
          ? (outboundHeight - inboundHeight) * this.blockSeconds('THOR')
          : null

      const actionHeight = midgardSwap ? parseInt(midgardSwap.height) : null
      const outAssetStr = assetToString(outputAsset)
      const outHeights = (midgardSwap?.out || [])
        .filter((o) => !o.affiliate && o.coins?.[0]?.asset === outAssetStr)
        .map((o) => parseInt(o.height))
        .filter(Boolean)
      const latestOutHeight = outHeights.length ? Math.max(...outHeights) : null
      const duration =
        actionHeight && latestOutHeight && latestOutHeight >= actionHeight
          ? blockTime(latestOutHeight - actionHeight)
          : null

      // The legacy 'Rate' stack's value was an array of plain strings —
      // formatStackValue's array branch only ever reads an item's `.text`
      // (absent here), so it always formatted to '' and never actually
      // contributed to the computedRate-or-rate fallback below.
      const rate = ''
      const swapSlipRaw = parseInt(midgardSwap?.metadata?.swap?.swapSlip)
      const slip = swapSlipRaw
        ? `${this.percentageFormat(swapSlipRaw / 1e4, 2)}`
        : ''
      const affiliateBasis = String(sumAffiliateFee(this.txMemo?.fee || 0))
      const streamingCount =
        this.thorStatus?.stages?.swap_status?.streaming?.count ??
        streamingMeta?.count
      const streamingQuantity =
        this.thorStatus?.stages?.swap_status?.streaming?.quantity ??
        streamingMeta?.quantity ??
        this.txMemo?.quantity
      const liquidityFeeRaw =
        parseInt(midgardSwap?.metadata?.swap?.liquidityFee) || null
      let liquidityFee = null
      if (liquidityFeeRaw) {
        let totalLiquidityFees = liquidityFeeRaw
        if (Number(streamingCount) < Number(streamingQuantity)) {
          const one = liquidityFeeRaw / streamingCount
          totalLiquidityFees += one * (streamingQuantity - streamingCount)
        }
        liquidityFee = this.formatFeeDisplay(
          `${totalLiquidityFees / 1e8} RUNE (${this.formatSmallCurrency(totalLiquidityFees * this.runePrice)})`
        )
      }
      let interfaceFee = null
      if (affiliateOut && affiliateOut.length > 0) {
        const affiliateOutAmount = affiliateOut.reduce(
          (a, b) => a + +(b.coins?.[0]?.amount ?? 0),
          0
        )
        interfaceFee = this.formatFeeDisplay(
          `${affiliateOutAmount / 1e8} RUNE (${this.formatSmallCurrency(affiliateOutAmount * this.runePrice)})`
        )
      }
      const outboundFees = swapMeta?.networkFees?.map((n) => n?.amount) ?? []
      const outboundFeeAssets =
        outboundFees.length > 0
          ? this.parseMemoAsset(
              swapMeta?.networkFees?.map((n) => n?.asset),
              this.pools
            )
          : null
      const networkFees = outboundFees
        .map((f, j) => {
          if (!f) return null
          const asset = Array.isArray(outboundFeeAssets)
            ? outboundFeeAssets[j]
            : outboundFeeAssets
          const formatted =
            `${f / 1e8} ${this.showAsset(asset)}` +
            (this.pools
              ? ` (${this.formatCurrency(this.amountToUSD(asset, f, this.pools))})`
              : '')
          return this.formatFeeDisplay(formatted)
        })
        .filter(Boolean)
      const contractActionType = this.getContractActionType(contractAction)

      // Historical prices at the time the swap executed — more accurate than
      // current pool prices for displaying USD values (swapMeta/
      // inUsdAtExecution/outUsdAtExecution already computed above).
      const nonContractInUsdRaw = swapMeta?.inPriceUSD
        ? (parseFloat(input.amount) / 1e8) * parseFloat(swapMeta.inPriceUSD)
        : parseFloat(input.amountUSD) || 0
      const nonContractOutUsdRaw = swapMeta?.outPriceUSD
        ? (parseFloat(output.amount) / 1e8) * parseFloat(swapMeta.outPriceUSD)
        : parseFloat(output.amountUSD) || 0

      // When the contract action is a Market Order (FIN DEX), extract the
      // true user-facing amounts from the contract events rather than using
      // the midgard amounts which only reflect the tiny THORChain-native leg.
      let contractDisplay = null
      if (contractAction && contractActionType) {
        const cEvents = contractAction.metadata?.contract?.contractEvents || []
        const cToAttrs = (e) =>
          Object.fromEntries(
            (e.attributes || []).map(({ key, value }) => [key, value])
          )
        // Prefer the swap action's sender; the contractAction.in address is often
        // the CosmWasm executor module account, not the actual user
        const cUserAddr =
          midgardSwap?.in?.[0]?.address || contractAction.in?.[0]?.address || ''

        // Input: prefer metadata.funds, fall back to first non-rune coin_spent by user
        let cFundsAmount = 0
        let cFundsDenom = ''
        const cFundsStr = contractAction.metadata?.contract?.funds || ''
        if (cFundsStr) {
          cFundsAmount = parseInt(cFundsStr) || 0
          cFundsDenom = cFundsStr.replace(/^\d+/, '').trim()
        }
        if (!cFundsAmount && cUserAddr) {
          const spentAttr = cEvents
            .filter((e) => e.type === 'coin_spent')
            .map(cToAttrs)
            .find(
              (a) =>
                a.spender === cUserAddr && a.amount && !/rune$/i.test(a.amount)
            )
          if (spentAttr) {
            cFundsAmount = parseInt(spentAttr.amount) || 0
            cFundsDenom = spentAttr.amount.replace(/^\d+/, '').trim()
          }
        }

        // Output: aggregate all coin_received events where the receiver is the
        // tx sender (contractAction.in[0]). This reflects what actually arrived
        // in the sender's wallet regardless of internal contract routing.
        const cReceivedByDenom = {}
        const cSenderAddr = contractAction.in?.[0]?.address || ''
        if (cSenderAddr) {
          cEvents
            .filter((e) => e.type === 'coin_received')
            .map(cToAttrs)
            .filter((a) => a.receiver === cSenderAddr && a.amount)
            .forEach((a) => {
              a.amount.split(',').forEach((part) => {
                const p = part.trim()
                const amt = parseInt(p) || 0
                const denom = p.replace(/^\d+/, '').trim()
                if (denom && amt > 0)
                  cReceivedByDenom[denom] = (cReceivedByDenom[denom] || 0) + amt
              })
            })
        }
        const cOutDenoms = Object.keys(cReceivedByDenom)
        const cPrimaryDenom =
          cOutDenoms.find((d) => d !== cFundsDenom) || cOutDenoms[0] || ''
        const cReceivedAmt = cReceivedByDenom[cPrimaryDenom] || 0

        if (cFundsAmount > 0 || cReceivedAmt > 0) {
          const cInAssetStr = cFundsDenom
            ? securedToAsset(cFundsDenom).toUpperCase()
            : ''
          // Preserve secure: true flag for badge; fall back to converted form
          const cInAsset = cFundsDenom
            ? (assetFromString(cFundsDenom.toUpperCase()) ??
              assetFromString(cInAssetStr))
            : null
          const cInTicker = cInAsset?.ticker || cFundsDenom
          const cOutAssetStr = cPrimaryDenom
            ? securedToAsset(cPrimaryDenom).toUpperCase()
            : ''
          const cOutAsset = cPrimaryDenom
            ? (assetFromString(cPrimaryDenom.toUpperCase()) ??
              assetFromString(cOutAssetStr))
            : null
          const cOutTicker = cOutAsset?.ticker || cPrimaryDenom
          const cInUsdRaw = this.amountToUSD(
            cInAssetStr,
            cFundsAmount,
            this.pools
          )
          const cOutUsdRaw = this.amountToUSD(
            cOutAssetStr,
            cReceivedAmt,
            this.pools
          )
          contractDisplay = {
            inputAsset: cInAssetStr || null,
            inputName:
              this.getAssetDisplayName(cInAssetStr) || cInTicker || 'Input',
            inputBadge: this.getNetworkBadge(cInAsset) || '',
            inputAmount: cFundsAmount
              ? `${this.baseAmountFormatOrZero(cFundsAmount)} ${cInTicker}`
              : '-',
            inputUsd: this.formatUsdValue(cInUsdRaw),
            inputUsdRaw: cInUsdRaw,
            outputAsset: cOutAssetStr || null,
            outputName:
              this.getAssetDisplayName(cOutAssetStr) || cOutTicker || 'Output',
            outputBadge: this.getNetworkBadge(cOutAsset) || '',
            outputAmount: cReceivedAmt
              ? `${this.baseAmountFormatOrZero(cReceivedAmt)} ${cOutTicker}`
              : '-',
            outputUsd: this.formatUsdValue(cOutUsdRaw),
            outputUsdRaw: cOutUsdRaw,
            inAmt: cFundsAmount / 1e8,
            outAmt: cReceivedAmt / 1e8,
            inTicker: cInTicker,
            outTicker: cOutTicker,
            inputSecure: cInAsset?.secure ?? false,
          }
        }
      }

      const inAmt = contractDisplay
        ? contractDisplay.inAmt
        : parseFloat(input.amount) / 1e8
      const outAmt = contractDisplay
        ? contractDisplay.outAmt
        : parseFloat(output.amount) / 1e8
      const rateInTicker = contractDisplay
        ? contractDisplay.inTicker
        : inputAsset?.ticker || ''
      const rateOutTicker = contractDisplay
        ? contractDisplay.outTicker
        : outputAsset?.ticker || ''
      const computedRate =
        inAmt > 0 && outAmt > 0
          ? `1 ${rateInTicker} = ${this.decimalFormat(outAmt / inAmt)} ${rateOutTicker}`
          : null
      const computedRateFlipped =
        inAmt > 0 && outAmt > 0
          ? `1 ${rateOutTicker} = ${this.decimalFormat(inAmt / outAmt)} ${rateInTicker}`
          : null
      const displayInputAmount = contractDisplay
        ? contractDisplay.inputAmount
        : this.formatAssetAmount(input.amount, input.asset)
      const displayOutputAmount = contractDisplay
        ? contractDisplay.outputAmount
        : this.formatAssetAmount(output.amount, output.asset)

      // Matches createSwapState's own swapTypeLabel (isLimitOrder already
      // excluded by the guard above, so this reduces to rapid-vs-plain).
      const depositAmountZero = !parseInt(
        streamingMeta?.depositedCoin?.amount || 0
      )
      const rapidInterval = depositAmountZero
        ? this.txMemo?.interval
        : (streamingMeta?.interval ?? this.txMemo?.interval)
      const isRapidSwap =
        (rapidInterval === 0 || rapidInterval === '0') &&
        Number(midgardSwap?.height) > 25400000
      const swapTypeLabel = isRapidSwap ? 'rapid Swap' : 'swap'

      const timeStampRaw = midgardSwap?.date
      const timeStampMoment = timeStampRaw
        ? moment.unix(timeStampRaw / 1e9)
        : null
      const timeDisplay = timeStampMoment?.isValid()
        ? `${timeStampMoment.format('L LT')} (${timeStampMoment.fromNow()})`
        : ''

      return {
        title: contractActionType
          ? `${contractActionType}: ${displayInputAmount} for ${displayOutputAmount}`
          : `Swapped ${displayInputAmount} for ${displayOutputAmount}`,
        metaLabel: `${contractActionType || this.getSwapActionLabel(inputAsset, outputAsset)} · ${this.getSwapProductLabel(contractAction)}`,
        hasContractAction: !!contractAction,
        status,
        affiliateAddress: this.txMemo?.affiliate || '',
        actionTypeTitle: swapTypeLabel,
        labels: refundAction ? ['Refund'] : [],
        input: contractDisplay
          ? {
              asset: contractDisplay.inputAsset,
              name: contractDisplay.inputName,
              badge: contractDisplay.inputBadge,
              amount: contractDisplay.inputAmount,
              usd: contractDisplay.inputUsd,
              usdAtExecution: inUsdAtExecution,
              txId: inboundHash,
              secure: contractDisplay.inputSecure ?? false,
            }
          : {
              asset: input.asset,
              name: this.getAssetDisplayName(input.asset),
              badge: this.getNetworkBadge(inputAsset),
              amount: this.formatAssetAmount(input.amount, input.asset),
              usd: this.formatUsdValue(nonContractInUsdRaw),
              usdAtExecution: inUsdAtExecution,
              txId: inboundHash,
            },
        output: contractDisplay
          ? {
              asset: contractDisplay.outputAsset,
              name: contractDisplay.outputName,
              badge: contractDisplay.outputBadge,
              amount: contractDisplay.outputAmount,
              usd: contractDisplay.outputUsd,
              usdAtExecution: outUsdAtExecution,
              txId: outboundHash,
            }
          : {
              asset: output.asset,
              name: this.getAssetDisplayName(output.asset),
              badge: this.getNetworkBadge(outputAsset),
              amount: this.formatAssetAmount(output.amount, output.asset),
              usd: this.formatUsdValue(nonContractOutUsdRaw),
              usdAtExecution: outUsdAtExecution,
              txId: outboundHash,
            },
        metricRows: (() => {
          const base = [
            !contractDisplay && slip
              ? { label: 'Slippage', value: slip }
              : null,
            duration ? { label: 'Settled In', value: duration } : null,
            settledSeconds
              ? {
                  label: 'Settled In',
                  value: moment.duration(settledSeconds, 'seconds').humanize(),
                }
              : null,
          ].filter(Boolean)

          const cEvents =
            contractAction?.metadata?.contract?.contractEvents || []
          const strategyCount = cEvents.filter(
            (e) => e.type === 'wasm-calc-manager/strategy.execute'
          ).length
          const finPairs = new Set(
            cEvents
              .filter((e) => e.type === 'wasm-rujira-fin/trade')
              .map(
                (e) =>
                  Object.fromEntries(
                    (e.attributes || []).map(({ key, value }) => [key, value])
                  )._contract_address
              )
              .filter(Boolean)
          ).size
          if (strategyCount > 0)
            base.push({ label: 'Strategies', value: String(strategyCount) })
          if (finPairs > 0)
            base.push({ label: 'FIN Pairs', value: String(finPairs) })
          const showPriceImpact = contractDisplay || base.length < 3
          if (showPriceImpact) {
            const inUsd = contractDisplay
              ? contractDisplay.inputUsdRaw || 0
              : nonContractInUsdRaw
            const outUsd = contractDisplay
              ? contractDisplay.outputUsdRaw || 0
              : nonContractOutUsdRaw
            if (inUsd > 0 && outUsd > 0) {
              const impact = ((outUsd / inUsd - 1) * 100).toFixed(2)
              const sign = parseFloat(impact) > 0 ? '+' : ''
              base.unshift({
                label: 'Price Impact',
                value: `${sign}${impact}%`,
              })
            }
          }
          return base
        })(),
        detailRows: (() => {
          const rows = [
            {
              label: 'Product',
              value: this.getSwapProductLabel(contractAction),
              tone: this.getProductTone(
                this.getSwapProductLabel(contractAction)
              ),
              type: 'product',
            },
            contractActionType
              ? {
                  label: 'Action',
                  value: contractActionType,
                  tone: this.getContractTypeTone(contractActionType),
                  type: 'product',
                }
              : {
                  label: 'Action',
                  value: this.getSwapActionLabel(inputAsset, outputAsset),
                },
            contractAction
              ? {
                  label: 'Contract',
                  value:
                    getRujiraContractLabel(contractAction?.out?.[0]?.address) ||
                    this.formatAddress(contractAction?.out?.[0]?.address),
                }
              : null,
            computedRate || rate
              ? {
                  label: 'Exchange Rate',
                  value: computedRate || rate,
                  valueFlipped: computedRateFlipped,
                  type: 'exchange-rate',
                }
              : null,
            { label: 'Status', value: status.label, type: 'status' },
            {
              label: 'Time',
              value: timeDisplay || '-',
            },
            {
              label: 'Block',
              value: (() => {
                const h = parseInt(
                  contractAction?.height || midgardSwap?.height
                )
                return h ? `#${this.normalFormat(h)}` : '-'
              })(),
            },
            contractAction
              ? {
                  label: 'User',
                  address:
                    contractAction?.in?.[0]?.address ||
                    this.thorStatus?.tx?.from_address,
                  type: 'address',
                }
              : {
                  label: 'From',
                  address: this.thorStatus?.tx?.from_address,
                  type: 'address',
                },
            !contractAction
              ? {
                  label: 'To',
                  address:
                    outTxs?.[0]?.to_address || this.txMemo?.destAddr || null,
                  type: 'address',
                }
              : null,
          ]

          if (
            contractAction &&
            (contractActionType === 'Limit Order' ||
              contractActionType === 'Market Order')
          ) {
            const cEvents =
              contractAction.metadata?.contract?.contractEvents || []
            const toAttrs = (e) =>
              Object.fromEntries(
                (e.attributes || []).map(({ key, value }) => [key, value])
              )

            const firstTrade = cEvents.find(
              (e) => e.type === 'wasm-rujira-fin/trade'
            )
            if (firstTrade) {
              const pairAddr = toAttrs(firstTrade)._contract_address || ''
              const pairLabel =
                getRujiraContractLabel(pairAddr) || this.formatAddress(pairAddr)
              rows.push({ label: 'FIN Pair', value: pairLabel })
            }

            if (contractActionType === 'Limit Order') {
              const msg = contractAction.metadata?.contract?.msg || {}
              const fixedPrice = msg.order?.[0]?.[0]?.[1]?.fixed
              const side = msg.order?.[0]?.[0]?.[0]
              const orderWithdraw = cEvents.find(
                (e) => e.type === 'wasm-rujira-fin/order.withdraw'
              )
              const withdrawAttrs = orderWithdraw ? toAttrs(orderWithdraw) : {}
              const limitPrice =
                fixedPrice || withdrawAttrs.price?.split(':')?.[1] || null
              const orderSide = side || withdrawAttrs.side || null
              const fillAmount = withdrawAttrs.amount || null

              if (orderSide)
                rows.push({
                  label: 'Side',
                  value:
                    orderSide === 'quote'
                      ? 'Buy'
                      : orderSide === 'base'
                        ? 'Sell'
                        : orderSide,
                })
              if (limitPrice)
                rows.push({
                  label: 'Limit Price',
                  value: parseFloat(limitPrice).toPrecision(6),
                })
              if (fillAmount)
                rows.push({ label: 'Filled Amount', value: fillAmount })
            } else {
              const tradeEvents = cEvents.filter(
                (e) => e.type === 'wasm-rujira-fin/trade'
              )
              const avgRate = (() => {
                let wSum = 0
                let wTotal = 0
                tradeEvents.forEach((e) => {
                  const a = toAttrs(e)
                  const r = parseFloat(a.rate)
                  const w = parseInt(a.bid || 0)
                  if (!isNaN(r) && w > 0) {
                    wSum += r * w
                    wTotal += w
                  }
                })
                if (wTotal > 0) return (wSum / wTotal).toFixed(6)
                const rs = tradeEvents
                  .map((e) => parseFloat(toAttrs(e).rate))
                  .filter((r) => !isNaN(r))
                return rs.length
                  ? (rs.reduce((s, r) => s + r, 0) / rs.length).toFixed(6)
                  : null
              })()
              rows.push({
                label: 'CCL Fills',
                value: String(tradeEvents.length),
              })
              if (avgRate) rows.push({ label: 'Avg Rate', value: avgRate })
            }
          }

          return rows.filter(Boolean)
        })(),
        lifecycleRows: (() => {
          if (contractDisplay) {
            const userAddr =
              contractAction?.in?.[0]?.address ||
              this.thorStatus?.tx?.from_address ||
              ''
            const timeText = timeDisplay
            const contractFailed =
              (contractAction?.metadata?.contract?.code ?? 0) > 0
            const contractLogs = contractAction?.metadata?.contract?.logs
            return [
              {
                icon: 'ArrowIcon',
                iconRotate: 180,
                title: `${contractDisplay.inputName} sent to contract`,
                body: `${contractDisplay.inputAmount}${contractDisplay.inputUsd ? ` (${contractDisplay.inputUsd})` : ''} provided as input${userAddr ? ` from ${this.formatAddress(userAddr)}` : ''}.`,
                meta: [
                  timeText,
                  inboundHeight
                    ? `Block #${this.normalFormat(inboundHeight)}`
                    : '',
                ]
                  .filter(Boolean)
                  .join(' · '),
              },
              ...this.extractContractEventRows(contractAction),
              contractFailed
                ? {
                    icon: 'WarningIcon',
                    title: 'Contract execution failed',
                    body: contractLogs || '',
                  }
                : {
                    icon: 'ArrowIcon',
                    iconRotate: 0,
                    title: `${contractDisplay.outputName} delivered`,
                    body: `${contractDisplay.outputAmount}${contractDisplay.outputUsd ? ` (${contractDisplay.outputUsd})` : ''} sent to ${this.formatAddress(userAddr)}.`,
                    meta: outboundHeight
                      ? `Block #${this.normalFormat(outboundHeight)}`
                      : '',
                  },
            ]
          }
          return this.buildLifecycleRows({
            input,
            output,
            inboundHeight,
            outboundHeight,
            fromAddress: this.thorStatus?.tx?.from_address,
            destAddress:
              outTxs?.[0]?.to_address || this.txMemo?.destAddr || null,
            timeText: timeDisplay,
            action: contractAction,
          })
        })(),
        feeRows: (() => {
          const toRow = (label, formatted) => {
            const { usd, subtle } = this.splitFeeValue(formatted)
            return { label, usd, subtle }
          }

          if (contractDisplay) {
            const inUsd = contractDisplay.inputUsdRaw || 0
            const outUsd = contractDisplay.outputUsdRaw || 0
            const totalCost = inUsd - outUsd

            const rows = networkFees.map((value, i) =>
              toRow(i === 0 ? 'Network Fee' : `Network Fee ${i + 1}`, value)
            )

            const networkFeesUsd = rows.reduce(
              (sum, r) => sum + this.parseUsdAmount(r.usd),
              0
            )
            const dexCost = totalCost - networkFeesUsd
            if (dexCost > 0) {
              rows.push({
                label: 'DEX Cost',
                usd: `$${this.formatFeeDisplay(dexCost)}`,
                subtle: null,
              })
            }

            const totalPct =
              inUsd > 0 && totalCost > 0
                ? `${((totalCost / inUsd) * 100).toFixed(3)}% of swap value`
                : null
            rows.push({
              label: 'Total Fees Paid',
              usd: `$${this.formatFeeDisplay(Math.max(totalCost, 0))}`,
              subtle: totalPct,
              isTotal: true,
            })

            return rows
          }

          const rows = [
            ...networkFees.map((value, i) =>
              toRow(i === 0 ? 'Network Fee' : `Network Fee ${i + 1}`, value)
            ),
            // Fallback: outbound accordion has no 'Outbound Fee' stacks for native
            // RUNE outputs (no on-chain tx), so read from midgard metadata instead
            ...(networkFees.length === 0 && swapMeta?.networkFees?.length
              ? swapMeta.networkFees.map((fee, i) => {
                  const ticker = assetFromString(fee.asset)?.ticker || fee.asset
                  const amount = parseInt(fee.amount) || 0
                  const usdRaw = this.amountToUSD(fee.asset, amount, this.pools)
                  return {
                    label: i === 0 ? 'Network Fee' : `Network Fee ${i + 1}`,
                    usd: `$${this.formatFeeDisplay(usdRaw)}`,
                    subtle: `${this.baseAmountFormatOrZero(amount)} ${ticker}`,
                  }
                })
              : []),
            liquidityFee
              ? toRow('Liquidity Fee', liquidityFee)
              : (() => {
                  const amount = parseInt(swapMeta?.liquidityFee || '') || 0
                  if (!amount) return null
                  const usdRaw = this.amountToUSD(
                    'THOR.RUNE',
                    amount,
                    this.pools
                  )
                  return {
                    label: 'Liquidity Fee',
                    usd: `$${this.formatFeeDisplay(usdRaw)}`,
                    subtle: `${this.baseAmountFormatOrZero(amount)} RUNE`,
                  }
                })(),
            toRow('Affiliate Fee', interfaceFee || null),
          ].filter(Boolean)

          const totalUsd = rows.reduce(
            (sum, r) => sum + this.parseUsdAmount(r.usd),
            0
          )
          const inputUsdNum = nonContractInUsdRaw
          const totalPct =
            inputUsdNum > 0
              ? `${((totalUsd / inputUsdNum) * 100).toFixed(3)}% of swap value`
              : null

          rows.push({
            label: 'Total Fees Paid',
            usd: `$${this.formatFeeDisplay(totalUsd)}`,
            subtle: totalPct,
            isTotal: true,
          })

          return rows
        })(),
        technicalRows: [
          contractAction
            ? this.buildTechRow(
                'From',
                contractAction?.in?.[0]?.address ||
                  this.thorStatus?.tx?.from_address,
                'address'
              )
            : null,
          contractAction
            ? this.buildTechRow(
                'To',
                contractAction?.out?.[0]?.address ||
                  outTxs?.[0]?.to_address ||
                  this.txMemo?.destAddr,
                'address'
              )
            : null,
          this.buildTechRow(
            'Memo',
            contractAction?.metadata?.contract?.memo ||
              midgardSwap?.metadata?.swap?.memo ||
              refundAction?.metadata?.refund?.memo
          ),
          this.buildTechRow(
            'Inbound stage',
            this.formatStackValue(
              this.getInboundStages({
                done: this.thorStatus?.stages?.inbound_finalised?.completed,
                inboundConfCount:
                  this.thorStatus?.stages?.inbound_confirmation_counted,
                observationsCompleted:
                  this.thorStatus?.stages?.inbound_observed?.completed,
              })
            )
          ),
          this.buildTechRow('Exchange rate', rate),
          this.buildTechRow('Affiliate basis', affiliateBasis),
          this.buildTechRow(
            'Limit',
            this.txMemo?.limit
              ? this.txMemo.limit > 0
                ? `${this.txMemo.limit / 1e8} ${this.showAsset(this.parseMemoAsset(this.txMemo?.asset))}`
                : 'No target limit'
              : null
          ),
        ].filter(Boolean),
      }
    },
    contractOverview() {
      if (!this.rawActions?.length) return null

      // Applies when all actions are contract, or contract + refund combination
      const contractActions = this.rawActions.filter(
        (a) => a.type === 'contract'
      )
      if (contractActions.length === 0) return null

      const ctx = this.getContractOverviewContext(contractActions)

      // DAO proposal execution and Order Book Clearing operate on the whole
      // contractActions array and are checked before the mixed-action guard
      // below (a DAO proposal can trigger other action types, e.g. a swap,
      // as a side effect).
      for (const build of CONTRACT_PRE_GUARD_BUILDERS) {
        const result = build(ctx)
        if (result) return result
      }

      // FIN market swaps may co-occur with a THORChain swap action (e.g.
      // USDC→RUNE as a funding hop) — ctx.hasFINMarketContract is checked
      // before this guard so they aren't silently suppressed in favour of
      // the companion swap overview.
      if (
        !ctx.hasFINMarketContract &&
        this.rawActions.some(
          (a) => a.type !== 'contract' && a.type !== 'refund'
        )
      )
        return null

      // Every remaining product keys off a single contract action
      // (ctx.singleAction) — when there's more than one, none of them can
      // match, matching the pre-extraction behavior exactly.
      for (const build of CONTRACT_SINGLE_ACTION_BUILDERS) {
        const result = build(ctx)
        if (result) return result
      }

      // Generic CALC aggregate fallback — reads ctx.rawActions directly and
      // has its own internal guard, always runs last.
      return buildCalcAggregateOverview(ctx)
    },
  },
  watch: {
    // BondHero's rail (node status/total-bond/provider-count/next-churn)
    // and MimirVoteHero's voter panel (active/bond chips) both need a live
    // node lookup neither builder fetches itself. Keyed on the resolved
    // node address so a re-render (e.g. the pending poll in mounted())
    // doesn't refetch once it's already loaded. A page only ever has one of
    // bondOverview/mimirOverview active at a time, so sharing one
    // nodeSnapshot field between the two watchers is safe.
    bondOverview: {
      immediate: true,
      handler(overview) {
        const nodeAddress = overview?.nodeAddress
        if (nodeAddress && nodeAddress !== this.nodeSnapshotAddress) {
          this.fetchNodeSnapshot(nodeAddress)
        }
      },
    },
    mimirOverview: {
      immediate: true,
      handler(overview) {
        const nodeAddress = overview?.nodeAddress
        if (nodeAddress && nodeAddress !== this.nodeSnapshotAddress) {
          this.fetchNodeSnapshot(nodeAddress)
        }
        if (overview?.key && overview.key !== this.mimirConsensusKey) {
          this.fetchMimirConsensus(overview.key, overview.value)
        }
      },
    },
    // streamingOverview itself reads this.streamingProgress (via
    // buildStreamingProgress), which fetchStreamingProgress below writes to
    // — so every fetch response makes streamingOverview recompute into a
    // new object, which re-fires this watcher, which fetches again
    // immediately. Without the timestamp guard below that's a runaway
    // self-triggering loop (back-to-back requests as fast as the network
    // round-trip allows), not the page's 5s poll cadence — confirmed via a
    // real tx firing requests milliseconds apart. The guard throttles to
    // one fetch per 3s per hash while still picking up a hash change
    // (navigating to a different streaming tx) immediately.
    streamingOverview: {
      immediate: true,
      handler(overview) {
        // Once phase is 'outbound' the streaming-status endpoint only
        // returns zeroed data (it tracks active streams only) — nothing
        // useful to fetch, and buildStreamingProgress ignores it in that
        // phase anyway.
        if (!overview?.hash || overview.phase !== 'streaming') return
        const now = Date.now()
        if (
          overview.hash !== this.streamingProgressHash ||
          now - this.streamingProgressFetchedAt >= 3000
        ) {
          this.streamingProgressHash = overview.hash
          this.streamingProgressFetchedAt = now
          this.fetchStreamingProgress(overview.hash)
        }
      },
    },
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
    // Builds the ctx object every pages/tx/state/contract/*.js module
    // receives: the derived contractActions/singleAction/hasFINMarketContract
    // values every branch used to compute inline, plus every shared helper
    // method those branches call, bound so the modules can call
    // ctx.<helper>(...) without needing a `this`.
    getContractOverviewContext(contractActions) {
      const hasFINMarketContract = contractActions.some((a) => {
        if (a.metadata?.contract?.msg?.swap) return true
        return (a.metadata?.contract?.contractEvents || []).some(
          (e) => e.type === 'wasm-rujira-fin/trade'
        )
      })
      return {
        contractActions,
        singleAction: contractActions.length === 1 ? contractActions[0] : null,
        rawActions: this.rawActions,
        pools: this.pools,
        hasFINMarketContract,
        buildTechRow: this.buildTechRow.bind(this),
        formatAddress: this.formatAddress.bind(this),
        formatUsdValue: this.formatUsdValue.bind(this),
        amountToUSD: this.amountToUSD.bind(this),
        getNetworkBadge: this.getNetworkBadge.bind(this),
        baseAmountFormatOrZero: this.baseAmountFormatOrZero.bind(this),
        normalFormat: this.normalFormat.bind(this),
        getProductTone: this.getProductTone.bind(this),
        getContractTypeTone: this.getContractTypeTone.bind(this),
        formatFeeDisplay: this.formatFeeDisplay.bind(this),
        parseUsdAmount: this.parseUsdAmount.bind(this),
        parseMemoAsset: this.parseMemoAsset.bind(this),
        extractContractEventRows: this.extractContractEventRows.bind(this),
      }
    },
    async fetchNodeSnapshot(nodeAddress) {
      this.nodeSnapshotAddress = nodeAddress
      try {
        const { data } = await this.$api.getNodeInfo(nodeAddress)
        this.nodeSnapshot = data?.node || data
      } catch (error) {
        try {
          const { data } = await this.$api.getNode(nodeAddress)
          this.nodeSnapshot = data
        } catch (fallbackError) {
          console.error('Failed to fetch node snapshot:', fallbackError)
        }
      }
      if (!this.networkInfo) {
        try {
          const { data } = await this.$api.getNetwork()
          this.networkInfo = data
        } catch (error) {
          console.error('Failed to fetch network info:', error)
        }
      }
    },
    // StreamingSwapHero's live progress (count/quantity/interval/in/out/
    // deposit) — the same endpoint the old always-mounted streamingSwap.vue
    // already polls independently; this fetch is separate from (and
    // doesn't touch) that component. No dedicated setInterval here: the
    // page's own mounted() poll already refetches the whole tx every 5s
    // while pending, which recomputes streamingOverview and re-triggers
    // this watcher — piggybacking on that existing cadence.
    async fetchStreamingProgress(hash) {
      try {
        const { data } = await this.$api.getStreamingTxStatus(hash)
        this.streamingProgress = data
      } catch (error) {
        console.error('Failed to fetch streaming progress:', error)
      }
    },
    // Live count/quantity/fill/remaining-time/swapped-so-far for
    // streamingOverview — falls back to the accordion snapshot
    // (count/quantity only, no in/remaining) until fetchStreamingProgress
    // resolves. Remaining-blocks formula matches the one already proven in
    // pages/tx/components/streamingSwap.vue's updateStreamingDetail: for a
    // nonzero interval, the window is interval*quantity from the stream's
    // own start height (not "now"), so it doesn't drift as more chunks
    // land; a zero interval (rapid swap) just counts remaining chunks.
    buildStreamingProgress(
      { snapshotCount, snapshotQuantity, phase },
      inputAsset,
      output
    ) {
      const outputAsset = output.asset
      // Once streaming itself is done (phase 'outbound'), THORNode's
      // streaming-status endpoint returns zeroed data (it only tracks
      // ACTIVE streams) — using it here would show "0 swapped so far" for
      // a swap that's actually fully executed. The accordion snapshot
      // (refreshed every 5s by the page's own pending-poll regardless of
      // this hero) is always accurate for count/quantity, so just use that
      // directly and skip the live in/out/remaining-time fields entirely.
      if (phase === 'outbound') {
        return {
          count: snapshotCount,
          quantity: snapshotQuantity,
          fillPercent: 100,
          remainingDisplay: null,
          swappedSoFarDisplay: null,
          outputSoFarRaw: null,
          outputSoFarDisplay: null,
          outputSoFarUsdDisplay: null,
        }
      }

      const raw = this.streamingProgress
      const count = raw ? Number(raw.count) || 0 : snapshotCount
      const quantity = raw
        ? Number(raw.quantity) || snapshotQuantity
        : snapshotQuantity
      const fillPercent = quantity ? Math.min((count / quantity) * 100, 100) : 0

      let remainingDisplay = null
      let swappedSoFarDisplay = null
      // raw.out is the live PARTIAL output accumulated from completed
      // sub-swaps so far — distinct from (and much smaller than, mid-
      // stream) the accordion's output.amount, which is
      // swapMetadata.streamingSwapMeta.outEstimation: the swap's full
      // projected FINAL total, computed once at swap creation. Confirmed
      // against a real in-progress stream where outEstimation already
      // showed ~8,000 USDT (the full projected swap) while raw.out (what
      // had actually landed from the 13 completed sub-swaps) was ~1,220 —
      // using outEstimation here would have overstated progress ~6.5x.
      let outputSoFarRaw = null
      if (raw) {
        const interval = Number(raw.interval) || 0
        const initialHeight = Number(raw.initial_height) || 0
        const currentHeight = this.chainsHeight?.THOR
        const blockDuration =
          currentHeight && initialHeight ? currentHeight - initialHeight : null
        const remainingBlocks = Math.max(
          interval > 0 && Number.isFinite(blockDuration)
            ? interval * quantity - blockDuration
            : (interval || 1) * (quantity - count),
          0
        )
        if (remainingBlocks > 0) {
          remainingDisplay = moment
            .duration(remainingBlocks * this.blockSeconds('THOR'), 'seconds')
            .humanize()
        }
        if (raw.in) {
          swappedSoFarDisplay = `${this.baseAmountFormatOrZero(raw.in)} ${this.showTicker(inputAsset)} swapped so far`
        }
        // raw.out is a string — "0" (a genuine, valid zero, e.g. right
        // between sub-swap settlements) is truthy as a string, so this
        // check alone is enough; `Number(raw.out) || null` would have been
        // the actual bug (0 is falsy as a number, silently discarding a
        // real zero and leaving the panel blank instead of showing 0).
        if (raw.out != null && raw.out !== '') {
          outputSoFarRaw = Number(raw.out)
        }
      }

      return {
        count,
        quantity,
        fillPercent,
        remainingDisplay,
        swappedSoFarDisplay,
        outputSoFarRaw,
        outputSoFarDisplay:
          outputSoFarRaw != null
            ? `${this.baseAmountFormatOrZero(outputSoFarRaw)} ${this.showTicker(outputAsset)}`
            : null,
        // Scaled off output.amountUSD (the projected total's already-correct
        // Midgard-priced USD value, outPriceUSD-based) rather than re-pricing
        // via amountToUSD/pools: pool lookups match on the exact asset
        // string including any contract suffix (e.g. an ERC20/TRC20 token's
        // "-0x..." address), and outputAsset here often doesn't carry one —
        // that silently priced at $0 for a real in-progress TRON.USDT stream
        // even though outputProjectedUsdDisplay (Midgard-sourced) was fine.
        outputSoFarUsdDisplay:
          outputSoFarRaw != null && +output.amount > 0
            ? this.formatUsdValue(
                (outputSoFarRaw / +output.amount) * (+output.amountUSD || 0)
              )
            : null,
      }
    },
    async fetchMimirConsensus(key, value) {
      this.mimirConsensusKey = key
      try {
        const [votesRes, mimirRes, nodesRes] = await Promise.all([
          this.$api.getVotes(),
          this.$api.getMimir(),
          this.$api.getNodes(),
        ])
        this.mimirConsensus = computeMimirConsensus({
          votes: votesRes?.data,
          mimirData: mimirRes?.data,
          nodes: nodesRes?.data,
          key,
          value,
        })
      } catch (error) {
        console.error('Failed to fetch mimir consensus:', error)
      }
    },
    getOverviewStatus(middle = {}) {
      if (middle.fail) {
        return { label: 'Failed', tone: 'red' }
      }
      if (middle.pending) {
        return { label: 'Pending', tone: 'yellow' }
      }
      return { label: 'Success', tone: 'green' }
    },
    formatStackValue(value) {
      if (Array.isArray(value)) {
        return value
          .map((item) => item?.text || '')
          .filter(Boolean)
          .join(' · ')
      }
      if (value == null || value === '') return ''
      return `${value}`
    },
    formatAssetAmount(amount, asset) {
      const formattedAmount = `${this.baseAmountFormatOrZero(amount)}`
      const numericAmount = Number(formattedAmount.replace(/,/g, ''))
      // Bare ticker, not chain.ticker — the network's already shown by the
      // panel's own badge chip, so repeating it here (e.g. "458,000
      // ETH.USDT" instead of "458,000 USDT") is redundant.
      if (!Number.isFinite(numericAmount)) {
        return `${formattedAmount} ${this.showTicker(asset)}`
      }
      // Use enough decimals so small amounts (e.g. 0.00217 BTC) aren't rounded to 0
      const maxDecimals = numericAmount > 0 && numericAmount < 0.01 ? 8 : 2
      const displayAmount = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxDecimals,
      }).format(numericAmount)
      return `${displayAmount} ${this.showTicker(asset)}`
    },
    formatUsdValue(value) {
      const raw = `${value ?? ''}`.trim()
      const numeric = Number(raw)

      if (
        value == null ||
        raw === '' ||
        /nan|infinity/i.test(raw) ||
        !Number.isFinite(numeric)
      ) {
        return '$0'
      }

      return this.formatCurrency(numeric)
    },
    // Splits "MAIN (TRAILING)" into its two parts, e.g. "08/15/2026 1:41 PM
    // (12 minutes ago)" -> { main: '08/15/2026 1:41 PM', paren: '(12 minutes
    // ago)' }, or "0.02 RUNE ($0.03)" -> { main: '0.02 RUNE', paren:
    // '($0.03)' }. Unlike splitFeeValue, the parenthetical isn't required to
    // start with '$' — used for both the muted relative-time suffix and for
    // stripping a USD amount back off a combined display string.
    splitTrailingParen(str) {
      if (!str) return { main: '', paren: '' }
      const match = str.match(/^(.*?)\s*(\([^)]*\))\s*$/)
      if (!match) return { main: str, paren: '' }
      return { main: match[1], paren: match[2] }
    },
    // camelCase() (the global mixin) only spaces camelCase words (e.g.
    // "tradeWithdraw" -> "trade Withdraw"), it doesn't capitalize — fine for
    // the legacy card title it was built for, not for a hero's eyebrow/H1.
    capitalizeFirst(str) {
      if (!str) return str
      return str.charAt(0).toUpperCase() + str.slice(1)
    },
    splitFeeValue(str) {
      if (!str) return { usd: '$0.00', subtle: null }
      // Try "amount ASSET ($X.XX)" format (e.g. "0.02 RUNE ($1.23)")
      const parenMatch = str.match(/^(.*?)\s*\((\$[^)]+)\)\s*$/)
      if (parenMatch) {
        return { usd: parenMatch[2], subtle: parenMatch[1].trim() || null }
      }
      // Try " · " separated (e.g. "0.02 RUNE · $1.23")
      const parts = str.split(' · ').map((p) => p.trim())
      if (parts.length > 1) {
        const usdPart = parts.find((p) => /^\$/.test(p))
        const rest = parts.filter((p) => !/^\$/.test(p))
        return {
          usd: usdPart || '$0.00',
          subtle: rest.length ? rest.join(' · ') : null,
        }
      }
      // Plain "$X.XX"
      if (/^\$/.test(str.trim())) return { usd: str.trim(), subtle: null }
      return { usd: '$0.00', subtle: str }
    },
    parseUsdAmount(usdStr) {
      return parseFloat((usdStr || '').replace(/[^0-9.-]/g, '')) || 0
    },
    formatFeeDisplay(value) {
      if (value === null || value === undefined || value === '') return ''

      const cleaned = String(value)
        .replace(/\(\$?NaN\)/gi, '')
        .replace(/\bTHOR\.([A-Z0-9-]+)\b/g, '$1')
        .replace(/\s+/g, ' ')
        .trim()

      const match = cleaned.match(
        /^([+-]?(?:\d+\.?\d*|\d*\.?\d+)(?:e[+-]?\d+)?)(.*)$/i
      )

      if (!match) return cleaned

      const numeric = Number(match[1])
      if (!Number.isFinite(numeric)) return cleaned

      const abs = Math.abs(numeric)
      const maximumFractionDigits =
        abs === 0 ? 2 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 8

      const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits,
      }).format(numeric)

      return `${formatted}${match[2]}`.trim()
    },
    getAssetDisplayName(asset) {
      if (!asset) return '-'
      const parsed = assetFromString(asset)
      const chainNames = {
        BTC: 'Bitcoin',
        BCH: 'Bitcoin Cash',
        ETH: 'Ethereum',
        LTC: 'Litecoin',
        BNB: 'Binance Coin',
        BSC: 'Binance Smart Chain',
        DOGE: 'Dogecoin',
        SOL: 'Solana',
        AVAX: 'Avalanche',
        GAIA: 'Cosmos',
        BASE: 'Base',
        THOR: parsed.ticker === 'RUNE' ? 'RUNE' : parsed.ticker,
      }
      if (
        parsed.ticker === parsed.chain ||
        (parsed.chain === 'THOR' && parsed.ticker === 'RUNE')
      ) {
        return chainNames[parsed.chain] || parsed.ticker
      }
      return parsed.ticker
    },
    getNetworkBadge(asset) {
      if (!asset) return '-'
      if (asset.trade) return 'Trade network'
      if (asset.secure) return 'Secure network'
      if (asset.synth) return 'Synth network'
      if (asset.chain === 'THOR') return 'THORChain network'
      return `${this.getAssetDisplayName(`${asset.chain}.${asset.chain}`)} network`
    },
    getSwapActionLabel(inputAsset, outputAsset) {
      if (
        inputAsset?.chain &&
        outputAsset?.chain &&
        inputAsset.chain !== outputAsset.chain
      ) {
        return 'Cross-chain Swap'
      }
      return 'Swap'
    },
    getContractActionType(contractAction) {
      if (!contractAction) return null
      if (contractAction.metadata?.contract?.memo === 'OB Clearing')
        return 'OB Clearing'
      const msg = contractAction.metadata?.contract?.msg || {}
      if (msg.order) return 'Limit Order'
      if (msg.swap) return 'Market Order'
      if (msg.cancel_instance) return 'Cancel Strategy'
      if (!Array.isArray(msg.execute) && msg.execute?.proposal_id !== undefined)
        return 'Execute Proposal'
      if (Array.isArray(msg.execute)) return 'Execute Strategies'
      if (msg.liquidate) return 'Liquidation'
      if (msg.liquid && 'bond' in msg.liquid) return 'Liquid Stake'
      if (msg.liquid && 'unbond' in msg.liquid) return 'Liquid Unstake'
      if ('withdraw' in msg) return 'Ghost Vault Withdraw'
      if ('deposit' in msg) return 'Ghost Vault Deposit'
      if (msg.reset_instance) return 'Reset Instance'
      if (msg.account?.claim !== undefined) return 'Claim Rewards'
      if (msg.account && 'bond' in msg.account) return 'Yielding Stake'
      if (msg.account && 'unbond' in msg.account) return 'Yielding Unstake'
      if (msg.account) return 'Credit Account'
      if (msg.range?.create) return 'CCL Range'
      if (msg.range?.claim) return 'Claim Yield'
      const events = contractAction.metadata?.contract?.contractEvents || []
      if (events.some((e) => e.type === 'wasm-calc-manager/strategy.execute'))
        return 'CALC Strategy'
      if (events.some((e) => e.type === 'wasm-rujira-fin/trade'))
        return 'Market Order'
      return null
    },
    getContractTypeTone(type) {
      if (type === 'OB Clearing') return 'blue'
      if (type === 'Scale Order') return 'gold'
      if (type === 'Limit Order') return 'gold'
      if (type === 'Execute Proposal') return 'blue'
      if (type === 'Market Order') return 'blue'
      if (type === 'CALC Strategy') return 'purple'
      if (type === 'Cancel Strategy') return 'red'
      if (type === 'Liquidation') return 'red'
      if (type === 'Liquid Stake') return 'green'
      if (type === 'Liquid Unstake') return 'red'
      if (type === 'Ghost Vault Deposit') return 'green'
      if (type === 'Ghost Vault Withdraw') return 'blue'
      if (type === 'Reset Instance') return 'blue'
      if (type === 'Claim Rewards') return 'green'
      if (type === 'Yielding Stake') return 'green'
      if (type === 'Yielding Unstake') return 'red'
      if (type === 'Credit Account') return 'purple'
      if (type === 'CCL Range') return 'green'
      if (type === 'Claim Yield') return 'green'
      return 'green'
    },
    getSwapProductLabel(action) {
      const outAddress = action?.out?.find((e) => e.address)?.address || ''
      const inAddress = action?.in?.find((e) => e.address)?.address || ''
      const product =
        getRujiraContractProduct(outAddress) ||
        getRujiraContractProduct(inAddress) ||
        getRujiraContractProduct(
          action?.metadata?.contract?.attributes?.contract
        ) ||
        ''
      if (!product) return 'THORChain'
      const lower = product.toLowerCase()
      if (/ruji|rujira/.test(lower)) {
        if (/borrow|secure|collateral|loan/.test(lower)) return 'RUJI Borrow'
        if (/pool|liquidity/.test(lower)) return 'RUJI Pools'
        if (/merge/.test(lower)) return 'RUJI Merge'
        return 'RUJI Trade'
      }
      if (/tcy/.test(lower)) return 'TCY'
      return product
    },
    getProductTone(label) {
      const l = (label || '').toLowerCase()
      if (/ruji|rujira/.test(l)) return 'blue'
      if (/tcy/.test(l)) return 'gold'
      if (/contract/.test(l)) return 'purple'
      return 'green'
    },
    buildTechRow(label, value, kind) {
      if (!value) return null
      if (kind === 'address') {
        return { label, address: value, type: 'address' }
      }
      return { label, value }
    },
    extractContractEventRows(contractAction) {
      const events = contractAction?.metadata?.contract?.contractEvents || []
      if (!events.length) return []

      const toAttrs = (e) =>
        Object.fromEntries(
          (e.attributes || []).map(({ key, value }) => [key, value])
        )

      const weightedAvgRate = (fills) => {
        let wSum = 0
        let wTotal = 0
        fills.forEach((a) => {
          const r = parseFloat(a.rate)
          const w = parseInt(a.bid || 0)
          if (!isNaN(r) && w > 0) {
            wSum += r * w
            wTotal += w
          }
        })
        if (wTotal > 0) return (wSum / wTotal).toFixed(6)
        const rs = fills.map((a) => parseFloat(a.rate)).filter((r) => !isNaN(r))
        return rs.length
          ? (rs.reduce((s, r) => s + r, 0) / rs.length).toFixed(6)
          : null
      }

      const rows = []

      // Strategy dispatch
      const strategyEvents = events.filter(
        (e) => e.type === 'wasm-calc-manager/strategy.execute'
      )
      if (strategyEvents.length) {
        const executorAddr = toAttrs(strategyEvents[0]).executor || ''
        const executorLabel =
          getRujiraContractLabel(executorAddr) ||
          this.formatAddress(executorAddr)
        const n = strategyEvents.length
        rows.push({
          icon: 'SwapIcon',
          iconRotate: 0,
          title: `${n} ${n === 1 ? 'strategy' : 'strategies'} dispatched`,
          body: `CALC Manager executed ${n} ${n === 1 ? 'strategy' : 'strategies'} via ${executorLabel}.`,
        })
      }

      // FIN trades — split by fill type per pair: CCL (local range liquidity),
      // Virtualisation (filled via a thor1… strategy address), other (resting limit orders)
      const finTradeEvents = events.filter(
        (e) => e.type === 'wasm-rujira-fin/trade'
      )
      if (finTradeEvents.length) {
        const byPair = {}
        finTradeEvents.forEach((e) => {
          const attrs = toAttrs(e)
          const addr = attrs._contract_address || ''
          if (!byPair[addr]) byPair[addr] = { ccl: [], virtual: [], other: [] }
          const price = String(attrs.price || '')
          if (price.startsWith('ccl:')) byPair[addr].ccl.push(attrs)
          else if (price.startsWith('thor1')) byPair[addr].virtual.push(attrs)
          else byPair[addr].other.push(attrs)
        })
        Object.entries(byPair).forEach(([addr, { ccl, virtual, other }]) => {
          const pairLabel =
            getRujiraContractLabel(addr) || this.formatAddress(addr)

          if (ccl.length) {
            const avgRate = weightedAvgRate(ccl)
            rows.push({
              icon: 'ExchangeIcon',
              iconRotate: 0,
              title: `CCL fills: ${pairLabel}`,
              body: [
                `${ccl.length} fill${ccl.length !== 1 ? 's' : ''} from local range liquidity`,
                avgRate ? `avg rate ${avgRate}` : null,
              ]
                .filter(Boolean)
                .join(' · '),
            })
          }

          if (virtual.length) {
            const stratAddr = String(virtual[0].price || '').split(':')[0]
            const stratLabel = this.formatAddress(stratAddr)
            const avgRate = weightedAvgRate(virtual)
            rows.push({
              icon: 'ExchangeIcon',
              iconRotate: 0,
              title: `Virtualisation fills: ${pairLabel}`,
              body: [
                `${virtual.length} fill${virtual.length !== 1 ? 's' : ''} via ${stratLabel}`,
                avgRate ? `avg rate ${avgRate}` : null,
              ]
                .filter(Boolean)
                .join(' · '),
            })
          }

          if (other.length) {
            const avgRate = weightedAvgRate(other)
            rows.push({
              icon: 'ExchangeIcon',
              iconRotate: 0,
              title: `Limit order fills: ${pairLabel}`,
              body: [
                `${other.length} fill${other.length !== 1 ? 's' : ''}`,
                avgRate ? `avg rate ${avgRate}` : null,
              ]
                .filter(Boolean)
                .join(' · '),
            })
          }
        })
      }

      // Helper: find a coin_spent event near a given event index that matches amount
      const findCoinDenom = (targetEvent, fallbackAmount) => {
        const idx = events.indexOf(targetEvent)
        // Look at coin_spent events within a small window around the target
        const window = events.slice(Math.max(0, idx - 6), idx + 6)
        const match = window.find((ev) => {
          if (ev.type !== 'coin_spent') return false
          const a = toAttrs(ev).amount || ''
          return fallbackAmount && a.startsWith(fallbackAmount)
        })
        return match ? toAttrs(match).amount : fallbackAmount
      }

      // Ghost Vault: repay outstanding debts before borrowing
      const repayEvents = events.filter(
        (e) => e.type === 'wasm-rujira-ghost-vault/repay'
      )
      repayEvents.forEach((e) => {
        const attrs = toAttrs(e)
        const vaultAddr = attrs._contract_address || ''
        const vaultLabel =
          getRujiraContractLabel(vaultAddr) || this.formatAddress(vaultAddr)
        const amountWithDenom = findCoinDenom(e, attrs.amount)
        rows.push({
          icon: 'RefreshIcon',
          iconRotate: 180,
          title: 'Ghost Vault: outstanding debt repaid',
          body: [
            amountWithDenom ? `Repaid ${amountWithDenom}` : null,
            vaultLabel ? `to ${vaultLabel}` : null,
          ]
            .filter(Boolean)
            .join(' '),
        })
      })

      // Ghost Vault: borrow funds to execute the virtualisation swap portion
      const borrowEvents = events.filter(
        (e) => e.type === 'wasm-rujira-ghost-vault/borrow'
      )
      borrowEvents.forEach((e) => {
        const attrs = toAttrs(e)
        const vaultAddr = attrs._contract_address || ''
        const vaultLabel =
          getRujiraContractLabel(vaultAddr) || this.formatAddress(vaultAddr)
        const amountWithDenom = findCoinDenom(e, attrs.amount)
        rows.push({
          icon: 'RefreshIcon',
          iconRotate: 0,
          title: 'Ghost Vault: funds borrowed for virtualisation',
          body: [
            amountWithDenom ? `Borrowed ${amountWithDenom}` : null,
            vaultLabel ? `from ${vaultLabel}` : null,
          ]
            .filter(Boolean)
            .join(' '),
        })
      })

      // Virtualisation: THORChain base layer swap settles the outstanding fills
      const virtualSwapEvents = events.filter(
        (e) => e.type === 'wasm-rujira-thorchain-swap/swap'
      )
      virtualSwapEvents.forEach((e) => {
        const attrs = toAttrs(e)
        const amountIn = attrs.amount || ''
        const returned = attrs.returned || attrs.quote_return || ''
        rows.push({
          icon: 'SwapIcon',
          iconRotate: 0,
          title: 'Virtualisation: THORChain base layer swap',
          body: [
            amountIn ? `in ${amountIn}` : null,
            returned ? `out ${returned}` : null,
          ]
            .filter(Boolean)
            .join(' → '),
        })
      })

      // Limit order settled (withdraw)
      const orderWithdrawEvents = events.filter(
        (e) => e.type === 'wasm-rujira-fin/order.withdraw'
      )
      orderWithdrawEvents.forEach((e) => {
        const attrs = toAttrs(e)
        const priceStr = attrs.price || ''
        const priceVal = priceStr.split(':')[1] || priceStr
        rows.push({
          icon: 'CheckIcon',
          iconRotate: 0,
          title: 'Limit order settled',
          body: [
            attrs.amount ? `${attrs.amount} filled` : null,
            priceVal ? `at price ${parseFloat(priceVal).toFixed(6)}` : null,
          ]
            .filter(Boolean)
            .join(' '),
        })
      })

      // CCL range creation
      const rangeCreateEvents = events.filter(
        (e) => e.type === 'wasm-rujira-fin/range.create'
      )
      if (rangeCreateEvents.length) {
        const attrs0 = toAttrs(rangeCreateEvents[0])
        const low = attrs0.low || ''
        const high = attrs0.high || ''
        const n = rangeCreateEvents.length
        rows.push({
          icon: 'ExchangeIcon',
          iconRotate: 0,
          title: `${n} CCL range${n !== 1 ? 's' : ''} created`,
          body: low && high ? `Price range ${low}–${high}` : '',
        })
      }

      return rows
    },
    // Raw-data equivalent of the accordion-stack args this used to read
    // (actionStacks/inboundStacks/outboundStacks) — swapOverview is the only
    // caller, migrated off `this.cards` onto thorStatus/rawActions directly.
    // The 'Rate' meta on the middle row is preserved as always-empty: the
    // legacy 'Rate' stack's value was an array of plain strings, and
    // formatStackValue's array branch only ever reads an item's `.text`
    // (absent here), so it always formatted to '' — never actually
    // displayed anything.
    buildLifecycleRows({
      input,
      output,
      inboundHeight,
      outboundHeight,
      fromAddress,
      destAddress,
      timeText,
      action,
    }) {
      const rows = []
      rows.push({
        icon: 'ArrowIcon',
        iconRotate: 180,
        title: `${this.getAssetDisplayName(input.asset)} received by THORChain`,
        body: `${this.formatAssetAmount(input.amount, input.asset)} entered the swap flow from ${this.formatAddress(fromAddress)}.`,
        meta: [
          timeText,
          inboundHeight ? `Block #${this.normalFormat(inboundHeight)}` : '',
        ]
          .filter(Boolean)
          .join(' · '),
      })
      rows.push(...this.extractContractEventRows(action))
      rows.push({
        icon: 'ExchangeIcon',
        iconRotate: 0,
        title: 'Swap executed',
        body: `${this.getSwapProductLabel(action)} converted ${this.getAssetDisplayName(input.asset)} to ${this.getAssetDisplayName(output.asset)} at the current exchange rate.`,
        meta: '',
      })
      rows.push({
        icon: 'ArrowIcon',
        iconRotate: 0,
        title: `${this.getAssetDisplayName(output.asset)} delivered`,
        body: `${this.formatAssetAmount(output.amount, output.asset)} was sent to ${this.formatAddress(destAddress)}.`,
        meta: outboundHeight
          ? `Block #${this.normalFormat(outboundHeight)}`
          : '',
      })
      return rows
    },
    // TODO: check hash in saver with streaming
    async fetchTx(hash) {
      if (!this.pools) {
        const pools = (
          await this.$api.getPools().catch((e) => {
            console.error(e)
            this.error.message =
              "Can't load pool data. Please try again in a moment."
          })
        )?.data

        if (pools) {
          this.$store.commit('setPools', pools)
          await this.$nextTick()
        } else {
          return true
        }
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
        hash = swapAction.in?.[0]?.txID
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

      const nt = md?.actions?.find((a) => a.type === 'send')
      // Fall back to the tx-status memo: for early inbound-stage txs the THORNode
      // detail endpoint (td) isn't populated yet, but getTxStatus (ts) is.
      const memo = this.parseMemo(td?.tx?.tx?.memo || ts?.tx?.memo)
      // TODO: add proper error handling
      if (nt && (!memo.type || memo.type === 'unknown')) {
        this.createNativeTx(nt)
        this.isLoading = false
        return false
      } else {
        if (tdh) {
          this.thorHeight = parseInt(tdh['x-thorchain-height'] ?? 0)
        }
        this.createTxState(md, td, ts, tdh, this.pools).finally(() => {
          this.isLoading = false
        })
        return this.isTxInPending(ts, md)
      }
    },
    isTxInPending(thorStatus, actions) {
      const memo = this.parseMemo(thorStatus?.tx?.memo)

      const userAddresses = new Set([
        thorStatus?.tx?.from_address?.toLowerCase(),
        // destAddr can be a dual-destination memo (PRIMARY/REFUND) — split so
        // both addresses are recognized as belonging to the user.
        ...(memo.destAddr?.split('/').map((a) => a.toLowerCase()) ?? []),
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
        outTxs?.length > 0 ? outTxs[0]?.coins?.[0]?.asset : memo?.asset,
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
    // Remaining THOR blocks until the scheduled outbound (negative = past due).
    // Returns undefined when the outbound is already signed, so the absolute
    // schedule height never renders as a bogus multi-year ETA.
    // Prefers blocks_since_scheduled from the status endpoint — it is computed
    // server-side and avoids a separate current-height lookup; without it we
    // fall back to scheduled_outbound_height minus the local chain height.
    getScheduledOutboundETA(thorStatus) {
      const outboundSigned = thorStatus?.stages?.outbound_signed
      if (
        !outboundSigned?.scheduled_outbound_height ||
        outboundSigned.completed
      ) {
        return undefined
      }
      // blocks_since_scheduled directly tells us how many blocks past the
      // scheduled height we are; negate it so negative = overdue (ETA <= 0).
      if (outboundSigned.blocks_since_scheduled != null) {
        return -outboundSigned.blocks_since_scheduled
      }
      const currentHeight = this.thorHeight || this.chainsHeight?.THOR
      if (!currentHeight) {
        return undefined
      }
      return outboundSigned.scheduled_outbound_height - currentHeight
    },
    getBuilderContext() {
      return {
        parseMemo: this.parseMemo.bind(this),
        parseMemoAsset: this.parseMemoAsset.bind(this),
        pools: this.pools,
      }
    },
    getOutboundStatusContext() {
      return {
        getScheduledOutboundETA: this.getScheduledOutboundETA.bind(this),
        blockSeconds: this.blockSeconds.bind(this),
      }
    },
    getCardContext() {
      return {
        amountToUSD: this.amountToUSD.bind(this),
        formatAddress: this.formatAddress.bind(this),
        showAsset: this.showAsset.bind(this),
        formatCurrency: this.formatCurrency.bind(this),
        formatSmallCurrency: this.formatSmallCurrency.bind(this),
        percentageFormat: this.percentageFormat.bind(this),
        baseAmountFormatOrZero: this.baseAmountFormatOrZero.bind(this),
        normalFormat: this.normalFormat.bind(this),
        getInboundStages: this.getInboundStages.bind(this),
        getOutboundStages: this.getOutboundStages.bind(this),
        chainsHeight: this.chainsHeight,
        blockSeconds: this.blockSeconds.bind(this),
        height: this.height,
        runePrice: this.runePrice,
        pools: this.pools,
        pluralize: (value, singular, options) =>
          this.$options.filters.pluralize(value, singular, options),
      }
    },
    createCard(cardBase, accordions) {
      return buildCard(cardBase, accordions, this.getCardContext())
    },
    async createTxState(midgardAction, thorTx, thorStatus, thorHeader, pools) {
      this.rawActions = midgardAction?.actions ?? null
      // Single source of truth for the routing memo — see resolveTxMemo.js
      // for the full precedence chain (THORNode first, Midgard as a
      // durable fallback) and why THORNode returning nothing can never
      // collapse to "this tx has no memo". refundOverview needs the parsed
      // memo (destAddr/asset for resolveOutboundTxs, and .type to
      // distinguish a swap-originated "only refund" — createSwapState's
      // onlyRefund case — from a generic per-action refund card —
      // createAbstractState's case; both can produce a rawActions list
      // that's entirely `type: 'refund'` entries, so that alone can't tell
      // them apart, the memo type is the actual discriminator) plus the
      // raw THORNode tx/details response resolveOutboundTxs also reads.
      const { memo, source } = resolveTxMemo(
        { thorTx, thorStatus, midgardAction },
        this.getBuilderContext()
      )
      this.txMemo = memo
      this.txMemoSource = source
      this.thorTx = thorTx

      // Action outcome is checked before any memo-type dispatch: a message
      // that failed execution (Midgard `type: 'failed'`) must never be
      // routed by what the sender *intended* (the memo) as if it had
      // succeeded — since resolveTxMemo above can now recover a memo type
      // like 'bond' straight out of `metadata.failed.memo`, without this
      // guard a failed bond attempt would satisfy createBondState's
      // memo-type check and render as a completed bond. Reading Midgard's
      // own action type directly (not the memo) also keeps this branch
      // immune to THORNode having nothing at all for the tx — confirmed
      // against 2F8EA9D66B0B1AA3D1507FC20668C12260EA1161192A958AA7221FF2FF3B2AA3,
      // a failed bond attempt (insufficient funds) THORNode's /tx/ returns
      // "doesn't exist" for.
      const failedAction = midgardAction?.actions?.find(
        (a) => a.type === 'failed'
      )
      if (failedAction) {
        const { cards, accordions } = createFailedStateBuilder(
          thorStatus,
          midgardAction,
          thorTx,
          memo,
          this.getBuilderContext()
        )
        this.$set(this, 'cards', [this.createCard(cards, accordions)])
        this.appendContractCards(midgardAction, thorStatus, thorTx, memo)
        return
      }

      if (memo.type === 'outbound') {
        this.gotoTx(memo.hash)
        return
      }

      // Swap: fetch quote when pending, then build state
      if (memo.type === 'swap') {
        const inAsset = this.parseMemoAsset(
          thorStatus?.tx?.coins?.[0]?.asset,
          this.pools
        )
        const inAmount = parseInt(thorStatus?.tx?.coins?.[0]?.amount ?? 0)
        const outAsset = this.parseMemoAsset(memo?.asset, this.pools)
        const affiliateFee = sumAffiliateFee(memo.fee || 0)
        // Affiliate params are only valid when affiliate and BPS counts match.
        // A mismatch (e.g. two affiliates but one BPS in the memo) causes the
        // quote endpoint to reject the request.
        const affiliateParts = memo.affiliate?.split('/') ?? []
        const feeParts = memo.fee ? String(memo.fee).split('/') : []
        const affiliateParamsValid =
          affiliateFee > 0 && affiliateParts.length === feeParts.length
        if (thorStatus?.stages.swap_status?.pending && !this.quote) {
          try {
            const { data: quoteData } = await this.$api.getQuote({
              amount: inAmount,
              from_asset: inAsset ? assetToString(inAsset) : '',
              to_asset: outAsset ? assetToString(outAsset) : '',
              destination: memo.destAddr?.split('/')[0],
              streaming_interval:
                thorStatus?.stages.swap_status?.streaming?.interval ||
                memo.interval,
              ...(affiliateParamsValid && { affiliate: memo.affiliate }),
              ...(affiliateParamsValid && { affiliate_bps: memo.fee }),
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
        this.appendContractCards(midgardAction, thorStatus, thorTx, memo)
        return
      }

      // Add liquidity (possibly with asymmetry second card)
      if (memo.type === 'add') {
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
          if (ts?.tx) {
            const m = this.parseMemo(ts.tx?.memo)
            const addState = this.createAddLiquidityState(
              ts,
              midgardAction,
              thorTx,
              m
            )
            finalCards.push(
              this.createCard(addState.cards, addState.accordions)
            )
          }
        }
        this.$set(this, 'cards', finalCards)
        this.appendContractCards(midgardAction, thorStatus, thorTx, memo)
        return
      }

      // Registry: memo.type -> builder (method name or function from module)
      const BUILDERS = {
        withdraw: 'createRemoveLiquidityState',
        runePoolWithdraw: 'createRunePoolWithdraw',
        runePoolDeposit: 'createRunePoolDeposit',
        tradeWithdraw: 'createTradeWithdrawState',
        secureWithdraw: 'createTradeWithdrawState',
        tradeDeposit: 'createTradeDepositState',
        secureDeposit: 'createTradeDepositState',
        bond: 'createBondState',
        unbond: 'createUnbondState',
        donate: 'createDonateState',
        thorname: BUILDERS_MODULE.thorname,
        loanRepayment: 'createLoanRepayment',
        tcyUnstake: 'createTCYUnstake',
        tcyStake: 'createTCYStake',
      }

      const builder = BUILDERS[memo.type]
      if (builder) {
        const result =
          typeof builder === 'function'
            ? builder(
                thorStatus,
                midgardAction,
                thorTx,
                memo,
                this.getBuilderContext()
              )
            : this[builder](thorStatus, midgardAction, thorTx, memo)
        this.$set(this, 'cards', [
          this.createCard(result.cards, result.accordions),
        ])
        this.appendContractCards(midgardAction, thorStatus, thorTx, memo)
        return
      }

      // Default: one card per action (createAbstractState). Skip contract
      // actions here; appendContractCards adds proper "Contract Event" cards.
      // Refund is no longer skipped so standalone refunds (e.g. empty memo) get a card.
      const finalCards = []
      for (let i = 0; i < midgardAction?.actions?.length; i++) {
        const action = midgardAction.actions[i]
        if (action?.type === 'contract') continue
        const { cards, accordions } = this.createAbstractState(
          thorStatus,
          action,
          thorTx,
          memo
        )
        finalCards.push(this.createCard(cards, accordions))
      }
      this.$set(this, 'cards', finalCards)
      this.appendContractCards(midgardAction, thorStatus, thorTx, memo)
    },
    appendContractCards(midgardAction, thorStatus, thorTx, memo) {
      if (!midgardAction?.actions?.map((a) => a.type).includes('contract')) {
        return
      }
      const contractCards = []
      for (let i = 0; i < midgardAction?.actions?.length; i++) {
        if (midgardAction.actions[i].type !== 'contract') continue
        const { cards, accordions } = this.createContractState(
          thorStatus,
          midgardAction.actions[i],
          thorTx,
          memo
        )
        contractCards.push(this.createCard(cards, accordions))
      }
      this.$set(this, 'cards', [...contractCards, ...this.cards])
    },
    createLoanRepayment(thorStatus, actions, thorTx) {
      const action = actions.actions[0]

      const ins = action?.in.map((a) => ({
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
        txid: a?.txID,
        from: a?.address,
        done: true,
      }))

      let outs = []
      outs = action?.out.map((a) => ({
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
        txid: a?.txID,
        to: a?.address,
        height: a?.height,
        done: true,
      }))

      if (outs?.length === 0 && thorStatus?.planned_out_txs?.length > 0) {
        thorStatus?.planned_out_txs.map((t) => ({
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
        type: 'Caller',
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
        txid: a?.txID,
        from: a?.address,
        height: action?.height,
        timestamp: moment.unix(action?.date / 1e9),
        done: true,
      }))

      const code = action.metadata?.contract?.code ?? 0
      const logs = action.metadata?.contract?.logs
      const memo = action.metadata?.contract?.memo
      const hasError = code > 0

      return {
        cards: {
          title: 'Contract Event',
          in: [
            {
              icon: require('@/assets/images/wallet.svg?inline'),
              address: action?.in[0]?.address,
            },
          ],
          middle: {
            pending: false,
            fail: hasError,
            success: !hasError,
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
            type: 'Contract Call',
            attributes: {
              attributes: action.metadata?.contract?.attributes,
              funds: action.metadata?.contract?.funds,
              msg: action.metadata?.contract?.msg,
            },
            memo,
            logs,
            code,
            error: hasError,
            reason: hasError ? logs : undefined,
            done: true,
          },
          events: action.metadata?.contract?.contractEvents,
          out: [],
        },
      }
    },
    createBondState(thorStatus, action, thorTx) {
      action = action.actions[0]
      const timeStamp = moment.unix(action?.date / 1e9)

      const ins = action?.in.map((a) => ({
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
        gas: thorStatus?.tx?.gas ? thorStatus?.tx?.gas?.[0]?.amount : null,
        gasAsset: thorStatus?.tx?.gas
          ? this.parseMemoAsset(thorStatus?.tx?.gas?.[0]?.asset, this.pools)
          : null,
        txid: a?.txID,
        from: a?.address,
        done: true,
      }))

      const outs = action?.out.map((a) => ({
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
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
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
        gas: thorStatus?.tx?.gas ? thorStatus?.tx?.gas?.[0]?.amount : null,
        gasAsset: thorStatus?.tx?.gas
          ? this.parseMemoAsset(thorStatus?.tx?.gas?.[0]?.asset, this.pools)
          : null,
        txid: a?.txID,
        from: a?.address,
        done: true,
      }))

      const outs = action?.out.map((a) => ({
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
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
    createDonateState(thorStatus, action, thorTx, memo) {
      action = action.actions[0]
      const timeStamp = moment.unix(action?.date / 1e9)

      const ins = action?.in.map((a) => ({
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
        gas: thorStatus?.tx?.gas ? thorStatus?.tx?.gas?.[0]?.amount : null,
        gasAsset: thorStatus?.tx?.gas
          ? this.parseMemoAsset(thorStatus?.tx?.gas?.[0]?.asset, this.pools)
          : null,
        txid: a?.txID,
        from: a?.address,
        done: true,
      }))

      // Midgard's own `pools` field names the donated pool authoritatively;
      // the memo's asset segment (DONATE:POOL) is the only fallback when
      // that's missing.
      const poolAssetStr = action?.pools?.[0] || memo?.asset
      const poolAsset = poolAssetStr
        ? this.parseMemoAsset(poolAssetStr, this.pools)
        : null

      return {
        cards: {
          title: 'Donate',
          in: ins,
          middle: {
            pending: false,
          },
          out: [
            {
              asset: poolAsset,
              text: poolAsset ? this.showAsset(poolAsset) : 'Pool',
              class: poolAsset ? undefined : 'pad-icon',
              icon: poolAsset
                ? undefined
                : require('@/assets/images/safe.svg?inline'),
            },
          ],
        },
        accordions: {
          in: ins,
          action: {
            type: 'Donate',
            memo: thorStatus?.tx?.memo,
            pool: poolAsset ? this.showAsset(poolAsset) : undefined,
            timeStamp,
            height: action?.height,
            done: true,
          },
          out: [],
        },
      }
    },
    createTradeDepositState(thorStatus, actions, thorTx) {
      const midgardAction = actions.actions[0]
      const action = midgardAction
      const timeStamp = moment.unix(action?.date / 1e9)
      const memo = this.parseMemo(thorStatus?.tx?.memo)

      const ast = this.parseMemoAsset(
        thorStatus?.tx?.coins?.[0]?.asset,
        this.pools
      )

      let isSecure = false
      if (memo?.type?.includes('secure')) {
        isSecure = true
      }

      let error = false
      let reason = ''
      if (action.type === 'refund') {
        error = true
        reason = action.metadata?.refund?.reason
      }

      const ins = [
        {
          asset: ast,
          amount: thorStatus?.tx?.coins?.[0]?.amount ?? 0,
          txid: thorStatus?.tx?.id,
          from: thorStatus?.tx?.from_address,
          gas: thorStatus?.tx?.gas ? thorStatus?.tx?.gas?.[0]?.amount : null,
          gasAsset: thorStatus?.tx?.gas
            ? this.parseMemoAsset(thorStatus?.tx?.gas?.[0]?.asset, this.pools)
            : null,
          done: true,
        },
      ]

      const outAsset = isSecure ? assetToSecure(ast) : assetToTrade(ast)
      let outs
      if (thorStatus?.out_txs?.length > 0) {
        outs = thorStatus?.out_txs.map((tx) => ({
          asset: outAsset,
          amount: tx.coins?.[0]?.amount,
          txid: tx.id,
          to: memo.address,
          done: true,
        }))
      } else if (midgardAction.out?.length > 0) {
        outs = midgardAction.out.map((o) => ({
          asset: outAsset,
          amount: o.coins?.[0]?.amount,
          txid: o.txID,
          to: memo.address,
          done: true,
        }))
      } else {
        outs = [
          {
            asset: outAsset,
            amount: thorStatus?.tx?.coins?.[0]?.amount ?? 0,
            txid: null,
            to: memo.address,
            done: true,
          },
        ]
      }

      return {
        cards: {
          title: this.camelCase(memo.type),
          in: ins,
          middle: {
            fail: error,
            pending: false,
          },
          out: error ? [] : outs,
        },
        accordions: {
          in: ins,
          action: {
            type: 'Deposit',
            memo: thorStatus?.tx?.memo,
            height: action?.height,
            timeStamp,
            done: true,
            error,
            reason,
          },
          out: error ? [] : outs,
        },
      }
    },
    createTradeWithdrawState(thorStatus, actions, thorTx) {
      const midgardAction = actions.actions[0]
      const action = midgardAction
      const timeStamp = moment.unix(action?.date / 1e9)
      const memo = this.parseMemo(thorStatus?.tx?.memo)

      const ast = this.parseMemoAsset(
        thorStatus?.tx?.coins?.[0]?.asset,
        this.pools
      )

      let isSecure = false
      if (memo?.type?.includes('secure')) {
        isSecure = true
      }

      const ins = [
        {
          asset: isSecure ? assetToSecure(ast) : assetToTrade(ast),
          amount: thorStatus?.tx?.coins?.[0]?.amount ?? 0,
          txid: thorStatus?.tx?.id,
          from: thorStatus?.tx?.from_address,
          gas: thorStatus?.tx?.gas ? thorStatus?.tx?.gas?.[0]?.amount : null,
          gasAsset: thorStatus?.tx?.gas
            ? this.parseMemoAsset(thorStatus?.tx?.gas?.[0]?.asset, this.pools)
            : null,
          done: true,
        },
      ]

      const outAsset = isSecure ? securedToAsset(ast) : tradeToAsset(ast)
      const outboundSignal = resolveOutboundSignal(
        thorStatus,
        this.getOutboundStatusContext()
      )
      const outboundSigned = outboundSignal.signed ?? false
      const outboundETA = outboundSignal.eta
      const outDone = outboundSignal.signed === true

      const plannedOuts = thorStatus?.planned_out_txs ?? []
      const completedOuts = thorStatus?.out_txs ?? []

      let outs
      if (plannedOuts.length > 0) {
        // Use planned_out_txs as authoritative list; match each to a completed
        // out_txs entry (by amount+asset) to get the hash and done status.
        outs = plannedOuts.map((planned) => {
          const completed = completedOuts.find(
            (tx) =>
              tx.coins?.[0]?.amount === planned.coin?.amount &&
              tx.coins?.[0]?.asset === planned.coin?.asset
          )
          const legState = resolveOutboundLegState(completed, {
            signed: outboundSigned,
            eta: outboundETA,
          })
          return {
            asset: outAsset,
            amount: planned.coin?.amount,
            txid: completed?.id ?? null,
            to: planned.to_address,
            gas: completed?.gas?.[0]?.amount ?? null,
            gasAsset: completed?.gas
              ? this.parseMemoAsset(completed.gas[0]?.asset, this.pools)
              : null,
            outboundSigned: legState.signed,
            outboundETA: legState.eta,
            done: !!completed,
          }
        })
      } else if (completedOuts.length > 0) {
        outs = completedOuts.map((tx) => ({
          asset: outAsset,
          amount: tx.coins?.[0]?.amount,
          txid: tx.id,
          to: memo.address,
          gas: tx.gas?.[0]?.amount ?? null,
          gasAsset: tx.gas
            ? this.parseMemoAsset(tx.gas[0]?.asset, this.pools)
            : null,
          outboundSigned,
          outboundETA,
          done: outDone,
        }))
      } else if (midgardAction.out?.length > 0) {
        outs = midgardAction.out.map((o) => ({
          asset: outAsset,
          amount: o.coins?.[0]?.amount,
          txid: o.txID,
          to: memo.address,
          outboundSigned,
          outboundETA,
          done: outDone,
        }))
      } else {
        outs = [
          {
            asset: outAsset,
            amount: thorStatus?.tx?.coins?.[0]?.amount ?? 0,
            txid: null,
            to: memo.address,
            outboundSigned,
            outboundETA,
            done: outDone,
          },
        ]
      }

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
            asset: TCYUnstake.out?.[0]?.coins?.[0]?.asset,
            amount: TCYUnstake.out?.[0]?.coins?.[0]?.amount,
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
            asset: TCYStake.in?.[0]?.coins?.[0]?.asset,
            amount: TCYStake.in?.[0]?.coins?.[0]?.amount,
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
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
        txid: a?.txID,
        from: a?.address,
        done: true,
      }))

      let outs =
        action?.out.map((a) => ({
          asset: this.parseMemoAsset(a.coins?.[0]?.asset),
          amount: a.coins?.[0]?.amount ?? 0,
          txid: a?.txID,
          to: a?.address,
          done: true,
        })) ?? []
      // Trade/secure only: when multiple outbounds have same asset and amount, only show one
      const hasTradeOrSecureOut = outs.some(
        (o) => o?.asset?.trade || o?.asset?.secure
      )
      if (hasTradeOrSecureOut) {
        const outKey = (o) =>
          `${o?.asset ? assetToString(o.asset) : ''}:${o?.amount ?? ''}`
        const seenOuts = new Set()
        outs = outs.filter((o) => {
          const key = outKey(o)
          if (seenOuts.has(key)) return false
          seenOuts.add(key)
          return true
        })
      }

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

      let cardAction = {
        type: action?.type === 'refund' ? 'Refund' : 'Action',
        timeStamp: moment.unix(action?.date / 1e9) || null,
        height: action?.height,
        memo,
        reason,
        mimirKey: action?.metadata?.mimir?.key,
        mimirValue: action?.metadata?.mimir?.value,
        done: true,
      }

      function kebabToTitle(kebab) {
        if (!kebab || typeof kebab !== 'string') return ''
        return kebab
          .split('_')
          .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join(' ')
      }

      let title = kebabToTitle(action.type) ?? 'Action'
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

      if (action.type === 'limit_swap') {
        let ttl = 43200
        let swapLimit = 'N/A'
        if (memo.split(':')[3].split('/').length > 0) {
          ttl = memo.split(':')[3].split('/')[1] ?? 43200
          swapLimit = memo.split(':')[3].split('/')[0]
        }

        cardAction = {
          type: 'Order',
          timeStamp: moment.unix(action?.date / 1e9) || null,
          height: action?.height,
          memo,
          ttl,
          swapLimit,
          done: true,
        }

        outs[0] = { ...outs[0], hide: true }
      }

      if (action.type === 'mimir') {
        const nodeAddress = action?.in?.[0]?.address
        ins = [
          {
            address: nodeAddress,
            from: nodeAddress,
            txid: action?.in?.[0]?.txID,
            done: true,
          },
        ]
        const mimirKey = action?.metadata?.mimir?.key
        const mimirValue = action?.metadata?.mimir?.value
        outs = [
          {
            voteKey: mimirKey,
            voteValue: mimirValue,
            icon: require('@/assets/images/vote.svg?inline'),
            class: 'pad-icon',
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
            refund: isRefund,
            pending: false,
          },
          out: outs,
        },
        accordions: {
          in: ins,
          action: cardAction,
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
    // No cards/accordions built here (Phase 3 of the tx-detail-UI raw-data
    // migration) — sendOverview reads nativeSendAction directly and its
    // only bail conditions (!nt, !inCoin?.asset) are both impossible by the
    // time this method runs: nt is this function's own argument, and
    // inCoin?.asset is the exact same nativeTx?.in?.[0]?.coins?.[0]?.asset
    // path the legacy card used unconditionally (with no fallback) for its
    // own asset display — so a tx that failed sendOverview's guard would
    // have rendered an equally broken legacy card, never a working one.
    // sendOverview therefore always matches whenever createNativeTx runs,
    // making the old per-send card/accordion pair pure dead weight.
    createNativeTx(nativeTx) {
      this.nativeSendAction = nativeTx
    },
    createAddLiquidityState(thorStatus, actions, thorTx, memo) {
      const isSaver = this.parseMemoAsset(memo?.asset)?.synth

      const inAsset = this.parseMemoAsset(
        thorStatus?.tx?.coins?.[0]?.asset,
        this.pools
      )
      const inAmount = parseInt(thorStatus?.tx?.coins?.[0]?.amount ?? 0)
      const addAction = actions?.actions?.find(
        (a) => a.type === 'addLiquidity' && a.in?.[0]?.address !== ''
      )
      const timeStamp = moment.unix(addAction?.date / 1e9)

      const isRefund = actions?.actions?.find((a) => a.type === 'refund')

      const outboundSignal = resolveOutboundSignal(
        thorStatus,
        this.getOutboundStatusContext()
      )

      const pending =
        thorStatus?.stages.swap_status?.pending ||
        !thorStatus?.stages.inbound_observed?.completed ||
        !(thorStatus?.stages.inbound_confirmation_counted?.completed ?? true) ||
        !thorStatus?.stages.inbound_finalised?.completed ||
        (inAsset?.chain === 'THOR' && addAction.status === 'pending')

      const memoText = thorStatus?.tx?.memo || isRefund?.metadata?.refund?.memo

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
            affiliateFee: sumAffiliateFee(memo.fee),
            outboundDelayRemaining: outboundSignal.delayRemaining,
            outboundETA: outboundSignal.eta,
            outboundSigned: outboundSignal.signed ?? false,
            refundReason: isRefund
              ? isRefund?.metadata?.refund?.reason
              : undefined,
            memo: memoText,
            done:
              !thorStatus?.stages.swap_status?.pending &&
              !(inAsset?.chain === 'THOR' && addAction.status === 'pending'),
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
        thorStatus?.tx?.coins?.[0]?.asset,
        this.pools
      )
      const inAmount = parseInt(thorStatus?.tx?.coins?.[0]?.amount ?? 0)
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
      if (thorStatus?.planned_out_txs > 0) {
        hasOngoing = thorStatus?.planned_out_txs?.some(
          (tx) => !userTxs.has(tx.to_address.toUpperCase())
        )
        outTxs.push(
          thorStatus?.planned_out_txs?.filter(
            (tx) => !userTxs.has(tx.to_address.toUpperCase())
          )
        )
      }

      let outAsset
      let outAmount
      const isOut = outTxs && outTxs[0]
      if (isOut) {
        outAsset = this.parseMemoAsset(outTxs[0]?.coins?.[0]?.asset, this.pools)
        outAmount =
          outTxs?.length > 0 ? parseInt(outTxs[0]?.coins?.[0]?.amount ?? 0) : 0
      }

      const outboundDone =
        thorStatus?.stages.outbound_signed?.completed ||
        outAsset?.chain === 'THOR'

      const outs = []
      if (outAsset) {
        outs.push({
          asset: outAsset,
          amount: outAmount,
          done: outboundDone,
        })
      }

      const moreOuts = outTxs?.slice(1)
      if (moreOuts && moreOuts.length > 0) {
        outs.push(
          ...moreOuts.map((o) => ({
            asset: this.parseMemoAsset(o.coins?.[0]?.asset, this.pools),
            amount: parseInt(o.coins?.[0]?.amount ?? 0),
            done: outboundDone,
          }))
        )
      }

      const outboundSignal = resolveOutboundSignal(
        thorStatus,
        this.getOutboundStatusContext()
      )

      const outActions = []
      if (isOut) {
        outActions.push({
          fees: outboundFees,
          feeAssets: outboundFeeAssets,
          outboundDelayRemaining: outboundSignal.delayRemaining,
          outboundETA: outboundSignal.eta,
          outboundSigned: outboundSignal.signed ?? false,
          done: outboundDone,
        })

        if (moreOuts && moreOuts.length > 0) {
          outActions.push(
            ...moreOuts.map((o) => ({
              txid: o.id,
              to: o.to_address,
              asset: this.parseMemoAsset(o.coins?.[0]?.asset, this.pools),
              amount: parseInt(o.coins?.[0]?.amount ?? 0),
              gas: o.gas ? o.gas?.[0]?.amount : null,
              gasAsset: o.gas
                ? this.parseMemoAsset(o.gas?.[0]?.asset, this.pools)
                : null,
              outboundSigned: outboundSignal.signed ?? false,
              done: outboundDone,
            }))
          )
        }
      }

      let refundReason
      if (refundAction) {
        refundReason = refundAction?.metadata?.refund?.reason
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
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
        txid: a?.txID,
        from: a?.address,
        done: true,
      }))

      const outs = action?.out.map((a) => ({
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
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
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
        txid: a?.txID,
        from: a?.address,
        done: true,
      }))

      const outs = action?.out.map((a) => ({
        asset: this.parseMemoAsset(a.coins?.[0]?.asset),
        amount: a.coins?.[0]?.amount ?? 0,
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
      const { outTxs: resolvedOutTxs, affiliateOut } = resolveOutboundTxs(
        thorStatus,
        thorTx,
        actions,
        memo,
        {
          parseMemoAsset: this.parseMemoAsset.bind(this),
          assetToString,
          pools: this.pools,
        }
      )
      const outTxs = resolvedOutTxs

      // Add native in/out search
      const inAsset = this.parseMemoAsset(
        thorStatus?.tx?.coins?.[0]?.asset,
        this.pools
      )
      const inAmount = parseInt(thorStatus?.tx?.coins?.[0]?.amount ?? 0)

      let outAsset = this.parseMemoAsset(
        outTxs?.length > 0 ? outTxs[0]?.coins?.[0]?.asset : memo?.asset,
        this.pools
      )
      let outAmount =
        outTxs?.length > 0 ? parseInt(outTxs[0]?.coins?.[0]?.amount ?? 0) : 0
      if (!outAmount && actions?.actions?.length > 0) {
        const outAssetStr = outAsset ? assetToString(outAsset) : null
        const midgardSwapAction =
          actions?.actions?.find((a) => a.type === 'swap') ??
          actions?.actions?.find((a) => a.type === 'limit_swap')
        // For trade/secure assets, sum across unique txIDs (multiple sub-outs per swap).
        // For all other assets, use the first non-affiliate out matching the target asset.
        if (outAsset?.trade || outAsset?.secure) {
          outAmount = parseInt(
            Object.values(
              groupBy(
                midgardSwapAction?.out?.filter(
                  (a) => a.coins?.[0]?.asset === outAssetStr
                ),
                'txID'
              )
            ).map((group) =>
              sumBy(group, (item) => +(item.coins?.[0]?.amount ?? 0))
            )[0]
          )
        } else {
          const midgardOut = midgardSwapAction?.out?.find(
            (o) => !o.affiliate && o.coins?.[0]?.asset === outAssetStr
          )
          if (midgardOut) {
            outAmount = parseInt(midgardOut.coins?.[0]?.amount ?? 0)
          }
        }
      }

      // only refund happened
      const onlyRefund =
        actions?.actions.length > 0 &&
        actions?.actions.every((action) => action?.type === 'refund')
      const refundAction = actions?.actions?.find((a) => a.type === 'refund')

      // A trade/secure-asset refund settles as an internal THORChain ledger
      // update, not an observed cross-chain outbound — out_txs stays empty,
      // so outAsset/outAmount above fell back to the memo's intended
      // DESTINATION asset and 0. A refund always returns the same asset
      // (and, absent any withheld fee info, the same amount) that was sent
      // in.
      if (onlyRefund && !outTxs?.length) {
        outAsset = inAsset
        outAmount = inAmount
      }

      const outMemoAsset = this.parseMemoAsset(memo?.asset)

      // Midgard
      // There are multiple outbound fee
      // also there might be refund involved
      const swapAction =
        actions?.actions?.find((a) => a.type === 'swap') ??
        actions?.actions?.find((a) => a.type === 'limit_swap')
      const swapMetadata =
        swapAction?.metadata?.swap ?? swapAction?.metadata?.limit_swap
      const outboundFees =
        swapMetadata?.networkFees?.map((n) => n?.amount) ?? []
      const outboundFeeAssets =
        outboundFees?.length > 0
          ? this.parseMemoAsset(
              swapMetadata?.networkFees?.map((n) => n?.asset),
              this.pools
            )
          : null
      let timeStamp = swapAction?.date
      let height = swapAction?.height

      // Refunds
      const outboundHasRefund = outTxs?.some(
        (tx) => tx.refund || tx.memo?.toLowerCase().startsWith('refund')
      )
      // sometimes the outbound doesn't come out if the outbound is in native chain
      const outboundHasSuccess = outTxs?.some((tx) =>
        tx.memo?.toLowerCase().startsWith('out')
      )

      const streamingMeta = swapMetadata?.streamingSwapMeta

      // When the quote endpoint fails, estimate the final output by projecting
      // the accumulated streaming output to the full swap quantity.
      const streamingProgressEstimate = (() => {
        // Prefer the direct outEstimation field when available.
        const directEstimate = parseInt(streamingMeta?.outEstimation ?? 0)
        if (directEstimate) return directEstimate
        // Fall back to projecting partial progress to the full quantity.
        const partialOut = parseInt(streamingMeta?.outCoin?.amount ?? 0)
        const count = parseInt(streamingMeta?.count ?? 0)
        const quantity = parseInt(streamingMeta?.quantity ?? 0)
        if (!partialOut || !count || !quantity) return 0
        return Math.round((partialOut * quantity) / count)
      })()
      const estimatedOutAmount =
        outAmount ||
        +this.quote?.expected_amount_out ||
        streamingProgressEstimate

      // swapMetadata's historical inPriceUSD/outPriceUSD only exist on a
      // Midgard 'swap'/'limit_swap' action — a pure refund has neither (see
      // the height/timeStamp/memo fallbacks above), so it's always 0 here.
      // Fall back to the current pool price (amountToUSD already converts
      // trade assets to their native equivalent before the pool lookup —
      // rule of thumb: trade/secure assets always need that conversion
      // before pricing, never priced directly under their suffixed form).
      const inAmountUSD =
        (+(swapMetadata?.inPriceUSD ?? 0) * inAmount) / 1e8 ||
        this.amountToUSD(inAsset, inAmount, this.pools) ||
        0
      let outAmountUSD =
        (+(swapMetadata?.outPriceUSD ?? 0) * estimatedOutAmount) / 1e8 ||
        this.amountToUSD(outAsset, estimatedOutAmount, this.pools) ||
        0
      if (!outboundHasSuccess && outboundHasRefund) {
        outAmountUSD =
          (+(swapMetadata?.inPriceUSD ?? 0) * outAmount) / 1e8 ||
          this.amountToUSD(outAsset, outAmount, this.pools) ||
          0
      }

      const outboundRefundReason = actions?.actions.find(
        (action) => action.type === 'refund'
      )?.metadata?.refund?.reason

      if (onlyRefund) {
        // A pure refund has no Midgard 'swap' action at all (every action is
        // type 'refund'), so swapAction above is undefined and neither its
        // date nor its height are available — fall back to the refund
        // action's own, which every Midgard action carries.
        timeStamp = refundAction?.date
        height = refundAction?.height
      }
      this.height = height
      let isRefund = false
      if (refundAction) {
        isRefund = true
      }

      // TODO: add nice check with animation (transition from pending to complete)
      // TODO: add failed swaps from midgard
      // TODO: Add refunded swap info
      // TODO: fix the loading check/spinner on complete
      // TODO: fix streaming card when finished
      // TODO: sometimes the pools price is fetched after the status

      const outboundSignal = resolveOutboundSignal(
        thorStatus,
        this.getOutboundStatusContext()
      )

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

      const depositAmountZero = !parseInt(
        streamingMeta?.depositedCoin?.amount || 0
      )
      const rapidInterval = depositAmountZero
        ? memo?.interval
        : (streamingMeta?.interval ?? memo?.interval)
      const isRapidSwap =
        (rapidInterval === 0 || rapidInterval === '0') && +height > 25400000
      const isLimitOrder = !!memo?.isLimitOrder
      const swapTypeLabel = isLimitOrder
        ? 'limit order'
        : isRapidSwap
          ? 'rapid Swap'
          : 'swap'
      const refundedSwapTypeLabel = isLimitOrder
        ? 'refunded limit order'
        : isRapidSwap
          ? 'refunded Rapid Swap'
          : 'refunded Swap'

      const firstOutDone =
        (outTxs?.length > 0 && !!outTxs[0]?.id) ||
        (!thorStatus?.stages.swap_status?.pending &&
          (thorStatus?.stages.outbound_signed?.completed ||
            outAsset?.chain === 'THOR' ||
            outAsset?.synth ||
            outAsset?.trade ||
            outAsset?.secure) &&
          (thorStatus?.stages.outbound_delay?.completed ?? true))
      const moreOutDone = (o) =>
        !!o.id ||
        (!thorStatus?.stages.swap_status?.pending &&
          (thorStatus?.stages.outbound_signed?.completed ||
            outAsset?.chain === 'THOR' ||
            outAsset?.synth ||
            outAsset?.trade ||
            outAsset?.secure))

      return {
        cards: {
          title: onlyRefund ? refundedSwapTypeLabel : swapTypeLabel,
          labels: onlyRefund ? [] : isRefund ? ['Refund'] : [],
          in: [
            {
              asset: inAsset,
              amount: inAmount,
              amountUSD: inAmountUSD,
              usdAtExecution: !!swapMetadata?.inPriceUSD,
            },
          ],
          middle: {
            pending: this.isTxInPending(thorStatus, actions),
            fail: onlyRefund,
          },
          out: [
            {
              asset: outAsset,
              amount: estimatedOutAmount,
              amountUSD: outAmountUSD,
              // Matches outAmountUSD's own two-branch derivation above —
              // the refund reassignment prices off inPriceUSD, not
              // outPriceUSD.
              usdAtExecution:
                !outboundHasSuccess && outboundHasRefund
                  ? !!swapMetadata?.inPriceUSD
                  : !!swapMetadata?.outPriceUSD,
              filter: outAmount
                ? undefined
                : (v) => `~ ${this.baseAmountFormatOrZero(v)}`,
              done: firstOutDone,
              // Per-leg detail a multi-outbound swap (e.g. one output split
              // across several destination-chain txs by an amount cap) needs
              // for its own hero — same v1 fallback as
              // createTradeWithdrawState: no per-leg scheduled height exists,
              // so every still-pending leg shares the tx-wide signal.
              txid: outTxs?.[0]?.id ?? null,
              to:
                outTxs?.[0]?.to_address ??
                memo?.destAddr?.split('/')[0] ??
                null,
              outboundETA: firstOutDone ? null : outboundSignal.eta,
            },
            ...(outTxs ?? []).slice(1).map((o) => {
              const oAmount = parseInt(o.coins?.[0]?.amount ?? 0)
              const isRefundTx =
                o.refund || o.memo?.toLowerCase().startsWith('refund')
              const priceUSD = isRefundTx
                ? +(swapMetadata?.inPriceUSD ?? 0)
                : +(swapMetadata?.outPriceUSD ?? 0)
              return {
                asset: this.parseMemoAsset(o.coins?.[0]?.asset, this.pools),
                amount: oAmount,
                amountUSD: (priceUSD * oAmount) / 1e8,
                usdAtExecution: isRefundTx
                  ? !!swapMetadata?.inPriceUSD
                  : !!swapMetadata?.outPriceUSD,
                done: moreOutDone(o),
                txid: o.id ?? null,
                to: o.to_address ?? null,
                outboundETA: moreOutDone(o) ? null : outboundSignal.eta,
              }
            }),
          ],
        },
        accordions: {
          in: [
            {
              txid: thorStatus?.tx.id,
              from: thorStatus?.tx.from_address,
              asset: inAsset,
              amount: inAmount,
              gas: thorStatus?.tx.gas ? thorStatus?.tx?.gas?.[0]?.amount : null,
              gasAsset: thorStatus?.tx.gas
                ? this.parseMemoAsset(
                    thorStatus?.tx?.gas?.[0]?.asset,
                    this.pools
                  )
                : null,
              preObservations:
                thorStatus?.stages?.inbound_observed?.pre_confirmation_count,
              observations: thorStatus?.stages?.inbound_observed?.final_count,
              observationsCompleted:
                thorStatus?.stages?.inbound_observed?.completed,
              finalisedHeight: thorTx?.finalised_height,
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
            type:
              onlyRefund || isRefund ? refundedSwapTypeLabel : swapTypeLabel,
            timeStamp: timeStamp || null,
            limit: memo?.limit,
            limitAsset: outMemoAsset,
            ttl: memo?.ttl || null,
            isLimitOrder,
            // Live quote for the remaining amount — lets the UI show how far
            // the market currently is from clearing a resting limit order.
            currentQuoteOut:
              isLimitOrder && this.quote?.expected_amount_out
                ? parseInt(this.quote.expected_amount_out)
                : null,
            affiliateName: memo?.affiliate,
            affiliateFee: sumAffiliateFee(memo?.fee || 0),
            liquidityFee:
              parseInt(swapAction?.metadata.swap?.liquidityFee) || null,
            liquidityUnits: null,
            refundReason: onlyRefund || isRefund ? outboundRefundReason : null,
            asymmetry: null,
            affiliateOut: affiliateOut || undefined,
            swapSlip: parseInt(swapAction?.metadata.swap?.swapSlip),
            height,
            rate: rates,
            streaming: {
              count:
                thorStatus?.stages.swap_status?.streaming?.count ??
                streamingMeta?.count,
              interval:
                thorStatus?.stages.swap_status?.streaming?.interval ??
                streamingMeta?.interval ??
                memo?.interval,
              quantity:
                thorStatus?.stages.swap_status?.streaming?.quantity ??
                streamingMeta?.quantity ??
                memo?.quantity,
              lastHeight: streamingMeta?.lastHeight || null,
            },
            // A pure refund has no Midgard 'swap' action (swapAction is
            // undefined — see the height/timeStamp fallback above), so its
            // memo has to come from the refund action's own metadata
            // instead.
            memo:
              swapAction?.metadata.swap?.memo ??
              refundAction?.metadata?.refund?.memo,
            done:
              thorStatus?.stages?.inbound_finalised?.completed &&
              (thorStatus?.stages.swap_finalised?.completed ||
                !thorStatus?.stages.swap_status?.pending),
            error: onlyRefund,
          },
          out: [
            {
              txid: outTxs?.length > 0 ? outTxs[0]?.id : null,
              to:
                (outTxs?.length > 0 && outTxs[0]?.to_address) || memo?.destAddr,
              asset: outAsset,
              amount: parseInt(outAmount),
              gas:
                outTxs?.length > 0 && outTxs[0]?.gas
                  ? outTxs[0]?.gas?.[0]?.amount
                  : null,
              gasAsset:
                outTxs?.length > 0 && outTxs[0]?.gas
                  ? this.parseMemoAsset(outTxs[0]?.gas?.[0]?.asset, this.pools)
                  : null,
              height: outTxs?.length > 0 ? outTxs[0]?.height : null,
              fees: outboundFees,
              feeAssets: outboundFeeAssets,
              delayBlocksRemaining: outboundSignal.delayBlocksRemaining,
              outboundDelayRemaining: outboundSignal.delayRemaining,
              outboundETA: outboundSignal.eta,
              outboundSigned: outboundSignal.signed,
              done: firstOutDone,
            },
            ...(outTxs ?? []).slice(1).map((o) => ({
              txid: o.id,
              to: o.to_address,
              asset: this.parseMemoAsset(o.coins?.[0]?.asset, this.pools),
              amount: parseInt(o.coins?.[0]?.amount ?? 0),
              gas: o.gas ? o.gas?.[0]?.amount : null,
              height: o.height,
              gasAsset: o.gas
                ? this.parseMemoAsset(o.gas?.[0]?.asset, this.pools)
                : null,
              done: moreOutDone(o),
            })),
          ],
        },
      }
    },
  },
}
</script>

<style lang="scss" scoped>
// Everything the old swap/contract-hero markup needed here moved to
// SwapHero.vue (and assets/styles/_tx-detail.scss, which now provides the
// shared classes for every hero component) when that markup was extracted
// out of this file's own template. What's left below is only what the
// remaining template above actually renders: the plain tx-header fallback
// shown before any hero/legacy-card data has loaded.
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

.tx-id {
  flex-shrink: 5;
  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
