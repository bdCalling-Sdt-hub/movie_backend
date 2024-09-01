const NotificationRoutes = require('express').Router();
const { GetNotifications, UpdateNotifications } = require('../Controller/NotificationsController');
const verifyToken = require('../middlewares/Token/verifyToken');
NotificationRoutes.get('/get-notifications', verifyToken, GetNotifications).post('/update-notification', verifyToken,UpdateNotifications);

module.exports = NotificationRoutes