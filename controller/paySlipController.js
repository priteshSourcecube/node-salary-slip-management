const multer = require("multer");
const { Payslips } = require("../models")
const storage = multer.memoryStorage();
const upload = multer({ storage });
const { HTTP_STATUS_CODE } = require("../helper/constants.helper");
const { fileUpload } = require("../helper/fileUpload");
const Op = require('sequelize').Op

const importPaySlip = async (req, res) => {
    upload.fields([
        { name: 'file', maxCount: 1 },
    ])(req, res, async (err) => {
        if (err) {
            return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: "Something is wrong" });
        }

        if (!req.files || !req.files?.file) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "Please upload file." });
        }


        let filePath = await fileUpload(req.files?.file[0])


        if (!filePath) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "Error while upload file" });
        }

        await Payslips.create({ file: filePath })
        return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: 'File upload successfully.', filePath });

    })

}

const getAllPaySlips = async (req, res) => {
    const payslips = await Payslips.findAll({
        where: {
            deletedAt: {
                [Op.eq]: null,
            }
        },
        attributes: { exclude: ['deletedAt', 'updatedAt'] }

    })
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "PaySlip list loaded successfully.", payslips });
}


module.exports = {
    importPaySlip,
    getAllPaySlips
};
