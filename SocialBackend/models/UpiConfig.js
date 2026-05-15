const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const upiConfigSchema = new mongoose.Schema({
  uuid: { type: String, default: uuidv4, unique: true },
  institute_uuid: { type: String, required: true, unique: true },
  upi_id: { type: String, required: true, trim: true },
  merchant_name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: 'Fee Payment' },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('UpiConfig', upiConfigSchema);
