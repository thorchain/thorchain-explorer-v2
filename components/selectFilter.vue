<template>
  <div class="form-group">
    <label>{{ label }}</label>
    <div ref="dropdownButton" class="custom-dropdown">
      <div class="dropdown-button" @click="toggleDropdown">
        <div class="selected-options">
          <span v-if="selectedOptions.length <= 3">
            <span
              v-for="option in selectedOptions"
              :key="option"
              :class="['mini-bubble']"
            >
              {{ option }}
              <CrrosIcon
                class="remove-tag"
                @click.stop="removeOption(option)"
              />
            </span>
          </span>
          <span v-else :class="['mini-bubble', 'multiple-selected']">
            {{ selectedOptions.length }} selected
            <CrrosIcon class="remove-tag" @click.stop="clearSelections" />
          </span>
          <span v-if="selectedOptions.length === 0">All</span>
        </div>
        <AngleIcon class="dropdown-icon" />
      </div>
    </div>
    <div v-if="isOpen" :style="dropdownStyles" class="dropdown-options">
      <div
        v-for="option in options"
        :key="option"
        class="dropdown-option"
        :class="{ selected: selectedOptions.includes(option) }"
        @click="toggleOption(option)"
      >
        <checkIcon v-if="selectedOptions.includes(option)" class="checkmark" />
        {{ option }}
      </div>
    </div>
  </div>
</template>

<script>
import AngleIcon from '~/assets/images/angle-down.svg?inline'
import checkIcon from '~/assets/images/check.svg?inline'
import CrrosIcon from '~/assets/images/cross.svg?inline'

export default {
  name: 'SelectFilter',
  components: {
    AngleIcon,
    checkIcon,
    CrrosIcon,
  },
  props: {
    label: String,
    options: Array,
    default: Array,
  },
  data() {
    return {
      isOpen: false,
      selectedOptions: this.default || [],
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
      this.selectedOptions = newVal || []
    },
  },
  mounted() {
    this.selectedOptions = this.default || []
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
    toggleOption(option) {
      if (this.selectedOptions.includes(option)) {
        this.removeOption(option)
      } else {
        this.addOption(option)
      }
    },
    addOption(option) {
      this.selectedOptions.push(option)
      this.$emit('update:selectedOptions', this.selectedOptions)
    },
    removeOption(option) {
      this.selectedOptions = this.selectedOptions.filter(
        (opt) => opt !== option
      )
      this.$emit('update:selectedOptions', this.selectedOptions)
    },
    clearSelections() {
      this.selectedOptions = []
      this.$emit('update:selectedOptions', this.selectedOptions)
    },
  },
}
</script>

<style scoped lang="scss">
.form-group {
  flex: 1;
  min-width: 0;
  position: relative;

  .selected-options {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .mini-bubble {
    font-size: $font-size-xs;
    height: 17px;
    margin-top: $space-2;
    margin-left: $space-2;
  }
  .remove-tag {
    color: var(--sec-font-color);
    margin-left: $space-8;
    cursor: pointer;
    width: 0.5rem;
    height: 0.5rem;
  }
  .dropdown-option.selected {
    border-radius: $radius-s;
    color: var(--primary-color);
  }
  label {
    display: block;
    margin-bottom: $space-8;
    font-size: $font-size-desktop;
    font-weight: bold;
    color: var(--sec-font-color);
  }
  .custom-dropdown {
    position: relative;

    .dropdown-button {
      width: 100%;
      padding: $space-12 $space-10;
      font-size: $font-size-desktop;
      border: none;
      border-radius: $radius-md;
      background-color: var(--bg-color);
      color: var(--sec-font-color);
      border: 1px solid var(--border-color);
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
    border-radius: $radius-md;
    margin-top: $space-8;
    padding: $space-8 $space-0;
    box-sizing: border-box;
    max-height: 200px;
    overflow: auto;
  }
  .dropdown-option {
    position: relative;
    padding: $space-12 34px;
    font-size: $font-size-desktop;
    color: var(--sec-font-color);
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: var(--active-bg-color);
      border-radius: $radius-s;
      color: var(--primary-color);
    }

    .checkmark {
      width: 0.8rem;
      height: 0.8rem;
      position: absolute;
      left: 12px;
      top: calc(50% - 0.4rem);
      fill: var(--primary-color);
      border: none;
    }
  }
  .dropdown-options::-webkit-scrollbar {
    width: 5px;
  }

  .dropdown-options::-webkit-scrollbar-track {
    background-color: var(--border-color);
  }

  .dropdown-options::-webkit-scrollbar-thumb {
    background-color: var(--font-color);
    border-radius: $radius-sm;
  }
}
</style>
