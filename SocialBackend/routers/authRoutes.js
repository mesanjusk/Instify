const express = require('express');
const { v4: uuid } = require('uuid');
const User = require('../models/User');
const jwt = require("jsonwebtoken");
const Institute = require('../models/institute');

const bcrypt = require('bcryptjs');

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
router.post('/institute/login', async (req, res) => {
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
router.post('/user/login', async (req, res) => {
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

    console.log(`OTP for ${mobile} is ${otp}`);

    res.status(200).json({
      message: 'verified',
      user_id: user._id,
      otp
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

    if (user.login_password !== old_password) {
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
router.post('/register', async (req, res) => {
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
router.get('/GetUserList/:institute_id', async (req, res) => {
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
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.params.id },
      { name, mobile, role, login_password: password },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ success: true, message: 'User updated successfully', result: updatedUser });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ success: false, message: 'Error updating user', error: err.message });
  }
});

module.exports = router;
