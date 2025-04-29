<template>
  <div :class="['nav-headers box', ...extraClasses]">
    <span v-if="preText" class="pre-text">
      {{ preText }}
    </span>
    <component
      :is="isLink ? 'nuxt-link' : 'div'"
      v-for="navItem in filteredNav"
      :key="navItem.mode"
      :class="[
        { active: activeMode && activeMode === navItem.mode },
        'nav-item',
      ]"
      :to="isLink ? navItem.link : false"
      @click="!isLink ? $emit('update:activeMode', navItem.mode) : false"
    >
      {{ navItem.text }}
    </component>
  </div>
</template>

<script>
export default {
  mode: {
    prop: 'activeMode',
    event: 'update',
  },
  props: [
    'activeMode',
    'navItems',
    'isLink',
    'extraClasses',
    'preText',
    'hide',
  ],
  emits: ['update'],
  computed: {
    filteredNav() {
      return this.navItems.filter((n) => n.hide !== true)
    },
  },
}
</script>

<style lang="scss">
//nav headers
.nav-headers {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: $space-10;

  .pre-text {
    color: var(--sec-font-color);
    padding: $space-0 $space-10;
    margin: auto $space-0;
  }

  .nav-item {
    cursor: pointer;
    padding: $space-8 $space-12;
    margin: $space-0 0.1rem;
    color: var(--font-color);
    text-decoration: none;
    border-radius: $radius-s;

    &.active,
    &.nuxt-link-exact-active {
      background-color: var(--active-bg-color);
      color: var(--sec-font-color);
    }

    &:hover {
      background-color: var(--active-bg-color);
    }

    &:first-of-type {
      margin-left: $space-0;
    }
  }

  &.box {
    padding: $space-3;
    background-color: var(--bg-color);
    border: 1px solid var(--border-color);
    border-width: 1px;
    margin: $space-0 $space-10 $space-10 $space-10;
    border-radius: $radius-s;

    @include lg {
      margin: $space-0 $space-0 $space-10 $space-0;
    }

    .nav-item {
      &.active,
      &.nuxt-link-exact-active {
        color: var(--primary-color);
      }
    }
  }
}
</style>
