<template>
  <div class="nav-headers box">
    <component :is="isLink? 'nuxt-link':'div'" 
      v-for="navItem in navItems"
      @click="!isLink? $emit('update:activeMode', navItem.mode):false" 
      :class="[{'active': activeMode && activeMode === navItem.mode}, 'nav-item']"
      :key="navItem.mode"
      :to="isLink? navItem.link:false"
    >
     {{navItem.text}}
    </component>
  </div>
</template>

<script>
export default {
  mode: {
    prop: 'activeMode',
    event: 'update'
  },
  props: ['activeMode', 'navItems', 'isLink'],
  emits: ['update']
}
</script>

<style lang="scss">
//nav headers
.nav-headers {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 10px;

  .nav-item {
    cursor: pointer;
    padding: 0.5rem 0.7rem;
    margin: 0 0.1rem;
    color: var(--font-color);
    text-decoration: none;
    border-radius: 0.3rem;

    &.active, &.nuxt-link-exact-active {
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
    border-width: 1px 0 1px 0;

    .nav-item {
      &.active, &.nuxt-link-exact-active {
        color: var(--primary-color);
      }
    }

  }

  @include lg {
    border-radius: 5px;

    &.box {
      border-width: 1px;
    }
  }
}
</style>