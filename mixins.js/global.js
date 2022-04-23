import { AssetImage } from '~/classes/assetImage';

export default {
  methods: {
    assetImage(assetStr) {
      try {
        return AssetImage(assetStr) ?? require('~/assets/images/unknown.png');
      } catch (error) {
        return require('~/assets/images/unknown.png');
      }
    },
    gotoAddr(address) {
      this.$router.push({ path: `/address/${address}` })
    },
    gotoNode(signer) {
      this.$router.push({path: `/node/${signer}`});
    },
    gotoPool(pool) {
      this.$router.push({ path: `/pool/${pool}`});
    },
  }
}