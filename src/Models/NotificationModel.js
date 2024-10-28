const { model, Schema } = require('mongoose');
const NotificationSchema = new Schema({
    seenBy: {
        type: [Schema.Types.ObjectId],
    },
    title: {
        type: String,
        required: [true, 'title is required'],
    },
    message: {
        type: String,
        required: [true, 'message is required'],
    },
    movie: {
        type: String,
        required: [true, 'movie Id is required'],
    },
    type: {
        type: String,
        required: [true, 'type is required'],
        enum: ['review', 'reminder', 'relies']
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [false, 'user Id is required'],
        default: null
    },
}, { timestamps: true })

NotificationSchema.pre('save', async function (next) {
    const notification = this;

    // If there's no user or movie, proceed to save
    if (!notification.user || !notification.movie) {
        return next();
    }

    // Check if the same movie and user combination already exists
    const existingNotification = await Notification.findOne({
        movie: notification.movie,
        user: notification.user,
    });

    if (existingNotification) {
        const err = new Error('Notification for this movie and user already exists.');
        return next(err); // Throw error to prevent save
    }

    next();
});

const Notification = model('Notification', NotificationSchema)
module.exports = Notification