const Joi = require("joi")

const loginValidator = Joi.object().keys({
    email: Joi.string().required().messages({
        "*": "The email field is required.",
        "string.email": "The email must be a valid email."
    }),
    password: Joi.string().required().messages({
        "*": "The password field is required.",
    })
})

const verifyOtpValidator = Joi.object().keys({
    user_id: Joi.number().required().messages({
        "*": "The user_id field is required.",
    }),
    email: Joi.string().optional().messages({
        "*": "The email field is required.",
        "string.email": "The email must be a valid email."
    }),
    otp: Joi.string().required().messages({
        "*": "The otp field is required.",
    })
})

const resetPasswordValidator = Joi.object().keys({
    user_id: Joi.number().required().messages({
        "*": "The user_id field is required.",
    }),
    password: Joi.string().required().messages({
        "*": "The password field is required.",
    })
})

module.exports = {
    loginValidator,
    verifyOtpValidator,
    resetPasswordValidator
}