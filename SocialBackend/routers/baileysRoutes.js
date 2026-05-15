/**
 * Baileys WhatsApp Routes
 * GET  /api/baileys/session/:instituteId/qr      — SSE stream: events qr | status | error
 * GET  /api/baileys/session/:instituteId/status  — current status
 * GET  /api/baileys/session/:instituteId/last-qr — last QR data URL (for polling)
 * DELETE /api/baileys/session/:instituteId       — disconnect & delete session
 * POST /api/baileys/send-text                    — send single message
 * POST /api/baileys/send-bulk                    — broadcast to list of numbers
 */

const express = require('express');
const router = express.Router();
const baileysService = require('../services/baileysService');

/** SSE helper */
function sse(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/**
 * Server-Sent Events stream for QR code and status updates.
 * Frontend: new EventSource('/api/baileys/session/<id>/qr')
 */
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
    (status) => {
      sse(res, 'status', { status });
      if (status === 'connected') res.end();
    }
  ).catch((err) => {
    sse(res, 'error', { message: err.message });
    res.end();
  });

  // Keep connection alive with heartbeat every 30s
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 30000);
  req.on('close', () => clearInterval(heartbeat));
});

/** Get current session status */
router.get('/session/:instituteId/status', (req, res) => {
  const { instituteId } = req.params;
  const status = baileysService.getStatus(instituteId);
  res.json({ success: true, status });
});

/** Get last QR image (polling fallback) */
router.get('/session/:instituteId/last-qr', (req, res) => {
  const { instituteId } = req.params;
  const qr = baileysService.getLastQR(instituteId);
  if (!qr) return res.json({ success: false, message: 'No QR available' });
  res.json({ success: true, qr });
});

/** Disconnect and delete session */
router.delete('/session/:instituteId', async (req, res) => {
  try {
    await baileysService.disconnectSession(req.params.instituteId);
    res.json({ success: true, message: 'Session disconnected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** Send a single text message */
router.post('/send-text', async (req, res) => {
  try {
    const { instituteId, to, message } = req.body;
    if (!instituteId || !to || !message) {
      return res.status(400).json({ success: false, message: 'instituteId, to, and message are required' });
    }
    await baileysService.sendText(instituteId, to, message);
    res.json({ success: true, message: 'Message sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** Broadcast message to multiple numbers */
router.post('/send-bulk', async (req, res) => {
  try {
    const { instituteId, numbers, message } = req.body;
    if (!instituteId || !Array.isArray(numbers) || !message) {
      return res.status(400).json({ success: false, message: 'instituteId, numbers[], and message are required' });
    }
    const results = await baileysService.sendBulk(instituteId, numbers, message);
    const sent = results.filter(r => r.success).length;
    res.json({ success: true, sent, failed: results.length - sent, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
