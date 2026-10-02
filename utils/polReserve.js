// Mirrors THORNode's POLReserveCycle (x/thorchain/manager_network_current.go):
// each block the pol_reserve module deploys RUNE into the eligible L1 pool with
// the highest liquidity fees / RUNE depth. Fees roll over every PoolCycle
// blocks, and the cycle that just ended is what the next one is scored on, so
// the leader of the current cycle is the next POL target.

const DEFAULT_POOL_CYCLE = 43200
const SECONDS_PER_BLOCK = 6

// Mimir keys come back upper-cased; THORNode's Asset.MimirString() is CHAIN-SYMBOL.
const mimirString = (asset) => asset.replace('.', '-').toUpperCase()

const chainOf = (asset) => asset.split('.')[0].toUpperCase()

// Pool assets are either THOR.* (native/derived) or L1. An L1 asset with no
// contract suffix is its chain's gas asset (BTC.BTC, BSC.BNB, GAIA.ATOM, ...).
const isExternalL1 = (asset) => chainOf(asset) !== 'THOR'
const isGasAsset = (asset) =>
  isExternalL1(asset) && !asset.split('.')[1]?.includes('-')

const mimirValue = (mimir, key) => +(mimir?.[key] ?? 0)

// Height-scheduled pauses are active from the given height onwards.
const pausedAt = (mimir, key, height) => {
  const v = mimirValue(mimir, key)
  return v > 0 && (!height || v <= height)
}

// IsRagnarok also counts the chain's gas asset for token pools.
const isRagnarok = (asset, mimir) => {
  const prefix = `RAGNAROK-${chainOf(asset)}-`
  return Object.keys(mimir ?? {}).some(
    (k) =>
      +mimir[k] > 0 &&
      (k === `RAGNAROK-${mimirString(asset)}` ||
        (k.startsWith(prefix) && !k.slice(prefix.length).includes('-')))
  )
}

// IsPOLReserveEligiblePool: blacklist > whitelist > gas asset > TOR anchor.
export function isPolReserveEligibleAsset(asset, mimir) {
  const key = mimirString(asset)
  if (mimirValue(mimir, `POLRESERVEBLACKLIST-${key}`) > 0) return false
  if (mimirValue(mimir, `POLRESERVEWHITELIST-${key}`) > 0) return true
  if (isGasAsset(asset)) return true
  return mimirValue(mimir, `TORANCHOR-${key}`) > 0
}

// The pool filters POLReserveCycle applies before scoring, from a THORNode
// /pools entry.
export function isPolReserveCandidate(pool, mimir, height) {
  const { asset } = pool
  const chain = chainOf(asset)
  return (
    isExternalL1(asset) &&
    pool.status === 'Available' &&
    +pool.balance_rune > 0 &&
    !pool.trading_halted &&
    !isRagnarok(asset, mimir) &&
    !pausedAt(mimir, 'PAUSELP', height) &&
    !pausedAt(mimir, `PAUSELP${chain}`, height) &&
    mimirValue(mimir, `PAUSELPDEPOSIT-${mimirString(asset)}`) <= 0 &&
    isPolReserveEligibleAsset(asset, mimir)
  )
}

// Liquidity fees collected this cycle / RUNE depth.
export function cycleFeesDepth(pool) {
  return +pool.balance_rune > 0
    ? +(pool.rolling_pool_liquidity_fee_rune ?? 0) / +pool.balance_rune
    : 0
}

// The candidate leading the current cycle, or null when none has fees yet.
export function nextPolReserveTarget(pools, mimir, height) {
  let best = null
  let bestScore = 0
  for (const pool of pools ?? []) {
    if (!isPolReserveCandidate(pool, mimir, height)) continue
    const score = cycleFeesDepth(pool)
    if (score > bestScore) {
      best = pool.asset
      bestScore = score
    }
  }
  return best
}

export function poolCycleProgress(height, mimir) {
  const cycle = mimirValue(mimir, 'POOLCYCLE') || DEFAULT_POOL_CYCLE
  if (!height) return null
  const elapsed = height % cycle
  const remaining = cycle - elapsed
  return {
    cycle,
    elapsed,
    remaining,
    progress: elapsed / cycle,
    nextReset: height + remaining,
    secondsLeft: remaining * SECONDS_PER_BLOCK,
  }
}
