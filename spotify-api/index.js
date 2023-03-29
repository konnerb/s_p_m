const SpotifyWebApi = require('spotify-web-api-node');
const { writeFile, existsSync, mkdirSync } = require('fs');
const { convertMs, convertToCSV } = require('../helpers');

let spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI
});


module.exports.configureSpotfiyPlaylist = async (token, fromPlaylist, toPlaylist = '', options = {}) => {

  if (!token || !fromPlaylist) return;

  spotifyApi.setAccessToken(token);

  const { createCSVFile = true, tempoRange = 2, keyRange = 1, csvName = '' } = options;

  try {
    const playlistTracks = await spotifyApi.getPlaylistTracks(fromPlaylist, { fields: 'items' });
    const playlistTrackIds = playlistTracks.body.items.map(t => t.track.id);
    const playlistTrackFeatures = await spotifyApi.getAudioFeaturesForTracks(playlistTrackIds);

    const sortTracks = playlistTrackFeatures.body.audio_features.sort((a, b) => {

      if (!tempoRange && !keyRange) return a.tempo - b.tempo;

      const tempoA = Math.round(a.tempo);
      const tempoB = Math.round(b.tempo);

      const tempoRangeValid = (tempoA + tempoRange) >= tempoB && (tempoA - tempoRange) <= tempoB;
      const keyRangeValid = (a.key + keyRange) >= b.key && (a.key - keyRange) <= b.key;

      if (tempoRangeValid && keyRangeValid) {
        return a.energy - b.energy;
      } else if (tempoRangeValid) {
        return a.key - b.key;
      } else {
        return a.tempo - b.tempo
      }
    });

    const playlistTrackURIs = sortTracks.map(track => track.uri);

    if (toPlaylist) {
      await spotifyApi.addTracksToPlaylist(toPlaylist, playlistTrackURIs);
      console.log('Tracks Successfully updated to: ')
    }

    if (!createCSVFile) return;

    const configureTrackData = sortTracks.map((song, index) => {

      const { energy, key, mode, valence, tempo, id, uri, duration_ms, time_signature } = song;
      const { track } = playlistTracks.body.items.find(({ track }) => track.id === id);

      const artists = track.artists.map((artist) => artist.name);
      const formattedArtists = artists.length > 1 ? artists.join(',').replace(/,/g, ' / ') : artists.join(' ');

      return {
        Order: index + 1,
        Artist: formattedArtists,
        Name: track.name.replace(/,/g, ' '),
        BPM: Math.round(tempo),
        Key: `${key + 1}${mode === 1 ? 'B' : 'A'}`,
        Energy: `${Math.round(energy * 100)}%`,
        Valence: `${Math.round(valence * 100)}%`,
        Duration: convertMs(duration_ms),
        Time_Signature: time_signature,
        uri,
        id,
        Artwork: track.album?.images[0]?.url || 'no artwork available :('
      }
    });

    const csv = await convertToCSV(configureTrackData);

    if (!existsSync('./files')) {
      mkdirSync('./files');
    }

    const playlistName = csvName
      ? null
      : toPlaylist
        ? await spotifyApi.getPlaylist(toPlaylist, { fields: 'name' })
        : await spotifyApi.getPlaylist(fromPlaylist, { fields: 'name' });

    let csvFileName = csvName ? csvName : playlistName ? playlistName.body.name : 'playlist';

    if (existsSync(`files/${csvFileName}.csv`)) {
      let timestamp = Date.now().toString();
      timestamp = timestamp.substring(timestamp.length - 4)

      csvFileName = `${csvFileName}_${timestamp}`;
    }

    await writeFile(`files/${csvFileName}.csv`, csv, () => console.log(`Your playlist csv "${csvFileName}" was created in /files directory.`));

    return;

  } catch (error) {
    console.error("ERROR", error)
  }
  return;
}