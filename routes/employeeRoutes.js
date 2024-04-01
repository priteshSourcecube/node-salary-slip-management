const routes = require("express").Router()
const { employeeController } = require("../controller/index")
const { isAuthenticated } = require("../common/middleware/authenticate.middleware")
const expressAsyncHandler = require("express-async-handler")
const validator = require("../helper/validator.helper")
const { addEmployeeValidator, updateEmployeeValidator } = require("../common/validation/employeeValidation")

routes
    .post("/add", isAuthenticated, validator.body(addEmployeeValidator), expressAsyncHandler(employeeController.addEmployee))
    .post("/bulk-add", isAuthenticated, expressAsyncHandler(employeeController.addBulkEmployee))
    .put("/update", isAuthenticated, validator.body(updateEmployeeValidator), expressAsyncHandler(employeeController.updateEmployee))
    .get("/", isAuthenticated, expressAsyncHandler(employeeController.getAllEmployee))
    .delete("/delete/:id", isAuthenticated, expressAsyncHandler(employeeController.deleteEmployee))

module.exports = routes