<template>
  <component :is="activeComponent" @click="onlyCopy(strCopy)" :class="['table-icon', {'active': activeComponent === 'CopiedIcon'}]"></component>
</template>

<script>
import CopyIcon from '~/assets/images/file.svg?inline';
import CopiedIcon from '~/assets/images/copied.svg?inline';

export default {
  props: ['strCopy'],
  components: {
    CopiedIcon,
    CopyIcon
  },
  data() {
    return {
      activeComponent: 'CopyIcon'
    }
  },
  methods: {
    onlyCopy(address) {
      navigator.clipboard.writeText(address).then(() => {
        this.activeComponent = 'CopiedIcon';
        setTimeout(() => {
          this.activeComponent = 'CopyIcon';
        }, 2000);
      }, (err) => {
        console.error('Could not copy text: ', err);
      });
    },
  }
}
</script>

<style>
.copy-container {
  height: 1rem;
}
</style>
