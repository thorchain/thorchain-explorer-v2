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
  getThorname,
  getMemberDetails,
  getSaverDetails
} from './midgard.api'
import {
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
  getNodes,
  getNode,
  getSavers,
  getThornodeDetailTx,
  getUserLpPosition,
  getPol,
  getBorrowers,
  getConstants,
  getStreamingSwap,
  getTxStages,
  getTxStatus
} from './thornode.api'
import {
  getTendermintLatestBlocks
} from './tendermint.api'
import {
  getDashboardData,
  getDashboardPlots,
  getExraNodesInfo,
  getOhclPrice,
  getSaversExtraData,
  getOldSaversExtraData,
  getChainsHeight,
  getServerTx
} from './middleware.api'
import {
  getChurnHistory,
  getFlipTVL,
  getRunePrice,
  getDailySwap
} from './insights.api'
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
  axiosRetry($axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay })
  $axios.interceptors.response.use(responseInterceptor, errorInterceptor)

  // defining the inner Vue axios instace to the outer scope
  $axios.defaults.baseURL = endpoints[process.env.NETWORK].MIDGARD_BASE_URL
  $axiosInstace = $axios

  const api = {
    getStats,
    getTxs,
    getConstants,
    getMimir,
    getTx,
    getAddress,
    getPoolStats,
    getPools,
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
    getSaversExtraData,
    getSaverDetails,
    getSavers,
    getOldSaversExtraData,
    getThornodeDetailTx,
    getChainsHeight,
    getUserLpPosition,
    getPol,
    getBorrowers,
    getStreamingSwap,
    getTxStages,
    getTxStatus,
    getServerTx
  }

  inject('api', api)
}
