import axiosRetry from 'axios-retry'
import {
  getTxs,
  getTx,
  getAddress,
  getPoolStats,
  getPoolTxs,
  volumeHistory,
  swapHistory,
  getTVLHistory,
  earningsHistory,
  earnings,
  getPoolVolume,
  getLastTvl,
  getLatestBlocks,
  getRevThorname,
  getNetwork,
  getPoolDepth,
  getEarningHistory,
  getMemberDetails,
  getSaverDetails,
  earningLastDay,
  getBorrowerDetails,
  getMidgardActions,
  getSwapsHistory,
  getStats,
  getPools,
} from './midgard.api'
import {
  getRunePoolProviders,
  getMimir,
  getDenom,
  getStakers,
  getOutboundFees,
  getCodes,
  getBalance,
  getLastBlockHeight,
  getNativeTx,
  getThorNetwork,
  getInboundAddresses,
  getMimirVotes,
  getLpPositions,
  getPoolDetail,
  getAssets,
  getThorPools,
  getSupplyRune,
  getSupply,
  getRPCLastBlockHeight,
  getYggdrasil,
  getAsgard,
  getAddresses,
  getOutbound,
  getBlockChainVersion,
  getThorchainTx,
  getNode,
  getSavers,
  getThornodeDetailTx,
  getThornodeArchiveTx,
  getTxArchiveStatus,
  getUserLpPosition,
  getPol,
  getBorrowers,
  getConstants,
  getStreamingSwap,
  getTxStages,
  getTxStatus,
  getStreamingSwaps,
  getScheduled,
  getThorname,
  getDerivedPoolDetail,
  getTradeAsset,
  getTradeAssets,
  getRunePool,
  getThorVersion,
  getTSSMetrics,
  getSecuredAssets,
  getTCYStaker,
} from './thornode.api'
import { getTendermintLatestBlocks } from './tendermint.api'
import {
  getDashboardData,
  getDashboardPlots,
  getExraNodesInfo,
  getTCY,
  getChainsHeight,
  getHolders,
  getServerTx,
  getPoolsHistory,
  getOldPoolsHistory,
  getSaversInfo,
  getRunePoolsInfo,
  getOldRunePools,
  getOldRunePoolProvidersInfo,
  getRunePoolProvidersInfo,
  getBorrowersInfo,
  getSwapsWeekly,
  getStatsDaily,
  getFeesRewardsMonthly,
  getAffiliateSwapsMonthly,
  getAffiliateSwapsWeekly,
  getNodeOverview,
  getActions,
  getCoinMarketInfo,
  getNodesInfo,
  getTopSwaps,
  getEarnings,
  getNodes,
  getNetworkAllocation,
  getReserveHistory,
  getVotes,
  getTopSwapsWeekly,
  getTopSwapsMonthly,
  getBurnedBlocks,
  getExecutionQuality,
  getAffiliateSwapsDaily,
  getAffiliateHistory,
  getAffiliateStats,
  getInfraRUJIMerge,
  getTcyInfo,
  getDenoms,
  getContracts,
  search,
  getSwapsByThorname,
  getBalanceHistory,
  getTCYDistribution,
  getContractsLabel,
  getRUJIStats,
} from './middleware.api'
import {
  getChurnHistory,
  getFlipTVL,
  getRunePrice,
  getDailySwap,
} from './insights.api'
import { getTHORLastBlock, getBlockHeight, getQuote, getChurn } from './infra'
import endpoints from './endpoints'
export var $axiosInstace

// interceptor to catch errors
const errorInterceptor = (error) => {
  // check if it's a server error
  if (!error.response) {
    console.warn('Network/Server error')
    return Promise.reject(error)
  }

  // all the other error responses
  switch (error.response.status) {
    case 400:
      console.error(error.response.status, error.message)
      console.warn('Nothing to display', 'Data Not Found')
      break

    case 401: // authentication error, logout the user
      console.warn('Please login again', 'Session Expired')
      break

    case 429: // too many requests
      console.warn('Too many requests, Try again')
      break

    case 501: // Wrong request
      console.warn('Wrong Request')
      break

    case 503: // Wrong request
      console.warn('Service Unavailable')
      break

    default:
      console.error(error.response.status, error.message)
      console.error('Server Error')
  }
  return Promise.reject(error)
}

