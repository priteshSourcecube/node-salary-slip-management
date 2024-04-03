const Joi = require("joi")

const addEmployeeValidator = Joi.object().keys({
    name: Joi.string().required().messages({
        "*": "The name field is required."
    }),
    email: Joi.string().required().messages({
        "*": "The email field is required.",
        "string.email": "The email must be a valid email."
    }),
    joining_date: Joi.string().required().messages({
        "*": "The joining_date field is required.",
    }),
    paid_leave: Joi.number().required().messages({
        "*": "The paid_leave field is required.",
    }),
    remaining_leave: Joi.number().required().messages({
        "*": "The remaining_leave field is required.",
    }),
})

const updateEmployeeValidator = Joi.object().keys({
    id: Joi.number().required().messages({
        "*": "The employee id field is required.",
    }),
    name: Joi.string().optional(),
    email: Joi.string().optional(),
    joining_date: Joi.string().optional(),
    paid_leave: Joi.number().optional(),
    remaining_leave: Joi.number().optional(),
})



module.exports = {
    addEmployeeValidator,
    updateEmployeeValidator
}