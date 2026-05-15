/**
 * Baileys WhatsApp Service
 * Manages per-institute QR-scan WhatsApp sessions.
 * Uses dynamic import because @whiskeysockets/baileys is ESM-only.
 */

const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

const SESSION_DIR = path.join(__dirname, '../baileys_sessions');
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

/** Map<instituteId, { sock, status, qrDataUrl }> */
const sessions = new Map();

/** Load Baileys ESM modules once */
async function getBaileys() {
  const mod = await import('@whiskeysockets/baileys');
  return {
    makeWASocket: mod.default,
    useMultiFileAuthState: mod.useMultiFileAuthState,
    DisconnectReason: mod.DisconnectReason,
  };
}

/**
 * Start or reconnect a Baileys session.
 * @param {string} instituteId
 * @param {(qrDataUrl: string) => void} onQR
 * @param {(status: string) => void} onStatus
 */
async function startSession(instituteId, onQR, onStatus) {
  const { makeWASocket, useMultiFileAuthState, DisconnectReason } = await getBaileys();

  const sessionPath = path.join(SESSION_DIR, instituteId);
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: ['Instify', 'Chrome', '1.0.0'],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
  });

  sessions.set(instituteId, { sock, status: 'connecting', qrDataUrl: null });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    const entry = sessions.get(instituteId);

    if (qr) {
      try {
        const dataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
        if (entry) entry.qrDataUrl = dataUrl;
        onQR && onQR(dataUrl);
      } catch (err) {
        console.error('[Baileys] QR generation error:', err.message);
      }
      if (entry) entry.status = 'qr';
      onStatus && onStatus('qr');
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;

      if (entry) entry.status = loggedOut ? 'logged_out' : 'disconnected';
      onStatus && onStatus(loggedOut ? 'logged_out' : 'disconnected');

      if (!loggedOut) {
        console.log(`[Baileys] Reconnecting ${instituteId} in 5s…`);
        setTimeout(() => startSession(instituteId, onQR, onStatus), 5000);
      }
    }

    if (connection === 'open') {
      if (entry) {
        entry.status = 'connected';
        entry.qrDataUrl = null;
      }
      onStatus && onStatus('connected');
      console.log(`[Baileys] ${instituteId} connected`);
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

/**
 * Send a text message.
 * @param {string} instituteId
 * @param {string} to  Phone number with country code (no +)
 * @param {string} message
 */
async function sendText(instituteId, to, message) {
  const session = sessions.get(instituteId);
  if (!session || session.status !== 'connected') {
    throw new Error('WhatsApp session not connected for this institute');
  }
  const jid = to.replace(/\D/g, '') + '@s.whatsapp.net';
  await session.sock.sendMessage(jid, { text: message });
}

/**
 * Send bulk messages with a 1.5s delay between each.
 * @param {string} instituteId
 * @param {string[]} numbers
 * @param {string} message
 * @returns {Promise<Array<{number, success, error?}>>}
 */
async function sendBulk(instituteId, numbers, message) {
  const results = [];
  for (const number of numbers) {
    try {
      await sendText(instituteId, number, message);
      results.push({ number, success: true });
    } catch (err) {
      results.push({ number, success: false, error: err.message });
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  return results;
}

/**
 * Disconnect and delete session files.
 * @param {string} instituteId
 */
async function disconnectSession(instituteId) {
  const session = sessions.get(instituteId);
  if (session?.sock) {
    try { await session.sock.logout(); } catch (_) { /* ignore */ }
  }
  sessions.delete(instituteId);

  const sessionPath = path.join(SESSION_DIR, instituteId);
  if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });
}

/**
 * @param {string} instituteId
 * @returns {'not_started'|'connecting'|'qr'|'connected'|'disconnected'|'logged_out'}
 */
function getStatus(instituteId) {
  return sessions.get(instituteId)?.status ?? 'not_started';
}

/** Get the last generated QR data URL for polling fallback. */
function getLastQR(instituteId) {
  return sessions.get(instituteId)?.qrDataUrl ?? null;
}

module.exports = { startSession, sendText, sendBulk, disconnectSession, getStatus, getLastQR };
