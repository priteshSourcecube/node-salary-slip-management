const routes = require("express").Router()
const authRoutes = require("./authRoutes")
const employeeRoutes = require("./employeeRoutes")
const paySlipRoutes = require("./paySlipRoutes")

routes
    .use("/auth", authRoutes)
    .use("/employee", employeeRoutes)
    .use("/payslip", paySlipRoutes)

module.exports = routes