const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer-storage-cloudinary for Images
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'civicsight-ai-reports/images', // Separate folder for images
    allowed_formats: ['jpg', 'png', 'jpeg'],
    // resource_type defaults to 'image'
  },
});

// FIX: Configure multer-storage-cloudinary for Audio
const audioStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'civicsight-ai-reports/audio', // Separate folder for audio
      // CRITICAL FIX: Use 'raw' resource type to accept generic files like mp4/m4a audio
      resource_type: 'raw', 
      allowed_formats: ['m4a', 'mp3', 'wav', 'mp4'], // Allow common audio formats
    },
});

module.exports = {
  cloudinary,
  storage, // Image storage
  audioStorage, // Audio storage
};