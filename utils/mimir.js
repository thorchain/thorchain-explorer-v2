// Port of THORNode's IsOperationalMimir
// (x/thorchain/keeper/v1/keeper_mimir.go, v3.21.2). Operational mimirs only need
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
  'DISABLETSSSIGNERFILTERING',
  'POLRESERVESYSTEMINCOMEBPS',
  'STABLERESERVEORACLEPRICING',
  'PREFLIGHTCHAINSETDISABLED',
])

// Economic despite containing 'PAUSE'; checked before partial matches
const ECONOMIC_EXACT = new Set([
  'NODEPAUSECHAINBLOCKS',
  'PAUSEONSLASHTHRESHOLD',
])

const OPERATIONAL_PREFIXES = [
  'COMPROMISEDVAULT-',
  'ALLOWNOVAULT-',
  'XMRCONSOLIDATION',
  'L1DYNAMICFEE',
  'OVERSOLVENCYTOTREASURYBPS-',
]

const OPERATIONAL_CONTAINS = [
  'HALT',
  'PAUSE',
  'STOPSOLVENCYCHECK',
  'MIMIRUPGRADECONTRACT',
  'EVMALLOWANCECHECK',
  'POLRESERVEBLACKLIST',
  'POLRESERVEWHITELIST',
  'DYNAMICFEE-WHITELIST',
  'REVSHARE',
  'EVMDIRECTERC20INBOUND',
  'SKIPSIGNERCACHE',
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

// ---------------------------------------------------------------------------
// Operational keys THORNode actually reads (THORNode v3.21.2: constants/,
// x/thorchain, bifrost). Any key that IsOperationalMimir accepts (it matches
// on substrings like HALT or PAUSE) but that is not in this list is never
// read, so votes on it change nothing; usually a word-order typo such as
// HALTBTCSIGNING for HALTSIGNINGBTC.
// ---------------------------------------------------------------------------

// common/chain.go
export const THORNODE_CHAINS = [
  'BSC',
  'ETH',
  'BTC',
  'LTC',
  'BCH',
  'DOGE',
  'THOR',
  'GAIA',
  'NOBLE',
  'AVAX',
  'BASE',
  'TRON',
  'XRP',
  'SOL',
  'ZEC',
  'XMR',
  'POL',
  'SUI',
  'ADA',
  'TAO',
  'DOT',
]

const KNOWN_OPERATIONAL_KEYS = new Set([
  // ConstantName values IsOperationalMimir accepts (constantname_string.go)
  'ADVSWAPQUEUERAPIDSWAPMAX',
  'DERIVEDSLIPMINBPS',
  'EVMDISABLECONTRACTWHITELIST',
  'ENABLEADVSWAPQUEUE',
  'ENABLEMEMOLESSOUTBOUND',
  'HALTMEMOLESS',
  'HALTOPERATORROTATE',
  'HALTORACLE',
  'HALTREBOND',
  'L1DYNAMICFEECEILINGBPS',
  'L1DYNAMICFEEDEADBANDBPS',
  'L1DYNAMICFEEENABLED',
  'L1DYNAMICFEEEPOCHBLOCKS',
  'L1DYNAMICFEEFLOORBPS',
  'L1DYNAMICFEESTEPBPS',
  'L1DYNAMICFEEWINDOWEPOCHS',
  'L1SLIPMINBPS',
  'MAXOUTBOUNDATTEMPTS',
  'MAXRETIREDVAULTRECOVERYATTEMPTS',
  'MINTSYNTHS',
  'OVERSOLVENCYCHECKINTERVAL',
  'OVERSOLVENCYTOTREASURYBPS',
  'P2PGATEDISABLED',
  'POLRESERVESYSTEMINCOMEBPS',
  'PAUSEBOND',
  'PAUSEUNBOND',
  'RUNEPOOLENABLED',
  'RUNEPOOLHALTDEPOSIT',
  'RUNEPOOLHALTWITHDRAW',
  'SECUREDASSETSLIPMINBPS',
  'STABLERESERVEORACLEPRICING',
  'STABLESLIPMINBPS',
  'STREAMINGLIMITSWAPMAXAGE',
  'STREAMINGSWAPPAUSE',
  'SYNTHSLIPMINBPS',
  'TCYCLAIMINGHALT',
  'TCYCLAIMINGSWAPHALT',
  'TCYSTAKEDISTRIBUTIONHALT',
  'TCYSTAKINGHALT',
  'TCYUNSTAKINGHALT',
  'TRADEACCOUNTSENABLED',
  'TRADEACCOUNTSSLIPMINBPS',
  'VAULTDEFICITGASHALTMAXGASMULTIPLIER',
  'WASMARBSLIPMINBPS',
  // String keys (mimir_strings.go and literals in keeper_halt.go,
  // telemetry_chain.go, bifrost signing/blockscanner)
  'HALTSIGNING',
  'PAUSELP',
  'HALTCHAINGLOBAL',
  'HALTCHURNING',
  'HALTTRADING',
  'HALTTCYTRADING',
  'NODEPAUSECHAINGLOBAL',
  'STOPSOLVENCYCHECK',
  'HALTSECUREDGLOBAL',
  'HALTWASMGLOBAL',
  'HALTMONOVAULTKEYGEN',
  'SCHEDULEDMIGRATION',
  'DISABLETSSSIGNERFILTERING',
  'PREFLIGHTCHAINSETDISABLED',
  // bifrost XMR consolidation tuning
  'XMRCONSOLIDATIONCHECKINTERVALBLOCKS',
  'XMRCONSOLIDATIONCHURNLOOKAHEADBLOCKS',
  'XMRCONSOLIDATIONCOOLDOWNBLOCKS',
  'XMRCONSOLIDATIONENABLED',
  'XMRCONSOLIDATIONMAXINPUTS',
  'XMRCONSOLIDATIONMAXLOCKBPS',
  'XMRCONSOLIDATIONMAXRETRIES',
  'XMRCONSOLIDATIONMINUNLOCKEDATOMIC',
  'XMRCONSOLIDATIONMINUNLOCKEDOUTPUTS',
  'XMRCONSOLIDATIONRESERVEBPS',
  'XMRCONSOLIDATIONTARGETOUTPUTS',
])

// Chain glued into the name, e.g. HaltSigning%s, Halt%sTrading.
const CHAIN_TEMPLATES = [
  'HALTSIGNING{C}',
  'HALT{C}TRADING',
  'HALT{C}CHAIN',
  'SOLVENCYHALT{C}CHAIN',
  'PAUSELP{C}',
  'STOPSOLVENCYCHECK{C}',
  'MIMIRUPGRADECONTRACT{C}',
  'SKIPSIGNERCACHE{C}',
]

// `Name-<chain>` keys.
const CHAIN_SUFFIX_PREFIXES = [
  'ALLOWNOVAULT-',
  'EVMALLOWANCECHECK-',
  'EVMDIRECTERC20INBOUND-',
  'HALTSECUREDDEPOSIT-',
  'HALTSECUREDWITHDRAW-',
  'HALTTRADEDEPOSIT-',
  'HALTTRADEWITHDRAW-',
  'PAUSEASYMWITHDRAWAL-',
]

// `Name-<asset / address / checksum / thorname>` keys.
const FREE_SUFFIX_PREFIXES = [
  'COMPROMISEDVAULT-',
  'DYNAMICFEE-WHITELIST-',
  'HALTWASMCONTRACT-',
  'HALTWASMCS-',
  'HALTWASMDEPLOYER-',
  'OVERSOLVENCYTOTREASURYBPS-',
  'PAUSELPDEPOSIT-',
  'POLRESERVEBLACKLIST-',
  'POLRESERVEWHITELIST-',
  'REVSHARE-',
  'SOLVENCYHALTVAULT-',
]

const CHAIN_KEYS = new Set(
  CHAIN_TEMPLATES.flatMap((t) =>
    THORNODE_CHAINS.map((c) => t.replace('{C}', c))
  )
)

// True when THORNode reads this key (case-insensitive).
export function isKnownOperationalKey(key) {
  const k = String(key).toUpperCase()
  if (KNOWN_OPERATIONAL_KEYS.has(k) || CHAIN_KEYS.has(k)) return true
  for (const p of CHAIN_SUFFIX_PREFIXES) {
    if (k.startsWith(p)) return THORNODE_CHAINS.includes(k.slice(p.length))
  }
  return FREE_SUFFIX_PREFIXES.some(
    (p) => k.startsWith(p) && k.length > p.length
  )
}

const sortChars = (s) => [...s].sort().join('')
const strip = (s) => s.replace(/[-_]/g, '')

function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
    prev = cur
  }
  return prev[b.length]
}

