const { model, Schema } = require('mongoose');
const cron = require('node-cron');
const verificationModel = new Schema({
    email: {
        type: String,
        required: false
    },
    code: {
        type: String,
        required: false
    },
});

const Verification = model('verification', verificationModel);
module.exports = Verification;
cron.schedule('* * * * *', async () => {
    const expirationTime = new Date(Date.now() - 3 * 60 * 1000);
    await Verification.deleteMany({ createdAt: { $lt: expirationTime } });
    console.log('Deleted expired verification codes');
});
