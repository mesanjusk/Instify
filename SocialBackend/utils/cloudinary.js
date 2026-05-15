const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadImage(file) {
  if (!file) {
    throw new Error('Image file is required');
  }

  const source = file.path || file;
  const result = await cloudinary.uploader.upload(source, {
    resource_type: 'image',
  });

  if (!result?.secure_url) {
    throw new Error('Cloudinary upload failed to return secure_url');
  }

  return result.secure_url;
}

module.exports = {
  cloudinary,
  uploadImage,
};
