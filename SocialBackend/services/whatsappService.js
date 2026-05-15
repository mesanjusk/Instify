const { post } = require('./metaApiService');

async function sendText(to, message) {
  if (!process.env.PHONE_NUMBER_ID) {
    throw new Error('PHONE_NUMBER_ID is not configured');
  }

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: {
      body: message,
    },
  };

  return post(`${process.env.PHONE_NUMBER_ID}/messages`, payload);
}

async function sendImage(to, imageUrl, caption = '') {
  if (!process.env.PHONE_NUMBER_ID) {
    throw new Error('PHONE_NUMBER_ID is not configured');
  }

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'image',
    image: {
      link: imageUrl,
      caption,
    },
  };

  return post(`${process.env.PHONE_NUMBER_ID}/messages`, payload);
}

module.exports = {
  sendText,
  sendImage,
};
