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
    currentTheme() {
      const savedTheme = localStorage.getItem('theme')
      console.log('LocalStorage Theme:', savedTheme)
      console.log('Vuex Theme:', this.theme)
      return savedTheme || 'light'
    },
    chartColors() {
      if (this.currentTheme === 'dark') {
        return {
          background: '#0d0f12',
          textColor: '#ffffff',
          gridColor: '#444',
        }
      } else if (this.currentTheme === 'BlueElectra') {
        return {
          background: '#1c242b',
          textColor: '#00d4ff',
          gridColor: '#142850',
        }
      } else {
        return {
          background: '#ffffff',
          textColor: '#000000',
          gridColor: '#ddd',
        }
      }
    },
  },
  watch: {
    currentTheme(newTheme, oldTheme) {
      console.log(`Theme changed from ${oldTheme} to ${newTheme}`)
      this.loadChart()
    },
  },
  mounted() {
    if (!localStorage.getItem('theme')) {
      localStorage.setItem('theme', 'light')
      console.log('Theme set to default: light')
    }
    window.addEventListener('storage', () => {
      console.log(
        'Storage Event - Theme Changed:',
        localStorage.getItem('theme')
      )
      this.loadChart()
    })
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
        symbols: [['BINANCE:RUNEUSDT|1D']],
        chartOnly: false,
        width: '100%',
        height: '100%',
        locale: 'en',
        colorTheme:
          this.currentTheme === 'BlueElectra' ? 'dark' : this.currentTheme,
        autosize: true,
        showVolume: false,
        showMA: false,
        hideDateRanges: false,
        hideMarketStatus: false,
        hideSymbolLogo: false,
        scalePosition: 'right',
        scaleMode: 'Normal',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif',
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
        dateRanges: ['1d|1', '1m|30', '3m|60', '12m|1D', '60m|1W', 'all|1M'],
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
  border-radius: 0.5rem;
  overflow: hidden;
}

#tradingview-chart {
  width: 100%;
  height: 100%;
}
</style>
