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
  let val = (nextChurnHeight - blockHeight)/6;
  return formatTime(val);        
}