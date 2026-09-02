/**
 * Flattens a contract event's `attributes: [{key, value}]` array into a
 * plain `{key: value}` object. Was independently redefined identically in
 * 3 of contractOverview's branches (DAO proposal, Order Book Clearing,
 * Ghost Credit borrow) before this extraction — consolidated here.
 */
export function toAttrs(e) {
  return Object.fromEntries(
    (e.attributes || []).map(({ key, value }) => [key, value])
  )
}

/**
 * Parses a Cosmos coin string ("57749eth-eth,2752799350thor.lqdy") into
 * `[{ amt, denom }]`. Note that the SDK serialises coins sorted
 * alphabetically by denom, so the resulting order carries no meaning.
 */
export function parseCoinString(coinString = '') {
  return coinString
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => ({
      amt: parseInt(part) || 0,
      denom: part.replace(/^\d+/, '').trim(),
    }))
}

/**
 * Works out which denom of a FIN pair is the base and which is the quote.
 *
 * The registry is authoritative when it knows the contract
 * ("rujira-fin:base:quote"), but it does not cover every pair. The fallback
 * used to take the coin string's order as base-then-quote, which is wrong:
 * Cosmos sorts coins alphabetically, so for the ETH/LQDY pair it read
 * `eth-eth` as the base and swapped both amounts and the pair label. Instead
 * match each denom against the base/quote amounts the contract emitted —
 * those are unambiguous — and only fall back to coin order when the two
 * amounts are equal (or one is missing) and matching cannot decide.
 */
export function resolveFinPairDenoms({
  pairEntry,
  coins = [],
  baseAmt = 0,
  quoteAmt = 0,
}) {
  const [, labelBase, labelQuote] = (pairEntry?.contractLabel || '').split(':')
  if (labelBase && labelQuote) {
    return { baseDenom: labelBase, quoteDenom: labelQuote }
  }

  if (coins.length === 2 && baseAmt && quoteAmt && baseAmt !== quoteAmt) {
    const base = coins.find((c) => c.amt === baseAmt)
    const quote = coins.find((c) => c.amt === quoteAmt)
    if (base && quote && base.denom !== quote.denom) {
      return { baseDenom: base.denom, quoteDenom: quote.denom }
    }
  }

  // Only one leg moved (e.g. a range that accrued yield on one side): the
  // registry is the only source for the other denom, so leave it empty
  // rather than mislabelling the single coin as the base.
  if (coins.length === 1 && !baseAmt !== !quoteAmt) {
    return baseAmt
      ? { baseDenom: coins[0].denom, quoteDenom: labelQuote || '' }
      : { baseDenom: labelBase || '', quoteDenom: coins[0].denom }
  }

  return {
    baseDenom: labelBase || coins[0]?.denom || '',
    quoteDenom: labelQuote || coins[1]?.denom || '',
  }
}
