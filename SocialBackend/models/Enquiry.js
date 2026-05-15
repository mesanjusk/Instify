const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const enquirySchema = new mongoose.Schema({
  uuid: { type: String, default: uuidv4 },
  branchCode: String,
  enquiryDate: Date,
  firstName: String,
  middleName: String,
  lastName: String,
  dob: Date,
  gender: String,
  mobileSelf: String,
  mobileSelfWhatsapp: Boolean,
  mobileParent: String,
  mobileParentWhatsapp: Boolean,
  address: String,
  education: String,
  schoolName: String,
  referredBy: String,
  followUpDate: Date,
  remarks: String,
  course: String,
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', enquirySchema);
