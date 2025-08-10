import endpoints from './endpoints'
import { $axiosInstace } from './index'

export function getDashboardData() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/dashboardData'
  )
}

export function getDashboardPlots() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/dashboardPlots'
  )
}

export function getExraNodesInfo() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/extraNodesInfo'
  )
}
export function getTCY(address) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + `tcy/distribution/${address}`
  )
}
export function getSaversInfo() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/saversInfo'
  )
}

export function getChainsHeight() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/chainsHeight'
  )
}

export function getHolders(asset = 'THOR.RUNE') {
  const baseUrl = endpoints[process.env.NETWORK].SERVER_URL + 'holders'
  return $axiosInstace.get(baseUrl, {
    params: { asset },
  })
}

export function getPoolsHistory(period = '') {
  if (period === 'day') {
    period = ''
  }
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/historyPools' + period
  )
}

export function getOldPoolsHistory(period = '') {
  if (period === 'day') {
    period = ''
  }
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/oldHistoryPools' + period
  )
}

export function getServerTx(txid) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + `tx/${txid}`
  )
}

export function getRunePoolsInfo() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/runePools'
  )
}

export function getOldRunePools() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/oldRunePool'
  )
}

export function getOldRunePoolProvidersInfo() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/oldRunePoolProviders'
  )
}

export function getRunePoolProvidersInfo() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/runePoolProviders'
  )
}

export function getBorrowersInfo() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/borrowers'
  )
}

export function getSwapsWeekly() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/swapsWeekly'
  )
}

export function getStatsDaily() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/statsDaily'
  )
}

export function getFeesRewardsMonthly() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/feesRewardsMonthly'
  )
}

export function getAffiliateSwapsMonthly() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/monthlyLeaderboard'
  )
}

export function getAffiliateSwapsWeekly() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/weeklyLeaderboard'
  )
}

export function getAffiliateSwapsDaily() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/dailyLeaderboard'
  )
}

export function getNodeOverview() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/nodeOverview'
  )
}

let fetchDataCancel = null

export function getActions(params) {
  if (fetchDataCancel) {
    fetchDataCancel.cancel('cancel')
  }

  fetchDataCancel = $axiosInstace.CancelToken.source()

  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'actions',
    { params, cancelToken: fetchDataCancel.token }
  )
}

export function getCoinMarketInfo() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/coinmarketCap'
  )
}

export function getNodesInfo() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/nodesInfo'
  )
}

export function getTopSwaps() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/swaps'
  )
}

export function getTopSwapsWeekly() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/swapsTopWeekly'
  )
}

export function getTopSwapsMonthly() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/swapsTopMonthly'
  )
}

export function getEarnings() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/rawEarnings'
  )
}

export function getNodes() {
  return $axiosInstace.get(endpoints[process.env.NETWORK].SERVER_URL + 'nodes')
}

export function getNetworkAllocation() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/networkAllocation'
  )
}

export function getReserveHistory() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/reserve'
  )
}

export function getVotes(period = '30d') {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'votes',
    {
      params: {
        period,
      },
    }
  )
}

export function getBurnedBlocks() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/burned'
  )
}

export function getInfraRUJIMerge() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/rujiMerge'
  )
}

export function getExecutionQuality() {
  return $axiosInstace.get(
    'https://flipsidecrypto.xyz/api/v1/queries/6e18d4c9-3959-4791-a3b2-92a8f27cc120/data/latest'
  )
}

export function getAffiliateHistory(params) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'affiliate',
    {
      params,
    }
  )
}

export function getTcyInfo(params) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/tcyInfo',
    {
      params,
    }
  )
}

export function getDenoms() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/denoms'
  )
}

export function getContracts() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/contracts'
  )
}

export function getBalanceHistory(address, interval = 'day', count = 30) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + `history/balance/${address}`,
    {
      params: {
        interval,
        count,
      },
    }
  )
}

export function search(query) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + `search?filter=${query}`
  )
}

export function getSwapsByThorname(thorname, period = '30d') {
  const params = {
    period,
  }

  if (thorname) {
    params.thorname = thorname
  }

  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'swaps',
    {
      params,
    }
  )
}

export function getAffiliateStats(params) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'affiliate/stats',
    {
      params,
    }
  )
}

export function getTCYDistribution(address) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + `tcy/distribution/${address}`
  )
}

export function getContractsLabel() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/contractsLabel'
  )
}

export function getRUJIStats() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'api/rujiStats'
  )
}
