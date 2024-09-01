const SettingsRoutes = require('express').Router();
const { UpdateSettings, GetSettings } = require('../Controller/SettingController');
const verifyToken = require('../middlewares/Token/verifyToken');
SettingsRoutes.get('/get-settings/:type', GetSettings).post('/update-settings', verifyToken, UpdateSettings);
module.exports = SettingsRoutes