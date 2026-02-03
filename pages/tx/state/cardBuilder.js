import moment from 'moment'
import { isInternalTx } from '~/utils'

/**
 * Build card details (title, overall in/middle/out) from cardBase.
 * @param {Object} cardBase - { title, in, middle, out }
 * @param {Object} ctx - context with amountToUSD, pools
 */
export function buildCardDetails(cardBase, ctx) {
  return {
    title: cardBase.title,
    overall: {
      in: cardBase.in?.map((a) => ({
        asset: a?.asset,
        amount: a?.amount,
        amountUSD:
          a?.amountUSD ?? ctx.amountToUSD(a?.asset, a?.amount, ctx.pools),
        filter: a?.filter,
        text: a?.text,
        icon: a?.icon,
        address: a?.address,
        class: a?.class,
      })),
      middle: {
        pending: cardBase.middle?.pending,
        send: cardBase.middle?.send ?? false,
        fail: cardBase.middle?.fail ?? false,
        refund: cardBase.middle?.refund ?? false,
      },
      out: cardBase.out?.map((a) => ({
        asset: a?.asset,
        amount: a?.amount,
        amountUSD:
          a?.amountUSD ?? ctx.amountToUSD(a?.asset, a?.amount, ctx.pools),
        text: a?.text,
        icon: a?.icon,
        address: a?.address,
        borderColor: a?.borderColor,
        filter: a?.filter,
        class: a?.class,
      })),
    },
  }
}

/**
 * Build inbound accordions from accordions.in array.
 */
export function buildInboundAccordions(accordionsIn, ctx) {
  if (!accordionsIn) return []
  const result = []
  accordionsIn.forEach((a, i) => {
    const inboundStages = ctx.getInboundStages(a)
    result.push({
      name: `accordion-in-${i}`,
      data: {
        title: a?.type ?? 'Inbound',
        done: a?.done,
        pending: !a?.done,
        remainingTime: a.confirmationRemainingSeconds,
        stacks: [
          {
            key: 'From',
            value: a?.from,
            is: true,
            asset: a?.asset,
            type: 'address',
            formatter: ctx.formatAddress,
          },
          {
            key: 'Hash',
            value: a?.txid,
            is: true,
            asset: a?.asset,
            type: 'hash',
            formatter: ctx.formatAddress,
          },
          {
            key: 'Pre confirmation Count',
            value: [
              {
                text: `${a.preConfirmationCount} Nodes`,
                class: a.inboundObserved ? 'success' : 'yellow',
              },
            ],
            type: 'bubble',
            is: a.preConfirmationCount > 0,
          },
          {
            key: 'Inbound Confirmation Remaining',
            value: moment
              .duration(a.confirmationRemainingSeconds, 'seconds')
              .humanize(),
            is: a.confirmationRemainingSeconds > 0,
          },
          {
            key: 'Gas',
            value:
              `${a?.gas / 1e8} ${ctx.showAsset(a?.gasAsset)}` +
              (ctx.pools
                ? ` (${ctx.formatCurrency(ctx.amountToUSD(a?.gasAsset, a?.gas, ctx.pools))})`
                : ''),
            is: a?.gas && a?.gasAsset,
          },
          {
            key: 'Timestamp',
            value: `${a.timestamp?.format('L LT')} (${a.timestamp?.fromNow()})`,
            is: a.timestamp && a.timestamp?.isValid(),
          },
          {
            key: 'Block Height',
            value: `${a.height}`,
            is: a?.height,
            formatter: ctx.normalFormat,
          },
          {
            key: 'Inbound Stage',
            value: inboundStages,
            type: 'bubble',
            is: inboundStages.length > 0,
          },
        ],
      },
    })
  })
  return result
}

/**
 * Build the single action accordion.
 */
