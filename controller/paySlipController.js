const multer = require("multer");
const { Payslips, Payslip_details, Employees } = require("../models")
const storage = multer.memoryStorage();
const upload = multer({ storage });
const { HTTP_STATUS_CODE } = require("../helper/constants.helper");
const { fileUpload } = require("../helper/fileUpload");
const Op = require('sequelize').Op
const csv = require('csv-parser');
const { Readable } = require('stream');
const { BadRequestException } = require("../common/exceptions");
const { salarySlip, salarySlipPDfMail } = require("../helper/emailTemplates")

/*
*store uploaded csv in paySlip table and then stored csv data in paySlipDetails using reference of created paySlip.
*/
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

        let paySlipData = await Payslips.create({ added_by: req.user, file: filePath, file_name: req.files?.file[0]?.originalname })
        if (paySlipData) {
            const result = await storePaySlipDetails({ paySlipId: paySlipData?.id, file: req.files?.file[0]?.buffer })
            if (result.success) {
                return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: 'Pay slip uploaded successfully.' });
            } else {
                // if (result.message === "Employee not found") {
                //     await Payslips.destroy({ where: { id: paySlipData?.id } })
                // }
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: result.message, details: result.emp_id || null });
            }
        }

    })

}

/*
* Stored csv data in paySlipDetails using reference of created paySlip.
*/
const storePaySlipDetails = async ({ paySlipId, file }) => {
    const readableStream = new Readable();
    readableStream.push(file);
    readableStream.push(null);

    let paySlipDetails = [];
    const promises = [];
    let empNotExits;

    const processRow = async (row) => {
        let isEmpExist = await Employees.findOne({
            where: {
                emp_id: row?.empId,
                deletedAt: {
                    [Op.eq]: null,
                }
            }
        })
        // if (!isEmpExist) {
        //     empNotExits = { success: false, message: "Employee not found", emp_id: row?.empId }
        //     return empNotExits
        // }
        if (isEmpExist) {
            paySlipDetails.push({
                payslip_id: paySlipId,
                emp_id: isEmpExist?.id,
                salary: row?.Salary,
                working_days: row["Working Days"],
                leave: row?.Leave,
                gross_pay: row["Gross Pay"],
                deduction: row["Deduction"],
                net_pay: row['Net Pay']
            });
        }
    };

    const processAllData = async () => {
        try {
            await Promise.all(promises);
            // if (empNotExits && !empNotExits?.success) {
            //     return empNotExits
            // } else {

            if (paySlipDetails.length > 0) {
                await Payslip_details.bulkCreate(paySlipDetails);
                return { success: true, message: "Pay slip details added successfully." };
            } else {
                return { success: false, message: "No data found." };
            }
            // }
        } catch (error) {
            console.error('Error pay details:', error);
            return { success: false, message: "Error inserting bulk pay slip details", error: error.message };
        }
    };

    return new Promise((resolve, reject) => {
        readableStream
            .pipe(csv())
            .on('data', async (row) => {
                promises.push(processRow(row));
            })
            .on('end', async () => {
                try {
                    const result = await processAllData();
                    resolve(result);
                } catch (error) {
                    console.error('Error processing all data:', error);
                    reject(error);
                }
            });
    });

}

/*
* In this get only file name and uploaded date
*/
const getAllPaySlips = async (req, res) => {
    const payslips = await Payslips.findAll({
        where: {
            deletedAt: {
                [Op.eq]: null,
            }
        },
        attributes: { exclude: ['deletedAt', 'updatedAt'] },
        include: [
            {
                association: "addedBy",
                attributes: { exclude: ['password', 'reset_password_token', 'deletedAt', 'createdAt', 'updatedAt'] },
            }
        ],
        order: [
            ['createdAt', 'DESC']
        ],

    })
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "PaySlip list loaded successfully.", payslips });
}

/*
* In this get only single file's data
*/
const getFileData = async (req, res) => {
    const { payslip_id } = req.params
    const payslips = await Payslip_details.findAll({
        where: {
            payslip_id: payslip_id,
            deletedAt: {
                [Op.eq]: null,
            }
        },
        attributes: { exclude: ['deletedAt', 'updatedAt'] },
        include: [
            {
                association: "employee",
                attributes: { exclude: ['deletedAt', 'updatedAt', 'createdAt'] },
            }
        ],
    })
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Pay slip list loaded successfully.", total: payslips.length, data: payslips });
}

/*
* In this get single employee's details
*/
const getSingleEmpData = async (req, res) => {
    const { id } = req.params
    const payslips = await Payslip_details.findOne({
        where: {
            id: id,
            deletedAt: {
                [Op.eq]: null,
            }
        },
        attributes: { exclude: ['deletedAt', 'updatedAt'] },
        include: [
            {
                association: "employee",
                attributes: { exclude: ['deletedAt', 'updatedAt', 'createdAt'] },
            }
        ],
    })

    if (!payslips) {
        throw new BadRequestException("Pay slip details not found.")
    }
    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "PaySlip list loaded successfully.", data: payslips });
}

// /*
// * Send salary slip mail to multiple users 
// */
// const sendSalarySlipMail = async (req, res) => {
//     const { ids } = req.body
//     const payslips = await Payslip_details.findAll({
//         where: {
//             id: {
//                 [Op.in]: ids,
//             },
//             deletedAt: {
//                 [Op.eq]: null,
//             }
//         },
//         attributes: { exclude: ['deletedAt', 'updatedAt'] },
//         include: [
//             {
//                 association: "employee",
//                 attributes: { exclude: ['deletedAt', 'updatedAt', 'createdAt'] },
//             }
//         ],
//     })
//     const mailData = []
//     payslips.map(async (val) => {
//         await salarySlip(val)
//     })

//     return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "PaySlip list loaded successfully.", payslips });
// }


const sendSalarySlipPdf = async (req, res) => {
    const { ids } = req.body;
    const payslips = await Payslip_details.findAll({
        where: {
            id: {
                [Op.in]: ids,
            },
            deletedAt: null,
        },
        attributes: { exclude: ['deletedAt', 'updatedAt'] },
        include: [
            {
                association: 'employee',
                attributes: { exclude: ['deletedAt', 'updatedAt', 'createdAt'] },
            },
        ],
    });
    let result = await Promise.all(payslips.map(async (val) => {
        return await salarySlipPDfMail(val);
    }));

    // const results = payslips.map((val) => {
    //     salarySlipPDfMail(val).then(() => {
    //     })
    // })

    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, result });
};
module.exports = {
    importPaySlip,
    getAllPaySlips,
    getFileData,
    getSingleEmpData,
    // sendSalarySlipMail,
    sendSalarySlipPdf
};
