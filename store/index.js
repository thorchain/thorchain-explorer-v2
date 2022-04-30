export const state = () => ({
  runePrice: 0,
  darkTheme: false
})

export const getters = {
  getRunePrice (state) {
    return state.runePrice ?? 0;
  },
  getTheme (state) {
    return state.darkTheme? 'dark':'light';
  }
}

export const mutations = {
  setRunePrice(state, price) {
    state.runePrice = price;
  },
  setTheme(state, isDarkTheme) {
    let htmlElement = document.documentElement;
    localStorage.setItem("theme", isDarkTheme?'dark':'light');
    htmlElement.setAttribute('theme', isDarkTheme?'dark':'light');
    state.darkTheme = isDarkTheme;
  }
}