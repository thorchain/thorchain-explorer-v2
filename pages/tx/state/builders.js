import moment from 'moment'

/**
 * Builders produce { cards, accordions } for the tx page.
 * Each receives (thorStatus, actions, thorTx, memo, ctx).
 * ctx: { parseMemo, parseMemoAsset, pools, thorHeight, blockSeconds, camelCase, isTxInPending, setHeight, quote }
 */

export function createThornameState(thorStatus, action, thorTx, _memo, _ctx) {
  const act = action.actions[0]
  const timeStamp = moment.unix(act?.date / 1e9)

  const ins = act?.in.map((a) => ({
    txid: a?.txID,
    from: a?.address,
    icon: require('@/assets/images/wallet.svg?inline'),
    address: act.metadata?.thorname?.address,
    done: true,
  }))

  const outs = act?.in.map(() => ({
    icon: require('@/assets/images/name.svg?inline'),
    text: act.metadata?.thorname?.thorname,
    class: 'pad-icon',
  }))

  return {
    cards: {
      title: 'THORName',
      in: ins,
      middle: { pending: false },
      out: outs,
    },
    accordions: {
      in: ins,
      action: {
        type: 'THORName',
        memo: act.metadata?.thorname?.memo,
        expire: act.metadata?.thorname?.expire,
        thorname: act.metadata?.thorname?.thorname,
        owner: act.metadata?.thorname?.owner,
        registrationFee: act.metadata?.thorname?.registrationFee,
        address: act.metadata?.thorname?.address,
        height: act?.height,
        timeStamp,
        done: true,
      },
      out: [],
    },
  }
}

export function createFailedState(thorStatus, action, thorTx, _memo, ctx) {
  const act = action.actions[0]
  const timeStamp = moment.unix(act?.date / 1e9)
  const { type } = ctx.parseMemo(act?.metadata?.failed?.memo)

  const ins = act?.in.map((a) => ({
    asset: ctx.parseMemoAsset(a.coins[0]?.asset ?? 'THOR.RUNE', ctx.pools),
    amount: a.coins[0]?.amount ?? 0,
    txid: a?.txID,
    from: a?.address,
    gas: thorStatus?.tx?.gas ? thorStatus?.tx?.gas[0].amount : null,
    gasAsset: thorStatus?.tx?.gas
      ? ctx.parseMemoAsset(thorStatus?.tx?.gas[0].asset, ctx.pools)
      : null,
    done: true,
  }))

  return {
    cards: {
      title: type,
      in: ins,
      middle: { pending: false, fail: true },
      out: [],
    },
    accordions: {
      in: ins,
      action: {
        type,
        memo: act.metadata?.failed?.memo,
        reason: act.metadata?.failed?.reason,
        code: act.metadata?.failed?.code,
        height: act?.height,
        timeStamp,
        done: true,
        error: true,
      },
      out: [],
    },
  }
}

/**
 * Registry: memo.type or special key -> builder function.
 * Page uses this for thorname and failed; other types stay in page.
 */
export const BUILDERS = {
  thorname: createThornameState,
  failed: createFailedState,
}
