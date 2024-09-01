const { GetTMDBStudioList, CreateStudio, DeleteStudio, GetStudio } = require("../Controller/StudioController");
const uploadFile = require("../middlewares/FileUpload/FileUpload");
const verifyToken = require("../middlewares/Token/verifyToken");

const StudioRoutes = require("express").Router();
StudioRoutes.get("/get-studio-list/:type", verifyToken, GetTMDBStudioList)
    .post("/create-studio", verifyToken, uploadFile(), CreateStudio)
    .delete("/delete-studio/:id", verifyToken, DeleteStudio)
    .get("/get-studio", GetStudio)

module.exports = StudioRoutes
