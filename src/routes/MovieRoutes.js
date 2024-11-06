const { GetTMDBMovieList, AddMovie, GetAllMovie, DeleteMovie, GetMovieDetails, adminGetMoviesByStudio, SpinData } = require("../Controller/MovieController");
const verifyToken = require("../middlewares/Token/verifyToken");

const MovieRoutes = require("express").Router();
MovieRoutes.get("/admin-tmdb-movie-list", verifyToken, adminGetMoviesByStudio)
    .post("/admin-add-movie", verifyToken, AddMovie)
    .get("/all-movies", verifyToken, GetTMDBMovieList)
    .delete("/delete-movie", verifyToken, DeleteMovie)
    .get("/get-movie-details/:id", verifyToken, GetMovieDetails)
    .get("/spin-data", verifyToken, SpinData)
// .get("/get-movie-details/:id", verifyToken, GetMovieDetails)
module.exports = MovieRoutes