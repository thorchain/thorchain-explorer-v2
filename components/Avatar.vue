<template>
  <div v-if="avatarSvg" v-html="avatarSvg"></div>
</template>

<script>
import { createAvatar } from '@dicebear/core'
import { identicon } from '@dicebear/collection'

export default {
  props: {
    name: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      avatarSvg: '',
    }
  },
  mounted() {
    this.generateAvatar()
  },
  watch: {
    name: 'generateAvatar',
  },
  methods: {
    generateAvatar() {
      try {
        const avatar = createAvatar(identicon, { seed: this.name })
        this.avatarSvg = avatar.toString()
      } catch (error) {
        console.error('Error generating avatar:', error)
      }
    },
  },
}
</script>

<style scoped>
div {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--border-color);
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  overflow: hidden;
}
</style>
