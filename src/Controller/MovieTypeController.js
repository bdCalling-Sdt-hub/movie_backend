
const axios = require('axios');
const { API_KEY } = require("../config/defaults");
const globalErrorHandler = require('../utils/globalErrorHandler');
// get all movie type 
const GetMovieTypeList = async (req, res) => {
    try {
        const { type } = req.params
        const response = await axios.get(`https://api.themoviedb.org/3/genre/${type}/list?language=en-US&api_key=${API_KEY}`);
        const data = response?.data?.genres?.map(item => {
            return {
                id: item?.id,
                name: item?.name,
            }
        })
        return res.send({ success: true, data });
    } catch (error) {
        globalErrorHandler(error, req, res, next, "GetTMDBStudioList");
    }
}
module.exports = { GetMovieTypeList }