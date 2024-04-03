const Joi = require("joi")

const sendMailValidator = Joi.object().keys({
    ids: Joi.array().required().items(Joi.number()).min(1).messages({
        "*": "ids array must contain at least one element"
    }),
})

module.exports = {
    sendMailValidator
}