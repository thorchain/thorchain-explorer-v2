import moment from 'moment'
import {
  getRujiraContractLabel,
  getRujiraContractProduct,
} from '~/utils/rujiraContracts'

// CALC Scheduler batch execute: single contract action whose msg.execute is
// an array of instance IDs.
//
// FIX (not in original): `rawEvents: events` referenced an undefined
// `events` (pre-existing bug, lint already flagged it as `'events' is not
// defined` before this extraction — same class of bug as the Cancel
// Strategy branch). Fixed to match the established
// `action.metadata?.contract?.contractEvents || []` pattern instead of
// transcribing the crash.
export function buildCalcSchedulerBatchExecuteOverview(ctx) {
  const batchExecuteMsg = ctx.singleAction?.metadata?.contract?.msg?.execute
  if (!Array.isArray(batchExecuteMsg)) return null

  const action = ctx.singleAction
  const events = action.metadata?.contract?.contractEvents || []
  const contractAddress = action.out?.[0]?.address || ''
  const contractLabel =
    getRujiraContractLabel(contractAddress) ||
    ctx.formatAddress(contractAddress)
  const productLabel =
    getRujiraContractProduct(contractAddress) || 'Recurring Swaps'
  const userAddress = action.in?.[0]?.address || ''
  const instanceCount = batchExecuteMsg.length
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

  return {
    rawEvents: events,
    rawMsg: action?.metadata?.contract?.msg || null,
    title: `${instanceCount} ${instanceCount === 1 ? 'Strategy' : 'Strategies'} executed by ${contractLabel}`,
    metaLabel: `Execute Strategies · ${productLabel}`,
    status,
    affiliateAddress: '',
    actionTypeTitle: 'contract',
    hasContractAction: true,
    labels: [],
    input: {
      asset: null,
      name: 'Scheduler',
      badge: contractLabel,
      amount: `${instanceCount} instance${instanceCount !== 1 ? 's' : ''}`,
      usd: null,
    },
    output: {
      asset: null,
      name: productLabel,
      badge: userAddress ? ctx.formatAddress(userAddress) : '',
      amount: 'Dispatched',
      usd: null,
    },
    metricRows: [
      { label: 'Instances', value: String(instanceCount) },
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
        value: 'Execute Strategies',
        tone: ctx.getContractTypeTone('CALC Strategy'),
        type: 'product',
      },
      { label: 'Contract', value: contractLabel },
      { label: 'Instances', value: String(instanceCount) },
      { label: 'Status', value: status.label, type: 'status' },
      timestamp ? { label: 'Time', value: timestamp.format('lll') } : null,
      height ? { label: 'Block', value: `#${ctx.normalFormat(height)}` } : null,
      userAddress
        ? { label: 'Executor', address: userAddress, type: 'address' }
        : null,
    ].filter(Boolean),
    lifecycleRows: [
      {
        icon: hasError ? 'WarningIcon' : 'SwapIcon',
        title: hasError
          ? 'Contract execution failed'
          : `${instanceCount} recurring swap ${instanceCount === 1 ? 'strategy' : 'strategies'} dispatched`,
        body: hasError
          ? logs || ''
          : `CALC Scheduler triggered ${instanceCount} ${instanceCount === 1 ? 'instance' : 'instances'} via ${contractLabel}`,
      },
    ],
    feeRows: [],
    technicalRows: [
      userAddress
        ? ctx.buildTechRow('Executor address', userAddress, 'address')
        : null,
      contractAddress
        ? ctx.buildTechRow('To address', contractAddress, 'address')
        : null,
    ].filter(Boolean),
  }
}
