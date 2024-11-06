const { GetTMDBStudioList, CreateStudio, DeleteStudio, GetStudio, GetStudioDetails, getRandomStudios, TopStudios } = require("../Controller/StudioController");
const uploadFile = require("../middlewares/FileUpload/FileUpload");
const verifyToken = require("../middlewares/Token/verifyToken");

const StudioRoutes = require("express").Router();
StudioRoutes.get("/get-studio-list/:type", verifyToken, GetTMDBStudioList)
    .post("/create-studio", verifyToken, uploadFile(), CreateStudio)
    .delete("/delete-studio/:id", verifyToken, DeleteStudio)
    .get("/get-studio", GetStudio)
    .get("/get-studio/:id", verifyToken,GetStudioDetails)
    .get("/related-studio",getRandomStudios )
    .get("/top-studio",TopStudios )

module.exports = StudioRoutes
