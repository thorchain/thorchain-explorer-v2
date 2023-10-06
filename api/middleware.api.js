import endpoints from './endpoints'
import { $axiosInstace } from './index'

export function getDashboardData () {
  return $axiosInstace.get(endpoints[process.env.NETWORK].SERVER_URL + 'api/dashboardData')
}

export function getDashboardPlots () {
  return $axiosInstace.get(endpoints[process.env.NETWORK].SERVER_URL + 'api/dashboardPlots')
}

export function getExraNodesInfo () {
  return $axiosInstace.get(endpoints[process.env.NETWORK].SERVER_URL + 'api/extraNodesInfo')
}

export function getOhclPrice () {
  return $axiosInstace.get(endpoints[process.env.NETWORK].SERVER_URL + 'api/ohclPrice')
}

export function getSaversExtraData () {
  return $axiosInstace.get(endpoints[process.env.NETWORK].SERVER_URL + 'api/saversExtraData')
}

export function getSaversInfo () {
  return $axiosInstace.get(endpoints[process.env.NETWORK].SERVER_URL + 'api/saversInfo')
}

export function getOldSaversExtraData () {
  return $axiosInstace.get(endpoints[process.env.NETWORK].SERVER_URL + 'api/oldSaversExtraData')
}

export function getChainsHeight () {
  return $axiosInstace.get(endpoints[process.env.NETWORK].SERVER_URL + 'api/chainsHeight')
}

export function getPoolsHistory (period = '') {
  if (period === 'day') { period = '' }
  return $axiosInstace.get(endpoints[process.env.NETWORK].SERVER_URL + 'api/historyPools' + period)
}

export function getOldPoolsHistory (period = '') {
  if (period === 'day') { period = '' }
  return $axiosInstace.get(endpoints[process.env.NETWORK].SERVER_URL + 'api/oldHistoryPools' + period)
}

export function getServerTx (txid) {
  return $axiosInstace.get(endpoints[process.env.NETWORK].SERVER_URL + `tx/${txid}`)
}

export function getDevTx (txid) {
  return $axiosInstace.get(`https://midgard.dev.ninerealms.com/v2/actions?txid=${txid}`)
}
