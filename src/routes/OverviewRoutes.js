const { getOverview } = require('../Controller/OverviewController');
const verifyToken = require('../middlewares/Token/verifyToken');

const overviewRoutes = require('express').Router();
overviewRoutes.get('/overview', verifyToken, getOverview)
module.exports = overviewRoutes