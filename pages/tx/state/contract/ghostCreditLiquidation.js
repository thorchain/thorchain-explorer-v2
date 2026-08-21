import moment from 'moment'
import { toAttrs } from './shared.js'
import { assetFromString, securedToAsset } from '~/utils'
import { getRujiraContractLabel } from '~/utils/rujiraContracts'

// Ghost Credit Account liquidation: single contract action with msg.liquidate.
export function buildGhostCreditLiquidationOverview(ctx) {
  const liquidateMsg = ctx.singleAction?.metadata?.contract?.msg?.liquidate
  if (!liquidateMsg) return null

  const action = ctx.singleAction
  const contractAddress = action.out?.[0]?.address || ''
  const contractLabel =
    getRujiraContractLabel(contractAddress) ||
    ctx.formatAddress(contractAddress)
  const productLabel = 'RUJI Money Market'
  const userAddress = action.in?.[0]?.address || ''
  const liquidatedAccount = liquidateMsg.addr || ''
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

  // Collateral: coin_spent from the credit account being liquidated
  let collateralAmount = 0
  let collateralDenom = ''
  if (liquidatedAccount) {
    const spentEvent = events.find(
      (e) =>
        e.type === 'coin_spent' &&
        (e.attributes || []).some(
          (a) => a.key === 'spender' && a.value === liquidatedAccount
        )
    )
    const amountAttr = (spentEvent?.attributes || []).find(
      (a) => a.key === 'amount'
    )
    if (amountAttr?.value) {
      const part = amountAttr.value.split(',')[0]?.trim() || ''
      collateralAmount = parseInt(part) || 0
      collateralDenom = part.replace(/^\d+/, '').trim()
    }
  }
  const collateralAssetStr = collateralDenom
    ? securedToAsset(collateralDenom).toUpperCase()
    : ''
  const collateralAssetParsed = collateralDenom
    ? (assetFromString(collateralDenom.toUpperCase()) ??
      assetFromString(collateralAssetStr))
    : null
  const collateralTicker = collateralAssetParsed?.ticker || collateralDenom

  // Repay event carries fee_liquidator (bare number) and the USDT denom via 'amount'
  const repayEvent = events.find(
    (e) => e.type === 'wasm-rujira-ghost-credit/liquidate.msg/repay'
  )
  const repayAttrs = repayEvent ? toAttrs(repayEvent) : {}
  // 'amount' = total USDT received from FIN swap, denom applies to all fee fields
  const repayTotalStr = repayAttrs.amount || ''
  const repayDenom = repayTotalStr.replace(/^\d+/, '').trim()
  const repayAssetStr = repayDenom
    ? securedToAsset(repayDenom).toUpperCase()
    : ''
  const repayAssetParsed = repayDenom
    ? (assetFromString(repayDenom.toUpperCase()) ??
      assetFromString(repayAssetStr))
    : null
  const repayTicker = repayAssetParsed?.ticker || repayDenom
  // Debt repaid (net, after fees)
  const repayAmount = parseInt(repayAttrs.repay_amount || '') || 0
  // Liquidator fee: bare number in same denom as 'amount'
  const feeLiquidatorAmount = parseInt(repayAttrs.fee_liquidator || '') || 0
  const feeLiquidatorTicker = repayTicker

  const feeProtocolRaw = parseInt(repayAttrs.fee_liquidation || '') || 0

  return {
    rawEvents: events,
    rawMsg: action?.metadata?.contract?.msg || null,
    title: `Liquidation: ${contractLabel}`,
    metaLabel: `Liquidation · ${productLabel}`,
    status,
    affiliateAddress: '',
    actionTypeTitle: 'contract',
    hasContractAction: true,
    labels: [],
    input: {
      asset: collateralAssetParsed ? collateralAssetStr : null,
      name: collateralTicker || 'Collateral',
      badge: ctx.getNetworkBadge(collateralAssetParsed) || '',
      amount: collateralAmount
        ? `${ctx.baseAmountFormatOrZero(collateralAmount)} ${collateralTicker}`
        : '-',
      usd: collateralAmount
        ? ctx.formatUsdValue(
            ctx.amountToUSD(collateralAssetStr, collateralAmount, ctx.pools)
          )
        : null,
      secure: collateralAssetParsed?.secure ?? false,
    },
    output: repayAmount
      ? {
          asset: repayAssetParsed ? repayAssetStr : null,
          name: repayTicker || 'USDT',
          badge: 'Debt repaid to Ghost Vault',
          amount: `${ctx.baseAmountFormatOrZero(repayAmount)} ${repayTicker}`,
          usd: ctx.formatUsdValue(
            ctx.amountToUSD(repayAssetStr, repayAmount, ctx.pools)
          ),
        }
      : null,
    metricRows: [
      collateralAmount
        ? {
            label: 'Collateral seized',
            value: `${ctx.baseAmountFormatOrZero(collateralAmount)} ${collateralTicker}`,
          }
        : null,
      repayAmount
        ? {
            label: 'Debt repaid',
            value: `${ctx.baseAmountFormatOrZero(repayAmount)} ${repayTicker}`,
          }
        : null,
      feeProtocolRaw
        ? {
            label: 'Protocol fee',
            value: `${ctx.baseAmountFormatOrZero(feeProtocolRaw)} ${feeLiquidatorTicker}`,
          }
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
        value: 'Liquidation',
        tone: ctx.getContractTypeTone('Liquidation'),
        type: 'product',
      },
      { label: 'Contract', value: contractLabel },
      liquidatedAccount
        ? {
            label: 'Liquidated Account',
            address: liquidatedAccount,
            type: 'address',
          }
        : null,
      { label: 'Status', value: status.label, type: 'status' },
      timestamp ? { label: 'Time', value: timestamp.format('lll') } : null,
      height ? { label: 'Block', value: `#${ctx.normalFormat(height)}` } : null,
      userAddress
        ? { label: 'Liquidator', address: userAddress, type: 'address' }
        : null,
    ].filter(Boolean),
    lifecycleRows: (() => {
      if (hasError) {
        return [
          {
            icon: 'WarningIcon',
            title: 'Liquidation failed',
            body: logs || '',
          },
        ]
      }
      const totalFeesRaw = feeLiquidatorAmount + feeProtocolRaw
      return [
        collateralAmount
          ? {
              icon: 'ArrowIcon',
              iconRotate: 90,
              title: 'Collateral seized',
              body: `${ctx.baseAmountFormatOrZero(collateralAmount)} ${collateralTicker}`,
            }
          : null,
        totalFeesRaw
          ? {
              icon: 'ArrowIcon',
              iconRotate: 90,
              title: 'Fees paid',
              body: `${ctx.baseAmountFormatOrZero(totalFeesRaw)} ${repayTicker}`,
            }
          : null,
        repayAmount
          ? {
              icon: 'CheckIcon',
              title: `${repayTicker} debt repaid`,
              body: `${ctx.baseAmountFormatOrZero(repayAmount)} ${repayTicker} repaid to Ghost Vault`,
            }
          : null,
      ].filter(Boolean)
    })(),
    feeRows: (() => {
      const toUsd = (amount) =>
        repayAssetStr ? ctx.amountToUSD(repayAssetStr, amount, ctx.pools) : 0
      const rows = []
      if (feeLiquidatorAmount) {
        rows.push({
          label: 'Liquidator Reward',
          usd: `$${ctx.formatFeeDisplay(toUsd(feeLiquidatorAmount))}`,
          subtle: `${ctx.baseAmountFormatOrZero(feeLiquidatorAmount)} ${feeLiquidatorTicker}`,
        })
      }
      if (feeProtocolRaw) {
        rows.push({
          label: 'Protocol Fee',
          usd: `$${ctx.formatFeeDisplay(toUsd(feeProtocolRaw))}`,
          subtle: `${ctx.baseAmountFormatOrZero(feeProtocolRaw)} ${repayTicker}`,
        })
      }
      if (rows.length > 1) {
        const totalUsd = rows.reduce((s, r) => s + ctx.parseUsdAmount(r.usd), 0)
        rows.push({
          label: 'Total Fees',
          usd: `$${ctx.formatFeeDisplay(totalUsd)}`,
          subtle: null,
          isTotal: true,
        })
      }
      return rows
    })(),
    technicalRows: [
      userAddress
        ? ctx.buildTechRow('Liquidator', userAddress, 'address')
        : null,
      contractAddress
        ? ctx.buildTechRow('Contract', contractAddress, 'address')
        : null,
      liquidatedAccount
        ? ctx.buildTechRow('Liquidated account', liquidatedAccount, 'address')
        : null,
    ].filter(Boolean),
    priority: true,
  }
}
