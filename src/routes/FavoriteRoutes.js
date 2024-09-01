
const { GetFavorite, AddRemoveFavorite } = require('../Controller/FavoriteController');
const verifyToken = require('../middlewares/Token/verifyToken');
const FavoriteRoutes = require('express').Router();
FavoriteRoutes.post('/add-history/:movie_id', verifyToken,AddRemoveFavorite )
    .get('/get-history', verifyToken,GetFavorite )
module.exports = FavoriteRoutes