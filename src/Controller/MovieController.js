const axios = require('axios');
const globalErrorHandler = require("../utils/globalErrorHandler");
const { API_KEY } = require('../config/defaults');
const StudioModel = require('../Models/StudioModel');
const Movie = require('../Models/MovieModel');
const Queries = require('../utils/Queries');
// get movie list admin
const GetTMDBMovieList = async (req, res, next) => {
    try {
        if (req.user?.role !== "ADMIN") {
            return res.status(403).send({ success: false, message: "Forbidden access" });
        }
        const { page, search, type } = req.query;
        let response;
        if (search) {
            response = await axios.get(`https://api.themoviedb.org/3/search/${type || 'movie'}?api_key=${API_KEY}&query=${search}&page=${page || 1}`);
        } else {
            response = await axios.get(`https://api.themoviedb.org/3/discover/${type || 'movie'}?api_key=${API_KEY}&page=${page || 1}`);//&language=en-US&sort_by=popularity.desc
        }
        const data = response?.data?.results?.map(item => {
            return {
                adult: item?.adult,
                background_color: `https://image.tmdb.org/t/p/w500${item?.backdrop_path}`,
                movie_types: item?.genre_ids,
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
            }
        });
        const formateData = {
            data,
            total_pages: response?.data?.total_pages ? response?.data?.total_pages > 500 ? 500 : 1 : 1,
            total_results: response?.data?.total_results || 0,
        }
        res.status(200).send({ success: true, ...formateData });
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Studio");
    }
}
// add movie 
const AddMovie = async (req, res, next) => {
    try {
        if (req.user?.role !== "ADMIN") {
            return res.status(403).send({ success: false, message: "Forbidden access" });
        }
        console.log(req.body?.total_movies, req.body?.studio_id)
        const movies = Array.isArray(req.body?.movies) ? req.body?.movies : [req.body?.movies];
        const [savedMovies] = await Promise.all(
            movies.map(movieData => {
                const data = new Movie(movieData);
                return data.save();
            }),
        );
        await StudioModel.updateOne(
            { _id: req.body?.studio_id },
            { $inc: { total_movies: req.body?.total_movies } },
        )
        return res.status(200).send({
            success: true,
            // data: savedMovies,
            message: `Movies ${movies?.[0]?.type} successfully`
        });
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Movie");
    }
}
//get all movie user
const GetAllMovie = async (req, res, next) => {
    try {
        const { search, actorId, ...queryKeys } = req.query;
        if (!queryKeys?.type) {
            queryKeys.type = "movie"
        }
        const searchKey = {}
        if (search) {
            searchKey.title = search;
            searchKey.overview = search
        }
        if (actorId) {
            const response = await axios.get(`https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${API_KEY}`);
            const movieIds = response.data.cast.map(movie => movie.id);
            if (movieIds.length === 0) {
                return res.status(404).send({ success: false, message: "Movie not found for this actor" });
            }
            else {
                queryKeys.movie_id = { $in: movieIds };
            }
        }
        const result = await Queries(Movie, queryKeys, searchKey);
        res.status(200).send({ ...result });
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Studio");
    }
}
//admin delete movies 
const DeleteMovie = async (req, res, next) => {
    try {
        const ids = req.body.ids;
        if (req.user?.role !== "ADMIN") {
            return res.status(403).send({ success: false, message: "Forbidden access" });
        }
        const [deletedMovies, deletedStudio] = await Promise.all(
            Movie.deleteMany({ _id: { $in: ids } }),
            StudioModel.findOneAndUpdate(
                { _id: req.body?.studio_id },
                { $inc: { total_movies: -req.body?.total_movies || 0 } },
            )
        );
        if (deletedMovies.deletedCount === 0) {
            return res.status(404).send({ success: false, message: "Movies not found" });
        }
        return res.status(200).send({
            success: true,
            data: deletedMovies,
            message: "Movies deleted successfully"
        });
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Studio");
    }
}
// movie details 
const GetMovieDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const movie = await Movie.findById(id);
        let trailer = []
        if (!movie) {
            return res.status(404).send({ success: false, message: "Movie not found" });
        }//movie_id  ${API_KEY}
        const [response, trailerResponse, platform, actors] = await Promise.all([
            axios.get(`https://api.themoviedb.org/3/${movie?.type}/${movie?.movie_id}?api_key=${API_KEY}`),
            axios.get(`https://api.themoviedb.org/3/${movie?.type}/${movie?.movie_id}/videos?api_key=${API_KEY}`),
            axios.get(`https://api.themoviedb.org/3/${movie?.type}/${movie?.movie_id}/watch/providers?api_key=${API_KEY}`),
            axios.get(`https://api.themoviedb.org/3/${movie?.type}/${movie?.movie_id}/credits?api_key=${API_KEY}`)
        ])
        const trailers = trailerResponse?.data?.results?.filter(
            (video) => video.site === 'YouTube'
        );
        if (trailers.length > 0) {
            const trailerUrls = trailers.map(trailer => {
                return {
                    url: `https://www.youtube.com/watch?v=${trailer.key}`,
                    name: trailer.name,
                    type: trailer.type
                }
            });
            trailer = trailerUrls;
        } else {
            console.log('No trailers found.');
            trailer = [];
        }
        const data = response?.data;
        const imageHost = "https://image.tmdb.org/t/p/w500";
        // formate platform
        const formattedData = Object.values(platform?.data?.results || {}).flatMap(country => {
            return Object.keys(country).flatMap(key => {
                if (Array.isArray(country[key])) {
                    return country[key].map(provider => ({
                        logo_path: `${imageHost}${provider.logo_path}`,
                        provider_id: provider.provider_id,
                        provider_name: provider.provider_name,
                        display_priority: provider.display_priority
                    }));
                }
                return [];
            });
        });
        // formate actors
        const formattedActors = actors.data?.cast.map(actor => ({
            ...actor,
            profile_path: actor.profile_path ? `${imageHost}${actor.profile_path}` : null
        }));
        if (movie?.type === "movie") {
            const prependImageHost = (data) => {
                if (Array.isArray(data)) {
                    return data.map(item => prependImageHost(item));
                }

                if (typeof data === "object" && data !== null) {
                    for (let key in data) {
                        if (data.hasOwnProperty(key)) {
                            if (key.endsWith("_path") && typeof data[key] === "string") {
                                data[key] = `${imageHost}${data[key]}`;
                            } else {
                                data[key] = prependImageHost(data[key]);
                            }
                        }
                    }
                }

                return data;
            };
            const updatedData = prependImageHost(data);
            return res.status(200).send({ success: true, data: { details: { ...updatedData }, trailer, platform: formattedData, actors: formattedActors } });
        } else {
            const prependImageHost = (data) => {
                if (Array.isArray(data)) {
                    return data.map(item => prependImageHost(item));
                }

                if (typeof data === "object" && data !== null) {
                    for (let key in data) {
                        if (data.hasOwnProperty(key)) {
                            if (key.endsWith("_path") && typeof data[key] === "string") {
                                data[key] = `${imageHost}${data[key]}`;
                            } else {
                                data[key] = prependImageHost(data[key]);
                            }
                        }
                    }
                }

                return data;
            };
            const updatedData = prependImageHost(data);
            return res.status(200).send({ success: true, data: { details: { ...updatedData }, trailer, platform: formattedData, actors: formattedActors } });
        }
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Movie");
    }
}
// const get movie details
module.exports = { GetTMDBMovieList, AddMovie, GetAllMovie, DeleteMovie, GetMovieDetails }