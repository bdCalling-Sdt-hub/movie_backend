
const { SignUp, SignIn, UpdateUser, ChangePassword, SendVerifyEmail, VerifyCode, ResetPassword, GetProfile, DeleteAccount, AdminGetAllUser, } = require('../Controller/AuthenticationController');
const uploadFile = require('../middlewares/FileUpload/FileUpload');
const VerificationToken = require('../middlewares/Token/VerificationToken');
const verifyToken = require('../middlewares/Token/verifyToken');
const AuthRoute = require('express').Router()

AuthRoute.post('/sign-up', SignUp)
    .post('/sign-in', SignIn)
    .post('/send-verify-email', SendVerifyEmail)
    .post('/verify-code', VerifyCode)
    .post('/reset-password', VerificationToken, ResetPassword)
    .patch('/update-user', verifyToken, uploadFile(), UpdateUser)
    .patch('/change-password', verifyToken, ChangePassword)
    .get('/profile', verifyToken, GetProfile)
    .delete('/delete-account', verifyToken, DeleteAccount)
    .get('/admin-get-all-user', verifyToken,AdminGetAllUser)

module.exports = AuthRoute