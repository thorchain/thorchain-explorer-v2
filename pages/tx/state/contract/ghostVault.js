import moment from 'moment'
import { toAttrs } from './shared.js'
import { assetFromString, securedToAsset } from '~/utils'
import {
  getRujiraContractLabel,
  getRujiraContractProduct,
} from '~/utils/rujiraContracts'

// Ghost Vault Withdraw / Deposit: single contract action with msg.withdraw or msg.deposit.
export function buildGhostVaultOverview(ctx) {
  const ghostVaultMsg = ctx.singleAction?.metadata?.contract?.msg
  const isGhostWithdraw = ghostVaultMsg && 'withdraw' in ghostVaultMsg
  const isGhostDeposit = ghostVaultMsg && 'deposit' in ghostVaultMsg
  if (!isGhostWithdraw && !isGhostDeposit) return null

  const action = ctx.singleAction
  const contractAddress = action.out?.[0]?.address || ''
  const contractLabel =
    getRujiraContractLabel(contractAddress) ||
    ctx.formatAddress(contractAddress)
  const productLabel =
    getRujiraContractProduct(contractAddress) || 'RUJI Money Market'
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
  const vaultEvent = events.find(
    (e) =>
      e.type ===
      `wasm-rujira-ghost-vault/${isGhostWithdraw ? 'withdraw' : 'deposit'}`
  )
  const vaultAttrs = vaultEvent ? toAttrs(vaultEvent) : {}

  // Parse funds denom (e.g. "9158098048x/ghost-vault/eth-usdc-0xa...")
  const fundsStr = action.metadata?.contract?.funds || ''
  const fundsAmountRaw = parseInt(fundsStr) || 0
  const fundsDenom = fundsStr.replace(/^\d+/, '').trim()
  const vaultAssetName = fundsDenom.replace('x/ghost-vault/', '')

  // Find the coin_received event for the user to get the actual output denom
  const userCoinReceived = events.find(
    (e) =>
      e.type === 'coin_received' &&
      (e.attributes || []).some(
        (a) => a.key === 'receiver' && a.value === userAddress
      ) &&
      (e.attributes || []).some(
        (a) => a.key === 'amount' && !a.value.includes('ghost-vault')
      )
  )
  const userReceivedAmountStr = userCoinReceived
    ? ((e) =>
        (e.attributes || []).find((a) => a.key === 'amount')?.value || '')(
        userCoinReceived
      )
    : ''
  const userReceivedDenom = userReceivedAmountStr.replace(/^\d+/, '').trim()
  // Convert trade-asset denom (e.g. "eth-usdc-0xa...") to asset string ("ETH.USDC-0XA...")
  const underlyingAssetStr = userReceivedDenom
    ? securedToAsset(userReceivedDenom).toUpperCase()
    : vaultAssetName.toUpperCase()
  const underlyingAssetParsed = assetFromString(underlyingAssetStr)
  const underlyingTicker = underlyingAssetParsed?.ticker || underlyingAssetStr

  // Underlying amount from vault event
  const underlyingRaw = parseInt(vaultAttrs.amount || 0)
  const sharesRaw = parseInt(vaultAttrs.shares || fundsAmountRaw || 0)

  // For deposit: find vault shares received by user (denom includes 'ghost-vault')
  // For withdraw: userCoinReceived already found above (underlying token)
  let depositSharesAmt = 0
  if (isGhostDeposit && userAddress) {
    const depositCoinReceived = events.find(
      (e) =>
        e.type === 'coin_received' &&
        (e.attributes || []).some(
          (a) => a.key === 'receiver' && a.value === userAddress
        ) &&
        (e.attributes || []).some(
          (a) => a.key === 'amount' && a.value.includes('ghost-vault')
        )
    )
    const depositAmtStr = depositCoinReceived
      ? ((e) =>
          (e.attributes || []).find((a) => a.key === 'amount')?.value || '')(
          depositCoinReceived
        )
      : ''
    depositSharesAmt = parseInt(depositAmtStr) || 0
  }

  const actionType = isGhostWithdraw
    ? 'Ghost Vault Withdraw'
    : 'Ghost Vault Deposit'
  const vaultName =
    contractLabel.replace('rujira-ghost-vault:', '') || contractLabel

  return {
    rawEvents: events,
    rawMsg: action?.metadata?.contract?.msg || null,
    title: `${actionType}: ${vaultName}`,
    metaLabel: `${actionType} · ${productLabel}`,
    status,
    affiliateAddress: '',
    actionTypeTitle: 'contract',
    hasContractAction: true,
    labels: [],
    input: {
      asset: null,
      name: isGhostWithdraw ? 'Shares burned' : 'User',
      badge: isGhostWithdraw
        ? vaultName
        : userAddress
          ? ctx.formatAddress(userAddress)
          : '',
      amount: isGhostWithdraw
        ? sharesRaw
          ? `${ctx.baseAmountFormatOrZero(sharesRaw)} shares`
          : '-'
        : fundsAmountRaw
          ? `${ctx.baseAmountFormatOrZero(fundsAmountRaw)} ${fundsDenom}`
          : '-',
      usd: null,
    },
    output: isGhostWithdraw
      ? {
          asset: underlyingAssetParsed ? underlyingAssetStr : null,
          name: underlyingTicker,
          badge:
            ctx.getNetworkBadge(underlyingAssetParsed) ||
            (userAddress ? ctx.formatAddress(userAddress) : ''),
          amount: underlyingRaw
            ? `${ctx.baseAmountFormatOrZero(underlyingRaw)} ${underlyingTicker}`
            : 'Withdrawn',
          usd: underlyingRaw
            ? ctx.formatUsdValue(
                ctx.amountToUSD(underlyingAssetStr, underlyingRaw, ctx.pools)
              )
            : null,
        }
      : depositSharesAmt
        ? {
            asset: null,
            name: 'Vault shares',
            badge: vaultName,
            amount: `${ctx.baseAmountFormatOrZero(depositSharesAmt)} shares`,
            usd: null,
          }
        : {
            asset: null,
            name: 'Shares minted',
            badge: vaultName,
            amount: sharesRaw
              ? `${ctx.baseAmountFormatOrZero(sharesRaw)} shares`
              : 'Deposited',
            usd: null,
          },
    metricRows: [
      sharesRaw
        ? { label: 'Shares', value: ctx.baseAmountFormatOrZero(sharesRaw) }
        : null,
      underlyingRaw
        ? {
            label: isGhostWithdraw
              ? 'Underlying Received'
              : 'Underlying Deposited',
            value: `${ctx.baseAmountFormatOrZero(underlyingRaw)} ${underlyingTicker}`,
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
        value: actionType,
        tone: ctx.getContractTypeTone(actionType),
        type: 'product',
      },
      { label: 'Vault', value: vaultName },
      { label: 'Status', value: status.label, type: 'status' },
      timestamp ? { label: 'Time', value: timestamp.format('lll') } : null,
      height ? { label: 'Block', value: `#${ctx.normalFormat(height)}` } : null,
      userAddress
        ? { label: 'User', address: userAddress, type: 'address' }
        : null,
    ].filter(Boolean),
    lifecycleRows: [
      {
        icon: hasError
          ? 'WarningIcon'
          : isGhostWithdraw
            ? 'SubtractIcon'
            : 'AddIcon',
        title: hasError ? 'Contract execution failed' : actionType,
        body: hasError
          ? logs || ''
          : isGhostWithdraw
            ? [
                sharesRaw
                  ? `${ctx.baseAmountFormatOrZero(sharesRaw)} shares burned`
                  : null,
                underlyingRaw
                  ? `${ctx.baseAmountFormatOrZero(underlyingRaw)} ${underlyingTicker} received`
                  : null,
              ]
                .filter(Boolean)
                .join(' → ')
            : [
                fundsAmountRaw
                  ? `${ctx.baseAmountFormatOrZero(fundsAmountRaw)} ${fundsDenom} deposited`
                  : null,
                sharesRaw
                  ? `${ctx.baseAmountFormatOrZero(sharesRaw)} shares minted`
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
