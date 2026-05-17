/**
 * Baileys WhatsApp Service
 * Sessions survive server restarts/deploys by persisting auth files to MongoDB.
 * On startup, autoReconnectSessions() restores and reconnects all active sessions.
 */

const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');
const QRCode = require('qrcode');
const { v2: cloudinary } = require('cloudinary');
const Message = require('../repositories/Message');
const WASession = require('../models/WASession');
const LidMapping = require('../models/LidMapping');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const rateLimiter = new Map();

function checkRateLimit(instituteId) {
  const now = Date.now();
  const bucket = rateLimiter.get(instituteId) || { count: 0, resetAt: now + 60000 };
  if (now > bucket.resetAt) { bucket.count = 0; bucket.resetAt = now + 60000; }
  if (bucket.count >= 20) throw new Error('Rate limit reached — max 20 messages per minute.');
  bucket.count++;
  rateLimiter.set(instituteId, bucket);
}

function randomDelay(min = 2000, max = 4000) {
  return new Promise(r => setTimeout(r, min + Math.random() * (max - min)));
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
    downloadContentFromMessage: mod.downloadContentFromMessage,
  };
}

function normaliseJid(jid = '') {
  return jid.split('@')[0].replace(/\D/g, '');
}

/** Resolve the actual WhatsApp JID for a phone number via onWhatsApp().
 *  If WhatsApp returns a @lid JID, persist the LID→phone mapping so incoming
 *  replies from that LID can be correlated to the actual phone number. */
async function resolveJid(sock, phone, instituteId) {
  try {
    const [result] = await sock.onWhatsApp(phone + '@s.whatsapp.net');
    if (result?.exists && result.jid) {
      if (result.jid.endsWith('@lid') && instituteId) {
        const lid = result.jid.split('@')[0].replace(/\D/g, '');
        LidMapping.updateOne(
          { institute_uuid: instituteId, lid },
          { $set: { phone } },
          { upsert: true }
        ).catch(() => {});
      }
      return result.jid;
    }
  } catch (e) {
    console.error('[Baileys] onWhatsApp resolve error:', e.message);
  }
  return phone + '@s.whatsapp.net';
}

/** Given a raw JID (may be @lid), return the actual phone digits to store. */
async function resolveStoragePhone(instituteId, jid) {
  if (jid.endsWith('@lid')) {
    const lid = jid.split('@')[0].replace(/\D/g, '');
    const map = await LidMapping.findOne({ institute_uuid: instituteId, lid }).lean().catch(() => null);
    if (map?.phone) return map.phone;
    return lid; // fallback: store under LID digits
  }
  return normaliseJid(jid);
}

/* ── Session persistence helpers ────────────────────────────── */

async function backupSession(instituteId, sessionPath) {
  try {
    if (!fs.existsSync(sessionPath)) return;
    const files = {};
    for (const file of fs.readdirSync(sessionPath)) {
      try { files[file] = fs.readFileSync(path.join(sessionPath, file), 'utf8'); } catch { /* skip */ }
    }
    if (Object.keys(files).length === 0) return;
    await WASession.updateOne(
      { institute_uuid: instituteId },
      { $set: { files, active: true } },
      { upsert: true }
    );
  } catch (e) {
    console.error('[Baileys] Session backup error:', e.message);
  }
}

async function restoreSession(instituteId, sessionPath) {
  try {
    const doc = await WASession.findOne({ institute_uuid: instituteId });
    if (!doc?.files || Object.keys(doc.files).length === 0) return false;
    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });
    for (const [fileName, content] of Object.entries(doc.files)) {
      fs.writeFileSync(path.join(sessionPath, fileName), content, 'utf8');
    }
    console.log(`[Baileys] Session restored for ${instituteId}`);
    return true;
  } catch (e) {
    console.error('[Baileys] Session restore error:', e.message);
    return false;
  }
}

/* ── Media helpers ──────────────────────────────────────────── */

