const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const feesSchema = new mongoose.Schema({
  uuid: { type: String, default: uuidv4, unique: true },
  institute_uuid: { type: String, required: true },
  student_uuid: { type: String, required: true },
  admission_uuid: { type: String },

  fees: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  feePaid: { type: Number, default: 0 },
  paidBy: String,
  balance: { type: Number, required: true },

  emi: { type: Number, default: 0 },
  installment: { type: String },
  installmentPlan: [
    {
      installmentNo: Number,
      dueDate: String,
      amount: Number
    }
  ],
}, { timestamps: true });

feesSchema.index({ uuid: 1 }, { unique: true });
feesSchema.index({ institute_uuid: 1 });
feesSchema.index({ student_uuid: 1 });

module.exports = mongoose.model('Fees', feesSchema);
