import {
  isOperationalMimir,
  isVoteWithdrawal,
  requiredVotes,
  DEFAULT_OPERATIONAL_VOTES_MIN,
} from '~/utils/mimir'

/**
 * Vote-tally/threshold computation for a single Mimir key/value, reusing
 * the exact algorithm pages/network/votes.vue already has working: a
 * node's LATEST vote wins (earlier votes from the same node for a
 * different value on the same key are dropped), and the threshold comes
 * from the shared requiredVotes() — operational keys activate on
 * OperationalVotesMin votes, not on a 2/3 supermajority, which is why the
 * tally is reported against `votesRequired` rather than the active set.
 *
 * Withdrawals (a negative vote value, see isVoteWithdrawal) are not a value
 * a node can back: they cancel that node's vote, so they consume the node's
 * latest-vote slot but add to no tally bucket. When the tx being rendered is
 * itself a withdrawal it has no value of its own to measure, so the returned
 * tally tracks the key's current effective value instead — reported back as
 * `trackedValue` so callers can label the numbers honestly.
 *
 * @param {{ votes: Array, mimirData: Object, nodes: Array, key: string,
 *   value: string|number }} params
 *   - votes: $api.getVotes() response body — [{ value: key, votes: [{key:
 *     voteValue, date, address}] }]
 *   - mimirData: $api.getMimir() response body — { [key]: currentValue }
 *   - nodes: $api.getNodes() response body — THORNode node objects
 * @returns {{
 *   activeNodeCount: number, votesRequired: number, operational: boolean,
 *   votesFor: number, votesOther: number, totalVotesCast: number,
 *   withdrawnCount: number, progressPercent: number, reached: boolean,
 *   isWithdrawal: boolean, trackedValue: string|null,
 *   currentEffectiveValue: string|number|undefined,
 * } | null} null when the key has no matching vote entry at all.
 */
export function computeMimirConsensus({ votes, mimirData, nodes, key, value }) {
  const activeNodes = (nodes || [])
    .filter((n) => n.status === 'Active')
    .map((n) => n.node_address)
  const activeSet = new Set(activeNodes)
  const operational = isOperationalMimir(key)
  const operationalVotesMin =
    mimirData?.OPERATIONALVOTESMIN != null
      ? +mimirData.OPERATIONALVOTESMIN
      : DEFAULT_OPERATIONAL_VOTES_MIN
  const votesRequired = requiredVotes({
    key,
    activeNodeCount: activeNodes.length,
    operationalVotesMin,
  })

  const voteEntry = (votes || []).find((v) => v.value === key)
  if (!voteEntry) return null

  // Latest-vote-wins tally, matching votes.vue's processVotes(): a node's
  // vote only counts toward the FIRST entry it appears in (the API already
  // orders each node's votes newest-first), so track which nodes have
  // already had their latest vote counted as we walk the list.
  const counted = new Set()
  const tally = {}
  let withdrawnCount = 0
  for (const v of voteEntry.votes || []) {
    if (!activeSet.has(v.address) || counted.has(v.address)) continue
    counted.add(v.address)
    const voteValue = String(v.key)
    if (isVoteWithdrawal(voteValue)) {
      // Cancelled: the node backs nothing on this key any more, and its
      // older votes further down the list stay excluded via `counted`.
      withdrawnCount++
      continue
    }
    tally[voteValue] = (tally[voteValue] || 0) + 1
  }

  const currentEffectiveValue = mimirData?.[key]
  const isWithdrawal = isVoteWithdrawal(value)
  const trackedValue = isWithdrawal
    ? currentEffectiveValue != null
      ? String(currentEffectiveValue)
      : null
    : String(value)

  const votesFor = trackedValue != null ? tally[trackedValue] || 0 : 0
  const totalVotesCast = Object.values(tally).reduce((sum, n) => sum + n, 0)
  const isEffective =
    trackedValue != null &&
    currentEffectiveValue != null &&
    String(currentEffectiveValue) === trackedValue
  // Same rule as votes.vue's isVotePassed: an operational key takes effect
  // immediately once quorum + strict plurality is reached, so the effective
  // value is the only authority there — our 30-day vote window can't be
  // used to recompute it. An economic key can also be counted as passed
  // straight from the tally.
  const reached = operational
    ? isEffective
    : isEffective || votesFor >= votesRequired

  return {
    activeNodeCount: activeNodes.length,
    votesRequired,
    operational,
    votesFor,
    votesOther: totalVotesCast - votesFor,
    totalVotesCast,
    withdrawnCount,
    // Progress toward the threshold, not share of the active set — the same
    // scale votes.vue's getProgressWidth() draws its bars on.
    progressPercent: votesRequired
      ? Math.min(votesFor, votesRequired) / votesRequired
      : 0,
    reached,
    isWithdrawal,
    trackedValue,
    currentEffectiveValue,
  }
}
