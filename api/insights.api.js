
import { $axiosInstace } from './index'

const INSIGHT_URL = 'https://flipsidecrypto.xyz/api/v1/queries/'

export function getChurnHistory () {
  return $axiosInstace.get(INSIGHT_URL + '9fb2fd10-0a5a-4786-af5e-d5b346bcc220/data/latest')
}

export function getFlipTVL () {
  return $axiosInstace.get(INSIGHT_URL + 'ed73580a-3555-4750-b1fa-03d3c6bf59e3/data/latest')
}

export function getRunePrice () {
  return $axiosInstace.get(INSIGHT_URL + '1aaa2137-b392-40a1-a9ce-22512f02d722/data/latest')
}

export function getDailySwap () {
  return $axiosInstace.get(INSIGHT_URL + 'ec833986-4bda-4d39-b1c9-7e44094c5e8e/data/latest')
}
