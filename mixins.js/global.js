import { mapGetters } from 'vuex'
import {
  bnOrZero,
  formatBN,
  AssetCurrencySymbol,
  isSynthAsset,
} from '@xchainjs/xchain-util'
import compare from 'semver/functions/compare'
import moment from 'moment'
import { AssetImage } from '~/classes/assetImage'
import {
  assetFromString,
  parseMemoToTxType,
  shortAssetName,
  assetToString,
  affiliateMap,
  darkTheme,
  lightTheme,
} from '~/utils'
import endpoints from '~/api/endpoints'

export default {
  data() {
    return {
      showLoading: {
        color: 'var(--primary-color)',
        textColor: 'var(--primary-color)',
        maskColor: 'var(--card-bg-color)',
      },
    }
  },
  computed: {
    chartTheme() {
      const isDark = this.$store.state.darkTheme
      if (isDark) {
        return darkTheme
      }
      return lightTheme
    },
  },
  methods: {
    assetImage(assetStr) {
      try {
        return AssetImage(assetStr) ?? require('~/assets/images/unknown.png')
      } catch (error) {
        return require('~/assets/images/unknown.png')
      }
    },
    assetToChain(assetStr) {
      if (!assetStr) {
        return
      }
      const { chain, synth, trade } = assetFromString(assetStr)
      let asset = `${chain}.${chain}`
      if (synth) {
        return 'THOR.RUNE'
      } else if (trade) {
        return 'THOR.RUNE'
      }
      switch (chain) {
        case 'GAIA':
          asset = 'GAIA.ATOM'
          break
        case 'BSC':
          asset = 'BSC.BNB'
          break
        case 'THOR':
          asset = 'THOR.RUNE'
          break
        default:
          break
      }
      return asset
    },
    imgErr(e) {
      e.target.src = require('~/assets/images/unknown.png')
    },
    baseChainAsset(chain) {
      switch (chain) {
        case 'THOR':
          return 'THOR.RUNE'
        case 'GAIA':
          return 'GAIA.ATOM'
        case 'BSC':
          return 'BSC.BNB'
        default:
          return `${chain}.${chain}`
      }
    },
    goto(url) {
      this.$router.push({ path: `${url}` })
    },
    gotoAddr(address) {
      this.$router.push({ path: `/address/${address}` })
    },
    popRandomColor() {
      const defaultColors = [
        '#5470c6',
        '#91cc75',
        '#fac858',
        '#ee6666',
        '#73c0de',
        '#3ba272',
        '#fc8452',
        '#9a60b4',
        '#ea7ccc',
      ]
      const rand = Math.random()
      const color = defaultColors[Math.floor(rand * defaultColors.length)]
      defaultColors.splice(Math.floor(rand * defaultColors.length), 1)
      return color
    },
    getAssetColor(asset) {
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
    getChainColor(asset) {
      switch (asset) {
        case 'BTC':
          return '#F7A035'
        case 'ETH':
          return '#F2F4F7'
        case 'LTC':
          return '#335D9D'
        case 'DOGE':
          return '#BA9F32'
        case 'BCH':
          return '#4DCA48'
        case 'AVAX':
          return '#E84142'
        case 'GAIA':
          return '#2F3148'
        case 'BNB':
        case 'BSC':
          return '#F1B90A'
        default:
          return this.popRandomColor()
      }
    },
    isInternalTx(hash) {
      if (
        hash ===
          '0000000000000000000000000000000000000000000000000000000000000000' ||
        hash === ''
      ) {
        return true
      }
      return false
    },
    gotoTx(hash) {
      if (
        hash ===
          '0000000000000000000000000000000000000000000000000000000000000000' ||
        hash === ''
      ) {
        return
      }
      this.$router.push({ path: `/tx/${hash}` })
    },
    isValidTx(hash) {
      if (
        hash ===
          '0000000000000000000000000000000000000000000000000000000000000000' ||
        hash === ''
      ) {
        return false
      }
      return true
    },
    gotoNode(signer) {
      this.$router.push({ path: `/node/${signer}` })
    },
    gotoPool(pool) {
      this.$router.push({ path: `/pool/${pool}` })
    },
    copy(address) {
      navigator.clipboard.writeText(address).then(
        () => {
          this.copyText = 'Copied'
          setTimeout(() => {
            this.copyText = 'Copy'
          }, 2000)
        },
        (err) => {
          console.error('Could not copy text: ', err)
        }
      )
    },
    checkSynth(asset) {
      if (!asset) {
        return false
      }

      return isSynthAsset(assetFromString(asset))
    },
    fromNow(date) {
      return moment(date).fromNow()
    },
    percentageFormat(number, decimal) {
      return number ? this.$options.filters.percent(number, decimal ?? 4) : '-'
    },
    unitFormat(number) {
      return number ? this.$options.filters.number(+number / 1e8, '0,0') : '-'
    },
    normalFormat(number) {
      return number ? this.$options.filters.number(+number, '0,0') : '-'
    },
    numberFormat(number) {
      return number ? this.$options.filters.number(+number, '0,0.0000') : '-'
    },
    showAsset(assetStr) {
      if (!assetStr) {
        return ''
      }
      try {
        if (typeof assetStr !== 'string') {
          assetStr = assetToString(assetStr)
        }
        let del = '.'
        const asset = assetFromString(assetStr)
        if (isSynthAsset(asset)) {
          del = '/'
        } else if (asset.trade) {
          del = '~'
        }
        return asset.chain + del + asset.ticker
      } catch (error) {
        console.error(error)
        console.error("Can't get the asset:", assetStr)
      }
    },
    baseAmountFormat(number) {
      return number
        ? this.$options.filters.number(+number / 10 ** 8, '0,0.0000')
        : '-'
    },
    baseAmountFormatOrZero(number) {
      return formatBN(bnOrZero(number).div(1e8), 8)
    },
    smallBaseAmountFormat(number) {
      return number
        ? this.$options.filters.number(+number / 10 ** 8, '0,0.00a')
        : '-'
    },
    smallBaseAmountFormatWithCur(number) {
      return number ? `$${this.smallBaseAmountFormat(number)}` : '-'
    },
    formatCurrency(number) {
      return this.$options.filters.currency(number)
    },
    formatBnCurrency(number) {
      return `$${formatBN(bnOrZero(number))}`
    },
    formatSmallCurrency(number) {
      return this.$options.filters.currency(number / 10 ** 8, '$', 2)
    },
    versionSort(x, y, col, rowX, rowY) {
      return compare(x, y)
    },
    formatAddress(string) {
      if (string && string.length > 12) {
        return string.slice(0, 6) + '...' + string.slice(-6)
      } else {
        return string
      }
    },
    formatTimeSort(x, y, col, rowX, rowY) {
      return +x < +y ? -1 : +x > +y ? 1 : 0
    },
    formatTimeNow(timestamp) {
      return moment(timestamp * 1e3).fromNow()
    },
    addressFormatV2(string, number = 6, isOnlyLast = false) {
      if (!string) {
        return string
      }
      return (
        (isOnlyLast ? '' : string.slice(0, number) + '...') +
        string.slice(-number)
      )
    },
    gotoNodeUrl(node) {
      return `${
        endpoints[process.env.NETWORK].THORNODE_URL
      }thorchain/node/${node}`
    },
    gotoSaver(params) {
      if (!params) {
        return
      }
      this.$router.push(`/savers/${params.row.asset}`)
    },
    basicChartFormat(
      valueFormatter = undefined,
      series,
      xAxis,
      extraSettings = {},
      globalFormatter
    ) {
      return {
        title: {
          show: false,
        },
        tooltip: {
          confine: true,
          trigger: 'axis',
          valueFormatter,
          formatter: globalFormatter,
        },
        legend: {
          type: 'scroll',
          x: 'right',
          y: 'top',
          icon: 'circle',
          textStyle: {
            color: 'var(--font-color)',
          },
        },
        xAxis: {
          data: xAxis,
          splitLine: {
            show: false,
          },
          axisLabel: {
            fontFamily: 'ProductSans',
          },
        },
        yAxis: {
          show: false,
          splitLine: {
            show: true,
          },
        },
        grid: {
          left: 0,
          right: 0,
          bottom: 0,
          containLabel: false,
        },
        series,
        ...extraSettings,
      }
    },
    camelCase(e) {
      return e && e.replace(/([A-Z])/g, ' $1')
    },
    parseConstant(key, options) {
      // make sure component has these data in it.
      if (
        !this.mimir ||
        !this.networkConst ||
        !this.networkConst?.int_64_values
      ) {
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
        ...(!isMimir && extraText && { extraText }),
      }
    },
    runeCur() {
      return AssetCurrencySymbol.RUNE
    },
    clearIntervalId(id) {
      if (id) {
        clearInterval(id)
      }
    },
    numberSort(x, y, col, rowX, rowY) {
      return +x < +y ? -1 : +x > +y ? 1 : 0
    },
    parseMemo(memo) {
      // Driven from track repo
      if (!memo) {
        return {}
      }

      // TXTYPE:STATE1:STATE2:STATE3:FINALMEMO
      const type = parseMemoToTxType(memo)

      const parts = memo.split(':')
      if (type === 'swap') {
        // SWAP:ASSET:DESTADDR:LIM/INTERVAL/QUANTITY:AFFILIATE:FEE
        const [limit, interval, quantity] = parts[3] ? parts[3].split('/') : []
        return {
          type: type || null,
          asset: parts[1] || null,
          destAddr: parts[2] || null,
          limit: limit || null,
          interval: parseInt(interval) || null,
          quantity: parseInt(quantity) || null,
          affiliate: parts[4] || null,
          fee: parts[5] || null,
        }
      }

      if (type === 'add') {
        // ADD:ASSET:ASYM:AFFILIATE:FEE
        return {
          type: type || null,
          asset: parts[1] || null,
          asymmetry: parts[2] || false,
          affiliate: parts[3] || null,
          fee: parts[4] || null,
        }
      }

      if (type === 'withdraw') {
        // WITHDRAW:ASSET:BPS:ASSET
        return {
          type: type || null,
          asset: parts[1] || null,
          bps: parts[2] || null,
          withdrawAsset: parts[3] || null,
        }
      }

      if (type === 'tradeDeposit' || type === 'tradeWithdraw') {
        // TRADE+:ADDRESS
        return {
          type,
          asset: null,
          address: parts[1],
        }
      }

      if (type === 'outbound') {
        // OUT:hash
        return {
          type,
          hash: parts[1],
        }
      }

      return {
        type: type || null,
        asset: parts[1] || null,
      }
    },
    findAssetInPool(asset, pools) {
      if (typeof asset !== 'object') {
        asset = assetFromString(asset)
      }
      if (pools) {
        pools.forEach((p) => {
          const poolAsset = assetFromString(p.asset)
          if (
            poolAsset.chain === asset.chain &&
            poolAsset.ticker === asset.ticker
          ) {
            if (isSynthAsset(asset)) {
              poolAsset.synth = true
            } else if (asset.trade) {
              poolAsset.trade = true
            }
            asset = poolAsset
          }
        })
      }
      return asset
    },
    parseMemoAsset(assetInString, pools) {
      if (!assetInString) {
        return null
      }

      if (typeof assetInString === 'object') {
        return assetInString
      }

      // Upper case it as pools is in uppercase
      assetInString = assetInString.toUpperCase()

      // get asset from short
      if (assetInString.split('.').length === 1) {
        assetInString = shortAssetName(assetInString)
      }

      let asset = assetFromString(assetInString)
      if (!asset) {
        return
      }

      if (asset?.address) {
        // attempt to fuzzy match address
        asset = this.findAssetInPool(asset, pools)
      } else if (
        asset.chain === 'ETH' ||
        asset.chain === 'AVAX' ||
        asset.chain === 'BNB' ||
        asset.chain === 'BSC'
      ) {
        // EVM assets can go without address
        asset = this.findAssetInPool(asset, pools)
      }

      return asset
    },
    formatAsset(asset) {
      if (!asset) {
        return asset
      }
      return asset.length > 10 ? asset.slice(0, 14) + '...' : asset
    },
    amountToUSD(asset, amount, pools) {
      if (!asset || !amount || !pools) {
        return
      }

      // update params
      amount = parseInt(amount, 10) / 1e8
      if (typeof asset === 'string') {
        asset = assetFromString(asset)
      }

      const copyAsset = { ...asset }

      // Synth price would be same as non synth asset
      if (isSynthAsset(copyAsset)) {
        copyAsset.synth = false
      }
      // Trade price would be same as non trade asset
      if (asset.trade) {
        copyAsset.trade = false
      }

      if (copyAsset.chain === 'THOR' && copyAsset.symbol === 'RUNE') {
        return amount * this.usdPerRune(pools)
      }

      const pricePerAsset =
        +pools.find((p) => p.asset === assetToString(copyAsset))
          ?.assetPriceUSD ?? 0

      return amount * pricePerAsset
    },
    usdPerRune(pools) {
      let asset = 0
      let rune = 0

      const anchorPools = [
        'ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48',
        'ETH.USDT-0XDAC17F958D2EE523A2206206994597C13D831EC7',
        'AVAX.USDC-0XB97EF9EF8734C71904D8002F8B6BC66DD9C48A6E',
        'BNB.BUSD-BD1',
      ]

      pools.forEach((p) => {
        if (anchorPools.includes(p.asset)) {
          asset += parseInt(p.assetDepth)
          rune += parseInt(p.runeDepth)
        }
      })
      return asset / rune
    },
    assetColorPalette(asset) {
      if (!asset) {
        return null
      }

      // convert to string
      if (typeof asset === 'string') {
        asset = assetFromString(asset)
      }

      switch (asset.ticker.toUpperCase()) {
        case 'USDT':
          return '#27A17C'
        case 'BNB':
          return '#F1B90A'
        case 'USDC':
          return '#2775CA'
        case 'ETH':
          return '#F2F4F7'
        case 'WBTC':
          return '#F19440'
        case 'BUSD':
          return '#F0BB02'
        case 'AVAX':
          return '#E84142'
        case 'ATOM':
          return '#2F3148'
        case 'BTC':
        case 'BTCB':
          return '#F7A035'
        case 'DAI':
          return '#FAB62B'
        case 'LTC':
          return '#335D9D'
        case 'LUSD':
          return '#745DDF'
        case 'GUSD':
          return '#161819'
        case 'DOGE':
          return '#BA9F32'
        case 'BCH':
          return '#4DCA48'
        case 'TWT':
          return '#FFFFFF'
        case 'AAVE':
          return '#6B8AB4'
        case 'YFI':
          return '#0163C9'
        case 'SNX':
          return '#0C032B'
        case 'TGT':
          return '#000000'
        case 'FOX':
          return '#1F2A4D'
        case 'DPI':
          return '#8150E6'
        case 'XDEFI':
          return '#163CD4'
        case 'THOR':
          return '#07AEFE'
        case 'RUNE':
          return '#1BE8C4'
        case 'FLIP':
          return '#FC92C5'
        case 'VTHOR':
          return '#65532F'
        case 'USDP':
          return '#88BA4F'
        case 'LINK':
          return '#305DD4'
        default:
          return null
      }
    },
    blockSeconds(chain) {
      switch (chain) {
        case 'BTC':
          return 600
        case 'BCH':
          return 600
        case 'LTC':
          return 150
        case 'DOGE':
          return 60
        case 'ETH':
          return 12
        case 'THOR':
          return 6
        case 'GAIA':
          return 6
        case 'AVAX':
          return 3
        case 'BSC':
          return 3
        case 'BNB':
          return 0.5
        default:
          return 0
      }
    },
    getNativeAsset(denom, pools) {
      if (!denom) {
        return
      }

      if (typeof denom === 'object') {
        return denom
      }

      if (denom === 'rune') {
        return assetFromString('THOR.RUNE')
      }

      pools.forEach((p) => {
        const poolAsset = assetFromString(p.asset)
        if (poolAsset.ticker === denom.toUpperCase()) {
          poolAsset.synth = true
          return poolAsset
        }
      })
    },
    mapAffiliateName(s) {
      const ifc = affiliateMap[s]
      if (!ifc) {
        return undefined
      }

      const icons = {
        url: undefined,
        urlDark: undefined,
      }

      if (ifc.icon) {
        icons.url = require(`@/assets/images/${ifc.icon}.png`)
        icons.urlDark = require(`@/assets/images/${ifc.icon}-dark.png`)
      }

      return {
        name: ifc.name ?? ifc,
        icons,
      }
    },
    animate(refName, className, duration = 2000) {
      const d = this.$refs[refName]
      d.classList.add(className)
      setTimeout(function () {
        d.classList.remove(className)
      }, duration)
    },
  },
}