export function buildActionAccordion(accordionsAction, ctx) {
  if (!accordionsAction) return null

  const action = accordionsAction
  let affiliateOutAmount
  if (action.affiliateOut && action.affiliateOut.length > 0) {
    affiliateOutAmount = action.affiliateOut.reduce(
      (a, b) => a + +b.coins[0].amount,
      0
    )
  }

  let liquidityFeeName = 'Liquidity Fee'
  let totalLiquidityFees = action?.liquidityFee
  if (action.streaming?.count < action.streaming?.quantity) {
    liquidityFeeName = 'Liquidity Fee (est)'
    const one = +action?.liquidityFee / action.streaming?.count
    totalLiquidityFees +=
      one * (+action.streaming?.quantity - +action.streaming?.count)
  }

  const blockDuration = ctx.chainsHeight?.THOR - ctx.height
  const remainingTime =
    (+action?.streaming?.quantity * +action.streaming?.interval -
      blockDuration) *
    6
  const totalTime =
    +action?.streaming?.quantity * +action.streaming?.interval * 6

  const stacks = [
    {
      key: 'Timestamp',
      value: `${action?.timeStamp?.format('L LT')} (${action?.timeStamp?.fromNow()})`,
      is: action?.timeStamp?.isValid(),
    },
    {
      key: 'Quantity',
      value: `${action.streaming?.quantity} Swaps`,
      is: action.streaming?.quantity,
    },
    {
      key: 'Rate',
      value: action.rate,
      is: action.rate && action.rate.length > 0,
      type: 'rate',
    },
    {
      key: 'Stream',
      value: `${action.streaming?.count} / ${action.streaming?.quantity}`,
      is: action.streaming?.count,
    },
    {
      key: 'Interval',
      value: `${moment
        .duration(action.streaming?.interval * 6, 's')
        .as('seconds')} secs (${ctx.pluralize(
        action?.streaming?.interval,
        'Block',
        { includeNumber: true }
      )})`,
      is: action.streaming?.interval,
    },
    {
      key: liquidityFeeName,
      value: `${totalLiquidityFees / 1e8} RUNE (${ctx.formatSmallCurrency(
        totalLiquidityFees * ctx.runePrice
      )})`,
      is: action.liquidityFee,
    },
    {
      key: 'Swap Slip',
      value: `${ctx.percentageFormat(action.swapSlip / 1e4, 2)}`,
      is: action.swapSlip,
    },
    {
      key: 'Interface Fee',
      value: `${affiliateOutAmount / 1e8} RUNE (${ctx.formatSmallCurrency(
        affiliateOutAmount * ctx.runePrice
      )})`,
      is: action.affiliateOut && action.affiliateOut.length > 0,
    },
    {
      key: 'Limit',
      value:
        action.limit > 0
          ? `${action.limit / 1e8} ${ctx.showAsset(action.limitAsset)}`
          : 'No target limit',
      is: action.limit,
    },
    {
      key: 'Liquidity Units',
      value: `${action.liquidityUnits}`,
      is: action.liquidityUnits,
    },
    {
      key: 'Units',
      value: `${action.units}`,
      is: action.units,
    },
    {
      key: 'Affiliate Name',
      value: `${action.affiliateName}`,
      is: action.affiliateName,
    },
    {
      key: 'Affiliate Basis',
      value: `${action.affiliateFee}`,
      is: action.affiliateFee,
    },
    {
      key: 'Block Height',
      value: `${action?.height}`,
      is: action?.height,
      formatter: ctx.normalFormat,
    },
    {
      key: 'Memo',
      value: action?.memo,
      is: action?.memo,
    },
    {
      key: 'Refund Reason',
      value: action?.refundReason,
      is: action?.refundReason,
    },
    {
      key: 'Node Address',
      value: action?.nodeAddress,
      is: action?.nodeAddress,
      type: 'address',
      formatter: ctx.formatAddress,
    },
    {
      key: 'Bond Provider',
      value: action?.provider,
      is: action?.provider,
      type: 'address',
      formatter: ctx.formatAddress,
    },
    {
      key: 'THORName',
      value: action?.thorname,
      is: action?.thorname,
    },
    {
      key: 'Address',
      value: action?.address,
      is: action?.address,
      type: 'address',
      formatter: ctx.formatAddress,
    },
    {
      key: 'Owner',
      value: action?.owner,
      is: action?.owner,
      type: 'address',
      formatter: ctx.formatAddress,
    },
    {
      key: 'Expire',
      value: action?.expire,
      is: action?.expire,
      formatter: ctx.normalFormat,
    },
    {
      key: 'Registration Fee',
      value: `${action?.registrationFee}`,
      is: action?.registrationFee,
    },
    {
      key: 'Reason',
      value: `${action?.reason}`,
      is: action?.reason,
    },
    {
      key: 'Code',
      value: `${action?.code}`,
      is: action?.code,
    },
    {
      key: 'Swap Limit',
      value: `${action?.swapLimit}`,
      is: action?.swapLimit,
    },
    {
      key: 'Swap Expire',
      value: `${action?.ttl} Blocks`,
      is: action?.ttl,
    },
  ]

  if (action?.type === 'send') {
    stacks.push(
      {
        key: 'Hash',
        value: action?.txid,
        is: action?.txid,
        type: 'hash',
        formatter: ctx.formatAddress,
      },
      {
        key: 'From',
        value: action?.from,
        is: action?.from,
        type: 'address',
        formatter: ctx.formatAddress,
      },
      {
        key: 'To',
        value: action?.to,
        is: action?.to,
        type: 'address',
        formatter: ctx.formatAddress,
      },
      {
        key: 'Gas',
        value:
          `${action?.gas / 1e9} ${ctx.showAsset(action?.gasAsset)}` +
          (ctx.pools
            ? ` (${ctx.formatCurrency(ctx.amountToUSD(action?.gasAsset, action?.gas, ctx.pools))})`
            : ''),
        is: action?.gas && action?.gasAsset,
      }
    )
  }

  return {
    name: 'accordion-action',
    data: {
      title: action?.type ?? undefined,
      remainingTime,
      totalTime,
      pending: !action?.done,
      done: action?.done,
      showAtFirst: action?.showAtFirst,
      error: action?.error,
      attributes: action?.attributes,
      stacks,
    },
  }
}

