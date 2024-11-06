const { ACCESS_TOKEN_SECRET } = require("../config/defaults");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const HashPassword = require("../utils/HashPassword");
const SendEmail = require("../utils/SendMail");
const Verification = require("../Models/VerificationCodeModel");
const User = require("../Models/UserModel");
const UnlinkFiles = require("../middlewares/FileUpload/UnlinkFiles");
const Queries = require("../utils/Queries");
const globalErrorHandler = require("../utils/globalErrorHandler");
const e = require("express");

// signUp
const SignUp = async (req, res, next) => {
    try {
        const { access, confirm_password, password, ...user } = req.body
        if (confirm_password !== password) {
            return res.status(201).send({ success: false, message: "confirm password doesn't match" });
        }
        const email = user?.email
        const existingUsers = await User.findOne({ email: email, verified: false })
        if (existingUsers) {
            const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
            const code = new Verification({
                email: existingUsers?.email,
                code: activationCode
            })
            await code.save();
            SendEmail({
                sender: 'movie',
                receiver: existingUsers?.email,
                subject: 'verify code',
                msg: `<h1>
            hallow ${existingUsers?.name} 
            </h1/>
            <p>you have successfully registered our website</p>
            <p>now you can explore more of your website</p>
            <p>please verify your email with this code : <strong>${activationCode}</strong></p>
            <h1>movie</h1>
            `,
            })
            return res.status(200).send({ success: true, message: 'a verification email has been sent to your email', data: existingUsers, });
        }
        let existingAdmin;
        if (req.body?.role && req?.body?.role === "ADMIN") {
            user.access = 1
            existingAdmin = await Queries(User, {}, { role: req.body.role })
        }

        if (existingAdmin?.data?.length > 0) {
            return res.status(201).send({ success: false, message: "You can't register as admin" });
        }
        const newUser = new User({ ...user, password });
        const savedUser = await newUser.save();
        if (savedUser?._id) {
            const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
            const code = new Verification({
                email: savedUser?.email,
                code: activationCode
            })
            await code.save();
            //send mail
            SendEmail({
                sender: 'Movie',
                receiver: savedUser?.email,
                subject: 'register user successfully',
                msg: `<h1>
                hallow ${savedUser?.name} 
                </h1/>
                <p>you have successfully registered our website</p>
                <p>now you can explore more of your website</p>
                <p>please verify your email with this code : <strong>${activationCode}</strong></p>
                <h1>Movie</h1>
                `,
            })

            return res.status(200).send({
                success: true, message: 'a verification code sent to your email', data: savedUser,
            });
        } else {
            res.status(201).send({ success: false, message: 'something went wrong' });
        }
    } catch (error) {
        globalErrorHandler(error, req, res, next, 'user')
    }

}

// login 
const SignIn = async (req, res, next) => {
    try {
        const { email, password } = req.body
        //  console.log(email, password)
        const [user] = await Promise.all([
            User.findOne({ email: email }),
        ])
        if (!user) {
            return res.status(400).send({ success: false, message: "user doesn't exist" });
        }
        let result = await bcrypt.compare(password, user?.password);
        if (result) {
            if (user && !user?.verified) {
                const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
                const code = new Verification({
                    email: user?.email,
                    code: activationCode
                })
                await code.save();
                return res.status(400).send({ success: false, data: user, message: "please verify your email a verification code sent to your email" });
            }
            const userData = {
                email: user?.email,
                phone: user?.phone,
                verified: user?.verified,
                name: user?.name,
                role: user?.role,
                access: user?.access,
                id: user?._id
            }
            const token = await jwt.sign(userData, ACCESS_TOKEN_SECRET, { expiresIn: 36000000 });
            return res.status(200).send({
                success: true, message: "login Successfully", data: user || doctor, token

            });
        } else {
            return res.status(400).send({ success: false, message: "Wrong password" });
        }

    } catch (error) {

        globalErrorHandler(error, req, res, next, 'user')
    }
}
//update user
const UpdateUser = async (req, res, next) => {
    try {
        const { id } = req?.user;
        const user = await User.findOne({ _id: id });
        if (!user) {
            return res.status(400).send({ success: false, message: "user doesn't exist" });
        }
        const { access, role, email, password, ...data } = req.body;
        // const { img } = req.files || {};
        if (req?.files?.img) {
            data.img = req.files.img[0]?.path
        }
        const { genres, ...othersData } = data
        if (genres) {
            othersData.genres = JSON.parse(genres)
        }
        const result = await User.updateOne({ _id: id }, {
            $set: {
                ...othersData,
            }
        })
        if (req?.files?.img && user?.img) {
            UnlinkFiles([user?.img]);
        }
        res.status(200).send({ success: true, data: result, message: 'Profile Updated Successfully' });
    } catch (error) {
        globalErrorHandler(error, req, res, next, 'user')
    }
}

