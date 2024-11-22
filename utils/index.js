import { AssetCurrencySymbol, isSynthAsset } from '@xchainjs/xchain-util'
import { compact, countBy } from 'lodash'
import moment from 'moment'

const TRADE_DELIMITER = '~'
const SYNTH_DELIMITER = '/'
const NON_SYNTH_DELIMITER = '.'

// Formats time in seconds into `dd:hh:mm hrs`
export function formatTime(seconds, hour) {
  seconds = Number(seconds)
  const d = Math.floor(seconds / (3600 * 24))
  const h = Math.floor((seconds % (3600 * 24)) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  const comms = (c) => (c > 0 ? ', ' : '')

  const dDisplay = d > 0 ? d + (d === 1 ? ' day' : ' days') : ''
  const hDisplay = h > 0 ? h + (h === 1 ? ' hour' : ' hours') : ''
  let strBuild = dDisplay + comms(d && h) + hDisplay
  const mDisplay = m > 0 ? m + (m === 1 ? ' minute' : ' minutes') : ''
  const sDisplay = s > 0 ? s + (s === 1 ? ' second' : ' seconds') : ''
  if (!hour) {
    strBuild +=
      comms((h && m) || (d && m)) +
      mDisplay +
      comms((m && s) || (d && s) || (h && s)) +
      sDisplay
  }
  return strBuild
}

export function blockTime(blockHeight, hour) {
  const val = blockHeight * 6
  return formatTime(val, hour)
}

export function momentTimeFormat(time) {
  return moment(time).format('MM/DD/YYYY hh:mm:ss A')
}

export function isInternalTx(hash) {
  if (!hash) {
    return true
  }
  return (
    hash ===
      '0000000000000000000000000000000000000000000000000000000000000000' ??
    false
  )
}

export function parseCosmosTx(ntx) {
  const ret = []
  ntx.tx?.body?.messages?.forEach((el) => {
    const assetName =
      `THOR.${el?.amount?.length > 0 && el.amount[0]?.denom}`.toLocaleUpperCase()
    // Send messages
    switch (el['@type']) {
      case '/types.MsgSend':
        ret.push({
          type: 'Send',
          inout: [
            [
              [
                {
                  is: el?.amount[0],
                  address: el.to_address,
                  outAddress: el.from_address,
                  txID: ntx?.tx_response?.txhash,
                  asset: {
                    name: assetName,
                    amount: el?.amount[0].amount / 10 ** 8,
                  },
                },
              ],
            ],
          ],
          gas: [+ntx?.tx_response?.gas_used / 10 ** 8 + ' ' + assetName],
          date: moment(ntx?.tx_response.timestamp).format(
            'MM/DD/YYYY hh:mm:ss A'
          ),
          height: +ntx?.tx_response.height,
          memo: ntx.tx?.body?.memo,
        })
        break

      // Deposit messages
      case '/types.MsgDeposit':
        ret.push({
          type: 'Deposit/Withdraw',
          inout: [
            [
              {
                is: el?.amount[0],
                address: el.signer,
                txID: ntx?.tx_response?.txhash,
                asset: {
                  name: assetName,
                  amount: el?.amount[0].amount / 10 ** 8,
                },
              },
            ],
          ],
          gas: [+ntx?.tx_response?.gas_used / 10 ** 8 + ' ' + assetName],
          memo: el.memo,
          txID: ntx?.tx_response?.txhash,
          date: moment(ntx?.tx_response.timestamp).format(
            'MM/DD/YYYY, hh:mm:ss A'
          ),
          height: +ntx?.tx_response.height,
        })
        break

      default:
        break
    }
  })

  return ret[0]
}

export function parseExtraSwap(ntx) {
  const {
    tx: { tx: inboundTx },
    out_txs: outTxs,
  } = ntx
  let affiliateFee
  // has affiliate fee
  if (outTxs?.length > 1 && ntx.tx?.out_hashes?.length > 1) {
    const thorTx = outTxs?.find((e) => e.chain === 'THOR')
    affiliateFee = thorTx?.coins
  }

  return {
    inChain: inboundTx?.chain,
    inboundHeight: ntx.tx?.external_observed_height,
    inboundGases: inboundTx?.gas,
    inSigners: ntx.tx?.signers,
    outboundGases: outTxs?.map((e) => e.gas)?.flat(),
    affiliateFee,
    txOutDelay: (ntx.outbound_height - ntx.finalised_height) * 6,
  }
}

function checkSynth(asset) {
  if (!asset) {
    return false
  }
  return isSynthAsset(assetFromString(asset))
}

export function parseMidgardTx(tx) {
  // get action
  const firstTxAction = tx.actions[0]
  const status = tx.actions.map((t) => t.status)

  const res = {
    type: firstTxAction.type,
    inout: [],
    date: new Date(firstTxAction?.date / 10 ** 6),
    height: firstTxAction.height,
    pools: firstTxAction.pools,
    status: status.includes('success') ? 'success' : status[0],
    liquidityFee: firstTxAction.metadata,
    synth: false,
    label: [],
    inAsset: '',
    outAsset: '',
  }

  tx.actions.forEach((txa, i) => {
    const insouts = [
      txa?.in?.map((t) => {
        res.synth = checkSynth(t?.coins[0]?.asset)

        if (t?.coins && t.coins.length > 0) {
          res.inAsset = t.coins[0].asset
        }

        return {
          is: t?.coins[0]?.asset || t?.txID,
          address: t?.address ?? '',
          txID: t?.txID ?? '',
          asset: {
            name: t?.coins[0]?.asset,
            amount: t?.coins[0]?.amount / 10 ** 8,
          },
          status: txa?.status,
          type: txa?.type,
        }
      }),
      txa?.out?.map((t) => {
        if (t?.coins.length <= 0) {
          return {}
        }

        res.synth = checkSynth(t?.coins[0]?.asset)

        if (t?.coins && t.coins.length > 0) {
          res.outAsset = t.coins[0].asset
        }

        return {
          is: t.coins[0]?.asset,
          address: t?.address ?? '',
          txID: t?.txID ?? '',
          asset: {
            name: t?.coins[0]?.asset,
            amount: t?.coins[0]?.amount / 10 ** 8,
          },
          status: txa?.status,
          type: txa?.type,
        }
      }),
    ]

    // ignore noop txs
    if (txa?.metadata?.swap?.memo === 'noop') {
      return
    }

    if (firstTxAction.pools.length > 1) {
      res.inAsset = firstTxAction.pools[0]
      res.outAsset = firstTxAction.pools[1]
    }

    res.inout.push(insouts)
  })

  if (firstTxAction.metadata) {
    res.gas = firstTxAction.metadata[firstTxAction.type]?.networkFees?.map(
      (f) => f.amount / 10 ** 8 + ' ' + f.asset
    )
    res.memo = firstTxAction.metadata[firstTxAction.type]?.memo
    if (res.type === 'swap') {
      const memos = tx.actions?.map((a) => a.metadata?.swap?.memo)
      res.memo = memos.find((m) => m && m !== '' && m !== 'noop')
    }
  }

  const hasAddOrWithdraw = res.inout.find(
    (t) =>
      !!(
        t[0][0].type === 'addLiquidity' || t[0][0].type === 'withdrawLiquidity'
      )
  )
  const isStreamSwap = res.type === 'swap' && res.memo.match(/.+\/\d+/g)
  const isLoanTx =
    res.type === 'swap' &&
    ['loan-', 'loan+', '$-', '$+'].includes(
      res.memo.split(':')[0].toLowerCase()
    )
  // merge two txs one with affilitate fee
  if (res.inout.length > 1 && !hasAddOrWithdraw && !isStreamSwap && !isLoanTx) {
    const ins = res.inout.map((e) => e[0][0])
    const hash = ins.find((e) => !!e.txID).txID
    if (ins.every((e) => e.txID === hash)) {
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
  'loan-': 'loanRepayment',
  'trade+': 'tradeDeposit',
  'trade-': 'tradeWithdraw',
  'pool+': 'runePoolDeposit',
  'pool-': 'runePoolWithdraw',
}

export function parseMemoToTxType(memo) {
  if (!memo) {
    return 'unknown'
  }

  const parsedMemo = memo?.trim().toLowerCase().split(':', 2)[0]

  return memoToType[parsedMemo] ?? 'unknown'
}

export function parseThornodeStatus(ttx) {
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
    liquidityFee: undefined,
    synth: assetFromString(ttx.tx.coins[0].asset).synth,
    label: [],
    memo: txAction.memo,
    gas: txAction?.gas?.map((g) => g.amount / 1e8 + ' ' + g.asset),
    inAsset: ttx.tx.coins[0].asset,
    outAsset: '',
  }

  res.inout = [
    [
      [
        {
          is: txAction?.coins[0]?.asset,
          address: txAction?.from_address ?? '',
          txID:
            txAction?.id ===
            '0000000000000000000000000000000000000000000000000000000000000000'
              ? ''
              : txAction?.id,
          asset: {
            name: txAction?.coins[0]?.asset,
            amount: txAction?.coins[0]?.amount / 10 ** 8,
          },
          status: 'Success',
          type: txType,
        },
      ],
    ],
  ]

  if (outTx && outTx.length > 0) {
    const ts = []
    outTx.forEach((t) => {
      ts.push({
        is: t?.coins[0]?.asset,
        address: t?.to_address ?? '',
        txID: t?.id ?? '',
        asset: {
          name: t?.coins[0]?.asset,
          amount: t?.coins[0]?.amount / 10 ** 8,
        },
        status: 'Success',
        type: txType,
      })

      res.outAsset = t?.coin?.asset
    })
    res.inout[0].push(ts)
  } else if (plannedTx && plannedTx.length > 0) {
    const ts = []
    plannedTx.forEach((t) => {
      ts.push({
        is: t?.coin?.asset,
        address: t?.to_address ?? '',
        txID: '',
        asset: {
          name: t?.coin?.asset,
          amount: t?.coin?.amount / 10 ** 8,
        },
        status: 'pending',
        type: txType,
      })

      res.outAsset = t?.coin?.asset
    })

    res.inout[0].push(ts)
  }

  return res
}

export function synthToAsset(assetString) {
  let asset = assetFromString(assetString.toUpperCase())

  if (assetString === 'rune') {
    asset = assetFromString('THOR.RUNE')
  }

  if (!asset) {
    return
  }

  if (!isSynthAsset(asset)) {
    return assetToString(asset)
  }

  asset.synth = false

  return assetToString(asset)
}

export function assetToTrade(str) {
  if (typeof str === 'object') {
    str = assetToString(str)
  }

  return str.replace('.', '~')
}

export function tradeToAsset(str) {
  if (typeof str === 'object') {
    str = assetToString(str)
  }

  return str.replace('~', '.')
}

export function curFormat(number) {
  return this.$options.filters.currency(number)
}

export function formatAsset(asset) {
  return asset.length > 10 ? asset.slice(0, 14) + '...' : asset
}

export function addressFormat(string, number = 6, isOnlyLast = false) {
  if (!string) {
    return string
  }
  return (
    (isOnlyLast ? '' : string.slice(0, number) + '...') + string.slice(-number)
  )
}

let supportedChains = []

export function availableChains(nodes) {
  return compact(
    nodes?.map((n) =>
      n.observe_chains
        ?.map(({ chain }) => chain)
        .filter(
          (chain) => chain !== 'TERRA' && chain !== 'BNB' /* disable TERRA */
        )
    )
  ).reduce((a, b) => (a?.length >= b?.length ? a : b), 0)
}

export function observeredChains(nodes) {
  supportedChains = availableChains(nodes)
  const majorityHeight = {}
  for (const chain of supportedChains) {
    const heights = countBy(
      nodes
        .map((item) => item.observe_chains)
        .filter((item) => item !== null)
        .map((item) => item.filter((i) => i.chain === chain)[0]?.height ?? 0),
      (height) => {
        return height
      }
    )
    majorityHeight[chain] = Number(
      Object.keys(heights).reduce((a, b) => (heights[a] > heights[b] ? a : b))
    )
  }
  return majorityHeight
}

export function fillNodeData(nodes, el, index) {
  if (!el) {
    return
  }
  let rank
  if (index !== undefined) {
    rank = index + 1
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
    behind: el.behind,
    age: el.age,
    apy: el.apy,
    location:
      { code: el?.countryCode, region: el?.regionName, city: el?.city } ??
      undefined,
    isp: el.isp,
    org: el.org,
    jail: el.jail,
    score: el.slash_points ? (1e4 / el.slash_points).toFixed(4) : 0,
    leave: el.requested_to_leave,
    fee: el.bond_providers?.node_operator_fee / 1e4,
    operator: el?.node_operator_address,
    vault: el.vaultMembership,
    ...(rank && { rank }),
  })
}

export function runeCur() {
  return AssetCurrencySymbol.RUNE
}

// derived directly from thornode `chain.go`
export function defaultCoinBase(chain) {
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
export function approxBlockSeconds(chain) {
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

const hashMapShorts = {
  a: 'AVAX.AVAX',
  b: 'BTC.BTC',
  c: 'BCH.BCH',
  n: 'BNB.BNB',
  d: 'DOGE.DOGE',
  s: 'BSC.BNB',
  e: 'ETH.ETH',
  g: 'GAIA.ATOM',
  l: 'LTC.LTC',
  r: 'THOR.RUNE',
}

export function shortAssetName(name) {
  if (name.length !== 1) {
    return name
  }

  return hashMapShorts[name.toLowerCase()] || name
}

export function assetFromString(s) {
  if (typeof s === 'object') {
    return s
  }

  const isSynth = s.includes(SYNTH_DELIMITER)
  let delimiter = isSynth ? SYNTH_DELIMITER : NON_SYNTH_DELIMITER
  const isTrade = s.includes(TRADE_DELIMITER)
  delimiter = isTrade ? TRADE_DELIMITER : delimiter
  const data = s.split(delimiter)
  if (data.length <= 1 || data[1]?.length < 1) {
    return null
  }

  const chain = data[0]
  const symbol = data[1]
  const ticker = symbol.split('-')[0]
  const address = symbol.split('-')[1] ?? ''

  return { chain, symbol, ticker, address, synth: isSynth, trade: isTrade }
}

export function assetToString({ chain, synth, trade, symbol }) {
  let delimiter = synth ? SYNTH_DELIMITER : NON_SYNTH_DELIMITER
  delimiter = trade ? TRADE_DELIMITER : delimiter
  return `${chain}${delimiter}${symbol}`
}

export const nameMapping = {
  THORSwap: ['t', 'T', 'thor160yye65pf9rzwrgqmtgav69n6zlsyfpgm9a7xk'],
  'TS Ledger': ['tl'],
  'Team CoinBot': ['cb'],
  Asgardex: ['dx'],
  ShapeShift: ['ss'],
  XDEFI: ['xdf'],
  Rango: ['rg'],
  'Edge Wallet': ['ej'],
  DefiSpot: ['ds'],
  Lends: ['lends'],
  DecentralFi: ['decentralfi'],
  TrustWallet: ['ti', 'te', 'tr', 'td'],
  LiFi: ['lifi'],
  'OneKey Wallet': ['oky'],
  Symbiosis: ['sy'],
  vultisig: [
    'va',
    'vi',
    'v0',
    'wr',
    'thor1a427q3v96psuj4fnughdw8glt5r7j38lj7rkp8',
  ],
  'Cake Wallet': ['cakewallet'],
  OKX: ['okw'],
}

export const interfaces = {
  thorswap: {
    name: 'THORSwap',
    icon: 'thorswap',
  },
  shapeshift: {
    name: 'Shapeshift',
    icon: 'shapeshift',
  },
  trustwallet: {
    name: 'Trust Wallet',
    icon: 'trustwallet',
  },
  thorwallet: {
    name: 'THORWallet',
    icon: 'thorwallet',
  },
  xdefi: {
    name: 'XDEFI',
    icon: 'xdefi',
  },
  asgardex: {
    name: 'ASGARDEX',
    icon: 'asgardex',
  },
  lifi: {
    name: 'LIFI',
    icon: 'lifi',
  },
  edge: {
    name: 'Edge Wallet',
    icon: 'edge',
  },
  okx: {
    name: 'OKX',
    icon: 'okx',
  },
  onekey: {
    name: 'One Key',
    icon: 'onekey',
  },
  symbiosis: {
    name: 'Symbiosis',
    icon: 'symbiosis',
  },
  defispot: {
    name: 'Defispot',
    icon: 'defispot',
  },
  vultisig: {
    name: 'Vultisig',
    icon: 'vultisig',
  },
  eldorito: {
    name: 'ELDORITO',
    icon: 'eldorito',
  },
  ll: {
    name: 'Live Ledger',
    icon: 'ledger',
  },
  zengo: {
    name: 'Zengo',
    icon: 'zengo',
  },
  cakewallet: {
    name: 'CakeWallet',
    icon: 'cakewallet',
  },
  rango: {
    name: 'Rango Exchange',
    icon: 'rango',
  },
  sk: {
    name: 'SwapKit',
    icon: 'swapkit',
  },
  is: {
    name: 'InstaSwap',
    icon: 'instaswap',
  },
  bgw: {
    name: 'BitGet Wallet',
    icon: 'bgw',
  },
}

export const affiliateMap = {
  td: interfaces.trustwallet,
  ti: interfaces.trustwallet,
  tr: interfaces.trustwallet,
  te: interfaces.trustwallet,
  thor1a427q3v96psuj4fnughdw8glt5r7j38lj7rkp8: interfaces.vultisig,
  wr: interfaces.vultisig,
  tgt: interfaces.vultisig,
  thorwallet: interfaces.vultisig,
  thor160yye65pf9rzwrgqmtgav69n6zlsyfpgm9a7xk: interfaces.thorswap,
  T: interfaces.thorswap,
  t: interfaces.thorswap,
  tl: interfaces.thorswap,
  ts: interfaces.thorswap,
  thor17suv0n437snv68axkx64whutkrvefv7pzq7xep: interfaces.thorswap,
  ss: interfaces.shapeshift,
  xdf: interfaces.xdefi,
  dx: interfaces.asgardex,
  lifi: interfaces.lifi,
  ej: interfaces.edge,
  okw: interfaces.okx,
  oky: interfaces.onekey,
  sy: interfaces.symbiosis,
  ELD: interfaces.eldorito,
  va: interfaces.vultisig,
  vi: interfaces.vultisig,
  ll: interfaces.ll,
  zengo: interfaces.zengo,
  cakewallet: interfaces.cakewallet,
  rg: interfaces.rango,
  sk: interfaces.sk,
  is: interfaces.is,
  ds: interfaces.defispot,
  bgw: interfaces.bgw,
}

export function getExplorerAddressUrl(chain, query) {
  switch (chain) {
    case 'BCH':
      return `https://www.blockchain.com/explorer/addresses/bch/${query}`
    case 'BTC':
      return `https://www.blockchain.com/explorer/addresses/btc/${query}`
    case 'ETH':
      return `https://etherscan.io/address/${query}`
    case 'BSC':
      return `https://bscscan.com/address/${query}`
    case 'AVAX':
      return `https://snowtrace.io/address/${query}`
    case 'DOGE':
      return `https://blockchair.com/dogecoin/address/${query}`
    case 'GAIA':
      return `https://www.mintscan.io/cosmos/address/${query}`
    case 'LTC':
      return `https://blockchair.com/litecoin/address/${query}`
    default:
      break
  }
}

export const darkTheme = {
  color: [
    '#63fdd9',
    '#00ccff',
    '#f3ba2f',
    '#ff4954',
    '#07C86E',
    '#FFF960',
    '#845EC2',
    '#F2F4F7',
  ],
  backgroundColor: 'rgba(0,0,0,0)',
  textStyle: {},
  title: {
    textStyle: {
      color: '#e6e6e6',
    },
    subtextStyle: {
      color: '#9f9f9f',
    },
  },
  line: {
    itemStyle: {
      borderWidth: '2',
    },
    lineStyle: {
      width: '2',
    },
    symbolSize: '4',
    symbol: 'circle',
    smooth: true,
  },
  radar: {
    itemStyle: {
      borderWidth: '2',
    },
    lineStyle: {
      width: '2',
    },
    symbolSize: '4',
    symbol: 'circle',
    smooth: true,
  },
  bar: {
    itemStyle: {
      barBorderWidth: '0',
      barBorderColor: 'transparent',
    },
  },
  pie: {
    label: {
      color: '#fff',
    },
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
  },
  scatter: {
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
  },
  boxplot: {
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
  },
  parallel: {
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
  },
  sankey: {
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
  },
  funnel: {
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
  },
  gauge: {
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
  },
  candlestick: {
    itemStyle: {
      color: '#eb5454',
      color0: '#47b262',
      borderColor: '#eb5454',
      borderColor0: '#47b262',
      borderWidth: 1,
    },
  },
  graph: {
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
    lineStyle: {
      width: 1,
      color: '#aaaaaa',
    },
    symbolSize: '4',
    symbol: 'circle',
    smooth: true,
    color: ['#63fdd9', '#00ccff', '#f3ba2f', '#ff4954'],
    label: {
      color: '#9f9f9f',
    },
  },
  map: {
    itemStyle: {
      areaColor: '#eee',
      borderColor: '#444',
      borderWidth: 0.5,
    },
    label: {
      color: '#000',
    },
    emphasis: {
      itemStyle: {
        areaColor: 'rgba(255,215,0,0.8)',
        borderColor: '#444',
        borderWidth: 1,
      },
      label: {
        color: 'rgb(100,0,0)',
      },
    },
  },
  geo: {
    itemStyle: {
      areaColor: '#eee',
      borderColor: '#444',
      borderWidth: 0.5,
    },
    label: {
      color: '#000',
    },
    emphasis: {
      itemStyle: {
        areaColor: 'rgba(255,215,0,0.8)',
        borderColor: '#444',
        borderWidth: 1,
      },
      label: {
        color: 'rgb(100,0,0)',
      },
    },
  },
  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#9f9f9f',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#9f9f9f',
      },
    },
    axisLabel: {
      show: true,
      color: '#9f9f9f',
    },
    splitLine: {
      show: false,
      lineStyle: {
        color: ['#9f9f9f'],
      },
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)'],
      },
    },
  },
  valueAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#9f9f9f',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#9f9f9f',
      },
    },
    axisLabel: {
      show: true,
      color: '#9f9f9f',
    },
    splitLine: {
      show: false,
      lineStyle: {
        color: ['#9f9f9f'],
      },
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)'],
      },
    },
  },
  logAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#9f9f9f',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#9f9f9f',
      },
    },
    axisLabel: {
      show: true,
      color: '#9f9f9f',
    },
    splitLine: {
      show: false,
      lineStyle: {
        color: ['#9f9f9f'],
      },
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)'],
      },
    },
  },
  timeAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#9f9f9f',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#9f9f9f',
      },
    },
    axisLabel: {
      show: true,
      color: '#9f9f9f',
    },
    splitLine: {
      show: false,
      lineStyle: {
        color: ['#9f9f9f'],
      },
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)'],
      },
    },
  },
  toolbox: {
    iconStyle: {
      borderColor: '#9f9f9f',
    },
    emphasis: {
      iconStyle: {
        borderColor: '#666666',
      },
    },
  },
  legend: {
    textStyle: {
      color: '#9f9f9f',
    },
  },
  tooltip: {
    backgroundColor: '#0d0f12',
    borderColor: '#263238',
    textStyle: {
      color: '#e6e6e6',
      fontFamily: 'Montserrat',
    },
    axisPointer: {
      lineStyle: {
        color: '#e6e6e6',
        width: 1,
      },
      crossStyle: {
        color: '#e6e6e6',
        width: 1,
      },
    },
  },
  timeline: {
    lineStyle: {
      color: 'rgb(74,85,104)',
      width: 2,
    },
    itemStyle: {
      color: 'rgb(74,85,104)',
      borderWidth: 1,
    },
    controlStyle: {
      color: 'rgb(74,85,104)',
      borderColor: 'rgb(74,85,104)',
      borderWidth: 1,
    },
    checkpointStyle: {
      color: '#3ca38b',
      borderColor: '#ffffff',
    },
    label: {
      color: 'rgb(74,85,104)',
    },
    emphasis: {
      itemStyle: {
        color: '#ffffff',
      },
      controlStyle: {
        color: 'rgb(74,85,104)',
        borderColor: 'rgb(74,85,104)',
        borderWidth: 1,
      },
      label: {
        color: 'rgb(74,85,104)',
      },
    },
  },
  visualMap: {
    color: ['#3ca38b', '#00ccff', '#f3ba2f'],
  },
  dataZoom: {
    handleSize: 'undefined%',
    textStyle: {},
  },
  markPoint: {
    label: {
      color: '#9f9f9f',
    },
    emphasis: {
      label: {
        color: '#9f9f9f',
      },
    },
  },
}

