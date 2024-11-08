
const { Server } = require("socket.io");
const http = require('http')
const express = require("express")
const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: true,
});
// {
//     origin: ["http://localhost:3000"],
//     methods: ["GET", "POST"],
// }
const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};
let socketConnection;
const userSocketMap = {}; 

io.on("connection", (socket) => {
    socketConnection = socket;
    const userId = socket.handshake.query.userId;

    if (userId !== undefined) {
        userSocketMap[userId] = socket.id;
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

module.exports = { app, io, server, getReceiverSocketId, socketConnection };