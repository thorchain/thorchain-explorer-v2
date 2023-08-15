import { AssetCurrencySymbol, AssetRuneNative, assetToString, isSynthAsset } from '@xchainjs/xchain-util'
import { compact, countBy } from 'lodash'
import moment from 'moment'

const SYNTH_DELIMITER = '/'
const NON_SYNTH_DELIMITER = '.'

// Formats time in seconds into `dd:hh:mm hrs`
export function formatTime (seconds) {
  seconds = Number(seconds)
  const d = Math.floor(seconds / (3600 * 24))
  const h = Math.floor(seconds % (3600 * 24) / 3600)
  const m = Math.floor(seconds % 3600 / 60)
  const s = Math.floor(seconds % 60)

  const comms = c => (c > 0 ? ', ' : '')

  const dDisplay = d > 0 ? d + (d === 1 ? ' day' : ' days') : ''
  const hDisplay = h > 0 ? h + (h === 1 ? ' hour' : ' hours') : ''
  const mDisplay = m > 0 ? m + (m === 1 ? ' minute' : ' minutes') : ''
  const sDisplay = s > 0 ? s + (s === 1 ? ' second' : ' seconds') : ''
  return dDisplay + comms(d && h) + hDisplay + comms((h && m) || (d && m)) + mDisplay + comms((m && s) || (d && s) || (h && s)) + sDisplay
}

export function blockTime (blockHeight) {
  const val = (blockHeight) * 6
  return formatTime(val)
}

export function momentTimeFormat (time) {
  return moment(time).format('MM/DD/YYYY hh:mm:ss A')
}

export function parseCosmosTx (ntx) {
  const ret = []
  ntx.tx?.body?.messages?.forEach((el) => {
    const assetName = `THOR.${el?.amount?.length > 0 && el.amount[0]?.denom}`.toLocaleUpperCase()
    // Send messages
    switch (el['@type']) {
      case '/types.MsgSend':

        ret.push({
          type: 'Send',
          inout: [[{
            is: el?.amount[0],
            address: el.to_address,
            outAddress: el.from_address,
            txID: ntx?.tx_response?.txhash,
            asset: {
              name: assetName,
              amount: el?.amount[0].amount / 10 ** 8
            }
          }]],
          gas: [+ntx?.tx_response?.gas_used / 10 ** 8 + ' ' + assetName],
          date: moment(ntx?.tx_response.timestamp).format('MM/DD/YYYY hh:mm:ss A'),
          height: +ntx?.tx_response.height
        })
        break

      // Deposit messages
      case '/types.MsgDeposit':
        ret.push({
          type: 'Deposit/Withdraw',
          inout: [[{
            is: el?.amount[0],
            address: el.signer,
            txID: ntx?.tx_response?.txhash,
            asset: {
              name: assetName,
              amount: el?.amount[0].amount / 10 ** 8
            }
          }]],
          gas: [+ntx?.tx_response?.gas_used / 10 ** 8 + ' ' + assetName],
          memo: el.memo,
          txID: ntx?.tx_response?.txhash,
          date: moment(ntx?.tx_response.timestamp).format('MM/DD/YYYY, hh:mm:ss A'),
          height: +ntx?.tx_response.height
        })
        break

      default:
        break
    }
  })

  return ret[0]
}

export function parseExtraSwap (ntx) {
  const { tx: { tx: inboundTx }, out_txs: outTxs } = ntx
  let affiliateFee
  // has affiliate fee
  if (outTxs?.length > 1 && ntx.tx?.out_hashes?.length > 1) {
    const thorTx = outTxs?.find(e => e.chain === 'THOR')
    affiliateFee = thorTx?.coins
  }

  return {
    inChain: inboundTx?.chain,
    inboundHeight: ntx.tx?.external_observed_height,
    inboundGases: inboundTx?.gas,
    inSigners: ntx.tx?.signers,
    outboundGases: outTxs?.map(e => e.gas)?.flat(),
    affiliateFee,
    txOutDelay: (ntx.outbound_height - ntx.finalised_height) * 6
  }
}

