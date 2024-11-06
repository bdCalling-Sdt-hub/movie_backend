const axios = require('axios');
const globalErrorHandler = require("../utils/globalErrorHandler");
const { API_KEY } = require('../config/defaults');
const StudioModel = require('../Models/StudioModel');
const Movie = require('../Models/MovieModel');
const Queries = require('../utils/Queries');
const { CreateNotification } = require('./NotificationsController');
const Favorite = require("../Models/FavoriteModel");
const History = require('../Models/HistoryModel');
const generateIdPairs = require('../utils/GenerateIdPairs');
// get movie list admin
/// update code  
const GetTMDBMovieList = async (req, res, next) => {
    try {
        const { page, search, type, actor_id, studio_id, genre_id, banner } = req.query;

        // Handle banner request
        if (banner) {
            // const response = await axios.get(`https://api.themoviedb.org/3/movie/popular`, {
            //     params: {
            //         api_key: API_KEY,
            //         language: 'en-US',
            //         page: 1
            //     }
            // });
            const response = await axios.get(`https://api.themoviedb.org/3/movie/upcoming`, {
                params: {
                    api_key: API_KEY,
                    language: 'en-US',
                    page: 1
                }
            });
            const data = response.data.results?.slice(0, 5)?.map(item => ({
                adult: item?.adult,
                background_color: `https://image.tmdb.org/t/p/w1280${item?.backdrop_path}`,
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
            }));
            return res.status(200).send({ success: true, data });
        }

        let response;
        if (search) {
            const searchTexts = search.split(',').flatMap(text => text.trim());
            const initialResults = [];

            // Search movies by search texts
            for (const text of searchTexts) {
                const result = await axios.get(`https://api.themoviedb.org/3/search/${type || 'movie'}`, {
                    params: {
                        api_key: API_KEY,
                        query: encodeURIComponent(text),
                        page: page || 1
                    }
                });
                initialResults.push(...result.data.results);
            }

            // Search actors by name
            const actorIds = new Set();
            const actorSearches = searchTexts.map(async text => {
                const actorResponse = await axios.get(`https://api.themoviedb.org/3/search/person`, {
                    params: {
                        api_key: API_KEY,
                        query: encodeURIComponent(text),
                        page: 1
                    }
                });
                actorResponse.data.results.forEach(result => {
                    if (searchTexts.some(text => result.name.toLowerCase() === text.toLowerCase().trim())) {
                        actorIds.add(result.id);
                    }
                });
            });
            await Promise.all(actorSearches);
            // Fetch movies for combined actor IDs
            let allMovies = [];
            if (actorIds.size > 0) {
                const ActorIdCombinations =await generateIdPairs(actorIds, searchTexts.length || 1);
                const movieRequests = ActorIdCombinations.map(actorIdsQuery =>
                    axios.get(`https://api.themoviedb.org/3/discover/movie`, {
                        params: {
                            api_key: API_KEY,
                            with_cast: actorIdsQuery,
                            page: 1
                        }
                    }).then(response => response?.data?.results || [])
                );
                const results = await Promise.all(movieRequests);
                allMovies = results.flat();
            }

            // Combine and filter unique movies by ID
            const combinedResults = [...initialResults, ...allMovies];
            const uniqueMoviesMap = new Map();
            combinedResults.forEach(movie => {
                if (!uniqueMoviesMap.has(movie.id)) {
                    uniqueMoviesMap.set(movie.id, movie);
                }
            });

            response = {
                data: {
                    results: [...uniqueMoviesMap.values()]
                }
            };
        } else {
            let url = `https://api.themoviedb.org/3/discover/${type || 'movie'}?api_key=${API_KEY}&page=${page || 1}`;
            if (actor_id) url += `&with_cast=${actor_id}`;
            if (studio_id) url += `&with_companies=${studio_id}`;
            if (genre_id) url += `&with_genres=${genre_id}`;

            response = await axios.get(url);
        }

        // Format response data
        const data = response?.data?.results?.map(item => ({
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
        }));

        // Send formatted response
        res.status(200).send({
            success: true,
            data,
            total_pages: Math.min(response?.data?.total_pages || 1, 500),
            total_results: response?.data?.total_results || 0
        });
    } catch (error) {
        // Handle errors
        globalErrorHandler(error, req, res, next, "TMDBMovieList");
    }
};

