<template>
  <div class="transaction-hash">
    <template v-if="param">
      <a
        v-if="explorerUrl"
        class="clickable mono"
        :href="explorerUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ addressFormatV2(param) }}
        <ExternalIcon class="transaction-hash-external-icon" />
      </a>
      <nuxt-link v-else class="clickable mono" :to="{ path: `/tx/${param}` }">
        {{ addressFormatV2(param) }}
      </nuxt-link>
      <copy v-if="showCopy" :str-copy="param"></copy>
    </template>
    <span v-else>-</span>
  </div>
</template>

<script>
import { getLegExplorerUrl } from '~/utils'
import Copy from '~/components/Copy.vue'
import ExternalIcon from '~/assets/images/external.svg?inline'

// Like Hash.vue, but for a chain-native outbound/inbound leg hash rather
// than a THORChain-observed tx — this site's own /tx/{hash} page only
// indexes THORChain txs, so a BTC/ETH/etc. outbound hash needs to link to
// that chain's own explorer instead. Falls back to the internal /tx/ link
// when the leg's asset has no mapped explorer (THOR-native legs, e.g. a
// RUNE refund, or an unmapped chain) — that hash IS one this site indexes.
export default {
  components: { Copy, ExternalIcon },
  props: {
    param: {
      type: String,
      default: null,
    },
    asset: {
      type: String,
      default: null,
    },
    showCopy: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    explorerUrl() {
      return getLegExplorerUrl(this.asset, this.param)
    },
  },
}
</script>

<style lang="scss" scoped>
.transaction-hash {
  display: flex;
  align-items: center;
  gap: 8px;
}

.transaction-hash-external-icon {
  fill: currentColor;
  width: 0.7rem;
  height: 0.7rem;
  vertical-align: middle;
}
</style>
