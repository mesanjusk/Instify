const express = require('express');
const { v4: uuid } = require('uuid');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const jwt = require("jsonwebtoken");
const Institute = require('../models/institute');
const OtpStore = require('../models/OtpStore');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { generateMagicToken, verifyMagicToken, buildMagicLink } = require('../utils/magicLink');
const baileysService = require('../services/baileysService');
const { authenticate, roleGuard } = require('../middleware/roleGuard');
const whatsappService = require('../services/whatsappService');

require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

const router = express.Router();

// Stricter limiter for OTP endpoints — 3 requests per 10 minutes per IP
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many OTP requests — please wait 10 minutes before trying again' },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

//
// ✅ PUBLIC ROUTES
//

// ✅ Admin login by center code
// ✅ Admin login by center code
router.post('/institute/login',
  [
    body('center_code').notEmpty().withMessage('center_code is required'),
    body('password').notEmpty().withMessage('password is required'),
  ],
  validate,
  async (req, res) => {
  try {
    const { center_code, password } = req.body;

    const user = await User.findOne({ login_username: center_code });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Use bcrypt compare!
    const isValid = await bcrypt.compare(password, user.login_password);
    if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });

    const institute = await Institute.findOne({ institute_uuid: user.institute_uuid });
    if (!institute) return res.status(404).json({ message: 'Institute not found' });

    await User.updateOne({ _id: user._id }, { $set: { last_login_at: new Date() } });

    res.status(200).json({
      message: 'success',
      user_id: user._id,
      user_name: user.name,
      user_role: user.role,
      login_username: user.login_username,
      institute_id: institute._id,
      institute_uuid: institute.institute_uuid,
      institute_name: institute.institute_title,
      theme_color: institute.theme?.color || '6fa8dc'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'server_error' });
  }
});

// ✅ General user login with JWT
router.post('/user/login',
  [
    body('username').notEmpty().withMessage('username is required'),
    body('password').notEmpty().withMessage('password is required'),
  ],
  validate,
  async (req, res) => {
  try {
    const { username, password } = req.body;

    const trimmedUsername = username.trim();
    const user = await User.findOne({ login_username: trimmedUsername });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password.trim(), user.login_password);
    if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });

    const institute = await Institute.findOne({ institute_uuid: user.institute_uuid });
    if (!institute) return res.status(404).json({ message: 'Institute not found' });

    // Use updateOne to bypass Mongoose enum validation (safe for any role value)
    await User.updateOne({ _id: user._id }, { $set: { last_login_at: new Date() } });

    // 🔑 Generate JWT (24h) + long-lived refresh token (30d)
    const token = jwt.sign(
      {
        user_id: user._id,
        user_uuid: user.user_uuid,
        role: user.role,
        institute_uuid: user.institute_uuid,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = generateRefreshToken();
    await User.updateOne({ _id: user._id }, {
      refreshToken,
      refreshTokenExpiry: new Date(Date.now() + REFRESH_TTL_MS),
    });

    res.status(200).json({
      message: 'success',
      token,
      refreshToken,
      user_id: user._id,
      user_name: user.name,
      user_role: user.role,
      login_username: user.login_username,
      institute_id: institute._id,
      institute_uuid: institute.institute_uuid,
      institute_name: institute.institute_title,
      theme_color: institute.theme?.color || '6fa8dc',
      plan_type: institute.plan_type || 'trial',
      status: institute.status || 'trial',
      modulesEnabled: institute.modulesEnabled || [],
      trialExpiresAt: institute.trialExpiresAt || null,
      storage_mode: institute.storage_mode || 'cloud_only',
      last_password_change: user.last_password_change || null
    });
  } catch (err) {
    console.error('User login error:', err.message, err.stack);
    res.status(500).json({ message: 'server_error' });
  }
});