export const lightTheme = {
  color: [
    '#3ca38b',
    '#00ccff',
    '#f3ba2f',
    '#ff4954',
    '#07C86E',
    '#FFF960',
    '#845EC2',
    '#FF9671',
  ],
  backgroundColor: 'rgba(0,0,0,0)',
  textStyle: {},
  title: {
    textStyle: {
      color: '#e6e6e6',
    },
    subtextStyle: {
      color: '#9f9f9f',
    },
  },
  line: {
    itemStyle: {
      borderWidth: '2',
    },
    lineStyle: {
      width: '2',
    },
    symbolSize: '4',
    symbol: 'circle',
    smooth: true,
  },
  radar: {
    itemStyle: {
      borderWidth: '2',
    },
    lineStyle: {
      width: '2',
    },
    symbolSize: '4',
    symbol: 'circle',
    smooth: true,
  },
  bar: {
    itemStyle: {
      barBorderWidth: '0',
      barBorderColor: 'transparent',
    },
  },
  pie: {
    label: {
      color: '#000',
    },
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
  },
  scatter: {
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
  },
  boxplot: {
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
  },
  parallel: {
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
  },
  sankey: {
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
  },
  funnel: {
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
  },
  gauge: {
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
  },
  candlestick: {
    itemStyle: {
      color: '#eb5454',
      color0: '#47b262',
      borderColor: '#eb5454',
      borderColor0: '#47b262',
      borderWidth: 1,
    },
  },
  graph: {
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
    lineStyle: {
      width: 1,
      color: '#aaaaaa',
    },
    symbolSize: '4',
    symbol: 'circle',
    smooth: true,
    color: ['#3ca38b', '#00ccff', '#f3ba2f', '#ff4954'],
    label: {
      color: '#9f9f9f',
    },
  },
  map: {
    itemStyle: {
      areaColor: '#eee',
      borderColor: '#444',
      borderWidth: 0.5,
    },
    label: {
      color: '#000',
    },
    emphasis: {
      itemStyle: {
        areaColor: 'rgba(255,215,0,0.8)',
        borderColor: '#444',
        borderWidth: 1,
      },
      label: {
        color: 'rgb(100,0,0)',
      },
    },
  },
  geo: {
    itemStyle: {
      areaColor: '#eee',
      borderColor: '#444',
      borderWidth: 0.5,
    },
    label: {
      color: '#000',
    },
    emphasis: {
      itemStyle: {
        areaColor: 'rgba(255,215,0,0.8)',
        borderColor: '#444',
        borderWidth: 1,
      },
      label: {
        color: 'rgb(100,0,0)',
      },
    },
  },
  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#6E7079',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#6E7079',
      },
    },
    axisLabel: {
      show: true,
      color: '#6E7079',
    },
    splitLine: {
      show: false,
      lineStyle: {
        color: ['#E0E6F1'],
      },
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)'],
      },
    },
  },
  valueAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#6E7079',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#6E7079',
      },
    },
    axisLabel: {
      show: true,
      color: '#6E7079',
    },
    splitLine: {
      show: false,
      lineStyle: {
        color: ['#E0E6F1'],
      },
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)'],
      },
    },
  },
  logAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#6E7079',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#6E7079',
      },
    },
    axisLabel: {
      show: true,
      color: '#6E7079',
    },
    splitLine: {
      show: false,
      lineStyle: {
        color: ['#E0E6F1'],
      },
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)'],
      },
    },
  },
  timeAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#6E7079',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#6E7079',
      },
    },
    axisLabel: {
      show: true,
      color: '#6E7079',
    },
    splitLine: {
      show: false,
      lineStyle: {
        color: ['#E0E6F1'],
      },
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)'],
      },
    },
  },
  toolbox: {
    iconStyle: {
      borderColor: '#e6e6e6',
    },
    emphasis: {
      iconStyle: {
        borderColor: '#666666',
      },
    },
  },
  legend: {
    textStyle: {
      color: '#333333',
    },
  },
  tooltip: {
    backgroundColor: '#fff',
    borderColor: '#cccccc',
    textStyle: {
      color: 'rgb(26, 32, 44)',
      fontFamily: 'Montserrat',
    },
    axisPointer: {
      lineStyle: {
        color: '#cccccc',
        width: 1,
      },
      crossStyle: {
        color: '#cccccc',
        width: 1,
      },
    },
  },
  timeline: {
    lineStyle: {
      color: 'rgb(74,85,104)',
      width: 2,
    },
    itemStyle: {
      color: 'rgb(74,85,104)',
      borderWidth: 1,
    },
    controlStyle: {
      color: 'rgb(74,85,104)',
      borderColor: 'rgb(74,85,104)',
      borderWidth: 1,
    },
    checkpointStyle: {
      color: '#3ca38b',
      borderColor: '#ffffff',
    },
    label: {
      color: 'rgb(74,85,104)',
    },
    emphasis: {
      itemStyle: {
        color: '#ffffff',
      },
      controlStyle: {
        color: 'rgb(74,85,104)',
        borderColor: 'rgb(74,85,104)',
        borderWidth: 1,
      },
      label: {
        color: 'rgb(74,85,104)',
      },
    },
  },
  visualMap: {
    color: ['#3ca38b', '#00ccff', '#f3ba2f'],
  },
  dataZoom: {
    handleSize: 'undefined%',
    textStyle: {},
  },
  markPoint: {
    label: {
      color: '#9f9f9f',
    },
    emphasis: {
      label: {
        color: '#9f9f9f',
      },
    },
  },
}

