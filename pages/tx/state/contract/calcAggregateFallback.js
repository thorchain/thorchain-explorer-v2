import moment from 'moment'
import { getRujiraContractLabel } from '~/utils/rujiraContracts'

// Generic CALC aggregate fallback: unlike every other module in this
// registry, this one inspects ctx.rawActions directly (not
// ctx.contractActions/ctx.singleAction) and has its own internal guard —
// it always runs last, after every more specific product module has had a
// chance to match.
export function buildCalcAggregateOverview(ctx) {
  const contractTypes = ctx.rawActions.map(
    (a) => a.metadata?.contract?.contractType ?? ''
  )
  const isCalc = contractTypes.some((ct) => ct.includes('calc'))
  if (!isCalc) return null

  const tradeActions = ctx.rawActions.filter((a) =>
    (a.metadata?.contract?.contractType ?? '').includes('fin/trade')
  )
  const tradeCount = tradeActions.length

  // Determine overall status from all actions
  const hasError = ctx.rawActions.some(
    (a) => (a.metadata?.contract?.code ?? 0) > 0
  )
  const logs = ctx.rawActions.find((a) => (a.metadata?.contract?.code ?? 0) > 0)
    ?.metadata?.contract?.logs
  const allSuccess = ctx.rawActions.every((a) => a.status === 'success')
  const status = hasError
    ? { label: 'Failed', tone: 'red' }
    : allSuccess
      ? { label: 'Success', tone: 'green' }
      : { label: 'Pending', tone: 'blue' }

  // Strategy address from calc-manager action
  const managerAction = ctx.rawActions.find((a) =>
    (a.metadata?.contract?.contractType ?? '').includes('calc-manager')
  )
  const strategyAddress =
    managerAction?.metadata?.contract?.attributes?.strategy_address ||
    managerAction?.in?.[0]?.address ||
    ''
  const executorAddress =
    managerAction?.metadata?.contract?.attributes?.executor || ''

  // Collect unique pair contract addresses from fin/trade actions
  const pairAddresses = [
    ...new Set(tradeActions.map((a) => a.out?.[0]?.address).filter(Boolean)),
  ]
  const pairLabels = pairAddresses
    .map((addr) => getRujiraContractLabel(addr) || ctx.formatAddress(addr))
    .join(', ')

  // Aggregate rates from fin/trade
  const rates = tradeActions
    .map((a) => {
      const attrs = a.metadata?.contract?.attributes ?? {}
      return attrs.rate ? parseFloat(attrs.rate) : null
    })
    .filter((r) => r !== null && !isNaN(r))
  const avgRate = rates.length
    ? rates.reduce((s, r) => s + r, 0) / rates.length
    : null

  const date = ctx.rawActions[0]?.date
  const timestamp = date ? moment.unix(parseInt(date) / 1e9) : null

  return {
    title: `${tradeCount} Recurring Swap${tradeCount !== 1 ? 's' : ''} executed`,
    metaLabel: 'Recurring Swaps · CALC',
    status,
    affiliateAddress: '',
    actionTypeTitle: 'contract',
    labels: [],
    input: {
      asset: 'THOR.RUJI',
      name: 'Strategy',
      badge: strategyAddress ? ctx.formatAddress(strategyAddress) : 'CALC',
      amount: `${tradeCount} trade${tradeCount !== 1 ? 's' : ''}`,
      usd: null,
    },
    output: {
      asset: null,
      name: 'RUJI Trade',
      badge: pairLabels || 'Orderbook',
      amount: avgRate ? `Avg rate ${avgRate.toFixed(6)}` : 'Executed',
      usd: null,
    },
    metricRows: [
      { label: 'Trades Executed', value: `${tradeCount}` },
      pairLabels ? { label: 'Pairs', value: pairLabels } : null,
      avgRate
        ? { label: 'Avg Exchange Rate', value: avgRate.toFixed(6) }
        : null,
      timestamp
        ? { label: 'Time', value: timestamp.format('YYYY-MM-DD HH:mm:ss') }
        : null,
    ].filter(Boolean),
    detailRows: [
      {
        label: 'Product',
        value: 'Recurring Swaps',
        tone: ctx.getProductTone('Recurring Swaps'),
        type: 'product',
      },
      {
        label: 'Action',
        value: 'CALC Strategy',
        tone: ctx.getContractTypeTone('CALC Strategy'),
        type: 'product',
      },
      { label: 'Status', value: status.label, type: 'status' },
      timestamp ? { label: 'Time', value: timestamp.format('lll') } : null,
      executorAddress
        ? { label: 'Executor', value: ctx.formatAddress(executorAddress) }
        : null,
    ].filter(Boolean),
    lifecycleRows:
      hasError && logs
        ? [
            {
              icon: 'WarningIcon',
              title: 'Contract execution failed',
              body: logs,
            },
          ]
        : [],
    feeRows: [],
    technicalRows: [
      strategyAddress
        ? ctx.buildTechRow('Strategy address', strategyAddress, 'address')
        : null,
      executorAddress
        ? ctx.buildTechRow('Executor address', executorAddress, 'address')
        : null,
    ].filter(Boolean),
  }
}
