const FollowRoutes = require('express').Router();
const { getFollow, createFollow } = require('../Controller/FollowController');
const verifyToken = require('../middlewares/Token/verifyToken');

FollowRoutes.post('/add-follow', verifyToken, createFollow)
    .get('/get-follow', verifyToken, getFollow);

module.exports = FollowRoutes;
