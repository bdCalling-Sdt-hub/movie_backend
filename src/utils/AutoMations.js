// const { API_KEY } = require("../config/defaults");
// const { CreateNotification } = require("../Controller/NotificationsController");

// const getRecentMovieIds = async () => {
//     try {
//         const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
//         const [movieResponse, tvResponse] = await Promise.all([
//             axios.get(`${TMDB_BASE_URL}/movie/upcoming`, {
//                 params: {
//                     api_key: API_KEY,
//                     // language: 'en-US',
//                 }
//             }),
//             axios.get(`${TMDB_BASE_URL}/tv/on_the_air`, {
//                 params: {
//                     api_key: API_KEY,
//                     // language: 'en-US',
//                 }
//             }),
//         ])
//         const upcomingMovieIds = movieResponse.data.results.map(movie => movie.id);
//         const upcomingTVIds = tvResponse.data.results.map(tvShow => tvShow.id);
//         return [...upcomingMovieIds, ...upcomingTVIds]
//     } catch (error) {
//         console.error("Error fetching recent movie ids: ", error);
//         // throw error;
//     }
// };
// const notifyUsersAboutRecentMovies = async () => {
//     try {
//         const recentMovieIds = await getRecentMovieIds();
//         console.log(recentMovieIds)
//         recentMovieIds.map(async (movieId) => {
//             const data = {
//                 title: "New Movie Release",
//                 movie: movieId,
//                 message: `Movie ID ${movieId} is now available!`,
//                 type: "relies"
//             };
//             await CreateNotification(data, null);
//         });
//     } catch (error) {
//         console.error("Error sending notifications: ", error);
//         throw error;
//     }
// };
// module.exports = { notifyUsersAboutRecentMovies };
const { API_KEY } = require("../config/defaults");
const { CreateNotification } = require("../Controller/NotificationsController");
const axios = require('axios');
const Follow = require("../Models/FollowModel");
const Movie = require("../Models/MovieModel");
const getLastDayDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
};
const getRecentActorMovies = async (actorId) => {
    try {
        const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
        const releaseDate = getLastDayDate();

        const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
            params: {
                api_key: API_KEY,
                with_cast: actorId,
                'primary_release_date.gte': releaseDate,
                'primary_release_date.lte': releaseDate
            }
        });
        // console.log(response.data.results)
        return response.data.results.map(movie => movie.id);  // Return an array of movie IDs
    } catch (error) {
        console.error(`Error fetching movies for actor ${actorId}: `, error);
        return [];
    }
};

const notifyUsersAboutActorMovies = async () => {
    try {
        const follows = await Follow.find({ type: 'actor' }).populate('user').exec();
        const followsGroupedByActor = follows.reduce((acc, follow) => {
            if (!acc[follow.actor_id]) {
                acc[follow.actor_id] = [];
            }
            acc[follow.actor_id].push(follow.user._id);
            return acc;
        }, {});
        let testResult = []
        for (const actorId in followsGroupedByActor) {
            if (followsGroupedByActor.hasOwnProperty(actorId)) {
                const recentMovieIds = await getRecentActorMovies(actorId);

                const userIds = followsGroupedByActor[actorId];
                userIds.forEach(async (userId) => {
                    recentMovieIds.forEach(async (movieId) => {
                        const data = {
                            title: "New Movie Release",
                            movie: movieId,
                            message: `Movie ID ${movieId} featuring actor ${actorId} is now available!`,
                            type: "release",
                            userId: userId,
                        };
                        // await CreateNotification(data, userId);
                        testResult.push({ data, userId })
                    });
                });
            }
        }
        return testResult
    } catch (error) {
        console.error("Error notifying users about actor movies: ", error);
        throw error;
    }
};


const getRecentStudioMovies = async (studioId) => {
    try {
        const lastDay = getLastDayDate();

        // Fetch movies from the Movie model that match the studio_id and have a release date within the last 24 hours
        const movies = await Movie.find({
            studio_id: studioId,
            release_date: { $gte: lastDay }
        }).exec();

        return movies.map(movie => movie.movie_id);  // Return an array of movie IDs
    } catch (error) {
        console.error(`Error fetching movies for studio ${studioId}: `, error);
        return [];
    }
};

// Main function to fetch following data and notify users
const notifyUsersAboutStudioMovies = async () => {
    try {
        // 1. Fetch all follows where type is 'studio'
        const follows = await Follow.find({ type: 'studio' }).populate('user').exec();

        // 2. Group follows by studio_id
        const followsGroupedByStudio = follows.reduce((acc, follow) => {
            if (!acc[follow.studio]) {
                acc[follow.studio] = [];
            }
            acc[follow.studio].push(follow.user._id);
            return acc;
        }, {});

        // 3. Iterate over each studio and get the recent movies
        for (const studioId in followsGroupedByStudio) {
            if (followsGroupedByStudio.hasOwnProperty(studioId)) {
                const recentMovieIds = await getRecentStudioMovies(studioId);  // Fetch recent movies for the studio

                // 4. Notify each user following the studio about the new movies
                const userIds = followsGroupedByStudio[studioId];
                userIds.forEach(async (userId) => {
                    recentMovieIds.forEach(async (movieId) => {
                        const data = {
                            title: "New Movie Release",
                            movie: movieId,
                            message: `Movie ID ${movieId} from studio ${studioId} is now available!`,
                            type: "release",
                            userId: userId,
                        };
                        await CreateNotification(data, userId);
                    });
                });
            }
        }
    } catch (error) {
        console.error("Error notifying users about studio movies: ", error);
        throw error;
    }
};

module.exports = { notifyUsersAboutActorMovies, notifyUsersAboutStudioMovies };
// module.exports = { notifyUsersAboutStudioMovies };

