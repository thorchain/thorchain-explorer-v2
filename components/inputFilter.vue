<template>
  <div class="form-group">
    <label>{{ label }}</label>

    <div :class="['tags-input', tagsWrapClass]">
      <div
        v-for="(tag, index) in tags"
        :key="index"
        :class="['mini-bubble']"
      >
        {{ formatAddress(tag) }}
        <span class="remove-tag" @click="removeTag(index)">&times;</span>
      </div>

      <input
        v-model="inputValue"
        type="text"
        :placeholder="placeholder"
        @focus="handleFocus"
        @blur="handleBlur"
        @keyup.enter="addTag"
      />
      <EnterIcon
        class="enter-icon"
        :class="enterIconClass"
        @click="addTag"
      />
    </div>
  </div>
</template>

<script>
import EnterIcon from '~/assets/images/arrow-turn-down-right.svg?inline'

export default {
  name: 'InputFilter',
  components: {
    EnterIcon,
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
    allowTags: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      inputValue: '',
      isFocused: false,
    }
  },
  computed: {
    tagsWrapClass() {
      return this.tags.length > 0 ? 'wrap' : 'no-wrap'
    },
    enterIconClass() {
      return this.isFocused ? 'enter-icon-visible' : 'enter-icon-hidden'
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
      if (this.inputValue.trim()) {
        this.$emit('update:tags', [...this.tags, this.inputValue.trim()])
        this.inputValue = ''
      }
    },
    handleFocus() {
      this.isFocused = true
    },
    handleBlur() {
      this.isFocused = false
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

  .tags-input {
    display: flex;
    padding-right: 1.3rem; 
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
  }

  input {
    flex-grow: 1;
    min-width: 150px;
    padding: 6px;
    border: none;
    background-color: transparent;
    color: var(--sec-font-color);
    outline: none;
    margin: 2px;
    font-size: 14px;
  }

  .enter-icon {
    width: 1.3rem;
    height: 1.3rem;
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%) scaleX(-1);
    font-size: 18px;
    color: var(--sec-font-color);
    cursor: pointer;
    pointer-events: all;
    opacity: 0;
    transition: opacity 0.3s ease;
    border: 1px solid var(--sec-font-color);
    border-radius: 0.5rem;
    padding: 4px;
    box-sizing: border-box;
    background-color: var(--bg-color);
  }

  .enter-icon-visible {
    opacity: 1;
  }
  
  .mini-bubble {
    font-size: 12px;
    height: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 1px;
    margin-top: 1.5px;
  }

  .remove-tag {
    margin-left: 8px;
    font-size: 10px;
    cursor: pointer;
    color: var(--sec-font-color);
    transition: color 0.3s ease;
  }

  .wrap {
    flex-wrap: wrap;
  }

  .no-wrap {
    flex-wrap: nowrap;
  }
}
</style>
