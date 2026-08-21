import moment from 'moment'
import { assetFromString, securedToAsset } from '~/utils'
import {
  getRujiraContractLabel,
  getRujiraContractProduct,
} from '~/utils/rujiraContracts'

// Yielding staking: single contract action with msg.account.bond / msg.account.unbond.
export function buildYieldingStakingBondOverview(ctx) {
  const yieldingAccountMsg = ctx.singleAction?.metadata?.contract?.msg?.account
  if (
    !yieldingAccountMsg ||
    !('bond' in yieldingAccountMsg || 'unbond' in yieldingAccountMsg)
  )
    return null

  const isStake = 'bond' in yieldingAccountMsg
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
  const actionType = isStake ? 'Yielding Stake' : 'Yielding Unstake'

  // Input: funds string, fall back to first coin_spent from user
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
  const amountRaw = parseInt(fundsStr) || 0
  const fundsAsset = fundsStr.replace(/^[\d]+/, '').trim()
  const inputAssetStr = fundsAsset
    ? securedToAsset(fundsAsset).toUpperCase()
    : 'THOR.RUNE'
  const inputAssetParsed = assetFromString(inputAssetStr)
  const inputTicker = inputAssetParsed?.ticker || 'RUNE'

  // Output: excess RUNE returned to user
  const excessEvent = userAddress
    ? events.find(
        (e) =>
          e.type === 'coin_received' &&
          (e.attributes || []).some(
            (a) => a.key === 'receiver' && a.value === userAddress
          ) &&
          (e.attributes || []).some(
            (a) => a.key === 'amount' && a.value.endsWith('rune')
          )
      )
    : null
  const excessAmountStr = excessEvent
    ? ((e) =>
        (e.attributes || []).find((a) => a.key === 'amount')?.value || '')(
        excessEvent
      )
    : ''
  const excessAmount = parseInt(excessAmountStr) || 0
  const excessTicker = 'RUNE'

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
      asset: inputAssetParsed ? inputAssetStr : null,
      name: inputTicker,
      badge: ctx.getNetworkBadge(inputAssetParsed) || '',
      amount: amountRaw
        ? `${ctx.baseAmountFormatOrZero(amountRaw)} ${inputTicker}`
        : '-',
      usd: amountRaw
        ? ctx.formatUsdValue(
            ctx.amountToUSD(inputAssetStr, amountRaw, ctx.pools)
          )
        : null,
      secure: inputAssetParsed?.secure ?? false,
    },
    output: excessAmount
      ? {
          asset: 'THOR.RUNE',
          name: excessTicker,
          badge: 'Excess returned',
          amount: `${ctx.baseAmountFormatOrZero(excessAmount)} ${excessTicker}`,
          usd: ctx.formatUsdValue(
            ctx.amountToUSD('THOR.RUNE', excessAmount, ctx.pools)
          ),
        }
      : null,
    metricRows: [
      amountRaw
        ? {
            label: isStake ? 'Staked' : 'Unstaked',
            value: `${ctx.baseAmountFormatOrZero(amountRaw)} ${inputTicker}`,
          }
        : null,
      excessAmount
        ? {
            label: 'Excess returned',
            value: `${ctx.baseAmountFormatOrZero(excessAmount)} ${excessTicker}`,
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
      { label: 'Contract', value: contractLabel },
      { label: 'Status', value: status.label, type: 'status' },
      timestamp ? { label: 'Time', value: timestamp.format('lll') } : null,
      height ? { label: 'Block', value: `#${ctx.normalFormat(height)}` } : null,
      userAddress
        ? { label: 'User', address: userAddress, type: 'address' }
        : null,
    ].filter(Boolean),
    lifecycleRows: [
      ...ctx.extractContractEventRows(action),
      ...(hasError && logs
        ? [{ icon: 'WarningIcon', title: `${actionType} failed`, body: logs }]
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
    priority: true,
  }
}
