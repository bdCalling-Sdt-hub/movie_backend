const { model, Schema } = require('mongoose');

const CalenderSchema = new Schema({
    date: {
        type: Date,
        required: [true, 'date is required'],
    },
    movie: {
        type: String,
        ref: 'Movie',
        required: [true, 'movie Id is required'],
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'user Id is required'],
    },

}, { timestamps: true })
const Calender = model('Calender', CalenderSchema)
module.exports = Calender