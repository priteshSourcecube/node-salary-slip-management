const path = require("path");
const ejs = require("ejs");
const sendEmail = require("./EmailSender");

const forgotPasswordMail = async (options) => {
    const { otp, email } = options

    const templatePath = path.join(__dirname, "../public/emailTemplates/forgotPassword.ejs")
    const data = await ejs.renderFile(templatePath, { otp });

    await sendEmail({
        email,
        subject: 'Reset Password',
        message: data
    })
}

module.exports = { forgotPasswordMail }