export const state = () => ({
  runePrice: 0
})

export const getters = {
  getRunePrice (state) {
    return state.runePrice ?? 0;
  }
}

export const mutations = {
  setRunePrice(state, price) {
    state.runePrice = price;
  }
}