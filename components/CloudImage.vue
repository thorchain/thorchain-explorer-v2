<template>
  <div class="cloud-container">
    <component :is="type" v-tooltip="$options.filters.capitalize(type)" class="asset-icon" />
  </div>
</template>

<script>
import google from '@/assets/images/clouds/google.svg?inline'
import amazon from '@/assets/images/clouds/amazon.svg?inline'
import azure from '@/assets/images/clouds/azure.svg?inline'
import hetzner from '@/assets/images/clouds/hetzner.svg?inline'
import digitalocean from '@/assets/images/clouds/digitalocean.svg?inline'
import vultr from '@/assets/images/clouds/vultr.svg?inline'
import cloud from '@/assets/images/clouds/cloud.svg?inline'

export default {
  components: {
    google,
    amazon,
    azure,
    hetzner,
    digitalocean,
    vultr,
    cloud
  },
  props: ['name'],
  computed: {
    type () {
      if (this.name.includes('Amazon')) {
        return 'amazon'
      } else if (this.name.includes('Google')) {
        return 'google'
      } else if (this.name.includes('Microsoft')) {
        return 'azure'
      } else if (this.name.includes('Hetzner')) {
        return 'hetzner'
      } else if (this.name.includes('DigitalOcean')) {
        return 'digitalocean'
      } else if (this.name.includes('The Constant Company')) {
        return 'vultr'
      } else {
        return 'cloud'
      }
    }
  }
}
</script>

<style lang="scss">
.cloud-container {
  display: flex;
  justify-content: center;

  .asset-icon {
    margin: 0;
    border-radius: 0;
  }
}
</style>
