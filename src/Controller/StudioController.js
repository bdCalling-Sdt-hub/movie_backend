const axios = require('axios');

const { API_KEY } = require("../config/defaults");
const globalErrorHandler = require("../utils/globalErrorHandler");
const StudioModel = require('../Models/StudioModel');
const Queries = require('../utils/Queries');
const Follow = require('../Models/FollowModel');
// get studio list
const GetTMDBStudioList = async (req, res, next) => {
    try {
        if (req.user?.role !== "ADMIN") {
            return res.status(401).send({ success: false, message: "Unauthorized access" });
        }
        const { type } = req.params
        const response = await axios.get(`https://api.themoviedb.org/3/watch/providers/${type}?api_key=${API_KEY}`);
        const data = response?.data?.results?.map(item => {
            return {
                logo: `https://image.tmdb.org/t/p/w500${item?.logo_path}`,
                name: item?.provider_name,
                studioId: item?.provider_id
            }
        })
        return res.send({ success: true, data });
    } catch (error) {
        globalErrorHandler(error, req, res, next, "GetTMDBStudioList");
    }
}
// create studio
const CreateStudio = async (req, res, next) => {
    try {
        if (req.user?.role !== "ADMIN") {
            return res.status(403).send({ success: false, message: "forbidden access" });
        }
        const { logo } = req.files;
        console.log({ ...req.body, logo: logo[0].path || null })
        const studioData = new StudioModel({ ...req.body, logo: logo[0].path || null });
        const result = await studioData.save();
        return res.send({ success: true, data: result, message: "Studio created successfully" });
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Studio");
    }
}
// delete studio
const DeleteStudio = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (req.user?.role !== "ADMIN") {
            return res.status(403).send({ success: false, message: "forbidden access" });
        }
        const result = await StudioModel.deleteOne({ _id: id });
        if (result?.deletedCount) {
            return res.send({ success: true, data: result, message: "Studio deleted successfully" });
        } else {
            return res.send({ success: true, data: result, message: "Studio not found" });
        }
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Studio");
    }
}
// get studio list
const GetStudio = async (req, res, next) => {
    try {
        const { search, ...queryKeys } = req.query;
        const searchKey = {}
        if (search) searchKey.name = search
        const result = await Queries(StudioModel, queryKeys, searchKey);
        res.status(200).send({ ...result });
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Studio");
    }
}
// get movie by id 
const GetStudioDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const queryKeys = {};
        const searchKey = {};
        queryKeys.user = req?.user?.id;
        const [result, followModel, randomStudios] = await Promise.all([
            StudioModel.findOne({ _id: id }),
            Queries(Follow, queryKeys, searchKey),
            StudioModel.aggregate([
                { $sample: { size: 4 } }
            ])
        ]);
        if (!result) {
            return res.status(404).send({
                success: false,
                message: "Studio not found"
            });
        }
        const followEdStudioId = followModel?.data?.map(item => item?.studio?.toString()) || [];
        console.log(followEdStudioId)
        const studioData = result.toObject ? result.toObject() : result;
        const formattedData = {
            ...studioData,
            isFollowed: followEdStudioId.includes(id)
        };
        res.status(200).send({
            success: true,
            data: { details: formattedData, relatedStudios: randomStudios }
        });
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Studio");
    }
};

const getRandomStudios = async (req, res, next) => {
    try {
        const randomStudios = await StudioModel.aggregate([
            { $sample: { size: 4 } }
        ]);
        res.status(200).send({ success: true, data: randomStudios });
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Studio");
    }
};

module.exports = {
    GetTMDBStudioList,
    CreateStudio,
    DeleteStudio,
    GetStudio,
    GetStudioDetails,
    getRandomStudios
};
