const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  user_uuid: {
    type: String,
    default: uuidv4,
    unique: true
  },

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    unique: true,
    sparse: true
  },

  mobile: {
    type: String,
    unique: true,
    sparse: true
  },

  login_username: {
    type: String,
    required: true,
    unique: true
  },

  login_password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ['superadmin', 'owner', 'admin', 'staff', 'student', 'guest', 'parent'],
    default: 'admin'
  },

  /**
   * ✅ Correct: Store the Institute's UUID as a string for faster matching.
   * This is not an ObjectId reference, so `.populate()` should never be used.
   * All joins with the Institute collection should be done using `findOne({ institute_uuid })`.
   */
  institute_uuid: {
    type: String,
    required: true,
    index: true // ✅ Add index for faster join queries
  },

  last_login_at: {
    type: Date,
    default: null
  },

  last_activity_at: {
    type: Date,
    default: null
  },

  last_password_change: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

// ✅ Additional helpful indexes
userSchema.index({ login_username: 1 });
userSchema.index({ mobile: 1 });
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
