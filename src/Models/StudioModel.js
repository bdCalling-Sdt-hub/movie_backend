const { model, Schema } = require('mongoose');
const StudioSchema = new Schema({
    name: { type: String, unique: true, required: [true, "name is required"] },
    logo: { type: String, required: [true, "logo is required"] },
    total_movies: { type: Number, required: [true, "total movie is required"], default: 0 },
    description: { type: String },
}, { timestamps: true })
const StudioModel = model('studio', StudioSchema);
module.exports = StudioModel
// StudioSchema.pre('save', async function (next) {
//     try {
//         next()
//     } catch (error) {
//         next(error)
//     }
// })