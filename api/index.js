import axiosRetry from 'axios-retry'
import {
  getStats,
  getTxs,
  getTx,
  getAddress,
  getPoolStats,
  getPoolTxs,
  volumeHistory,
  swapHistory,
  tvlHistory,
  earningsHistory,
  getPoolVolume,
  getLastTvl,
  getLatestBlocks,
  getRevThorname,
  getPools,
  getNetwork,
  getPoolDepth,
  getSupplyHistory,
  getMemberDetails,
  getSaverDetails,
  earningLastDay,
  getBorrowerDetails,
  getMidgardActions,
} from './midgard.api'
import {
  getRunePoolProviders,
  getMimir,
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
} from './thornode.api'
import { getTendermintLatestBlocks } from './tendermint.api'
import {
  getDashboardData,
  getDashboardPlots,
  getExraNodesInfo,
  getOhclPrice,
  getChainsHeight,
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
  getAffiliateSwapsByWallet,
  getAffiliateByWallet,
  getAffiliateDaily,
  getActions,
  getCoinMarketInfo,
  getNodesInfo,
  getTopSwaps,
  getEarnings,
  getNodes,
  getNetworkAllocation,
} from './middleware.api'
import {
  getChurnHistory,
  getFlipTVL,
  getRunePrice,
  getDailySwap,
} from './insights.api'
import { getTHORLastBlock, getBlockHeight, getQuote } from './infra'
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
    getTx,
    getAddress,
    getPoolStats,
    getPools,
    getSupplyHistory,
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
    tvlHistory,
    earningsHistory,
    getPoolVolume,
    getSupplyRune,
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
    getChurnHistory,
    getFlipTVL,
    getNetwork,
    getNode,
    getRunePrice,
    getDailySwap,
    getOhclPrice,
    getPoolDepth,
    getThorname,
    getMemberDetails,
    getSaverDetails,
    getSavers,
    getThornodeDetailTx,
    getThornodeArchiveTx,
    getTxArchiveStatus,
    getChainsHeight,
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
    getAffiliateSwapsByWallet,
    getAffiliateByWallet,
    getAffiliateDaily,
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
  }

  inject('api', api)
}
