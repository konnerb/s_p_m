const SpotifyWebApi = require('spotify-web-api-node');
const { writeFile } = require('fs');

let spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI
});

spotifyApi.setAccessToken(process.env.TOKEN);

const artistPlaylist = process.env.PLAYLIST

const convertToCSV = async (arr) => {
  const array = [Object.keys(arr[0])].concat(arr)

  return await array.map(it => {
    return Object.values(it).toString()
  }).join('\n')
}

const run = async () => {
  const createCSVFile = true;
  const tempoRange = 2;
  const keyRange = 2;

  try {
    const playlistData = await spotifyApi.getPlaylistTracks(artistPlaylist)
    const trackIds = playlistData.body.items.map(t => t.track.id);
    const trackPlaylistFeatures = await spotifyApi.getAudioFeaturesForTracks(trackIds);

    const sortTrackByTempo = trackPlaylistFeatures.body.audio_features.sort((a, b) => {

      if (!tempoRange && !keyRange) return a.tempo - b.tempo;

      const tempoA = Math.round(a.tempo);
      const tempoB = Math.round(b.tempo);
      const tempoAValid = (tempoA + tempoRange) >= tempoB && (tempoA - tempoRange) <= tempoB;
      const keyRangeValid = (a.key + keyRange) >= b.key && (a.key - keyRange) <= b.key;
      // const tempoBValid = (tempoB - keyRange) <= tempoA || (tempoB + keyRange) >= tempoA;

      if (tempoAValid && keyRangeValid) {
        return a.energy - b.energy;
      } else if (tempoAValid) {
        return a.key - b.key;
      } else {
        return a.tempo - b.tempo
      }
    });

    // const sortTrackIDs = sortTrackByTempo.map(track => track.uri);
    // const addTracksToPlaylist = await spotifyApi.addTracksToPlaylist(testPlaylist3, sortTrackIDs);
    // console.log('sortTrackIDs', sortTrackByTempo.map(({ key, tempo, energy }) => ({ key, tempo, energy })));

    if (!createCSVFile) return;

    const parseTrackData = sortTrackByTempo.map((song) => {

      const { energy, key, mode, valence, tempo, id, uri, track_href, duration_ms, time_signature } = song;
      const { track } = playlistData.body.items.find(({ track }) => track.id === id);
      const artist = track.artists.map((artist) => artist.name).join(' ')

      return {
        artist,
        name: track.name.replace(/,/g, ' '),
        tempo,
        key,
        mode,
        energy,
        valence,
        id,
        uri,
        track_href,
        duration_ms,
        time_signature
      }
    });

    const csv = await convertToCSV(parseTrackData);
    await writeFile('files/playlist_data.csv', csv, (err) => console.error(err));
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
};

run();