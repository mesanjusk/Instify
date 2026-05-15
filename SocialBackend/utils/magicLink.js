/**
 * Magic Link Utility
 * Generates and verifies time-limited JWT tokens for WhatsApp one-click login.
 * Tokens are short-lived and role-scoped.
 */

const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;

/**
 * Generate a magic link token for a user.
 * @param {{ userId, role, institute_uuid, username }} payload
 * @param {string} [expiresIn='48h'] — teachers get 48h, students can get longer
 */
function generateMagicToken(payload, expiresIn = '48h') {
  if (!SECRET) throw new Error('JWT_SECRET not configured');
  return jwt.sign(
    { ...payload, type: 'magic' },
    SECRET,
    { expiresIn }
  );
}

/**
 * Verify a magic link token.
 * Throws if expired or invalid.
 * @param {string} token
 * @returns {object} decoded payload
 */
function verifyMagicToken(token) {
  if (!SECRET) throw new Error('JWT_SECRET not configured');
  const decoded = jwt.verify(token, SECRET);
  if (decoded.type !== 'magic') throw new Error('Invalid token type');
  return decoded;
}

/**
 * Build the full magic link URL.
 * @param {string} token
 * @returns {string}
 */
function buildMagicLink(token) {
  const baseUrl = process.env.FRONTEND_URL || 'https://socialfront.vercel.app';
  return `${baseUrl}/access/${token}`;
}

module.exports = { generateMagicToken, verifyMagicToken, buildMagicLink };
