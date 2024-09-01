const { GetTMDBMovieList, AddMovie, GetAllMovie, DeleteMovie, GetMovieDetails } = require("../Controller/MovieController");
const verifyToken = require("../middlewares/Token/verifyToken");

const MovieRoutes = require("express").Router();
MovieRoutes.get("/admin-tmdb-movie-list", verifyToken, GetTMDBMovieList)
    .post("/admin-add-movie", verifyToken, AddMovie)
    .get("/all-movies", GetAllMovie)
    .delete("/delete-movie", verifyToken, DeleteMovie)
    .get("/get-movie-details/:id", verifyToken, GetMovieDetails)
module.exports = MovieRoutes