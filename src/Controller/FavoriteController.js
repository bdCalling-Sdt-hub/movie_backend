
const globalErrorHandler = require("../utils/globalErrorHandler");
const Queries = require("../utils/Queries");
const Favorite = require("../Models/FavoriteModel");
const axios = require('axios');
const { API_KEY } = require('../config/defaults');
const AddRemoveFavorite = async (req, res, next) => {
    try {
        const { id } = req.user;
        if (!id) {
            return res.send({ success: false, message: "user not found" });
        }
        const { movie_id } = req.params;

        const existingFavorite = await Favorite.findOne({ user: id, movie: movie_id });
        if (existingFavorite) {
            const result = await Favorite.deleteOne({ user: id, movie: movie_id });
            if (result.deletedCount >= 1) {
                return res.send({ success: false, message: "removed from Favorite" });
            } else {
                return res.send({ success: false, message: "something went wrong" });
            }
        } else {
            const favorite = new Favorite({
                user: id,
                movie: movie_id
            })
            console.log(movie_id)
            console.log(favorite)
            await favorite.save();
            return res.status(200).send({ success: true, data: favorite, message: "Added to Favorite" });
        }
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Favorite");
    }
}

const GetFavorite = async (req, res, next) => {
    try {
        const { id, role } = req.user;
        const { search, type, status, ...queryKeys } = req.query;
        let searchKey = {};
        let populatePaths = [];
        if (role !== "ADMIN") {
            queryKeys.user = id;
        }
        const result = await Queries(Favorite, queryKeys, searchKey, populatePath = populatePaths);
        const favoriteMovieIds = result?.data?.map(favorite => favorite.movie);
        // return res.send(favoriteMovieIds)
        if (favoriteMovieIds && favoriteMovieIds.length > 0) {
            const moviePromises = favoriteMovieIds.map(movieId => {
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
        globalErrorHandler(error, req, res, next, "Favorite");
    }
};


module.exports = { AddRemoveFavorite, GetFavorite }