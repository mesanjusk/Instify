const mongoose = require('mongoose');

const otpStoreSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // TTL: auto-delete after 10 minutes
  },
});

module.exports = mongoose.model('OtpStore', otpStoreSchema);
