/**
 * Single source of truth for the memo that drives type routing (hero
 * selection, the BUILDERS registry, createAbstractState's title) —
 * previously computed inline in createTxState from THORNode data alone
 * (`thorTx?.tx?.tx?.memo || thorStatus?.tx?.memo`), which silently produced
 * an empty/`unknown` memo for any tx THORNode has nothing for. That's not
 * an edge case: THORNode prunes/lags on older or edge-case txs as a matter
 * of course, while Midgard's action record is the durable archive. Two real
 * txs exposed this: a donate (1F10E98E...) whose type only exists in
 * Midgard's `action.type`, with no raw memo anywhere reachable from
 * THORNode or Midgard's own metadata (`metadata: {}`); and a failed bond
 * attempt (2F8EA9D6...) THORNode's `/tx/` returns "doesn't exist" for, so
 * only Midgard's `metadata.failed.memo` carries the original intent at all.
 *
 * Precedence (first present wins). THORNode is the freshness source
 * (pending stages, streaming status, scheduled outbounds), Midgard is the
 * durability source — so THORNode's raw memo is preferred whenever present
 * (it's also the more literal one; Midgard's own memo field is sometimes
 * post-processed, e.g. an abbreviated memo gets expanded), and its absence
 * is never treated as "this tx has no memo":
 *   1. THORNode tx detail   (thorTx.tx.tx.memo)      -- canonical
 *   2. THORNode tx status   (thorStatus.tx.memo)     -- early-inbound tx,
 *      before the detail endpoint is populated
 *   3. Midgard action metadata -- the first `.memo` string found on any key
 *      of the first action's `metadata` object (swap/refund/send/failed/...)
 *   4. Synthesized `{ type }` from Midgard's own `action.type`, for whenever
 *      case 3 finds no raw memo string at all (donate's `metadata` is
 *      always `{}`, and any other type could just as well be pruned from
 *      THORNode with unusual/absent metadata on a given tx) — general
 *      fallback across every Midgard action type, not a donate-only patch;
 *      donate is simply the only one confirmed so far to actually need it,
 *      since every other type's metadata does carry its own `.memo` today.
 *
 * Callers that need to know how "real" the parsed memo is (e.g. to degrade
 * a field-heavy render gracefully rather than show blanks) can branch on
 * `source` — 'synthesized' only ever carries `.type`, nothing else.
 *
 * @param {{thorTx: object, thorStatus: object, midgardAction: object}} sources
 * @param {{parseMemo: (memo: string) => object}} ctx
 * @returns {{memo: object, source: 'thornode'|'thorstatus'|'midgard'|'synthesized'}}
 */

// Every Midgard `action.type` value that has a corresponding memoToType
// vocabulary word (utils/index.js), so case 4 above degrades gracefully no
// matter which type shows up with empty/memo-less metadata — not limited to
// the one case (donate) that's actually been observed needing it.
// Deliberately excludes:
//   - 'send' -- not a memoToType word at all; a native send is identified
//     upstream (fetchTx) by Midgard type 'send' + an *unparseable* memo,
//     and sendOverview reads the raw Midgard action directly, never
//     memo.type -- synthesizing one here would just be dead weight.
//   - 'failed' -- routed by action outcome before memo-type dispatch ever
//     runs (see createTxState's failedAction check), and case 3 above
//     already recovers the *attempted* type (e.g. 'bond') from
//     metadata.failed.memo when present -- synthesizing 'failed' itself
//     isn't a real memo type and would never match anything.
//   - 'contract' -- handled entirely by appendContractCards, outside the
//     memo.type/BUILDERS dispatch this resolver feeds.
const ACTION_TYPE_TO_MEMO_TYPE = {
  swap: 'swap',
  addLiquidity: 'add',
  withdraw: 'withdraw',
  donate: 'donate',
  refund: 'refund',
  switch: 'switch',
  thorname: 'thorname',
}

export function resolveTxMemo({ thorTx, thorStatus, midgardAction }, ctx) {
  const thorTxMemo = thorTx?.tx?.tx?.memo
  if (thorTxMemo) {
    return { memo: ctx.parseMemo(thorTxMemo), source: 'thornode' }
  }

  const thorStatusMemo = thorStatus?.tx?.memo
  if (thorStatusMemo) {
    return { memo: ctx.parseMemo(thorStatusMemo), source: 'thorstatus' }
  }

  const action = midgardAction?.actions?.[0]
  const metadata = action?.metadata || {}
  const midgardMemo = Object.keys(metadata)
    .map((key) => metadata[key]?.memo)
    .find(Boolean)
  if (midgardMemo) {
    return { memo: ctx.parseMemo(midgardMemo), source: 'midgard' }
  }

  const synthesizedType = ACTION_TYPE_TO_MEMO_TYPE[action?.type]
  return {
    memo: synthesizedType ? { type: synthesizedType } : {},
    source: 'synthesized',
  }
}
