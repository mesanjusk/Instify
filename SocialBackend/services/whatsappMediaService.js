const { uploadImage } = require('../utils/cloudinary');
const whatsappService = require('./whatsappService');

async function sendImageFromUpload(to, file, caption = '') {
  const mediaUrl = await uploadImage(file);
  const response = await whatsappService.sendImage(to, mediaUrl, caption);

  return {
    mediaUrl,
    response,
  };
}

module.exports = {
  sendImageFromUpload,
};