function checkSynth (asset) {
  if (!asset) {
    return false
  }
  return isSynthAsset(assetFromString(asset))
}

export function parseMidgardTx (tx) {
  // get action
  const firstTxAction = tx.actions[0]
  const status = tx.actions.map(t => t.status)

  const res = {
    type: firstTxAction.type,
    inout: [],
    date: (new Date(firstTxAction?.date / 10 ** 6)),
    height: firstTxAction.height,
    pools: firstTxAction.pools,
    status: status.includes('success') ? 'success' : status[0],
    liqidityFee: firstTxAction.metadata,
    synth: false,
    label: []
  }

  tx.actions.forEach((txa, i) => {
    const insouts = [
      txa?.in?.map((t) => {
        res.synth = checkSynth(t?.coins[0]?.asset)

        return {
          is: t?.coins[0]?.asset || t?.txID,
          address: t?.address ?? '',
          txID: t?.txID ?? '',
          asset: {
            name: t?.coins[0]?.asset,
            amount: t?.coins[0]?.amount / 10 ** 8
          },
          status: txa?.status,
          type: txa?.type
        }
      }),
      txa?.out?.map((t) => {
        if (t?.coins.length <= 0) {
          return {}
        }

        res.synth = checkSynth(t?.coins[0]?.asset)

        return {
          is: t.coins[0]?.asset,
          address: t?.address ?? '',
          txID: t?.txID ?? '',
          asset: {
            name: t?.coins[0]?.asset,
            amount: t?.coins[0]?.amount / 10 ** 8
          },
          status: txa?.status,
          type: txa?.type
        }
      })
    ]

    // ignore noop txs
    if (txa?.metadata?.swap?.memo === 'noop') {
      return
    }

    res.inout.push(insouts)
  })

  if (firstTxAction.metadata) {
    res.gas = firstTxAction.metadata[firstTxAction.type]?.networkFees?.map(f => (f.amount / 10 ** 8 + ' ' + f.asset))
    res.memo = firstTxAction.metadata[firstTxAction.type]?.memo
    if (res.type === 'swap') {
      const memos = tx.actions?.map(a => a.metadata?.swap?.memo)
      res.memo = memos.find(m => m && m !== '' && m !== 'noop')
    }
  }

  const hasAddOrWithdraw = res.inout.find(t => !!((t[0][0].type === 'addLiquidity' || t[0][0].type === 'withdrawLiquidity')))
  const isStreamSwap = res.type === 'swap' && res.memo.match(/.+\/\d+/g)
  const isLoanTx = res.type === 'swap' && ['loan-', 'loan+', '$-', '$+'].includes(res.memo.split(':')[0].toLowerCase())
  // merge two txs one with affilitate fee
  if (res.inout.length > 1 && !hasAddOrWithdraw && !isStreamSwap && !isLoanTx) {
    const ins = res.inout.map(e => e[0][0])
    const hash = ins.find(e => !!e.txID).txID
    if (ins.every(e => e.txID === hash)) {
      if (res.inout[0][1].length > res.inout[1][1]) {
        res.inout[0][0][0].asset.amount += res.inout[1][0][0].asset.amount
        // minBy(res.inout[0][1], e => e.asset.amount).label = 'affiliate fee'
        res.inout.pop()
      } else {
        res.inout[1][0][0].asset.amount += res.inout[0][0][0].asset.amount
        // minBy(res.inout[1][1], e => e.asset.amount).label = 'affiliate fee'
        res.inout.shift()
      }
    }
  }

  if (isStreamSwap) {
    res.label.push('streaming')
  }

  if (isLoanTx) {
    res.label.push('loan tx')
  }

  return res
}

