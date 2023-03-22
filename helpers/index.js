module.exports.convertToCSV = async (arr) => {
  const array = [Object.keys(arr[0])].concat(arr);

  return await array.map(it => {
    return Object.values(it).toString();
  }).join('\n');
};

module.exports.convertMs = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);

  return (
    seconds == 60 ?
      (minutes + 1) + ":00" :
      minutes + ":" + (seconds < 10 ? "0" : "") + seconds
  );
};