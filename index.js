const { configureSpotfiyPlaylist } = require('./spotify-api');

const fromPlaylist = process.env.FROM_PLAYLIST;
const toPlaylist = process.env.TO_PLAYLIST;

const runServer = async () => {
  await configureSpotfiyPlaylist(fromPlaylist)
};

runServer();