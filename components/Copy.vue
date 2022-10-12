<template>
  <component :is="activeComponent" :class="['table-icon', {'active': activeComponent === 'CopiedIcon'}]" @click="onlyCopy(strCopy)" />
</template>

<script>
import CopyIcon from '~/assets/images/file.svg?inline'
import CopiedIcon from '~/assets/images/copied.svg?inline'

export default {
  components: {
    CopiedIcon,
    CopyIcon
  },
  props: ['strCopy'],
  data () {
    return {
      activeComponent: 'CopyIcon'
    }
  },
  methods: {
    onlyCopy (address) {
      navigator.clipboard.writeText(address).then(() => {
        this.activeComponent = 'CopiedIcon'
        setTimeout(() => {
          this.activeComponent = 'CopyIcon'
        }, 2000)
      }, (err) => {
        console.error('Could not copy text: ', err)
      })
    }
  }
}
</script>

<style>
.copy-container {
  height: 1rem;
}
</style>
