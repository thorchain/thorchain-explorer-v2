// axios instance
import { $axiosInstace } from './index'

export function getStats () {
  return $axiosInstace.get('stats')
}

export function getTxs (offset = 0, limit = 10, type = undefined) {
  const params = {
    offset,
    limit
  }

  if (type) { params.type = type }

  return $axiosInstace.get('actions', { params })
}

export function getConstants () {
  return $axiosInstace.get('thorchain/constants')
}

export function getTx (txid, limit = 10) {
  const params = {
    offset: 0,
    limit,
    txid
  }

  return $axiosInstace.get('actions', { params })
}

export function getAddress (address, offset = 0, limit = 10) {
  const params = {
    offset,
    limit,
    address
  }

  return $axiosInstace.get('actions', { params })
}

export function getPoolTxs (poolName, offset = 0, limit = 10) {
  const params = {
    offset,
    limit,
    asset: poolName
  }

  return $axiosInstace.get('actions', { params })
}

export function getPools () {
  return $axiosInstace.get('pools')
}

export function getPoolStats (poolName) {
  return $axiosInstace.get(`pool/${poolName}/stats`)
}

export function getPoolDepth (poolName, count = 30, from = undefined) {
  return $axiosInstace.get(`history/depths/${poolName}?interval=day&count=${count}` + (from ? `&from=${from}` : ''))
}

export function volumeHistory () {
  return $axiosInstace.get('history/liquidity_changes?interval=day&count=30')
}

export function swapHistory () {
  return $axiosInstace.get('history/swaps?interval=day&count=30')
}

export function tvlHistory () {
  return $axiosInstace.get('history/tvl?interval=day&count=30')
}

export function getLastTvl () {
  return $axiosInstace.get('history/tvl')
}

export function earningsHistory () {
  return $axiosInstace.get('history/earnings?interval=day&count=30')
}

export function getPoolVolume (poolName) {
  return $axiosInstace.get(`history/liquidity_changes?pool=${poolName}&interval=day&count=30`)
}

export function getNetwork () {
  return $axiosInstace.get('network')
}

export async function getLatestBlocks (latestBlock, count = 10) {
  if (!latestBlock) {
    return
  }

  const axiosUrls = [...Array(latestBlock + 1).keys()].slice(-1 * count).map(b => `debug/block/${b}`)

  const res = await Promise.all(axiosUrls.map(url => $axiosInstace.get(url))).then(
    (data) => {
      const datum = []
      for (const d of data) {
        datum.push(d.data)
      }
      return datum
    }
  )
  return res
}

export function getRevThorname (address) {
  return $axiosInstace.get(`thorname/rlookup/${address}`)
}

export function getThorname (name) {
  return $axiosInstace.get(`thorname/lookup/${name}`)
}