/**
 * Build outbound accordions from accordions.out array.
 */
export function buildOutboundAccordions(accordionsOut, ctx) {
  if (!accordionsOut) return []
  const result = []
  const showAssets = accordionsOut.length > 1

  accordionsOut.forEach((a, i) => {
    const outboundStages = ctx.getOutboundStages(a)
    let delay = 0
    if (a.outboundETA > ctx.chainsHeight?.THOR) {
      delay =
        ctx.blockSeconds('THOR') * (+a.outboundETA - +ctx.chainsHeight?.THOR)
    }
    if (delay === 0) {
      delay = a.outboundDelayRemaining
    }

    const accordionOut = {
      name: `accordion-out-${i}`,
      data: {
        title: 'Outbound',
        done: a.done,
        pending: !a?.done,
        remainingTime: delay,
        totalTime: delay,
        asset: showAssets ? a?.asset : undefined,
        hide: a.hide,
        stacks: [
          {
            key: 'Destination',
            value: a?.to,
            is: a?.to,
            asset: a?.asset,
            type: 'address',
            formatter: ctx.formatAddress,
          },
          {
            key: 'Hash',
            value: a?.txid,
            is: !isInternalTx(a?.txid),
            asset: a?.asset,
            type: 'hash',
            formatter: ctx.formatAddress,
          },
          {
            key: 'Executed at',
            value: a.height,
            formatter: ctx.normalFormat,
            is: a.height,
          },
          {
            key: 'Gas',
            value: `${ctx.baseAmountFormatOrZero(a.gas)} ${ctx.showAsset(a.gasAsset)} (${ctx.formatCurrency(
              ctx.amountToUSD(a?.gasAsset, a?.gas, ctx.pools)
            )})`,
            is: a.fees?.length === 0 && a?.gas && a?.gasAsset,
          },
          {
            key: 'Outbound Est.',
            value: moment
              .duration(
                ctx.blockSeconds('THOR') *
                  (+ctx.chainsHeight?.THOR - +a.outboundETA),
                'seconds'
              )
              .humanize(),
            is: a.outboundETA > ctx.chainsHeight?.THOR,
          },
          {
            key: 'Outbound Delay Est.',
            value: moment
              .duration(a.outboundDelayRemaining, 'seconds')
              .humanize(),
            is: a.outboundDelayRemaining,
          },
          {
            key: 'Outbound Delay Est.',
            value: [
              {
                text: 'Scheduled Passed',
                class: 'danger',
              },
            ],
            type: 'bubble',
            is: a.outboundETA > 0 && a.outboundETA < ctx.chainsHeight?.THOR,
          },
          {
            key: 'Outbound Stage',
            value: outboundStages,
            type: 'bubble',
            is: outboundStages.length > 0,
          },
        ],
      },
    }

    if (a.fees?.length > 0) {
      accordionOut.data.stacks.push(
        ...a.fees.map((f, j) => ({
          key: 'Outbound Fee',
          value:
            `${f / 1e8} ${ctx.showAsset(a.feeAssets[j])}` +
            (ctx.pools
              ? ` (${ctx.formatCurrency(
                  ctx.amountToUSD(a.feeAssets[j], f, ctx.pools)
                )})`
              : ''),
          is: f,
        }))
      )
    }
    result.push(accordionOut)
  })
  return result
}

/**
 * Build events accordion if present.
 */
export function buildEventsAccordion(accordionsEvents) {
  if (!accordionsEvents) return null
  return {
    name: 'accordion-events',
    data: {
      title: 'Events',
      events: accordionsEvents,
      pending: false,
      done: true,
      error: false,
    },
  }
}

/**
 * Compose full card from cardBase and accordions using context.
 * @param {Object} cardBase - { title, in, middle, out }
 * @param {Object} accordions - { in, action, events, out }
 * @param {Object} ctx - context with all formatters and getters
 * @returns {Object} { details, accordions } for tx-card
 */
export function createCard(cardBase, accordions, ctx) {
  if (!accordions) {
    return undefined
  }

  const details = buildCardDetails(cardBase, ctx)
  const accordionsList = []

  const inAccordions = buildInboundAccordions(accordions.in, ctx)
  accordionsList.push(...inAccordions)

  const actionAccordion = buildActionAccordion(accordions.action, ctx)
  if (actionAccordion) {
    if (accordions.action?.affiliateName) {
      details.interface = accordions.action.affiliateName
    } else {
      details.interface = ''
    }
    accordionsList.push(actionAccordion)
  }

  const eventsAccordion = buildEventsAccordion(accordions?.events)
  if (eventsAccordion) {
    accordionsList.push(eventsAccordion)
  }

  const outAccordions = buildOutboundAccordions(accordions.out, ctx)
  accordionsList.push(...outAccordions)

  return {
    details,
    accordions: accordionsList,
  }
}