// change password 
const ChangePassword = async (req, res, next) => {
    try {
        const { old_Password, password, confirm_password } = req.body;
        if (password !== confirm_password) {
            return res.status(400).send({ success: false, message: "confirm password doesn't match" });
        }
        const { id, role } = req?.user
        //console.log(id, { old_Password, password })
        if (old_Password === password) {
            return res.status(403).send({ success: false, message: "new password cannot be your old password", });
        }
        const user = await User.findById(id);
        if (!user) {
            return res.status(400).send({ success: false, message: "user doesn't exist" });
        }
        const newPasswordCheck = await bcrypt.compare(password, user?.password);
        if (newPasswordCheck) {
            return res.status(403).send({ success: false, message: "new password cannot be your old password", });
        }
        const CheckPassword = await bcrypt.compare(old_Password, user?.password);
        //console.log(CheckPassword)
        if (CheckPassword) {
            const hash_pass = await HashPassword(password)
            let result = await User.updateOne({ _id: id }, {
                $set: {
                    password: hash_pass
                }
            })
            SendEmail({
                sender: 'movie',
                receiver: user?.email,
                subject: 'password Changed successfully',
                msg: `<h1> hallow ${user?.name} </h1/>
                <p>your password has been changed</p>
                <p>your new password : ${password} </p>
                <p>Thank you </p>
                <h1>movie</h1>
                `,
            })
            return res.status(200).send({ success: true, message: 'password updated successfully', data: result });
        } else {
            return res.status(403).send({ success: false, message: "old password doesn't match", });
        }
    } catch (error) {
        globalErrorHandler(error, req, res, next, 'user')
    }
}

// forget password send verification code
const SendVerifyEmail = async (req, res, next) => {
    try {
        const { email } = req.body
        if (!email) {
            return res.status(400).send({ success: false, message: 'invalid email' });
        }
        const user = await User.findOne({ email: email })
        if (!user) {
            return res.status(400).send({ success: false, message: 'user not found' });
        }
        const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
        const code = new Verification({
            email: email,
            code: activationCode
        })
        const result = await code.save()
        if (result?._id) {
            SendEmail({
                sender: 'movie',
                receiver: user?.email,
                subject: 'register user successfully',
                msg: `<h1> hallow ${user?.name} </h1/>
                <p>your password reset code is : <strong>${activationCode}</strong> </p>
                <p>Thank you </p>
                <h1>movie</h1>
                `,
            })
            //console.log(email)
            res.status(200).send({ success: true, message: `verification code has been sent to ${email}`, });
        }

    } catch (error) {
        globalErrorHandler(error, req, res, next, 'user')
    }
}

//verify code
const VerifyCode = async (req, res, next) => {
    const { code, email } = req.body
    try {
        const [verify, user] = await Promise.all([
            Verification.findOne({ email: email, code: code }),
            User.findOne({ email: email }),
        ])
        if (!user) {
            return res.status(400).send({ success: false, message: 'user not found' });
        }
        if (verify?._id) {
            await User.updateOne({ email: email }, {
                $set: {
                    verified: true
                }
            })
            const userData = {
                email: user?.email,
                name: user?.name,
                role: user?.role,
                id: user?._id
            }
            const token = await jwt.sign(userData, ACCESS_TOKEN_SECRET, { expiresIn: 3600000000 });
            const accessToken = await jwt.sign({ code, email }, ACCESS_TOKEN_SECRET, { expiresIn: 600 });
            res.status(200).send({ success: true, password_reset_token: accessToken, token, message: `user verified successfully` })
        } else {
            res.status(401).send({ success: false, message: "verification code doesn't match" });
        }
    } catch (error) {
        res.status(500).send({ success: false, error: { error, message: error?.message || 'Internal server error', } });
    }
}

