<template>
  <div :id="name" :ref="name" class="option-wrapper" @click="toggleDialog">
    <span v-if="!$slots['default']">{{ option.label }}</span>
    <slot v-else />
    <angle-icon :class="['select-caret', { rotated: showDialog }]" />
    <div v-show="showDialog" :ref="`${name}-dialog`" class="option-dialog">
      <div
        v-for="(o, i) in options"
        :key="i"
        :class="['option-item', { active: o.value == option.value }]"
        @click="handleSelect(o)"
      >
        <slot name="option" :option="o">
          <span>{{ o.label }}</span>
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
import AngleIcon from '~/assets/images/angle-down.svg?inline'

export default {
  components: {
    AngleIcon,
  },
  props: ['options', 'option', 'name'],
  emits: ['update:option'],
  data() {
    return {
      showDialog: false,
    }
  },
  mounted() {
    window.addEventListener('click', (e) => {
      if (!document.getElementById(this.name).contains(e.target)) {
        this.showDialog = false
      }
    })
  },
  methods: {
    handleSelect(o) {
      this.$emit('update:option', o)
    },
    toggleDialog() {
      this.showDialog = !this.showDialog
    },
  },
}
</script>

<style lang="scss">
.option-wrapper {
  position: relative;
  padding: $space-8 $space-16;
  border-radius: $radius-lg;
  background-color: var(--card-bg-color);
  border: 1px solid var(--border-color);
  display: flex;
  justify-content: center;
  cursor: pointer;

  > span {
    text-align: center;
    color: var(--primary-color);
  }

  .select-caret {
    flex-shrink: 0;
    align-self: center;
    width: 1rem;
    height: 1rem;
    margin-left: $space-6;
    fill: var(--font-color);
    transition: transform 0.3s ease;

    &.rotated {
      transform: rotate(180deg);
    }
  }
}

.option-dialog {
  position: absolute;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: $radius-lg;
  max-width: 250px;
  top: calc(100% + 10px);
  max-height: 400px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-track {
    background-color: var(--border-color);
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--font-color);
    border-radius: $radius-s;
  }

  // target the option rows only - a bare `div` here also hit any
  // markup passed through the option slot (icons, wrappers) and
  // clipped it with the row's padding/min-height/overflow
  > .option-item {
    cursor: pointer;
    background: var(--card-bg-color);
    color: var(--font-color);
    border: none;
    padding: $space-8 $space-16;
    text-decoration: none;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    min-height: 2rem;

    span {
      white-space: nowrap;
    }

    &:first-of-type {
      border-radius: $radius-lg $radius-lg 0 0;
    }

    &:last-of-type {
      border-radius: 0 0 $radius-lg $radius-lg;
    }

    &:hover {
      background: var(--darker-bg);
      color: var(--primary-color);
    }

    &.active {
      color: var(--primary-color);

      &:hover {
        background-color: var(--card-bg-color);
      }
    }
  }
}
</style>
