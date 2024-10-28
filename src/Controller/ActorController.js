const axios = require('axios');
const { API_KEY } = require('../config/defaults');
const globalErrorHandler = require('../utils/globalErrorHandler');
const Actor = require('../Models/ActorModel');
const Queries = require('../utils/Queries');
const Movie = require('../Models/MovieModel');
const Follow = require('../Models/FollowModel');
// get all actors from tmdb 
const GetActorsTMDB = async (req, res, next) => {
    try {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).send({ success: false, message: 'forbidden access' });
        }
        const { page } = req.query
        const response = await axios.get(`https://api.themoviedb.org/3/person/popular?api_key=${API_KEY}&page=${page || 1}`);
        const addImageUrl = response?.data?.results?.map(item => {
            return {
                ...item,
                actor_id: item.id,
                profile_path: `https://image.tmdb.org/t/p/w500${item.profile_path}`,
                known_for: item.known_for.map(knownItem => ({
                    ...knownItem,
                    movie_id: knownItem.id,
                    backdrop_path: `https://image.tmdb.org/t/p/w500${knownItem.backdrop_path}`,
                    poster_path: `https://image.tmdb.org/t/p/w500${knownItem.poster_path}`
                }))
            };
        })
        const data = addImageUrl?.map(item => {
            const { known_for, ...rest } = item
            return { ...rest }
        })
        res.status(200).send({ success: true, data });
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Actor");
    }
}
// admin create admin 
const SaveActor = async (req, res, next) => {
    try {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).send({ success: false, message: 'forbidden access' });
        }
        const actor = Array.isArray(req.body) ? req.body : [req.body];
        const savedData = await Promise.all(
            actor.map(async (item) => {
                const data = new Actor(item);
                return data.save();
            })
        );
        res.status(200).send({ success: true, message: 'Actor Added successfully', data: savedData });
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Actor");
    }
}
// delete saved actor 
const DeleteActor = async (req, res, next) => {
    try {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).send({ success: false, message: 'forbidden access' });
        }
        const ids = Array.isArray(req.body?.ids) ? req.body?.ids : [req.body?.ids];
        const deletedData = await Actor.deleteMany({ _id: { $in: ids } });
        if (deletedData.deletedCount === 0) {
            return res.status(404).send({ success: false, message: 'Actor not found' });
        } else {
            res.status(200).send({ success: true, message: 'Actor deleted successfully', data: deletedData });
        }
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Actor");
    }
}
// get actors 
const GetActors = async (req, res, next) => {
    try {
        const { search, ...queryKeys } = req.query;
        const searchKey = {}
        if (search) searchKey.name = search
        const result = await Queries(Actor, queryKeys, searchKey);
        res.status(200).send({ ...result });
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Actor");
    }
}
// get actor details 
const GetActorDetailsTMDB = async (req, res, next) => {
    try {
        const { id } = req.params
        const [personResponse, movieCreditsResponse, tvCreditsResponse, followData] = await Promise.all([
            axios.get(`https://api.themoviedb.org/3/person/${id}?api_key=${API_KEY}&language=en-US`),
            axios.get(`https://api.themoviedb.org/3/person/${id}/movie_credits?api_key=${API_KEY}&language=en-US`),
            axios.get(`https://api.themoviedb.org/3/person/${id}/tv_credits?api_key=${API_KEY}&language=en-US`),
            Queries(Follow, { user: req?.user?.id }, {}),
        ])
        const personData = personResponse?.data;
        personData.profile_path = `https://image.tmdb.org/t/p/w500${personData?.profile_path}`;
        const movieCreditsData = movieCreditsResponse?.data;
        const tvCreditsData = tvCreditsResponse?.data;
        const upcomingMovies = (movieCreditsData?.cast || []).filter(movie => new Date(movie.release_date) > new Date());
        const upcomingTVShows = (tvCreditsData?.cast || []).filter(tvShow => new Date(tvShow.first_air_date) > new Date());
        const popularMovies = (movieCreditsData?.cast || []).filter(movie => movie.popularity > 10);
        const popularTVShows = (tvCreditsData?.cast || []).filter(tvShow => tvShow.popularity > 10);
        const FollowActor = followData?.data?.map(item => item?.actor_id)
        personData.isFollowed = FollowActor.includes(id)
        personData.upcoming_movies = [
            ...upcomingMovies.map(movie => ({
                id: movie.id,
                title: movie.title,
                release_date: movie.release_date,
                media_type: 'movie',
                poster_path: `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            })),
            ...upcomingTVShows.map(tvShow => ({
                id: tvShow.id,
                title: tvShow.name,
                release_date: tvShow.first_air_date,
                media_type: 'tv',
                poster_path: `https://image.tmdb.org/t/p/w500${tvShow.poster_path}`
            }))
        ];
        personData.popular_movies = [
            ...popularMovies.map(movie => ({
                id: movie.id,
                title: movie.title,
                release_date: movie.release_date,
                popularity: movie.popularity,
                media_type: 'movie',
                poster_path: `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            })),
            ...popularTVShows.map(tvShow => ({
                id: tvShow.id,
                title: tvShow.name,
                release_date: tvShow.first_air_date,
                popularity: tvShow.popularity,
                media_type: 'tv',
                poster_path: `https://image.tmdb.org/t/p/w500${tvShow.poster_path}`
            }))
        ];
        return res.status(200).send({ success: true, data: personData });
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Actor");
    }
}
// const GetActorDetailsTMDB = async (req, res, next) => {
//     try {
//         const { id } = req.params;

