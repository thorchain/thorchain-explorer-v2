import moment from 'moment'
import { toAttrs } from './shared.js'
import { getRujiraContractLabel } from '~/utils/rujiraContracts'

// DAO proposal execution: check before the mixed-action guard because the
// proposal can trigger other action types (e.g., a swap) as side effects.
export function buildDaoProposalOverview(ctx) {
  const proposalAction = ctx.contractActions.find((a) => {
    const msg = a.metadata?.contract?.msg
    return (
      msg?.execute &&
      !Array.isArray(msg.execute) &&
      msg.execute.proposal_id !== undefined
    )
  })
  if (!proposalAction) return null

  const action = proposalAction
  const senderAddress = action.in?.[0]?.address || ''
  const events = action.metadata?.contract?.contractEvents || []
  const proposalId = action.metadata.contract.msg.execute.proposal_id
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

  const proposalWasmEvent = events.find(
    (e) =>
      e.type === 'wasm' &&
      (e.attributes || []).some((a) => a.key === 'proposal_id')
  )
  const wasmAttrs = proposalWasmEvent ? toAttrs(proposalWasmEvent) : {}
  const daoAddress = wasmAttrs.dao || ''
  const daoLabel =
    getRujiraContractLabel(daoAddress) ||
    (daoAddress ? ctx.formatAddress(daoAddress) : 'DAO')

  return {
    rawEvents: events,
    rawMsg: action?.metadata?.contract?.msg || null,
    title: `Execute Proposal #${proposalId}`,
    metaLabel: `Execute Proposal · ${daoLabel}`,
    status,
    affiliateAddress: '',
    actionTypeTitle: 'contract',
    hasContractAction: true,
    priority: true,
    labels: [],
    pairDisplay: null,
    input: {
      asset: null,
      name: 'Executor',
      badge: senderAddress ? ctx.formatAddress(senderAddress) : '',
      amount: `Proposal #${proposalId}`,
      usd: null,
    },
    output: {
      asset: null,
      name: 'DAO',
      badge: daoAddress ? ctx.formatAddress(daoAddress) : '',
      amount: status.label,
      usd: null,
    },
    metricRows: [
      { label: 'Proposal', value: `#${proposalId}` },
      timestamp
        ? {
            label: 'Time',
            value: timestamp.format('YYYY-MM-DD HH:mm:ss'),
          }
        : null,
    ].filter(Boolean),
    detailRows: [
      {
        label: 'Product',
        value: daoLabel,
        tone: ctx.getProductTone(daoLabel),
        type: 'product',
      },
      {
        label: 'Action',
        value: 'Execute Proposal',
        tone: ctx.getContractTypeTone('Execute Proposal'),
        type: 'product',
      },
      { label: 'Proposal', value: `#${proposalId}` },
      daoAddress
        ? { label: 'DAO', address: daoAddress, type: 'address' }
        : null,
      { label: 'Status', value: status.label, type: 'status' },
      timestamp ? { label: 'Time', value: timestamp.format('lll') } : null,
      height ? { label: 'Block', value: `#${ctx.normalFormat(height)}` } : null,
      senderAddress
        ? { label: 'Executor', address: senderAddress, type: 'address' }
        : null,
    ].filter(Boolean),
    lifecycleRows: [
      {
        icon: 'CheckIcon',
        title: `Proposal #${proposalId} executed`,
        body: daoAddress ? `DAO: ${ctx.formatAddress(daoAddress)}` : '',
      },
      ...(hasError && logs
        ? [{ icon: 'WarningIcon', title: 'Execution failed', body: logs }]
        : []),
    ],
    feeRows: [],
    technicalRows: [
      senderAddress
        ? ctx.buildTechRow('Executor', senderAddress, 'address')
        : null,
      daoAddress
        ? ctx.buildTechRow('DAO address', daoAddress, 'address')
        : null,
    ].filter(Boolean),
  }
}
