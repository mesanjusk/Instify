const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const jwt = require("jsonwebtoken");
const Institute = require('../models/institute');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const whatsappService = require('../services/whatsappService');

require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;


// POST /api/institute/signup
router.post('/signup', async (req, res) => {
  try {
    const {
      institute_title,
      institute_type,
      center_code,
      institute_call_number,
      center_head_name,
      theme_color = '6fa8dc',
      plan_type = 'trial'
    } = req.body;

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

    // Check if user with same email or center code already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { login_username: center_code }]
    });

    if (existingUser) {
      return res.json({ message: 'exist' });
    }

    // Optional: check if mobile number is already registered
    const existingMobile = await User.findOne({ mobile: String(institute_call_number) });
    if (existingMobile) {
      return res.json({ message: 'duplicate_call_number' });
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
      users: []
    });

    await newInstitute.save();

    const hashedPassword = await bcrypt.hash(center_code, 10);

   // Step 2: Create Admin User
const newUser = new User({
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

// 🔐 Create JWT token
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

// ✅ Send welcome message with credentials via WhatsApp
try {
  await whatsappService.sendWelcomeMessage(institute_call_number, center_head_name, center_code);
} catch (waErr) {
  console.error('WhatsApp welcome send failed:', waErr.message);
}

// ✅ Return response with token
res.json({
  message: 'success',
  institute_title: newInstitute.institute_title,
  institute_uuid: newInstitute.institute_uuid,
  institute_id: newInstitute._id,
  owner_id: newUser._id,
  center_code,
  theme_color,
  trialExpiresAt: trialExpiry,
  token
});


  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ message: 'Server error during signup' });
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
  const { mobile, otp, type, userName } = req.body;

  if (!mobile || !otp || !type || !userName) {
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
    try {
      await whatsappService.sendOtpTemplate(mobile, otp);
    } catch (waError) {
      console.error('WhatsApp send failed:', waError.message);
      whatsappSent = false;
    }

    res.status(200).json({ success: true, userId, whatsappSent });
  } catch (error) {
    console.error('send-message error:', error.message);
    res.status(500).json({ error: 'Failed to process request' });
  }
});


module.exports = router;
