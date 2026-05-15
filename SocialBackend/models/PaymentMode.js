const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const paymentModeSchema = new mongoose.Schema({
  uuid: {
    type: String,
    default: uuidv4,
    required: true,
    unique: true,
  },
  mode: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('PaymentMode', paymentModeSchema);
