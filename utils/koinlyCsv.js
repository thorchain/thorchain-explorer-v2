import { assetFromString, assetToString, securedToAsset } from './index'

export const KOINLY_CSV_TOOLTIP =
  'This is an experimental feature, you should always check your transactions and consult a professional tax advisor if you are in doubt.'

export const KOINLY_UNIVERSAL_HEADERS = [
  'Date',
  'Sent Amount',
  'Sent Currency',
  'Received Amount',
  'Received Currency',
  'Fee Amount',
  'Fee Currency',
  'Net Worth Amount',
  'Net Worth Currency',
  'Tag',
  'Description',
  'TxHash',
]

const BASE_DECIMALS = 8
const THOR_DENOM_ASSETS = {
  auto: 'THOR.AUTO',
  lqdy: 'THOR.LQDY',
  nami: 'THOR.NAMI',
  rune: 'THOR.RUNE',
  ruji: 'THOR.RUJI',
  sruji: 'THOR.sRUJI',
  tcy: 'THOR.TCY',
}

export function buildKoinlyUniversalCsv(actions = [], ownerAddress = '') {
  const exportActions = dropDuplicateSendActions(actions, ownerAddress)
  const rows = exportActions
    .flatMap((action, index) =>
      buildKoinlyRows(action, ownerAddress).map((row) => ({
        ...row,
        _index: index,
      }))
    )
    .sort((a, b) => {
      if (a._timestamp === b._timestamp) {
        return a._index - b._index
      }
      return a._timestamp - b._timestamp
    })
    .map(({ _timestamp, _index, ...row }) => row)

  return [
    KOINLY_UNIVERSAL_HEADERS,
    ...rows.map((row) =>
      KOINLY_UNIVERSAL_HEADERS.map((header) => row[header] || '')
    ),
  ]
    .map((line) => line.map(escapeCsvValue).join(','))
    .join('\n')
}

export function downloadCsv(filename, csvContent) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export function makeKoinlyFilename(address, date = new Date()) {
  const stamp = [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    '-',
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
  ].join('')

  return `thorchain-${sanitizeFilename(address)}-${stamp}.csv`
}

export function buildKoinlyRows(action, ownerAddress = '') {
  const sentCoins = groupCoins(getOwnerSentCoins(action, ownerAddress))
  const receivedCoins = groupCoins(getOwnerReceivedCoins(action, ownerAddress))

  if (!sentCoins.length && !receivedCoins.length) {
    return []
  }

  const tag = inferKoinlyTag(action)
  const txHash = getActionHash(action)
  const date = formatKoinlyDate(action?.date)
  const description = buildDescription(action, tag)
  const timestamp = Number(action?.date || 0)
  const rowCount = Math.max(sentCoins.length, receivedCoins.length)
  const feeCoin = rowCount === 1 ? getSingleFeeCoin(action) : null
  const rows = []

  for (let index = 0; index < rowCount; index++) {
    const sent = sentCoins[index]
    const received = receivedCoins[index]

    rows.push({
      Date: date,
      'Sent Amount': sent ? formatBaseAmount(sent.amountBase) : '',
      'Sent Currency': sent?.currency || '',
      'Received Amount': received ? formatBaseAmount(received.amountBase) : '',
      'Received Currency': received?.currency || '',
      'Fee Amount': feeCoin ? formatBaseAmount(feeCoin.amountBase) : '',
      'Fee Currency': feeCoin?.currency || '',
      'Net Worth Amount': '',
      'Net Worth Currency': '',
      Tag: tag,
      Description: description,
      TxHash: txHash,
      _timestamp: timestamp,
    })
  }

  return rows
}

function dropDuplicateSendActions(actions, ownerAddress) {
  const duplicateKeys = new Set()

  actions.filter(isDuplicateSourceAction).forEach((action) => {
    getOwnerCoinMovementKeys(action, ownerAddress).forEach((key) =>
      duplicateKeys.add(key)
    )
  })

  if (duplicateKeys.size === 0) {
    return actions
  }

  return actions.filter((action) => {
    if (action?.type !== 'send') {
      return true
    }

    return !isDuplicateSendAction(action, ownerAddress, duplicateKeys)
  })
}

function isDuplicateSendAction(action, ownerAddress, duplicateKeys) {
  return getOwnerCoinMovementKeys(action, ownerAddress).some((key) =>
    duplicateKeys.has(key)
  )
}

function isDuplicateSourceAction(action) {
  return action?.type && action.type !== 'send'
}

function getOwnerCoinMovementKeys(action, ownerAddress) {
  return getOwnerCoinMovements(action, ownerAddress).map(
    ({ direction, height, coin }) =>
      `coin:${direction}:${height}:${coin.currency}:${coin.amountBase}`
  )
}

