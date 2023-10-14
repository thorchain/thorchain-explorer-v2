<template>
  <div class="action-section" ref="actRef" >
    <button class="action-btn mini-bubble info" @click="toggleModal()">
      <slot name="button" />
    </button>
    <div class="modal">
      <transition name="fade-up">
        <div v-show="showModal" :class="['simple-card', 'normal', 'menu', {'right': right}]">
          <slot />
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
export default {
  components: {
  },
  props: ['right'],
  data () {
    return {
      showModal: false
    }
  },
  mounted () {
    window.addEventListener('click', (e) => {
      if (this.$refs.actRef?.contains(e.target) === false) {
        this.showModal = false
      }
    })
  },
  methods: {
    toggleModal () {
      this.showModal = !this.showModal
    }
  }
}
</script>

<style lang="scss" scoped>
.action-section {
  position: relative;

  .action-btn {
    cursor: pointer;
    border-radius: .5rem;

    svg {
        height: 1.3rem;
        width: 1.3rem;
    }
    }
}

.modal {
  .menu {
    z-index: 1000;
    display: flex;
    position: absolute;
    padding: 0.2rem 0;
    right: calc(100% + 10px);
    top: 0;

    &.right {
      right: initial;
      left: calc(100% + 10px);
    }

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
}
</style>
