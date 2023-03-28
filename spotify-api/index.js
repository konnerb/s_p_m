const SpotifyWebApi = require('spotify-web-api-node');
const { writeFile, existsSync, mkdirSync } = require('fs');
const { convertMs, convertToCSV } = require('../helpers');

let spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI
});

spotifyApi.setAccessToken(process.env.TOKEN);

module.exports.configureSpotfiyPlaylist = async (from, to = '', options = {}) => {

  if (!from) return;

  const { createCSVFile = true, tempoRange = 2, keyRange = 1 } = options;

  try {
    const playlistData = await spotifyApi.getPlaylistTracks(from)
    const trackIds = playlistData.body.items.map(t => t.track.id);
    const playlistTrackFeatures = await spotifyApi.getAudioFeaturesForTracks(trackIds);

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

    const playlistTrackIDs = sortTracks.map(track => track.uri);

    if (to) {
      await spotifyApi.addTracksToPlaylist(to, playlistTrackIDs);
      console.log('Tracks Successfully updated to: ')
    }

    if (!createCSVFile) return;

    const configureTrackData = sortTracks.map(song => {

      const { energy, key, mode, valence, tempo, id, uri, track_href, duration_ms, time_signature } = song;
      const { track } = playlistData.body.items.find(({ track }) => track.id === id);

      // should use + or / for multiple artists?
      const artist = track.artists.map((artist) => artist.name).join(' ').replace(/,/g, ' ')

      return {
        artist,
        name: track.name.replace(/,/g, ' '),
        BPM: Math.round(tempo),
        key: `${key + 1}${mode === 1 ? 'B' : 'A'}`,
        energy: `${Math.round(energy * 100)}%`,
        valence: `${Math.round(valence * 100)}%`,
        duration: convertMs(duration_ms),
        time_signature,
        uri,
        id,
        track_href
      }
    });

    const csv = await convertToCSV(configureTrackData);

    if (!existsSync('./files')) {
      mkdirSync('./files');
    }

    await writeFile('files/playlist_data.csv', csv, () => console.log('Playlist csv created in /files directory.'));

  } catch (error) {
    console.error("ERROR", error)
  }
}