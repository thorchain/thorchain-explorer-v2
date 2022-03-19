// axios instance
import { $axiosInstace } from './index';

export function getMimir() {
  return $axiosInstace.get(process.env.THORNODE_URL + '/mimir');
}

export function getBalance(address) {
  return $axiosInstace.get(process.env.THORNODE_URL + `/bank/balances/${address}`);
}