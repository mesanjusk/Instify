const mongoose = require('mongoose');

const WhatsAppSessionSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    lastMessageTime: {
      type: Date,
      default: null,
    },
    sessionActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.WhatsAppSession || mongoose.model('WhatsAppSession', WhatsAppSessionSchema);