// Interceptor for responses
const responseInterceptor = (response) => {
  switch (response.status) {
    case 200:
      // yay!
      break
    // any other cases
    default:
    // default case
  }

  return response
}

export default function ({ $axios }, inject) {
  axiosRetry($axios, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      const status = error.response ? error.response.status : null
      if (error.message === 'Network Error') {
        return true
      }
      return status === 504 || status === 429
    },
  })
  $axios.interceptors.response.use(responseInterceptor, errorInterceptor)
  if (process.env.NETWORK === 'mainnet') {
    $axios.defaults.headers.common['X-Client-ID'] = 'thorchain.net'
  }

  // defining the inner Vue axios instace to the outer scope
  $axios.defaults.baseURL = endpoints[process.env.NETWORK].MIDGARD_BASE_URL
  $axiosInstace = $axios

  const api = {
    getBlockHeight,
    getRunePoolProviders,
    getStats,
    getTxs,
    getConstants,
    getMimir,
    getDenom,
    getStakers,
    getOutboundFees,
    getCodes,
    getTx,
    getAddress,
    getPoolStats,
    getPools,
    getEarningHistory,
    getPoolTxs,
    getBalance,
    getLastBlockHeight,
    getNativeTx,
    getThorNetwork,
    getInboundAddresses,
    getMimirVotes,
    getLpPositions,
    getPoolDetail,
    getAssets,
    getThorPools,
    volumeHistory,
    swapHistory,
    getTVLHistory,
    earningsHistory,
    earnings,
    getPoolVolume,
    getSupplyRune,
    getSupply,
    getRPCLastBlockHeight,
    getLastTvl,
    getYggdrasil,
    getAsgard,
    getLatestBlocks,
    getTendermintLatestBlocks,
    getAddresses,
    getRevThorname,
    getOutbound,
    getBlockChainVersion,
    getThorchainTx,
    getDashboardData,
    getDashboardPlots,
    getNodes,
    getExraNodesInfo,
    getTCY,
    getChurnHistory,
    getFlipTVL,
    getNetwork,
    getChurn,
    getNode,
    getRunePrice,
    getDailySwap,
    getPoolDepth,
    getThorname,
    getMemberDetails,
    getSaverDetails,
    getSavers,
    getThornodeDetailTx,
    getThornodeArchiveTx,
    getTxArchiveStatus,
    getChainsHeight,
    getHolders,

    getUserLpPosition,
    getPol,
    getBorrowers,
    getStreamingSwap,
    getTxStages,
    getTxStatus,
    getServerTx,
    earningLastDay,
    getStreamingSwaps,
    getPoolsHistory,
    getOldPoolsHistory,
    getScheduled,
    getSaversInfo,
    getBorrowerDetails,
    getDerivedPoolDetail,
    getTradeAsset,
    getTradeAssets,
    getRunePool,
    getRunePoolsInfo,
    getOldRunePools,
    getOldRunePoolProvidersInfo,
    getRunePoolProvidersInfo,
    getBorrowersInfo,
    getTHORLastBlock,
    getSwapsWeekly,
    getStatsDaily,
    getFeesRewardsMonthly,
    getAffiliateSwapsMonthly,
    getAffiliateSwapsWeekly,
    getAffiliateSwapsDaily,
    getNodeOverview,
    getActions,
    getMidgardActions,
    getThorVersion,
    getCoinMarketInfo,
    getNodesInfo,
    getQuote,
    getTopSwaps,
    getEarnings,
    getNetworkAllocation,
    getTSSMetrics,
    getSwapsHistory,
    getReserveHistory,
    getVotes,
    getTopSwapsWeekly,
    getTopSwapsMonthly,
    getBurnedBlocks,
    getExecutionQuality,
    getSecuredAssets,
    getAffiliateHistory,
    getAffiliateStats,
    getInfraRUJIMerge,
    getTCYDistribution,
    getTCYStaker,
    getTcyInfo,
    getDenoms,
    getContracts,
    search,
    getSwapsByThorname,
    getBalanceHistory,
    getContractsLabel,
    getRUJIStats,
  }

  inject('api', api)
}
