const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    adult: {
        type: Boolean,
        required: true
    },
    background_color: {
        type: String,
        required: true
    },
    movie_types: {
        type: [Number],
        required: true
    },
    movie_id: {
        type: Number,
        required: true,
        unique: true
    },
    original_language: {
        type: String,
        required: true
    },
    original_title: {
        type: String,
        required: true
    },
    overview: {
        type: String,
        required: false,
        default: ''
    },
    popularity: {
        type: Number,
        required: true
    },
    poster: {
        type: String,
        required: true
    },
    release_date: {
        type: Date,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    video: {
        type: Boolean,
        required: true,
        default: false
    },
    rating: {
        type: Number,
        required: true
    },
    vote: {
        type: Number,
        required: true
    },
    studio_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'studio id is required']
    },
    type: {
        type: String,
        required: true,
        enum: ['movie', 'tv'],
        default: 'movie'
    }

}, { timestamps: true });

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;
