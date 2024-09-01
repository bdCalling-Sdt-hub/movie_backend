const { SchemaTypes } = require("mongoose");
const History = require("../Models/HistoryModel");
const globalErrorHandler = require("../utils/globalErrorHandler");
const Queries = require("../utils/Queries");
const Favorite = require("../Models/FavoriteModel");

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
        const searchKey = {};
        let populatePaths = ['movie', 'user'];
        if (role !== "ADMIN") {
            queryKeys.user = id;
            populatePaths = ['movie'];
        }
        const result = await Queries(Favorite, queryKeys, searchKey, populatePath = populatePaths,);
        res.status(200).send(result)
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Favorite");
    }
}
module.exports = { AddRemoveFavorite, GetFavorite }