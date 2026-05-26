const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  institute_uuid: { type: String, required: true, index: true },
  exam: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
