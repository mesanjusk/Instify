const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const whiteLabelPartnerSchema = new mongoose.Schema({
  partner_uuid: {
    type: String,
    default: () => uuidv4(),
    unique: true
  },

  name: {
    type: String,
    required: true
  },

  domain: {
    type: String,
    required: true,
    unique: true
  }, // e.g., portal.school.com or brand.instify.app

  theme: {
    color: { type: String, default: '6fa8dc' },
    darkColor: { type: String, default: '#1F2937' },
    accentColor: { type: String, default: '#22C55E' },
    logo: { type: String, default: '' },
    favicon: { type: String, default: '' },
    font: { type: String, default: 'Inter' }
  },

  supportEmail: {
    type: String,
    default: ''
  },

  brandingUrl: {
    type: String,
    default: ''
  },

  status: {
    type: String,
    enum: ['trial', 'active', 'suspended'],
    default: 'active'
  },

  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  institutes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute'
  }],

  notes: {
    type: String,
    default: ''
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure fast domain matching
whiteLabelPartnerSchema.index({ domain: 1 }, { unique: true });

module.exports = mongoose.model('WhiteLabelPartner', whiteLabelPartnerSchema);