export const blueElectraTheme = {
  color: [
    '#70FFBE',
    '#45AFF4',
    '#f3ba2f',
    '#F3B3A6',
    '#07C86E',
    '#FFF960',
    '#845EC2',
    '#F2F4F7',
  ],
  backgroundColor: 'rgba(0,0,0,0)',
  textStyle: {},
  title: {
    textStyle: {
      color: '#e6e6e6',
    },
    subtextStyle: {
      color: '#9f9f9f',
    },
  },
  line: {
    itemStyle: {
      borderWidth: '2',
    },
    lineStyle: {
      width: '2',
    },
    symbolSize: '4',
    symbol: 'circle',
    smooth: true,
  },
  radar: {
    itemStyle: {
      borderWidth: '2',
    },
    lineStyle: {
      width: '2',
    },
    symbolSize: '4',
    symbol: 'circle',
    smooth: true,
  },
  bar: {
    itemStyle: {
      barBorderWidth: '0',
      barBorderColor: 'transparent',
    },
  },
  pie: {
    label: {
      color: '#fff',
    },
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
  },
  scatter: {
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
  },
  boxplot: {
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
  },
  parallel: {
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
  },
  sankey: {
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
  },
  funnel: {
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
  },
  gauge: {
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
  },
  candlestick: {
    itemStyle: {
      color: '#eb5454',
      color0: '#47b262',
      borderColor: '#eb5454',
      borderColor0: '#47b262',
      borderWidth: 1,
    },
  },
  graph: {
    itemStyle: {
      borderWidth: '0',
      borderColor: 'transparent',
    },
    lineStyle: {
      width: 1,
      color: '#aaaaaa',
    },
    symbolSize: '4',
    symbol: 'circle',
    smooth: true,
    color: ['#63fdd9', '#00ccff', '#f3ba2f', '#ff4954'],
    label: {
      color: '#9f9f9f',
    },
  },
  map: {
    itemStyle: {
      areaColor: '#eee',
      borderColor: '#444',
      borderWidth: 0.5,
    },
    label: {
      color: '#000',
    },
    emphasis: {
      itemStyle: {
        areaColor: 'rgba(255,215,0,0.8)',
        borderColor: '#444',
        borderWidth: 1,
      },
      label: {
        color: 'rgb(100,0,0)',
      },
    },
  },
  geo: {
    itemStyle: {
      areaColor: '#eee',
      borderColor: '#444',
      borderWidth: 0.5,
    },
    label: {
      color: '#000',
    },
    emphasis: {
      itemStyle: {
        areaColor: 'rgba(255,215,0,0.8)',
        borderColor: '#444',
        borderWidth: 1,
      },
      label: {
        color: 'rgb(100,0,0)',
      },
    },
  },
  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#e6e6e6',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#e6e6e6',
      },
    },
    axisLabel: {
      show: true,
      color: '#e6e6e6',
    },
    splitLine: {
      show: false,
      lineStyle: {
        color: ['#E0E6F1'],
      },
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)'],
      },
    },
  },
  valueAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#e6e6e6',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#e6e6e6',
      },
    },
    axisLabel: {
      show: true,
      color: '#e6e6e6',
    },
    splitLine: {
      show: false,
      lineStyle: {
        color: ['#E0E6F1'],
      },
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)'],
      },
    },
  },
  logAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#e6e6e6',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#e6e6e6',
      },
    },
    axisLabel: {
      show: true,
      color: '#e6e6e6',
    },
    splitLine: {
      show: false,
      lineStyle: {
        color: ['#E0E6F1'],
      },
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)'],
      },
    },
  },
  timeAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#e6e6e6',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#e6e6e6',
      },
    },
    axisLabel: {
      show: true,
      color: '#e6e6e6',
    },
    splitLine: {
      show: false,
      lineStyle: {
        color: ['#E0E6F1'],
      },
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)'],
      },
    },
  },
  toolbox: {
    iconStyle: {
      borderColor: '#e6e6e6',
    },
    emphasis: {
      iconStyle: {
        borderColor: '#666666',
      },
    },
  },
  legend: {
    textStyle: {
      color: '#e6e6e6',
    },
  },
  tooltip: {
    backgroundColor: '#0d0f12',
    borderColor: '#263238',
    textStyle: {
      color: '#e6e6e6',
      fontFamily: 'Montserrat',
    },
    axisPointer: {
      lineStyle: {
        color: '#e6e6e6',
        width: 1,
      },
      crossStyle: {
        color: '#e6e6e6',
        width: 1,
      },
    },
  },
  timeline: {
    lineStyle: {
      color: 'rgb(74,85,104)',
      width: 2,
    },
    itemStyle: {
      color: 'rgb(74,85,104)',
      borderWidth: 1,
    },
    controlStyle: {
      color: 'rgb(74,85,104)',
      borderColor: 'rgb(74,85,104)',
      borderWidth: 1,
    },
    checkpointStyle: {
      color: '#3ca38b',
      borderColor: '#ffffff',
    },
    label: {
      color: 'rgb(74,85,104)',
    },
    emphasis: {
      itemStyle: {
        color: '#ffffff',
      },
      controlStyle: {
        color: 'rgb(74,85,104)',
        borderColor: 'rgb(74,85,104)',
        borderWidth: 1,
      },
      label: {
        color: 'rgb(74,85,104)',
      },
    },
  },
  visualMap: {
    color: ['#3ca38b', '#00ccff', '#f3ba2f'],
  },
  dataZoom: {
    handleSize: 'undefined%',
    textStyle: {},
  },
  markPoint: {
    label: {
      color: '#9f9f9f',
    },
    emphasis: {
      label: {
        color: '#9f9f9f',
      },
    },
  },
}
