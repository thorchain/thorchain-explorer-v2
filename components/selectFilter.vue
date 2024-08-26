<template>
  <div class="form-group">
    <label>{{ label }}</label>
    <div ref="dropdownButton" class="custom-dropdown">
      <div class="dropdown-button" @click="toggleDropdown">
        {{ selected }}
        <AngleIcon class="dropdown-icon" />
      </div>
    </div>
    <div v-if="isOpen" :style="dropdownStyles" class="dropdown-options">
      <div
        v-for="option in options"
        :key="option"
        class="dropdown-option"
        @click="selectOption(option)"
      >
        {{ option }}
      </div>
    </div>
  </div>
</template>

<script>
import AngleIcon from '~/assets/images/angle-down.svg?inline'

export default {
  name: 'SelectFilter',
  components: {
    AngleIcon,
  },
  props: {
    label: String,
    options: Array,
    default: String,
  },
  data() {
    return {
      isOpen: false,
      selected: this.default || 'Select',
      dropdownStyles: {
        position: 'fixed',
        top: '0px',
        left: '0px',
        width: 'auto',
      },
    }
  },
  watch: {
    default(newVal) {
      this.selected = newVal || 'Select'
    }
  },
  mounted() {
    this.selected = this.default || 'Select'
  },
  methods: {
    toggleDropdown() {
      this.isOpen = !this.isOpen
      if (this.isOpen) {
        this.setPosition()
      }
    },
    setPosition() {
      const buttonRect = this.$refs.dropdownButton.getBoundingClientRect()
      this.dropdownStyles = {
        position: 'fixed',
        top: `${buttonRect.bottom}px`,
        left: `${buttonRect.left}px`,
        width: `${buttonRect.width}px`,
      }
    },
    selectOption(option) {
      this.selected = option
      this.isOpen = false
      this.$emit('update:selectedOption', option)
    },
  },
}
</script>

<style scoped>
.form-group {
  flex: 1;
  min-width: 0;
  position: relative;

  label {
    display: block;
    margin-bottom: 8px;
    font-size: 16px;
    font-weight: bold;
    color: var(--sec-font-color);
  }
  .custom-dropdown {
    position: relative;

    .dropdown-button {
      width: 100%;
      padding: 12px 16px;
      font-size: 16px;
      border: none;
      border-bottom: 2px solid var(--border-color);
      border-radius: 6px;
      background-color: var(--bg-color);
      color: var(--sec-font-color);
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-sizing: border-box;
      transition:
        border-color 0.3s ease,
        box-shadow 0.3s ease;

      .dropdown-icon {
        width: 1rem;
        height: 1rem;
        fill: var(--sec-font-color);
      }
    }
  }

  .dropdown-options {
    background-color: var(--bg-color);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    border-radius: 6px;
    margin-top: 0.5rem;
    padding: 0.5rem 0;
    box-sizing: border-box;
    max-height: 400px;
    overflow: auto;
  }

  .dropdown-option {
    padding: 12px 16px;
    font-size: 16px;
    color: var(--sec-font-color);
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: var(--active-bg-color);
      border-radius: 0.3rem;
      color: var(--primary-color);
    }
  }
}
</style>
