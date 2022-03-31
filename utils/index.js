import { assetFromString, AssetRuneNative, assetToString, isSynthAsset } from "@xchainjs/xchain-util";

// Formats time in seconds into `hh:mm hrs`
export function formatTime(val) {
  var hrs = ~~(val / 3600);
  var mins = ~~((val % 3600) / 60);
  
  var ret = `${hrs}:${mins < 10? `0${mins}` : mins} hrs`;
  
  return ret;
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