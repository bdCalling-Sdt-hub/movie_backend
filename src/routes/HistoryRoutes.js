const { AddRemoveHistory, GetHistory } = require('../Controller/HistoryController');
const verifyToken = require('../middlewares/Token/verifyToken');

const HistoryRoutes = require('express').Router();
HistoryRoutes.post('/add-history/:movie_id', verifyToken, AddRemoveHistory)
    .get('/get-history', verifyToken, GetHistory)
module.exports = HistoryRoutes