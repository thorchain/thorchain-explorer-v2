<template>
  <div class="tradingview-widget-container">
    <div id="tradingview-chart"></div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'TradingViewWidget',
  data() {
    return {
      scriptAdded: false,
    }
  },
  computed: {
    ...mapGetters({
      theme: 'getTheme',
    }),
    chartColors() {
      switch (this.theme) {
        case 'dark':
          return {
            background: 'rgba(0, 0, 0, 0)',
            textColor: '#ffffff',
            gridColor: '#444',
          }
        case 'BlueElectra':
          return {
            background: 'rgba(0, 0, 0, 0)',
            textColor: '#00d4ff',
            gridColor: '#142850',
          }
        default:
          return {
            background: 'rgba(0, 0, 0, 0)',
            textColor: '#000000',
            gridColor: '#ddd',
          }
      }
    },
  },
  watch: {
    theme() {
      this.loadChart()
    },
  },
  mounted() {
    this.loadChart()
  },
  methods: {
    loadChart() {
      if (this.scriptAdded) {
        document.getElementById('tradingview-chart').innerHTML = ''
      }
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.async = true
      script.src =
        'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js'
      script.innerHTML = JSON.stringify({
        symbols: [['BINANCE:RUNEUSDT|1M'], ['BINANCE:RUNEBTC|1M']],
        chartOnly: false,
        width: '100%',
        height: '100%',
        locale: 'en',
        colorTheme: this.theme === 'light' ? 'light' : 'dark',
        autosize: true,
        showVolume: false,
        showMA: false,
        hideDateRanges: false,
        hideMarketStatus: false,
        hideSymbolLogo: false,
        scalePosition: 'right',
        scaleMode: 'Normal',
        fontFamily: `-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif`,
        fontSize: '10',
        noTimeScale: false,
        valuesTracking: '1',
        changeMode: 'price-and-percent',
        chartType: 'area',
        backgroundColor: this.chartColors.background,
        textColor: this.chartColors.textColor,
        gridColor: this.chartColors.gridColor,
        maLineColor: this.chartColors.lineColor,
        maLineWidth: 1,
        maLength: 9,
        headerFontSize: 'medium',
        lineWidth: 2,
        lineType: 0,
        dateRanges: ['1w|60', '1m|30', '3m|60', '12m|1D', '60m|1W', 'all|1M'],
      })
      document.getElementById('tradingview-chart').appendChild(script)
      this.scriptAdded = true
    },
  },
}
</script>
<style lang="scss" scoped>
.tradingview-widget-container {
  width: 100%;
  height: 300px;
  position: relative;
  border-radius: $radius-lg;
  overflow: hidden;
}

#tradingview-chart {
  width: 100%;
  height: 100%;
}
</style>
