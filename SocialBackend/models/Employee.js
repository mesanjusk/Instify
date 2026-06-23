const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const salaryComponentSchema = new mongoose.Schema({
  name: String,
  type: { type: String, enum: ['earning', 'deduction'] },
  amount: Number,
  isPercent: { type: Boolean, default: false },
}, { _id: false });

const employeeSchema = new mongoose.Schema({
  employee_uuid: { type: String, default: uuidv4, unique: true },
  institute_uuid: { type: String, required: true, index: true },
  user_uuid: { type: String, default: null, index: true, sparse: true },
  firstName: { type: String, required: true },
  lastName: String,
  designation: String,
  department: String,
  mobile: String,
  email: String,
  joiningDate: Date,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  salaryStructure: {
    basic: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    components: [salaryComponentSchema],
  },
  bankAccount: String,
  ifsc: String,
  pan: String,
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
