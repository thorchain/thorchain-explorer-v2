<template>
  <div class="tx-detail-row">
    <div class="tx-detail-key">{{ label }}</div>
    <div class="tx-detail-value">
      <slot>
        <Address v-if="valueType === 'address'" :address="value" />
        <Hash v-else-if="valueType === 'hash'" :param="value" />
        <nuxt-link v-else-if="valueType === 'link'" :to="to" class="tx-link">
          {{ value }}
        </nuxt-link>
        <span v-else>{{ value }}</span>
      </slot>
    </div>
  </div>
</template>

<script>
import Address from '~/components/transactions/Address.vue'
import Hash from '~/components/transactions/Hash.vue'

// Generic label/value row for the tx-detail redesign's Details/rail cards.
// Reuses the shipped swap hero's own .tx-detail-row/.tx-detail-key/
// .tx-detail-value classes and the same per-type rendering it already does
// (address/hash/link/plain) rather than a parallel row style. Anything
// richer (a status chip, a ProductBadge) is passed via the default slot.
export default {
  components: { Address, Hash },
  props: {
    label: {
      type: String,
      required: true,
    },
    value: {
      type: [String, Number],
      default: '',
    },
    valueType: {
      type: String,
      default: 'text',
      validator: (value) => ['text', 'address', 'hash', 'link'].includes(value),
    },
    to: {
      type: [String, Object],
      default: null,
    },
  },
}
</script>
