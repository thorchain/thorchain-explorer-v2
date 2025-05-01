<template>
  <div class="address-container">
    <template v-if="addressStr">
      <component
        :is="disable ? 'span' : 'nuxt-link'"
        v-tooltip="addressStr"
        :class="[
          'mono address',
          { clickable: !disable, hovered: hoveredAddress === addressStr },
        ]"
        :to="!disable ? { path: `/address/${addressStr}` } : undefined"
        >{{ addressFormatV2(addressStr) }}</component
      >
      <copy v-if="!disable" :str-copy="addressStr" size="small"></copy>
    </template>
    <span v-else :class="['mono', { 'no-hover': disable }]">-</span>
  </div>
</template>

<script>
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
