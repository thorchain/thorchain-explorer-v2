import { Chain, isSynthAsset } from '@xchainjs/xchain-util';
import { AssetImage } from '~/classes/assetImage';
import compare from 'semver/functions/compare';
import moment from 'moment';
import { assetFromString } from "~/utils";

export default {
  data: function() {
    return {
      showLoading: {
        color: "var(--primary-color)",
        textColor: 'var(--primary-color)',
        maskColor: 'var(--card-bg-color)',
      }
    }
  },
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
    checkSynth(asset) {
      if (!asset) {
        return false;
      }

      return isSynthAsset(assetFromString(asset));
    },
    fromNow(date) {
      console.log(date, moment(date))
      return moment(date).fromNow();
    },
    normalFormat(number) {
      return number? this.$options.filters.number(+number, '0,0'):'-'
    },
    numberFormat(number) {
      return number? this.$options.filters.number(+number, '0,0.0000'):'-'
    },
    showAsset(assetStr) {
      try {
        const asset = assetFromString(assetStr);
        return asset.chain + '.' + asset.ticker;
      } catch (error) {
        console.error("Can't get the asset:", assetStr);
      }
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
    },
    basicChartFormat(formatter, series, xAxis) {
      return {
        title: {
          show: false,
        },
        tooltip: {
          confine: true,
          trigger: "axis",
          valueFormatter: formatter,
        },
        legend: {
          x: "center",
          y: "bottom",
          icon: "rect",
          textStyle: {
            color: "var(--font-color)",
          },
        },
        xAxis: {
          data: xAxis,
          boundaryGap: false,
          splitLine: {
            show: false,
          },
          axisLine: {
            lineStyle: {
              color: "#9f9f9f",
            },
          },
          axisLabel: {
            color: "#9f9f9f",
            fontFamily: "ProductSans",
          },
        },
        yAxis: {
          show: false,
          splitLine: {
            show: true,
          },
        },
        grid: {
          left: "20px",
          right: "20px",
        },
        series: series,
      };
    },
  }
}
