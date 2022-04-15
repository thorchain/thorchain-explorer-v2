import { $axiosInstace } from './index';

export function getTendermintBlocks(block) {
  return $axiosInstace.get(process.env.TENDERMINT_URL + `block_search?query="block.height>${block}"`);
}

export function getTendermintLatestBlocks(minblock) {
  return $axiosInstace.get(process.env.TENDERMINT_URL + `blockchain?minHeight=${minblock}`);
}