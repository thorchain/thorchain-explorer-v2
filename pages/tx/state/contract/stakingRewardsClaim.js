import moment from 'moment'
import { toAttrs } from './shared.js'
import { assetFromString, securedToAsset } from '~/utils'
import {
  getRujiraContractLabel,
  getRujiraContractProduct,
} from '~/utils/rujiraContracts'

// Staking rewards claim: single contract action with msg.account.claim.
//
// FIX (not in original): the lifecycle row body referenced an undefined
// `claimedAmount` (pre-existing bug, lint already flagged both occurrences
// as `'claimedAmount' is not defined`) — this branch never declared that
// name, only `claimRecvAmt` (the actual claimed-amount variable used
// everywhere else in the branch). Rendering this branch would have thrown
// a ReferenceError. Fixed to use `claimRecvAmt` instead of transcribing
// the crash.
export function buildStakingRewardsClaimOverview(ctx) {
  const claimMsg = ctx.singleAction?.metadata?.contract?.msg?.account?.claim
  if (claimMsg === undefined) return null

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

  // Read claimed amount from the staking claim event
  const claimEvent = events.find(
    (e) => e.type === 'wasm-rujira-staking/account.claim'
  )
  const claimAttrs = claimEvent ? toAttrs(claimEvent) : {}
  const claimedAmountFallback = parseInt(claimAttrs.amount) || 0

  // coin_received by user (more reliable than wasm event)
  const claimReceivedByDenom = {}
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
            claimReceivedByDenom[denom] =
              (claimReceivedByDenom[denom] || 0) + amt
        })
      })
  }
  const claimRecvDenom = Object.keys(claimReceivedByDenom)[0] || 'rune'
  const claimRecvAmt =
    claimReceivedByDenom[claimRecvDenom] || claimedAmountFallback
  const claimAssetStr =
    claimRecvDenom === 'rune'
      ? 'THOR.RUNE'
      : securedToAsset(claimRecvDenom).toUpperCase()
  const claimAssetParsed = assetFromString(claimAssetStr)
  const claimTicker = claimAssetParsed?.ticker || 'RUNE'

  return {
    rawEvents: events,
    rawMsg: action?.metadata?.contract?.msg || null,
    title: `Claim Rewards · ${contractLabel}`,
    metaLabel: `Claim Rewards · ${productLabel}`,
    status,
    affiliateAddress: '',
    actionTypeTitle: 'contract',
    hasContractAction: true,
    labels: [],
    pairDisplay: null,
    input: {
      asset: null,
      name: 'User',
      badge: userAddress ? ctx.formatAddress(userAddress) : '',
      amount: 'Claim',
      usd: null,
    },
    output: {
      asset: claimAssetStr,
      name: claimTicker,
      badge: ctx.getNetworkBadge(claimAssetParsed) || '',
      amount: claimRecvAmt
        ? `${ctx.baseAmountFormatOrZero(claimRecvAmt)} ${claimTicker}`
        : '-',
      usd: claimRecvAmt
        ? ctx.formatUsdValue(
            ctx.amountToUSD(claimAssetStr, claimRecvAmt, ctx.pools)
          )
        : null,
    },
    metricRows: [
      claimRecvAmt
        ? {
            label: 'Claimed',
            value: `${ctx.baseAmountFormatOrZero(claimRecvAmt)} ${claimTicker}`,
          }
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
        value: 'Claim Rewards',
        tone: ctx.getContractTypeTone('Claim Rewards'),
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
        icon: 'CheckIcon',
        title: `Rewards claimed`,
        body: claimRecvAmt
          ? `${ctx.baseAmountFormatOrZero(claimRecvAmt)} ${claimTicker}`
          : '',
      },
      ...(hasError && logs
        ? [{ icon: 'WarningIcon', title: 'Claim failed', body: logs }]
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
