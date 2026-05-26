const { post } = require('./metaApiService');

const getPhoneNumberId = () => {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID;
  if (!id) throw new Error('WHATSAPP_PHONE_NUMBER_ID is not configured');
  return id;
};

function normalizeToE164(mobile) {
  const digits = mobile.replace(/\D/g, '');
  return digits.startsWith('91') ? digits : `91${digits}`;
}

async function sendText(to, message) {
  const phoneNumberId = getPhoneNumberId();
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: message },
  };
  return post(`${phoneNumberId}/messages`, payload);
}

async function sendImage(to, imageUrl, caption = '') {
  const phoneNumberId = getPhoneNumberId();
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'image',
    image: { link: imageUrl, caption },
  };
  return post(`${phoneNumberId}/messages`, payload);
}

// Sends OTP using the approved 'instify_otp' template
async function sendOtpTemplate(to, otp) {
  const phoneNumberId = getPhoneNumberId();
  const payload = {
    messaging_product: 'whatsapp',
    to: normalizeToE164(to),
    type: 'template',
    template: {
      name: 'instify_otp',
      language: { code: 'en_US' },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: String(otp) }],
        },
      ],
    },
  };
  return post(`${phoneNumberId}/messages`, payload);
}

async function sendOtpMessage(mobile, otp) {
  return sendOtpTemplate(mobile, otp);
}

async function sendWelcomeMessage(mobile, name, centerCode) {
  const to = normalizeToE164(mobile);
  const message =
    `🎉 *Welcome to Instify, ${name}!*\n\n` +
    `Your institute registration is complete. You are on a 14-day free trial.\n\n` +
    `*Login Credentials:*\n` +
    `• Username (Center Code): *${centerCode}*\n` +
    `• Password: *${centerCode}*\n\n` +
    `Please login and change your password immediately.\n\n– Team Instify`;
  return sendText(to, message);
}

async function sendWelcomeBackMessage(mobile, name, centerCode) {
  const to = normalizeToE164(mobile);
  const message =
    `✅ *Password Reset Successful!*\n\n` +
    `Hi ${name}, your Instify password has been updated successfully.\n\n` +
    `*Login Credentials:*\n` +
    `• Username (Center Code): *${centerCode}*\n` +
    `• Password: As you just set\n\n` +
    `Welcome back! If you did not request this change, contact support immediately.\n\n– Team Instify`;
  return sendText(to, message);
}

module.exports = {
  sendText,
  sendImage,
  sendOtpTemplate,
  sendOtpMessage,
  sendWelcomeMessage,
  sendWelcomeBackMessage,
};
