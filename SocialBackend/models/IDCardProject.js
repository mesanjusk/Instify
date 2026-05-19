const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const idCardProjectSchema = new mongoose.Schema({
  project_uuid: { type: String, default: uuidv4, unique: true },
  institute_uuid: { type: String, required: true },
  title: { type: String, required: true },
  academic_year: { type: String, default: '' },
  template_design_uuid: { type: String, default: '' },
  principal_signature_url: { type: String, default: '' },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  createdBy: { type: String },
}, { timestamps: true });

idCardProjectSchema.index({ institute_uuid: 1 });

module.exports = mongoose.model('IDCardProject', idCardProjectSchema);
