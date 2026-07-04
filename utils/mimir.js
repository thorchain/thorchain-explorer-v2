// Port of THORNode's IsOperationalMimir
// (x/thorchain/keeper/v1/keeper_mimir.go). Operational mimirs only need
// OperationalVotesMin votes (with strict plurality) instead of supermajority.
export const DEFAULT_OPERATIONAL_VOTES_MIN = 3

const OPERATIONAL_EXACT = new Set([
  'MINTSYNTHS',
  'TRADEACCOUNTSENABLED',
  'RUNEPOOLENABLED',
  'EVMDISABLECONTRACTWHITELIST',
  'MAXOUTBOUNDATTEMPTS',
  'ADVSWAPQUEUERAPIDSWAPMAX',
  'ENABLEADVSWAPQUEUE',
  'STREAMINGLIMITSWAPMAXAGE',
  'OVERSOLVENCYCHECKINTERVAL',
  'OVERSOLVENCYTOTREASURYBPS',
  'SCHEDULEDMIGRATION',
  'MAXRETIREDVAULTRECOVERYATTEMPTS',
  'P2PGATEDISABLED',
  'ENABLEMEMOLESSOUTBOUND',
])

// Economic despite containing 'PAUSE'; checked before partial matches
const ECONOMIC_EXACT = new Set([
  'NODEPAUSECHAINBLOCKS',
  'PAUSEONSLASHTHRESHOLD',
])

const OPERATIONAL_PREFIXES = ['COMPROMISEDVAULT-', 'L1DYNAMICFEE']

const OPERATIONAL_CONTAINS = [
  'HALT',
  'PAUSE',
  'STOPSOLVENCYCHECK',
  'MIMIRUPGRADECONTRACT',
  'EVMALLOWANCECHECK',
  'POLRESERVEBLACKLIST',
  'DYNAMICFEE-WHITELIST',
  'REVSHARE',
  'EVMDIRECTERC20INBOUND',
]

export function isOperationalMimir(key) {
  const k = String(key).toUpperCase()
  if (OPERATIONAL_EXACT.has(k)) {
    return true
  }
  if (ECONOMIC_EXACT.has(k)) {
    return false
  }
  if (OPERATIONAL_PREFIXES.some((p) => k.startsWith(p))) {
    return true
  }
  if (OPERATIONAL_CONTAINS.some((c) => k.includes(c))) {
    return true
  }
  // all min slip mimirs are operational (SlipMinBpsMax doesn't end with this)
  return k.endsWith('SLIPMINBPS')
}
