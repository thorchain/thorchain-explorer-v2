<template>
  <div class="action-section" ref="actRef" >
    <button :class="['action-btn mini-bubble info', {'on': onCss}]" @click="toggleStyle()" :id="`popover-${name}-${index}`">
      <slot name="button" />
    </button>
    <div class="modal">
      <transition name="fade-up">
        <b-popover
          triggers="click"
          :target="`popover-${name}-${index}`"
        >
          <div :class="['simple-card', 'normal', 'menu', {'right': right}]">
            <slot />
          </div>
        </b-popover>
      </transition>
    </div>
  </div>
</template>

<script>
export default {
  components: {
  },
  props: ['right', 'name', 'index'],
  data () {
    return {
      onCss: false
    }
  },
  mounted () {
  },
  methods: {
    toggleStyle () {
      this.onCss = !this.onCss
    }
  }
}
</script>

<style lang="scss">
.action-section {
  position: relative;

  .action-btn {
    cursor: pointer;
    border-radius: .5rem;

    &.on {
      background-color: var(--active-bg-color);
    }

    svg {
      height: 1.3rem;
      width: 1.3rem;
    }
  }
}

.menu {
  padding: .2rem;
  display: flex;
  margin: 0.5rem;

  a {
    display: flex;
    align-items: center;
    color: var(--font-color);
    text-decoration: none;
    padding: 0.5rem;
    border-radius: 0.2rem;
    margin: 0 0.2rem;
    gap: 10px;
    font-family: "Exo 2";
    font-size: 0.9rem;
    text-wrap: nowrap;

    .menu-icon {
      fill: inherit;
      widows: 1rem;
      height: 1rem;
    }

    &:hover {
      background-color: var(--darker-bg);
    }

    .menu-icon {
      width: 1.3rem;
      height: 1.3rem;
    }
  }
}
</style>
