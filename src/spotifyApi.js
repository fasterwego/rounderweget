const SpotifyApi = require('spotify-web-api-node');

const clientId = '';
const clientSecret = '';
const redirectUri = '';

const spotify = new SpotifyApi({
  clientId: clientId,
  clientSecret: clientSecret,
  redirectUri: redirectUri
});

let getSpotifyApi = () => {
  return spotify;
};

let getScopes = () => {
  return [
    'user-read-currently-playing',
    'playlist-modify-public',
    'user-top-read'
  ];
};

module.exports = { getSpotifyApi, getScopes };
