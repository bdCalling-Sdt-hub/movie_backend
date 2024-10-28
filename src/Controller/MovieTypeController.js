
const axios = require('axios');
const { API_KEY } = require("../config/defaults");
const globalErrorHandler = require('../utils/globalErrorHandler');
// get all movie type 
const GetMovieTypeList = async (req, res) => {
    try {
        const { type } = req.params;

        // Capture optional query parameters for filtering
        const { actorId, genreId, studioId } = req.query;

        // Build the base URL
        let url = `https://api.themoviedb.org/3/genre/${type}/list?language=en-US&api_key=${API_KEY}`;

        // Dynamically add filters to the URL if they exist
        if (actorId) {
            url += `&with_cast=${actorId}`;
        }
        if (genreId) {
            url += `&with_genres=${genreId}`;
        }
        if (studioId) {
            url += `&with_companies=${studioId}`;
        }

        // Make the API request
        const response = await axios.get(url);

        // Extract the genres and map them
        const data = response?.data?.genres?.map(item => {
            return {
                id: item?.id,
                name: item?.name,
            };
        });

        // Send the response with the filtered data
        return res.send({ success: true, data });
    } catch (error) {
        globalErrorHandler(error, req, res, next, "GetMovieTypeList");
    }
};

module.exports = { GetMovieTypeList };