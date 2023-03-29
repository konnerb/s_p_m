const request = require('request');

const { configureSpotfiyPlaylist } = require('./spotify-api');

const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET

const fromPlaylist = process.env.FROM_PLAYLIST;
const toPlaylist = process.env.TO_PLAYLIST;

const authOptions = {
  url: 'https://accounts.spotify.com/api/token',
  headers: {
    'Authorization': 'Basic ' + (new Buffer.from(clientId + ':' + clientSecret).toString('base64'))
  },
  form: {
    grant_type: 'client_credentials'
  },
  json: true
};

const runServer = async () => {
  try {
    request.post(authOptions, async (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const token = body.access_token;
        await configureSpotfiyPlaylist(token, fromPlaylist);
      }
    })
  } catch (error) {
    console.error('ERROR', error);
  }
};

runServer();