export const state = () => ({
  runePrice: 0,
  darkTheme: false,
  showMenu: false,
  networkData: undefined,
  nodesData: undefined,
  fullscreen: false,
  showSidebar: false
})

export const getters = {
  getRunePrice (state) {
    return state.runePrice ?? 0
  },
  getTheme (state) {
    return state.darkTheme ? 'dark' : 'light'
  },
  getIsMenuOn (state) {
    return state.showMenu
  },
  getNetworkData (state) {
    return state.networkData
  },
  getNodesData (state) {
    return state.nodesData
  },
  getFullScreen (state) {
    return state.fullscreen
  },
  getSidebar (state) {
    return state.showSidebar
  }
}

export const mutations = {
  setRunePrice (state, price) {
    state.runePrice = price
  },
  setTheme (state, isDarkTheme) {
    const htmlElement = document.documentElement
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light')
    htmlElement.setAttribute('theme', isDarkTheme ? 'dark' : 'light')
    state.darkTheme = isDarkTheme
  },
  setNetworkData (state, networkData) {
    state.networkData = networkData
  },
  setNodesData (state, nodesData) {
    state.nodesData = nodesData
  },
  toggleMenu (state, action) {
    state.showMenu = action !== undefined ? action : !state.showMenu
  },
  toggleFullscreen (state, action) {
    state.fullscreen = !state.fullscreen
  },
  setSidebar (state, action) {
    state.showSidebar = action
  }
}
