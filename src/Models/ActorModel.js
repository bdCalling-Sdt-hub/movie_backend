const mongoose = require('mongoose');
// Define the actor schema
const ActorSchema = new mongoose.Schema({
    actor_id: {
        type: Number,
        required: [true, 'Actor ID is required'],
        unique: true
    },
    adult: {
        type: Boolean,
        required: [true, 'Adult flag is required'],
        default: false
    },
    gender: {
        type: Number,
        required: [false, 'Gender is required'],
    },
    known_for_department: {
        type: String,
        required: [true, 'Known for department is required']
    },
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    original_name: {
        type: String,
        required: [true, 'Original name is required']
    },
    popularity: {
        type: Number,
        required: [true, 'Popularity is required']
    },
    profile_path: {
        type: String,
        required: [true, 'Profile path is required']
    },
});

// Create the model from the schema
const Actor = mongoose.model('Actor', ActorSchema);

module.exports = Actor;