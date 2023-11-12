import { bnOrZero, formatBN, AssetCurrencySymbol, isSynthAsset } from '@xchainjs/xchain-util'
import compare from 'semver/functions/compare'
import moment from 'moment'
import { AssetImage } from '~/classes/assetImage'
import { assetFromString } from '~/utils'
import endpoints from '~/api/endpoints'

export default {
  data () {
    return {
      showLoading: {
        color: 'var(--primary-color)',
        textColor: 'var(--primary-color)',
        maskColor: 'var(--card-bg-color)'
      }
    }
  },
  methods: {
    assetImage (assetStr) {
      try {
        return AssetImage(assetStr) ?? require('~/assets/images/unknown.png')
      } catch (error) {
        return require('~/assets/images/unknown.png')
      }
    },
    assetToChain (assetStr) {
      const { chain } = assetFromString(assetStr)
      let asset = `${chain}.${chain}`
      switch (chain) {
        case 'GAIA':
          asset = 'GAIA.ATOM'
          break
        case 'BSC':
          asset = 'BSC.BNB'
          break
        default:
          break
      }
      return asset
    },
    imgErr (e) {
      e.target.src = require('~/assets/images/unknown.png')
    },
    baseChainAsset (chain) {
      switch (chain) {
        case 'THOR':
          return 'THOR.RUNE'
        case 'TERRA':
          return 'TERRA.LUNA'
        default:
          return `${chain}.${chain}`
      }
    },
    goto (url) {
      this.$router.push({ path: `${url}` })
    },
    gotoAddr (address) {
      this.$router.push({ path: `/address/${address}` })
    },
    popRandomColor () {
      const defaultColors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc']
      const rand = Math.random()
      const color = defaultColors[Math.floor(rand * defaultColors.length)]
      defaultColors.splice(Math.floor(rand * defaultColors.length), 1)
      return color
    },
    getAssetColor (asset) {
      switch (asset) {
        case 'BTC.BTC':
          return '#EF8F1C'
        case 'ETH.ETH':
          return '#627EEA'
        case 'LTC.LTC':
          return '#335E9D'
        case 'DOGE.DOGE':
          return '#BCA23E'
        case 'BNB.BNB':
        case 'BSC.BNB':
          return '#F0BC18'
        case 'BCH.BCH':
          return '#4DCA48'
        case 'AVAX.AVAX':
          return '#E84142'
        case 'GAIA.ATOM':
          return '#303249'
        case 'ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48':
        case 'AVAX.USDC-0XB97EF9EF8734C71904D8002F8B6BC66DD9C48A6E':
          return '#2775ca'
        case 'BNB.BUSD-BD1':
          return '#ffc300'
        case 'ETH.USDT-0XDAC17F958D2EE523A2206206994597C13D831EC7':
          return '#26A17B'
        default:
          return this.popRandomColor()
      }
    },
    getChainColor (asset) {
      switch (asset) {
        case 'BTC':
          return '#EF8F1C'
        case 'ETH':
          return '#627EEA'
        case 'LTC':
          return '#335E9D'
        case 'DOGE':
          return '#BCA23E'
        case 'BNB':
          return '#F0BC18'
        case 'BCH':
          return '#4DCA48'
        case 'AVAX':
          return '#E84142'
        case 'GAIA':
          return '#303249'
        default:
          return this.popRandomColor()
      }
    },
    isInternalTx (hash) {
      if (hash === '0000000000000000000000000000000000000000000000000000000000000000') {
        return true
      }
      return false
    },
    gotoTx (hash) {
      if (hash === '0000000000000000000000000000000000000000000000000000000000000000') {
        return
      }
      this.$router.push({ path: `/tx/${hash}` })
    },
    isValidTx(hash) {
      if (hash === '0000000000000000000000000000000000000000000000000000000000000000') {
        return false
      }
      return true
    },
    gotoNode (signer) {
      this.$router.push({ path: `/node/${signer}` })
    },
    gotoPool (pool) {
      this.$router.push({ path: `/pool/${pool}` })
    },
    copy (address) {
      navigator.clipboard.writeText(address).then(() => {
        this.copyText = 'Copied'
        setTimeout(() => {
          this.copyText = 'Copy'
        }, 2000)
      }, (err) => {
        console.error('Could not copy text: ', err)
      })
    },
    checkSynth (asset) {
      if (!asset) {
        return false
      }

      return isSynthAsset(assetFromString(asset))
    },
    fromNow (date) {
      return moment(date).fromNow()
    },
    percentageFormat (number, decimal) {
      return number ? this.$options.filters.percent(number, decimal ?? 4) : '-'
    },
    normalFormat (number) {
      return number ? this.$options.filters.number(+number, '0,0') : '-'
    },
    numberFormat (number) {
      return number ? this.$options.filters.number(+number, '0,0.0000') : '-'
    },
    showAsset (assetStr) {
      try {
        const asset = assetFromString(assetStr)
        return asset.chain + '.' + asset.ticker
      } catch (error) {
        console.error("Can't get the asset:", assetStr)
      }
    },
    baseAmountFormat (number) {
      return number ? this.$options.filters.number(+number / 10 ** 8, '0,0.0000') : '-'
    },
    baseAmountFormatOrZero (number) {
      return formatBN(bnOrZero(number).div(1e8), 8)
    },
    smallBaseAmountFormat (number) {
      return number ? this.$options.filters.number(+number / 10 ** 8, '0,0.00a') : '-'
    },
    smallBaseAmountFormatWithCur (number) {
      return number ? `$${this.smallBaseAmountFormat(number)}` : '-'
    },
    formatCurrency (number) {
      return this.$options.filters.currency(number)
    },
    formatSmallCurrency (number) {
      return this.$options.filters.currency(number / 10 ** 8, '$', 2)
    },
    versionSort (x, y, col, rowX, rowY) {
      return (compare(x, y))
    },
    formatAddress (string) {
      if (string && string.length > 12) { return string.slice(0, 6) + '...' + string.slice(-6) } else { return string }
    },
    addressFormatV2 (string, number = 6, isOnlyLast = false) {
      if (!string) { return string }
      return (isOnlyLast ? '' : (string.slice(0, number) + '...')) + string.slice(-number)
    },
    gotoNodeUrl (node) {
      return (`${endpoints[process.env.NETWORK].THORNODE_URL}thorchain/node/${node}`)
    },
    gotoSaver (params) {
      if (!params) { return }
      this.$router.push(`/savers/${params.row.asset}`)
    },
    basicChartFormat (valueFormatter = undefined, series, xAxis, extraSettings = {}, globalFormatter) {
      return {
        title: {
          show: false
        },
        tooltip: {
          confine: true,
          trigger: 'axis',
          valueFormatter,
          formatter: globalFormatter
        },
        legend: {
          x: 'center',
          y: 'bottom',
          icon: 'rect',
          textStyle: {
            color: 'var(--font-color)'
          }
        },
        xAxis: {
          data: xAxis,
          splitLine: {
            show: false
          },
          axisLine: {
            lineStyle: {
              color: '#9f9f9f'
            }
          },
          axisLabel: {
            color: '#9f9f9f',
            fontFamily: 'ProductSans'
          }
        },
        yAxis: {
          show: false,
          splitLine: {
            show: true
          }
        },
        grid: {
          left: '20px',
          right: '20px'
        },
        series,
        ...extraSettings
      }
    },
    camelCase (e) {
      return e && e.replace(/([A-Z])/g, ' $1')
    },
    parseConstant (key, options) {
      // make sure component has these data in it.
      if (!this.mimir || !this.networkConst || !this.networkConst?.int_64_values) {
        return {}
      }

      // constants keys are in camel case different than what it shows in mimir
      const uniKey = key.toUpperCase()
      const uniName = this.camelCase(key)

      let value = this.networkConst?.int_64_values[key]
      let isMimir = false
      if (this.mimir[uniKey] !== undefined) {
        isMimir = value && true
        value = this.mimir[uniKey]
      }

      let extraText = options?.extraText
      if (typeof extraText === 'function') {
        extraText = options?.extraText(value)
      }

      return {
        name: uniName,
        ...(options?.filter ? { value: options?.filter(value) } : { value }),
        ...(isMimir && { extraText: `${extraText ?? ''}Overwritten by Mimir` }),
        ...(!isMimir && extraText && { extraText })
      }
    },
    runeCur () {
      return AssetCurrencySymbol.RUNE
    },
    clearIntervalId (id) {
      if (id) {
        clearInterval(id)
      }
    },
    numberSort (x, y, col, rowX, rowY) {
      return (+x < +y ? -1 : (+x > +y ? 1 : 0))
    }
  }
}
