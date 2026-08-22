import moment from 'moment'
import { toAttrs } from './shared.js'
import { assetFromString, securedToAsset } from '~/utils'
import {
  getRujiraContractLabel,
  getRujiraContractProduct,
} from '~/utils/rujiraContracts'

// FIN market swap: single contract action with msg.swap, or detected via
// wasm-rujira-fin/trade events when msg is absent from the API response.
export function buildFinMarketSwapOverview(ctx) {
  const swapMsg = ctx.singleAction?.metadata?.contract?.msg?.swap
  const isFinMarketByEvents =
    !ctx.singleAction?.metadata?.contract?.msg?.order &&
    !ctx.singleAction?.metadata?.contract?.msg?.account &&
    !ctx.singleAction?.metadata?.contract?.msg?.liquid &&
    !ctx.singleAction?.metadata?.contract?.msg?.liquidate &&
    (ctx.singleAction?.metadata?.contract?.contractEvents || []).some(
      (e) => e.type === 'wasm-rujira-fin/trade'
    )
  if (!swapMsg && !isFinMarketByEvents) return null

  const action = ctx.singleAction
  const contractAddress = action.out?.[0]?.address || ''
  const contractLabel =
    getRujiraContractLabel(contractAddress) ||
    ctx.formatAddress(contractAddress)
  const productLabel = getRujiraContractProduct(contractAddress) || 'RUJI Trade'
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
  const events = action.metadata?.contract?.contractEvents || []
  let fundsStr = action.metadata?.contract?.funds || ''
  if (!fundsStr && userAddress) {
    const spentEvent = events.find(
      (e) =>
        e.type === 'coin_spent' &&
        (e.attributes || []).some(
          (a) => a.key === 'spender' && a.value === userAddress
        )
    )
    const amountAttr = (spentEvent?.attributes || []).find(
      (a) => a.key === 'amount'
    )
    if (amountAttr?.value) fundsStr = amountAttr.value
  }
  const fundsAmount = parseInt(fundsStr) || 0
  const fundsAsset = fundsStr.replace(/^[\d]+/, '').trim()

  const tradeEvents = events.filter((e) => e.type === 'wasm-rujira-fin/trade')
  const avgRate = (() => {
    let wSum = 0
    let wTotal = 0
    tradeEvents.forEach((e) => {
      const a = toAttrs(e)
      const r = parseFloat(a.rate)
      const w = parseInt(a.bid || 0)
      if (!isNaN(r) && w > 0) {
        wSum += r * w
        wTotal += w
      }
    })
    if (wTotal > 0) return wSum / wTotal
    const rs = tradeEvents
      .map((e) => parseFloat(toAttrs(e).rate))
      .filter((r) => !isNaN(r))
    return rs.length ? rs.reduce((s, r) => s + r, 0) / rs.length : null
  })()

  // Collect all amounts received by the user address (non-input denom).
  // Filtering by receiver = userAddress avoids picking up intermediate
  // routing hops or fee events that use the same denom.
  let receivedAmount = 0
  let receivedAssetDenom = ''

  const userReceipts = {}
  events
    .filter((e) => e.type === 'coin_received')
    .forEach((e) => {
      const a = toAttrs(e)
      if (userAddress && a.receiver !== userAddress) return
      ;(a.amount || '').split(',').forEach((part) => {
        const p = part.trim()
        const amt = parseInt(p) || 0
        const denom = p.replace(/^\d+/, '').trim()
        if (denom && denom !== fundsAsset && amt > 0) {
          userReceipts[denom] = (userReceipts[denom] || 0) + amt
        }
      })
    })
  Object.entries(userReceipts).forEach(([denom, amt]) => {
    if (amt > receivedAmount) {
      receivedAmount = amt
      receivedAssetDenom = denom
    }
  })

  const fundsAssetStr = fundsAsset
    ? securedToAsset(fundsAsset).toUpperCase()
    : ''
  // Parse raw denom first so secure: true is preserved for badge display,
  // fall back to the securedToAsset version for non-secured denoms
  const fundsAssetParsed = fundsAsset
    ? (assetFromString(fundsAsset.toUpperCase()) ??
      assetFromString(fundsAssetStr))
    : null
  const fundsTicker = fundsAssetParsed?.ticker || fundsAsset

  const receivedAssetStr = receivedAssetDenom
    ? securedToAsset(receivedAssetDenom).toUpperCase()
    : ''
  const receivedAssetParsed = receivedAssetDenom
    ? (assetFromString(receivedAssetDenom.toUpperCase()) ??
      assetFromString(receivedAssetStr))
    : null
  const receivedTicker = receivedAssetParsed?.ticker || receivedAssetDenom

  // Detect partial fills: check if any input denom was returned to the user
  const returnedAmount = (() => {
    if (!fundsAsset || !userAddress) return 0
    let total = 0
    events
      .filter((e) => e.type === 'coin_received')
      .map(toAttrs)
      .filter((a) => a.receiver === userAddress && a.amount)
      .forEach((a) => {
        a.amount.split(',').forEach((part) => {
          const p = part.trim()
          if (p.endsWith(fundsAsset)) total += parseInt(p) || 0
        })
      })
    return total
  })()
  const filledAmount = fundsAmount - returnedAmount
  const isPartialFill = returnedAmount > 0 && filledAmount > 0

  const refundAction = ctx.rawActions.find((a) => a.type === 'refund')
  const refundReason = refundAction?.metadata?.refund?.reason || null

  return {
    rawEvents: events,
    rawMsg: action?.metadata?.contract?.msg || null,
    title: `Market Order: ${contractLabel}`,
    metaLabel: `Market Order · ${productLabel}`,
    status,
    affiliateAddress: '',
    actionTypeTitle: 'contract',
    hasContractAction: true,
    priority: true,
    labels: isPartialFill ? ['Partial Fill'] : [],
    input: {
      asset: fundsAssetParsed ? fundsAssetStr : null,
      name: fundsTicker || 'Input',
      badge: ctx.getNetworkBadge(fundsAssetParsed) || '',
      amount: fundsAmount
        ? `${ctx.baseAmountFormatOrZero(fundsAmount)} ${fundsTicker}`
        : '-',
      usd: ctx.formatUsdValue(
        ctx.amountToUSD(fundsAssetStr, fundsAmount, ctx.pools)
      ),
      secure: fundsAssetParsed?.secure ?? false,
    },
    output: {
      asset: receivedAssetParsed ? receivedAssetStr : null,
      name: receivedTicker || contractLabel,
      badge: ctx.getNetworkBadge(receivedAssetParsed) || productLabel,
      amount: receivedAmount
        ? `${ctx.baseAmountFormatOrZero(receivedAmount)} ${receivedTicker}`
        : avgRate
          ? `Rate ${avgRate.toFixed(6)}`
          : 'Filled',
      usd: receivedAmount
        ? ctx.formatUsdValue(
            ctx.amountToUSD(receivedAssetStr, receivedAmount, ctx.pools)
          )
        : null,
    },
    returnedOutput: (() => {
      if (isPartialFill) {
        return {
          asset: fundsAssetParsed ? fundsAssetStr : null,
          name: fundsTicker,
          amount: `${ctx.baseAmountFormatOrZero(returnedAmount)} ${fundsTicker}`,
        }
      }
      if (refundAction) {
        const refundCoin = refundAction.out?.[0]?.coins?.[0]
        if (refundCoin) {
          const refundAssetStr = ctx.parseMemoAsset(refundCoin.asset)
          const refundAssetParsed = assetFromString(
            refundAssetStr || refundCoin.asset
          )
          const refundTicker = refundAssetParsed?.ticker || refundCoin.asset
          return {
            asset: refundAssetStr || null,
            name: refundTicker,
            amount: `${ctx.baseAmountFormatOrZero(refundCoin.amount)} ${refundTicker}`,
          }
        }
      }
      return null
    })(),
    metricRows: [
      avgRate ? { label: 'Rate', value: avgRate.toFixed(6) } : null,
      tradeEvents.length
        ? { label: 'CCL Fills', value: String(tradeEvents.length) }
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
        value: isPartialFill ? 'Partial Fill' : 'Market Order',
        tone: ctx.getContractTypeTone('Market Order'),
        type: 'product',
      },
      { label: 'Contract', value: contractLabel },
      isPartialFill
        ? {
            label: 'Filled',
            value: `${ctx.baseAmountFormatOrZero(filledAmount)} ${fundsTicker}`,
          }
        : null,
      isPartialFill
        ? {
            label: 'Returned',
            value: `${ctx.baseAmountFormatOrZero(returnedAmount)} ${fundsTicker}`,
          }
        : null,
      { label: 'Status', value: status.label, type: 'status' },
      refundReason ? { label: 'THORChain Refund', value: refundReason } : null,
      timestamp ? { label: 'Time', value: timestamp.format('lll') } : null,
      height ? { label: 'Block', value: `#${ctx.normalFormat(height)}` } : null,
      userAddress
        ? { label: 'User', address: userAddress, type: 'address' }
        : null,
    ].filter(Boolean),
    lifecycleRows: [
      {
        icon: hasError ? 'WarningIcon' : 'CheckIcon',
        title: hasError
          ? 'Contract execution failed'
          : isPartialFill
            ? 'Market order partially filled'
            : 'Market order filled',
        body: hasError
          ? logs || ''
          : [
              isPartialFill
                ? `${ctx.baseAmountFormatOrZero(filledAmount)} ${fundsTicker} filled`
                : fundsAmount
                  ? `${ctx.baseAmountFormatOrZero(fundsAmount)} ${fundsTicker} in`
                  : null,
              receivedAmount
                ? `${ctx.baseAmountFormatOrZero(receivedAmount)} ${receivedTicker} out`
                : null,
              avgRate ? `avg rate ${avgRate.toFixed(6)}` : null,
            ]
              .filter(Boolean)
              .join(' · '),
      },
      ...ctx.extractContractEventRows(action),
      receivedAmount && receivedTicker
        ? {
            icon: 'ArrowIcon',
            iconRotate: 0,
            title: `${ctx.baseAmountFormatOrZero(receivedAmount)} ${receivedTicker} received`,
            body: userAddress
              ? `Delivered to ${ctx.formatAddress(userAddress)}`
              : '',
          }
        : null,
      isPartialFill
        ? {
            icon: 'RefreshIcon',
            iconRotate: 0,
            title: 'Unfilled amount returned',
            body: `${ctx.baseAmountFormatOrZero(returnedAmount)} ${fundsTicker} returned to sender`,
          }
        : null,
      refundAction
        ? {
            icon: 'RefreshIcon',
            iconRotate: 0,
            title: 'THORChain swap refunded',
            body: refundReason || 'THORChain leg was refunded',
          }
        : null,
    ].filter(Boolean),
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
