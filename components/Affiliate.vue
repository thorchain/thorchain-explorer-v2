<template>
  <div class="affiliate-content">
    <template v-if="affiliates && affiliates.length">
      <component :is="showLink ? 'nuxt-link' : 'div'" class="affiliate-direct"
        :to="showLink ? { path: navigateToAffiliate() } : undefined">
        <div v-for="affiliate in affiliates" :key="affiliate" v-tooltip="affiliateWallet(affiliate).name"
          class="executed">
          <img v-if="affiliateWallet(affiliate).icon" :src="affiliateWallet(affiliate).icon"
            :alt="affiliateWallet(affiliate).name" />
          <em v-else>{{ affiliateWallet(affiliate).name }}</em>
          <em v-if="affiliateWallet(affiliate).addName">
            {{ affiliateWallet(affiliate).name }}
          </em>
        </div>
      </component>
    </template>
  </div>
</template>

<script>
import { interfaces, affiliateMap } from '@/utils'

export default {
  props: {
    affiliateAddress: {
      type: String,
      default: null,
    },
    useNewIcons: {
      type: Boolean,
      default: false,
    },
    showLink: {
      type: Boolean,
      default: true,
    },
  },

  computed: {
    affiliates() {
      if (!this.affiliateAddress) return null
      return this.affiliateAddress.split('/')
    },
    currentAffiliateMap() {
      return affiliateMap
    },
    currentInterfaces() {
      return interfaces
    },
  },

  methods: {
    navigateToAffiliate() {
      return `/txs?affiliate=${this.affiliates.join('/')}`
    },

    loadIconVariants(iconName, preferNoName = false) {
      const icons = {
        url: undefined,
        urlDark: undefined,
      }

      if (!iconName) return icons

      const iconPaths = preferNoName
        ? [
          { url: `${iconName}-no-name.png`, urlDark: `${iconName}-no-name-dark.png` },
          { url: `${iconName}.png`, urlDark: `${iconName}-dark.png` }
        ]
        : [
          { url: `${iconName}.png`, urlDark: `${iconName}-dark.png` },
          { url: `${iconName}-no-name.png`, urlDark: `${iconName}-no-name-dark.png` }
        ]

      for (const path of iconPaths) {
        try {
          icons.url = require(`@/assets/images/${path.url}`)

          try {
            icons.urlDark = require(`@/assets/images/${path.urlDark}`)
          } catch (e) {
            icons.urlDark = icons.url
          }
          break
        } catch (e) {
          continue
        }
      }

      return icons
    },

    mapAffiliateName(s) {
      const ifc = this.currentAffiliateMap[s]
      if (!ifc) {
        return undefined
      }

      const icons = this.loadIconVariants(ifc.icon, this.useNewIcons)

      return {
        name: ifc.name ?? ifc,
        icons,
        addName: ifc.addName ?? null,
      }
    },

    affiliateWallet(affiliate) {
      if (!affiliate) return { name: '', icon: null }
      affiliate = affiliate.trim()
      const detail = this.mapAffiliateName(affiliate)

      if (!detail) {
        return {
          name: affiliate,
          icon: null,
        }
      }

      const theme = this.$store.getters.getTheme || 'light'
      const icon =
        (theme === 'dark' || theme === 'BlueElectra') && detail.icons.urlDark
          ? detail.icons.urlDark
          : detail.icons.url

      return {
        icon,
        name: detail.name,
        addName: detail.addName,
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.affiliate-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: $space-8;

  .affiliate-direct {
    display: flex;
    align-items: center;
    text-decoration: none;
    gap: $space-8;
  }

  .executed {
    display: flex;
    align-items: center;
    color: var(--sec-font-color);
    border-color: var(--border-color);
    background-color: transparent;
    gap: $space-8;

    em {
      white-space: nowrap;
      max-width: 78px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    img {
      height: 1.2rem;
      max-width: 78px;
    }
  }
}
</style>
