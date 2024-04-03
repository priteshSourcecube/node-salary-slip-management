const { Employees } = require("../models")
const { BadRequestException } = require("../common/exceptions/index")
const { HTTP_STATUS_CODE } = require("../helper/constants.helper")
const Op = require('sequelize').Op
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const csv = require('csv-parser');
const { Readable } = require('stream');
const { generateEmpId } = require("../helper/generateEmpId");


const newEmployeeId = async () => {
    const empCount = await Employees.findAll({
        attributes: ['emp_id']
    });

    const empIds = empCount.map(emp => emp.emp_id);
    const maxEmpId = empIds.reduce((maxId, currentId) => {
        const maxNum = parseInt(maxId.substring(4));
        const currentNum = parseInt(currentId.substring(4));
        return maxNum > currentNum ? maxId : currentId;
    });

    let tempBid = "";
    if (!maxEmpId) {
        tempBid = "#EMP0000000";
    } else {
        tempBid = maxEmpId;
    }

    const empId = generateEmpId(tempBid);
    return empId;
}

const addEmployee = async (req, res) => {
    let { name, email, joining_date, paid_leave, remaining_leave } = req.body
    let empId = await newEmployeeId()

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

    await Employees.create({ emp_id: empId, name, email, joining_date, paid_leave, remaining_leave })

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
        let empIdExits

        const validateFields = ["Emp id", 'Name', "Email", "Joining Date", "Paid Leave", "Remaining Leave",]
        let validateFieldsError;

        const processRow = async (row) => {
            const invalidFields = validateFields.filter(field => !(field in row));
            if (invalidFields.length > 0) {
                validateFieldsError = { success: false, message: `Invalid fields in CSV row: ${invalidFields.join(', ')}` };
                return validateFieldsError
            }

            const isEmailExits = await Employees.findOne({ where: { email: row?.Email } })

            const isEmpIdExits = await Employees.findOne({ where: { emp_id: row['Emp id'] } })
            if (isEmpIdExits) {
                empIdExits = { success: false, message: "Employee id is already assigned.", emp_id: row['Emp id'] }
                return empIdExits
            }

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

                if (empIdExits && !empIdExits?.success) {
                    return empIdExits

                } else {
                    if (employees?.length) {
                        await Employees.bulkCreate(employees);
                        return { success: true, message: "Bulk employees added successfully." };
                    } else {
                        return { success: false, message: "No data found." };
                    }
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
                        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ status: HTTP_STATUS_CODE.BAD_REQUEST, success: false, message: result.message, details: result.emp_id || null });
                    }
                } catch (error) {
                    console.error('Error processing all data:', error);
                    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({ status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: "Error processing all data", error: error.message });
                }
            });
    })

}

const updateEmployee = async (req, res) => {
    let { id, email } = req.body

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
        attributes: {
            exclude: ['deletedAt', 'updatedAt'],
        },
        order: [['createdAt', 'DESC']],
    })

    return res.status(HTTP_STATUS_CODE.OK).json({ status: HTTP_STATUS_CODE.OK, success: true, message: "Employee list loaded successfully.", data: employees });
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