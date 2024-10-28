const cookieParser = require("cookie-parser");
const cors = require('cors');
const express = require("express");
const path = require('path');
const { LOCAL_CLIENT,CLIENT } = require("../config/defaults");
const applyMiddleware = (app)=>{
    
// middleware
app.use(cors({
    origin: [
        LOCAL_CLIENT,
        CLIENT,'*','http://192.168.10.103:3003','http://192.168.10.103:3004','http://192.168.10.103:3005'
    ],
    credentials: true,
    optionsSuccessStatus: 200
}));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use(express.json());
app.use(cookieParser());
}

module.exports = applyMiddleware