// add movie 
const AddMovie = async (req, res, next) => {
    try {
        if (req.user?.role !== "ADMIN") {
            return res.status(403).send({ success: false, message: "Forbidden access" });
        }
        const [deletedMovies, deletedStudio, updateStudio] = await Promise.all([
            Movie.deleteMany({ movie_id: { $in: req.body?.delete_ids || [] } }),
            StudioModel.findOneAndUpdate(
                { _id: req.body?.studio_id },
                { $inc: { total_movies: -req.body?.total_delete || 0 } },
            ),
            StudioModel.updateOne(
                { _id: req.body?.studio_id },
                { $inc: { total_movies: req.body?.total_movies } },
            )
        ]);
        const movies = Array.isArray(req.body?.movies) ? req.body?.movies : [req.body?.movies];
        if (movies?.[0]?.movie_id) {
            const [savedMovies] = await Promise.all(
                movies.map(movieData => {
                    const data = new Movie({ ...movieData, studio_id: req.body?.studio_id });
                    CreateNotification(movieData?.movie_id, req.user?._id);
                    return data.save();
                }),
            );

        }

        return res.status(200).send({
            success: true,
            // data: savedMovies,
            message: `${movies?.[0]?.type || 'movie'} ${movies?.[0]?.movie_id ? 'Added' : 'Removed'} successfully`
        });
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Movie");
    }
}
const adminGetMoviesByStudio = async (req, res, next) => {
    try {
        if (req.user?.role !== "ADMIN") {
            return res.status(403).send({ success: false, message: "Forbidden access" });
        }

        const { page, search, type, studio_id, limit, sort, order } = req.query;
        if (studio_id) {
            const queryKeys = { page, limit, sort, order, studio_id };
            const searchKeys = {}; 
            const populatePath = ''; 
            const selectFields = ''; 
            const responseData = await Queries(Movie, queryKeys, searchKeys, populatePath, selectFields);
            return res.status(200).send(responseData);
        }

        let response;
        if (search) {
            response = await axios.get(`https://api.themoviedb.org/3/search/${type || 'movie'}?api_key=${API_KEY}&query=${search}&page=${page || 1}`);
        } else {
            response = await axios.get(`https://api.themoviedb.org/3/discover/${type || 'movie'}?api_key=${API_KEY}&page=${page || 1}`);
        }
        const apiMovies = response?.data?.results?.map(item => ({
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
            vote: item?.vote_count,
            selected: false  
        }));

        const dbMovies = await Movie.find({}, 'movie_id').lean();
        const dbMovieIds = new Set(dbMovies.map(movie => movie.movie_id)); 
        const formattedMovies = apiMovies.map(movie => {
            if (dbMovieIds.has(movie.movie_id)) {
                return { ...movie, selected: true };
            }
            return movie;
        });

        const formattedData = {
            data: formattedMovies,
            total_pages: response?.data?.total_pages ? (response?.data?.total_pages > 500 ? 500 : response?.data?.total_pages) : 1,
            total_results: response?.data?.total_results || 0
        };

        res.status(200).send({ success: true, ...formattedData, dbMovieIds: Array.from(dbMovieIds) });

    } catch (error) {
        globalErrorHandler(error, req, res, next, "Studio");
    }
};




