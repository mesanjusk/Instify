const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Optional: If you want followups, define the schema here:
const followUpSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  note: String,
  status: { type: String, enum: ['follow-up', 'converted', 'lost'] },
}, { _id: false });

const leadSchema = new mongoose.Schema({
  Lead_uuid: { type: String, default: uuidv4, unique: true },
  institute_uuid: { type: String, required: true },
  student_uuid: { type: String, required: true },
  course: { type: String },
  branchCode: String,
  enquiryDate: { type: Date, default: Date.now },
  followupDate: { type: Date},
  referredBy: String,
  score: { type: String, enum: ['hot', 'warm', 'cold'], default: 'warm' },
  source: { type: String, enum: ['walk_in', 'referral', 'website', 'social_media', 'phone', 'other'], default: 'other' },
  assignedTo: { type: String },
  admission_uuid: { type: String },
  followups: [followUpSchema],
  createdBy: String,
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
