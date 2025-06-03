<template>
  <div class="address-container">
    <template v-if="addressStr">
      <component
        :is="disable ? 'span' : 'nuxt-link'"
        v-tooltip="addressStr "
        :class="[
          'mono address',
          { clickable: !disable, hovered: hoveredAddress === addressStr },
        ]"
        :to="!disable ? { path: `/address/${addressStr}` } : undefined"
      >
        {{ getDisplayName }}
      </component>
      <copy v-if="!disable" :str-copy="addressStr" size="small"></copy>
    </template>
    <span v-else :class="['mono', { 'no-hover': disable }]">-</span>
  </div>
</template>

<script>
import addressMap from '~/utils/address'

export default {
  props: {
    addressStr: {
      type: String,
      required: true,
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
  },
  computed: {
    getDisplayName() {
      if (this.useCustomName && addressMap[this.addressStr]) {
        return addressMap[this.addressStr]
      }
      return this.addressFormatV2(this.addressStr)
    },
  },
}
</script>

<style lang="scss" scoped>
.address-container {
  display: inline-flex;
  align-items: center;
  gap: 5px;

  .address {
    display: flex;
    align-items: center;
  }

  .no-hover {
    pointer-events: none;
  }
}
</style>
