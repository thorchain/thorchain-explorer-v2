<template>
  <section class="tx-info-card">
    <div class="tx-section-title">Transaction Hash</div>
    <div class="tx-hash-box">
      <div class="tx-asset-label">Full hash</div>
      <div class="tx-hash-full mono">{{ hash }}</div>
    </div>
    <div class="tx-hash-actions">
      <div class="tx-hash-action" @click="$refs.copyBtn.onlyCopy(hash)">
        <Copy ref="copyBtn" :str-copy="hash" :hide-toast="true" />
        <span>Copy</span>
      </div>
      <div class="tx-hash-action" @click="$refs.qrBtn.showQR = true">
        <QrBtn ref="qrBtn" :qrcode="hash" />
        <span>View QR</span>
      </div>
      <component
        :is="action.external ? 'a' : 'nuxt-link'"
        v-for="action in actions"
        :key="action.label"
        class="tx-hash-action"
        v-bind="linkProps(action)"
      >
        <ExternalIcon class="tx-hash-action-icon" />
        <span>{{ action.label }}</span>
      </component>
    </div>
  </section>
</template>

<script>
import Copy from '~/components/Copy.vue'
import QrBtn from '~/components/QrBtn.vue'
import ExternalIcon from '~/assets/images/external.svg?inline'

// Transaction-hash rail card, shared by every hero screen. Reuses the
// shipped swap hero's own .tx-hash-box/.tx-hash-actions/.tx-hash-action
// classes verbatim. QR stays (user decision — diverges from the mockup,
// which drops it) alongside Copy; `actions` supplies the contextual links
// (Input Tx / Outbounds / Node page / Refund Tx) that vary per tx type.
export default {
  components: { Copy, QrBtn, ExternalIcon },
  props: {
    hash: {
      type: String,
      required: true,
    },
    // [{ label, to, external?: boolean }]
    actions: {
      type: Array,
      default: () => [],
    },
  },
  methods: {
    linkProps(action) {
      return action.external
        ? { href: action.to, target: '_blank', rel: 'noopener noreferrer' }
        : { to: action.to }
    },
  },
}
</script>
