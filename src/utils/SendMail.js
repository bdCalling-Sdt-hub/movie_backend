const nodemailer = require('nodemailer');
const { MAIL_EMAIL, MAIL_PASSWORD } = require('../config/defaults');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: true,
    auth: {
        user: MAIL_EMAIL,
        pass: MAIL_PASSWORD,
    },
})
const SendEmail = async (mailData) => {
    const mailOptions = {
        from: mailData.sender,
        to: mailData.receiver,
        subject: mailData.subject,
        html: mailData.msg,
    };
    try {
        return await transporter.sendMail(mailOptions)
    } catch (error) {
        // //console.log(error)
    }
}
module.exports = SendEmail