// ✅ Forgot password — sends OTP via WhatsApp (OTP stored in MongoDB with TTL)
router.post('/institute/forgot-password', otpLimiter, async (req, res) => {
  try {
    const { center_code, mobile } = req.body;

    if (!center_code || !mobile) {
      return res.status(400).json({ message: 'center_code and mobile are required' });
    }

    const trimmedCode = center_code.trim();
    const trimmedMobile = mobile.trim();

    const user = await User.findOne({ login_username: trimmedCode });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this center code' });
    }

    const storedMobile = String(user.mobile || '').replace(/^91/, '').trim();
    const inputMobile = trimmedMobile.replace(/^91/, '');
    if (storedMobile !== inputMobile) {
      return res.status(404).json({ message: 'Mobile number does not match our records' });
    }

    const otp = generateOTP();

    // Replace any existing OTP for this mobile, then store the new one in MongoDB
    await OtpStore.deleteMany({ mobile: trimmedMobile });
    await OtpStore.create({ mobile: trimmedMobile, otp, user_id: user._id });

    try {
      await whatsappService.sendOtpMessage(trimmedMobile, otp);
    } catch (waErr) {
      console.error('WhatsApp OTP send failed:', waErr.message);
    }

    res.status(200).json({ message: 'otp_sent', user_id: user._id });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'server_error' });
  }
});

// ✅ Verify forgot-password OTP (reads from MongoDB — survives server restarts)
router.post('/institute/verify-forgot-otp', async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ success: false, message: 'mobile and otp are required' });
    }

    const record = await OtpStore.findOne({ mobile });
    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP not found or already expired' });
    }

    if (record.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const user_id = record.user_id;
    await OtpStore.deleteOne({ _id: record._id });

    res.json({ success: true, message: 'OTP verified', user_id });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ success: false, message: 'server_error' });
  }
});