const memoToType = {
  add: 'add',
  '+': 'add',
  withdraw: 'withdraw',
  wd: 'withdraw',
  '-': 'withdraw',
  swap: 'swap',
  s: 'swap',
  '=': 'swap',
  limito: 'order',
  lo: 'order',
  out: 'outbound',
  donate: 'donate',
  d: 'donate',
  bond: 'bond',
  unbond: 'unbound',
  leave: 'leave',
  'yggdrasil+': 'YggdrasilFund',
  'yggdrasil-': 'YggdrasilReturn',
  reserve: 'TxReserve',
  refund: 'refund',
  migrate: 'migrate',
  ragnarok: 'ragnarok',
  switch: 'switch',
  noop: 'noop',
  consolidate: 'consolidate',
  name: 'thorname',
  n: 'thorname',
  '~': 'thorname',
  '$+': 'loanOpen',
  'loan+': 'loanOpen',
  '$-': 'loanRepayment',
  'loan-': 'loanRepayment'
}

export function parseMemoToTxType (memo) {
  if (!memo) {
    return 'unknown'
  }

  const parsedMemo = memo?.toLowerCase().split(':', 2)[0]

  return memoToType[parsedMemo]
}

export function parseThornodeStatus (ttx) {
  const inboundConf = ttx?.stages?.inbound_confirmation_counted
  const txAction = ttx?.tx
  const outTx = ttx?.out_txs
  const plannedTx = ttx?.planned_out_txs
  const txType = parseMemoToTxType(ttx?.tx?.memo)

  const res = {
    type: txType,
    inout: [],
    date: undefined,
    height: inboundConf?.counting_start_height,
    pools: [ttx.tx.coins[0].asset],
    status: 'pending',
    liqidityFee: undefined,
    synth: assetFromString(ttx.tx.coins[0].asset).synth,
    label: [],
    memo: txAction.memo,
    gas: txAction?.gas?.map(g => g.amount / 1e8 + ' ' + g.asset)
  }

  res.inout = [
    [
      [
        {
          is: txAction?.coins[0]?.asset,
          address: txAction?.from_address ?? '',
          txID: txAction?.id === '0000000000000000000000000000000000000000000000000000000000000000' ? '' : txAction?.id,
          asset: {
            name: txAction?.coins[0]?.asset,
            amount: txAction?.coins[0]?.amount / 10 ** 8
          },
          status: 'Success',
          type: txType
        }
      ]
    ]
  ]

  if (outTx && outTx.length > 0) {
    const ts = []
    outTx.forEach((t) => {
      ts.push(
        {
          is: t?.coins[0]?.asset,
          address: t?.to_address ?? '',
          txID: t?.id ?? '',
          asset: {
            name: t?.coins[0]?.asset,
            amount: t?.coins[0]?.amount / 10 ** 8
          },
          status: 'Success',
          type: txType
        })
    })

    res.inout[0].push(ts)
  } else if (plannedTx && plannedTx.length > 0) {
    const ts = []
    plannedTx.forEach((t) => {
      ts.push(
        {
          is: t?.coin?.asset,
          address: t?.to_address ?? '',
          txID: '',
          asset: {
            name: t?.coin?.asset,
            amount: t?.coin?.amount / 10 ** 8
          },
          status: 'pending',
          type: txType
        })
    })

    res.inout[0].push(ts)
  }

  return res
}

export function synthToAsset (assetString) {
  let asset = assetFromString(assetString.toUpperCase())

  if (assetString === 'rune') { asset = AssetRuneNative }

  if (!asset) {
    return
  }

  if (!isSynthAsset(asset)) { return assetToString(asset) }

  asset.synth = false

  return assetToString(asset)
}

export function curFormat (number) {
  return this.$options.filters.currency(number)
}

export function formatAsset (asset) {
  return asset.length > 10
    ? asset.slice(0, 14) + '...'
    : asset
}

export function addressFormat (string, number = 6, isOnlyLast = false) {
  if (!string) { return string }
  return (isOnlyLast ? '' : (string.slice(0, number) + '...')) + string.slice(-number)
}

