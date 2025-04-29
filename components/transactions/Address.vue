<template>
  <div
    class="address-container"
    @mouseover="emitHovered"
    @mouseleave="emitRemoveHovered"
  >
    <template v-if="param">
      <component
        :is="disable ? 'span' : 'nuxt-link'"
        v-tooltip="param"
        :class="[
          'mono address',
          { clickable: !disable, hovered: hoveredAddress === param },
        ]"
        :to="!disable ? { path: `/address/${param}` } : undefined"
        >{{ addressFormatV2(param) }}</component
      >
      <copy
        v-if="!disable"
        :str-copy="param"
        style="margin-left: 0.2rem"
      ></copy>
    </template>
    <span v-else :class="['mono', { 'no-hover': disable }]">-</span>
  </div>
</template>

<script>
export default {
  props: {
    param: {
      type: String,
      required: true,
    },
    disable: {
      type: Boolean,
      default: false,
    },
    hoveredAddress: String,
  },
  methods: {
    emitHovered() {
      if (this.param) this.$emit('setHovered', this.param)
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
