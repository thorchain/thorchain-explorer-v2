export const state = () => ({
  runePrice: 0,
  darkTheme: false,
  showMenu: false,
  networkData: undefined,
  nodesData: undefined,
  chainsHeight: undefined,
  fullscreen: false,
  showSidebar: false,
  pools: undefined,
  extraHeaderInfo: [],
  blueElectraTheme: false,
})

export const getters = {
  getRunePrice(state) {
    return state.runePrice ?? 0
  },
  getTheme(state) {
    if (state.blueElectraTheme) {
      return 'BlueElectra'
    }
    return state.darkTheme ? 'dark' : 'light'
  },
  getIsMenuOn(state) {
    return state.showMenu
  },
  getNetworkData(state) {
    return state.networkData
  },
  getNodesData(state) {
    return state.nodesData
  },
  getFullScreen(state) {
    return state.fullscreen
  },
  getSidebar(state) {
    return state.showSidebar
  },
  getChainsHeight(state) {
    return state.chainsHeight
  },
  getPools(state) {
    return state.pools
  },
  getExtraHeaderInfo(state) {
    return state.extraHeaderInfo
  },
}

export const mutations = {
  setRunePrice(state, price) {
    state.runePrice = price
  },
  setTheme(state, theme) {
    const htmlElement = document.documentElement
    if (theme === 'BlueElectra') {
      localStorage.setItem('theme', 'BlueElectra')
      htmlElement.setAttribute('theme', 'BlueElectra')
      state.blueElectraTheme = true
      state.darkTheme = false
    } else {
      const themeMode = theme ? 'dark' : 'light'
      localStorage.setItem('theme', themeMode)
      htmlElement.setAttribute('theme', themeMode)
      state.darkTheme = theme
      state.blueElectraTheme = false
    }
  },
  setNetworkData(state, networkData) {
    state.networkData = networkData
  },
  setNodesData(state, nodesData) {
    state.nodesData = nodesData
  },
  toggleMenu(state, action) {
    state.showMenu = action !== undefined ? action : !state.showMenu
  },
  toggleFullscreen(state, action) {
    state.fullscreen = !state.fullscreen
  },
  setSidebar(state, action) {
    state.showSidebar = action
  },
  setChainsHeight(state, action) {
    state.chainsHeight = action
  },
  setPools(state, action) {
    state.pools = action
  },
  setExtraHeaderInfo(state, values) {
    state.extraHeaderInfo = values
  },
  resetExtraHeaderInfo(state) {
    state.extraHeaderInfo = []
  },
}
