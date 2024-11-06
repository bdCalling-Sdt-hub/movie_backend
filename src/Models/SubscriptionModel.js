const { model, Schema } = require('mongoose')
const cron = require('node-cron');
const User = require('./UserModel');
const SubscriptionSchema = new Schema({
    user: {
        type: String,
        required: [true, 'User Id is missing']
    },
    endTime: {
        type: Date,
        required: [true, 'End time Is required']
    },
}, { timestamps: true })

// SubscriptionSchema.pre('save', async function (next) {
//     this.endTime = new Date();
//     this.endTime.setFullYear(this.endTime.getFullYear() + 1);
//     next();
// });
const Subscription = model('subscription', SubscriptionSchema)
module.exports = Subscription

cron.schedule('0 0 * * *', async () => {
    try {
        console.log("Running daily subscription check...");
        const expiredSubscriptions = await Subscription.find({
            endTime: { $lt: new Date() }
        });
        for (const subscription of expiredSubscriptions) {
            await User.findByIdAndUpdate(subscription.user, {
                subscription: false,
                subscription_ends: null
            });
            await Subscription.findByIdAndDelete(subscription._id);
        }

        console.log("Daily subscription check completed.");
    } catch (error) {
        console.error("Error during subscription check:", error);
    }
});