//reset password
const ResetPassword = async (req, res, next) => {
    try {
        const requestedUser = req?.user
        const verify = await Verification.findOne({ email: requestedUser?.email, code: requestedUser?.code })
        if (verify?._id) {
            const { password, confirm_password, } = req.body
            if (password !== confirm_password) {
                return res.status(400).send({ success: false, error: { message: "confirm password doesn't match" } });
            }
            const hash_pass = await HashPassword(password)
            //console.log(hash_pass)
            let result;
            result = await User.updateOne({ email: verify?.email }, {
                $set: {
                    password: hash_pass
                }
            })
            SendEmail({
                sender: 'movie',
                receiver: requestedUser?.email,
                subject: 'password reset successfully',
                msg: `<h1> hallow ${requestedUser?.name} </h1/>
            <p>your password has been changed</p>
            <p>your new password : ${password} </p>
            <p>Thank you </p>
            <h1>movie</h1>
            `,
            })
            await Verification.deleteOne({ email: requestedUser?.email, code: requestedUser?.code })
            return res.status(200).send({ success: true, message: 'password updated successfully', data: result });
        } else {
            res.status(401).send({ success: false, message: "verification code doesn't match" });
        }

    } catch (error) {
        res.status(500).send({ success: false, message: error?.message || 'Internal server error', ...error });
    }
}

// get user profile
const GetProfile = async (req, res, next) => {
    const { email } = req.user;
    try {
        const result = await User.findOne({ email: email })
        if (!result) {
            return res.status(400).send({ success: false, message: "user doesn't exist" });
        }
        if (!result?.verified) {
            return res.status(400).send({ success: false, message: "please verify your email" });
        }
        res.status(200).send({ success: true, data: result });
    } catch (error) {
        globalErrorHandler(error, req, res, next, 'user')
    }
}
// delete account 
const DeleteAccount = async (req, res, next) => {
    try {
        const { email } = req.user;
        const { password } = req.body
        const user = await User.findOne({ email: email })
        if (user) {
            const result = await bcrypt.compare(password, user?.password);
            if (result) {
                const deleted = await User.deleteOne({ _id: user?._id })
                // console.log(deleted)
                if (!deleted) {
                    return res.status(400).send({ success: false, message: "something went wrong" });
                } else {
                    return res.status(200).send({ success: true, message: "user deleted successfully", data: deleted });
                }
            } else {
                return res.status(400).send({ success: false, message: "password doesn't match" });
            }
        } else {
            return res.status(400).send({ success: false, message: "user doesn't exist" });
        }
    } catch (error) {
        res.status(500).send({ success: false, message: error?.message || 'Internal server error', ...error });
    }
}
const AdminGetAllUser = async (req, res, next) => {
    try {
        if (req.user?.role !== "ADMIN") {
            return res.status(403).send({ success: false, message: 'you are unauthorized ' })
        }
        console.log('admin')
        const { search, ...queryKeys } = req.query;
        const searchKey = {}
        if (search) searchKey.name = search
        const result = await Queries(User, queryKeys, searchKey)
        return res.status(200).send({ message: 'User retrieve Successfully', ...result })
    } catch (error) {
        globalErrorHandler(error, req, res, next, 'user')
    }
}
module.exports = {
    SignUp,
    SignIn,
    UpdateUser,
    ChangePassword,
    SendVerifyEmail,
    ResetPassword,
    VerifyCode,
    GetProfile,
    DeleteAccount,
    AdminGetAllUser
}