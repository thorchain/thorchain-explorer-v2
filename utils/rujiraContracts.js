import registry from '~/data/contracts/rujira-mainnet.json'

const addressEntries = registry?.addresses || {}

function normalizeAddress(address = '') {
  return address?.toLowerCase?.() || ''
}

export function getRujiraContractEntry(address = '') {
  const normalized = normalizeAddress(address)
  if (!normalized) return null

  const match = Object.entries(addressEntries).find(
    ([entryAddress]) => normalizeAddress(entryAddress) === normalized
  )

  return match ? match[1] : null
}

export function getRujiraContractLabel(address = '') {
  const entry = getRujiraContractEntry(address)
  if (!entry) return ''

  return entry.name || entry.contractLabel || ''
}

export function getRujiraContractProduct(address = '') {
  const entry = getRujiraContractEntry(address)
  if (!entry) return ''

  return entry.product || ''
}

export function getRujiraContractLabelMap() {
  return Object.entries(addressEntries).reduce((acc, [address, entry]) => {
    const label = entry?.name || entry?.contractLabel
    if (label) {
      acc[normalizeAddress(address)] = label
    }
    return acc
  }, {})
}
