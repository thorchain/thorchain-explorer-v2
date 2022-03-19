// axios instance
import { $axiosInstace } from './index';

export function getStats() {
  return $axiosInstace.get('/stats');
}

export function getTxs(offset=0, limit=10) {
  const params = {
    offset,
    limit
  }

  return $axiosInstace.get('/actions', { params });
}

export function getConstants() {
  return $axiosInstace.get('thorchain/constants');
}

export function getTx(txid, limit=10) {
  const params = {
    offset: 0,
    limit,
    txid
  }

  return $axiosInstace.get('/actions', {params})
}

export function getAddress(address, offset=0, limit=10) {
  const params = {
    offset,
    limit,
    address
  }

  return $axiosInstace.get('/actions', {params})
}

export function getPoolTxs(poolName, offset=0, limit=10) {
  const params = {
    offset,
    limit,
    asset: poolName
  }

  return $axiosInstace.get('/actions', {params})
}

export function getPoolStats(poolName) {
  return $axiosInstace.get(`/pool/${poolName}/stats`)
}