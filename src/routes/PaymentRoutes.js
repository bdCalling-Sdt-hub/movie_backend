const PaymentRoutes = require("express").Router();
const { Payment, SavePayment, } = require("../Controller/PaymentController");
const verifyToken = require("../middlewares/Token/verifyToken");
PaymentRoutes.post("/create-payment-intent", verifyToken, Payment).post("/save-payment", verifyToken, SavePayment)
module.exports = PaymentRoutes