// ✅ Reset password
router.post('/institute/reset-password/:id',
  [
    body('old_password').notEmpty().withMessage('old_password is required'),
    body('new_password').isLength({ min: 8 }).withMessage('new_password must be at least 8 characters'),
  ],
  validate,
  async (req, res) => {
  try {
    const { id } = req.params;
    const { old_password, new_password } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isOldPasswordValid = await bcrypt.compare(old_password, user.login_password);
    if (!isOldPasswordValid) {
      return res.status(401).json({ message: 'Old password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await User.updateOne({ _id: user._id }, { $set: { login_password: hashedPassword, last_password_change: new Date() } });

    try {
      await whatsappService.sendWelcomeBackMessage(user.mobile, user.name, user.login_username);
    } catch (waErr) {
      console.error('WhatsApp welcome-back send failed:', waErr.message);
    }

    res.status(200).json({ message: 'reset_success' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'server_error' });
  }
  }
);

// ✅ Register new user under institute
router.post('/register',
  [
    body('name').notEmpty().withMessage('name is required'),
    body('mobile').notEmpty().withMessage('mobile is required'),
    body('password').isLength({ min: 4 }).withMessage('password must be at least 4 characters'),
    body('role').notEmpty().withMessage('role is required'),
    body('institute_uuid').notEmpty().withMessage('institute_uuid is required'),
  ],
  validate,
  async (req, res) => {
  const { name, password, mobile, role, institute_uuid } = req.body;

  if (!institute_uuid) {
    return res.status(400).json({ success: false, message: 'institute_uuid is required' });
  }

  if (!mobile || !password || !name || !role) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ mobile });

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      mobile,
      role,
      login_username: mobile,
      login_password: hashedPassword,
      user_uuid: uuid(),
      institute_uuid
    });

    await newUser.save();

    const token = jwt.sign(
      {
        user_uuid: newUser.user_uuid,
        mobile: newUser.mobile,
        role: newUser.role,
        institute_uuid: newUser.institute_uuid
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ success: true, token, user: newUser });
  } catch (err) {
    console.error('Error saving user:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ✅ Get users by institute_uuid
router.get('/GetUserList/:institute_id', authenticate, roleGuard('superadmin', 'owner', 'admin'), async (req, res) => {
  const { institute_id } = req.params;
  try {
    const users = await User.find({ institute_uuid: institute_id });
    res.json(users.length ? { success: true, result: users } : { success: false, message: 'No users found' });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Get user by ID — requires authentication
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-login_password');
    res.status(user ? 200 : 404).json(user ? { success: true, result: user } : { success: false, message: 'User not found' });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
});

// ✅ Delete user — owner or above only
router.delete('/:id', authenticate, roleGuard('super_admin', 'owner', 'admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent deleting users from a different institute (non-super_admin)
    if (req.user?.role !== 'super_admin' && user.institute_uuid !== req.user?.institute_uuid) {
      return res.status(403).json({ message: 'Cannot delete users from another institute' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ✅ Update user — owner or above only
router.put('/:id', authenticate, roleGuard('super_admin', 'owner', 'admin'), async (req, res) => {
  const { name, mobile, role, password } = req.body;

  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    // Prevent updating users from a different institute (non-super_admin)
    if (req.user?.role !== 'super_admin' && target.institute_uuid !== req.user?.institute_uuid) {
      return res.status(403).json({ success: false, message: 'Cannot update users from another institute' });
    }

    const update = { name, mobile, role };
    if (password) {
      update.login_password = await bcrypt.hash(password, 10);
      update.last_password_change = new Date();
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: req.params.id },
      update,
      { new: true }
    ).select('-login_password');

    res.status(200).json({ success: true, message: 'User updated successfully', result: updatedUser });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ success: false, message: 'Error updating user' });
  }
});

// ✅ Refresh — exchange a valid refresh token for a new JWT
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided' });

    const user = await User.findOne({
      refreshToken,
      refreshTokenExpiry: { $gt: new Date() },
    });
    if (!user) return res.status(401).json({ message: 'Invalid or expired refresh token' });

    const token = jwt.sign(
      { user_id: user._id, user_uuid: user.user_uuid, role: user.role, institute_uuid: user.institute_uuid },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Rotate refresh token on every use
    const newRefreshToken = generateRefreshToken();
    await User.updateOne({ _id: user._id }, {
      refreshToken: newRefreshToken,
      refreshTokenExpiry: new Date(Date.now() + REFRESH_TTL_MS),
    });

    res.json({ token, refreshToken: newRefreshToken });
  } catch (err) {
    console.error('Token refresh error:', err.message);
    res.status(500).json({ message: 'server_error' });
  }
});

// ─── Magic Link ────────────────────────────────────────────────────────────

/**
 * POST /api/auth/magic-link/send
 * Generates a one-click login token and sends it via WhatsApp (Baileys).
 * Body: { userId?, mobile, instituteId }
 */
router.post('/magic-link/send', async (req, res) => {
  try {
    const { userId, mobile, instituteId } = req.body;
    if (!mobile || !instituteId) {
      return res.status(400).json({ success: false, message: 'mobile and instituteId are required' });
    }

    let user = null;
    if (userId) {
      user = await User.findById(userId);
    } else {
      user = await User.findOne({ mobile, institute_uuid: instituteId });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const expiry = ['student'].includes(user.role) ? '30d' : '48h';
    const token = generateMagicToken({
      userId: user._id.toString(),
      role: user.role,
      institute_uuid: user.institute_uuid,
      username: user.login_username,
    }, expiry);

    const link = buildMagicLink(token);
    const message =
      `Hello ${user.name},\n` +
      `Your Instify account is ready.\n\n` +
      `Click to access your dashboard:\n${link}\n\n` +
      `(Link valid for ${expiry === '30d' ? '30 days' : '48 hours'})\n– Instify`;

    const to = mobile.replace(/\D/g, '');
    await baileysService.sendText(instituteId, to, message);

    res.json({ success: true, message: 'Magic link sent via WhatsApp' });
  } catch (err) {
    console.error('Magic link send error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/auth/magic-link/verify/:token
 * Validates a magic link token and returns session data for auto-login.
 */
router.get('/magic-link/verify/:token', async (req, res) => {
  try {
    const payload = verifyMagicToken(req.params.token);

    const user = await User.findById(payload.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const institute = await Institute.findOne({ institute_uuid: user.institute_uuid });
    if (!institute) return res.status(404).json({ success: false, message: 'Institute not found' });

    await User.updateOne({ _id: user._id }, { $set: { last_login_at: new Date() } });

    // Issue a full session JWT
    const sessionToken = jwt.sign(
      { user_id: user._id, user_uuid: user.user_uuid, role: user.role, institute_uuid: user.institute_uuid },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token: sessionToken,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        username: user.login_username,
      },
      institute: {
        id: institute._id,
        uuid: institute.institute_uuid,
        name: institute.institute_title,
        theme_color: institute.theme?.color || '4f46e5',
      },
    });
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    res.status(401).json({ success: false, message: expired ? 'Link has expired. Please request a new one.' : 'Invalid link.' });
  }
});

module.exports = router;
