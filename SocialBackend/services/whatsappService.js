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

function normalizeToE164(mobile) {
  const digits = mobile.replace(/\D/g, '');
  return digits.startsWith('91') ? digits : `91${digits}`;
}

async function sendOtpMessage(mobile, otp) {
  const to = normalizeToE164(mobile);
  const message =
    `*Instify OTP Verification*\n\n` +
    `Your verification code is: *${otp}*\n\n` +
    `This code expires in 5 minutes. Do not share it with anyone.\n\n– Team Instify`;
  return sendText(to, message);
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
  sendOtpMessage,
  sendWelcomeMessage,
  sendWelcomeBackMessage,
};
