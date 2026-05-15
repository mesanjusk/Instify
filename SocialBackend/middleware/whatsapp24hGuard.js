const WhatsAppSession = require('../repositories/WhatsAppSession');

const WINDOW_IN_MS = 24 * 60 * 60 * 1000;

async function whatsapp24hGuard(req, res, next) {
  try {
    const to = req.body?.to;

    if (!to) {
      return res.status(400).json({ message: 'Recipient (to) is required' });
    }

    const session = await WhatsAppSession.findOne({ phoneNumber: to }).lean();

    if (!session || !session.lastMessageTime) {
      return res.status(403).json({ message: '24-hour session not found. Use template message outside 24-hour window.' });
    }

    const elapsed = Date.now() - new Date(session.lastMessageTime).getTime();
    if (!session.sessionActive || elapsed > WINDOW_IN_MS) {
      return res.status(403).json({ message: 'Cannot send free-form message outside 24-hour window.' });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = whatsapp24hGuard;
