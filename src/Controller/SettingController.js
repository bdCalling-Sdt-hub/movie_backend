const SettingsModel = require("../Models/SettingsModel");
const globalErrorHandler = require("../utils/globalErrorHandler");

//create setting
const GetSettings = async (req, res) => {
    try {
        const { type } = req.params
        const result = await SettingsModel.findOne({ name: type })
        if (result) {
            return res.send({ success: true, data: result })
        } else {
            return res.send({
                success: true, data: {
                    "_id": "",
                    "name": type,
                    "value": "",
                    "value": "<p>This is answer this test</p>",
                    "createdAt": "",
                    "updatedAt": "",
                    "__v": 0
                }
            })
        }
    } catch (error) {
        globalErrorHandler(error, req, res, next, 'settings')
    }
}
// update setting 
const UpdateSettings = async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(401).send({ message: "unauthorized access" });
    }
    const { name, value } = req.body
    try {
        const ExistingSetting = await SettingsModel.findOne({ name })
        if (ExistingSetting) {
            const result = await SettingsModel.updateOne({ name }, { $set: { value } })
            return res.send({ success: true, data: result, message: `${name} Updated Successfully` })
        } else {
            const settingData = new SettingsModel({ name, value })
            const result = await settingData.save()
            return res.send({ success: true, data: result, message: `${name} Updated Successfully` })
        }
    } catch (error) {
        globalErrorHandler(error, req, res, next, 'settings')
    }
}
module.exports = { UpdateSettings, GetSettings }