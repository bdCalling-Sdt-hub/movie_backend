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
const TopStudios = async (req, res, next) => {
    try {
        // Make both requests simultaneously
        const [movieResponse, tvResponse] = await Promise.all([
            axios.get(`https://api.themoviedb.org/3/watch/providers/movie?api_key=${API_KEY}&language=en-US&watch_region=US`),
            axios.get(`https://api.themoviedb.org/3/watch/providers/tv?api_key=${API_KEY}&language=en-US&watch_region=US`)
        ]);

        // List of well-known providers (customize as needed)
        const knownProviders = [
            "Netflix", "Disney", "Amazon Prime Video", "HBO Max", "Apple TV",
            "Hulu", "Peacock", "Paramount", "Marvel", "Starz",
            "Showtime", "CBS All Access", "DC Universe", "Crunchyroll",
            "Funimation", "Mubi", "Criterion Channel", "Sling TV", "Discovery",
            "Dc", "Sony Pictures", "Universal Pictures", "Warner Bros", "Lionsgate",
            "MGM", "20th Century Fox", "Fox", "Columbia Pictures", "DreamWorks",
            "Nickelodeon", "Cartoon Network", "A24", "BBC", "AMC",
            "IFC Films", "Studio Ghibli", "Shudder", "Tubi", "Vudu",
            "Kanopy", "Acorn TV", "BritBox", "Hallmark Movies", "Plex",
            "YouTube Originals", "WeTV", "Fandor", "Rakuten TV", "Sky Go", "YouTube"
        ].map(provider => provider.toLowerCase());


        // Combine movie and TV providers, filter for well-known, and remove duplicates
        const combinedProviders = [...movieResponse.data.results, ...tvResponse.data.results]
            .filter(provider => knownProviders.includes(provider.provider_name.toLowerCase()))
            .reduce((acc, provider) => {
                if (!acc.some(p => p.providerId === provider.provider_id)) {
                    acc.push({
                        name: provider.provider_name,
                        logo: `https://image.tmdb.org/t/p/w500${provider.logo_path}`,
                        providerId: provider.provider_id
                    });
                }
                return acc;
            }, [])
        // .slice(0, 20); // Limit to top 20 providers

        return res.send({ success: true, data: combinedProviders });
    } catch (error) {
        globalErrorHandler(error, req, res, next, "Studio");
    }
}
module.exports = {
    GetTMDBStudioList,
    CreateStudio,
    DeleteStudio,
    GetStudio,
    GetStudioDetails,
    getRandomStudios,
    TopStudios
};





// const response = await axios.get(`https://api.themoviedb.org/3/discover/movie`, {
//     params: {
//         api_key: API_KEY,
//         with_companies: 2,
//         page: 1,
//     }
// });
// const studioData = new StudioModel({ ...req.body, total_movies: response?.data?.total_results * response?.data?.total_pages });