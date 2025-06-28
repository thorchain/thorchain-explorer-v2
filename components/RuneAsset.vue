<template>
  <span class="rune-asset">
    <AssetIcon 
      v-if="asset === 'THOR.RUNE'"
      :asset="asset"
      :height="height"
      :class="customClass"
    />
    <component
      v-else-if="showIcon"
      :is="getAssetIconComponent()"
      :style="{ height }"
      :class="customClass"
    />
    <span v-else :class="customClass">{{ getAssetSymbol() }}</span>
  </span>
</template>

  
  <script>
  import runeIcon from '~/assets/images/rune.svg?inline'
  import AssetIcon from '~/components/AssetIcon.vue'
  
  export default {
    name: 'RuneAsset',
    components: {
      AssetIcon
    },
    props: {
      height: {
        type: String,
        default: '1.2rem'
      },
      showIcon: {
        type: Boolean,
        default: true
      },
      symbol: {
        type: String,
        default: 'RUNE'
      },
      icon: {
        type: String,
        default: runeIcon
      },
      environment: {
        type: String,
        default: 'mainnet'
      },
      customClass: {
        type: String,
        default: ''
      },
      asset: {
        type: String,
        default: null
      }
    },
    methods: {
      getAssetConfig() {
        const configs = {
          mainnet: {
            symbol: 'RUNE',
            icon: runeIcon,
            name: 'Thorchain Rune'
          },
          stagenet: {
            symbol: 'RUNE',
            icon: runeIcon,
            name: 'Stagenet Rune'
          },
        }
        
        return configs[this.environment] || configs.mainnet
      },
      getRuneAssetHTML(showIcon = false, height = '1.2rem') {
      if (showIcon) {
        return `<svg style="height: ${height}; fill: var(--sec-font-color);" viewBox="0 0 15.859 30.71" xmlns="http://www.w3.org/2000/svg"><polygon points="3.865 30.71 0 30.71 0 0 3.865 0 13.758 5.587 13.758 9.809 10.23 15.859 15.859 30.71 11.742 30.71 6.155 15.649 10.482 8.129 3.865 4.39 3.865 30.71" style="fill-rule: evenodd; stroke-width: 0px;"/></svg>`
      } else {
        return `<span>${this.getAssetSymbol()}</span>`
      }
    },      
      getAssetSymbol() {
        if (this.asset === 'THOR.RUNE') {
          return this.getAssetConfig().symbol
        }
        
        if (this.symbol !== 'RUNE') {
          return this.symbol
        }
        
        return this.getAssetConfig().symbol
      },
      
      getAssetIconComponent() {
        if (this.asset === 'THOR.RUNE') {
          return this.getAssetConfig().icon
        }
        
        if (this.icon !== runeIcon) return this.icon
        return this.getAssetConfig().icon
      },
      
      getAssetName() {
        return this.getAssetConfig().name
      }
    },
    
    created() {
      if (!this.$props.environment || this.$props.environment === 'mainnet') {
        const network = process.env.NETWORK || 'mainnet'
        
        if (network === 'stagenet') {
          this.environment = 'stagenet'
        } else {
          this.environment = 'mainnet'
        }
      }
    }
  }
  </script>
  
  <style scoped>
  .rune-asset {
    display: inline-flex;
    align-items: center;
    fill: var(--sec-font-color);
    font-size: 11px;
  }
  </style>
  
  