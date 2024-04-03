const jwt = require("jsonwebtoken")
const { Users } = require("../../models")
const { HTTP_STATUS_CODE } = require("../../helper/constants.helper")

exports.isAuthenticated = async (req, res, next) => {
    try {
        const headers = req.headers.authorization;
        if (!headers) {
            return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({ status: HTTP_STATUS_CODE.UNAUTHORIZED, success: false, message: "Please login to access this resource" });
        }

        const token = headers.split(" ")[1];
        if (!token) {
            return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({ status: HTTP_STATUS_CODE.UNAUTHORIZED, success: false, message: "Please Enter a valid Token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SEC);

        const user = await Users.findByPk(decoded.id);
        if (!user) {
            return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({ status: HTTP_STATUS_CODE.UNAUTHORIZED, success: false, message: "Token is expired or Invalid." });
        }

        req.user = decoded.id

        next();

    } catch (error) {
        console.log(error);

        if (error.name === 'TokenExpiredError') {
            return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({ status: HTTP_STATUS_CODE.UNAUTHORIZED, success: false, message: "Token has expired" });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({ status: HTTP_STATUS_CODE.UNAUTHORIZED, success: false, message: "Invalid token" });
        }

        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: error.message });
    }
};

