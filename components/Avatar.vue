<template>
  <div v-if="avatarUrl" class="avatar-container">
    <img :src="avatarUrl" alt="Address Avatar" />
  </div>
</template>

<script>
import { createAvatar } from '@dicebear/core'
import { identicon } from '@dicebear/collection'
import { toPng } from '@dicebear/converter'

export default {
  props: {
    name: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      avatarUrl: '',
    }
  },
  watch: {
    name: 'generateAvatar',
  },
  mounted() {
    this.generateAvatar()
  },
  methods: {
    async generateAvatar() {
      try {
        const avatar = createAvatar(identicon, { seed: this.name }).toString()

        const png = await toPng(avatar)
        const dataUri = await png.toDataUri()

        this.avatarUrl = dataUri
      } catch (error) {
        console.error('Error generating avatar:', error)
      }
    },
  },
}
</script>

<style scoped>
.avatar-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-color);
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--border-color);
}

.avatar-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
