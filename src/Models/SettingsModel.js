const { model, Schema } = require('mongoose');
const SettingsSchema = new Schema({
    name: {
        type: String,
        required: [true, 'name is required'],
        unique: true,
        enum: ['About', 'Privacy', 'Terms']
    },
    value: {
        type: String,
        required: [true, 'value is required']
    }
}, { timestamps: true });

const SettingsModel = model('settings', SettingsSchema);
module.exports = SettingsModel