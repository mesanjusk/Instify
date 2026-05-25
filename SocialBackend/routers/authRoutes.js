const express = require('express');
const { v4: uuid } = require('uuid');
const User = require('../models/User');
const jwt = require("jsonwebtoken");
const Institute = require('../models/institute');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { generateMagicToken, verifyMagicToken, buildMagicLink } = require('../utils/magicLink');
const baileysService = require('../services/baileysService');
const { authenticate, roleGuard } = require('../middleware/roleGuard');

require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

const router = express.Router();
const otpStore = {};

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

    user.last_login_at = new Date();
    await user.save();

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

    const user = await User.findOne({ login_username: username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, user.login_password);
    if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });

    const institute = await Institute.findOne({ institute_uuid: user.institute_uuid });
    if (!institute) return res.status(404).json({ message: 'Institute not found' });

    user.last_login_at = new Date();
    await user.save();

    // 🔑 Generate JWT token
    const token = jwt.sign(
      {
        user_id: user._id,
        user_uuid: user.user_uuid,
        role: user.role,
        institute_uuid: user.institute_uuid,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: 'success',
      token, 
      user_id: user._id,
      user_name: user.name,
      user_role: user.role,
      login_username: user.login_username,
      institute_id: institute._id,
      institute_uuid: institute.institute_uuid,
      institute_name: institute.institute_title,
      theme_color: institute.theme?.color || '6fa8dc',
      last_password_change: user.last_password_change || null
    });
  } catch (err) {
    console.error('User login error:', err);
    res.status(500).json({ message: 'server_error' });
  }
});


// ✅ Forgot password
router.post('/institute/forgot-password', async (req, res) => {
  try {
    const { center_code, mobile } = req.body;

    const user = await User.findOne({
      login_username: center_code,
      mobile
    });

    if (!user) return res.status(404).json({ message: 'No matching user found' });

    const otp = generateOTP();

    otpStore[mobile] = {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      user_id: user._id
    };

    // OTP is intentionally not returned in the response.
    // In production, deliver it via SMS/WhatsApp. Log only in development.
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] OTP for ${mobile}: ${otp}`);
    }

    res.status(200).json({
      message: 'verified',
      user_id: user._id,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'server_error' });
  }
});

// ✅ Reset password
router.post('/institute/reset-password/:id', async (req, res) => {
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

    user.login_password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'reset_success' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'server_error' });
  }
});

// ✅ Register new user under institute
router.post('/register',
  [
    body('name').notEmpty().withMessage('name is required'),
    body('mobile').notEmpty().withMessage('mobile is required'),
    body('password').isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
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

// ✅ Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(user ? 200 : 404).json(user ? { success: true, result: user } : { success: false, message: 'User not found' });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ success: false, message: 'Error fetching user', error: err.message });
  }
});

// ✅ Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ✅ Update user
router.put('/:id', async (req, res) => {
  const { name, mobile, role, password } = req.body;

  try {
    const update = { name, mobile, role };
    if (password) {
      update.login_password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: req.params.id },
      update,
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ success: true, message: 'User updated successfully', result: updatedUser });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ success: false, message: 'Error updating user', error: err.message });
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

    user.last_login_at = new Date();
    await user.save();

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
