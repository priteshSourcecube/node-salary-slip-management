const routes = require("express").Router()
const { paySlipController } = require("../controller/index")
const { isAuthenticated } = require("../common/middleware/authenticate.middleware")
const expressAsyncHandler = require("express-async-handler")
const validator = require("../helper/validator.helper")

routes
    .post("/add", isAuthenticated, expressAsyncHandler(paySlipController.importPaySlip))
    .get("/", isAuthenticated, expressAsyncHandler(paySlipController.getAllPaySlips))

module.exports = routes