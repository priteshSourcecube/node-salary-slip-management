const cloudinary = require("cloudinary").v2;
const { extractPublicId } = require('cloudinary-build-url')
const { HTTP_STATUS_CODE } = require("../helper/constants.helper")
const path = require("path")
const { v4: uuidv4 } = require('uuid');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});
const fileUpload = async (file) => {
    try {
        const uniqueId = uuidv4();

        const fileExtension = path.extname(file.originalname);
        const base64String = Buffer.from(file.buffer).toString('base64');
        const result = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${base64String}`, {
            folder: 'HRM',
            resource_type: 'raw',
            public_id: `${uniqueId}${fileExtension}`

        });

        return result?.secure_url

    } catch (error) {
        return { status: HTTP_STATUS_CODE.INTERNAL_SERVER, success: false, message: error.message };
    }
};

const deleteImage = async (cloudinaryUrl) => {
    try {

        const publicId = extractPublicId(cloudinaryUrl)
        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Deletion result:", result);

        return { status: HTTP_STATUS_CODE.SUCCESS, success: true, message: 'Image deleted successfully' };
    } catch (error) {
        console.log(error);
        return { status: HTTP_STATUS_CODE.ERROR, success: false, message: error.message };
    }
};

module.exports = {
    fileUpload,
    deleteImage
};