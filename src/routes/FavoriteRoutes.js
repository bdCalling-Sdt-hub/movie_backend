
const { GetFavorite, AddRemoveFavorite } = require('../Controller/FavoriteController');
const verifyToken = require('../middlewares/Token/verifyToken');
const FavoriteRoutes = require('express').Router();
FavoriteRoutes.post('/add-favorite/:movie_id', verifyToken,AddRemoveFavorite )
    .get('/get-favorite', verifyToken,GetFavorite )
module.exports = FavoriteRoutes