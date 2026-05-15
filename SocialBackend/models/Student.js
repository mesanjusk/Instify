const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const studentSchema = new mongoose.Schema({
  uuid: { type: String, default: uuidv4, unique: true },
  institute_uuid: { type: String, required: true },

  firstName: { type: String, required: true },
  middleName: String,
  lastName: String,
  dob: Date,
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },

  mobileSelf: { type: String },
  mobileSelfWhatsapp: { type: Boolean, default: false },
  mobileParent: { type: String },
  mobileParentWhatsapp: { type: Boolean, default: false },
  address: String,
  education: String,
  schoolName: String,

  createdBy: String,
}, { timestamps: true });

// Virtual for full name
studentSchema.virtual('fullName').get(function () {
  return `${this.firstName || ''} ${this.middleName || ''} ${this.lastName || ''}`.trim();
});

// Indexes for faster lookups
studentSchema.index({ uuid: 1 }, { unique: true });
studentSchema.index({ institute_uuid: 1 });

module.exports = mongoose.model('Student', studentSchema);
