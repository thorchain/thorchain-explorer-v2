<template>
  <div class="form-group">
    <label>{{ label }}</label>

    <div :class="['tags-input', tagsWrapClass]">
      <div v-for="(tag, index) in tags" :key="index" :class="['mini-bubble']">
        {{ formatAddress(tag) }}
        <CrrosIcon class="remove-tag" @click="removeTag(index)" />
      </div>
      <div id="input-container">
        <input
          v-model="inputValue"
          type="text"
          :placeholder="placeholder"
          @input="debouncedOnInput"
          @focus="handleFocus"
          @blur="handleBlur"
          @keyup.enter="addTag"
        />
        <EnterIcon class="enter-icon" :class="enterIconClass" @click="addTag" />
      </div>
    </div>
    <ul v-if="showSuggestions && filteredOptions.length" class="suggestions">
      <li
        v-for="option in filteredOptions"
        :key="option"
        @mousedown.prevent="selectOption(option)"
      >
        <asset-icon :asset="option" class="asset-icon" />
        {{ formatAsset(option) }}
      </li>
    </ul>
  </div>
</template>

<script>
import debounce from 'lodash/debounce'
import EnterIcon from '~/assets/images/arrow-turn-down-right.svg?inline'
import CrrosIcon from '~/assets/images/cross.svg?inline'

export default {
  name: 'InputFilter',
  components: {
    EnterIcon,
    CrrosIcon,
  },
  props: {
    label: {
      type: String,
      default: '',
    },
    tags: {
      type: Array,
      default: () => [],
    },
    placeholder: {
      type: String,
      default: '',
    },
    suggestions: {
      type: Array,
      default: () => [],
    },
    allowTags: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      inputValue: '',
      isFocused: false,
      showSuggestions: false,
    }
  },
  computed: {
    tagsWrapClass() {
      return this.tags.length > 2 ? 'wrap' : 'no-wrap'
    },
    enterIconClass() {
      return this.isFocused ? 'enter-icon-visible' : 'enter-icon-hidden'
    },
    filteredOptions() {
      const query = this.inputValue.toLowerCase()
      if (query.length < 2) {
        return []
      }
      return this.suggestions.filter((option) =>
        option.toLowerCase().includes(query)
      )
    },
  },
  methods: {
    removeTag(index) {
      this.$emit(
        'update:tags',
        this.tags.filter((_, i) => i !== index)
      )
    },
    addTag() {
      const trimmedValue = this.inputValue.trim()
      if (trimmedValue && !this.tags.includes(trimmedValue)) {
        this.$emit('update:tags', [...this.tags, trimmedValue])
        this.inputValue = ''
        this.showSuggestions = false
      }
    },

    debouncedOnInput: debounce(function () {
      this.showSuggestions = true
    }, 300),

    handleFocus() {
      this.isFocused = true
      if (this.inputValue.trim().length > 2) {
        this.showSuggestions = true
      }
    },
    handleBlur() {
      this.isFocused = false
      this.showSuggestions = false
    },
    selectOption(asset) {
      if (!this.tags.includes(asset)) {
        this.$emit('update:tags', [...this.tags, asset])
        this.inputValue = ''
        this.showSuggestions = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
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

  .tags-input {
    display: flex;
    background-color: var(--bg-color);
    border-radius: 6px;
    border: 1px solid var(--border-color);
    max-height: 100px;
    overflow-y: auto;
    position: relative;
    align-items: center;

    ::-webkit-scrollbar {
      display: none;
    }
    scrollbar-width: none;
    -ms-overflow-style: none;

    #input-container {
      display: inline-flex;
      align-items: center;
      flex-grow: 1;
      position: relative;

      input {
        flex-grow: 1;
        height: 38px;
        color: var(--sec-font-color);
        background-color: var(--card-bg-color);
        border-radius: 0.5rem;
        border: none;
        padding: 0.5rem;
        font-size: 14px;
        background-color: transparent;
        outline: none;
      }

      .enter-icon {
        cursor: pointer;
        width: 1.7rem;
        height: 1.3rem;
        transform: scaleX(-1);
        pointer-events: all;
        color: var(--sec-font-color);
        margin-left: 0.5rem;
        transition: color 0.2s;
        pointer-events: all;
        opacity: 0;
        transition: opacity 0.3s ease;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 4px;
        background-color: var(--bg-color);

        &:hover {
          color: var(--primary-color);
        }
      }

      .enter-icon-visible {
        opacity: 1;
      }
    }
  }

  .mini-bubble {
    font-size: 12px;
    height: 17px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 6px;
    margin-top: 2px;
    height: auto;
  }

  .remove-tag {
    margin-left: 8px;
    cursor: pointer;
    color: var(--sec-font-color);
    width: 0.5rem;
    height: 0.5rem;
  }

  .wrap {
    flex-wrap: wrap;
  }

  .no-wrap {
    flex-wrap: nowrap;
  }
  .suggestions {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background-color: var(--bg-color);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    margin-top: 2px;
    padding: 0.5rem 0;
    z-index: 1000;
    overflow: auto;
    max-height: 200px;
    animation: slideDown 0.3s ease forwards;

    @keyframes slideDown {
      0% {
        opacity: 0;
        transform: translateY(-20px);
      }

      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    ul {
      list-style: none;
    }
    li {
      display: flex;
      flex-direction: row;
      padding: 12px 16px;
      font-size: 13px;
      color: var(--sec-font-color);
      cursor: pointer;
      transition: background-color 0.3s ease;

      &:hover {
        color: var(--primary-color);
      }
      .asset-icon {
        margin-right: 15px;
      }
    }
  }

  .suggestions::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  .suggestions::-webkit-scrollbar-track {
    background-color: var(--border-color);
  }

  .suggestions::-webkit-scrollbar-thumb {
    background-color: var(--active-bg-color);
    border-radius: 5px;
  }
}
</style>
