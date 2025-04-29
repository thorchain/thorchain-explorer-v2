<template>
  <div class="cloud-container">
    <component
      :is="type"
      v-if="type"
      v-tooltip="$options.filters.capitalize(name[0])"
      class="asset-icon"
    />
    <img
      v-else
      v-tooltip="$options.filters.capitalize(name[0])"
      :src="imagePath"
      class="asset-image"
    />
  </div>
</template>

<script>
export default {
  props: ['name'],
  computed: {
    type() {
      const name = this.name.map((e) => e.toLowerCase())
      let host = this.findOrg(name[0])
      if (host === undefined) {
        host = this.findOrg(name[1])
      }

      if (host === undefined) {
        return require('@/assets/images/clouds/cloud.svg?inline')
      }

      return host
    },
    imagePath() {
      const name = this.name[0].toLowerCase()
      if (name.includes('routerhosting')) {
        return require('@/assets/images/clouds/cloudzy.png')
      } else if (name.includes('leaseweb')) {
        return require('@/assets/images/clouds/leaseweb.png')
      }

      return ''
    },
  },
  methods: {
    findOrg(name) {
      if (name.includes('amazon')) {
        return require('@/assets/images/clouds/amazon.svg?inline')
      } else if (name.includes('google')) {
        return require('@/assets/images/clouds/google.svg?inline')
      } else if (name.includes('microsoft')) {
        return require('@/assets/images/clouds/azure.svg?inline')
      } else if (name.includes('hetzner')) {
        return require('@/assets/images/clouds/hetzner.svg?inline')
      } else if (name.includes('digitalocean')) {
        return require('@/assets/images/clouds/digitalocean.svg?inline')
      } else if (
        name.includes('the constant company') ||
        name.includes('vultr') ||
        name.includes('choopa')
      ) {
        return require('@/assets/images/clouds/vultr.svg?inline')
      } else if (name.includes('hostinger')) {
        return require('@/assets/images/clouds/hostinger.svg?inline')
      } else if (name.includes('cogent')) {
        return require('@/assets/images/clouds/cogent.svg?inline')
      } else if (name.includes('datacamp')) {
        return require('@/assets/images/clouds/datacamp.svg?inline')
      } else if (name.includes('ovh')) {
        return require('@/assets/images/clouds/ovh.svg?inline')
      } else if (name.includes('comcast')) {
        return require('@/assets/images/clouds/comcast.svg?inline')
      } else if (name.includes('ionos')) {
        return require('@/assets/images/clouds/ionos.svg?inline')
      } else if (name.includes('routerhosting') || name.includes('leaseweb')) {
        return false
      }

      return undefined
    },
  },
}
</script>

<style lang="scss">
.cloud-container {
  display: flex;
  justify-content: center;

  .asset-icon {
    margin: $space-0;
    border-radius: $radius-none;
  }

  .asset-image {
    width: 1.5rem;
  }
}
</style>
