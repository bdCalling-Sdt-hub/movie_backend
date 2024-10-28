const Calender = require("../Models/CalenderModel");
const axios = require('axios');
const { API_KEY } = require('../config/defaults');
const globalErrorHandler = require("../utils/globalErrorHandler");
const Queries = require("../utils/Queries");

// add to calender 
const addToCalender = async (req, res, next) => {
    try {
        const { id } = req.user;
        const { date, movie } = req.body;
        if (!date) {
            return res.status(400).send({ success: false, message: "Date is required" });
        }
        const [day, month, year] = date.split('-');
        if (!day || !month || !year) {
            return res.status(400).send({ success: false, message: "Invalid date format. Use DD-MM-YYYY" });
        }
        const startOfDay = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
        const endOfDay = new Date(`${year}-${month}-${day}T23:59:59.999Z`);
        const existingCalender = await Calender.findOne({
            date: { $gte: startOfDay, $lt: endOfDay },
            movie,
            user: id,
        });

        // If it exists, remove it
        if (existingCalender) {
            console.log(existingCalender._id.toString());
            // return res.status(400).send({ success: false, message: "Already added to calendar" });1
            await Calender.deleteOne({ _id: existingCalender._id.toString() });
            return res.status(200).send({ success: true, message: "Removed from calendar" });
        }

        // Add new movie to calendar
        const newEntry = new Calender({ date: startOfDay, movie, user: id }); // Save the actual date
        await newEntry.save();

        return res.status(200).send({ success: true, message: "Added to calendar" });

    } catch (error) {
        // Use global error handler for error management
        globalErrorHandler(error, req, res, next, "Calender");
    }
};
// const getCalender = async (req, res, next) => {
//     try {
//         const { id } = req.user;
//         const { month, year, search, ...queryKeys } = req.query;
//         if (!month || !year || month < 1 || month > 12 || year.length !== 4) {
//             return res.status(400).send({ success: false, message: "Invalid month or year" });
//         }
//         const populatePath = 'movie'
//         const startOfMonth = new Date(`${year}-${month}-01T00:00:00.000Z`);
//         const endOfMonth = new Date(new Date(`${year}-${month}-01T00:00:00.000Z`).setMonth(startOfMonth.getMonth() + 1) - 1);
//         const searchKey = {};
//         queryKeys.date = { $gte: startOfMonth, $lt: endOfMonth };
//         queryKeys.user = id;
//         const result = await Queries(Calender, queryKeys, searchKey, populatePath);
//         const dates = [...new Set(result?.data.map((item) => new Date(item?.date).getDate()))];
//         return res.status(200).json({
//             success: true,
//             data: {
//                 movies: result?.data,
//                 dates
//             },
//             message: `Movies for ${month}-${year}`,
//         });

//     } catch (error) {
//         globalErrorHandler(error, req, res, next, "Calender");
//     }
// };
const getCalender = async (req, res, next) => {
    try {
        const { id, role } = req.user;
        const { search, type, status, ...queryKeys } = req.query;
        const searchKey = {};
        let populatePaths = [];

        // If the user is not an admin, filter by user ID
        if (role !== 'ADMIN') {
            queryKeys.user = id;
        }

        // Fetch calendar records based on the query
        const result = await Queries(Calender, queryKeys, searchKey, populatePath = populatePaths);
        console.log(result)
        if (result?.data?.length <= 0) {
            return res.status(200).send({
                success: true,
                data: {
                    movies: [],
                    dates: []
                },
            })
        }
        // Extract the movie IDs and associated calendar dates from the result
        const calenderMovieIds = result?.data?.map(entry => ({
            movieId: entry.movie,
            calenderDate: entry.date
        }));

        if (calenderMovieIds && calenderMovieIds.length > 0) {
            // Fetch movie details from TMDB for each movie ID using Promise.all
            const moviePromises = calenderMovieIds.map(({ movieId, calenderDate }) => {
                return axios.get(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}`)
                    .then(response => {
                        const item = response?.data;

                        // Format the movie data and add the calendar date
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
                            vote: item?.vote_count,
                            calenderedFor: calenderDate // Add the calendar date here
                        };
                    })
                    .catch(error => {
                        console.error(`Error fetching movie with ID ${movieId}: `, error);
                        return null;
                    });
            });

            // Wait for all promises to resolve
            const movies = await Promise.all(moviePromises);
            const validMovies = movies.filter(movie => movie !== null);

            // Create unique set of dates for the calendar
            const dates = [
                ...new Set(
                    result?.data.map((item) => {
                        const dateObj = new Date(item?.date);
                        const monthNames = [
                            "January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"
                        ];

                        return {
                            month: monthNames[dateObj.getMonth()],
                            date: dateObj.getDate(),
                            year: dateObj.getFullYear(),
                        };
                    })
                ),
            ];

            return res.status(200).json({
                success: true,
                data: {
                    movies: validMovies,
                    dates
                },
            });
        }
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Calender");
    }
};


module.exports = { addToCalender, getCalender }