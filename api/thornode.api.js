import endpoints from './endpoints'
// axios instance
import { $axiosInstace } from './index'

export function getMimir() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + 'thorchain/mimir'
  )
}
export function getRunePoolProviders() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + 'thorchain/rune_providers'
  )
}

export function getBalance(address) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + `bank/balances/${address}`
  )
}

export function getLastBlockHeight() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + 'thorchain/lastblock'
  )
}

export function getBlockChainVersion() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + 'thorchain/version'
  )
}

export function getRPCLastBlockHeight() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + 'blocks/latest'
  )
}

export function getNativeTx(txID) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL +
      `cosmos/tx/v1beta1/txs/${txID}`
  )
}

export function getThornodeDetailTx(txID) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + `thorchain/tx/details/${txID}`
  )
}

export function getThorNetwork() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + 'thorchain/network'
  )
}

export function getInboundAddresses() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + 'thorchain/inbound_addresses'
  )
}

export function getMimirVotes() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + 'thorchain/mimir/nodes_all'
  )
}

export function getLpPositions(poolName) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL +
      `thorchain/pool/${poolName}/liquidity_providers`
  )
}

export function getUserLpPosition(poolName, address) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL +
      `thorchain/pool/${poolName}/liquidity_provider/${address}`
  )
}

export function getPoolDetail(poolName) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + `thorchain/pool/${poolName}`
  )
}

export function getDerivedPoolDetail(poolName) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + `thorchain/dpool/${poolName}`
  )
}

export function getAssets() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + 'cosmos/bank/v1beta1/supply'
  )
}

export function getSupplyRune() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL +
      'cosmos/bank/v1beta1/supply/rune'
  )
}

export function getThorPools() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + 'thorchain/pools'
  )
}

export function getYggdrasil() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + 'thorchain/vaults/yggdrasil'
  )
}

export function getAsgard() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + 'thorchain/vaults/asgard'
  )
}

export function getAddresses() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + 'cosmos/auth/v1beta1/accounts'
  )
}

export function getOutbound() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + 'thorchain/queue/outbound'
  )
}

export function getScheduled() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + 'thorchain/queue/scheduled'
  )
}

export function getThorchainTx(txID) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + `thorchain/tx/${txID}`
  )
}

export function getNodes() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + 'thorchain/nodes'
  )
}

export function getNode(addr) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + `thorchain/node/${addr}`
  )
}

export function getSavers(poolName) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL +
      `thorchain/pool/${poolName}/savers`
  )
}

export function getPol() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + 'thorchain/pol'
  )
}

export function getRunePool() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + 'thorchain/runepool'
  )
}

export function getBorrowers(pool) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL +
      `thorchain/pool/${pool}/borrowers`
  )
}

export function getConstants() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + 'thorchain/constants'
  )
}

export function getStreamingSwap(txid) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL +
      `thorchain/swap/streaming/${txid}`
  )
}

export function getStreamingSwaps() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + 'thorchain/swaps/streaming'
  )
}

export function getTxStages(txid) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + `thorchain/tx/stages/${txid}`
  )
}

export function getTxStatus(txid) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + `thorchain/tx/status/${txid}`
  )
}

export function getThorname(name) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + `thorchain/thorname/${name}`
  )
}

export function getTradeAsset(address) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL +
      `thorchain/trade/account/${address}`
  )
}

export function getTradeAssets() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].THORNODE_URL + 'thorchain/trade/units'
  )
}
