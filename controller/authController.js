const { Users } = require("../models");
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { HTTP_STATUS_CODE } = require("../helper/constants.helper")
const { BadRequestException } = require("../common/exceptions/index")
const { forgotPasswordMail } = require("../helper/emailTemplates")

// login
const login = async (req, res) => {
    let { email, password } = req.body
    const user = await Users.findOne({ where: { email: email } })

    if (!user || !bcrypt.compareSync(password, user?.password)) {
        throw new BadRequestException("Invalid email or password")
    }
    const token = jwt.sign({ id: user?.id }, process.env.JWT_SEC, { expiresIn: process.env.JWT_EXPIRES })

    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Login successFully.", data: { userId: user?.id, token } });
}

// Forgot Password
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new BadRequestException("Please enter valid email.");
    }

    const user = await Users.findOne({ where: { email: email } });

    if (user) {
        var digits = '0123456789';
        let OTP = '';
        for (let i = 0; i < 4; i++) {
            OTP += digits[Math.floor(Math.random() * 10)];
        }

        // send mail
        // await forgotPasswordMail({ OTP, email });
        await forgotPasswordMail({ otp: OTP, email: email });
        user.reset_password_token = OTP;
        await user.save();
        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            success: true,
            message: "OTP send successfully for reset password",
            OTP,
            user_id: user?.id
        });
    } else {
        throw new BadRequestException("User not found.");
    }
}

// verify OTP for reset password
const verifyOTP = async (req, res) => {
    let { user_id, email, otp } = req.body;

    const user = await Users.findOne({ where: { id: user_id, email } });
    if (!user) {
        throw new BadRequestException("User not found.")
    }
    if (user?.reset_password_token !== otp) {
        throw new BadRequestException("Invalid otp send.")
    }

    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "OTP verification done successfully", user_id })
}

// reset password
const resetPassword = async (req, res) => {
    let { user_id, password } = req.body
    const user = await Users.findOne({ where: { id: user_id } })

    if (user && user.reset_password_token !== null) {
        user.password = bcrypt.hashSync(password, 10)
        user.reset_password_token = null
        await user.save()
        return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Reset password successFully." });
    } else {
        throw new BadRequestException("User not found")
    }
}


module.exports = {
    login,
    forgotPassword,
    verifyOTP,
    resetPassword
}