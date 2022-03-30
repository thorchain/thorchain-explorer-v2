// Formats time in seconds into `hh:mm hrs`
export function formatTime(val) {
  var hrs = ~~(val / 3600);
  var mins = ~~((val % 3600) / 60);

  var ret = "";
  if (hrs > 0) {
    ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
  }

  ret += "" + mins + " hrs";
  return ret;
}

export function nextChurnTime(blockHeight, nextChurnHeight) {
  console.log(blockHeight, nextChurnHeight)
  let val = (nextChurnHeight - blockHeight)*6;
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