let supportedChains = []

export function availableChains (nodes) {
  return compact(nodes?.map(n => n.observe_chains?.map(({ chain }) => chain).filter(chain => chain !== 'TERRA' /* disable TERRA */)
  )).reduce((a, b) => a?.length >= b?.length ? a : b, 0)
}

export function observeredChains (nodes) {
  supportedChains = availableChains(nodes)
  const majorityHeight = {}
  for (const chain of supportedChains) {
    const heights = countBy(nodes.map(item => item.observe_chains).filter(item => item !== null).map(item => item.filter(i => i.chain === chain)[0]?.height ?? 0), (height) => {
      return height
    })
    majorityHeight[chain] = Number(Object.keys(heights).reduce((a, b) => heights[a] > heights[b] ? a : b))
  }
  return majorityHeight
}

export function fillNodeData (nodes, el, chains, nodesExtra, lastBlockHeight, ratioReward, churnInterval) {
  if (!el) { return }
  const chainsHeight = {}
  try {
    supportedChains.forEach((chain) => {
      chainsHeight[chain] = ((el.observe_chains.filter(item => item?.chain === chain)[0]?.height ?? 0) - chains[chain])
    })
  } catch (error) {}
  let isp
  let location
  if (nodesExtra && el.ip_address) {
    const node = nodesExtra[el.ip_address]
    isp = node?.isp ?? undefined
    location = { code: node?.countryCode, region: node?.regionName, city: node?.city } ?? undefined
  }
  let age
  if (lastBlockHeight) {
    age = { number: (((lastBlockHeight - el.status_since) * 6) / 60 / 60 / 24), text: blockTime(lastBlockHeight - el.status_since) }
  }
  let apy
  if (ratioReward) {
    const churnsInYear = 365 / ((6 * churnInterval) / 60 / 60 / 24)
    apy = ((((el.current_award / ratioReward) / 10 ** 8) * churnsInYear) / (el.total_bond / 10 ** 8)) ?? undefined
  }
  nodes.push({
    address: el.node_address,
    ip: el.ip_address,
    status: el.status,
    version: el.version,
    slash: Number.parseInt(el.slash_points),
    award: (Number.parseFloat(el.current_award) / 10 ** 8).toFixed(2),
    providers: el.bond_providers?.providers,
    total_bond: el.total_bond / 10 ** 8 < 0.01 ? 0 : el.total_bond / 10 ** 8,
    chains: chainsHeight,
    isp,
    location,
    age,
    apy,
    score: ((1 / el.slash_points) * 10 ** 4).toFixed(0),
    leave: el.requested_to_leave
  })
}

export function runeCur () {
  return AssetCurrencySymbol.RUNE
}

// derived directly from thornode `chain.go`
export function defaultCoinBase (chain) {
  switch (chain) {
    case 'BTC':
      return 6.25
    case 'LTC':
      return 12.5
    case 'BCH':
      return 6.25
    case 'DOGE':
      return 10000
    default:
      return 0
  }
}

// derived directly from thornode `chain.go`
export function approxBlockSeconds (chain) {
  switch (chain) {
    case 'BTC':
      return 600
    case 'LTC':
      return 150
    case 'BCH':
      return 600
    case 'DOGE':
      return 60
    case 'ETH':
      return 12
    case 'AVAX':
      return 3
    case 'BNB':
      return 0.5
    case 'GAIA':
      return 6
    case 'THOR':
      return 6
    default:
      return 0
  }
}

export function assetFromString (s) {
  const isSynth = s.includes(SYNTH_DELIMITER)
  const delimiter = isSynth ? SYNTH_DELIMITER : NON_SYNTH_DELIMITER
  const data = s.split(delimiter)
  if (data.length <= 1 || data[1]?.length < 1) {
    return null
  }

  const chain = data[0]
  const symbol = data[1]
  const ticker = symbol.split('-')[0]

  return { chain, symbol, ticker, synth: isSynth }
}
