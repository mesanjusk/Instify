const whatsappService = require('../services/whatsappService');

async function autoReply(req, res, next) {
  try {
    const entries = req.body?.entry || [];

    for (const entry of entries) {
      const changes = entry?.changes || [];

      for (const change of changes) {
        const messages = change?.value?.messages || [];

        for (const incoming of messages) {
          const to = incoming?.from;
          if (!to) {
            continue;
          }

          await whatsappService.sendText(
            to,
            'Thank you for your message. We have received it and will reply shortly.'
          );
        }
      }
    }

    return next();
  } catch (error) {
    return next();
  }
}

module.exports = autoReply;
