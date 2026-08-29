<template>
  <TxHeroShell
    :eyebrow="eyebrow"
    :chips="chips"
    :affiliate-address="overview.affiliateAddress"
  >
    <template #title>
      <template v-if="isOutbound">
        Swapped <span class="mono">{{ overview.amountDisplay }}</span> for
        <span class="mono">{{ outputAssetNotation }}</span>
        — <span class="tx-value-warning">outbound pending</span>
      </template>
      <template v-else>
        Swapping <span class="mono">{{ overview.amountDisplay }}</span> for
        <span class="mono">{{ outputAssetNotation }}</span>
      </template>
    </template>

    <template #main>
      <section class="tx-swap-card">
        <div class="tx-swap-head" :style="panelVars">
          <div class="tx-asset-panel">
            <div class="tx-asset-label">Input</div>
            <div class="tx-asset-primary">
              <AssetIcon :asset="overview.asset" :height="'2.25rem'" />
              <span>{{ overview.inputName }}</span>
            </div>
            <div class="tx-asset-badge">{{ overview.assetBadge }}</div>
            <div class="tx-asset-values">
              <AssetAmountValue
                :amount="overview.amountRaw"
                :asset="overview.asset"
              />
              <strong
                v-tooltip="usdBasisTooltip(overview.amountUsdAtExecution)"
                style="cursor: help"
                >{{ overview.amountUsdDisplay }}</strong
              >
            </div>
            <div v-if="inputSplit" class="tx-flow-split">
              <span
                v-for="part in inputSplit"
                :key="part.label"
                v-tooltip="part.tooltip"
                :class="[
                  'tx-flow-split__part',
                  `tx-flow-split__part--${part.tone}`,
                  { 'tx-flow-split__part--hint': part.tooltip },
                ]"
              >
                <span class="tx-flow-split__value mono">{{ part.value }}</span>
                <span class="tx-flow-split__label">{{ part.label }}</span>
              </span>
            </div>
          </div>

          <div class="tx-swap-arrow">
            <ArrowIcon class="tx-swap-arrow-icon" />
          </div>

          <div
            :class="[
              'tx-asset-panel',
              isOutbound
                ? 'tx-asset-panel--warning-dashed'
                : 'tx-asset-panel--accent',
            ]"
          >
            <div class="tx-asset-panel-head">
              <div class="tx-asset-label">
                {{ isOutbound ? 'Output' : 'Projected output' }}
              </div>
              <span v-if="isOutbound" class="tx-chip tx-chip--warning">
                Not yet sent
              </span>
            </div>
            <div class="tx-asset-primary">
              <AssetIcon :asset="overview.outputAsset" :height="'2.25rem'" />
              <span>{{ overview.outputName }}</span>
            </div>
            <div class="tx-asset-badge">{{ overview.outputAssetBadge }}</div>
            <div class="tx-asset-values">
              <AssetAmountValue
                :amount="overview.outputProjectedRaw"
                :asset="overview.outputAsset"
                :prefix="isOutbound ? '' : '≈ '"
              />
              <strong
                v-tooltip="usdBasisTooltip(overview.outputUsdAtExecution)"
                style="cursor: help"
                >{{ overview.outputProjectedUsdDisplay }}</strong
              >
            </div>
            <div v-if="outputSplit" class="tx-flow-split">
              <span
                v-for="part in outputSplit"
                :key="part.label"
                v-tooltip="part.tooltip"
                :class="[
                  'tx-flow-split__part',
                  `tx-flow-split__part--${part.tone}`,
                  { 'tx-flow-split__part--hint': part.tooltip },
                ]"
              >
                <span class="tx-flow-split__value mono">{{ part.value }}</span>
                <span class="tx-flow-split__label">{{ part.label }}</span>
              </span>
            </div>
          </div>
        </div>

        <div v-if="overview.isStreaming" class="tx-delivery">
          <div class="tx-delivery-caption">
            <span class="tx-asset-label">Stream Progress</span>
            <span class="mono">
              {{ overview.count }} / {{ overview.quantity }} sub-swaps
              <template v-if="isOutbound">· Complete</template>
              <template v-else-if="overview.remainingDisplay">
                · ≈ {{ overview.remainingDisplay }} left
              </template>
            </span>
          </div>
          <progress-bar
            :width="overview.fillPercent"
            height="8px"
            color="linear-gradient(90deg, var(--green), var(--active-primary-color))"
          />
        </div>

        <div v-if="isOutbound && showOutboundDelayBar" class="tx-delivery">
          <div class="tx-delivery-caption">
            <span class="tx-asset-label">{{ outboundDelayLabel }}</span>
            <span
              :class="[
                'mono',
                'tx-delay-readout',
                outboundDelayOverdue ? 'tx-delay-readout--overdue' : null,
              ]"
            >
              <span class="tx-delay-readout__dot" />
              {{ outboundDelayReadout }}
            </span>
          </div>
          <div class="tx-delivery-bar">
            <div
              v-if="outboundDelayFillPercent > 0"
              class="tx-delivery-bar__fill tx-delivery-bar__fill--delay"
              :style="{ width: `${outboundDelayFillPercent}%` }"
            />
            <div
              v-if="outboundDelayFillPercent < 100"
              :class="[
                'tx-delivery-bar__pending',
                outboundDelayOverdue
                  ? 'tx-delivery-bar__pending--overdue'
                  : null,
              ]"
              :style="{ width: `${100 - outboundDelayFillPercent}%` }"
            />
          </div>
          <div class="tx-delivery-note">{{ outboundDelayNote }}</div>
        </div>

        <div class="tx-metric-strip">
          <div class="tx-metric-item">
            <div class="tx-asset-label">
              {{ overview.isStreaming ? 'Interval' : 'Exchange rate' }}
            </div>
            <div class="tx-metric-value mono">
              {{
                (overview.isStreaming
                  ? overview.intervalDisplay
                  : overview.rateDisplay) || '-'
              }}
            </div>
          </div>
          <div class="tx-metric-item">
            <div class="tx-asset-label">
              {{ overview.isStreaming ? 'Avg. price impact' : 'Price impact' }}
            </div>
            <div class="tx-metric-value tx-value-negative mono">
              {{ overview.priceImpactDisplay || '-' }}
            </div>
          </div>
        </div>
      </section>

      <section v-if="isOutbound" class="tx-info-card">
        <div class="tx-section-title">Outbound</div>
        <div class="tx-detail-rows">
          <DetailRow
            v-if="overview.destination"
            label="Destination"
            :value="overview.destination"
            value-type="address"
          />
          <DetailRow v-if="overview.outboundHash" label="Hash">
            <ExternalHash
              :param="overview.outboundHash"
              :asset="overview.outputAsset"
            />
          </DetailRow>
          <DetailRow
            v-if="overview.outboundEstDisplay"
            label="Outbound Est."
            :value="overview.outboundEstDisplay"
          />
          <DetailRow
            v-if="overview.outboundDelayEstDisplay"
            label="Outbound Delay Est."
            :value="overview.outboundDelayEstDisplay"
          />
          <!-- Plain value, no tone class: the outbound is still queued and
               retried each churn, so how long it has been waiting is a
               neutral fact like the rows around it, not a warning. -->
          <DetailRow
            v-if="overview.outboundPastDueDisplay"
            label="Past Due"
            :value="overview.outboundPastDueDisplay"
          />
          <DetailRow
            v-if="overview.outboundStages.length"
            label="Outbound Stage"
          >
            <span class="tx-stage-row">
              <span
                v-for="stage in overview.outboundStages"
                :key="stage.text"
                :class="['mini-bubble', stage.class]"
              >
                {{ stage.text }}
              </span>
            </span>
          </DetailRow>
          <DetailRow
            v-if="overview.outboundFeeDisplay"
            label="Outbound Fee"
            :value="overview.outboundFeeDisplay"
          />
        </div>
      </section>

      <section class="tx-info-card">
        <div class="tx-section-title">Details</div>
        <div class="tx-detail-rows">
          <DetailRow label="Product">
            <ProductBadge label="THORChain" tone="green" />
          </DetailRow>
          <DetailRow
            label="Action"
            :value="overview.isStreaming ? 'Streaming Swap' : 'Swap'"
          />
          <DetailRow label="Status">
            <span class="mini-bubble yellow">{{ overview.status.label }}</span>
          </DetailRow>
          <template v-if="overview.isStreaming">
            <DetailRow label="Quantity" :value="`${overview.quantity} Swaps`" />
            <DetailRow
              label="Stream"
              :value="`${overview.count} / ${overview.quantity}`"
            />
          </template>
          <DetailRow
            v-if="overview.rateDisplay && overview.isStreaming"
            label="Exchange rate"
            :value="overview.rateDisplay"
          />
          <DetailRow label="Time">
            {{ overview.timeDisplay }}
            <span v-if="overview.timeAgoDisplay" class="tx-detail-muted">
              {{ overview.timeAgoDisplay }}
            </span>
          </DetailRow>
          <DetailRow label="Block" :value="overview.heightDisplay" />
          <DetailRow label="From" :value="overview.from" value-type="address" />
          <DetailRow
            v-if="overview.destination && !isOutbound"
            label="Destination"
            :value="overview.destination"
            value-type="address"
          />
        </div>
      </section>

      <LifecycleTimeline :events="lifecycleEvents" />
    </template>

    <template #rail>
      <TxHashCard :hash="overview.hash" :actions="hashActions" />

      <section v-if="overview.feeRows.length" class="tx-info-card">
        <div class="tx-section-title">Fee Breakdown (est.)</div>
        <div class="tx-fee-list">
          <div
            v-for="fee in overview.feeRows"
            :key="fee.label"
            class="tx-fee-row"
          >
            <div
              :class="['tx-fee-label', { 'tx-fee-label--total': fee.isTotal }]"
            >
              {{ fee.label }}
            </div>
            <div class="tx-fee-value-wrap">
              <div
                :class="[
                  'tx-fee-value',
                  { 'tx-fee-value--total': fee.isTotal },
                ]"
              >
                {{ fee.usd }}
              </div>
              <div v-if="fee.subtle" class="tx-fee-subtle">
                {{ fee.subtle }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <TechnicalDetailsCard :memo="overview.memo" :raw-fields="[]" />
    </template>
  </TxHeroShell>
</template>

<script>
import TxHeroShell from '~/pages/tx/components/TxHeroShell.vue'
import TxHashCard from '~/pages/tx/components/TxHashCard.vue'
import TechnicalDetailsCard from '~/pages/tx/components/TechnicalDetailsCard.vue'
import LifecycleTimeline from '~/pages/tx/components/LifecycleTimeline.vue'
import DetailRow from '~/components/transactions/DetailRow.vue'
import ExternalHash from '~/components/transactions/ExternalHash.vue'
import AssetAmountValue from '~/components/transactions/AssetAmountValue.vue'
import AssetIcon from '~/components/AssetIcon.vue'
import ProductBadge from '~/components/ProductBadge.vue'
import ProgressBar from '~/components/ProgressBar.vue'
import ArrowIcon from '~/assets/images/arrow.svg?inline'
import { getLegExplorerUrl } from '~/utils'

// Renders the `streamingOverview` computed from pages/tx/_txhash.vue —
// covers two related in-flight windows swapOverview bails on via
// middle.pending: (1) screen 1d, a swap actively streaming (confirmed
// against a real in-progress tx, 13/85 sub-swaps done), and (2) the
// "swap executed, outbound not yet signed/delivered" window ANY swap
// passes through — streaming or not (confirmed against a real PLAIN swap
// stuck exactly there, still on the legacy path before this was added;
// quantity>1 alone wrongly excluded it). overview.isStreaming/.phase
// distinguish the three states (streaming / outbound-pending-after-stream
// / outbound-pending-plain-swap) — the outbound section reads the same
// accordion-out-N stacks the legacy UI's own Outbound accordion already
// renders. Once output.done too, it's a fully settled swap — already
// served by swapOverview. Static fields come from the same cards/stacks
// every other *Overview reads; live streaming progress
// (count/quantity/fill/remaining/swapped-so-far) comes from a dedicated
// fetch (fetchStreamingProgress, watched in _txhash.vue, streaming phase
// only) reusing the remaining-blocks formula already proven in the
// always-mounted streamingSwap.vue. Built from the shipped swapOverview
// hero's own classes/components so it's visually identical to the
// already-completed swap page; the stream progress bar reuses the
// existing ProgressBar.vue (its color prop already accepts a raw gradient
// string) rather than a new component.
export default {
  components: {
    TxHeroShell,
    TxHashCard,
    TechnicalDetailsCard,
    LifecycleTimeline,
    DetailRow,
    ExternalHash,
    AssetAmountValue,
    AssetIcon,
    ProductBadge,
    ProgressBar,
    ArrowIcon,
  },
  props: {
    overview: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      // Client-side ticking countdown for the outbound-delay bar, mirroring
      // Accordion.vue's own startCountdown/updateCircle for this exact
      // outbound entry: resynced to the authoritative
      // overview.outboundDelayRemainingSeconds on every ~5s poll (via the
      // watcher below), ticking down locally every 1s in between so the bar
      // animates smoothly rather than jumping once per poll.
      outboundDelayTimer: 0,
      outboundDelayTimerTotal: 0,
      outboundDelayInterval: null,
    }
  },
  computed: {
    isOutbound() {
      return this.overview.phase === 'outbound'
    },
    // Only "Input Tx" — the outbound hash (once it exists) already gets its
    // own external-explorer link in the Outbound section's own Hash row
    // above, so it isn't repeated here too.
    hashActions() {
      const url = getLegExplorerUrl(
        this.overview.asset,
        this.overview.inboundHash
      )
      return url ? [{ label: 'Input Tx', to: url, external: true }] : []
    },
    // Same --left-border/--right-border custom-property pattern the shipped
    // swap hero drives its own .tx-asset-panel/.tx-asset-panel--accent
    // borders from (assetColorPalette is a global mixin method, reachable
    // here directly). Only affects the output panel while it's using
    // --accent (streaming/base) — the outbound-pending phase switches that
    // panel to --warning-dashed instead, which hardcodes its own
    // border-color and ignores --right-border.
    panelVars() {
      const inputColor = this.assetColorPalette(this.overview.asset)
      const outputColor = this.assetColorPalette(this.overview.outputAsset)
      return {
        '--left-border': inputColor ?? 'var(--border-color)',
        '--right-border': outputColor ?? 'var(--border-color)',
        // Each panel's .tx-flow-split takes that same asset colour, so the
        // breakdown reads as belonging to the asset it describes. Separate
        // properties rather than reusing the border ones because the
        // fallback has to differ: --border-color is a near-card-dark grey,
        // fine as a 2px border but unreadable as small text, so an asset
        // with no palette colour falls back to the standard accent here.
        '--left-accent': inputColor ?? 'var(--active-primary-color)',
        '--right-accent': outputColor ?? 'var(--active-primary-color)',
      }
    },
    eyebrow() {
      return this.overview.isStreaming
        ? 'Streaming Swap · THORChain'
        : 'Swap · THORChain'
    },
    chips() {
      return [
        { label: '⇄ Swap' },
        {
          label: this.isOutbound
            ? 'Outbound pending'
            : `Streaming ${this.overview.count}/${this.overview.quantity}`,
          tone: 'yellow',
          dot: true,
        },
      ]
    },
    inputTicker() {
      return this.showTicker(this.overview.asset)
    },
    // Both panels headline the FULL amount (input total / projected output
    // total) and break it down underneath into what has settled versus what
    // is still queued — so the two big numbers stay comparable as the
    // exchange the swap is actually making, and the moving parts read as a
    // progress line rather than as a headline figure that keeps changing.
    // Null (no split, headline alone) until the live streaming fetch
    // resolves, and once the stream is done — see outputSplit.
    inputSplit() {
      return this.buildSplit(
        this.overview.swappedSoFarRaw,
        this.overview.amountRaw,
        'swapped',
        'to go',
        // Full base-unit precision on hover, the same deal
        // AssetAmountValue offers on the rounded headline above.
        this.overview.swappedSoFarDisplay
      )
    },
    // Nothing to split once phase is 'outbound': streaming has finished, so
    // the projected total IS the determined output and 100% of it is
    // "delivered" (buildStreamingProgress zeroes the live fields there too).
    outputSplit() {
      if (this.isOutbound) return null
      return this.buildSplit(
        this.overview.outputSoFarRaw,
        this.overview.outputProjectedRaw,
        'delivered',
        'scheduled',
        this.overview.outputSoFarUsdDisplay
          ? `≈ ${this.overview.outputSoFarUsdDisplay} delivered so far`
          : null
      )
    },
    // Full chain.ticker notation (e.g. "ETH.USDC") for the H1, matching
    // overview.amountDisplay's own notation on the input side —
    // overview.outputName (chain display name / bare ticker) is for the
    // panel's primary line only, a different, deliberately terser context.
    outputAssetNotation() {
      return this.showAsset(this.overview.outputAsset)
    },
    lifecycleEvents() {
      const { overview } = this
      const events = [
        {
          icon: 'ArrowIcon',
          iconRotate: 180,
          title: `${this.inputTicker} received by THORChain`,
          body: `${overview.amountDisplay} entered the swap flow from ${this.addressFormatV2(overview.from)}.`,
          meta: overview.timeDisplay,
        },
      ]
      if (overview.isStreaming) {
        events.push({
          icon: 'ExchangeIcon',
          // Only the actively-in-progress step gets the yellow tone — once
          // it's done, this reads as a completed success step like every
          // other one above it.
          tone: this.isOutbound ? null : 'warning',
          title: this.isOutbound
            ? 'Streaming complete'
            : 'Streaming in progress',
          body: `${overview.count} of ${overview.quantity} sub-swaps executed${overview.intervalDisplay ? `, one every ${overview.intervalDisplay}` : ''}.`,
        })
      } else {
        events.push({
          icon: 'ExchangeIcon',
          title: 'Swap executed',
          body: `${overview.amountDisplay} swapped for ${overview.outputProjectedDisplay}.`,
        })
      }
      if (this.isOutbound) {
        events.push({
          icon: 'WarningIcon',
          tone: 'warning',
          title: 'Outbound pending',
          body: overview.outboundPastDueDisplay
            ? `Not yet signed by the vault — ${overview.outboundPastDueDisplay}.`
            : `Not yet signed by the vault${overview.outboundEstDisplay ? ` — expected in ${overview.outboundEstDisplay}` : ''}.`,
        })
      } else {
        if (overview.outputSoFarDisplay) {
          events.push({
            icon: 'ArrowIcon',
            iconRotate: 0,
            // Dashed, not a solid completed-step border — the output is
            // still partial, unlike every solid-bordered step above it.
            dashed: true,
            title: 'Output accumulating',
            body: `${overview.outputSoFarDisplay} received so far${overview.destination ? ` at ${this.addressFormatV2(overview.destination)}` : ''}.`,
          })
        }
        // Only reached while overview.isStreaming (a plain swap always has
        // phase 'outbound', handled by the branch above) — the forward-
        // looking counterpart to "Output accumulating"/"Streaming in
        // progress": what the swap is expected to settle at once the
        // stream itself finishes, not what's landed so far.
        events.push({
          icon: 'AddIcon',
          tone: 'upcoming',
          title: 'Expected output',
          body: `≈ ${overview.outputProjectedDisplay} (${overview.outputProjectedUsdDisplay}) expected once streaming completes.`,
        })
      }
      return events
    },
    outboundDelayFillPercent() {
      if (!this.outboundDelayTimerTotal) return 0
      const elapsed = this.outboundDelayTimerTotal - this.outboundDelayTimer
      return Math.min((elapsed / this.outboundDelayTimerTotal) * 100, 100)
    },
    outboundDelayCountdownDisplay() {
      if (!this.outboundDelayTimerTotal) return null
      const elapsed = this.outboundDelayTimerTotal - this.outboundDelayTimer
      return `${this.formatDelayClock(elapsed)} of ${this.formatDelayClock(this.outboundDelayTimerTotal)}`
    },
    // Two genuinely different waits share this one bar, because THORNode
    // reports them as different stages and only ever one at a time:
    //
    //  1. outbound_delay is still counting down — a known window (large
    //     outbounds are deliberately held before signing). Bar fills as the
    //     window elapses, amber, "MM:SS of MM:SS".
    //  2. outbound_delay is gone/zero but outbound_signed.completed is
    //     false and its scheduled height has already passed — the vault
    //     simply hasn't signed yet. Confirmed against a real tx whose
    //     stages carried NO outbound_delay block at all and whose
    //     scheduled_outbound_height equalled the swap's own height (no
    //     delay was ever applied), sitting 224 blocks unsigned. There's no
    //     window and so no denominator to fill against, so the bar is left
    //     fully hatched in the overdue tone — an indeterminate wait, not a
    //     0%-complete countdown.
    outboundDelayOverdue() {
      return (
        !this.outboundDelayTimerTotal && !!this.overview.outboundPastDueDisplay
      )
    },
    showOutboundDelayBar() {
      return this.outboundDelayTimerTotal > 0 || this.outboundDelayOverdue
    },
    outboundDelayLabel() {
      return this.outboundDelayOverdue ? 'Awaiting Signing' : 'Outbound Delay'
    },
    outboundDelayReadout() {
      return this.outboundDelayOverdue
        ? `${this.overview.outboundPastDueDisplay} past due`
        : this.outboundDelayCountdownDisplay
    },
    outboundDelayNote() {
      return this.outboundDelayOverdue
        ? 'The outbound was scheduled but has not been signed by the vault yet. It stays queued and retries — no action is needed from the sender.'
        : 'Outbounds this large are held before signing. Nothing is signed or broadcast until the timer clears.'
    },
  },
  watch: {
    // Resyncs to the authoritative value every time the page's own poll
    // rebuilds the overview (~5s while pending), same trigger cadence
    // Accordion.vue's remainingTime watcher relies on for this same
    // outbound entry — ticking every 1s locally is purely a smoothing
    // layer between polls, not an independent source of truth.
    'overview.outboundDelayRemainingSeconds': {
      immediate: true,
      handler(seconds) {
        if (this.outboundDelayInterval)
          clearInterval(this.outboundDelayInterval)
        seconds = seconds || 0
        this.outboundDelayTimer = seconds
        if (seconds > this.outboundDelayTimerTotal) {
          this.outboundDelayTimerTotal = seconds
        }
        if (seconds > 0) {
          this.outboundDelayInterval = setInterval(() => {
            if (this.outboundDelayTimer > 0) {
              this.outboundDelayTimer--
            } else {
              clearInterval(this.outboundDelayInterval)
            }
          }, 1000)
        }
      },
    },
  },
  beforeDestroy() {
    if (this.outboundDelayInterval) clearInterval(this.outboundDelayInterval)
  },
  methods: {
    // [{ tone, value, label }] for .tx-flow-split, or null when the settled
    // figure isn't known yet. Same 4dp rounding AssetAmountValue uses for
    // the headline right above it, so the parts visibly add up to the total.
    buildSplit(settledRaw, totalRaw, settledLabel, pendingLabel, settledHint) {
      const settled = Number(settledRaw)
      const total = Number(totalRaw)
      if (settledRaw == null || !Number.isFinite(settled)) return null
      const parts = [
        {
          tone: 'settled',
          value: this.shortAmount(settled),
          label: settledLabel,
          tooltip: settledHint || null,
        },
      ]
      // Only while there's genuinely something left — a stream whose live
      // figure has caught up with the projection shouldn't trail a "0
      // scheduled" that reads as an error.
      const pending = Number.isFinite(total) ? total - settled : 0
      if (pending > 0) {
        parts.push({
          tone: 'pending',
          value: this.shortAmount(pending),
          label: pendingLabel,
          tooltip: null,
        })
      }
      return parts
    },
    // Bare number, no ticker: the panel's own headline and network badge
    // already say which asset this is.
    shortAmount(raw) {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
      }).format(raw / 1e8)
    },
    formatDelayClock(totalSeconds) {
      const s = Math.max(Math.round(totalSeconds), 0)
      const hours = Math.floor(s / 3600)
      const minutes = Math.floor((s % 3600) / 60)
      const seconds = s % 60
      const mm = `${minutes}`.padStart(hours > 0 ? 2 : 1, '0')
      const ss = `${seconds}`.padStart(2, '0')
      return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
    },
  },
}
</script>
