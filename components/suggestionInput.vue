<template>
  <div class="input-filter">
    <label>{{ label }}</label>
    <ul v-if="filteredSuggestions.length > 0" class="suggestions">
      <li
        v-for="(suggestion, index) in filteredSuggestions"
        :key="index"
        @click="selectSuggestion(suggestion)"
      >
        {{ suggestion }}
      </li>
    </ul>
    <div :class="['tags-input', tagsWrapClass]">
      <div v-for="(tag, index) in tags" :key="index" :class="['mini-bubble']">
        {{ format ? formatAddress(tag) : tag }}
        <CrossIcon class="remove-tag" @click="removeTag(index)" />
      </div>
      <div id="input-container">
        <input
          type="text"
          v-model="searchTerm"
          :placeholder="placeholder"
          @input="onInput"
          @focus="onFocus"
          @blur="onBlur"
          @keyup.enter="addTag"
        />

        <EnterIcon
          class="enter-icon"
          :class="{
            'enter-icon-visible': isFocused,
            'enter-icon-hidden': !isFocused,
          }"
          @click="addTag"
        />
      </div>
    </div>
  </div>
</template>

<script>
import EnterIcon from '~/assets/images/arrow-turn-down-right.svg?inline'
import CrossIcon from '~/assets/images/cross.svg?inline'

export default {
  name: 'SuggestionInput',
  components: {
    EnterIcon,
    CrossIcon,
  },
  props: {
    suggestions: {
      type: Array,
      required: true,
    },
    tags: {
      type: Array,
      required: true,
    },
    placeholder: {
      type: String,
      default: 'Enter text...',
    },
    label: {
      type: String,
      default: 'Input Filter',
    },
    format: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      searchTerm: '',
      isFocused: false,
    }
  },
  computed: {
    filteredSuggestions() {
      const query = this.searchTerm.toLowerCase()
      if (query.length < 2) {
        return []
      }
      if (!this.tags.includes('All')) {
        return [
          'All',
          ...this.suggestions.filter((item) =>
            item.toLowerCase().includes(query)
          ),
        ]
      }
      return []
    },
    tagsWrapClass() {
      return this.tags.length > 2 ? 'wrap' : 'no-wrap'
    },
  },

  methods: {
    onInput() {
      this.$emit('input', this.searchTerm)
    },
    onFocus() {
      this.isFocused = true
    },
    onBlur() {
      this.isFocused = false
    },
    addTag() {
      if (this.searchTerm && !this.tags.includes(this.searchTerm)) {
        this.$emit('update:tags', [...this.tags, this.searchTerm])
      }
      this.searchTerm = ''
    },
    removeTag(index) {
      const updatedTags = [...this.tags]
      updatedTags.splice(index, 1)
      this.$emit('update:tags', updatedTags)
    },
    selectSuggestion(suggestion) {
      if (suggestion === 'All') {
        this.$emit('update:tags', ['All'])
      } else {
        if (!this.tags.includes(suggestion)) {
          this.$emit('update:tags', [...this.tags, suggestion])
        }
      }
      this.searchTerm = ''
    },
    formatAddress(tag) {
      return `Formatted(${tag})`
    },
  },
}
</script>

<style lang="scss" scoped>
.form-group,
.input-filter {
  flex: 1;
  min-width: 0;
  position: relative;
  margin: $space-0 $space-10;

  @include lg {
    margin: $space-0;
  }

  label {
    display: block;
    margin-bottom: $space-8;
    font-size: $font-size-desktop;
    font-weight: bold;
    color: var(--sec-font-color);
  }
}

.tags-input {
  display: flex;
  background-color: var(--bg-color);
  border-radius: $radius-md;
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
      background-color: transparent;
      border-radius: $radius-lg;
      border: none;
      padding: $space-8;
      font-size: $font-size-sm;
      outline: none;
    }
    .enter-icon {
      cursor: pointer;
      width: 1.7rem;
      height: 1.3rem;
      transform: scaleX(-1);
      pointer-events: all;
      color: var(--sec-font-color);
      margin-left: $space-8;
      transition: color 0.2s;
      pointer-events: all;
      opacity: 0;
      transition: opacity 0.3s ease;
      border: 1px solid var(--border-color);
      border-radius: $radius-sm;
      padding: $space-4;
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
  font-size: $font-size-xs;
  height: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: $space-5;
  margin-top: $space-2;
  height: auto;
}

.remove-tag {
  margin-left: $space-8;
  cursor: pointer;
  color: var(--sec-font-color);
  width: 0.5rem;
  height: 0.5rem;
}
.wrap {
  flex-wrap: wrap;
}

.no-wrap {
  flex-wrap: wrap;
}

.suggestions {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background-color: var(--bg-color);
  border-radius: $radius-md;
  margin-top: $space-2;
  padding: $space-8 $space-0;
  z-index: 1000;
  overflow: auto;
  max-height: 200px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
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

  li {
    align-items: center;
    color: var(--sec-font-color);
    cursor: pointer;
    display: flex;
    flex-direction: row;
    font-size: $font-size-s;
    line-height: 1.5;
    padding: $space-12 $space-16;
    transition: background-color 0.3s ease;

    &:hover {
      color: var(--primary-color);
      background-color: var(--active-bg-color);
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
  background-color: var(--primary-color);
}
</style>
