const { model, Schema } = require('mongoose')
const PaymentSchema = new Schema({
    transactionId: {
        type: String,
        required: [true, 'transaction Id is missing']
    },
    clientSecret: {
        type: String,
        required: [true, 'Client Secret Is required']
    },
    amount: {
        type: Number,
        required: [true, 'amount Is required']
    },
    status: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

const PaymentModel = model('payment', PaymentSchema)
module.exports = PaymentModel