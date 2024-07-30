import endpoints from './endpoints'
import { $axiosInstace } from './index'

const INSIGHT_URL = 'https://flipsidecrypto.xyz/api/v1/queries/'

export function getChurnHistory() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/churnHistory'
  )
}

export function getFlipTVL() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/tvlHistoryQuery'
  )
}

export function getRunePrice() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/runePrice'
  )
}

export function getDailySwap() {
  return $axiosInstace.get(
    INSIGHT_URL + 'ec833986-4bda-4d39-b1c9-7e44094c5e8e/data/latest'
  )
}
