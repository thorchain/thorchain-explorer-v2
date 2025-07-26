<template>
  <div ref="container" class="tradingview-widget-container">
    <div class="tradingview-widget-container__widget"></div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'TradingViewTicker',
  computed: {
    ...mapGetters({
      theme: 'getTheme',
    }),
    currentTheme() {
      const savedTheme = localStorage.getItem('theme')
      return savedTheme || this.theme || 'light'
    },
  },
  data() {
    return {
      scriptAdded: false,
    }
  },
  watch: {
    currentTheme(newTheme) {
      this.loadChart()
    },
  },
  mounted() {
    if (!localStorage.getItem('theme')) {
      localStorage.setItem('theme', 'light')
    }

    window.addEventListener('storage', () => {
      this.loadChart()
    })

    this.loadChart()
  },
  methods: {
    loadChart() {
      if (this.scriptAdded) {
        this.$refs.container.innerHTML = ''
      }

      const script = document.createElement('script')
      script.src =
        'https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js'
      script.type = 'text/javascript'
      script.async = true

      script.innerHTML = JSON.stringify({
        symbol: 'BINANCE:RUNEUSDT',
        width: '100%',
        height: '100%',
        locale: 'en',
        colorTheme: this.currentTheme,
        isTransparent: true,
      })

      this.$refs.container.appendChild(script)
      this.scriptAdded = true
    },
  },
}
</script>

<style scoped>
.tradingview-widget-container {
  width: 100%;
  height: 100%;
}
</style>