const CANDIDATES = [...KNOWN_OPERATIONAL_KEYS, ...CHAIN_KEYS]

// The key THORNode probably meant, for a key it does not read.
function suggestKey(k) {
  const bare = strip(k)
  // Missing dash on a `Name-<suffix>` key: HALTSECUREDDEPOSITBTC.
  for (const p of [...CHAIN_SUFFIX_PREFIXES, ...FREE_SUFFIX_PREFIXES]) {
    const head = strip(p)
    if (
      bare.startsWith(head) &&
      bare.length > head.length &&
      !k.startsWith(p)
    ) {
      return p + k.slice(k.length - (bare.length - head.length))
    }
  }
  // Same letters, other order or separators: HALTBTCSIGNING.
  const sorted = sortChars(bare)
  const anagram = CANDIDATES.find((c) => sortChars(c) === sorted)
  if (anagram) return anagram
  // Small spelling slip: HALTSIGNIGBTC.
  if (bare.length >= 8) {
    let best
    let bestD = 3
    for (const c of CANDIDATES) {
      const d = editDistance(bare, c)
      if (d < bestD) {
        bestD = d
        best = c
      }
    }
    return best
  }
  return undefined
}

// For an operational-looking key THORNode never reads, returns
// { suggestion } (suggestion may be undefined when nothing is close);
// otherwise undefined.
export function checkOperationalKey(key) {
  if (!isOperationalMimir(key)) return undefined
  const k = String(key).toUpperCase()
  if (isKnownOperationalKey(k)) return undefined
  return { suggestion: suggestKey(k) }
}
