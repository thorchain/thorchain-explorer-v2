import endpoints from './endpoints'
import { $axiosInstace } from './index'

export function getTendermintBlocks (block) {
  return $axiosInstace.get(endpoints[process.env.NETWORK].TENDERMINT_URL + `block_search?query="block.height>${block}"`)
}

export function getTendermintLatestBlocks (minblock) {
  return $axiosInstace.get(endpoints[process.env.NETWORK].TENDERMINT_URL + `blockchain?minHeight=${minblock}`)
}
