<template>
  <div class="affiliate-content">
    <template v-if="affiliates && affiliates.length">
      <component
        :is="showLink ? 'nuxt-link' : 'div'"
        class="affiliate-direct"
        :to="showLink ? { path: navigateToAffiliate() } : undefined"
      >
        <div
          v-for="affiliate in affiliates"
          :key="affiliate"
          v-tooltip="affiliateWallet(affiliate).name"
          class="executed"
        >
          <img
            v-if="affiliateWallet(affiliate).icon"
            :src="affiliateWallet(affiliate).icon"
            :alt="affiliateWallet(affiliate).name"
          />
          <em v-else>{{ affiliateWallet(affiliate).name }}</em>
        </div>
      </component>
    </template>
  </div>
</template>

<script>
const defaultInterfaces = {
  thorswap: {
    name: 'THORSwap',
    icon: 'thorswap',
  },
  shapeshift: {
    name: 'Shapeshift',
    icon: 'shapeshift',
  },
  trustwallet: {
    name: 'Trust Wallet',
    icon: 'trustwallet',
  },
  thorwallet: {
    name: 'THORWallet',
    icon: 'thorwallet',
  },
  xdefi: {
    name: 'Ctrl',
    icon: 'ctrl',
  },
  asgardex: {
    name: 'ASGARDEX',
    icon: 'asgardex',
  },
  lifi: {
    name: 'LIFI',
    icon: 'lifi',
  },
  edge: {
    name: 'Edge Wallet',
    icon: 'edge',
  },
  okx: {
    name: 'OKX',
    icon: 'okx',
  },
  onekey: {
    name: 'One Key',
    icon: 'onekey',
  },
  symbiosis: {
    name: 'Symbiosis',
    icon: 'symbiosis',
  },
  defispot: {
    name: 'Defispot',
    icon: 'defispot',
  },
  vultisig: {
    name: 'Vultisig',
    icon: 'vultisig',
  },
  eldorito: {
    name: 'ELDORITO',
    icon: 'eldorito',
  },
  ll: {
    name: 'Live Ledger',
    icon: 'ledger',
  },
  zengo: {
    name: 'Zengo',
    icon: 'zengo',
  },
  cakewallet: {
    name: 'CakeWallet',
    icon: 'cakewallet',
  },
  rango: {
    name: 'Rango Exchange',
    icon: 'rango',
  },
  sk: {
    name: 'SwapKit',
    icon: 'swapkit',
  },
  is: {
    name: 'InstaSwap',
    icon: 'instaswap',
  },
  bgw: {
    name: 'BitGet Wallet',
    icon: 'bgw',
  },
  fortuna: {
    name: 'Fortuna Swap',
    icon: 'fortunaswap',
  },
  tps: {
    name: 'Token Pocket',
    icon: 'tokenpocket',
  },
  moca: {
    name: 'Moca',
    icon: 'moca',
    addName: true,
  },
  gemwallet: {
    name: 'GemWallet',
    icon: 'gemwallet',
  },
  rujira: {
    name: 'Rujira',
    icon: 'rujira',
  },
  eld: {
    name: 'Eld',
    icon: 'eld',
  },
  cacaoswap: {
    name: 'CacaoSwap',
    icon: 'cacaoswap',
  },
  Leodex: {
    name: 'LeoDex',
    icon: 'Leodex',
  },
}

const defaultAffiliateMap = {
  leo: defaultInterfaces.Leodex,
  td: defaultInterfaces.trustwallet,
  ti: defaultInterfaces.trustwallet,
  tr: defaultInterfaces.trustwallet,
  te: defaultInterfaces.trustwallet,
  tb: defaultInterfaces.trustwallet,
  thor1a427q3v96psuj4fnughdw8glt5r7j38lj7rkp8: defaultInterfaces.thorwallet,
  wr: defaultInterfaces.thorwallet,
  tgt: defaultInterfaces.thorwallet,
  thorwallet: defaultInterfaces.thorwallet,
  thor160yye65pf9rzwrgqmtgav69n6zlsyfpgm9a7xk: defaultInterfaces.thorswap,
  T: defaultInterfaces.thorswap,
  t: defaultInterfaces.thorswap,
  tl: defaultInterfaces.thorswap,
  ts: defaultInterfaces.thorswap,
  thor17suv0n437snv68axkx64whutkrvefv7pzq7xep: defaultInterfaces.thorswap,
  ss: defaultInterfaces.shapeshift,
  xdf: defaultInterfaces.xdefi,
  dx: defaultInterfaces.asgardex,
  lifi: defaultInterfaces.lifi,
  ej: defaultInterfaces.edge,
  okw: defaultInterfaces.okx,
  oky: defaultInterfaces.onekey,
  sy: defaultInterfaces.symbiosis,
  Eldorito: defaultInterfaces.eldorito,
  v0: defaultInterfaces.vultisig,
  va: defaultInterfaces.vultisig,
  vi: defaultInterfaces.vultisig,
  ll: defaultInterfaces.ll,
  zengo: defaultInterfaces.zengo,
  cakewallet: defaultInterfaces.cakewallet,
  rg: defaultInterfaces.rango,
  ro: defaultInterfaces.rango,
  sk: defaultInterfaces.sk,
  is: defaultInterfaces.is,
  ds: defaultInterfaces.defispot,
  bgw: defaultInterfaces.bgw,
  fs: defaultInterfaces.fortuna,
  tps: defaultInterfaces.tps,
  moca: defaultInterfaces.moca,
  '-_': defaultInterfaces.sk,
  g1: defaultInterfaces.gemwallet,
  thor1xmaggkcln5m5fnha2780xrdrulmplvfrz6wj3l: defaultInterfaces.shapeshift,
  rj: defaultInterfaces.rujira,
  eld: defaultInterfaces.eld,
  cs: defaultInterfaces.cacaoswap,
}

