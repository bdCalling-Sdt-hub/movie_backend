const { SchemaTypes } = require("mongoose");
const History = require("../Models/HistoryModel");
const globalErrorHandler = require("../utils/globalErrorHandler");
const Queries = require("../utils/Queries");

const AddRemoveHistory = async (req, res, next) => {
    try {
        const { id } = req.user;
        if (!id) {
            return res.send({ success: false, message: "user not found" });
        }
        const { movie_id } = req.params;
        const existingHistory = await History.findOne({ user: id, movie: movie_id });
        if (existingHistory) {
            const result = await History.deleteOne({ user: id, movie: movie_id });
            if (result.deletedCount >= 1) {
                return res.send({ success: false, message: "removed from history" });
            } else {
                return res.send({ success: false, message: "something went wrong" });
            }
        } else {
            const history = new History({
                user: id,
                movie: movie_id
            })
            await history.save();
            return res.status(200).send({ success: true, data: history, message: "Added to history" });
        }
    } catch (error) {
        globalErrorHandler(error, req, res, next, "History");
    }
}
const GetHistory = async (req, res, next) => {
    try {
        const { id, role } = req.user;
        const { search, type, status, ...queryKeys } = req.query;
        const searchKey = {};
        let populatePaths = ['movie', 'user'];
        if (role !== "ADMIN") {
            queryKeys.user = id;
            populatePaths = ['movie'];
        }
        const result = await Queries(History, queryKeys, searchKey, populatePath = populatePaths,);
        res.status(200).send(result)
    } catch (error) {
        globalErrorHandler(error, req, res, next, "History");
    }
}
module.exports = { AddRemoveHistory, GetHistory }