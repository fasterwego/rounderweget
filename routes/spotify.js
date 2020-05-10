const express = require('express');
const router = express.Router();
const spotify = require('../src/spotifyApi');
const spotifyApi = spotify.getSpotifyApi();

// variables involved in hacky way of moving data from POST to GET
var recommendations = {};
var features = {};
var identity = {};

/* GET /spotify/ handles the response from spotify with tokens */
router.get('/', (req, res) => {
  // this should set the tokens on api object, as long as we use
  // getSpotifyApi it should always be set
  // TODO: implement refresh flow
  spotifyApi.authorizationCodeGrant(req.query.code).then(
    data => {
      spotifyApi.setAccessToken(data.body.access_token);
      spotifyApi.setRefreshToken(data.body.refresh_token);
      res.redirect('spotify/research');
    })
    .catch(err => console.log(err));
});

/* GET login page which just redirects to spotify login. */
router.get('/login', (req, res) => {
  // FIXME: remove showDialog bool if we don't need to always show the dialog
  res.redirect(spotifyApi.createAuthorizeURL(spotify.getScopes(), 'app-state', true));
});

router.get('/research', (req, res) =>
  res.render('research', { title: 'Spotify Playlist Research' }));

router.get('/recommendations', (req, res) =>
  res.render('recommendations', { title: 'Spotify Playlist Research - Recommendations', data: recommendations }));

router.get('/guts', (req, res) =>
  res.render('guts', { title: 'Spotify Playlist Research - Track Features', data: features }));

router.post('/research', (req, res) => {
  spotifyApi.getRecommendations(massageOptions(req.body)).then(
    data => {
      // this is a total hack because I don't know enough about express routing
      // though something very similar to this is recommended on stack overflow, so...
      recommendations = data;
      res.redirect('recommendations');
    }).catch(err => console.log(err));
});

/* get the current list of genres for use with seeds in /research */
router.get('/genres', (req, res) => {
  spotifyApi.getAvailableGenreSeeds().then(
    (data) => {
      console.log(data);
      res.render('genres', { title: 'Spotify Research - Available Genres', data: data });
    })
    .catch(err => {
      console.log(err)
      res.render('error', err);
    });
});

router.get('/features', (req, res) => res.render('features', { title: 'Spotify Track Features' }));

router.post('/features', (req, res) => {
  spotifyApi.getAudioFeaturesForTrack(req.body.trackId).then(
    data => {
      console.log(data);
      // this is a total hack because I don't know enough about express routing
      // though something very similar to this is recommended on stack overflow, so...
      features = data.body;
      res.redirect('guts');
    }).catch(err => console.log(err));
});

router.get('/identity', (req, res) => {
  spotifyApi.getMe().then(
    data => {
      identity = data;
      res.redirect('me');
    }).catch(err => console.log(err));
});

router.get('/me', (req, res) => res.render('me', { data: identity }));

const massageOptions = usrOpts => {
  let opts = removeBlankProps(usrOpts);
  let trackSeeds = getSeeds(opts, 'track-seed');
  let artistSeeds = getSeeds(opts, 'artist-seed');
  let genreSeeds = getSeeds(opts, 'genre-seed');

  if (trackSeeds.length) opts.seed_tracks = trackSeeds;
  if (artistSeeds.length) opts.seed_artists = artistSeeds;
  if (genreSeeds.length) opts.seed_genres = genreSeeds;

  if (opts.hasOwnProperty('min_duration')) {
    opts.min_duration *= 60000;
  }

  if (opts.hasOwnProperty('max_duration')) {
    opts.max_duration *= 60000;
  }

  if (opts.hasOwnProperty('target_duration')) {
    opts.target_duration *= 60000;
  }

  return removeSeedProps(opts);
};

const removeSeedProps = usrOpts =>
  Object.keys(usrOpts)
    .filter(k => !k.includes('-seed'))
    .reduce((newObj, k) => {
      let x = { ...newObj, [k]: usrOpts[k] };
      return x;
    }, {});

const removeBlankProps = usrOpts =>
  Object.keys(usrOpts)
    .filter(k => usrOpts[k]) // Remove falsey
    .reduce(
      (newObj, k) =>
        typeof usrOpts[k] === 'object'
          ? { ...newObj, [k]: removeBlankProps(usrOpts[k]) } // Recurse.
          : { ...newObj, [k]: usrOpts[k] }, // Copy value.
      {}
    );

const getSeeds = (usrOpts, keyName) => {
  return Object.keys(usrOpts).filter(key => key.includes(keyName)).map(key => usrOpts[key]);
};

module.exports = router;
