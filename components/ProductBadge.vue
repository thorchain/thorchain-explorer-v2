<template>
  <div class="product-badge">
    <span :class="['product-dot', `tone-${tone}`]" />
    <span class="product-label">{{ label }}</span>
  </div>
</template>

<script>
export default {
  name: 'ProductBadge',
  props: {
    label: {
      type: String,
      required: true,
    },
    tone: {
      type: String,
      default: 'green',
    },
  },
}
</script>

<style lang="scss" scoped>
.product-badge {
  align-items: center;
  display: inline-flex;
  gap: $space-8;
}

.product-label {
  color: var(--sec-font-color);
  font-weight: 600;
}

.product-dot {
  border-radius: 4px;
  display: inline-block;
  flex: 0 0 auto;
  height: 12px;
  width: 12px;
}

.tone-green {
  background: #35f09a;
}
.tone-blue {
  background: #45abff;
}
.tone-gold {
  background: #ffbf3f;
}
.tone-purple,
.tone-violet {
  background: #b878ff;
}
.tone-red {
  background: #ff695e;
}
</style>
