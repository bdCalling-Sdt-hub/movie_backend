const { addToCalender, getCalender } = require('../Controller/CalendarController');
const verifyToken = require('../middlewares/Token/verifyToken');

const CalenderRoutes = require('express').Router();
CalenderRoutes.get('/get-calendered-movie', verifyToken, getCalender).post('/add-to-calender', verifyToken, addToCalender)

module.exports = CalenderRoutes