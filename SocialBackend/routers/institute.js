const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const Institute = require('../models/institute');
// Use correct case-sensitive path for the User model
const User = require('../models/User');

router.post('/signup', async (req, res) => {
  try {
    const {
      institute_title,       // => name
      institute_type,        // => type
      center_code,              // => password & login
      mobile_number,            // => email substitute
      center_head_name,         // => admin name
      theme_color = '6fa8dc',
      plan_type = 'trial'
    } = req.body;

    if (!institute_title || !institute_type || !center_code || !mobile_number || !center_head_name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await Institute.findOne({ name: institute_title });
    if (existing) return res.json({ message: 'exist' });

    const existingEmail = await User.findOne({ email: `${mobile_number}@signup.bt` });
    if (existingEmail) return res.json({ message: 'duplicate_call_number' });

    const hashedPassword = await bcrypt.hash(center_code, 10);
    const uuid = uuidv4();
    const trialExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Step 1: Create Admin User
    const adminUser = new User({
      name: center_head_name,
      email: `${mobile_number}@signup.bt`,
      passwordHash: hashedPassword,
      role: 'admin',
      institute_id: uuid, // backward-compatible field
      instituteId: uuid,     // new standard field
      isTrial: true,
      trialExpiresAt: trialExpiry,
      theme: {
        primaryColor: theme_color
      }
    });

    await adminUser.save();

    // Step 2: Create Institute
    const newInstitute = new Institute({
      uuid,
      name: institute_title,
      type: institute_type,
      contactEmail: `${mobile_number}@signup.bt`,
      createdBy: adminUser._id,
      trialExpiresAt: trialExpiry,
      theme: {
        logo: '',
        favicon: '',
        color: theme_color
      },
      whiteLabel: false,
      status: 'trial',
      modulesEnabled: [],
      users: [adminUser._id]
    });

    await newInstitute.save();

    res.json({
      message: 'success',
      institute_title,
      institute_id: uuid,
      center_code,
      theme_color
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

module.exports = router;
