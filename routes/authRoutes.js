const routes = require("express").Router()
const { authController } = require("../controller/index")
const expressAsyncHandler = require("express-async-handler")
const validator = require("../helper/validator.helper")
const { loginValidator, verifyOtpValidator, resetPasswordValidator } = require("../common/validation/authValidation")

routes
    .post("/login", validator.body(loginValidator), expressAsyncHandler(authController.login))
    .post("/forgot-password", expressAsyncHandler(authController.forgotPassword))
    .post("/verify-otp", validator.body(verifyOtpValidator), expressAsyncHandler(authController.verifyOTP))
    .post("/reset-password", validator.body(resetPasswordValidator), expressAsyncHandler(authController.resetPassword))

module.exports = routes