//         // Fetch actor's data and movie/TV show credits from TMDB API
//         const [personResponse, movieCreditsResponse, tvCreditsResponse] = await Promise.all([
//             axios.get(`https://api.themoviedb.org/3/person/${id}?api_key=${API_KEY}&language=en-US`),
//             axios.get(`https://api.themoviedb.org/3/person/${id}/movie_credits?api_key=${API_KEY}&language=en-US`),
//             axios.get(`https://api.themoviedb.org/3/person/${id}/tv_credits?api_key=${API_KEY}&language=en-US`)
//         ]);

//         const personData = personResponse?.data;
//         personData.profile_path = `https://image.tmdb.org/t/p/w500${personData?.profile_path}`;

//         const movieCreditsData = movieCreditsResponse?.data;
//         const tvCreditsData = tvCreditsResponse?.data;

//         // Movies from TMDB
//         const upcomingMovies = (movieCreditsData?.cast || []).filter(movie => new Date(movie.release_date) > new Date());
//         const upcomingTVShows = (tvCreditsData?.cast || []).filter(tvShow => new Date(tvShow.first_air_date) > new Date());

//         const popularMovies = (movieCreditsData?.cast || []).filter(movie => movie.popularity > 10);
//         const popularTVShows = (tvCreditsData?.cast || []).filter(tvShow => tvShow.popularity > 10);

//         // Filter function to check if the movie exists in MongoDB and include the _id from MongoDB
//         const filterStoredMovies = async (movies) => {
//             const movieIds = movies.map(movie => movie.id);
//             const storedMovies = await Movie.find({ movie_id: { $in: movieIds } });  // Fetch all movies stored in the database

//             // Map the stored movies to include MongoDB _id
//             return movies
//                 .map(movie => {
//                     const storedMovie = storedMovies.find(m => m.movie_id === movie.id);
//                     if (storedMovie) {
//                         return {
//                             ...movie,
//                             _id: storedMovie._id, // Include the MongoDB _id
//                         };
//                     }
//                     return null;
//                 })
//                 .filter(movie => movie !== null); // Filter out null entries where no stored movie was found
//         };

//         // Check if the upcoming movies/TV shows from TMDB exist in the database
//         const filteredUpcomingMovies = await filterStoredMovies(upcomingMovies);
//         const filteredUpcomingTVShows = await filterStoredMovies(upcomingTVShows);

//         // Check if the popular movies/TV shows from TMDB exist in the database
//         const filteredPopularMovies = await filterStoredMovies(popularMovies);
//         const filteredPopularTVShows = await filterStoredMovies(popularTVShows);

//         // Construct the final response data
//         personData.upcoming_movies = [
//             ...filteredUpcomingMovies.map(movie => ({
//                 id: movie.id,
//                 _id: movie._id, // Include MongoDB _id
//                 title: movie.title,
//                 release_date: movie.release_date,
//                 media_type: 'movie',
//                 poster_path: `https://image.tmdb.org/t/p/w500${movie.poster_path}`
//             })),
//             ...filteredUpcomingTVShows.map(tvShow => ({
//                 id: tvShow.id,
//                 _id: tvShow._id, // Include MongoDB _id
//                 title: tvShow.name,
//                 release_date: tvShow.first_air_date,
//                 media_type: 'tv',
//                 poster_path: `https://image.tmdb.org/t/p/w500${tvShow.poster_path}`
//             }))
//         ];

//         personData.popular_movies = [
//             ...filteredPopularMovies.map(movie => ({
//                 id: movie.id,
//                 _id: movie._id, // Include MongoDB _id
//                 title: movie.title,
//                 release_date: movie.release_date,
//                 popularity: movie.popularity,
//                 media_type: 'movie',
//                 poster_path: `https://image.tmdb.org/t/p/w500${movie.poster_path}`
//             })),
//             ...filteredPopularTVShows.map(tvShow => ({
//                 id: tvShow.id,
//                 _id: tvShow._id, // Include MongoDB _id
//                 title: tvShow.name,
//                 release_date: tvShow.first_air_date,
//                 popularity: tvShow.popularity,
//                 media_type: 'tv',
//                 poster_path: `https://image.tmdb.org/t/p/w500${tvShow.poster_path}`
//             }))
//         ];

//         return res.status(200).send({ success: true, data: personData });
//     } catch (error) {
//         globalErrorHandler(error, req, res, next, "Actor");
//     }
// };

module.exports = { GetActorsTMDB, SaveActor, DeleteActor, GetActors, GetActorDetailsTMDB }