const newInterfaces = {
  asgard: {
    name: 'ASGARD',
    icon: 'asgardicon',
  },
  trustwallet: {
    name: 'TrustWallet',
    icon: 'trustwalleticon',
  },
  eld2: {
    name: 'Eld2',
    icon: 'eld',
  },
  ledger: {
    name: 'Live Ledger',
    icon: 'ledger',
  },
  lifi: {
    name: 'LIFI',
    icon: 'lifiicon',
  },
  sk: {
    name: 'SwapKit',
    icon: 'swapkiticon',
  },
  thorwallet: {
    name: 'THORWallet',
    icon: 'thorwalleticon',
  },
  thorswap: {
    name: 'THORSwap',
    icon: 'thorswapicon',
  },
  rango: {
    name: 'Rango Exchange',
    icon: 'rangoicon',
  },
  edge: {
    name: 'Edge Wallet',
    icon: 'edgeicon',
  },
  rujira: {
    name: 'Rujira',
    icon: 'rujiraicon',
  },
  zengoicon: {
    name: 'Zengo2',
    icon: 'zengoicon',
  },
  bgw: {
    name: 'BitGet Wallet',
    icon: 'bgwicon',
  },
  shapeshift: {
    name: 'Shapeshift',
    icon: 'shapeshifticon',
  },
  gemwallet: {
    name: 'GemWallet',
    icon: 'gemwalleticon',
  },
  xdefi: {
    name: 'Ctrl',
    icon: 'ctrlicon',
  },
  okx2: {
    name: 'OKX',
    icon: 'okx',
  },
  onekey2: {
    name: 'One Key',
    icon: 'onekey',
  },
  vultisig: {
    name: 'Vultisig',
    icon: 'vultisigicon',
  },
  cacaoswap: {
    name: 'CacaoSwap',
    icon: 'cacaoswapicon',
  },
  Leodex: {
    name: 'LeoDex',
    icon: 'Leodexicon',
  },
}

const newAffiliateMap = {
  leo: newInterfaces.Leodex,
  cs: newInterfaces.cacaoswap,
  dx: newInterfaces.asgard,
  td: newInterfaces.trustwallet,
  te: newInterfaces.trustwallet,
  tb: newInterfaces.trustwallet,
  ti: newInterfaces.trustwallet,
  eld: newInterfaces.eld2,
  ll: newInterfaces.ledger,
  lifi: newInterfaces.lifi,
  '-_': newInterfaces.sk,
  wr: newInterfaces.thorwallet,
  tgt: newInterfaces.thorwallet,
  t: newInterfaces.thorswap,
  T: newInterfaces.thorswap,
  tl: newInterfaces.thorswap,
  ts: newInterfaces.thorswap,
  rg: newInterfaces.rango,
  ro: newInterfaces.rango,
  ej: newInterfaces.edge,
  rj: newInterfaces.rujira,
  zengo: newInterfaces.zengoicon,
  bgw: newInterfaces.bgw,
  ss: newInterfaces.shapeshift,
  g1: newInterfaces.gemwallet,
  xdf: newInterfaces.xdefi,
  okw: newInterfaces.okx2,
  oky: newInterfaces.onekey2,
  v0: newInterfaces.vultisig,
  va: newInterfaces.vultisig,
  vi: newInterfaces.vultisig,
}

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
      return this.useNewIcons ? newAffiliateMap : defaultAffiliateMap
    },
    currentInterfaces() {
      return this.useNewIcons ? newInterfaces : defaultInterfaces
    },
  },

  methods: {
    navigateToAffiliate() {
      return `/txs?affiliate=${this.affiliates.join('/')}`
    },
    mapAffiliateName(s) {
      const ifc = this.currentAffiliateMap[s]
      if (!ifc) {
        return undefined
      }

      const icons = {
        url: undefined,
        urlDark: undefined,
      }

      if (ifc.icon) {
        try {
          icons.url = require(`@/assets/images/${ifc.icon}.png`)
          icons.urlDark = require(`@/assets/images/${ifc.icon}-dark.png`)
        } catch (e) {}
      }

      return {
        name: ifc.name ?? ifc,
        icons,
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

    img {
      height: 1.2rem;
      max-width: 78px;
    }
  }
}
</style>
