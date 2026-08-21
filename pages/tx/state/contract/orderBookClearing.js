import moment from 'moment'
import { toAttrs } from './shared.js'
import { assetFromString, securedToAsset } from '~/utils'
import { getRujiraContractLabel } from '~/utils/rujiraContracts'

// Order Book Clearing: any contract action has memo "OB Clearing".
export function buildOrderBookClearingOverview(ctx) {
  const obClearingAction = ctx.contractActions.find(
    (a) => a.metadata?.contract?.memo === 'OB Clearing'
  )
  if (!obClearingAction) return null

  const allEvents = ctx.contractActions.flatMap(
    (a) => a.metadata?.contract?.contractEvents || []
  )
  const hasError = ctx.contractActions.some(
    (a) => (a.metadata?.contract?.code ?? 0) > 0
  )
  const logs = obClearingAction.metadata?.contract?.logs
  const status = hasError
    ? { label: 'Failed', tone: 'red' }
    : { label: 'Success', tone: 'green' }
  const date = obClearingAction.date
  const timestamp = date ? moment.unix(parseInt(date) / 1e9) : null
  const height = parseInt(obClearingAction.height)

  // FIN pair from first trade event
  const firstTrade = allEvents.find((e) => e.type === 'wasm-rujira-fin/trade')
  const finPairAddr = firstTrade
    ? toAttrs(firstTrade)._contract_address || ''
    : ''
  const finPairLabel =
    getRujiraContractLabel(finPairAddr) || ctx.formatAddress(finPairAddr)

  // Count non-CCL fills and compute avg rate
  const nonCCLTrades = allEvents
    .filter((e) => e.type === 'wasm-rujira-fin/trade')
    .map(toAttrs)
    .filter((a) => !String(a.price || '').startsWith('ccl:'))
  const fillCount = nonCCLTrades.length
  const rates = nonCCLTrades
    .map((a) => parseFloat(a.rate))
    .filter((r) => !isNaN(r))
  const avgRate = rates.length
    ? rates.reduce((s, r) => s + r, 0) / rates.length
    : null

  // Input/output: what the sender address actually sends and receives
  const senderAddr = obClearingAction.in?.[0]?.address || ''
  const sumByDenom = (events, addrKey, addrVal) => {
    const byDenom = {}
    events
      .filter((e) => e.type === 'coin_spent' || e.type === 'coin_received')
      .map(toAttrs)
      .filter((a) => a[addrKey] === addrVal && a.amount)
      .forEach((a) => {
        a.amount.split(',').forEach((part) => {
          const p = part.trim()
          const amt = parseInt(p) || 0
          const denom = p.replace(/^\d+/, '').trim()
          if (denom && amt > 0) byDenom[denom] = (byDenom[denom] || 0) + amt
        })
      })
    return byDenom
  }
  const spentByDenom = sumByDenom(allEvents, 'spender', senderAddr)
  const receivedByDenom = sumByDenom(allEvents, 'receiver', senderAddr)

  const denomToAssetStr = (denom) =>
    denom === 'rune' ? 'THOR.RUNE' : securedToAsset(denom).toUpperCase()

  const primaryInDenom = Object.keys(spentByDenom)[0] || ''
  const primaryInAmt = spentByDenom[primaryInDenom] || 0
  const primaryInAssetStr = primaryInDenom
    ? denomToAssetStr(primaryInDenom)
    : ''
  const primaryInAsset = primaryInAssetStr
    ? assetFromString(primaryInAssetStr)
    : null
  const primaryInTicker = primaryInAsset?.ticker || primaryInDenom

  const primaryOutDenom =
    Object.keys(receivedByDenom).find((d) => d !== primaryInDenom) ||
    Object.keys(receivedByDenom)[0] ||
    ''
  const primaryOutAmt = receivedByDenom[primaryOutDenom] || 0
  const primaryOutAssetStr = primaryOutDenom
    ? denomToAssetStr(primaryOutDenom)
    : ''
  const primaryOutAsset = primaryOutAssetStr
    ? assetFromString(primaryOutAssetStr)
    : null
  const primaryOutTicker = primaryOutAsset?.ticker || primaryOutDenom

  // Sender's own action: the resting limit order that triggered clearing.
  // (The arb / trade / range.fee events settle OTHER users' resting orders
  // and are intentionally not attributed to the sender.)
  const senderOrderCreate = allEvents
    .filter((e) => e.type === 'wasm-rujira-fin/order.create')
    .map(toAttrs)
    .find((a) => a.owner === senderAddr)
  const senderOrderPrice = senderOrderCreate
    ? String(senderOrderCreate.price || '').replace(/^fixed:/, '')
    : ''

  return {
    rawEvents: allEvents,
    rawMsg: obClearingAction.metadata?.contract?.msg || null,
    title: `Order Book Clearing · ${finPairLabel}`,
    metaLabel: `Order Book Clearing · ${finPairLabel}`,
    status,
    affiliateAddress: '',
    actionTypeTitle: 'contract',
    hasContractAction: true,
    priority: true,
    labels: [],
    pairDisplay: null,
    input: primaryInAmt
      ? {
          asset: primaryInAssetStr || null,
          name: primaryInTicker,
          badge: ctx.getNetworkBadge(primaryInAsset) || '',
          amount: `${ctx.baseAmountFormatOrZero(primaryInAmt)} ${primaryInTicker}`,
          usd: ctx.formatUsdValue(
            ctx.amountToUSD(primaryInAssetStr, primaryInAmt, ctx.pools)
          ),
        }
      : null,
    output: primaryOutAmt
      ? {
          asset: primaryOutAssetStr || null,
          name: primaryOutTicker,
          badge: ctx.getNetworkBadge(primaryOutAsset) || '',
          amount: `${ctx.baseAmountFormatOrZero(primaryOutAmt)} ${primaryOutTicker}`,
          usd: ctx.formatUsdValue(
            ctx.amountToUSD(primaryOutAssetStr, primaryOutAmt, ctx.pools)
          ),
        }
      : null,
    metricRows: [
      fillCount ? { label: 'Fills', value: String(fillCount) } : null,
      avgRate ? { label: 'Avg Rate', value: avgRate.toFixed(6) } : null,
    ].filter(Boolean),
    detailRows: [
      {
        label: 'Product',
        value: 'RUJI Trade',
        tone: ctx.getProductTone('RUJI Trade'),
        type: 'product',
      },
      {
        label: 'Action',
        value: 'Order Book Clearing',
        tone: ctx.getContractTypeTone('OB Clearing'),
        type: 'product',
      },
      { label: 'FIN Pair', value: finPairLabel },
      { label: 'Status', value: status.label, type: 'status' },
      timestamp ? { label: 'Time', value: timestamp.format('lll') } : null,
      height ? { label: 'Block', value: `#${ctx.normalFormat(height)}` } : null,
    ].filter(Boolean),
    lifecycleRows: hasError
      ? [
          {
            icon: 'WarningIcon',
            title: 'OB Clearing failed',
            body: logs || '',
          },
        ]
      : [
          senderOrderCreate
            ? {
                icon: 'ArrowIcon',
                iconRotate: 90,
                title: 'Resting limit order placed',
                body:
                  [
                    primaryInAmt
                      ? `${ctx.baseAmountFormatOrZero(primaryInAmt)} ${primaryInTicker} committed`
                      : null,
                    senderOrderPrice ? `at ${senderOrderPrice}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || `on ${finPairLabel}`,
              }
            : null,
          {
            icon: 'CheckIcon',
            title: 'Order Book Clearing complete',
            body: finPairLabel,
          },
        ].filter(Boolean),
    feeRows: [],
    technicalRows: [
      senderAddr
        ? ctx.buildTechRow('From address', senderAddr, 'address')
        : null,
      obClearingAction.metadata?.contract?.memo
        ? ctx.buildTechRow('Memo', obClearingAction.metadata.contract.memo)
        : null,
    ].filter(Boolean),
  }
}
