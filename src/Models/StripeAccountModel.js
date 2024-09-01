const { model, Schema } = require('mongoose');

const StripeAccountSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required']
    },
    doctorId: {
        type: Schema.Types.ObjectId,
        ref: 'Doctor',
        required: [true, 'user Id is required'],
    },
    stripeAccountId: {
        type: String,
        required: [true, 'Stripe Account Id is required'],
    },
    kycBack: {
        type: String,
        required: [true, 'KYC Back is required'],
    },
    kycFront: {
        type: String,
        required: [true, 'KYC Front is required'],
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
    },
    dob: {
        type: Date,
        required: [true, 'Date is required'],
    },
    accountInformation: {
        type: {
            stripeAccountId: {
                type: String,
                required: [true, 'Stripe Account Id is required'],
            },
            externalAccountId: {
                type: String,
                required: [true, 'External Account Id is required'],
            },
            status: {
                type: Boolean,
                required: [true, 'Status is required'],
                enum: [true, false],
            },
        },
        required: [true, 'Account Information is required'],
    }
})
const StripeAccountModel = model('stripeAccount', StripeAccountSchema);
module.exports = StripeAccountModel