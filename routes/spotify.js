const express = require('express');
const router = express.Router();
const spotify = require('../src/spotifyApi');
const spotifyApi = spotify.getSpotifyApi();

/* GET login page which just redirects to spotify login. */
router.get('/login', (req, res) => {
  res.redirect(spotifyApi.createAuthorizeURL(spotify.getScopes(), 'app-state'));
});

router.get('/spotify', (req, res) => {
  spotifyApi.setAccessToken(req.body.access_token);
  spotifyApi.setRefreshToken(req.body.refresh_token);
});

router.get('/research', (req, res) => {
  res.render('research', { title: 'Spotify Playlist Research' });
});

module.exports = router;
