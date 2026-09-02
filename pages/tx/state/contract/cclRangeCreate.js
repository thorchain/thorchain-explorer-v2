import moment from 'moment'
import { parseCoinString, resolveFinPairDenoms, toAttrs } from './shared.js'
import { assetFromString, securedToAsset } from '~/utils'
import {
  getRujiraContractEntry,
  getRujiraContractLabel,
  getRujiraContractProduct,
} from '~/utils/rujiraContracts'

// CCL range creation: single contract action with msg.range.create.
export function buildCclRangeCreateOverview(ctx) {
  const rangeCreateMsg =
    ctx.singleAction?.metadata?.contract?.msg?.range?.create
  if (!rangeCreateMsg) return null

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

  // Parse actual amounts used from range.create event
  const rangeCreateEvents = events.filter(
    (e) => e.type === 'wasm-rujira-fin/range.create'
  )
  const rangeAttrs = rangeCreateEvents.length
    ? toAttrs(rangeCreateEvents[0])
    : {}
  const rangeCount = rangeCreateEvents.length

  const low = rangeAttrs.low || rangeCreateMsg.config?.low || ''
  const high = rangeAttrs.high || rangeCreateMsg.config?.high || ''
  const fee = rangeAttrs.fee || rangeCreateMsg.config?.fee || ''
  const spread = rangeAttrs.spread || rangeCreateMsg.config?.spread || ''
  const rangeIdx = rangeAttrs.idx || ''

  // Actual amounts committed to the range (may differ from funds sent due to refund)
  const baseAmt = parseInt(rangeAttrs.base || 0)
  const quoteAmt = parseInt(rangeAttrs.quote || 0)

  // Parse denoms from the multi-asset funds string
  // ("969729479647doge-doge,222781833369rune"). Prefer registry pair info;
  // otherwise match the funds against the event's base/quote amounts, since
  // the funds string is sorted by denom rather than by pair side.
  const fundsStr = action.metadata?.contract?.funds || ''
  const pairEntry = getRujiraContractEntry(contractAddress)
  const { baseDenom, quoteDenom } = resolveFinPairDenoms({
    pairEntry,
    coins: parseCoinString(fundsStr),
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

  const fmtPct = (val) => (val ? `${(parseFloat(val) * 100).toFixed(3)}%` : '')
  const fmtPrice = (val) => (val ? parseFloat(val).toPrecision(6) : '')

  return {
    rawEvents: events,
    rawMsg: action?.metadata?.contract?.msg || null,
    title: `CCL Range Created on ${pairLabel}`,
    metaLabel: `CCL Range · ${pairLabel}`,
    status,
    affiliateAddress: '',
    actionTypeTitle: 'contract',
    hasContractAction: true,
    labels: [],
    pairDisplay: null,
    // Both legs are deposited into the range together — there is no
    // input -> output flow to show.
    inputLabel: 'Deposited',
    outputLabel: 'Deposited',
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
      low && high
        ? { label: 'Price Range', value: `${fmtPrice(low)}–${fmtPrice(high)}` }
        : null,
      fee ? { label: 'Fee', value: fmtPct(fee) } : null,
      spread ? { label: 'Spread', value: fmtPct(spread) } : null,
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
        value: rangeCount > 1 ? `${rangeCount} CCL Ranges` : 'CCL Range',
        tone: ctx.getContractTypeTone('CCL Range'),
        type: 'product',
      },
      { label: 'Pair', value: pairLabel },
      low && high
        ? { label: 'Price Range', value: `${fmtPrice(low)}–${fmtPrice(high)}` }
        : null,
      fee ? { label: 'Fee Rate', value: fmtPct(fee) } : null,
      spread ? { label: 'Spread', value: fmtPct(spread) } : null,
      rangeIdx ? { label: 'Range Index', value: rangeIdx } : null,
      { label: 'Status', value: status.label, type: 'status' },
      timestamp ? { label: 'Time', value: timestamp.format('lll') } : null,
      height ? { label: 'Block', value: `#${ctx.normalFormat(height)}` } : null,
      userAddress
        ? { label: 'Owner', address: userAddress, type: 'address' }
        : null,
    ].filter(Boolean),
    lifecycleRows: [
      {
        icon: hasError ? 'WarningIcon' : 'ExchangeIcon',
        title: hasError
          ? 'Contract execution failed'
          : `CCL range position created`,
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
              .join(' + ') +
            (low && high
              ? ` deposited into ${pairLabel} at price range ${fmtPrice(low)}–${fmtPrice(high)}`
              : ` deposited into ${pairLabel}`),
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
