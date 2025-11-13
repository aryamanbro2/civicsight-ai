const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer-storage-cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'civicsight-ai-reports', // A folder name in your Cloudinary account
    allowed_formats: ['jpg', 'png', 'jpeg'],
    // transformation: [{ width: 1024, height: 1024, crop: 'limit' }] // Optional: resize images
  },
});

module.exports = {
  cloudinary,
  storage,
};