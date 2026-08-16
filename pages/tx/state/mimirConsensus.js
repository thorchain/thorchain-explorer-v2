/**
 * Vote-tally/threshold computation for a single Mimir key/value, reusing
 * the exact algorithm pages/network/votes.vue already has working: a
 * node's LATEST vote wins (earlier votes from the same node for a
 * different value on the same key are dropped), and consensus needs
 * floor(2/3 * activeNodes) + 1 votes. This module intentionally doesn't
 * port votes.vue's "operational vs economic" branch (a different quorum
 * rule for a handful of special keys) — the tx-detail hero only needs to
 * answer "did THIS vote's value reach consensus", not render the full
 * governance dashboard.
 *
 * @param {{ votes: Array, mimirData: Object, nodes: Array, key: string,
 *   value: string|number }} params
 *   - votes: $api.getVotes() response body — [{ value: key, votes: [{key:
 *     voteValue, date, address}] }]
 *   - mimirData: $api.getMimir() response body — { [key]: currentValue }
 *   - nodes: $api.getNodes() response body — THORNode node objects
 * @returns {{
 *   activeNodeCount: number, votesRequired: number, votesFor: number,
 *   totalVotesCast: number, percentFor: number, percentOthers: number,
 *   thresholdPercent: number, reached: boolean,
 *   currentEffectiveValue: string|number|undefined,
 * } | null} null when the key has no matching vote entry at all.
 */
export function computeMimirConsensus({ votes, mimirData, nodes, key, value }) {
  const activeNodes = (nodes || [])
    .filter((n) => n.status === 'Active')
    .map((n) => n.node_address)
  const votesRequired = Math.floor((activeNodes.length * 2) / 3) + 1

  const voteEntry = (votes || []).find((v) => v.value === key)
  if (!voteEntry) return null

  // Latest-vote-wins tally, matching votes.vue's processVotes(): a node's
  // vote only counts toward the FIRST key entry it appears in (the API
  // already orders each node's votes newest-first), so track which nodes
  // are still unaccounted for as we walk the list.
  const notVoted = new Set(activeNodes)
  const tally = {}
  for (const v of voteEntry.votes || []) {
    if (!notVoted.has(v.address)) continue
    const voteValue = String(v.key)
    tally[voteValue] = (tally[voteValue] || 0) + 1
    notVoted.delete(v.address)
  }

  const votesFor = tally[String(value)] || 0
  const totalVotesCast = Object.values(tally).reduce((sum, n) => sum + n, 0)
  const currentEffectiveValue = mimirData?.[key]
  const reached =
    currentEffectiveValue != null &&
    String(currentEffectiveValue) === String(value)

  return {
    activeNodeCount: activeNodes.length,
    votesRequired,
    votesFor,
    totalVotesCast,
    percentFor: activeNodes.length ? votesFor / activeNodes.length : 0,
    percentOthers: activeNodes.length
      ? (totalVotesCast - votesFor) / activeNodes.length
      : 0,
    thresholdPercent: activeNodes.length
      ? votesRequired / activeNodes.length
      : 0,
    reached,
    currentEffectiveValue,
  }
}
