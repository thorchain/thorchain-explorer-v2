import moment from 'moment'
import { toAttrs } from './shared.js'
import { assetFromString, securedToAsset } from '~/utils'
import { getRujiraContractLabel } from '~/utils/rujiraContracts'

// A Liquidy market order is routed by `thor1efrmw…` and can be split across
// several MsgExecuteContract messages in one tx — each one a separate
// Midgard `contract` action taking its own route to the same output asset.
// Midgard additionally surfaces the FIN book's own virtualisation fill (the
// `rujira-thorchain-swap` contract hitting a THORChain pool) as a top-level
// `swap` action, whose in/out are the strategy contract's internal leg, not
// the user's.
//
// Both facts break the single-action products: contractOverview's
// ctx.singleAction is null once there is more than one contract action, so
// buildFinMarketSwapOverview never runs, and swapOverview then wins the
// hero and renders that internal leg as if it were the trade. On
// A8F75D0EAEF4D79D43AC06F30A2F454C70B42220D143FB8922B682F631C2A482 that
// showed 0.00109361 BTC -> 94.23 USDC (one route's funding hop) instead of
// the 0.00136701 BTC -> 1182.93 LQDY the user actually traded.
//
// So aggregate across every contract action and read the amounts off the
// `wasm-liquidy-swap/swap` events, which the router emits once per leg with
// the user-facing input/output already resolved — no inference from
// coin_spent/coin_received routing hops, which double-count the
// intermediate USDC.
const ROUTE_PRODUCT = 'Liquidy'

function denomToAssetStr(denom) {
  if (!denom) return ''
  return denom === 'rune' ? 'THOR.RUNE' : securedToAsset(denom).toUpperCase()
}

// Parses the raw denom first so `secure: true` survives for the badge, and
// falls back to the dot-delimited form for everything else — same order
// finMarketSwap.js uses.
function describeDenom(denom) {
  const assetStr = denomToAssetStr(denom)
  const parsed = denom
    ? (assetFromString(denom.toUpperCase()) ?? assetFromString(assetStr))
    : null
  return { assetStr, parsed, ticker: parsed?.ticker || denom || '' }
}

function largestDenom(byDenom) {
  return Object.entries(byDenom).sort((a, b) => b[1] - a[1])[0] || ['', 0]
}