async function uploadToCloudinary(buffer, mimeType, instituteId) {
  return new Promise((resolve, reject) => {
    const resourceType = mimeType?.startsWith('image/') ? 'image'
      : mimeType?.startsWith('video/') ? 'video' : 'raw';
    const stream = cloudinary.uploader.upload_stream(
      { folder: `instify/messages/${instituteId}`, resource_type: resourceType },
      (err, result) => err ? reject(err) : resolve(result)
    );
    Readable.from(buffer).pipe(stream);
  });
}

async function downloadMedia(mediaMsg, mediaType, downloadFn) {
  if (!downloadFn) return null;
  try {
    const stream = await downloadFn(mediaMsg, mediaType);
    let buf = Buffer.from([]);
    for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
    return buf;
  } catch (e) {
    console.error(`[Baileys] media download (${mediaType}) error:`, e.message);
    return null;
  }
}

async function saveMessage(institute_uuid, jid, msg, fromMe, downloadFn, pushName = '') {
  try {
    const number = normaliseJid(jid);
    if (!number) return;   // non-phone JIDs (status@broadcast, newsletter, etc.) produce empty string
    const base = {
      institute_uuid, jid: number, fromMe,
      sender: fromMe ? institute_uuid : number,
      receiver: fromMe ? number : institute_uuid,
      pushName: fromMe ? '' : (pushName || ''),
    };

    if (msg?.imageMessage) {
      let mediaUrl = '';
      const buf = await downloadMedia(msg.imageMessage, 'image', downloadFn);
      if (buf) {
        try { const r = await uploadToCloudinary(buf, 'image/jpeg', institute_uuid); mediaUrl = r.secure_url; }
        catch (e) { console.error('[Baileys] Cloudinary image error:', e.message); }
      }
      await Message.create({ ...base, message: msg.imageMessage.caption || '', type: 'image', mediaUrl, mimeType: 'image/jpeg' });
      return;
    }

    if (msg?.documentMessage) {
      const mimeType = msg.documentMessage.mimetype || 'application/octet-stream';
      const fileName = msg.documentMessage.fileName || 'document';
      let mediaUrl = '';
      const buf = await downloadMedia(msg.documentMessage, 'document', downloadFn);
      if (buf) {
        try { const r = await uploadToCloudinary(buf, mimeType, institute_uuid); mediaUrl = r.secure_url; }
        catch (e) { console.error('[Baileys] Cloudinary doc error:', e.message); }
      }
      await Message.create({ ...base, message: msg.documentMessage.caption || '', type: 'document', mediaUrl, mimeType, fileName });
      return;
    }

    if (msg?.videoMessage) {
      const mimeType = msg.videoMessage.mimetype || 'video/mp4';
      let mediaUrl = '';
      const buf = await downloadMedia(msg.videoMessage, 'video', downloadFn);
      if (buf) {
        try { const r = await uploadToCloudinary(buf, mimeType, institute_uuid); mediaUrl = r.secure_url; }
        catch (e) { console.error('[Baileys] Cloudinary video error:', e.message); }
      }
      await Message.create({ ...base, message: msg.videoMessage.caption || '', type: 'video', mediaUrl, mimeType });
      return;
    }

    if (msg?.audioMessage) {
      await Message.create({ ...base, message: '', type: 'audio', mimeType: msg.audioMessage.mimetype || 'audio/ogg' });
      return;
    }

    const text = msg?.conversation || msg?.extendedTextMessage?.text || '';
    if (!text) return;
    await Message.create({ ...base, message: text, type: 'text' });
  } catch (err) {
    console.error('[Baileys] saveMessage error:', err.message);
  }
}

/* ── Core session management ────────────────────────────────── */

