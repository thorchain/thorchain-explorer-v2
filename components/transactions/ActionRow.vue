<template>
  <div class="tx-item">
    <div class="tx-item-row tx-item-head">
      <nuxt-link
        v-if="txHash"
        class="tx-hash mono clickable"
        :to="`/tx/${txHash}`"
      >
        {{ addressFormatV2(txHash) }}
      </nuxt-link>
      <span v-else class="tx-hash internal">Internal Tx</span>
      <span v-tooltip="absoluteDate" class="tx-meta">{{ relativeDate }}</span>
    </div>

    <div class="tx-item-row tx-item-action">
      <TransactionAction
        :row="row"
        :show-mini-bubble="false"
        :no-border="true"
      />
      <span
        v-if="assetTag"
        v-tooltip="assetTag.tooltip"
        :class="['asset-tag', assetTag.tone]"
      >
        {{ assetTag.label }}
      </span>
    </div>

    <div class="tx-item-row tx-item-foot">
      <span class="tx-from">
        <small>From</small>
        <Address
          :address="fromAddress"
          :use-custom-name="true"
          copy-size="small"
        ></Address>
      </span>
      <nuxt-link
        v-if="row.height"
        class="tx-meta tx-height clickable"
        :to="`/block/${row.height}`"
      >
        {{ row.height | number('0,0') }}
      </nuxt-link>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import TransactionAction from '~/components/transactions/TransactionAction.vue'
import Address from '~/components/transactions/Address.vue'
import { assetFromString } from '~/utils'

const EMPTY_TX_ID =
  '0000000000000000000000000000000000000000000000000000000000000000'

// One Midgard action rendered as a three-line row: hash + age, the action
// itself, then origin + block. Shared so the dashboard's Latest Transactions
// and TOP Swaps lists cannot drift apart.
export default {
  name: 'ActionRow',
  components: {
    TransactionAction,
    Address,
  },
  props: {
    // A raw Midgard action — `date` in nanoseconds, not pre-formatted.
    row: {
      type: Object,
      required: true,
    },
  },
  computed: {
    // An all-zero txID is Midgard's placeholder for a network-internal action
    // (no inbound chain tx to link to), so there is nothing to route to.
    txHash() {
      const txID = this.row?.in?.[0]?.txID
      return txID && txID !== EMPTY_TX_ID ? txID : null
    },
    fromAddress() {
      return this.row?.in?.[0]?.address
    },
    momentDate() {
      const date = this.row?.date
      return date ? moment(Number.parseInt(date / 10 ** 6)) : null
    },
    relativeDate() {
      return this.momentDate ? this.momentDate.fromNow() : ''
    },
    // The exact timestamp stays one hover away — a 24h list needs the age at a
    // glance, but "3 hours ago" is not enough to line rows up against a block.
    absoluteDate() {
      return this.momentDate
        ? this.momentDate.format('MMM D, YYYY HH:mm')
        : null
    },
    // Trade/secure assets carry no chain icon of their own, so flag them with
    // a badge instead of leaving the row indistinguishable from an L1 swap.
    assetTag() {
      const assets = [...(this.row?.in ?? []), ...(this.row?.out ?? [])]
        .map((ops) => ops?.coins?.[0]?.asset)
        .filter(Boolean)
        .map((asset) => assetFromString(asset))

      if (assets.some((a) => a?.trade)) {
        return { label: 'T', tone: 'blue', tooltip: 'Trade asset' }
      }
      if (assets.some((a) => a?.secure)) {
        return { label: 'S', tone: 'purple', tooltip: 'Secure asset' }
      }
      if (assets.some((a) => a?.synth)) {
        return { label: 'Y', tone: 'gold', tooltip: 'Synth asset' }
      }
      return null
    },
  },
}
</script>

<style lang="scss" scoped>
.tx-item {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  padding: $space-10 $space-0;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }

  .tx-item-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-8;
    min-width: 0;
  }

  .tx-item-action {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .tx-hash {
    font-size: $font-size-sm;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.internal {
      color: var(--sec-font-color);
    }
  }

  .tx-meta {
    font-size: $font-size-sm;
    // Note the tokens read backwards: --sec-font-color is the bright one
    // (#e6e6e6) and --font-color the muted body tone (#9f9f9f), which is
    // where the timestamp sits — off the hash, but not pushed to the back.
    color: var(--font-color);
    white-space: nowrap;
    flex-shrink: 0;

    // Beats plain .clickable, so the height link stays dim until hovered.
    &.clickable:hover {
      color: var(--active-primary-color);
    }
  }

  // The height is the least load-bearing thing in the row, so it sits one
  // step further back than the timestamp.
  .tx-height {
    color: var(--text-dim-color);
  }

  .tx-from {
    display: inline-flex;
    align-items: center;
    gap: $space-4;
    min-width: 0;
    overflow: hidden;
    font-size: $font-size-sm;

    small {
      color: var(--sec-font-color);
    }
  }

  .asset-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 1.1rem;
    min-width: 1.1rem;
    padding: $space-0 $space-4;
    border-radius: $radius-sm;
    font-size: $font-size-xs;
    font-weight: 600;
    line-height: 1;
    color: #fff;
    flex-shrink: 0;

    &.blue {
      background: #45abff;
    }
    &.purple {
      background: #b878ff;
    }
    &.gold {
      background: #ffbf3f;
    }
  }
}
</style>
