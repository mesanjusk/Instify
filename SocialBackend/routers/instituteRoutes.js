const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const jwt = require("jsonwebtoken");
const Institute = require('../models/institute');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const whatsappService = require('../services/whatsappService');
const { authenticate, roleGuard } = require('../middleware/roleGuard');

require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;


// POST /api/institute/signup
router.post('/signup', async (req, res) => {
  try {
    const {
      institute_title,
      institute_type,
      institute_call_number,
      theme_color = '6fa8dc',
      plan_type = 'trial',
      storage_mode = 'cloud_only'
    } = req.body;

    const center_code = (req.body.center_code || '').trim();
    const center_head_name = (req.body.center_head_name || '').trim();

    if (
      !institute_title ||
      !institute_type ||
      !center_code ||
      !institute_call_number ||
      !center_head_name
    ) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const email = `${institute_call_number}@signup.bt`.toLowerCase();

    // Check for existing user (center_code or email)
    const existingUser = await User.findOne({
      $or: [{ email }, { login_username: center_code }]
    });
    if (existingUser) {
      return res.json({ message: 'exist' });
    }

    // Check for existing mobile in User
    const existingMobile = await User.findOne({ mobile: String(institute_call_number) });
    if (existingMobile) {
      return res.json({ message: 'duplicate_call_number' });
    }

    // Check for existing Institute (center_code or mobile)
    const existingInstitute = await Institute.findOne({
      $or: [
        { center_code },
        { institute_call_number: String(institute_call_number) },
        { contactEmail: email }
      ]
    });
    if (existingInstitute) {
      return res.json({ message: 'exist' });
    }

    const trialExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const instituteUUID = uuidv4();

    // Step 1: Create Institute
    const newInstitute = new Institute({
      institute_uuid: instituteUUID,
      institute_title,
      institute_type,
      center_code,
      institute_call_number,
      center_head_name,
      contactEmail: email,
      trialExpiresAt: trialExpiry,
      plan_type,
      status: 'trial',
      theme: {
        color: theme_color,
        logo: '',
        favicon: ''
      },
      whiteLabel: false,
      modulesEnabled: [],
      users: [],
      storage_mode: ['cloud_only', 'local_only', 'hybrid'].includes(storage_mode) ? storage_mode : 'cloud_only'
    });

    await newInstitute.save();

    const hashedPassword = await bcrypt.hash(center_code, 10);

    // Step 2: Create Admin User
    let newUser;
    try {
      newUser = new User({
        user_uuid: uuidv4(),
        name: center_head_name,
        email,
        mobile: String(institute_call_number),
        login_username: center_code,
        login_password: hashedPassword,
        role: 'admin',
        institute_uuid: instituteUUID,
        isTrial: true,
        trialExpiresAt: trialExpiry,
        theme: {
          primaryColor: theme_color,
          logoUrl: ''
        }
      });
      await newUser.save();
    } catch (userErr) {
      // Roll back the Institute if user creation fails
      await Institute.findOneAndDelete({ institute_uuid: instituteUUID });
      throw userErr;
    }

    // Create JWT token
    const token = jwt.sign(
      {
        user_uuid: newUser.user_uuid,
        role: newUser.role,
        institute_uuid: newUser.institute_uuid
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Step 3: Link user in Institute
    newInstitute.users = [newUser._id];
    newInstitute.createdBy = newUser._id;
    await newInstitute.save();

    // Send welcome message via WhatsApp (non-blocking)
    try {
      await whatsappService.sendWelcomeMessage(institute_call_number, center_head_name, center_code);
    } catch (waErr) {
      console.error('WhatsApp welcome send failed:', waErr.message);
    }

    res.json({
      message: 'success',
      institute_title: newInstitute.institute_title,
      institute_uuid: newInstitute.institute_uuid,
      institute_id: newInstitute._id,
      owner_id: newUser._id,
      center_code,
      theme_color,
      trialExpiresAt: trialExpiry,
      storage_mode: newInstitute.storage_mode,
      token
    });

  } catch (err) {
    // Handle MongoDB duplicate key errors gracefully
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      if (field.includes('mobile') || field.includes('call_number')) {
        return res.json({ message: 'duplicate_call_number' });
      }
      return res.json({ message: 'exist' });
    }
    console.error('Signup Error:', err);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// GET all institutes — super_admin / owner only
router.get('/GetOrganizList', authenticate, roleGuard('super_admin', 'owner', 'admin'), async (req, res) => {
  try {
    const institutes = await Institute.find({})
      .select('institute_uuid institute_title institute_type center_code institute_call_number plan_type status modulesEnabled trialExpiresAt createdAt contactEmail center_head_name')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, result: institutes });
  } catch (err) {
    console.error('GetOrganizList error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT manage institute plan/modules — super_admin only
router.put('/manage/:uuid', authenticate, roleGuard('super_admin'), async (req, res) => {
  try {
    const { plan_type, status, modulesEnabled, trialExpiresAt, storage_mode } = req.body;
    const allowed = {};
    if (plan_type !== undefined) allowed.plan_type = plan_type;
    if (status !== undefined) allowed.status = status;
    if (modulesEnabled !== undefined) allowed.modulesEnabled = modulesEnabled;
    if (trialExpiresAt !== undefined) allowed.trialExpiresAt = new Date(trialExpiresAt);
    if (storage_mode !== undefined && ['cloud_only', 'local_only', 'hybrid'].includes(storage_mode)) {
      allowed.storage_mode = storage_mode;
    }

    const updated = await Institute.findOneAndUpdate(
      { institute_uuid: req.params.uuid },
      { $set: allowed },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Institute not found' });
    res.json({ success: true, result: updated });
  } catch (err) {
    console.error('manage institute error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE institute — super_admin only
router.delete('/:uuid', authenticate, roleGuard('super_admin'), async (req, res) => {
  try {
    const inst = await Institute.findOneAndDelete({ institute_uuid: req.params.uuid });
    if (!inst) return res.status(404).json({ success: false, message: 'Institute not found' });
    await User.deleteMany({ institute_uuid: req.params.uuid });
    res.json({ success: true, message: 'Institute and all users deleted' });
  } catch (err) {
    console.error('delete institute error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET institute by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await Institute.findOne({ institute_uuid: req.params.id });
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE institute profile
// UPDATE institute profile with theme branding
router.put('/update/:id', async (req, res) => {
  try {
    const {
      institute_title,
      institute_type,
      center_code,
      institute_call_number,
      center_head_name,
      address,
      email,
      theme_color,
      institute_logo,
      theme_logo,
      theme_favicon,
    } = req.body;

    const updateData = {
      institute_title,
      institute_type,
      center_code,
      institute_call_number,
      center_head_name,
      address,
      contactEmail: email,
      institute_logo: institute_logo || theme_logo || '',
      theme: {
        color: theme_color || '6fa8dc',
        logo: theme_logo || institute_logo || '',
        favicon: theme_favicon || '',
      },
    };

    const updated = await Institute.findOneAndUpdate(
  { institute_uuid: req.params.id },
  updateData,
  { new: true }
);

    res.json({ message: 'Updated successfully', updated });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

router.post('/send-message', async (req, res) => {
  const { mobile, otp, message, type, userName } = req.body;

  // Accept otp directly, or extract 6-digit code from legacy message field
  const otpValue = otp || (message && message.match(/\b(\d{6})\b/)?.[1]);

  if (!mobile || !otpValue || !type || !userName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    let userId = null;
    if (type === 'forgot') {
      const rawMobile = mobile.replace(/^91/, '');
      const user = await User.findOne({
        mobile: rawMobile,
        login_username: userName
      });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      userId = user._id;
    }

    let whatsappSent = true;
    let whatsappError = null;
    try {
      await whatsappService.sendOtpTemplate(mobile, otpValue);
    } catch (waError) {
      const metaError = waError.response?.data || waError.message;
      console.error('WhatsApp send failed:', JSON.stringify(metaError));
      whatsappSent = false;
      whatsappError = metaError;
    }

    res.status(200).json({ success: true, userId, whatsappSent, whatsappError });
  } catch (error) {
    console.error('send-message error:', error.message);
    res.status(500).json({ error: 'Failed to process request' });
  }
});


module.exports = router;
