const { Employees } = require("../models")
const { ConflictRequestException, BadRequestException } = require("../common/exceptions/index")
const { HTTP_STATUS_CODE } = require("../helper/constants.helper")
const Op = require('sequelize').Op
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const csv = require('csv-parser');
const { Readable } = require('stream');

const addEmployee = async (req, res) => {
    let { name, emp_id, email, joining_date, paid_leave, remaining_leave } = req.body

    const isEmailExits = await Employees.findOne({
        where: {
            email: email,
            deletedAt: {
                [Op.eq]: null,
            }
        }
    })
    if (isEmailExits) {
        throw new BadRequestException("An account already exists with this email address.")
    }

    const isEmpIdExits = await Employees.findOne({ where: { emp_id: emp_id } })
    if (isEmpIdExits) {
        throw new BadRequestException("Employee id is already exits.")
    }

    await Employees.create({ emp_id, name, email, joining_date, paid_leave, remaining_leave })

    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Employee added successfully." });
}

const addBulkEmployee = async (req, res) => {
    upload.fields([
        { name: 'attachment', maxCount: 1 },
    ])(req, res, async (err) => {
        if (err) {
            return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: "Something is wrong" });
        }

        if (!req.files || !req.files?.attachment) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: "Please upload file." });
        }

        const fileBuffer = req.files?.attachment[0]?.buffer


        const readableStream = new Readable();
        readableStream.push(fileBuffer); // Push the buffer data to the readable stream
        readableStream.push(null); // Signal the end of the stream

        let employees = [];
        const promises = [];

        const validateFields = ["Emp id", 'Name', "Email", "Joining Date", "Paid Leave", "Remaining Leave",]
        let validateFieldsError;

        const processRow = async (row) => {
            const invalidFields = validateFields.filter(field => !(field in row));
            if (invalidFields.length > 0) {
                validateFieldsError = { success: false, message: `Invalid fields in CSV row: ${invalidFields.join(', ')}` };
                return validateFieldsError
            }

            const isEmailExits = await Employees.findOne({ where: { email: row?.Email, deletedAt: { [Op.eq]: null } } })

            const isEmpIdExits = await Employees.findOne({ where: { emp_id: row['Emp id'] } })
            if (!isEmailExits && !isEmpIdExits) {
                employees.push({
                    emp_id: row['Emp id'],
                    name: row?.Name,
                    email: row?.Email,
                    joining_date: row["Joining Date"],
                    paid_leave: row["Paid Leave"],
                    remaining_leave: row["Remaining Leave"],
                });
            }

        };

        const processAllData = async () => {
            try {
                await Promise.all(promises);
                //  handle invalid error
                if (validateFieldsError && !validateFieldsError?.success) {
                    return validateFieldsError
                }

                if (employees?.length) {
                    await Employees.bulkCreate(employees);
                    return { success: true, message: "Bulk employees added successfully." };
                } else {
                    return { success: false, message: "No data found." };
                }

            } catch (error) {
                console.error('Error inserting bulk employees:', error);
                return { success: false, message: "Error inserting bulk employees", error: error.message };
            }
        };

        readableStream
            .pipe(csv())
            .on('data', async (row) => {
                promises.push(processRow(row));
            })
            .on('end', async () => {
                try {
                    const result = await processAllData();
                    if (result.success) {
                        return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: result.message });
                    } else {
                        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: result.message });
                    }
                } catch (error) {
                    console.error('Error processing all data:', error);
                    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: "Error processing all data", error: error.message });
                }
            });
    })

}

const updateEmployee = async (req, res) => {
    let { id, email, emp_id } = req.body

    const employee = await Employees.findOne({ where: { id: id, deletedAt: { [Op.eq]: null } } })
    if (!employee) {
        throw new BadRequestException("Employee details not found.")
    }

    // check for email exists
    if (email) {
        const isEmailExits = await Employees.findOne({
            where: {
                email,
                id: { [Op.ne]: id },
                deletedAt: { [Op.eq]: null }
            }
        });
        if (isEmailExits) {
            throw new BadRequestException("An account already exists with this email address.");
        }
        req.body.email = email;
    }

    // check for emp_id exists
    if (emp_id) {
        const isEmpIdExits = await Employees.findOne({ where: { emp_id: emp_id, id: { [Op.ne]: id } } })
        if (isEmpIdExits) {
            throw new BadRequestException("Employee id is already exits.")
        }
    }

    await Employees.update(req.body, { where: { id: id } })

    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Employee updated successfully." });
}

const getAllEmployee = async (req, res) => {
    const employees = await Employees.findAll({
        where: {
            deletedAt: {
                [Op.eq]: null,
            },
        },
        attributes: { exclude: ['deletedAt', 'updatedAt'] }
    })

    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Employee list loaded successfully.", employees });
}

const deleteEmployee = async (req, res) => {
    const employeeId = req.params.id
    const employee = await Employees.findOne({
        where: {
            deletedAt: {
                [Op.eq]: null,
            },
            id: employeeId,
        }
    });

    if (!employee) {
        throw new BadRequestException("Employee details not found.")
    }
    await Employees.update(
        { deletedAt: new Date() },
        { where: { id: employeeId } })

    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Employee deleted successfully." })
}

module.exports = {
    addEmployee,
    addBulkEmployee,
    updateEmployee,
    getAllEmployee,
    deleteEmployee
}