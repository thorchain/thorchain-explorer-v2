/**
 * Repairs a Midgard swap action whose input side was taken from the wrong
 * swap event. When an affiliate fee is skimmed from the swap's *output* and
 * swapped to the affiliate's preferred asset, THORNode emits a second
 * `swap` event under the same tx id (e.g. F03BBA1C…: 1030 RUNE -> ETH, then
 * the 45 bps ETH fee -> RUNE with its own `=:THOR.RUNE:<affiliate>` memo).
 * Midgard's swap_actions view pairs events by tx id alone, so the action
 * can come back with the affiliate swap's `in` coin, memo and
 * inPriceUSD/outPriceUSD — the page then renders the swap backwards and
 * prices the real input at the output asset's USD price.
 *
 * THORNode's inbound tx is authoritative for what the user actually sent,
 * so when both the memo and the input asset disagree with it, the input,
 * memo-derived fields and prices are rebuilt from it. Prices are re-mapped
 * by asset from the prices Midgard did report; any side that can't be
 * matched is dropped so callers fall back to pool pricing.
 *
 * @param {object} midgardAction Midgard `actions?txid=` response.
 * @param {object} inboundTx THORNode inbound tx (`tx/details` .tx.tx or
 *   `tx/status` .tx) — needs id, coins and memo.
 * @returns {object} The same response, with affected swap actions replaced.
 */
export function repairSwapAction(midgardAction, inboundTx) {
  const actions = midgardAction?.actions
  const inCoin = inboundTx?.coins?.[0]
  const inMemo = inboundTx?.memo
  if (!actions?.length || !inCoin?.asset || !inMemo) return midgardAction

  const upper = (s) => String(s ?? '').toUpperCase()
  const repaired = actions.map((action) => {
    const metaKey =
      action.type === 'swap'
        ? 'swap'
        : action.type === 'limit_swap'
          ? 'limit_swap'
          : null
    const meta = metaKey && action.metadata?.[metaKey]
    const actionIn = action.in?.[0]
    const actionCoin = actionIn?.coins?.[0]
    if (
      !meta?.memo ||
      !actionCoin ||
      upper(actionIn.txID) !== upper(inboundTx.id) ||
      meta.memo === inMemo ||
      upper(actionCoin.asset) === upper(inCoin.asset)
    ) {
      return action
    }

    // Prices Midgard reported belong to the wrong swap's input asset and
    // its memo target asset.
    const priceByAsset = {
      [upper(actionCoin.asset)]: meta.inPriceUSD,
      [upper(meta.memo.split(':')[1])]: meta.outPriceUSD,
    }
    // Not every Midgard flags the affiliate payout (`affiliate: true`), so
    // the output is the first non-affiliate coin that isn't the input
    // asset; failing that, the fee was skimmed from the output, so the
    // misattributed input asset is the output asset.
    const outAsset =
      action.out
        ?.filter((o) => !o.affiliate)
        .flatMap((o) => o.coins ?? [])
        .find((c) => upper(c.asset) !== upper(inCoin.asset))?.asset ??
      actionCoin.asset
    const newMeta = { ...meta, memo: inMemo }
    delete newMeta.inPriceUSD
    delete newMeta.outPriceUSD
    const inPrice = priceByAsset[upper(inCoin.asset)]
    const outPrice = outAsset && priceByAsset[upper(outAsset)]
    if (inPrice) newMeta.inPriceUSD = inPrice
    if (outPrice) newMeta.outPriceUSD = outPrice

    // Same memo fields Midgard parses: =:ASSET:DEST:LIM:AFF:BPS
    const parts = inMemo.split(':')
    if (['=', 's', 'SWAP'].includes(parts[0])) {
      const limit = parts[3]?.split('/')[0]
      if (/^\d+$/.test(limit ?? '')) newMeta.swapTarget = limit
      if (parts[4]) newMeta.affiliateAddress = parts[4]
      if (/^\d{1,5}$/.test(parts[5] ?? '')) newMeta.affiliateFee = parts[5]
    }

    return {
      ...action,
      in: [
        {
          ...actionIn,
          coins: [{ asset: inCoin.asset, amount: String(inCoin.amount) }],
        },
        ...action.in.slice(1),
      ],
      metadata: { ...action.metadata, [metaKey]: newMeta },
    }
  })

  return { ...midgardAction, actions: repaired }
}
