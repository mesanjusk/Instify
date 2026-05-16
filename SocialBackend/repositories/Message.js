const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    institute_uuid: { type: String, required: true, index: true },
    jid: { type: String, required: true, index: true },
    waId: { type: String },
    fromMe: { type: Boolean, default: false },
    sender: { type: String, default: '' },
    receiver: { type: String, default: '' },
    message: { type: String, default: '', trim: true },
    type: { type: String, enum: ['text', 'image'], default: 'text' },
    mediaUrl: { type: String, default: '', trim: true },
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  },
  { timestamps: true }
);

MessageSchema.index({ institute_uuid: 1, jid: 1, createdAt: -1 });

module.exports = mongoose.models.Message || mongoose.model('Message', MessageSchema);
