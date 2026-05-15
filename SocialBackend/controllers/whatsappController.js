const Message = require('../repositories/Message');
const WhatsAppSession = require('../repositories/WhatsAppSession');
const whatsappService = require('../services/whatsappService');
const whatsappMediaService = require('../services/whatsappMediaService');

async function sendTextMessage(req, res) {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ message: 'to and message are required' });
    }

    const data = await whatsappService.sendText(to, message);

    await Message.create({
      sender: process.env.PHONE_NUMBER_ID || 'system',
      receiver: to,
      message,
      type: 'text',
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.response?.data || error.message });
  }
}

async function sendImageMessage(req, res) {
  try {
    const { to, image, caption } = req.body;

    if (!to || !image) {
      return res.status(400).json({ message: 'to and image are required' });
    }

    const { mediaUrl, response } = await whatsappMediaService.sendImageFromUpload(to, image, caption);

    await Message.create({
      sender: process.env.PHONE_NUMBER_ID || 'system',
      receiver: to,
      message: caption || '',
      type: 'image',
      mediaUrl,
    });

    return res.status(200).json({ success: true, mediaUrl, data: response });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.response?.data || error.message });
  }
}

async function webhookVerify(req, res) {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const verifyToken = process.env.VERIFY_TOKEN || process.env.META_WEBHOOK_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === verifyToken) {
      return res.status(200).send(challenge);
    }

    return res.status(403).send('Verification failed');
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function webhookReceive(req, res) {
  try {
    const entries = req.body?.entry || [];

    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        const value = change?.value || {};
        const incomingMessages = value?.messages || [];

        for (const incoming of incomingMessages) {
          const from = incoming?.from || '';
          const type = incoming?.type === 'image' ? 'image' : 'text';
          const textBody = incoming?.text?.body || '';
          const mediaUrl = incoming?.image?.id || '';

          await Message.create({
            sender: from,
            receiver: value?.metadata?.display_phone_number || process.env.PHONE_NUMBER_ID || 'system',
            message: textBody,
            type,
            mediaUrl,
          });

          await WhatsAppSession.findOneAndUpdate(
            { phoneNumber: from },
            {
              phoneNumber: from,
              lastMessageTime: new Date(),
              sessionActive: true,
            },
            { upsert: true, new: true }
          );

          console.log('Incoming WhatsApp message:', incoming);
        }
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook receive error:', error.message);
    return res.status(200).json({ success: false, message: error.message });
  }
}

module.exports = {
  sendTextMessage,
  sendImageMessage,
  webhookVerify,
  webhookReceive,
};
