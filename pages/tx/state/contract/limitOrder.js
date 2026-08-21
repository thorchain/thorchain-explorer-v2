import moment from 'moment'
import { toAttrs } from './shared.js'
import { assetFromString, securedToAsset } from '~/utils'
import {
  getRujiraContractEntry,
  getRujiraContractLabel,
  getRujiraContractProduct,
} from '~/utils/rujiraContracts'

// Limit order placement / scale order: single contract action with msg.order.
export function buildLimitOrderOverview(ctx) {
  const limitOrderMsg = ctx.singleAction?.metadata?.contract?.msg?.order
  if (!limitOrderMsg) return null

  const action = ctx.singleAction
  const orders = limitOrderMsg[0] || []
  const contractAddress = action.out?.[0]?.address || ''
  const contractLabel =
    getRujiraContractLabel(contractAddress) ||
    ctx.formatAddress(contractAddress)
  const userAddress = action.in?.[0]?.address || ''
  const hasError = (action.metadata?.contract?.code ?? 0) > 0
  const logs = action.metadata?.contract?.logs
  const status = hasError
    ? { label: 'Failed', tone: 'red' }
    : action.status === 'success'
      ? { label: 'Success', tone: 'green' }
      : { label: 'Pending', tone: 'blue' }
  const date = action.date
  const timestamp = date ? moment.unix(parseInt(date) / 1e9) : null
  const height = parseInt(action.height)
  const orderCount = orders.length
  const prices = orders
    .map(([, priceSpec]) => parseFloat(priceSpec?.fixed))
    .filter((p) => !isNaN(p))
  const priceList = prices.map((p) => p.toFixed(2)).join(', ')
  const productLabel = getRujiraContractProduct(contractAddress) || 'RUJI Trade'

  // Detect immediate CCL fills on placement
  const events = action.metadata?.contract?.contractEvents || []
  const cclFills = events
    .filter((e) => e.type === 'wasm-rujira-fin/trade')
    .map(toAttrs)
    .filter((a) => String(a.price || '').startsWith('ccl:'))
  const cclFillCount = cclFills.length
  const fillRates = cclFills
    .map((a) => parseFloat(a.rate))
    .filter((r) => !isNaN(r))
  const avgFillRate = fillRates.length
    ? fillRates.reduce((s, r) => s + r, 0) / fillRates.length
    : null

  const titleSuffix = cclFillCount
    ? ` · ${cclFillCount} fill${cclFillCount !== 1 ? 's' : ''} at avg ${avgFillRate.toFixed(2)}`
    : ''
  const allNullQty = orders.every((o) => o[2] === null || o[2] === undefined)
  const orderVerb = allNullQty ? 'claimed' : 'placed'

  // Scale order: multiple limit orders placed in one execution
  const isScaleOrder = orders.length > 1
  const actionLabel = isScaleOrder ? 'Scale Order' : 'Limit Order'

  // Total funds committed (for scale order input card)
  const fundsStr = action.metadata?.contract?.funds || ''
  const fundsAmount = parseInt(fundsStr) || 0
  const fundsDenom = fundsStr.replace(/^\d+/, '').trim()
  const fundsAssetStr = fundsDenom
    ? securedToAsset(fundsDenom).toUpperCase()
    : ''
  const fundsAssetParsed = fundsAssetStr ? assetFromString(fundsAssetStr) : null
  const fundsTicker = fundsAssetParsed?.ticker || fundsDenom

  // Parse pair base/quote assets from registry contractLabel: "rujira-fin:{base}:{quote}"
  const pairEntry = getRujiraContractEntry(contractAddress)
  const pairLabelParts = (pairEntry?.contractLabel || '').split(':')
  const baseDenom = pairLabelParts[1] || ''
  const baseAssetStr = baseDenom ? securedToAsset(baseDenom).toUpperCase() : ''
  const baseAssetParsed = baseAssetStr ? assetFromString(baseAssetStr) : null
  const baseTicker = baseAssetParsed?.ticker || baseDenom
  const quoteDenom = pairLabelParts[2] || ''
  const quoteAssetStr =
    (quoteDenom ? securedToAsset(quoteDenom).toUpperCase() : '') ||
    fundsAssetStr
  const quoteAssetParsed = quoteAssetStr ? assetFromString(quoteAssetStr) : null
  const quoteTicker = quoteAssetParsed?.ticker || quoteDenom || fundsTicker

  // Per-order table rows + raw totals for scale order display
  // Order format: [side_string, { fixed: price }, amount_string_or_null]
  //   side: "quote" = Buy (spend quote to get base), "base" = Sell (spend base to get quote)
  //   amount: null = no-op (existing order kept), "0" = retract, positive = new order
  let totalReturnRaw = 0
  let orderSideIsBuy = true
  const orderRows = isScaleOrder
    ? orders.map((order) => {
        const sideStr = order[0] // "quote" or "base"
        const priceSpec = order[1] // { fixed: "2327.4" }
        const isKeep = order[2] === null || order[2] === undefined
        const amount = isKeep ? 0 : parseInt(order[2]) || 0
        const price = parseFloat(priceSpec?.fixed) || 0
        const isBuy = sideStr === 'quote'
        const isRetract = !isKeep && amount === 0

        // Return = what you receive when fully filled
        // Buy: spent quote, receive base → ret = amount / price (base units)
        // Sell: spent base, receive quote → ret = amount * price (quote units)
        let ret = 0
        if (!isRetract && !isKeep && price > 0) {
          ret = isBuy ? Math.round(amount / price) : Math.round(amount * price)
          totalReturnRaw += ret
          orderSideIsBuy = isBuy
        } else if (isBuy !== undefined) {
          orderSideIsBuy = isBuy
        }

        return {
          op: isRetract ? 'Retract' : isKeep ? 'Keep' : 'Create',
          side: isBuy ? 'Buy' : 'Sell',
          price: price > 0 ? price.toFixed(2) : '—',
          amount:
            isRetract || isKeep ? '—' : ctx.baseAmountFormatOrZero(amount),
          ret: ret > 0 ? ctx.baseAmountFormatOrZero(ret) : '—',
          amountRaw: amount,
        }
      })
    : []

  // Compute depth % for order book bar (relative to largest order)
  if (orderRows.length) {
    const maxAmt = Math.max(...orderRows.map((r) => r.amountRaw || 0))
    orderRows.forEach((r) => {
      r.depth = maxAmt > 0 ? Math.round(((r.amountRaw || 0) / maxAmt) * 100) : 0
    })
  }

  // coin_received by sender for non-scale (immediate CCL fills)
  const limitReceivedByDenom = {}
  if (!isScaleOrder && userAddress) {
    events
      .filter((e) => e.type === 'coin_received')
      .map(toAttrs)
      .filter((a) => a.receiver === userAddress && a.amount)
      .forEach((a) => {
        a.amount.split(',').forEach((part) => {
          const p = part.trim()
          const amt = parseInt(p) || 0
          const denom = p.replace(/^\d+/, '').trim()
          if (denom && denom !== fundsDenom && amt > 0)
            limitReceivedByDenom[denom] =
              (limitReceivedByDenom[denom] || 0) + amt
        })
      })
  }
  const limitRecvDenom = Object.keys(limitReceivedByDenom)[0] || ''
  const limitRecvAmt = limitReceivedByDenom[limitRecvDenom] || 0
  const limitRecvAssetStr =
    limitRecvDenom === 'rune'
      ? 'THOR.RUNE'
      : limitRecvDenom
        ? securedToAsset(limitRecvDenom).toUpperCase()
        : ''
  const limitRecvAssetParsed = limitRecvAssetStr
    ? assetFromString(limitRecvAssetStr)
    : null
  const limitRecvTicker = limitRecvAssetParsed?.ticker || limitRecvDenom

  // Swap-style input/output for scale orders
  // Buy orders: user spends quote (USDC), receives base (ETH) on fill
  // Sell orders: user spends base (ETH), receives quote (USDC) on fill
  const scaleInAssetStr = orderSideIsBuy ? quoteAssetStr : baseAssetStr
  const scaleInAsset = orderSideIsBuy ? quoteAssetParsed : baseAssetParsed
  const scaleInTicker = orderSideIsBuy ? quoteTicker : baseTicker
  const scaleOutAssetStr = orderSideIsBuy ? baseAssetStr : quoteAssetStr
  const scaleOutAsset = orderSideIsBuy ? baseAssetParsed : quoteAssetParsed
  const scaleOutTicker = orderSideIsBuy ? baseTicker : quoteTicker

  return {
    rawEvents: events,
    rawMsg: action?.metadata?.contract?.msg || null,
    orderRows: isScaleOrder ? orderRows : [],
    orderPairTickers: isScaleOrder
      ? { base: baseTicker, quote: quoteTicker, isBuy: orderSideIsBuy }
      : null,
    title: isScaleOrder
      ? `Scale Order: ${orderCount} orders on ${contractLabel}${titleSuffix}`
      : `${orderCount} Limit Order${orderCount !== 1 ? 's' : ''} ${orderVerb} on ${contractLabel}${titleSuffix}`,
    metaLabel: `${actionLabel} · ${contractLabel}`,
    status,
    affiliateAddress: '',
    actionTypeTitle: 'contract',
    hasContractAction: true,
    labels: [],
    pairDisplay:
      (isScaleOrder && !fundsAmount) ||
      (!isScaleOrder && baseAssetParsed && quoteAssetParsed)
        ? {
            baseAsset: baseAssetParsed,
            quoteAsset: quoteAssetParsed,
            label: `${baseTicker} / ${quoteTicker}`,
            sublabel: contractLabel,
            inputAmount:
              !isScaleOrder && fundsAmount
                ? `${ctx.baseAmountFormatOrZero(fundsAmount)} ${fundsTicker}`
                : null,
          }
        : null,
    input: isScaleOrder
      ? {
          asset: scaleInAssetStr || null,
          name: scaleInTicker || contractLabel,
          badge: ctx.getNetworkBadge(scaleInAsset) || '',
          amount: fundsAmount
            ? `${ctx.baseAmountFormatOrZero(fundsAmount)} ${scaleInTicker}`
            : '-',
          usd: ctx.formatUsdValue(
            ctx.amountToUSD(scaleInAssetStr, fundsAmount, ctx.pools)
          ),
        }
      : fundsAmount
        ? {
            asset: fundsAssetStr || null,
            name: fundsTicker || 'User',
            badge: ctx.getNetworkBadge(fundsAssetParsed) || '',
            amount: `${ctx.baseAmountFormatOrZero(fundsAmount)} ${fundsTicker}`,
            usd: ctx.formatUsdValue(
              ctx.amountToUSD(fundsAssetStr, fundsAmount, ctx.pools)
            ),
          }
        : {
            asset: null,
            name: 'User',
            badge: userAddress ? ctx.formatAddress(userAddress) : '',
            amount: `${orderCount} order${orderCount !== 1 ? 's' : ''}`,
            usd: null,
          },
    output: isScaleOrder
      ? {
          asset: scaleOutAssetStr || null,
          name: scaleOutTicker || 'Asset',
          badge: ctx.getNetworkBadge(scaleOutAsset) || '',
          amount: totalReturnRaw
            ? `${ctx.baseAmountFormatOrZero(totalReturnRaw)} ${scaleOutTicker}`
            : '-',
          usd: ctx.formatUsdValue(
            ctx.amountToUSD(scaleOutAssetStr, totalReturnRaw, ctx.pools)
          ),
        }
      : limitRecvAmt
        ? {
            asset: limitRecvAssetStr || null,
            name: limitRecvTicker,
            badge: ctx.getNetworkBadge(limitRecvAssetParsed) || '',
            amount: `${ctx.baseAmountFormatOrZero(limitRecvAmt)} ${limitRecvTicker}`,
            usd: ctx.formatUsdValue(
              ctx.amountToUSD(limitRecvAssetStr, limitRecvAmt, ctx.pools)
            ),
          }
        : {
            asset: null,
            name: 'FIN Pair',
            badge: contractLabel,
            amount: cclFillCount
              ? `${cclFillCount} fill${cclFillCount !== 1 ? 's' : ''} · avg ${avgFillRate.toFixed(2)}`
              : priceList
                ? `At ${priceList}`
                : 'Placed',
            usd: null,
          },
    metricRows: isScaleOrder
      ? [
          cclFillCount
            ? { label: 'Immediate Fills', value: `${cclFillCount}` }
            : null,
          avgFillRate
            ? { label: 'Avg Fill Rate', value: avgFillRate.toFixed(6) }
            : null,
        ].filter(Boolean)
      : [
          { label: 'Orders Placed', value: `${orderCount}` },
          priceList ? { label: 'Limit Prices', value: priceList } : null,
          cclFillCount
            ? { label: 'Immediate Fills', value: `${cclFillCount}` }
            : null,
          avgFillRate
            ? { label: 'Avg Fill Rate', value: avgFillRate.toFixed(6) }
            : null,
          timestamp
            ? { label: 'Time', value: timestamp.format('YYYY-MM-DD HH:mm:ss') }
            : null,
        ].filter(Boolean),
    detailRows: [
      {
        label: 'Product',
        value: productLabel,
        tone: ctx.getProductTone(productLabel),
        type: 'product',
      },
      {
        label: 'Action',
        value: actionLabel,
        tone: ctx.getContractTypeTone(actionLabel),
        type: 'product',
      },
      { label: 'Contract', value: contractLabel },
      { label: 'Status', value: status.label, type: 'status' },
      !isScaleOrder && timestamp
        ? { label: 'Time', value: timestamp.format('lll') }
        : null,
      height ? { label: 'Block', value: `#${ctx.normalFormat(height)}` } : null,
      userAddress
        ? { label: 'User', address: userAddress, type: 'address' }
        : null,
    ].filter(Boolean),
    lifecycleRows: [
      {
        icon: 'CheckIcon',
        title: isScaleOrder
          ? `Scale Order: ${orderCount} orders submitted`
          : `${orderCount} limit order${orderCount !== 1 ? 's' : ''} submitted`,
        body: priceList ? `Fixed prices: ${priceList}` : '',
      },
      ...ctx.extractContractEventRows(action),
      ...(hasError && logs
        ? [
            {
              icon: 'WarningIcon',
              title: 'Contract execution failed',
              body: logs,
            },
          ]
        : []),
    ],
    feeRows: [],
    technicalRows: [
      userAddress
        ? ctx.buildTechRow('From address', userAddress, 'address')
        : null,
      contractAddress
        ? ctx.buildTechRow('To address', contractAddress, 'address')
        : null,
    ].filter(Boolean),
  }
}
