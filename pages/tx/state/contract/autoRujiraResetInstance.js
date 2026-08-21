import moment from 'moment'
import { toAttrs } from './shared.js'
import {
  getRujiraContractLabel,
  getRujiraContractProduct,
} from '~/utils/rujiraContracts'

// AutoRujira Reset Instance: single contract action with msg.reset_instance.
export function buildAutoRujiraResetInstanceOverview(ctx) {
  const resetInstanceMsg =
    ctx.singleAction?.metadata?.contract?.msg?.reset_instance
  if (!resetInstanceMsg) return null

  const action = ctx.singleAction
  const contractAddress = action.out?.[0]?.address || ''
  const contractLabel =
    getRujiraContractLabel(contractAddress) ||
    ctx.formatAddress(contractAddress)
  const productLabel = getRujiraContractProduct(contractAddress) || 'AutoRujira'
  const callerAddress = action.in?.[0]?.address || ''
  const instanceId = resetInstanceMsg.instance_id
  const targetUser = resetInstanceMsg.user_address || ''
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
  const resetEvent = events.find(
    (e) => e.type === 'wasm-autorujira-workflow-manager/reset_instance'
  )
  const resetAttrs = resetEvent ? toAttrs(resetEvent) : {}
  const executionType = resetAttrs.execution_type || ''

  return {
    rawEvents: events,
    rawMsg: action?.metadata?.contract?.msg || null,
    title: `Reset Instance #${instanceId}`,
    metaLabel: `Reset Instance · ${productLabel}`,
    status,
    affiliateAddress: '',
    actionTypeTitle: 'contract',
    hasContractAction: true,
    labels: [],
    input: {
      asset: null,
      name: productLabel,
      badge: contractLabel,
      amount: `Instance #${instanceId}`,
      usd: null,
    },
    output: {
      asset: null,
      name: 'User',
      badge: targetUser ? ctx.formatAddress(targetUser) : '',
      amount: executionType ? `${executionType} reset` : 'Reset',
      usd: null,
    },
    metricRows: [
      { label: 'Instance', value: `#${instanceId}` },
      executionType ? { label: 'Execution type', value: executionType } : null,
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
        value: 'Reset Instance',
        tone: ctx.getContractTypeTone('Reset Instance'),
        type: 'product',
      },
      { label: 'Contract', value: contractLabel },
      { label: 'Instance ID', value: `#${instanceId}` },
      executionType ? { label: 'Execution type', value: executionType } : null,
      { label: 'Status', value: status.label, type: 'status' },
      timestamp ? { label: 'Time', value: timestamp.format('lll') } : null,
      height ? { label: 'Block', value: `#${ctx.normalFormat(height)}` } : null,
      targetUser
        ? { label: 'User', address: targetUser, type: 'address' }
        : null,
      callerAddress
        ? { label: 'Caller', address: callerAddress, type: 'address' }
        : null,
    ].filter(Boolean),
    lifecycleRows: [
      {
        icon: hasError ? 'WarningIcon' : 'RefreshIcon',
        title: hasError
          ? 'Contract execution failed'
          : `Instance #${instanceId} reset`,
        body: hasError
          ? logs || ''
          : [
              executionType ? `Execution type: ${executionType}` : null,
              targetUser ? `for ${ctx.formatAddress(targetUser)}` : null,
            ]
              .filter(Boolean)
              .join(' · '),
      },
    ],
    feeRows: [],
    technicalRows: [
      callerAddress
        ? ctx.buildTechRow('Caller address', callerAddress, 'address')
        : null,
      targetUser
        ? ctx.buildTechRow('User address', targetUser, 'address')
        : null,
      contractAddress
        ? ctx.buildTechRow('To address', contractAddress, 'address')
        : null,
    ].filter(Boolean),
  }
}
