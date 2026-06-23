const express = require('express');
const router = express.Router();
const multer = require('multer');
const baileysService = require('../services/baileysService');
const { clearStuckSession } = baileysService;
const Message = require('../repositories/Message');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

function sse(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// SSE stream: QR + status
router.get('/session/:instituteId/qr', (req, res) => {
  const { instituteId } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const currentStatus = baileysService.getStatus(instituteId);
  const cachedQR      = baileysService.getLastQR(instituteId);

  // Already connected — tell the client immediately
  if (currentStatus === 'connected') {
    sse(res, 'status', { status: 'connected' });
    res.end();
    return;
  }

  // QR already generated (e.g. auto-reconnect produced one) — send it straight away
  if (cachedQR) {
    sse(res, 'qr', { qr: cachedQR });
  }

  // If a session is stuck 'connecting' with no QR (started by autoReconnect with
  // empty callbacks), clear it so startSession can run fresh with our SSE callbacks.
  if ((currentStatus === 'connecting' || currentStatus === 'qr') && !cachedQR) {
    clearStuckSession(instituteId);
  }

  sse(res, 'status', { status: currentStatus === 'connected' ? 'connected' : 'connecting' });

  const heartbeat = setInterval(() => res.write(': ping\n\n'), 30000);
  req.on('close', () => clearInterval(heartbeat));

  baileysService.startSession(
    instituteId,
    (qrDataUrl) => { if (!res.writableEnded) sse(res, 'qr', { qr: qrDataUrl }); },
    (status) => {
      if (!res.writableEnded) sse(res, 'status', { status });
      if (status === 'connected') { clearInterval(heartbeat); res.end(); }
    }
  ).catch((err) => {
    if (!res.writableEnded) { sse(res, 'error', { message: err.message }); res.end(); }
    clearInterval(heartbeat);
  });
});

// Current status
router.get('/session/:instituteId/status', (req, res) => {
  const status = baileysService.getStatus(req.params.instituteId);
  res.json({ success: true, status });
});

// Last QR (polling fallback)
router.get('/session/:instituteId/last-qr', (req, res) => {
  const qr = baileysService.getLastQR(req.params.instituteId);
  if (!qr) return res.json({ success: false, message: 'No QR available' });
  res.json({ success: true, qr });
});

// Disconnect
router.delete('/session/:instituteId', async (req, res) => {
  try {
    await baileysService.disconnectSession(req.params.instituteId);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Send single message
router.post('/send-text', async (req, res) => {
  try {
    const { instituteId, to, message } = req.body;
    if (!instituteId || !to || !message)
      return res.status(400).json({ success: false, message: 'instituteId, to, message required' });
    await baileysService.sendText(instituteId, to, message);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Send media (image / video / document)
router.post('/send-media', upload.single('file'), async (req, res) => {
  try {
    const { instituteId, to, caption } = req.body;
    if (!req.file || !instituteId || !to)
      return res.status(400).json({ success: false, message: 'file, instituteId, to required' });
    const result = await baileysService.sendMedia(
      instituteId, to,
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      caption || ''
    );
    res.json({ success: true, ...result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Bulk broadcast
router.post('/send-bulk', async (req, res) => {
  try {
    const { instituteId, numbers, message } = req.body;
    if (!instituteId || !Array.isArray(numbers) || !message)
      return res.status(400).json({ success: false, message: 'instituteId, numbers[], message required' });

    // Strip non-digits and validate 7–15 digit phone numbers
    const phoneRegex = /^\d{7,15}$/;
    const validNumbers = numbers.map(n => String(n).replace(/\D/g, '')).filter(n => phoneRegex.test(n));
    if (validNumbers.length === 0)
      return res.status(400).json({ success: false, message: 'No valid phone numbers provided (must be 7–15 digits)' });

    const results = await baileysService.sendBulk(instituteId, validNumbers, message);
    const sent = results.filter(r => r.success).length;
    res.json({ success: true, sent, failed: results.length - sent, skipped: numbers.length - validNumbers.length, results });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Chat list — unique contacts with last message + unread count (paginated)
router.get('/chats/:instituteId', async (req, res) => {
  try {
    const { instituteId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const chats = await Message.aggregate([
      { $match: { institute_uuid: instituteId } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$jid',
          lastMessage: { $first: '$message' },
          lastTime: { $first: '$createdAt' },
          fromMe: { $first: '$fromMe' },
          name: { $max: '$pushName' },
          unread: {
            $sum: { $cond: [{ $and: [{ $eq: ['$fromMe', false] }, { $ne: ['$status', 'read'] }] }, 1, 0] },
          },
        },
      },
      { $match: { $expr: { $and: [
        { $gte: [{ $strLenCP: '$_id' }, 7] },
        { $lte: [{ $strLenCP: '$_id' }, 15] },
      ] } } },
      { $sort: { lastTime: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);
    res.json({ success: true, result: chats, page, limit });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Messages for a specific contact
router.get('/messages/:instituteId/:jid', async (req, res) => {
  try {
    const { instituteId, jid } = req.params;
    const msgs = await Message.find({ institute_uuid: instituteId, jid })
      .sort({ createdAt: 1 })
      .limit(200);
    // Mark incoming as read
    await Message.updateMany(
      { institute_uuid: instituteId, jid, fromMe: false, status: { $ne: 'read' } },
      { $set: { status: 'read' } }
    );
    res.json({ success: true, result: msgs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Delete all messages for a contact
router.delete('/messages/:instituteId/:jid', async (req, res) => {
  try {
    await Message.deleteMany({ institute_uuid: req.params.instituteId, jid: req.params.jid });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Clear all chat history for an institute
router.delete('/chats/:instituteId', async (req, res) => {
  try {
    const result = await Message.deleteMany({ institute_uuid: req.params.instituteId });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