function getOwnerCoinMovements(action, ownerAddress) {
  const owner = normalizeAddress(ownerAddress)
  const sent = (action?.in || [])
    .filter((entry) => isOwnerAddress(entry?.address, owner))
    .flatMap((entry) =>
      getEntryCoins(entry).map((coin) => ({
        coin,
        direction: 'sent',
        height: entry?.height || action?.height || '',
      }))
    )
  const received = (action?.out || [])
    .filter(
      (entry) => !entry?.affiliate && isOwnerAddress(entry?.address, owner)
    )
    .flatMap((entry) =>
      getEntryCoins(entry).map((coin) => ({
        coin,
        direction: 'received',
        height: entry?.height || action?.height || '',
      }))
    )

  return [...sent, ...received]
}

function getOwnerSentCoins(action, ownerAddress) {
  const owner = normalizeAddress(ownerAddress)
  const inCoins = (action?.in || [])
    .filter((entry) => isOwnerAddress(entry?.address, owner))
    .flatMap((entry) => getEntryCoins(entry))

  if (inCoins.length) {
    return inCoins
  }

  const fromAddress = normalizeAddress(action?.in?.[0]?.address)
  const funds = action?.metadata?.contract?.funds
  if (funds && (!owner || owner === fromAddress)) {
    return parseDenomCoins(funds)
  }

  return []
}

function getOwnerReceivedCoins(action, ownerAddress) {
  const owner = normalizeAddress(ownerAddress)
  const outCoins = (action?.out || [])
    .filter(
      (entry) => !entry?.affiliate && isOwnerAddress(entry?.address, owner)
    )
    .flatMap((entry) => getEntryCoins(entry))

  if (outCoins.length) {
    return outCoins
  }

  const events = action?.metadata?.contract?.contractEvents || []
  return events
    .filter((event) => event?.type === 'coin_received')
    .flatMap((event) => {
      const attrs = getEventAttrs(event)
      if (!isOwnerAddress(attrs.receiver, owner)) {
        return []
      }
      return parseDenomCoins(attrs.amount)
    })
}

function getEntryCoins(entry) {
  return (entry?.coins || [])
    .map((coin) => toExportCoin(coin?.amount, coin?.asset))
    .filter(Boolean)
}

function getSingleFeeCoin(action) {
  const fees = [
    ...(action?.metadata?.swap?.networkFees || []),
    ...(action?.metadata?.withdraw?.networkFees || []),
    ...(action?.metadata?.runePoolWithdraw?.networkFees || []),
  ]
    .map((fee) => toExportCoin(fee?.amount, fee?.asset))
    .filter(Boolean)

  const groupedFees = groupCoins(fees)
  return groupedFees.length === 1 ? groupedFees[0] : null
}

function toExportCoin(amount, asset) {
  const amountBase = toBaseAmount(amount)
  const currency = toKoinlyCurrency(asset)

  if (amountBase <= BigInt(0) || !currency) {
    return null
  }

  return {
    amountBase,
    currency,
  }
}

function groupCoins(coins) {
  const grouped = coins.reduce((acc, coin) => {
    if (!acc[coin.currency]) {
      acc[coin.currency] = {
        amountBase: BigInt(0),
        currency: coin.currency,
      }
    }
    acc[coin.currency].amountBase += coin.amountBase
    return acc
  }, {})

  return Object.values(grouped)
}

function parseDenomCoins(value = '') {
  return `${value}`
    .split(',')
    .map((coin) => {
      const match = coin.trim().match(/^([0-9]+)(.+)$/)
      if (!match) {
        return null
      }

      const asset = normalizeDenomAsset(match[2])
      return toExportCoin(match[1], asset)
    })
    .filter(Boolean)
}

function normalizeDenomAsset(denom = '') {
  const raw = `${denom}`.trim()
  const lower = raw.toLowerCase()

  if (!raw) {
    return ''
  }

  if (THOR_DENOM_ASSETS[lower]) {
    return THOR_DENOM_ASSETS[lower]
  }

  const parsed = assetFromString(raw.toUpperCase())
  if (parsed && typeof parsed === 'object') {
    return assetToString(parsed)
  }

  const secured = securedToAsset(raw).toUpperCase()
  const securedParsed = assetFromString(secured)
  if (securedParsed && typeof securedParsed === 'object') {
    return assetToString(securedParsed)
  }

  return raw.toUpperCase()
}

function inferKoinlyTag(action) {
  const type = normalizeActionType(action)

  if (['addLiquidity', 'runePoolDeposit'].includes(type)) {
    return 'liquidity in'
  }

  if (['withdraw', 'runePoolWithdraw'].includes(type)) {
    return 'liquidity out'
  }

  if (type === 'tcy_claim') {
    return 'reward'
  }

  if (isLimitOrderCreate(action) || isCclPositionIncrease(action)) {
    return 'liquidity in'
  }

  if (isLimitOrderExit(action) || isCclPositionExit(action)) {
    return 'liquidity out'
  }

  return ''
}

