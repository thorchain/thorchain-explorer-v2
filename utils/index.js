import { AssetCurrencySymbol, assetFromString, AssetRuneNative, assetToString, isSynthAsset } from "@xchainjs/xchain-util";
import moment from "moment";

// Formats time in seconds into `dd:hh:mm hrs`
export function formatTime(seconds) {
  seconds = Number(seconds);
  var d = Math.floor(seconds / (3600*24));
  var h = Math.floor(seconds % (3600*24) / 3600);
  var m = Math.floor(seconds % 3600 / 60);
  var s = Math.floor(seconds % 60);

  const comms = (c) => (c>0?', ':'')

  var dDisplay = d > 0 ? d + (d == 1 ? " day" : " days") : "";
  var hDisplay = h > 0 ? h + (h == 1 ? " hour" : " hours") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " minute" : " minutes") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
  return dDisplay + comms(d && h) + hDisplay + comms((h && m) || (d && m)) + mDisplay + comms((m && s) || (d && s) || (h && s)) + sDisplay;
}

export function blockTime(blockHeight) {
  let val = (blockHeight)*6;
  return formatTime(val);        
}

export function parseCosmosTx(ntx) {
  let ret = [];
  ntx.tx?.body.messages.forEach(el => {
    // Send messages
    switch (el['@type']) {
      case "/types.MsgSend":
        var assetName = `THOR.${el?.amount[0]?.denom}`.toLocaleUpperCase()
        ret.push({
          type: 'Send',
          inout: [{
            is: el?.amount[0],
            address: el['to_address'],
            outAddress: el['from_address'],
            txID: ntx?.tx_response?.txhash,
            asset: {
              name: assetName,
              amount: el?.amount[0].amount / 10**8
            }
          }],
          gas: [+ntx?.tx_response?.gas_used / 10**8 + ' ' + assetName],
          date: moment(ntx?.tx_response.timestamp).format('MM/DD/YYYY hh:mm:ss A'),
          height: +ntx?.tx_response.height
        })
        break;
      
      // Deposit messages
      case "/types.MsgDeposit":
        var assetName = `THOR.${el?.amount[0]?.denom}`.toLocaleUpperCase()
        ret.push({
          type: 'Deposit/Withdraw',
          inout: [{
            is: el?.amount[0],
            address: el['signer'],
            txID: ntx?.tx_response?.txhash,
            asset: {
              name: assetName,
              amount: el?.amount[0].amount / 10**8
            }
          }],
          gas: [+ntx?.tx_response?.gas_used / 10**8 + ' ' + assetName],
          memo: el['memo'],
          txID: ntx?.tx_response?.txhash,
          date: moment(ntx?.tx_response.timestamp).format('MM/DD/YYYY, hh:mm:ss A'),
          height: +ntx?.tx_response.height,
        })
      default:
        break;
    }
    
  })

  return ret[0];  
}

export function parseMidgardTx(tx) {
  //get action
  let tx_action = tx.actions[0];

  let res = {
    type: tx_action.type,
    inout: [{
        is: tx_action?.in[0]?.coins[0]?.asset,
        address: tx_action?.in[0]?.address ?? '',
        txID: tx_action?.in[0]?.txID ?? '',
        asset: {
          name: tx_action?.in[0]?.coins[0]?.asset,
          amount: tx_action?.in[0]?.coins[0]?.amount / 10**8,
        }
      },
      {
        is: tx_action?.out[0]?.coins[0]?.asset,
        address: tx_action?.out[0]?.address ?? '',
        txID: tx_action?.out[0]?.txID ?? '',
        asset: {
          name: tx_action?.out[0]?.coins[0]?.asset,
          amount: tx_action?.out[0]?.coins[0]?.amount / 10**8,
        }
    }],
    date: (new Date(tx_action?.date / 10 ** 6)).toLocaleString(),
    height: tx_action.height,
    pools: tx_action.pools,
    status: tx_action.status
  }

  if (tx_action.metadata) {
    res['gas'] = tx_action.metadata[tx_action.type].networkFees.map(f => (f.amount / 10**8 + ' ' + f.asset))
  }

  return res;
}

export function synthToAsset(assetString) {
  let asset = assetFromString(assetString.toUpperCase());
  
  if (assetString === 'rune')
    asset = AssetRuneNative;
  
  if(!isSynthAsset(asset))
    return assetToString(asset)
  
  asset.synth = false;

  return assetToString(asset);
}

export function curFormat(number) {
  return this.$options.filters.currency(number)
}

export function formatAsset(asset) {
  return asset.length > 10 ? 
    asset.slice(0, 14) + '...':
    asset
}

export function addressFormat(string, number=6, isOnlyLast=false) {
  return (isOnlyLast?'':(string.slice(0,number)+'...'))+string.slice(-number);
}

export function fillNodeData(nodes, el) {
  if (!el)
    return
  nodes.push({
    address: el.address,
    ip: el.ipAddress,
    status: el.status,
    version: el.version,
    slash: Number.parseInt(el.slashPoints),
    award: (Number.parseFloat(el.currentAward)/10**8).toFixed(2),
    bond: el.bond/10**8 < 0.01?0:el.bond/10**8
  })
}

export function runeCur() {
  return AssetCurrencySymbol.RUNE
}