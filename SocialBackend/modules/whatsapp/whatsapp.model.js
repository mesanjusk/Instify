const mongoose = require('mongoose');

const autoReplyRuleSchema = new mongoose.Schema(
  {
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: 'Institute',
    },
    keyword: { type: String, required: true, trim: true },
    matchType: {
      type: String,
      enum: ['exact', 'contains', 'startsWith'],
      default: 'contains',
    },
    replyMode: {
      type: String,
      enum: ['text', 'template'],
      default: 'text',
    },
    replyText: { type: String, default: '' },
    templateName: { type: String, default: '' },
    templateLanguage: { type: String, default: 'en_US' },
    active: { type: Boolean, default: true },
    delaySeconds: { type: Number, default: 0, min: 0, max: 86400 },
  },
  { timestamps: true }
);

const whatsappIntegrationSchema = new mongoose.Schema(
  {
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: 'Institute',
    },
    connectionType: {
      type: String,
      enum: ['EMBEDDED', 'MANUAL'],
      required: true,
    },
    wabaId: { type: String, default: '' },
    phoneNumberId: { type: String, default: '' },
    businessId: { type: String, default: '' },
    displayName: { type: String, default: '' },
    accessToken: { type: String, required: true },
    status: {
      type: String,
      enum: ['connected', 'disconnected', 'expired'],
      default: 'disconnected',
    },
    webhookSubscribed: {
      type: Boolean,
      default: false,
    },
    lastSyncedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

whatsappIntegrationSchema.index({ centerId: 1, phoneNumberId: 1 }, { unique: true, sparse: true });

const whatsappMessageLogSchema = new mongoose.Schema(
  {
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: 'Institute',
    },
    integrationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'WhatsAppIntegration',
    },
    to: { type: String, default: '' },
    from: { type: String, default: '' },
    messageType: {
      type: String,
      enum: ['text', 'template', 'media', 'image', 'video', 'document', 'audio', 'sticker'],
      default: 'text',
    },
    direction: {
      type: String,
      enum: ['outgoing', 'incoming'],
      default: 'outgoing',
    },
    status: { type: String, default: 'queued' },
    metaMessageId: { type: String, default: '' },
    message: { type: String, default: '' },
    mediaUrl: { type: String, default: '' },
    templateName: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
    rawPayload: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

whatsappMessageLogSchema.index({ centerId: 1, timestamp: -1 });
whatsappMessageLogSchema.index({ integrationId: 1, metaMessageId: 1 });

const WhatsAppIntegration = mongoose.model('WhatsAppIntegration', whatsappIntegrationSchema);
const WhatsAppMessageLog = mongoose.model('WhatsAppMessageLog', whatsappMessageLogSchema);
const WhatsAppAutoReplyRule = mongoose.model('WhatsAppAutoReplyRule', autoReplyRuleSchema);

module.exports = {
  WhatsAppIntegration,
  WhatsAppMessageLog,
  WhatsAppAutoReplyRule,
};
