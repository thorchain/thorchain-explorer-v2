<template>
  <div class="nav-headers box">
    <div 
      v-for="navItem in navItems"
      @click="$emit('update:activeMode', navItem.mode)" 
      :class="[{'active': activeMode == navItem.mode}, 'nav-item']"
      :key="navItem.mode"
    >
     {{navItem.text}}
    </div>
  </div>
</template>

<script>
export default {
  mode: {
    prop: 'activeMode',
    event: 'update'
  },
  props: ['activeMode', 'navItems'],
  emits: ['update']
}
</script>

<style lang="scss">
//nav headers
.nav-headers {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 1rem;

  .nav-item {
    cursor: pointer;
    padding: 0.5rem 0.7rem;
    margin: 0 0.1rem;
    color: var(--font-color);
    text-decoration: none;
    border-radius: 0.3rem;

    &.active {
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
    border-radius: 5px;

    .nav-item {
      &.active {
        color: var(--primary-color);
      }
    }
  }
}
</style>