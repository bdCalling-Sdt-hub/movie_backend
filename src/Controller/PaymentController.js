const { SRTIPE_KEY } = require('../config/defaults');
const uploadFile = require('../middlewares/FileUpload/FileUpload');
const StripeAccountModel = require('../Models/StripeAccountModel');
const stripe = require("stripe")(SRTIPE_KEY)
const fs = require("fs");
const Queries = require('../utils/Queries');
const PaymentModel = require('../Models/PaymentModel');
const User = require('../Models/UserModel');
const Subscription = require('../Models/SubscriptionModel');
// create payment intent
const Payment = async (req, res) => {
    try {
        const { amount } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
            amount: parseInt(amount * 100),
            currency: "usd",
            payment_method_types: [
                "card"
            ],
        });
        const saveIntent = new PaymentModel({
            clientSecret: paymentIntent.client_secret,
            transactionId: paymentIntent.id,
            amount: amount,
        })
        saveIntent.save()
        res.status(200).send({
            success: true,
            message: "Payment Intent created successfully",
            data: {
                clientSecret: paymentIntent.client_secret,
                transactionId: paymentIntent.id,
                amount: amount,
            },
        });
    } catch (error) {
        res.status(500).send({ success: false, message: "Internal server error", ...error });
    }
}
// save payment status to database
const SavePayment = async (req, res) => {
    try {
        const { id } = req.user;
        const { transactionId, clientSecret } = req.body;
        const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);
        // if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        if (!paymentIntent || paymentIntent.amount_received === 0) {
            return res.status(403).send({
                success: false,
                message: "Payment Not Succeeded",
                error: "PaymentIntent not found or not succeeded"
            });
        }
        const time = new Date();
        const endTime = time.setFullYear(time.getFullYear() + 1);
        const subscription = new Subscription({ user: id, endTime: endTime })
        await Promise.all([
            User.findByIdAndUpdate(
                id,
                { subscription: true, subscription_ends: endTime },
                { new: true, runValidators: true }
            ),
            PaymentModel.findOneAndUpdate(
                { transactionId, clientSecret },
                { status: true }
            ),
            subscription.save()
        ]);

        return res.status(200).send({
            success: true,
            message: "Payment Subscription Started successfully",
            payment_successful: true
        });
    } catch (error) {
        console.error("Error in SavePayment:", error); // For server-side debugging
        res.status(500).send({ success: false, message: "Internal server error", error });
    }
};


module.exports = { Payment, SavePayment }