export function buildLiquidyMarketSwapOverview(ctx) {
  const legs = ctx.contractActions
    .map((action) => {
      const events = action.metadata?.contract?.contractEvents || []
      const swaps = events
        .filter((e) => e.type === 'wasm-liquidy-swap/swap')
        .map(toAttrs)
      const trades = events.filter((e) => e.type === 'wasm-rujira-fin/trade')
      return {
        action,
        events,
        swaps,
        tradeCount: trades.length,
        pairAddresses: [
          ...new Set(trades.map((e) => toAttrs(e)._contract_address)),
        ].filter(Boolean),
        viaThorchain: events.some(
          (e) => e.type === 'wasm-rujira-thorchain-swap/swap'
        ),
        fees: events
          .filter((e) => e.type === 'wasm-liquidy-swap/execute')
          .map(toAttrs),
      }
    })
    .filter((leg) => leg.swaps.length > 0)
  if (!legs.length) return null

  const inputsByDenom = {}
  const outputsByDenom = {}
  let recipient = ''
  legs.forEach((leg) => {
    leg.swaps.forEach((s) => {
      const inAmt = parseInt(s.input_amount) || 0
      const outAmt = parseInt(s.output_amount) || 0
      if (s.input_denom && inAmt > 0) {
        inputsByDenom[s.input_denom] =
          (inputsByDenom[s.input_denom] || 0) + inAmt
      }
      if (s.output_denom && outAmt > 0) {
        outputsByDenom[s.output_denom] =
          (outputsByDenom[s.output_denom] || 0) + outAmt
      }
      if (!recipient && s.recipient) recipient = s.recipient
    })
  })

  const [inDenom, inAmount] = largestDenom(inputsByDenom)
  const [outDenom, outAmount] = largestDenom(outputsByDenom)
  const input = describeDenom(inDenom)
  const output = describeDenom(outDenom)

  const userAddress = recipient || legs[0].action.in?.[0]?.address || ''
  const routerAddress =
    legs[0].swaps[0]?._contract_address ||
    legs[0].fees[0]?._contract_address ||
    ''

  // Both denoms are 8-decimal base units, so the raw ratio is already the
  // display rate (output per unit of input).
  const rate = inAmount > 0 ? outAmount / inAmount : null
  // Rates here span many orders of magnitude (865,349 LQDY/BTC one way,
  // 1.15e-6 BTC/LQDY the other), so a fixed precision is wrong for one of
  // them — significant digits above 1, full base-unit precision below it.
  const formatRate = (value) =>
    value >= 1
      ? value.toLocaleString('en-US', { maximumFractionDigits: 4 })
      : value.toFixed(8)

  // Only price the sides the pool list actually covers — an app-layer token
  // such as THOR.LQDY has no pool, and amountToUSD returns NaN for it, which
  // formatUsdValue would render as a confident "$0".
  const usdOrNull = (assetStr, amount) => {
    if (!assetStr || !amount) return null
    const value = ctx.amountToUSD(assetStr, amount, ctx.pools)
    return Number.isFinite(value) && value > 0
      ? ctx.formatUsdValue(value)
      : null
  }

  const feesByDenom = {}
  legs.forEach((leg) => {
    leg.fees.forEach((f) => {
      const denom = f.denom || ''
      if (!denom) return
      const entry = (feesByDenom[denom] = feesByDenom[denom] || {
        platform: 0,
        affiliate: 0,
        referral: 0,
      })
      entry.platform += parseInt(f.platform_fee) || 0
      entry.affiliate += parseInt(f.affiliate_fee) || 0
      entry.referral += parseInt(f.referral_fee) || 0
    })
  })
  const affiliateAddress = legs
    .flatMap((leg) => leg.fees)
    .map((f) => f.affiliate)
    .find(Boolean)

  const routeLabels = [
    ...new Set(legs.flatMap((leg) => leg.pairAddresses)),
  ].map((addr) => getRujiraContractLabel(addr) || ctx.formatAddress(addr))
  const totalFills = legs.reduce((sum, leg) => sum + leg.tradeCount, 0)

  const hasError = ctx.contractActions.some(
    (a) => (a.metadata?.contract?.code ?? 0) > 0
  )
  const logs = ctx.contractActions.find(
    (a) => (a.metadata?.contract?.code ?? 0) > 0
  )?.metadata?.contract?.logs
  const status = hasError
    ? { label: 'Failed', tone: 'red' }
    : ctx.contractActions.every((a) => a.status === 'success')
      ? { label: 'Success', tone: 'green' }
      : { label: 'Pending', tone: 'blue' }

  const date = legs[0].action.date
  const timestamp = date ? moment.unix(parseInt(date) / 1e9) : null
  const height = parseInt(legs[0].action.height)

  const legRow = (leg, index) => {
    const legIn = leg.swaps.reduce(
      (s, x) => s + (parseInt(x.input_amount) || 0),
      0
    )
    const legOut = leg.swaps.reduce(
      (s, x) => s + (parseInt(x.output_amount) || 0),
      0
    )
    const venue = leg.pairAddresses
      .map((addr) => getRujiraContractLabel(addr) || ctx.formatAddress(addr))
      .join(' → ')
    return {
      icon: 'ArrowIcon',
      iconRotate: 0,
      title: `Route ${index + 1}: ${ctx.baseAmountFormatOrZero(legIn)} ${input.ticker} → ${ctx.baseAmountFormatOrZero(legOut)} ${output.ticker}`,
      body: [
        venue,
        leg.viaThorchain ? 'filled via THORChain pool' : null,
        leg.tradeCount ? `${leg.tradeCount} fills` : null,
      ]
        .filter(Boolean)
        .join(' · '),
    }
  }

  return {
    rawEvents: legs.flatMap((leg) => leg.events),
    rawMsg: legs[0].action.metadata?.contract?.msg || null,
    title: `Market Order: ${ROUTE_PRODUCT}`,
    metaLabel: `Market Order · ${ROUTE_PRODUCT}`,
    status,
    affiliateAddress: affiliateAddress || '',
    actionTypeTitle: 'contract',
    hasContractAction: true,
    priority: true,
    labels: legs.length > 1 ? [`${legs.length} Routes`] : [],
    input: {
      asset: input.parsed ? input.assetStr : null,
      name: input.ticker || 'Input',
      badge: ctx.getNetworkBadge(input.parsed) || '',
      amount: inAmount
        ? `${ctx.baseAmountFormatOrZero(inAmount)} ${input.ticker}`
        : '-',
      usd: usdOrNull(input.assetStr, inAmount),
      secure: input.parsed?.secure ?? false,
    },
    output: {
      asset: output.parsed ? output.assetStr : null,
      name: output.ticker || ROUTE_PRODUCT,
      badge: ctx.getNetworkBadge(output.parsed) || ROUTE_PRODUCT,
      amount: outAmount
        ? `${ctx.baseAmountFormatOrZero(outAmount)} ${output.ticker}`
        : '-',
      usd: usdOrNull(output.assetStr, outAmount),
      secure: output.parsed?.secure ?? false,
    },
    returnedOutput: null,
    metricRows: [
      rate
        ? {
            label: 'Rate',
            value: `${formatRate(rate)} ${output.ticker}/${input.ticker}`,
          }
        : null,
      legs.length > 1 ? { label: 'Routes', value: String(legs.length) } : null,
      totalFills ? { label: 'Fills', value: String(totalFills) } : null,
      timestamp
        ? { label: 'Time', value: timestamp.format('YYYY-MM-DD HH:mm:ss') }
        : null,
    ].filter(Boolean),
    detailRows: [
      {
        label: 'Product',
        value: ROUTE_PRODUCT,
        tone: ctx.getProductTone(ROUTE_PRODUCT),
        type: 'product',
      },
      {
        label: 'Action',
        value: 'Market Order',
        tone: ctx.getContractTypeTone('Market Order'),
        type: 'product',
      },
      routerAddress
        ? { label: 'Router', address: routerAddress, type: 'address' }
        : null,
      routeLabels.length
        ? { label: 'Route', value: routeLabels.join(', ') }
        : null,
      { label: 'Status', value: status.label, type: 'status' },
      timestamp ? { label: 'Time', value: timestamp.format('lll') } : null,
      height ? { label: 'Block', value: `#${ctx.normalFormat(height)}` } : null,
      userAddress
        ? { label: 'User', address: userAddress, type: 'address' }
        : null,
    ].filter(Boolean),
    lifecycleRows: hasError
      ? [
          {
            icon: 'WarningIcon',
            title: 'Contract execution failed',
            body: logs || '',
          },
        ]
      : [
          {
            icon: 'CheckIcon',
            title:
              legs.length > 1
                ? `Market order filled across ${legs.length} routes`
                : 'Market order filled',
            body: [
              inAmount
                ? `${ctx.baseAmountFormatOrZero(inAmount)} ${input.ticker} in`
                : null,
              outAmount
                ? `${ctx.baseAmountFormatOrZero(outAmount)} ${output.ticker} out`
                : null,
            ]
              .filter(Boolean)
              .join(' · '),
          },
          ...legs.map(legRow),
          userAddress && outAmount
            ? {
                icon: 'ArrowIcon',
                iconRotate: 0,
                title: `${ctx.baseAmountFormatOrZero(outAmount)} ${output.ticker} received`,
                body: `Delivered to ${ctx.formatAddress(userAddress)}`,
              }
            : null,
        ].filter(Boolean),
    feeRows: Object.entries(feesByDenom).flatMap(([denom, entry]) => {
      const { assetStr, ticker } = describeDenom(denom)
      return [
        ['Platform Fee', entry.platform],
        ['Affiliate Fee', entry.affiliate],
        ['Referral Fee', entry.referral],
      ]
        .filter(([, amount]) => amount > 0)
        .map(([label, amount]) => {
          const usd = usdOrNull(assetStr, amount)
          const amountStr = `${ctx.baseAmountFormatOrZero(amount)} ${ticker}`
          return usd
            ? { label, usd, subtle: amountStr }
            : { label, usd: amountStr, subtle: null }
        })
    }),
    technicalRows: [
      userAddress
        ? ctx.buildTechRow('From address', userAddress, 'address')
        : null,
      routerAddress
        ? ctx.buildTechRow('Router address', routerAddress, 'address')
        : null,
    ].filter(Boolean),
  }
}
