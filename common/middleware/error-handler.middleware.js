const GeneralError = require("../exceptions/general-error")
const { HTTP_STATUS_CODE } = require("../../helper/constants.helper");

module.exports = async (err, req, res, next) => {
    console.log(err);
    if (err && err.error && err.error.isJoi) {
        const errors = err.error.details.map(detail => detail.message);
        const errorMessage = errors[0];

        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
            status: HTTP_STATUS_CODE.BAD_REQUEST,
            success: false,
            message: errorMessage,
        });
    }

    if (err instanceof GeneralError) {
        return res.status(err.statusCode).json({ status: err.statusCode, success: false, message: err.message });
    }

    if (err.statusCode) {
        return res.status(err.statusCode).json({ status: err.statusCode, success: false, message: err.message });
    } else {
        return res
            .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
            .json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: err.message });
    }
};