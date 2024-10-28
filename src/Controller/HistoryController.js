const axios = require('axios');
const { API_KEY } = require('../config/defaults');
const globalErrorHandler = require("../utils/globalErrorHandler");
const Queries = require("../utils/Queries");
const History = require('../Models/HistoryModel');

const AddRemoveHistory = async (req, res, next) => {
    try {
        const { id } = req.user;
        if (!id) {
            return res.send({ success: false, message: "User not found" });
        }
        const { movie_id } = req.params;

        const existingHistory = await History.findOne({ user: id, movie: movie_id });
        if (existingHistory) {
            const result = await History.deleteOne({ user: id, movie: movie_id });
            if (result.deletedCount >= 1) {
                return res.send({ success: false, message: "Removed from history" });
            } else {
                return res.send({ success: false, message: "Something went wrong" });
            }
            // return res.status(403).send({ success: false, message: "Already added to history " })
        } else {
            const history = new History({
                user: id,
                movie: movie_id
            });
            await history.save();
            return res.status(200).send({ success: true, data: history, message: "Added to history" });
        }
    } catch (error) {
        globalErrorHandler(error, req, res, next, "History");
    }
};

const GetHistory = async (req, res, next) => {
    try {
        const { id, role } = req.user;
        const { search, type, status, ...queryKeys } = req.query;
        const searchKey = {};
        let populatePaths = [];
        if (role !== "ADMIN") {
            queryKeys.user = id;
        }
        const result = await Queries(History, queryKeys, searchKey, populatePath = populatePaths);
        const historyMovieIds = result?.data?.map(history => history.movie);

        if (historyMovieIds && historyMovieIds.length > 0) {
            const moviePromises = historyMovieIds.map(movieId => {
                return axios.get(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}`)
                    .then(response => {
                        const item = response?.data;
                        return {
                            adult: item?.adult,
                            background_color: `https://image.tmdb.org/t/p/w500${item?.backdrop_path}`,
                            movie_types: item?.genres?.map(genre => genre.id),
                            movie_id: item?.id,
                            original_language: item?.original_language,
                            original_title: item?.original_title || item?.original_name,
                            overview: item?.overview,
                            popularity: item?.popularity,
                            poster: `https://image.tmdb.org/t/p/w500${item?.poster_path}`,
                            release_date: item?.release_date || item?.first_air_date,
                            title: item?.title || item?.name,
                            video: item?.video,
                            rating: item?.vote_average,
                            vote: item?.vote_count
                        };
                    })
                    .catch(error => {
                        console.error(`Error fetching movie with ID ${movieId}: `, error);
                        return null;
                    });
            });
            const movies = await Promise.all(moviePromises);
            const validMovies = movies.filter(movie => movie !== null);
            res.status(200).send({ success: true, data: validMovies, pagination: result?.pagination });
        } else {
            res.status(200).send({ success: true, data: [] });
        }
    } catch (error) {
        globalErrorHandler(error, req, res, next, "History");
    }
};

module.exports = { AddRemoveHistory, GetHistory };