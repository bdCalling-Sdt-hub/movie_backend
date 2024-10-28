const { model, Schema } = require('mongoose');
const HistorySchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'user Id is required'],
    },
    movie: {
        type: String,
        required: [true, 'movie Id is required'],
    },
}, { timestamps: true });
const History = model('History', HistorySchema)
module.exports = History
