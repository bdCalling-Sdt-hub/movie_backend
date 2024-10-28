const { model, Schema } = require('mongoose');
const FavoriteSchema = new Schema({
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
const Favorite = model('Favorite', FavoriteSchema)
module.exports = Favorite
