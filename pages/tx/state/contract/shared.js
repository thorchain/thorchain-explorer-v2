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
