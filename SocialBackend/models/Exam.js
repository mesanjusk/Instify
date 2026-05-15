const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
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
