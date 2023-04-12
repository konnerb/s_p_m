module.exports.convertToCSV = async (arr) => {
  const array = [Object.keys(arr[0])].concat(arr);

  return await array.map(val => {
    return Object.values(val).toString();
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

module.exports.isAlphaNumeral = (value) => {
  const validLength = value.length >= 1 && value.length <= 254;
  const regex = new RegExp(/^[a-zA-Z0-9]+$/);

  return !!value && validLength && regex.test(value);
};