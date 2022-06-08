import { assetFromString, Chain, chainToString } from '@xchainjs/xchain-util';
import { AssetImage } from '~/classes/assetImage';
import compare from 'semver/functions/compare';

export default {
  methods: {
    assetImage(assetStr) {
      try {
        return AssetImage(assetStr) ?? require('~/assets/images/unknown.png');
      } catch (error) {
        return require('~/assets/images/unknown.png');
      }
    },
    assetToChain(assetStr) {
      const { chain } = assetFromString(assetStr);
      let asset = `${chain}.${chain}`;
      switch (chain) {
        default:
          break;
      }
      return asset;
    },
    imgErr(e) {
      e.target.src = require('~/assets/images/unknown.png');
    },
    baseChainAsset(chain) {
      switch (chain) {
        case Chain.THORChain:
          return `THOR.RUNE`
        case Chain.Terra:
          return `TERRA.LUNA`;
        default:
          return `${chain}.${chain}`
      }
    },
    gotoAddr(address) {
      this.$router.push({ path: `/address/${address}` })
    },
    gotoTx(hash) {
      this.$router.push({ path: `/tx/${hash}` })
    },
    gotoNode(signer) {
      this.$router.push({path: `/node/${signer}`});
    },
    gotoPool(pool) {
      this.$router.push({ path: `/pool/${pool}`});
    },
    copy(address) {
      navigator.clipboard.writeText(address).then(() => {
        this.copyText = 'Copied';
        setTimeout(() => {
          this.copyText = 'Copy'
        }, 2000);
      }, (err) => {
        console.error('Could not copy text: ', err);
      });
    },
    numberFormat(number) {
      return number? this.$options.filters.number(+number, '0,0.0000'):'-'
    },
    showAsset(assetStr) {
      const asset = assetFromString(assetStr);
      return asset.chain + '.' + asset.ticker;
    },
    baseAmountFormat(number) {
      return number? this.$options.filters.number(+number/10**8, '0,0.0000'):'-'
    },
    formatCurrency(number) {
      return this.$options.filters.currency(number);
    },
    versionSort(x, y, col, rowX, rowY) {
      return (compare(x, y))
    },
    formatAddress(string) {
      if (string && string.length > 12)
        return string.slice(0,6)+'...'+string.slice(-6)
      else
        return string
    },
    gotoNodeUrl(node) {
      return (`${process.env.THORNODE_URL}thorchain/node/${node}`)
    }
  }
}