async function startSession(instituteId, onQR, onStatus) {
  // Prevent duplicate in-progress sessions
  const existing = sessions.get(instituteId);
  if (existing && (existing.status === 'connecting' || existing.status === 'connected')) {
    console.log(`[Baileys] Session ${instituteId} already ${existing.status}, skipping`);
    return;
  }

  const { makeWASocket, useMultiFileAuthState, DisconnectReason, downloadContentFromMessage } = await getBaileys();

  const sessionPath = path.join(SESSION_DIR, instituteId);
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

  // Restore auth files from MongoDB if local copy is missing (e.g. after deploy)
  const hasLocalFiles = fs.readdirSync(sessionPath).length > 0;
  if (!hasLocalFiles) {
    await restoreSession(instituteId, sessionPath);
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  // Wrap saveCreds: persist to filesystem AND backup to MongoDB
  const saveCredsWithBackup = async () => {
    await saveCreds();
    await backupSession(instituteId, sessionPath);
  };

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
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

      if (loggedOut) {
        // Clear MongoDB backup so we don't auto-reconnect a logged-out session
        await WASession.updateOne({ institute_uuid: instituteId }, { $set: { active: false, files: {} } });
      } else {
        console.log(`[Baileys] Reconnecting ${instituteId} in 5s…`);
        setTimeout(() => startSession(instituteId, onQR, onStatus), 5000);
      }
    }

    if (connection === 'open') {
      if (entry) { entry.status = 'connected'; entry.qrDataUrl = null; }
      onStatus && onStatus('connected');
      console.log(`[Baileys] ${instituteId} connected`);
      // Ensure MongoDB has latest backup on successful connect
      await backupSession(instituteId, sessionPath);
    }
  });

  sock.ev.on('creds.update', saveCredsWithBackup);

  /* When Baileys syncs the full contact list on connect, build LID→phone
     mappings for ALL contacts so first-inbound messages resolve correctly. */
  function syncContactMappings(contacts) {
    for (const c of (contacts || [])) {
      try {
        const id = c.id || '';
        const lid = c.lid || '';
        // Format 1: id = "919399140933@s.whatsapp.net", lid = "369585299480@lid"
        if (id.endsWith('@s.whatsapp.net') && lid) {
          const phone = normaliseJid(id);
          const lidDigits = lid.split('@')[0].replace(/\D/g, '');
          if (phone && lidDigits) {
            LidMapping.updateOne(
              { institute_uuid: instituteId, lid: lidDigits },
              { $set: { phone } },
              { upsert: true }
            ).catch(() => {});
          }
        }
        // Format 2: id = "369585299480@lid", separate phone field
        if (id.endsWith('@lid') && c.phone) {
          const lidDigits = id.split('@')[0].replace(/\D/g, '');
          const phone = c.phone.replace(/\D/g, '');
          if (lidDigits && phone) {
            LidMapping.updateOne(
              { institute_uuid: instituteId, lid: lidDigits },
              { $set: { phone } },
              { upsert: true }
            ).catch(() => {});
          }
        }
      } catch { /* skip bad contact entries */ }
    }
  }

  sock.ev.on('contacts.set', ({ contacts }) => syncContactMappings(contacts));
  sock.ev.on('contacts.update', (contacts) => syncContactMappings(contacts));

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const m of messages) {
      if (!m.message) continue;
      const jid = m.key.remoteJid;
      if (!jid) continue;
      if (jid.endsWith('@g.us'))         continue;   // group chats
      if (jid.endsWith('@broadcast'))    continue;   // status@broadcast updates
      if (jid.endsWith('@newsletter'))   continue;   // WhatsApp newsletters
      if (jid.endsWith('@call'))         continue;   // call events
      if (!normaliseJid(jid))           continue;   // any other non-phone JID
      // Resolve LID → actual phone so reply threads under actual number
      const storagePhone = await resolveStoragePhone(instituteId, jid);
      await saveMessage(instituteId, storagePhone + '@s.whatsapp.net', m.message, m.key.fromMe, downloadContentFromMessage, m.pushName || '');
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
  // resolveJid saves LID→phone mapping if WhatsApp returns @lid
  const jid = await resolveJid(session.sock, number, instituteId);
  await session.sock.sendMessage(jid, { text: message });
  // Always store sent message under the actual phone number, not the LID
  await saveMessage(instituteId, number + '@s.whatsapp.net', { conversation: message }, true);
}

