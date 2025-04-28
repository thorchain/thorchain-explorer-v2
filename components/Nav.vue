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
  margin-bottom: 10px;

  .pre-text {
    color: var(--sec-font-color);
    padding: 0 10px;
    margin: auto 0;
  }

  .nav-item {
    cursor: pointer;
    padding: 0.5rem 0.7rem;
    margin: 0 0.1rem;
    color: var(--font-color);
    text-decoration: none;
    border-radius: 0.3rem;

    &.active,
    &.nuxt-link-exact-active {
      background-color: var(--active-bg-color);
      color: var(--sec-font-color);
    }

    &:hover {
      background-color: var(--active-bg-color);
    }

    &:first-of-type {
      margin-left: 0;
    }
  }

  &.box {
    padding: 0.2rem;
    background-color: var(--bg-color);
    border: 1px solid var(--border-color);
    border-width: 1px;
    margin: 0px 10px 10px 10px;
    border-radius: 5px;

@include lg {
  margin: 0px 0px 10px 0px;
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
