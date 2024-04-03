const routes = require("express").Router()
const { paySlipController } = require("../controller/index")
const { isAuthenticated } = require("../common/middleware/authenticate.middleware")
const expressAsyncHandler = require("express-async-handler")
const validator = require("../helper/validator.helper")
const { sendMailValidator } = require("../common/validation/paySlipValidation")

routes
    .post("/add", isAuthenticated, expressAsyncHandler(paySlipController.importPaySlip))
    .get("/", isAuthenticated, expressAsyncHandler(paySlipController.getAllPaySlips))
    .get("/:payslip_id", isAuthenticated, expressAsyncHandler(paySlipController.getFileData))
    .get("/get-single/:id", isAuthenticated, expressAsyncHandler(paySlipController.getSingleEmpData))
    // .post("/send-mail", isAuthenticated, validator.body(sendMailValidator), expressAsyncHandler(paySlipController.sendSalarySlipMail))
    .post("/send-mail-pdf", isAuthenticated, validator.body(sendMailValidator), expressAsyncHandler(paySlipController.sendSalarySlipPdf))

module.exports = routes