const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const idCardStudentSchema = new mongoose.Schema({
  idcard_uuid: { type: String, default: uuidv4, unique: true },
  project_uuid: { type: String, required: true },
  institute_uuid: { type: String, required: true },
  class_name: { type: String, default: '' },
  section: { type: String, default: '' },
  roll_number: { type: String, default: '' },
  student_name: { type: String, required: true },
  extra_fields: { type: mongoose.Schema.Types.Mixed, default: {} },
  photo_url: { type: String, default: '' },
  photo_public_id: { type: String, default: '' },
  bg_removed_url: { type: String, default: '' },
  use_bg_removed: { type: Boolean, default: false },
  photo_source: { type: String, enum: ['bulk_upload', 'teacher', 'webcam', 'student', ''], default: '' },
  card_status: { type: String, enum: ['pending', 'not_available', 'student_submitted', 'approved'], default: 'pending' },
  magic_token: { type: String, default: '' },
  magic_token_expires: { type: Date },
  student_name_override: { type: String, default: '' },
  student_photo_url: { type: String, default: '' },
  submitted_at: { type: Date },
  approved_by: { type: String },
  approved_at: { type: Date },
}, { timestamps: true });

idCardStudentSchema.index({ project_uuid: 1 });
idCardStudentSchema.index({ magic_token: 1 });

module.exports = mongoose.model('IDCardStudent', idCardStudentSchema);
