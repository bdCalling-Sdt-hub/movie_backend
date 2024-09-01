const { GetMovieTypeList } = require('../Controller/MOvieTypeController');

const MovieTypeRoutes = require('express').Router();
MovieTypeRoutes.get('/movie-type/:type',GetMovieTypeList)
module.exports = MovieTypeRoutes