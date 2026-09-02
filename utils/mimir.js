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

// A node cancels a vote by submitting a negative value (-1 by convention):
// THORNode drops that node's mimir entry for the key instead of recording a
// vote, so a withdrawal counts toward no value at all - the node simply goes
// back to having no standing vote on that key.
export function isVoteWithdrawal(value) {
  const n = Number(value)
  return Number.isFinite(n) && n < 0
}

// Vote threshold for a Mimir key, mirroring THORNode's quorum rules:
// operational keys activate on OperationalVotesMin votes (with strict
// plurality) rather than a supermajority, SOL-RPC-PROVIDER on a quarter of
// the active set, and everything else on floor(2/3 * active) + 1.
export function requiredVotes({
  key,
  activeNodeCount,
  operationalVotesMin = DEFAULT_OPERATIONAL_VOTES_MIN,
}) {
  if (key === 'SOL-RPC-PROVIDER') {
    return Math.floor(activeNodeCount * 0.25)
  }
  if (isOperationalMimir(key)) {
    return operationalVotesMin
  }
  return Math.floor((activeNodeCount * 2) / 3) + 1
}
