import moment from 'moment'
import { toAttrs } from './shared.js'
import { assetFromString, securedToAsset } from '~/utils'
import {
  getRujiraContractLabel,
  getRujiraContractProduct,
} from '~/utils/rujiraContracts'

// Ghost Credit Account: msg.account dispatches sub-messages through a
// credit sub-account. Note: the lifecycle row's 'SubtractIcon' is not
// registered anywhere in this app (pre-existing gap, not introduced by
// this extraction) — that one lifecycle row silently renders without an
// icon.
export function buildGhostCreditBorrowOverview(ctx) {
  const creditAccountMsg = ctx.singleAction?.metadata?.contract?.msg?.account
  if (!creditAccountMsg) return null

  const action = ctx.singleAction
  const contractAddress = action.out?.[0]?.address || ''
  const contractLabel =
    getRujiraContractLabel(contractAddress) ||
    ctx.formatAddress(contractAddress)
  const productLabel =
    getRujiraContractProduct(contractAddress) || 'RUJI Money Market'
  const userAddress = action.in?.[0]?.address || ''
  const creditAccountAddr = creditAccountMsg.addr || ''
  const subMsgs = creditAccountMsg.msgs || []
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

  // Extract borrow sub-messages
  const borrowMsgs = subMsgs.filter((m) => m.borrow)
  const borrowEvent = events.find(
    (e) => e.type === 'wasm-rujira-ghost-credit/account.msg/borrow'
  )
  const borrowAttrs = borrowEvent ? toAttrs(borrowEvent) : {}
  const borrowAmountStr = borrowAttrs.amount || ''
  const borrowAmountRaw = parseInt(borrowAmountStr) || 0
  const borrowDenom =
    borrowAmountStr.replace(/^\d+/, '').trim() ||
    borrowMsgs[0]?.borrow?.denom ||
    ''
  const borrowAssetStr = borrowDenom
    ? securedToAsset(borrowDenom).toUpperCase()
    : ''
  const borrowAssetParsed = borrowAssetStr
    ? assetFromString(borrowAssetStr)
    : null
  const borrowTicker = borrowAssetParsed?.ticker || borrowDenom

  // Extract FIN trade fill (CCL or limit)
  const finTradeEvent = events.find((e) => e.type === 'wasm-rujira-fin/trade')
  const finAttrs = finTradeEvent ? toAttrs(finTradeEvent) : {}
  const finPairAddr = finAttrs._contract_address || ''
  const finPairLabel =
    getRujiraContractLabel(finPairAddr) || ctx.formatAddress(finPairAddr)
  const bidRaw = parseInt(finAttrs.bid || 0)
  const offerRaw = parseInt(finAttrs.offer || 0)
  const fillPrice = parseFloat(finAttrs.rate || 0)
  const isCCLFill = String(finAttrs.price || '').startsWith('ccl:')

  // Find the output asset received by the credit account
  const creditReceivedEvent = events.find(
    (e) =>
      e.type === 'coin_received' &&
      (e.attributes || []).some(
        (a) => a.key === 'receiver' && a.value === creditAccountAddr
      ) &&
      (e.attributes || []).some(
        (a) => a.key === 'amount' && !a.value.includes(borrowDenom)
      )
  )
  const outputAmountStr = creditReceivedEvent
    ? ((e) =>
        (e.attributes || []).find((a) => a.key === 'amount')?.value || '')(
        creditReceivedEvent
      )
    : ''
  const outputRaw = parseInt(outputAmountStr) || 0
  const outputDenom = outputAmountStr.replace(/^\d+/, '').trim()
  const outputAssetStr = outputDenom
    ? securedToAsset(outputDenom).toUpperCase()
    : ''
  const outputAssetParsed = outputAssetStr
    ? assetFromString(outputAssetStr)
    : null
  const outputTicker = outputAssetParsed?.ticker || outputDenom

  // Retract event
  const retractEvent = events.find(
    (e) => e.type === 'wasm-rujira-fin/order.retract'
  )
  const retractAttrs = retractEvent ? toAttrs(retractEvent) : {}
  const retractAmount = parseInt(retractAttrs.amount || 0)

  const subMsgCount = subMsgs.length

  return {
    rawEvents: events,
    rawMsg: action?.metadata?.contract?.msg || null,
    title: `Credit Account: ${ctx.formatAddress(creditAccountAddr)}`,
    metaLabel: `Credit Account · ${productLabel}`,
    status,
    affiliateAddress: '',
    actionTypeTitle: 'contract',
    hasContractAction: true,
    labels: [],
    input: {
      asset: borrowAssetParsed ? borrowAssetStr : null,
      name: borrowTicker || 'Borrowed',
      badge: borrowMsgs.length
        ? `${borrowMsgs.length} borrow${borrowMsgs.length !== 1 ? 's' : ''}`
        : '',
      amount: borrowAmountRaw
        ? ctx.baseAmountFormatOrZero(borrowAmountRaw)
        : '-',
      usd: null,
    },
    output: {
      asset: outputAssetParsed ? outputAssetStr : null,
      name: outputTicker || 'Received',
      badge: isCCLFill ? 'CCL fill' : finTradeEvent ? 'Limit fill' : '',
      amount: outputRaw ? ctx.baseAmountFormatOrZero(outputRaw) : '-',
      usd: null,
    },
    metricRows: [
      borrowAmountRaw
        ? {
            label: 'Borrowed',
            value: `${ctx.baseAmountFormatOrZero(borrowAmountRaw)} ${borrowTicker}`,
          }
        : null,
      outputRaw
        ? {
            label: 'Received',
            value: `${ctx.baseAmountFormatOrZero(outputRaw)} ${outputTicker}`,
          }
        : null,
      fillPrice ? { label: 'Fill price', value: fillPrice.toFixed(2) } : null,
      { label: 'Sub-messages', value: String(subMsgCount) },
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
        value: 'Credit Account',
        tone: ctx.getContractTypeTone('Credit Account'),
        type: 'product',
      },
      { label: 'Contract', value: contractLabel },
      { label: 'Sub-messages', value: String(subMsgCount) },
      { label: 'Status', value: status.label, type: 'status' },
      timestamp ? { label: 'Time', value: timestamp.format('lll') } : null,
      height ? { label: 'Block', value: `#${ctx.normalFormat(height)}` } : null,
      userAddress
        ? { label: 'User', address: userAddress, type: 'address' }
        : null,
      creditAccountAddr
        ? {
            label: 'Credit account',
            address: creditAccountAddr,
            type: 'address',
          }
        : null,
    ].filter(Boolean),
    lifecycleRows: [
      borrowAmountRaw
        ? {
            icon: 'RefreshIcon',
            title: 'Borrowed from Ghost Vault',
            body: `${ctx.baseAmountFormatOrZero(borrowAmountRaw)} ${borrowTicker}`,
          }
        : null,
      finTradeEvent
        ? {
            icon: 'ExchangeIcon',
            title: `${isCCLFill ? 'CCL' : 'Limit'} fill: ${finPairLabel}`,
            body: [
              offerRaw ? `${offerRaw} ${borrowTicker} offered` : null,
              bidRaw ? `${bidRaw} ${outputTicker} received` : null,
              fillPrice ? `@ ${fillPrice.toFixed(2)}` : null,
            ]
              .filter(Boolean)
              .join(' · '),
          }
        : null,
      retractEvent
        ? {
            icon: 'SubtractIcon',
            title: 'Unfilled order retracted',
            body: retractAmount
              ? `${retractAmount} ${borrowTicker} returned`
              : '',
          }
        : null,
      hasError && logs
        ? {
            icon: 'WarningIcon',
            title: 'Contract execution failed',
            body: logs,
          }
        : null,
    ].filter(Boolean),
    feeRows: [],
    technicalRows: [
      userAddress
        ? ctx.buildTechRow('From address', userAddress, 'address')
        : null,
      creditAccountAddr
        ? ctx.buildTechRow('Credit account', creditAccountAddr, 'address')
        : null,
      contractAddress
        ? ctx.buildTechRow('To address', contractAddress, 'address')
        : null,
    ].filter(Boolean),
  }
}