async function sendMedia(instituteId, to, buffer, mimeType, fileName, caption) {
  const session = sessions.get(instituteId);
  if (!session || session.status !== 'connected') {
    throw new Error('WhatsApp session not connected');
  }
  checkRateLimit(instituteId);
  const number = to.replace(/\D/g, '');
  const jid = await resolveJid(session.sock, number, instituteId);

  let msgObj;
  if (mimeType.startsWith('image/')) {
    msgObj = { image: buffer, caption: caption || '' };
  } else if (mimeType.startsWith('video/')) {
    msgObj = { video: buffer, caption: caption || '' };
  } else {
    msgObj = { document: buffer, mimetype: mimeType, fileName: fileName || 'file', caption: caption || '' };
  }

  await session.sock.sendMessage(jid, msgObj);

  let mediaUrl = '';
  try {
    const r = await uploadToCloudinary(buffer, mimeType, instituteId);
    mediaUrl = r.secure_url;
  } catch (e) { console.error('[Baileys] Cloudinary outgoing error:', e.message); }

  const type = mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : 'document';
  await Message.create({
    institute_uuid: instituteId, jid: number, fromMe: true,
    sender: instituteId, receiver: number,
    message: caption || '', type, mediaUrl, mimeType, fileName: fileName || '',
  });

  return { mediaUrl };
}

async function sendBulk(instituteId, numbers, message) {
  const results = [];
  for (const number of numbers) {
    try {
      await sendText(instituteId, number, message);
      results.push({ number, success: true });
    } catch (err) {
      results.push({ number, success: false, error: err.message });
      if (err.message.includes('Rate limit')) await new Promise(r => setTimeout(r, 62000));
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

  // Remove local files
  const sessionPath = path.join(SESSION_DIR, instituteId);
  if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });

  // Mark inactive in MongoDB so auto-reconnect skips this institute
  try {
    await WASession.updateOne(
      { institute_uuid: instituteId },
      { $set: { active: false, files: {} } }
    );
  } catch { /* ignore */ }
}

/**
 * Called once after MongoDB connects.
 * Restores session files from MongoDB and reconnects all active sessions
 * without requiring users to re-scan a QR code.
 */
async function autoReconnectSessions() {
  try {
    const active = await WASession.find({ active: true }, 'institute_uuid').lean();
    if (active.length === 0) {
      console.log('[Baileys] No sessions to auto-reconnect');
      return;
    }
    console.log(`[Baileys] Auto-reconnecting ${active.length} session(s)…`);
    for (const { institute_uuid } of active) {
      try {
        await startSession(
          institute_uuid,
          () => {}, // suppress QR output during auto-reconnect
          (status) => {
            if (status === 'connected') console.log(`✅ [Baileys] ${institute_uuid} auto-reconnected`);
            else if (status === 'logged_out') console.log(`⚠️ [Baileys] ${institute_uuid} session expired — re-scan needed`);
          }
        );
        await new Promise(r => setTimeout(r, 1000)); // stagger reconnects
      } catch (e) {
        console.error(`[Baileys] Auto-reconnect ${institute_uuid}: ${e.message}`);
      }
    }
  } catch (e) {
    console.error('[Baileys] autoReconnectSessions error:', e.message);
  }
}

function getStatus(instituteId) {
  return sessions.get(instituteId)?.status ?? 'not_started';
}

function getLastQR(instituteId) {
  return sessions.get(instituteId)?.qrDataUrl ?? null;
}

module.exports = {
  startSession, sendText, sendMedia, sendBulk,
  disconnectSession, getStatus, getLastQR,
  autoReconnectSessions,
};
