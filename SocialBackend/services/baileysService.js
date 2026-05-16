/**
 * Baileys WhatsApp Service
 * Manages per-institute QR-scan WhatsApp sessions.
 * Saves all messages (in/out) to MongoDB for real chat history.
 */

const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const Message = require('../repositories/Message');

const rateLimiter = new Map();

function checkRateLimit(instituteId) {
  const now = Date.now();
  const bucket = rateLimiter.get(instituteId) || { count: 0, resetAt: now + 60000 };
  if (now > bucket.resetAt) { bucket.count = 0; bucket.resetAt = now + 60000; }
  if (bucket.count >= 20) throw new Error('Rate limit reached — max 20 messages per minute.');
  bucket.count++;
  rateLimiter.set(instituteId, bucket);
}

function randomDelay(minMs = 2000, maxMs = 4000) {
  return new Promise(r => setTimeout(r, minMs + Math.random() * (maxMs - minMs)));
}

const SESSION_DIR = path.join(__dirname, '../baileys_sessions');
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

/** Map<instituteId, { sock, status, qrDataUrl }> */
const sessions = new Map();

async function getBaileys() {
  const mod = await import('@whiskeysockets/baileys');
  return {
    makeWASocket: mod.default,
    useMultiFileAuthState: mod.useMultiFileAuthState,
    DisconnectReason: mod.DisconnectReason,
  };
}

function normaliseJid(jid = '') {
  return jid.split('@')[0].replace(/\D/g, '');
}

async function saveMessage(institute_uuid, jid, msg, fromMe) {
  try {
    const text =
      msg?.conversation ||
      msg?.extendedTextMessage?.text ||
      msg?.imageMessage?.caption ||
      '';
    if (!text && !msg?.imageMessage) return;

    const number = normaliseJid(jid);
    await Message.create({
      institute_uuid,
      jid: number,
      fromMe,
      sender: fromMe ? institute_uuid : number,
      receiver: fromMe ? number : institute_uuid,
      message: text,
      type: msg?.imageMessage ? 'image' : 'text',
    });
  } catch (err) {
    console.error('[Baileys] saveMessage error:', err.message);
  }
}

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
      if (entry) { entry.status = 'connected'; entry.qrDataUrl = null; }
      onStatus && onStatus('connected');
      console.log(`[Baileys] ${instituteId} connected`);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // Save all incoming messages to DB
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const m of messages) {
      if (!m.message) continue;
      const jid = m.key.remoteJid;
      if (!jid || jid.endsWith('@g.us')) continue; // skip groups for now
      await saveMessage(instituteId, jid, m.message, m.key.fromMe);
    }
  });
}

async function sendText(instituteId, to, message) {
  const session = sessions.get(instituteId);
  if (!session || session.status !== 'connected') {
    throw new Error('WhatsApp session not connected for this institute');
  }
  checkRateLimit(instituteId);
  const number = to.replace(/\D/g, '');
  const jid = number + '@s.whatsapp.net';
  await session.sock.sendMessage(jid, { text: message });

  // Persist outgoing message
  await saveMessage(instituteId, jid, { conversation: message }, true);
}

async function sendBulk(instituteId, numbers, message) {
  const results = [];
  for (const number of numbers) {
    try {
      await sendText(instituteId, number, message);
      results.push({ number, success: true });
    } catch (err) {
      results.push({ number, success: false, error: err.message });
      if (err.message.includes('Rate limit')) {
        await new Promise(r => setTimeout(r, 62000));
      }
    }
    await randomDelay(2000, 4000);
  }
  return results;
}

async function disconnectSession(instituteId) {
  const session = sessions.get(instituteId);
  if (session?.sock) {
    try { await session.sock.logout(); } catch (_) {}
  }
  sessions.delete(instituteId);
  const sessionPath = path.join(SESSION_DIR, instituteId);
  if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });
}

function getStatus(instituteId) {
  return sessions.get(instituteId)?.status ?? 'not_started';
}

function getLastQR(instituteId) {
  return sessions.get(instituteId)?.qrDataUrl ?? null;
}

module.exports = { startSession, sendText, sendBulk, disconnectSession, getStatus, getLastQR };
