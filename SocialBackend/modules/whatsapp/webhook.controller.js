const { WhatsAppIntegration, WhatsAppMessageLog } = require('./whatsapp.model');
const whatsappService = require('./whatsapp.service');

async function verifyWebhook(req, res) {
  if (!process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return res.status(500).json({ success: false, message: 'META_WEBHOOK_VERIFY_TOKEN is not configured' });
  }

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.status(403).json({ success: false, message: 'Webhook verification failed' });
}

async function processWebhook(req, res) {
  try {
    const entries = req.body?.entry || [];

    for (const entry of entries) {
      for (const change of entry?.changes || []) {
        const value = change?.value || {};
        const phoneNumberId = value?.metadata?.phone_number_id;
        if (!phoneNumberId) continue;

        const integration = await WhatsAppIntegration.findOne({ phoneNumberId, status: 'connected' });
        if (!integration) continue;

        const messages = value?.messages || [];
        for (const msg of messages) {
          const type = msg.type === 'image' || msg.type === 'video' || msg.type === 'document' ? msg.type : msg.type || 'text';
          const textBody = msg?.text?.body || msg?.image?.caption || msg?.document?.caption || msg?.video?.caption || '';
          const existing = await WhatsAppMessageLog.findOne({ integrationId: integration._id, metaMessageId: msg.id || '' }).lean();
          if (!existing) {
            await WhatsAppMessageLog.create({
              centerId: integration.centerId,
              integrationId: integration._id,
              to: value?.metadata?.display_phone_number || '',
              from: msg.from || '',
              direction: 'incoming',
              messageType: type,
              status: 'incoming',
              metaMessageId: msg.id || `${msg.from}-${msg.timestamp}`,
              message: textBody,
              timestamp: msg.timestamp ? new Date(Number(msg.timestamp) * 1000) : new Date(),
              rawPayload: msg,
            });
          }

          const autoReply = await whatsappService.resolveAutoReply(integration.centerId, textBody);
          if (autoReply) {
            if (autoReply.replyMode === 'template' && autoReply.templateName) {
              await whatsappService.sendTemplateMessage(integration.centerId, msg.from, autoReply.templateName, [], integration._id, autoReply.templateLanguage || 'en_US');
            } else if (autoReply.replyText) {
              await whatsappService.sendTextMessage(integration.centerId, msg.from, autoReply.replyText, integration._id);
            }
          }
        }

        for (const statusEvent of value?.statuses || []) {
          await WhatsAppMessageLog.findOneAndUpdate(
            { integrationId: integration._id, metaMessageId: statusEvent.id || '' },
            {
              $set: {
                centerId: integration.centerId,
                integrationId: integration._id,
                to: statusEvent.recipient_id || '',
                status: statusEvent.status || 'sent',
                timestamp: statusEvent.timestamp ? new Date(Number(statusEvent.timestamp) * 1000) : new Date(),
                rawPayload: statusEvent,
              },
              $setOnInsert: {
                direction: 'outgoing',
                messageType: 'text',
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  verifyWebhook,
  processWebhook,
};
