<template>
  <div @mouseover="emitHovered" @mouseleave="emitRemoveHovered">
    <template v-if="param">
      <component
        :is="disable ? 'span' : 'nuxt-link'"
        :class="[
          'mono',
          { clickable: !disable, hovered: hoveredAddress === param},
        ]"
        :to="!disable ? { path: `/address/${param}` } : undefined"
      >
        {{ addressFormatV2(param) }}
      </component>
      <copy v-if="!disable" :str-copy="param"></copy>
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
      if (this.param) this.$emit('setHovered', this.param);
    },
    emitRemoveHovered() {
      this.$emit('removeHovered');
    },
  },
};
</script>

<style lang="scss" scoped>
.hovered {
  border: 1px dashed var(--highlight);
  color: var(--active-primary-color) !important;
  border-radius: 0.5rem;
  padding: 2px 4px;
  margin-right: 0.5rem;
}

.no-hover {
  pointer-events: none;
}
</style>
