import moment from 'moment'
import { parseCoinString, resolveFinPairDenoms, toAttrs } from './shared.js'
import { assetFromString, securedToAsset } from '~/utils'
import {
  getRujiraContractEntry,
  getRujiraContractLabel,
  getRujiraContractProduct,
} from '~/utils/rujiraContracts'

// CCL range yield claim: single contract action with msg.range.claim.
export function buildCclRangeClaimOverview(ctx) {
  const rangeClaimMsg = ctx.singleAction?.metadata?.contract?.msg?.range?.claim
  if (!rangeClaimMsg) return null

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

  const rangeIdx = rangeClaimMsg.idx || ''

  // Claimed amounts from the range.claim event
  const claimEvent = events.find(
    (e) => e.type === 'wasm-rujira-fin/range.claim'
  )
  const claimAttrs = claimEvent ? toAttrs(claimEvent) : {}
  const baseAmt = parseInt(claimAttrs.base || 0)
  const quoteAmt = parseInt(claimAttrs.quote || 0)

  // Derive pair denoms from the registry contractLabel ("rujira-fin:base:quote"),
  // falling back to the coins the user received — matched against the claim
  // event's base/quote amounts, since the coin string itself is denom-sorted.
  const receivedEvent = events.find(
    (e) =>
      e.type === 'coin_received' &&
      (e.attributes || []).some(
        (a) => a.key === 'receiver' && a.value === userAddress
      )
  )
  const receivedAmtStr =
    (receivedEvent?.attributes || []).find((a) => a.key === 'amount')?.value ||
    ''

  const pairEntry = getRujiraContractEntry(contractAddress)
  const { baseDenom, quoteDenom } = resolveFinPairDenoms({
    pairEntry,
    coins: parseCoinString(receivedAmtStr),
    baseAmt,
    quoteAmt,
  })

  const denomToAssetStr = (denom) =>
    !denom
      ? ''
      : denom === 'rune'
        ? 'THOR.RUNE'
        : securedToAsset(denom).toUpperCase()

  const baseAssetStr = denomToAssetStr(baseDenom)
  const quoteAssetStr = denomToAssetStr(quoteDenom)
  const baseAssetParsed = baseAssetStr ? assetFromString(baseAssetStr) : null
  const quoteAssetParsed = quoteAssetStr ? assetFromString(quoteAssetStr) : null
  const baseTicker = baseAssetParsed?.ticker || baseDenom || 'Base'
  const quoteTicker = quoteAssetParsed?.ticker || quoteDenom || 'Quote'

  const pairLabel =
    baseTicker && quoteTicker ? `${baseTicker}/${quoteTicker}` : contractLabel

  const baseUsd = ctx.amountToUSD(baseAssetStr, baseAmt, ctx.pools)
  const quoteUsd = ctx.amountToUSD(quoteAssetStr, quoteAmt, ctx.pools)

  return {
    rawEvents: events,
    rawMsg: action?.metadata?.contract?.msg || null,
    title: `Claim Yield: Range #${rangeIdx} on ${pairLabel}`,
    metaLabel: `Claim Yield · ${pairLabel}`,
    status,
    affiliateAddress: '',
    actionTypeTitle: 'contract',
    hasContractAction: true,
    labels: [],
    pairDisplay: null,
    // Both legs are received here, so the hero reads "Claimed + Claimed"
    // rather than borrowing the swap card's Input -> Output framing.
    inputLabel: 'Claimed',
    outputLabel: 'Claimed',
    flowIcon: 'add',
    input: {
      asset: baseAssetStr || null,
      name: `${baseTicker} (Base)`,
      badge: ctx.getNetworkBadge(baseAssetParsed) || '',
      amount: baseAmt
        ? `${ctx.baseAmountFormatOrZero(baseAmt)} ${baseTicker}`
        : '—',
      usd: ctx.formatUsdValue(baseUsd),
    },
    output: {
      asset: quoteAssetStr || null,
      name: `${quoteTicker} (Quote)`,
      badge: ctx.getNetworkBadge(quoteAssetParsed) || '',
      amount: quoteAmt
        ? `${ctx.baseAmountFormatOrZero(quoteAmt)} ${quoteTicker}`
        : '—',
      usd: ctx.formatUsdValue(quoteUsd),
    },
    metricRows: [
      rangeIdx ? { label: 'Range Index', value: `#${rangeIdx}` } : null,
      timestamp ? { label: 'Time', value: timestamp.format('lll') } : null,
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
        value: 'Claim Yield',
        tone: ctx.getContractTypeTone('Claim Yield'),
        type: 'product',
      },
      { label: 'Pair', value: pairLabel },
      rangeIdx ? { label: 'Range Index', value: `#${rangeIdx}` } : null,
      { label: 'Status', value: status.label, type: 'status' },
      timestamp ? { label: 'Time', value: timestamp.format('lll') } : null,
      height ? { label: 'Block', value: `#${ctx.normalFormat(height)}` } : null,
      userAddress
        ? { label: 'Owner', address: userAddress, type: 'address' }
        : null,
    ].filter(Boolean),
    lifecycleRows: [
      {
        icon: hasError ? 'WarningIcon' : 'CheckIcon',
        title: hasError
          ? 'Claim failed'
          : `Yield claimed from range #${rangeIdx}`,
        body: hasError
          ? logs || ''
          : [
              baseAmt
                ? `${ctx.baseAmountFormatOrZero(baseAmt)} ${baseTicker}`
                : null,
              quoteAmt
                ? `${ctx.baseAmountFormatOrZero(quoteAmt)} ${quoteTicker}`
                : null,
            ]
              .filter(Boolean)
              .join(' + ') + ` received from ${pairLabel} range #${rangeIdx}`,
      },
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
