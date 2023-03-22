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
    const trackPlaylistFeatures = await spotifyApi.getAudioFeaturesForTracks(trackIds);

    const sortTracks = trackPlaylistFeatures.body.audio_features.sort((a, b) => {

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

    const sortTrackIDs = sortTracks.map(track => track.uri);

    if (to) {
      await spotifyApi.addTracksToPlaylist(to, sortTrackIDs);
      console.log('Track Successfully updated to: ')
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
    await writeFile('files/playlist_data.csv', csv, () => console.log('Playlist csv created.'));

  } catch (error) {
    console.error("ERROR", error)
  }


  // spotifyApi.getUser(user)
  //   .then(function (data) {
  //     console.log('Some information about this user', data.body);
  //   }, function (err) {
  //     console.log('Something went wrong!', err);
  //   });

  // Get tracks in a playlist
  // spotifyApi.getPlaylistTracks(playlist)
  //   .then(
  //     function (data) {
  //       console.log('The playlist contains these tracks', data.body);
  //     },
  //     function (err) {
  //       console.log('Something went wrong!', err);
  //     }
  //   );

  // Get artists related to an artist
  // spotifyApi.getArtistRelatedArtists(callasto)
  //   .then(function (data) {
  //     console.log(data.body);
  //   }, function (err) {
  //     done(err);
  //   });

  /* Get Audio Features for a Track */
  // spotifyApi.getAudioFeaturesForTrack(track)
  //   .then(function (data) {
  //     console.log(data.body);
  //   }, function (err) {
  //     done(err);
  //   });

  // /* Get Audio Analysis for a Track */
  // spotifyApi.getAudioAnalysisForTrack(track)
  //   .then(function (data) {
  //     console.log(data.body);
  //   }, function (err) {
  //     done(err);
  //   });

  /* Get Audio Features for several tracks */
  // spotifyApi.getAudioFeaturesForTracks(['4iV5W9uYEdYUVa79Axb7Rh', '3Qm86XLflmIXVm1wcwkgDK'])
  // .then(function(data) {
  //   console.log(data.body);
  // }, function(err) {
  //   done(err);
  // });
}