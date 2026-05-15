const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';

function getEncryptionKey() {
  const rawKey = process.env.WHATSAPP_TOKEN_SECRET || process.env.JWT_SECRET;

  if (!rawKey) {
    throw new Error('Missing WHATSAPP_TOKEN_SECRET or JWT_SECRET for token encryption');
  }

  return crypto.createHash('sha256').update(rawKey).digest();
}

function encryptToken(token) {
  if (!token) return token;

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);

  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptToken(encryptedToken) {
  if (!encryptedToken) return encryptedToken;

  const [ivHex, encryptedHex] = encryptedToken.split(':');
  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid encrypted token format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted.toString('utf8');
}

module.exports = {
  encryptToken,
  decryptToken,
};
