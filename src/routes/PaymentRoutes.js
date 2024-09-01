const PaymentRoutes = require("express").Router();
const { Payment, SavePayment, createConnectedAccount, TransferBallance, UserGetPaymentHistory, GetDoctorPaymentHistory, GetAvailablePayment } = require("../Controller/PaymentController");
const verifyToken = require("../middlewares/Token/verifyToken");
PaymentRoutes.post("/create-payment-intent", verifyToken, Payment).post("/save-payment", verifyToken, SavePayment).post('/create-connected-account', verifyToken, createConnectedAccount).post('/transfer-ballance/:doctorId', verifyToken, TransferBallance).get('/user-payment-history', verifyToken, UserGetPaymentHistory).get('/doctor-payment-history', verifyToken, GetDoctorPaymentHistory).get('/get-available-payment', verifyToken,GetAvailablePayment);
module.exports = PaymentRoutes