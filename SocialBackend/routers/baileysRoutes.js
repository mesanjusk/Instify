const express = require('express');
const router = express.Router();
const baileysService = require('../services/baileysService');
const Message = require('../repositories/Message');

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
  sse(res, 'status', { status: 'connecting' });
  baileysService.startSession(
    instituteId,
    (qrDataUrl) => sse(res, 'qr', { qr: qrDataUrl }),
    (status) => { sse(res, 'status', { status }); if (status === 'connected') res.end(); }
  ).catch((err) => { sse(res, 'error', { message: err.message }); res.end(); });
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 30000);
  req.on('close', () => clearInterval(heartbeat));
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

// Bulk broadcast
router.post('/send-bulk', async (req, res) => {
  try {
    const { instituteId, numbers, message } = req.body;
    if (!instituteId || !Array.isArray(numbers) || !message)
      return res.status(400).json({ success: false, message: 'instituteId, numbers[], message required' });
    const results = await baileysService.sendBulk(instituteId, numbers, message);
    const sent = results.filter(r => r.success).length;
    res.json({ success: true, sent, failed: results.length - sent, results });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Chat list — unique contacts with last message + unread count
router.get('/chats/:instituteId', async (req, res) => {
  try {
    const { instituteId } = req.params;
    const chats = await Message.aggregate([
      { $match: { institute_uuid: instituteId } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$jid',
          lastMessage: { $first: '$message' },
          lastTime: { $first: '$createdAt' },
          fromMe: { $first: '$fromMe' },
          unread: {
            $sum: { $cond: [{ $and: [{ $eq: ['$fromMe', false] }, { $ne: ['$status', 'read'] }] }, 1, 0] },
          },
        },
      },
      { $sort: { lastTime: -1 } },
      { $limit: 100 },
    ]);
    res.json({ success: true, result: chats });
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

module.exports = router;
