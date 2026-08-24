import moment from 'moment'
import { toAttrs } from './shared.js'
import { assetFromString, securedToAsset } from '~/utils'
import {
  getRujiraContractEntry,
  getRujiraContractLabel,
  getRujiraContractProduct,
} from '~/utils/rujiraContracts'

// CCL range ownership transfer: single contract action with
// msg.range.transfer ({ idx, to }). No coins move — `in`/`out` coins are
// empty and there's no `funds` — so the two hero panels show the previous
// and the new owner of the position instead of asset amounts.
export function buildCclRangeTransferOverview(ctx) {
  const rangeTransferMsg =
    ctx.singleAction?.metadata?.contract?.msg?.range?.transfer
  if (!rangeTransferMsg) return null

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

  // The emitted event carries the same from/idx/to as the msg, but it is
  // the authoritative record of what the contract actually did — prefer it
  // and fall back to the msg (plus the action's own in-address for `from`,
  // which the msg never states).
  const transferEvent = events.find(
    (e) => e.type === 'wasm-rujira-fin/range.transfer'
  )
  const transferAttrs = transferEvent ? toAttrs(transferEvent) : {}

  const rangeIdx = transferAttrs.idx || rangeTransferMsg.idx || ''
  const fromAddress = transferAttrs.from || userAddress
  const toAddress = transferAttrs.to || rangeTransferMsg.to || ''

  const fromLabel =
    getRujiraContractLabel(fromAddress) ||
    (fromAddress ? ctx.formatAddress(fromAddress) : '')
  const toLabel =
    getRujiraContractLabel(toAddress) ||
    (toAddress ? ctx.formatAddress(toAddress) : '')

  // Pair denoms come from the registry contractLabel ("rujira-fin:base:quote");
  // this action moves no coins, so there is no funds string to fall back on.
  const pairEntry = getRujiraContractEntry(contractAddress)
  const pairLabelParts = (pairEntry?.contractLabel || '').split(':')
  const baseDenom = pairLabelParts[1] || ''
  const quoteDenom = pairLabelParts[2] || ''

  const denomToAssetStr = (denom) =>
    !denom
      ? ''
      : denom === 'rune'
        ? 'THOR.RUNE'
        : securedToAsset(denom).toUpperCase()

  const baseAssetStr = denomToAssetStr(baseDenom)
  const quoteAssetStr = denomToAssetStr(quoteDenom)
  const baseTicker = baseAssetStr
    ? assetFromString(baseAssetStr)?.ticker || baseDenom
    : ''
  const quoteTicker = quoteAssetStr
    ? assetFromString(quoteAssetStr)?.ticker || quoteDenom
    : ''

  const pairLabel =
    baseTicker && quoteTicker ? `${baseTicker}/${quoteTicker}` : contractLabel

  const rangeRef = rangeIdx ? `Range #${rangeIdx}` : 'Range'

  return {
    rawEvents: events,
    rawMsg: action?.metadata?.contract?.msg || null,
    title: `CCL ${rangeRef} Transferred on ${pairLabel}`,
    metaLabel: `Transfer CCL · ${pairLabel}`,
    status,
    affiliateAddress: '',
    actionTypeTitle: 'contract',
    hasContractAction: true,
    labels: [],
    pairDisplay: null,
    input: {
      asset: null,
      name: 'Previous Owner',
      badge: fromLabel,
      amount: rangeRef,
      usd: null,
    },
    output: {
      asset: null,
      name: 'New Owner',
      badge: toLabel,
      amount: 'Ownership Transferred',
      usd: null,
    },
    metricRows: [
      rangeIdx ? { label: 'Range Index', value: `#${rangeIdx}` } : null,
      { label: 'Pair', value: pairLabel },
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
        value: 'Transfer CCL',
        tone: ctx.getContractTypeTone('Transfer CCL'),
        type: 'product',
      },
      { label: 'Pair', value: pairLabel },
      rangeIdx ? { label: 'Range Index', value: `#${rangeIdx}` } : null,
      { label: 'Status', value: status.label, type: 'status' },
      timestamp ? { label: 'Time', value: timestamp.format('lll') } : null,
      height ? { label: 'Block', value: `#${ctx.normalFormat(height)}` } : null,
      fromAddress
        ? { label: 'From Owner', address: fromAddress, type: 'address' }
        : null,
      toAddress
        ? { label: 'To Owner', address: toAddress, type: 'address' }
        : null,
    ].filter(Boolean),
    lifecycleRows: [
      {
        icon: hasError ? 'WarningIcon' : 'SendTypeIcon',
        title: hasError
          ? 'Range transfer failed'
          : `CCL ${rangeRef.toLowerCase()} transferred`,
        body: hasError
          ? logs || ''
          : `Ownership of ${rangeRef.toLowerCase()} on ${pairLabel} moved from ${fromLabel} to ${toLabel}`,
      },
    ],
    feeRows: [],
    technicalRows: [
      fromAddress
        ? ctx.buildTechRow('From address', fromAddress, 'address')
        : null,
      contractAddress
        ? ctx.buildTechRow('To address', contractAddress, 'address')
        : null,
      toAddress ? ctx.buildTechRow('New owner', toAddress, 'address') : null,
    ].filter(Boolean),
  }
}
