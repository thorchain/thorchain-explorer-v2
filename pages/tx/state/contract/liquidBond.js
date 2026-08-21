import moment from 'moment'
import { toAttrs } from './shared.js'
import { assetFromString, securedToAsset } from '~/utils'
import {
  getRujiraContractLabel,
  getRujiraContractProduct,
} from '~/utils/rujiraContracts'

// Liquid bond / unbond: single contract action with msg.liquid.
export function buildLiquidBondOverview(ctx) {
  const liquidMsg = ctx.singleAction?.metadata?.contract?.msg?.liquid
  if (!liquidMsg || !('bond' in liquidMsg || 'unbond' in liquidMsg)) return null

  const isBond = 'bond' in liquidMsg
  const action = ctx.singleAction
  const contractAddress = action.out?.[0]?.address || ''
  const contractLabel =
    getRujiraContractLabel(contractAddress) ||
    ctx.formatAddress(contractAddress)
  const rawProduct = getRujiraContractProduct(contractAddress)
  const productLabel =
    (rawProduct === 'Utilities' ? 'Staking' : rawProduct) || 'Staking'
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
  const bondEvent = events.find(
    (e) => e.type === `wasm-rujira-staking/liquid.${isBond ? 'bond' : 'unbond'}`
  )
  const bondAttrs = bondEvent ? toAttrs(bondEvent) : {}
  const amountRaw = parseInt(
    bondAttrs.amount || action.metadata?.contract?.funds || 0
  )
  const sharesRaw = parseInt(bondAttrs.shares || 0)
  const fundsStr = action.metadata?.contract?.funds || ''
  const fundsAsset = fundsStr.replace(/^[\d]+/, '').trim()
  const actionType = isBond ? 'Liquid Stake' : 'Liquid Unstake'

  // coin_received by user (liquid staking tokens on bond, underlying on unbond)
  const liquidReceivedByDenom = {}
  if (userAddress) {
    events
      .filter((e) => e.type === 'coin_received')
      .map(toAttrs)
      .filter((a) => a.receiver === userAddress && a.amount)
      .forEach((a) => {
        a.amount.split(',').forEach((part) => {
          const p = part.trim()
          const amt = parseInt(p) || 0
          const denom = p.replace(/^\d+/, '').trim()
          if (denom && amt > 0)
            liquidReceivedByDenom[denom] =
              (liquidReceivedByDenom[denom] || 0) + amt
        })
      })
  }
  const liqRecvDenom = Object.keys(liquidReceivedByDenom)[0] || ''
  const liqRecvAmt = liquidReceivedByDenom[liqRecvDenom] || 0
  const liqRecvAssetStr =
    liqRecvDenom === 'rune'
      ? 'THOR.RUNE'
      : liqRecvDenom
        ? securedToAsset(liqRecvDenom).toUpperCase()
        : ''
  const liqRecvAssetParsed = liqRecvAssetStr
    ? assetFromString(liqRecvAssetStr)
    : null
  const liqRecvTicker = liqRecvAssetParsed?.ticker || liqRecvDenom

  return {
    rawEvents: events,
    rawMsg: action?.metadata?.contract?.msg || null,
    title: `${actionType}: ${contractLabel}`,
    metaLabel: `${actionType} · ${productLabel}`,
    status,
    affiliateAddress: '',
    actionTypeTitle: 'contract',
    hasContractAction: true,
    labels: [],
    input: {
      asset: null,
      name: 'User',
      badge: userAddress ? ctx.formatAddress(userAddress) : '',
      amount: amountRaw
        ? `${ctx.baseAmountFormatOrZero(amountRaw)} ${fundsAsset || 'tokens'}`
        : '-',
      usd: null,
    },
    output: liqRecvAmt
      ? {
          asset: liqRecvAssetStr || null,
          name: liqRecvTicker,
          badge: ctx.getNetworkBadge(liqRecvAssetParsed) || '',
          amount: `${ctx.baseAmountFormatOrZero(liqRecvAmt)} ${liqRecvTicker}`,
          usd: ctx.formatUsdValue(
            ctx.amountToUSD(liqRecvAssetStr, liqRecvAmt, ctx.pools)
          ),
        }
      : {
          asset: null,
          name: contractLabel,
          badge: productLabel,
          amount: sharesRaw
            ? `${ctx.baseAmountFormatOrZero(sharesRaw)} shares`
            : isBond
              ? 'Bonded'
              : 'Unbonded',
          usd: null,
        },
    metricRows: [
      amountRaw
        ? {
            label: isBond ? 'Amount Bonded' : 'Amount Unbonded',
            value: `${ctx.baseAmountFormatOrZero(amountRaw)} ${fundsAsset}`,
          }
        : null,
      sharesRaw
        ? { label: 'Shares', value: ctx.baseAmountFormatOrZero(sharesRaw) }
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
        value: actionType,
        tone: ctx.getContractTypeTone(actionType),
        type: 'product',
      },
      { label: 'Contract', value: contractLabel },
      { label: 'Status', value: status.label, type: 'status' },
      timestamp ? { label: 'Time', value: timestamp.format('lll') } : null,
      height ? { label: 'Block', value: `#${ctx.normalFormat(height)}` } : null,
      userAddress
        ? { label: 'User', address: userAddress, type: 'address' }
        : null,
    ].filter(Boolean),
    lifecycleRows: [
      {
        icon: hasError ? 'WarningIcon' : 'CheckIcon',
        title: hasError ? 'Contract execution failed' : actionType,
        body: hasError
          ? logs || ''
          : [
              amountRaw
                ? `${ctx.baseAmountFormatOrZero(amountRaw)} ${fundsAsset} ${isBond ? 'deposited' : 'withdrawn'}`
                : null,
              sharesRaw
                ? `${ctx.baseAmountFormatOrZero(sharesRaw)} shares ${isBond ? 'minted' : 'burned'}`
                : null,
            ]
              .filter(Boolean)
              .join(' → '),
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