//get all movie user
const GetAllMovie = async (req, res, next) => {
    try {
        const { id } = req.user
        const { search, actorId, banner, movie_types, ...queryKeys } = req.query;
        if (!queryKeys?.type) {
            queryKeys.type = "movie"
        }
        const searchKey = {}
        if (search) {
            searchKey.title = search;
            searchKey.overview = search
        }
        if (movie_types) {
            queryKeys.movie_types = { $in: JSON.parse(movie_types) };
        }
        if (banner) {
            queryKeys.sort = 'rating';
            queryKeys.order = 'desc';
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
        const [result, favorite] = await Promise.all([
            Queries(Movie, queryKeys, searchKey),
            Queries(Favorite, { user: id }, {})
        ]);
        if (banner) {
            return res.status(200).send({ success: true, data: result?.data?.slice(0, 4) || [] });
        } else {
            const favoriteMovieIds = favorite?.data?.map(item => item?.movie)
            const data = result?.data?.map(movie => ({
                ...movie?._doc,
                favorite: favoriteMovieIds.includes(movie._id)
            })) || [];
            const formateData = {
                ...result,
                data,
            }
            return res.status(200).send({ ...formateData });
        }
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
        const [deletedMovies, deletedStudio] = await Promise.all([
            Movie.deleteMany({ _id: { $in: ids } }),
            StudioModel.findOneAndUpdate(
                { _id: req.body?.studio_id },
                { $inc: { total_movies: -req.body?.total_movies || 0 } },
            )]
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
        const { type } = req.query;
        let trailer = [];
        const [response, trailerResponse, platform, actors, similarMovies, favorite, history] = await Promise.all([
            axios.get(`https://api.themoviedb.org/3/${type || 'movie'}/${id}?api_key=${API_KEY}`),
            axios.get(`https://api.themoviedb.org/3/${type || 'movie'}/${id}/videos?api_key=${API_KEY}`),
            axios.get(`https://api.themoviedb.org/3/${type || 'movie'}/${id}/watch/providers?api_key=${API_KEY}`),
            axios.get(`https://api.themoviedb.org/3/${type || 'movie'}/${id}/credits?api_key=${API_KEY}`),
            axios.get(`https://api.themoviedb.org/3/movie/${id}/similar?api_key=${API_KEY}`),
            Queries(Favorite, { user: req?.user?.id }, {}),
            Queries(History, { user: req?.user?.id }, {})
        ]);

        // Filter YouTube trailers
        const trailers = trailerResponse?.data?.results?.filter(
            (video) => video.site === 'YouTube'
        );
        if (trailers.length > 0) {
            const trailerUrls = trailers.map(trailer => ({
                url: `https://www.youtube.com/watch?v=${trailer.key}`,
                name: trailer.name,
                type: trailer.type
            }));
            trailer = trailerUrls;
        } else {
            console.log('No trailers found.');
            trailer = [];
        }

        const data = response?.data;
        const imageHost = "https://image.tmdb.org/t/p/w500";

        // Format platforms
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

        // Format actors
        const formattedActors = actors.data?.cast.map(actor => ({
            ...actor,
            profile_path: actor.profile_path ? `${imageHost}${actor.profile_path}` : null
        }));

        // Format similar movies
        const formattedSimilarMovies = similarMovies.data?.results.map(movie => ({
            ...movie,
            poster_path: movie.poster_path ? `${imageHost}${movie.poster_path}` : null,
            backdrop_path: movie.backdrop_path ? `${imageHost}${movie.backdrop_path}` : null
        }));

        // Prepend image host for main movie details
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
        const favoriteMovieIds = favorite?.data?.map(item => item?.movie)
        const HistoryMovieIds = history?.data?.map(item => item?.movie)
        return res.status(200).send({
            success: true,
            data: {
                details: { ...updatedData },
                trailer,
                platform: formattedData,
                actors: formattedActors,
                similarMovies: formattedSimilarMovies,
                favorite: favoriteMovieIds.includes(id),
                watched: HistoryMovieIds.includes(id),
            }
        });

    } catch (error) {
        globalErrorHandler(error, req, res, next, "Movie");
    }
};


const SpinData = async (req, res, next) => {
    try {
        const { studio_id, actor_id, type, page } = req.query;
        const studioIds = studio_id?.split(',');

        const baseUrl = `https://api.themoviedb.org/3/discover/${type || 'movie'}?api_key=${API_KEY}&page=${page || 1}`;
        const promises = studioIds?.map(studio => {
            let url = baseUrl;
            if (actor_id) url += `&with_cast=${actor_id}`;
            if (studio) url += `&with_companies=${studio}`;

            return axios.get(url).then(response => {
                return response.data.results?.slice(0, 5)?.map(item => ({
                    adult: item?.adult,
                    background_color: `https://image.tmdb.org/t/p/w1280${item?.backdrop_path}`,
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
                }));
            });
        });

        const dataArrays = await Promise.all(promises);
        const combinedData = dataArrays.flat();
        res.status(200).send({success:true,data:combinedData?.slice(0,10)});
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Movie");
    }
};

// Define a route for the API
// Start the Express server

// const get movie details
module.exports = { GetTMDBMovieList, AddMovie, GetAllMovie, DeleteMovie, GetMovieDetails, adminGetMoviesByStudio,SpinData }


// const GetTMDBMovieList = async (req, res, next) => {
//     try {
//         const { page, search, type, actor_id, studio_id, genre_id, banner } = req.query;

//         if (banner) {
//             const response = await axios.get(`https://api.themoviedb.org/3/movie/popular`, {
//                 params: {
//                     api_key: API_KEY,
//                     language: 'en-US',
//                     page: 1
//                 }
//             });
//             const data = response.data.results?.slice(0, 5)?.map(item => ({
//                 adult: item?.adult,
//                 background_color: `https://image.tmdb.org/t/p/w1280${item?.backdrop_path}`,
//                 movie_types: item?.genre_ids,
//                 movie_id: item?.id,
//                 original_language: item?.original_language,
//                 original_title: item?.original_title || item?.original_name,
//                 overview: item?.overview,
//                 popularity: item?.popularity,
//                 poster: `https://image.tmdb.org/t/p/w500${item?.poster_path}`,
//                 release_date: item?.release_date || item?.first_air_date,
//                 title: item?.title || item?.name,
//                 video: item?.video,
//                 rating: item?.vote_average,
//                 vote: item?.vote_count
//             }));
//             return res.status(200).send({ success: true, data });
//         }

//         let response;
//         if (search) {
//             const searchTexts = search.split(',').flatMap(text => text.trim().split(' '));
//             const initialResults = [];

//             // Fetch search results for each term
//             for (const text of searchTexts) {
//                 const result = await axios.get(`https://api.themoviedb.org/3/search/${type || 'movie'}`, {
//                     params: {
//                         api_key: API_KEY,
//                         query: encodeURIComponent(text),
//                         page: page || 1
//                     }
//                 });
//                 initialResults.push(...result.data.results);
//             }

//             const actorIds = new Set();
//             for (const result of initialResults) {
//                 if (result.known_for_department === 'Acting') {
//                     actorIds.add(result.id);
//                 }
//             }

//             const allMovies = [];
//             for (const actorId of actorIds) {
//                 const moviesResponse = await axios.get(`https://api.themoviedb.org/3/person/${actorId}/movie_credits`, {
//                     params: { api_key: API_KEY }
//                 });
//                 allMovies.push(...moviesResponse.data.cast);
//             }

//             // Combine and deduplicate by movie ID
//             const combinedResults = [...initialResults, ...allMovies];
//             const uniqueMoviesMap = new Map();
//             combinedResults.forEach(movie => {
//                 if (!uniqueMoviesMap.has(movie.id)) {
//                     uniqueMoviesMap.set(movie.id, movie);
//                 }
//             });

//             response = {
//                 data: {
//                     results: [...uniqueMoviesMap.values()]
//                 }
//             };
//         } else {
//             let url = `https://api.themoviedb.org/3/discover/${type || 'movie'}?api_key=${API_KEY}&page=${page || 1}`;
//             if (actor_id) url += `&with_cast=${actor_id}`;
//             if (studio_id) url += `&with_companies=${studio_id}`;
//             if (genre_id) url += `&with_genres=${genre_id}`;
            
//             response = await axios.get(url);
//         }

//         // Map the response data
//         const data = response?.data?.results?.map(item => ({
//             adult: item?.adult,
//             background_color: `https://image.tmdb.org/t/p/w500${item?.backdrop_path}`,
//             movie_types: item?.genre_ids,
//             movie_id: item?.id,
//             original_language: item?.original_language,
//             original_title: item?.original_title || item?.original_name,
//             overview: item?.overview,
//             popularity: item?.popularity,
//             poster: `https://image.tmdb.org/t/p/w500${item?.poster_path}`,
//             release_date: item?.release_date || item?.first_air_date,
//             title: item?.title || item?.name,
//             video: item?.video,
//             rating: item?.vote_average,
//             vote: item?.vote_count
//         }));

//         const formattedData = {
//             data,
//             total_pages: Math.min(response?.data?.total_pages || 1, 500),
//             total_results: response?.data?.total_results || 0,
//         };

//         res.status(200).send({ success: true, ...formattedData });
//     } catch (error) {
//         globalErrorHandler(error, req, res, next, "TMDBMovieList");
//     }
// };


// const GetTMDBMovieList = async (req, res, next) => {
//     try {
//         const { page, search, type, actor_id, studio_id, genre_id, banner } = req.query;
//         // console.log({ page, search, type, actor_id, studio_id, genre_id })
//         if (banner) {
//             const response = await axios.get(`https://api.themoviedb.org/3/movie/popular`, {
//                 params: {
//                     api_key: API_KEY,
//                     language: 'en-US',
//                     page: 1
//                 }
//             });
//             const data = response.data.results?.slice(0, 5)?.map(item => ({
//                 adult: item?.adult,
//                 background_color: `https://image.tmdb.org/t/p/w1280${item?.backdrop_path}`,
//                 movie_types: item?.genre_ids,
//                 movie_id: item?.id,
//                 original_language: item?.original_language,
//                 original_title: item?.original_title || item?.original_name,
//                 overview: item?.overview,
//                 popularity: item?.popularity,
//                 poster: `https://image.tmdb.org/t/p/w500${item?.poster_path}`,
//                 release_date: item?.release_date || item?.first_air_date,
//                 title: item?.title || item?.name,
//                 video: item?.video,
//                 rating: item?.vote_average,
//                 vote: item?.vote_count
//             }))
//             return res.status(200).send({ success: true, data });
//         }
//         let response;
//         if (search) {
//             // response = await axios.get(`https://api.themoviedb.org/3/search/${type || 'movie'}?api_key=${API_KEY}&query=${search}&page=${page || 1}`);
//             console.log(search.split(',').flatMap(text => text.trim()))
//             const searchTexts = search.split(',').flatMap(text => text.trim()) //.flatMap(text => text.trim().split(' '));
//             const initialResults = [];
//             for (const text of searchTexts) {
//               let response = await axios.get(`https://api.themoviedb.org/3/search/${type || 'movie'}?api_key=${API_KEY}&query=${encodeURIComponent(text)}&page=${page || 1}`);
//               console.log(`Results for '${text}`);
//               initialResults.push(...response.data.results);
//             }
//             const actorIds = new Set();

//             const actorSearches = searchTexts.map(async text => {
//                 const response = await axios.get(`https://api.themoviedb.org/3/search/person`, {
//                     params: {
//                         api_key: API_KEY,
//                         query: encodeURIComponent(text),
//                         page: 1 
//                     }
//                 });
//                 response.data.results.forEach(result => {
//                     if (result.known_for_department === 'Acting') {
//                         actorIds.add(result.id);
//                     }
//                 });
//             });
//             await Promise.all(actorSearches);
//             const allMovies = [];
//             for (const actorId of actorIds) {
//               const moviesResponse = await axios.get(`https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${API_KEY}`);
//               allMovies.push(...moviesResponse.data.cast);  
//             }
//             const combinedResults = [...initialResults, ...allMovies];
//             const uniqueMoviesMap = new Map();
//             combinedResults.forEach(movie => {
//               if (!uniqueMoviesMap.has(movie.id)) {
//                 uniqueMoviesMap.set(movie.id, movie);  
//               }
//             });
//             const combinedResponse = {
//               data: {
//                 results: [...uniqueMoviesMap.values()]  
//               }
//             };
//             response = combinedResponse
//         } else {
//             let url = `https://api.themoviedb.org/3/discover/${type || 'movie'}?api_key=${API_KEY}&page=${page || 1}`;
//             if (actor_id) url += `&with_cast=${actor_id}`;
//             if (studio_id) url += `&with_companies=${studio_id}`;
//             if (genre_id) url += `&with_genres=${genre_id}`;

//             response = await axios.get(url);
//         }

//         // Map the response data
//         const data = response?.data?.results?.map(item => {
//             return {
//                 adult: item?.adult,
//                 background_color: `https://image.tmdb.org/t/p/w500${item?.backdrop_path}`,
//                 movie_types: item?.genre_ids,
//                 movie_id: item?.id,
//                 original_language: item?.original_language,
//                 original_title: item?.original_title || item?.original_name,
//                 overview: item?.overview,
//                 popularity: item?.popularity,
//                 poster: `https://image.tmdb.org/t/p/w500${item?.poster_path}`,
//                 release_date: item?.release_date || item?.first_air_date,
//                 title: item?.title || item?.name,
//                 video: item?.video,
//                 rating: item?.vote_average,
//                 vote: item?.vote_count
//             };
//         });

//         // Format the response data
//         const formattedData = {
//             data,
//             total_pages: response?.data?.total_pages ? (response?.data?.total_pages > 500 ? 500 : response?.data?.total_pages) : 1,
//             total_results: response?.data?.total_results || 0,
//         };

//         // Send the response
//         res.status(200).send({ success: true, ...formattedData });
//     } catch (error) {
//         // Handle errors
//         globalErrorHandler(error, req, res, next, "Studio");
//     }
// }