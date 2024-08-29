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
          @focus="handleFocus"
          @blur="handleBlur"
          @keyup.enter="addTag"
        />
        <EnterIcon class="enter-icon" :class="enterIconClass" @click="addTag" />
      </div>
    </div>
  </div>
</template>

<script>
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
      return this.tags.length > 2 ? 'wrap' : 'no-wrap'
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
        width: 1.3rem;
        height: 1.3rem;
        transform: scaleX(-1);
        pointer-events: all;
        color: var(--sec-font-color);
        margin-left: 0.5rem;
        transition: color 0.2s;
        pointer-events: all;
        opacity: 0;
        transition: opacity 0.3s ease;
        border: 1px solid var(--sec-font-color);
        border-radius: 0.5rem;
        padding: 4px;
        background-color: var(--bg-color);
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
    transition: color 0.3s ease;
    width: 0.5rem;
    height: 0.5rem;
  }
  .wrap {
    flex-wrap: wrap;
  }

  .no-wrap {
    flex-wrap: nowrap;
  }
}
</style>
