const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const payslipSchema = new mongoose.Schema({
  employee_uuid: String,
  employeeName: String,
  designation: String,
  basic: Number,
  hra: Number,
  earnings: Number,
  deductions: Number,
  gross: Number,
  net: Number,
  workingDays: { type: Number, default: 26 },
  presentDays: { type: Number, default: 26 },
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paidOn: Date,
}, { _id: false });

const payrollRunSchema = new mongoose.Schema({
  run_uuid: { type: String, default: uuidv4, unique: true },
  institute_uuid: { type: String, required: true, index: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  payslips: [payslipSchema],
  totalGross: { type: Number, default: 0 },
  totalNet: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'processed', 'paid'], default: 'draft' },
  processedBy: String,
}, { timestamps: true });

module.exports = mongoose.model('PayrollRun', payrollRunSchema);
