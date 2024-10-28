
const Movie = require("../Models/MovieModel");
const Notification = require("../Models/NotificationModel");
const { getReceiverSocketId, io, socketConnection } = require("../Socket");
const Queries = require("../utils/Queries");
const axios = require('axios');
const { API_KEY } = require('../config/defaults');
//66fa6ea0a324ae8fc44438cb
//create notification
const CreateNotification = async (data, userId) => {
    const { title, movie, message, type } = data;
    const notification = new Notification({ movie, title, message, type, user: userId });
    const [saveNotification, movieData] = await Promise.all([
        notification.save(),
        Movie.findById(movie)
    ])
    const NotificationData = { ...notification, movie: movieData }
    // const NotificationData = { ...saveNotification._doc, movie: movieData }
    if (type !== 'relies') {
        const receiverSocketId = getReceiverSocketId(userId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("new-notification", NotificationData);
        }
    } else {
        socketConnection.broadcast.emit("new-notification", NotificationData);
    }
};
// get all notifications


const GetNotifications = async (req, res) => {
    try {
        const { id } = req.user; 
        const { search, ...queryKeys } = req.query;
        queryKeys.$or = [{ user: id }];
        const notificationsResponse = await Queries(Notification, queryKeys, {}, null, null);
        const notifications = notificationsResponse.data;
        if (!notifications.length) {
            return res.status(200).send({ success: true, data: [] });
        }
        const movieIds = notifications.map(notification => notification.movie);
        const movieRequests = movieIds.map(movieId =>
            axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
                params: {
                    api_key: API_KEY,
                    language: 'en-US'
                }
            })
        );
        const movieResponses = await Promise.all(movieRequests);
        const formattedMovies = movieResponses.map(response => {
            const movie = response.data;
            return {
                adult: movie.adult,
                movie_types: movie.genre_ids,
                movie_id: movie.id,
                original_language: movie.original_language,
                original_title: movie.original_title || movie.name,
                overview: movie.overview,
                popularity: movie.popularity,
                poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                release_date: movie.release_date || movie.first_air_date,
                title: movie.title || movie.name,
            };
        });

        // Combine notification data with movie data
        const formattedNotifications = notifications.map((notification, index) => ({
            _id: notification._id,
            seenBy: notification.seenBy,
            title: notification.title,
            message: notification.message,
            movie: formattedMovies[index], // Movie data from TMDB for this notification
            type: notification.type,
            user: notification.user,
            createdAt: notification.createdAt,
            updatedAt: notification.updatedAt,
            __v: notification.__v
        }));

        // Send the formatted notifications back to the client, including pagination
        res.status(200).send({
            success: true,
            data: formattedNotifications,
            pagination: notificationsResponse.pagination,  // Include pagination from the Queries function
        });
    } catch (error) {
        // Handle errors
        res.status(500).send({ success: false, message: error?.message || 'Internal server error', ...error });
    }
};


// update notifications 
const UpdateNotifications = async (req, res) => {
    try {
        const { id } = req.user
        const { notificationIds } = req.body
        const notifications = await Notification.updateMany(
            { _id: { $in: notificationIds } },
            { $push: { seenBy: id } }
        );
        res.status(200).send({ success: true, message: 'Notifications Read successfully', data: notifications })
    } catch (error) {
        res.status(500).send({ success: false, message: error?.message || 'Internal server error', ...error });
    }
}

module.exports = { CreateNotification, GetNotifications, UpdateNotifications }