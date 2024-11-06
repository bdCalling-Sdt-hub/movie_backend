const { GetMovieTypeList } = require('../Controller/MovieTypeController');

const MovieTypeRoutes = require('express').Router();
MovieTypeRoutes.get('/movie-type/:type',GetMovieTypeList)
module.exports = MovieTypeRoutes