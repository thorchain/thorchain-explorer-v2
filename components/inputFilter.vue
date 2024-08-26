<template>
  <div class="form-group">
    <label>{{ label }}</label>

    <div :class="['tags-input', tagsWrapClass]">
      <div
        v-if="allowTags"
        v-for="(tag, index) in tags"
        :key="index"
        :class="['mini-bubble']"
      >
        {{ tag }}
        <span class="remove-tag" @click="removeTag(index)">&times;</span>
      </div>

      <input
        type="text"
        v-model="inputValue"
        @keyup.enter="addTag"
        :placeholder="placeholder"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'InputFilter',
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
    }
  },
  computed: {
    tagsWrapClass() {
      return this.tags.length > 2 ? 'wrap' : 'no-wrap'
    },
  },
  methods: {
    addTag() {
      const trimmedValue = this.inputValue.trim()
      if (this.allowTags && trimmedValue && !this.tags.includes(trimmedValue)) {
        this.$emit('update:tags', [...this.tags, trimmedValue])
        this.inputValue = ''
      }
    },
    removeTag(index) {
      this.$emit(
        'update:tags',
        this.tags.filter((_, i) => i !== index)
      )
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
    padding: 4px;
    background-color: var(--bg-color);
    border-radius: 6px;
    border: 1px solid var(--border-color);
    max-height: 100px;
    overflow-y: auto;

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
