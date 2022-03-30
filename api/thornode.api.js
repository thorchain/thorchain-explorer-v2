// axios instance
import { $axiosInstace } from './index';

export function getMimir() {
  return $axiosInstace.get(process.env.THORNODE_URL + 'thorchain/mimir');
}

export function getBalance(address) {
  return $axiosInstace.get(process.env.THORNODE_URL + `bank/balances/${address}`);
}

export function getLastBlockHeight() {
  return $axiosInstace.get(process.env.THORNODE_URL + 'thorchain/lastblock');
}

export function getNativeTx(txID) {
  return $axiosInstace.get(process.env.THORNODE_URL + `cosmos/tx/v1beta1/txs/${txID}`);
}

export function getThorNetwork() {
  return $axiosInstace.get(process.env.THORNODE_URL + `thorchain/network`);
}

export function getInboundAddresses() {
  return $axiosInstace.get(process.env.THORNODE_URL + `thorchain/inbound_addresses`);
}