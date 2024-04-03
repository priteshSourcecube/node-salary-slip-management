const path = require("path");
const ejs = require("ejs");
const fs = require("fs");
const sendEmail = require("./EmailSender");
const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer');

const forgotPasswordMail = async (options) => {
    const { otp, email } = options

    const templatePath = path.join(__dirname, "../public/emailTemplates/forgotPassword.ejs")
    const data = await ejs.renderFile(templatePath, { otp });

    await sendEmail({
        email,
        subject: 'Reset Password',
        message: data
    })
}
const salarySlip = async (options) => {
    const { payslip_id, emp_id, salary, working_days, leave, gross_pay, deduction, net_pay, employee } = options

    const templatePath = path.join(__dirname, "../public/emailTemplates/salarySlip.ejs")
    const data = await ejs.renderFile(templatePath, { payslip_id, emp_id, salary, working_days, leave, gross_pay, deduction, net_pay, name: employee.name, paid_leave: employee.paid_leave, remaining_leave: employee.remaining_leave });

    await sendEmail({
        email,
        subject: 'Salary Slip',
        message: data
    })
}


async function renderEjs(templatePath, data) {
    const template = fs.readFileSync(templatePath, "utf-8");
    const renderedHtml = ejs.render(template, data);
    return renderedHtml;
}

const salarySlipPDfMail = async (options) => {
    const { payslip_id, emp_id, salary, working_days, leave, gross_pay, deduction, net_pay, employee } = options
    const content = {
        filename: path.join(
            __dirname,
            "../public/pdf/salary.ejs"
        ),
        data: {
            payslip_id,
            emp_id,
            salary,
            working_days,
            leave,
            gross_pay,
            deduction,
            net_pay,
            name: employee.name,
            paid_leave: employee.paid_leave,
            remaining_leave: employee.remaining_leave,
            email: employee.email
        },
    }

    async function convertEJStoHTMl() {

        const html = renderEjs(
            content.filename,
            content.data
        );
        return html;
    }

    let htmlSting = await convertEJStoHTMl();

    const browser = await puppeteer.launch({
        headless: "false",
        args: ["--no-sandbox"],
    });
    const page = await browser.newPage();

    await page.setContent(htmlSting, { waitUntil: "networkidle2" });

    await page.emulateMediaType("screen");


    const transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASS
        }
    });

    return new Promise(async (resolve, reject) => {
        const mailOptions = {
            from: process.env.SMTP_MAIL,
            to: employee.email,
            subject: "Salary Slip",
            text: 'Please find the attached PDF file.',
            attachments: [
                {
                    filename: 'salary_slip.pdf',
                    content: await page.pdf({ format: 'A4', displayHeaderFooter: true })
                }
            ]
        };
        transporter.sendMail(mailOptions, async (error, info) => {
            await browser.close();
            if (error) {
                resolve(`Error: ${error.message}  to:${mailOptions.to}`);
            } else {
                console.log('Email sent:', info.response);
                resolve(`Mail send successfully to : ${mailOptions.to}`);
            }
        });
    });
}
module.exports = { forgotPasswordMail, salarySlip, salarySlipPDfMail }