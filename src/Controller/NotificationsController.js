
const { getReceiverSocketId, io } = require("../Socket");
const Queries = require("../utils/Queries");

//create notification
const CreateNotification = async (data, user) => {
    const { appointmentId, userId, doctorId, message, body } = data;
    const notification = new Notification({ appointmentId, userId, doctorId, title: message, body })
    await notification.save()
    if (user?.role === 'DOCTOR') {
        const receiverSocketId = getReceiverSocketId(userId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("new-notification", notification);
        }
    } else {
        const receiverSocketId = getReceiverSocketId(doctorId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("new-notification", notification);
        }
    }
}
// get all notifications
const GetNotifications = async (req, res) => {
    try {
        const { id } = req.user
        const { search, ...queryKeys } = req.query;
        let searchKey = {}
        let populatepaths = ['doctorId', 'userId'];
        let selectField = ['name email phone location _id img specialization', 'name email phone location _id img'];
        if (req.user?.role === 'DOCTOR') {
            populatepaths = 'userId'
            selectField = 'name email phone location _id img'
            queryKeys.doctorId = id
        } else if (req.user?.role === 'USER') {
            queryKeys.userId = id
            populatepaths = 'doctorId'
            selectField = 'name email phone location _id img specialization'
        }
        const notifications = await Queries(Notification, queryKeys, searchKey, populatePath = populatepaths, selectFields = selectField);
        res.status(200).send(notifications)
    } catch (error) {
        res.status(500).send({ success: false, message: error?.message || 'Internal server error', ...error });
    }
}
// update notifications 
const UpdateNotifications = async (req, res) => {
    try {
        const { notificationIds } = req.body
        const notifications = await Notification.updateMany({ _id: { $in: notificationIds } }, { isRead: true })
        res.status(200).send({ success: true, message: 'Notifications Read successfully', data: notifications })
    } catch (error) {
        res.status(500).send({ success: false, message: error?.message || 'Internal server error', ...error });
    }
}

module.exports = { CreateNotification, GetNotifications, UpdateNotifications }