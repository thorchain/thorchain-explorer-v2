import { AssetCurrencySymbol, assetFromString, AssetRuneNative, assetToString, isSynthAsset } from "@xchainjs/xchain-util";

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
  console.log(ntx)
  let ret = [];
  ntx.tx?.body.messages.forEach(el => {
    // Send messages
    switch (el['@type']) {
      case "/types.MsgSend":
        ret.push({
          type: 'Send',
          amount: el?.amount,
          to: el['to_address'],
          from: el['from_address'],
          gas: +ntx?.tx_response?.gas_used,
          txID: ntx?.tx_response?.txhash,
          date: ntx.tx_response.timestamp,
          height: +ntx?.tx_response.height
        })
        break;
    
      default:
        break;
    }
  })

  return ret;  
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

export function addressFormat(string) {
  return string.slice(0,6)+'...'+string.slice(-6);
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