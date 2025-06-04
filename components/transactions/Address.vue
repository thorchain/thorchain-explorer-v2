<template>
  <div
    class="address-container"
    @mouseover="emitHovered"
    @mouseleave="emitRemoveHovered"
  >
    <template v-if="address">
      <component
        :is="disable ? 'span' : 'nuxt-link'"
        v-tooltip="address"
        :class="[
          'mono address',
          { clickable: !disable, hovered: hoveredAddress === address },
        ]"
        :to="!disable ? { path: `/address/${address}` } : undefined"
      >
        {{ displayText }}
      </component>
      <copy
        v-if="!disable && showCopyIcon"
        :str-copy="address"
        :size="copySize"
        style="margin-left: 0.2rem"
      />
    </template>
    <span v-else class="mono no-hover">-</span>
  </div>
</template>

<script>
import addressMap from '~/utils/address'

export default {
  props: {
    address: {
      type: String,
      default: '',
    },
    disable: {
      type: Boolean,
      default: false,
    },
    hoveredAddress: {
      type: String,
      default: undefined,
    },
    useCustomName: {
      type: Boolean,
      default: false,
    },
    copySize: {
      type: String,
      default: 'normal',
      validator: (value) => ['small', 'normal'].includes(value),
    },
    showCopyIcon: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    displayText() {
      if (!this.address) return ''

      if (this.useCustomName && addressMap[this.address]) {
        return addressMap[this.address]
      }
      return this.addressFormatV2
        ? this.addressFormatV2(this.address)
        : this.address
    },
  },
  methods: {
    emitHovered() {
      if (this.address) this.$emit('setHovered', this.address)
    },
    emitRemoveHovered() {
      this.$emit('removeHovered')
    },
  },
}
</script>

<style lang="scss" scoped>
.address-container {
  display: inline-flex;
  align-items: center;

  .address {
    border: 1px solid transparent;
    padding: $space-0 $space-4;

    &.hovered {
      border: 1px dashed var(--highlight);
      color: var(--active-primary-color) !important;
      border-radius: $radius-xs;
    }
  }

  .no-hover {
    pointer-events: none;
  }
}
</style>
