<template>
  <div ref="actRef" class="action-section">
    <button
      :id="`popover-${name}-${index}`"
      :class="['action-btn mini-bubble info', { on: onCss }]"
      @click="toggle()"
    >
      <slot name="button" />
    </button>
    <b-popover :target="`popover-${name}-${index}`" :show.sync="showModal">
      <div :class="['simple-card', 'normal', 'drop-menu', { right: right }]">
        <slot />
      </div>
    </b-popover>
  </div>
</template>

<script>
export default {
  components: {},
  props: ['right', 'name', 'index'],
  data() {
    return {
      onCss: false,
      showModal: false,
    }
  },
  mounted() {
    window.addEventListener('click', (e) => {
      if (this.$refs.actRef?.contains(e.target) === false) {
        this.showModal = false
        this.onCss = false
      }
    })
  },
  methods: {
    toggle() {
      this.showModal = !this.showModal
      this.onCss = !this.onCss
    },
  },
}
</script>

<style lang="scss">
.action-section {
  position: relative;

  .action-btn {
    cursor: pointer;
    border-radius: $radius-lg;

    &.on {
      background-color: var(--active-bg-color);
    }

    svg {
      height: 1.3rem;
      width: 1.3rem;
    }
  }
}

.drop-menu {
  padding: $space-4;
  display: flex;
  margin: $space-8;

  a {
    display: flex;
    align-items: center;
    color: var(--font-color);
    text-decoration: none;
    padding: $space-8;
    border-radius: $radius-sm;
    margin: $space-0 $space-4;
    gap: 10px;
    font-family: 'Exo 2';
    font-size: $font-size-mobile;
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
