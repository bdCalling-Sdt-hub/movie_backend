const { model, Schema } = require('mongoose');

const verificationModel = new Schema({
    email: {
        type: String,
        required: false
    },
    code: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        expires: 6000
    }
});

const Verification = model('verification', verificationModel);
module.exports = Verification;
