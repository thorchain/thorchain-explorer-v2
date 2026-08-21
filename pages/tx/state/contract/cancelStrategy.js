import moment from 'moment'
import {
  getRujiraContractLabel,
  getRujiraContractProduct,
} from '~/utils/rujiraContracts'

// Cancel strategy: single contract action with msg.cancel_instance.
//
// FIX (not in original): the original branch returned `rawEvents: events`
// where `events` was never defined in scope — a pre-existing crash bug
// (lint already flagged it as `'events' is not defined` before this
// extraction; every other branch computes `events` the same way this one
// now does). Rendering a Cancel Strategy tx would have thrown a
// ReferenceError. Fixed here to match the established pattern rather than
// transcribed as a crash.
export function buildCancelStrategyOverview(ctx) {
  const cancelMsg = ctx.singleAction?.metadata?.contract?.msg?.cancel_instance
  if (!cancelMsg) return null

  const action = ctx.singleAction
  const events = action.metadata?.contract?.contractEvents || []
  const contractAddress = action.out?.[0]?.address || ''
  const contractLabel =
    getRujiraContractLabel(contractAddress) ||
    ctx.formatAddress(contractAddress)
  const productLabel = getRujiraContractProduct(contractAddress) || 'AutoRujira'
  const userAddress = action.in?.[0]?.address || ''
  const instanceId = cancelMsg.instance_id
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
    title: `Strategy #${instanceId} cancelled`,
    metaLabel: `Cancel Strategy · ${productLabel}`,
    status,
    affiliateAddress: '',
    actionTypeTitle: 'contract',
    hasContractAction: true,
    labels: [],
    input: {
      asset: null,
      name: 'User',
      badge: userAddress ? ctx.formatAddress(userAddress) : '',
      amount: `Instance #${instanceId}`,
      usd: null,
    },
    output: {
      asset: null,
      name: productLabel,
      badge: contractLabel,
      amount: 'Cancelled',
      usd: null,
    },
    metricRows: [
      { label: 'Instance ID', value: `#${instanceId}` },
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
        value: 'Cancel Strategy',
        tone: ctx.getContractTypeTone('Cancel Strategy'),
        type: 'product',
      },
      { label: 'Contract', value: contractLabel },
      { label: 'Instance ID', value: `#${instanceId}` },
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
        title: `Strategy #${instanceId} cancelled`,
        body: `Workflow instance cancelled on ${productLabel}`,
      },
      ...(hasError && logs
        ? [
            {
              icon: 'WarningIcon',
              title: 'Contract execution failed',
              body: logs,
            },
          ]
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