function normalizeActionType(action) {
  if (action?.type === 'swap') {
    const txType = action?.metadata?.swap?.txType
    if (txType === 'add') {
      return 'addLiquidity'
    }
    if (txType === 'withdraw') {
      return 'withdraw'
    }
  }

  return action?.type || ''
}

function isLimitOrderCreate(action) {
  const msg = action?.metadata?.contract?.msg || {}
  return !!msg.order
}

function isLimitOrderExit(action) {
  const eventTypes = getContractEventTypes(action)
  const msgText = getContractMsgText(action)

  return (
    eventTypes.some((type) =>
      [
        'wasm-rujira-fin/order.cancel',
        'wasm-rujira-fin/order.retract',
        'wasm-rujira-fin/order.withdraw',
      ].includes(type)
    ) ||
    (msgText.includes('order') && /cancel|claim|retract|withdraw/.test(msgText))
  )
}

function isCclPositionIncrease(action) {
  const eventTypes = getContractEventTypes(action)
  const msgText = getContractMsgText(action)

  return (
    eventTypes.includes('wasm-rujira-fin/range.create') ||
    (msgText.includes('range') &&
      /create|increase|deposit|provide/.test(msgText))
  )
}

function isCclPositionExit(action) {
  const eventTypes = getContractEventTypes(action)
  const msgText = getContractMsgText(action)

  return (
    eventTypes.some(
      (type) =>
        type.startsWith('wasm-rujira-fin/range.') &&
        /claim|close|delete|remove|retract|withdraw/.test(type)
    ) ||
    (msgText.includes('range') &&
      /claim|close|remove|retract|withdraw/.test(msgText))
  )
}

function getContractEventTypes(action) {
  return (action?.metadata?.contract?.contractEvents || []).map(
    (event) => event?.type || ''
  )
}

function getContractMsgText(action) {
  try {
    return JSON.stringify(action?.metadata?.contract?.msg || {}).toLowerCase()
  } catch (e) {
    return ''
  }
}

function getEventAttrs(event) {
  return Object.fromEntries(
    (event?.attributes || []).map(({ key, value }) => [key, value])
  )
}

function getActionHash(action) {
  return (
    action?.in?.find((entry) => entry?.txID)?.txID ||
    action?.out?.find((entry) => entry?.txID)?.txID ||
    ''
  )
}

function buildDescription(action, tag) {
  const type = normalizeActionType(action)
  const parts = []

  if (type) {
    parts.push(type)
  }

  if (tag) {
    parts.push(tag)
  }

  if (action?.status && action.status !== 'success') {
    parts.push(action.status)
  }

  return parts.join(' - ')
}

function toKoinlyCurrency(assetStr = '') {
  const parsed = assetFromString(assetStr)

  if (!parsed || typeof parsed !== 'object') {
    return `${assetStr}`.replace(/^.*[./~-]/, '').toUpperCase()
  }

  const ticker = cleanTicker(parsed.ticker || parsed.symbol)
  if (!ticker) {
    return ''
  }

  if (parsed.address && !parsed.synth && !parsed.trade && !parsed.secure) {
    return `${ticker}:${parsed.address}:${parsed.chain}`
  }

  return ticker
}

function cleanTicker(value = '') {
  return `${value}`
    .split('-')[0]
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
}

function toBaseAmount(value) {
  const stringValue = `${value || ''}`.trim()
  if (!/^[0-9]+$/.test(stringValue)) {
    return BigInt(0)
  }
  return BigInt(stringValue)
}

function formatBaseAmount(amountBase) {
  const isNegative = amountBase < BigInt(0)
  const abs = `${isNegative ? amountBase * BigInt(-1) : amountBase}`.padStart(
    BASE_DECIMALS + 1,
    '0'
  )
  const whole = abs.slice(0, -BASE_DECIMALS) || '0'
  const fraction = abs.slice(-BASE_DECIMALS).replace(/0+$/, '')
  return `${isNegative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`
}

function formatKoinlyDate(timestamp) {
  const date = new Date(Number(timestamp || 0) / 1e6)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return (
    [
      date.getUTCFullYear(),
      pad(date.getUTCMonth() + 1),
      pad(date.getUTCDate()),
    ].join('-') +
    ` ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(
      date.getUTCSeconds()
    )}`
  )
}

function pad(value) {
  return `${value}`.padStart(2, '0')
}

function normalizeAddress(address = '') {
  return `${address}`.toLowerCase()
}

function isOwnerAddress(address, owner) {
  return !owner || normalizeAddress(address) === owner
}

function escapeCsvValue(value) {
  const stringValue = `${value ?? ''}`
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

function sanitizeFilename(value = '') {
  return `${value}`.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 80) || 'address'
}
